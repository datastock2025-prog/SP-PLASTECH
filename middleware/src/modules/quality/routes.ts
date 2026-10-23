import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { withDrizzleTx } from '../../db.js';
import { can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import { auditLogs, qcInspections } from '../../schema/erp.js';
import * as zod from '../../schema/zod.js';
import { findOne, insertRow, listPage, softDelete, updateRow, withIdempotency, type ScopedTable } from '../../core/query.js';

const table = qcInspections as unknown as ScopedTable;
const SUBJECT = 'InspectionPlan' as const;
const COLUMNS = [
  'id', 'tenant_id', 'plant_id', 'inspection_no', 'doc_type', 'doc_id', 'item_code',
  'lot_number', 'inspected_qty', 'sample_size', 'accepted_qty', 'rejected_qty',
  'disposition', 'defects', 'inspector_id', 'notes', 'version', 'created_at', 'updated_at',
];
const LIST = {
  columns: COLUMNS,
  searchable: ['inspection_no', 'doc_id', 'item_code', 'lot_number', 'disposition'],
  sortable: ['created_at', 'updated_at', 'inspection_no', 'inspected_qty'],
  plantScoped: true,
};
const ROW = { naturalKey: 'inspection_no', plantScoped: true };
const NO_STORE = 'no-store, no-cache, must-revalidate';

const tx = <T>(a: Actor, fn: Parameters<typeof withDrizzleTx<T>>[1], readOnly = false) =>
  withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, fn, { readOnly });

/** Layer 1: Drizzle-backed REST endpoints for QC inspections (also served under legacy aliases). */
function mount(r: any, base: string) {
  r.get(base, can('read', SUBJECT), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const out = await tx(a, (db) => listPage(db, table, a, req.query, LIST), true);
    res.setHeader('Cache-Control', NO_STORE);
    res.json(out);
  }));

  r.get(`${base}/:id`, can('read', SUBJECT), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = z.string().trim().min(1).parse(req.params.id);
    const data = await tx(a, (db) => findOne(db, table, a, id, COLUMNS, ROW), true);
    res.setHeader('Cache-Control', NO_STORE);
    res.json({ data });
  }));

  r.post(base, can('create', SUBJECT), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const body = zod.insertQcInspectionSchema.parse(req.body) as Record<string, unknown>;
    const key = (req.headers as any)?.['idempotency-key'];
    const out = await tx(a, (db) =>
      withIdempotency(db, a, typeof key === 'string' ? key : undefined, req.body, async () => ({
        data: await insertRow(db, table, a, body, COLUMNS, { plantScoped: true }),
      })));
    res.setHeader('X-Invalidate', 'qc_inspections');
    if (out.replay) res.setHeader('X-Cache', 'IDEMPOTENT-HIT');
    res.status(out.replay ? 200 : 201).json(out.data);
  }));

  r.patch(`${base}/:id`, can('update', SUBJECT), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = z.string().trim().min(1).parse(req.params.id);
    const body = zod.updateQcInspectionSchema.parse(req.body) as Record<string, unknown>;
    const data = await tx(a, (db) => updateRow(db, table, a, id, body, COLUMNS, ROW));
    res.setHeader('X-Invalidate', 'qc_inspections');
    res.json({ data });
  }));

  r.delete(`${base}/:id`, can('delete', SUBJECT), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = z.string().trim().min(1).parse(req.params.id);
    await tx(a, (db) => softDelete(db, table, a, id, ROW));
    res.setHeader('X-Invalidate', 'qc_inspections');
    res.status(204).end();
  }));

  r.get(`${base}/:id/history`, can('read', SUBJECT), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = z.string().trim().min(1).parse(req.params.id);
    const data = await tx(a, async (db) => {
      const row = await findOne(db, table, a, id, ['id'], ROW);
      return db
        .select({
          id: auditLogs.id, action: auditLogs.action, changed_fields: auditLogs.changedFields,
          old_values: auditLogs.oldValues, new_values: auditLogs.newValues,
          performed_by: auditLogs.performedBy, performed_at: auditLogs.performedAt, ip_address: auditLogs.ipAddress,
        })
        .from(auditLogs)
        .where(and(eq(auditLogs.tenantId, a.tenantId), eq(auditLogs.entityType, 'qc_inspections'), eq(auditLogs.entityId, String(row.id))))
        .orderBy(desc(auditLogs.performedAt))
        .limit(50);
    }, true);
    res.json({ data });
  }));
}

export function qualityRoutes(r: any) {
  mount(r, '/qc-inspections');
  mount(r, '/qc_inspections');
  mount(r, '/ncrs');

  // Disposition transition (OCC-safe via updateRow; audit comes from the DB trigger)
  r.post('/qc-inspections/:id/disposition', can('update', SUBJECT), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = z.string().trim().min(1).parse(req.params.id);
    const body = z.object({
      disposition: z.enum(['ACCEPTED', 'REJECTED', 'QUARANTINE', 'REWORK']),
      notes: z.string().trim().optional(),
    }).parse(req.body);

    const data = await tx(a, async (db) => {
      const cur = await findOne(db, table, a, id, ['id', 'version', 'notes'], ROW);
      return updateRow(db, table, a, String(cur.id), {
        disposition: body.disposition,
        notes: body.notes ?? cur.notes,
        version: cur.version,
      }, COLUMNS, ROW);
    });
    res.setHeader('X-Invalidate', 'qc_inspections');
    res.json({ data });
  }));
}
