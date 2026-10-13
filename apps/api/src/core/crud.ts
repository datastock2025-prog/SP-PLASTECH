import { z } from 'zod';
import type { PoolClient } from 'pg';
import { createRouter, type Req, type Res, type Handler } from './router.js';
import { withTx, type RequestContext } from './db.js';
import { AppError, can, errorHandler, wrap, type Actor } from './middleware.js';
import type { Subject, Action } from './ability.js';

export interface AuditLogPayload {
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ip?: string | null;
}

export async function writeAudit(c: PoolClient, a: AuditLogPayload) {
  const changed = a.newValues
    ? Object.keys(a.newValues).filter((k) => JSON.stringify(a.oldValues?.[k]) !== JSON.stringify(a.newValues![k]))
    : [];
  await c.query(
    `INSERT INTO audit_logs (tenant_id, entity_type, entity_id, action, changed_fields, old_values, new_values, performed_by, ip_address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [a.tenantId, a.entityType, a.entityId, a.action, changed, a.oldValues ?? null, a.newValues ?? null, a.performedBy, a.ip ?? null]
  );
}

export interface ResourceRouterConfig<TRow, TCreate, TUpdate> {
  subject: Subject;
  table: string;
  columns?: string[];
  searchColumns?: string[];
  sortAllowlist?: string[];
  defaultSort?: { column: string; order: 'asc' | 'desc' };
  createSchema: z.ZodType<TCreate>;
  updateSchema: z.ZodType<TUpdate>;
  mapRow?: (row: any) => TRow;
  beforeCreate?: (client: PoolClient, actor: Actor, data: TCreate) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeUpdate?: (client: PoolClient, actor: Actor, id: string, data: TUpdate, current: any) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeDelete?: (client: PoolClient, actor: Actor, id: string, current: any) => Promise<void> | void;
}

export function createResourceRouter<TRow = any, TCreate = any, TUpdate = any>(
  config: ResourceRouterConfig<TRow, TCreate, TUpdate>
) {
  const router = createRouter(errorHandler);
  const mapRow = config.mapRow ?? ((r: any) => r as TRow);
  const sortAllowlist = config.sortAllowlist ?? ['created_at', 'updated_at', 'id'];
  const defaultSort = config.defaultSort ?? { column: 'created_at', order: 'desc' };
  const searchColumns = config.searchColumns ?? ['name', 'code', 'title'];
  const cols = config.columns?.length ? config.columns.join(', ') : '*';

  // 1. LIST: GET /
  router.get(
    '/',
    can('read', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const q = z
        .object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(20),
          search: z.string().trim().max(100).optional(),
          sortBy: z.string().trim().default(defaultSort.column),
          sortOrder: z.enum(['asc', 'desc']).default(defaultSort.order),
        })
        .parse(req.query);

      const sortBy = sortAllowlist.includes(q.sortBy) ? q.sortBy : defaultSort.column;
      const where: string[] = ['deleted_at IS NULL', 'tenant_id = $1'];
      const params: unknown[] = [a.tenantId];

      if (q.search && searchColumns.length > 0) {
        params.push(`%${q.search.replace(/[\\%_]/g, '\\$&')}%`);
        const searchIdx = params.length;
        const searchClauses = searchColumns.map((col) => `${col} ILIKE $${searchIdx}`);
        where.push(`(${searchClauses.join(' OR ')})`);
      }

      const whereClause = where.join(' AND ');
      const offset = (q.page - 1) * q.limit;

      const t0 = performance.now();
      const out = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const totalRes = await c.query(
          `SELECT count(*)::int AS n FROM ${config.table} WHERE ${whereClause}`,
          params
        );
        const rowsRes = await c.query(
          `SELECT ${cols} FROM ${config.table} WHERE ${whereClause} ORDER BY ${sortBy} ${q.sortOrder} LIMIT ${q.limit} OFFSET ${offset}`,
          params
        );
        return { total: totalRes.rows[0]?.n ?? 0, rows: rowsRes.rows };
      });
      const dbMs = Math.round((performance.now() - t0) * 10) / 10;

      // Platform headers
      req.headers.set('Cache-Control', 'no-store');
      req.headers.set('Server-Timing', `db;dur=${dbMs};desc="queries=2"`);

      res.json({
        data: out.rows.map(mapRow),
        meta: {
          page: q.page,
          limit: q.limit,
          total: out.total,
          totalPages: Math.max(1, Math.ceil(out.total / q.limit)),
        },
      });
    })
  );

  // 2. GET: GET /:id
  router.get(
    '/:id',
    can('read', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = z.string().trim().min(1).parse(req.params.id);

      const row = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const { rows } = await c.query(
          `SELECT ${cols} FROM ${config.table} WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
          [id, a.tenantId]
        );
        return rows[0] || null;
      });

      if (!row) throw new AppError(404, 'NOT_FOUND', 'Record not found');
      res.json({ data: mapRow(row) });
    })
  );

  // 3. CREATE: POST /
  router.post(
    '/',
    can('create', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const parsed = config.createSchema.parse(req.body);

      const row = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        let insertData: Record<string, any> = { ...(parsed as any) };
        if (config.beforeCreate) {
          const extra = await config.beforeCreate(c, a, parsed);
          insertData = { ...insertData, ...extra };
        }

        insertData.tenant_id = a.tenantId;
        insertData.created_by = a.userId;
        insertData.updated_by = a.userId;
        insertData.version = 1;

        const keys = Object.keys(insertData);
        const values = Object.values(insertData);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        const { rows } = await c.query(
          `INSERT INTO ${config.table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
          values
        );
        const created = rows[0];

        await writeAudit(c, {
          tenantId: a.tenantId,
          entityType: config.table,
          entityId: String(created.id),
          action: 'CREATE',
          performedBy: a.userId,
          newValues: mapRow(created) as any,
          ip: a.ip,
        });

        return created;
      });

      res.status(201).json({ data: mapRow(row) });
    })
  );

  // 4. UPDATE: PATCH /:id
  router.patch(
    '/:id',
    can('update', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = z.string().trim().min(1).parse(req.params.id);
      const parsed = config.updateSchema.parse(req.body) as Record<string, any>;
      const version = (parsed as any).version;

      if (version === undefined || version === null) {
        throw new AppError(400, 'VERSION_REQUIRED', 'version is mandatory for optimistic concurrency');
      }

      const row = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const { rows: existingRows } = await c.query(
          `SELECT * FROM ${config.table} WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL FOR UPDATE`,
          [id, a.tenantId]
        );
        const existing = existingRows[0];
        if (!existing) throw new AppError(404, 'NOT_FOUND', 'Record not found');

        if (existing.version !== version) {
          throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Record was modified elsewhere. Reload and retry.');
        }

        let updateData: Record<string, any> = { ...parsed };
        delete updateData.version;
        delete updateData.id;
        delete updateData.tenant_id;
        delete updateData.created_at;
        delete updateData.created_by;

        if (config.beforeUpdate) {
          const extra = await config.beforeUpdate(c, a, id, parsed as any, existing);
          updateData = { ...updateData, ...extra };
        }

        updateData.updated_by = a.userId;
        updateData.updated_at = new Date();

        const keys = Object.keys(updateData);
        const values = Object.values(updateData);

        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const idParamIdx = keys.length + 1;
        const versionParamIdx = keys.length + 2;
        const tenantParamIdx = keys.length + 3;

        const updateQuery = `
          UPDATE ${config.table}
             SET ${setClause}, version = version + 1
           WHERE id = $${idParamIdx} AND version = $${versionParamIdx} AND tenant_id = $${tenantParamIdx}
       RETURNING *`;

        const { rows: updatedRows } = await c.query(updateQuery, [...values, id, version, a.tenantId]);
        const updated = updatedRows[0];
        if (!updated) {
          throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Record was modified elsewhere. Reload and retry.');
        }

        await writeAudit(c, {
          tenantId: a.tenantId,
          entityType: config.table,
          entityId: id,
          action: 'UPDATE',
          performedBy: a.userId,
          oldValues: mapRow(existing) as any,
          newValues: mapRow(updated) as any,
          ip: a.ip,
        });

        return updated;
      });

      res.json({ data: mapRow(row) });
    })
  );

  // 5. DELETE: DELETE /:id
  router.delete(
    '/:id',
    can('delete', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = z.string().trim().min(1).parse(req.params.id);

      await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const { rows: existingRows } = await c.query(
          `SELECT * FROM ${config.table} WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL FOR UPDATE`,
          [id, a.tenantId]
        );
        const existing = existingRows[0];
        if (!existing) throw new AppError(404, 'NOT_FOUND', 'Record not found');

        if (config.beforeDelete) {
          await config.beforeDelete(c, a, id, existing);
        }

        await c.query(
          `UPDATE ${config.table} SET deleted_at = now(), version = version + 1, updated_by = $1 WHERE id = $2 AND tenant_id = $3`,
          [a.userId, id, a.tenantId]
        );

        await writeAudit(c, {
          tenantId: a.tenantId,
          entityType: config.table,
          entityId: id,
          action: 'DELETE',
          performedBy: a.userId,
          oldValues: mapRow(existing) as any,
          ip: a.ip,
        });
      });

      res.status(204).end();
    })
  );

  // 6. HISTORY: GET /:id/history
  router.get(
    '/:id/history',
    can('read', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = z.string().trim().min(1).parse(req.params.id);

      const rows = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const { rows: historyRows } = await c.query(
          `SELECT id, action, performed_by, performed_at, changed_fields, old_values, new_values, ip_address
             FROM audit_logs
            WHERE entity_type = $1 AND entity_id = $2 AND tenant_id = $3
            ORDER BY performed_at DESC
            LIMIT 50`,
          [config.table, id, a.tenantId]
        );
        return historyRows;
      });

      res.json({
        data: rows.map((r) => ({
          id: r.id,
          action: r.action,
          changedBy: r.performed_by,
          timestamp: r.performed_at,
          entityType: config.table,
          entityCode: id,
          changeSummary: `${r.action} on ${config.table} by ${r.performed_by || 'system'}`,
          diff: r.newValues && r.oldValues ? { before: r.oldValues, after: r.newValues } : undefined,
        })),
      });
    })
  );

  return router;
}
