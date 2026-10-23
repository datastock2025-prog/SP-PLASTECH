import { z } from 'zod';
import { registerResourceRoutes } from '../../crud.js';
import { withTx } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import * as zod from '../../schema/zod.js';

export function qualityRoutes(r: any) {
  const qcConfig = {
    subject: 'InspectionPlan' as const,
    table: 'qc_inspections',
    columns: [
      'id', 'tenant_id', 'plant_id', 'inspection_no', 'doc_type', 'doc_id', 'item_code',
      'lot_number', 'inspected_qty', 'sample_size', 'accepted_qty', 'rejected_qty',
      'disposition', 'defects', 'inspector_id', 'notes', 'version', 'created_at', 'updated_at'
    ],
    searchColumns: ['inspection_no', 'doc_id', 'item_code', 'lot_number', 'disposition'],
    sortAllowlist: ['created_at', 'updated_at', 'inspection_no', 'inspected_qty'],
    createSchema: zod.insertQcInspectionSchema,
    updateSchema: zod.updateQcInspectionSchema,
  };

  registerResourceRoutes(r, '/qc-inspections', qcConfig);
  registerResourceRoutes(r, '/qc_inspections', qcConfig);
  registerResourceRoutes(r, '/ncrs', qcConfig);

  // Disposition transition endpoint
  r.post(
    '/qc-inspections/:id/disposition',
    can('update', 'InspectionPlan'),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = req.params.id;
      const body = z.object({
        disposition: z.enum(['ACCEPTED', 'REJECTED', 'QUARANTINE', 'REWORK']),
        notes: z.string().trim().optional(),
      }).parse(req.body);

      const row = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const { rows } = await c.query(
          `UPDATE qc_inspections 
           SET disposition = $1, 
               notes = COALESCE($2, notes), 
               updated_at = now(), 
               version = version + 1 
           WHERE (id::text = $3 OR inspection_no = $3) AND tenant_id = $4 
           RETURNING *`,
          [body.disposition, body.notes || null, id, a.tenantId]
        );
        if (!rows.length) throw new AppError(404, 'NOT_FOUND', 'QC inspection not found');
        return rows[0];
      });

      res.json({ data: row });
    })
  );
}
