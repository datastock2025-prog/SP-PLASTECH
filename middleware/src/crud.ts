import { z } from 'zod';
import crypto from 'node:crypto';
import type { PoolClient } from 'pg';
import { createRouter, type Req, type Res } from './router.js';
import { withTx, type RequestContext } from './db.js';
import { AppError, can, errorHandler, wrap, type Actor } from './middleware.js';
import type { Subject } from './ability.js';
import { writeAudit } from './userStore.js';
import { encodeCursor, decodeCursor } from './core/pagination.js';

export interface ResourceRouterConfig<TRow, TCreate, TUpdate> {
  subject: Subject;
  table: string;
  columns?: string[];
  searchColumns?: string[];
  filterColumns?: string[];
  plantScoped?: boolean;
  sortAllowlist?: string[];
  defaultSort?: { column: string; order: 'asc' | 'desc' };
  createSchema: z.ZodType<TCreate>;
  updateSchema: z.ZodType<TUpdate>;
  mapRow?: (row: any) => TRow;
  beforeCreate?: (client: PoolClient, actor: Actor, data: TCreate) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeUpdate?: (client: PoolClient, actor: Actor, id: string, data: TUpdate, current: any) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeDelete?: (client: PoolClient, actor: Actor, id: string, current: any) => Promise<void> | void;
}

function applyPlantScope(where: string[], params: unknown[], a: Actor, isPlantScoped: boolean) {
  const isSuperAdmin = a.roleCode === 'SUPER_ADMIN';
  if (isPlantScoped && !isSuperAdmin) {
    if (a.activePlantId) {
      params.push(a.activePlantId);
      where.push(`(plant_id IS NULL OR plant_id = $${params.length})`);
    } else if (a.plantIds && a.plantIds.length > 0) {
      params.push(a.plantIds);
      where.push(`(plant_id IS NULL OR plant_id = ANY($${params.length}::uuid[]))`);
    } else {
      where.push('1 = 0');
    }
  }
}

function applyQueryFilters(
  where: string[],
  params: unknown[],
  query: Record<string, any> | undefined,
  declaredFilterCols: Set<string>
) {
  const systemQueryParams = new Set(['page', 'limit', 'cursor', 'search', 'q', 'sortBy', 'sortOrder', 'includeTotal']);

  for (const [key, rawVal] of Object.entries(query || {})) {
    if (systemQueryParams.has(key)) continue;
    if (rawVal === undefined || rawVal === null || rawVal === '') continue;

    let field = key;
    const filterMatch = key.match(/^(?:filter|where|whereIn)\[([a-zA-Z0-9_]+)\]$/);
    if (filterMatch) {
      field = filterMatch[1];
    }

    if (!declaredFilterCols.has(field)) continue;

    const val = String(rawVal).trim();
    if (val.startsWith('in:')) {
      const list = val.slice(3).split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length > 0) {
        params.push(list);
        where.push(`${field} = ANY($${params.length})`);
      }
    } else if (val.startsWith('gte:')) {
      params.push(val.slice(4).trim());
      where.push(`${field} >= $${params.length}`);
    } else if (val.startsWith('gt:')) {
      params.push(val.slice(3).trim());
      where.push(`${field} > $${params.length}`);
    } else if (val.startsWith('lte:')) {
      params.push(val.slice(4).trim());
      where.push(`${field} <= $${params.length}`);
    } else if (val.startsWith('lt:')) {
      params.push(val.slice(3).trim());
      where.push(`${field} < $${params.length}`);
    } else if (val.startsWith('ne:')) {
      params.push(val.slice(3).trim());
      where.push(`${field} != $${params.length}`);
    } else if (val === 'true' || val === 'false') {
      params.push(val === 'true');
      where.push(`${field} = $${params.length}`);
    } else if (val.includes(',')) {
      const list = val.split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length > 0) {
        params.push(list);
        where.push(`${field} = ANY($${params.length})`);
      }
    } else {
      params.push(val);
      where.push(`${field} = $${params.length}`);
    }
  }
}

export function registerResourceRoutes<TRow = any, TCreate = any, TUpdate = any>(
  router: { get: Function; post: Function; patch: Function; delete: Function },
  basePath: string,
  config: ResourceRouterConfig<TRow, TCreate, TUpdate>
) {
  const p = (sub: string) => `${basePath}${sub}` || '/';
  const mapRow = config.mapRow ?? ((r: any) => r as TRow);
  const sortAllowlist = config.sortAllowlist ?? ['created_at', 'updated_at', 'id'];
  const defaultSort = config.defaultSort ?? { column: 'created_at', order: 'desc' };
  const searchColumns = config.searchColumns ?? ['name', 'code', 'title'];
  const cols = config.columns?.length ? config.columns.join(', ') : 'id, created_at, updated_at';
  const isPlantScoped = config.plantScoped ?? (Boolean(config.columns && config.columns.includes('plant_id')) || ['items', 'work_orders', 'machines'].includes(config.table));

  // 1. LIST: GET <basePath>
  router.get(
    p(''),
    can('read', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const q = z
        .object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(20),
          cursor: z.string().trim().optional(),
          search: z.string().trim().max(100).optional(),
          sortBy: z.string().trim().default(defaultSort.column),
          sortOrder: z.enum(['asc', 'desc']).default(defaultSort.order),
          includeTotal: z.coerce.boolean().default(true),
        })
        .passthrough()
        .parse(req.query);

      const sortBy = sortAllowlist.includes(q.sortBy) ? q.sortBy : defaultSort.column;
      const where: string[] = ['deleted_at IS NULL', 'tenant_id = $1'];
      const params: unknown[] = [a.tenantId];

      // Plant scoping (multi-plant enterprise isolation)
      applyPlantScope(where, params, a, isPlantScoped);

      // Search clauses
      const searchTerm = (q.search || (req.query?.q as string) || '').trim();
      if (searchTerm && searchColumns.length > 0) {
        params.push(`%${searchTerm.replace(/[\\%_]/g, '\\$&')}%`);
        const searchIdx = params.length;
        const searchClauses = searchColumns.map((col) => `${col} ILIKE $${searchIdx}`);
        where.push(`(${searchClauses.join(' OR ')})`);
      }

      // Declared filter parsing (eq, in, range, bool)
      const declaredFilterCols = new Set(config.filterColumns ?? (config.columns ?? []));
      applyQueryFilters(where, params, req.query, declaredFilterCols);

      // Cursor keyset pagination or offset pagination
      const decodedCursor = q.cursor ? decodeCursor(q.cursor) : null;
      let cursorWhere = '';
      if (decodedCursor) {
        params.push(decodedCursor.t, decodedCursor.id);
        const tIdx = params.length - 1;
        const idIdx = params.length;
        if (q.sortOrder === 'desc') {
          cursorWhere = ` AND (${sortBy} < $${tIdx} OR (${sortBy} = $${tIdx} AND id < $${idIdx}))`;
        } else {
          cursorWhere = ` AND (${sortBy} > $${tIdx} OR (${sortBy} = $${tIdx} AND id > $${idIdx}))`;
        }
      }

      const whereClause = where.join(' AND ');
      const offset = (q.page - 1) * q.limit;

      const t0 = performance.now();
      let queryCount = 0;
      const out = await withTx(
        { tenantId: a.tenantId, userId: a.userId },
        async (c) => {
          let total = 0;
          if (q.includeTotal && !decodedCursor) {
            const countParams = decodedCursor ? params.slice(0, params.length - 2) : params;
            const totalRes = await c.query(
              `SELECT count(*)::int AS n FROM ${config.table} WHERE ${whereClause}`,
              countParams
            );
            total = totalRes.rows[0]?.n ?? 0;
          }

          let querySql: string;
          let queryParams: unknown[];

          if (decodedCursor) {
            querySql = `SELECT ${cols} FROM ${config.table} WHERE ${whereClause}${cursorWhere} ORDER BY ${sortBy} ${q.sortOrder}, id ${q.sortOrder} LIMIT ${q.limit + 1}`;
            queryParams = params;
          } else {
            querySql = `SELECT ${cols} FROM ${config.table} WHERE ${whereClause} ORDER BY ${sortBy} ${q.sortOrder}, id ${q.sortOrder} LIMIT ${q.limit + 1} OFFSET ${offset}`;
            queryParams = params;
          }

          const rowsRes = await c.query(querySql, queryParams);
          const hasMore = rowsRes.rows.length > q.limit;
          const rows = hasMore ? rowsRes.rows.slice(0, q.limit) : rowsRes.rows;

          let nextCursor: string | null = null;
          if (hasMore && rows.length > 0) {
            const last = rows[rows.length - 1];
            const sortVal = last[sortBy] instanceof Date ? last[sortBy].toISOString() : String(last[sortBy] ?? '');
            nextCursor = encodeCursor({ t: sortVal, id: String(last.id) });
          }

          queryCount = (c as any).getQueryCount?.() ?? (q.includeTotal && !decodedCursor ? 2 : 1);
          return {
            total: decodedCursor ? 0 : (q.includeTotal ? total : (hasMore ? offset + q.limit + 1 : offset + rows.length)),
            rows,
            hasMore,
            nextCursor,
          };
        },
        { readOnly: true }
      );
      const dbMs = Math.round((performance.now() - t0) * 10) / 10;

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Server-Timing', `db;dur=${dbMs};desc="${queryCount} queries"`);

      res.json({
        data: out.rows.map(mapRow),
        meta: {
          page: q.page,
          limit: q.limit,
          total: out.total,
          totalPages: Math.max(1, Math.ceil(out.total / q.limit)),
          hasMore: out.hasMore,
          cursor: q.cursor ?? null,
          nextCursor: out.nextCursor ?? null,
        },
      });
    })
  );

  // 2. COUNT: GET <basePath>/count
  router.get(
    p('/count'),
    can('read', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const where: string[] = ['deleted_at IS NULL', 'tenant_id = $1'];
      const params: unknown[] = [a.tenantId];
      applyPlantScope(where, params, a, isPlantScoped);

      const declaredFilterCols = new Set(config.filterColumns ?? (config.columns ?? []));
      applyQueryFilters(where, params, req.query, declaredFilterCols);

      const searchTerm = ((req.query?.search as string) || (req.query?.q as string) || '').trim();
      if (searchTerm && searchColumns.length > 0) {
        params.push(`%${searchTerm.replace(/[\\%_]/g, '\\$&')}%`);
        const searchIdx = params.length;
        const searchClauses = searchColumns.map((col) => `${col} ILIKE $${searchIdx}`);
        where.push(`(${searchClauses.join(' OR ')})`);
      }

      const { rows } = await withTx(
        { tenantId: a.tenantId, userId: a.userId },
        async (c) => c.query(`SELECT count(*)::int AS n FROM ${config.table} WHERE ${where.join(' AND ')}`, params),
        { readOnly: true }
      );
      res.json({ data: { count: rows[0]?.n ?? 0 } });
    })
  );

  // 3. GET: GET <basePath>/:id
  router.get(
    p('/:id'),
    can('read', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = z.string().trim().min(1).parse(req.params.id);

      const candidateKey = config.columns?.find((col) => ['code', 'so_number', 'challan_number', 'pr_number', 'grn_number', 'po_number', 'inspection_no', 'ticket_number', 'account_code', 'je_number', 'invoice_number', 'employee_code'].includes(col));
      const idClause = candidateKey ? `(id::text = $1 OR ${candidateKey} = $1)` : 'id::text = $1';
      const where: string[] = [idClause, 'tenant_id = $2', 'deleted_at IS NULL'];
      const params: unknown[] = [id, a.tenantId];
      applyPlantScope(where, params, a, isPlantScoped);

      const t0 = performance.now();
      let queryCount = 0;
      const row = await withTx(
        { tenantId: a.tenantId, userId: a.userId },
        async (c) => {
          const { rows } = await c.query(
            `SELECT ${cols} FROM ${config.table} WHERE ${where.join(' AND ')}`,
            params
          );
          queryCount = (c as any).getQueryCount?.() ?? 1;
          return rows[0] || null;
        },
        { readOnly: true }
      );
      const dbMs = Math.round((performance.now() - t0) * 10) / 10;
      res.setHeader('Server-Timing', `db;dur=${dbMs};desc="${queryCount} queries"`);

      if (!row) throw new AppError(404, 'NOT_FOUND', 'Record not found');
      res.json({ data: mapRow(row) });
    })
  );

  // 4. CREATE: POST <basePath>
  router.post(
    p(''),
    can('create', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const headerKey = (req.headers as any)?.['idempotency-key'] ||
                        (typeof (req.headers as any)?.get === 'function' ? (req.headers as any).get('idempotency-key') : '') ||
                        '';
      const idempotencyKey = typeof headerKey === 'string' ? headerKey.trim() : '';
      const requestHash = idempotencyKey
        ? crypto.createHash('sha256').update(JSON.stringify(req.body ?? {})).digest('hex')
        : '';

      // Check idempotency cache if header provided
      if (idempotencyKey) {
        const cached = await withTx(
          { tenantId: a.tenantId, userId: a.userId },
          async (c) => {
            const { rows } = await c.query(
              `SELECT response, request_hash, created_at
                 FROM idempotency_keys
                WHERE tenant_id = $1 AND key = $2`,
              [a.tenantId, idempotencyKey]
            );
            return rows[0] || null;
          },
          { readOnly: true }
        );

        if (cached) {
          const ageMs = Date.now() - new Date(cached.created_at).getTime();
          if (ageMs < 24 * 60 * 60 * 1000) {
            if (cached.request_hash === requestHash) {
              res.setHeader('X-Cache', 'IDEMPOTENT-HIT');
              res.setHeader('X-Invalidate', config.table);
              return res.status(200).json(cached.response);
            } else {
              throw new AppError(409, 'IDEMPOTENCY_KEY_MISMATCH', 'Idempotency key was previously used with a different request payload');
            }
          }
        }
      }

      const parsed = config.createSchema.parse(req.body);

      const t0 = performance.now();
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

        if (insertData.id === undefined) {
          insertData.id = crypto.randomUUID();
        }

        // Auto-assign primary plant if plantScoped and not supplied
        if (isPlantScoped && !insertData.plant_id) {
          const defaultPlant = a.activePlantId || (a.plantIds?.length ? a.plantIds[0] : null);
          if (defaultPlant) {
            insertData.plant_id = defaultPlant;
          } else if (config.table === 'warehouses') {
            insertData.plant_id = 'PLANT-01';
          }
        }

        const keys = Object.keys(insertData);
        const values = Object.values(insertData).map((v) =>
          v !== null && typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v
        );
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

        // Store idempotency record if key was provided
        if (idempotencyKey) {
          const responsePayload = { data: mapRow(created) };
          await c.query(
            `INSERT INTO idempotency_keys (tenant_id, key, request_hash, response, created_at)
             VALUES ($1, $2, $3, $4, now())
             ON CONFLICT (tenant_id, key)
             DO UPDATE SET request_hash = $3, response = $4, created_at = now()`,
            [a.tenantId, idempotencyKey, requestHash, JSON.stringify(responsePayload)]
          );
        }

        return created;
      });
      const dbMs = Math.round((performance.now() - t0) * 10) / 10;
      res.setHeader('X-Invalidate', config.table);
      res.setHeader('Server-Timing', `db;dur=${dbMs};desc="queries=2"`);

      res.status(201).json({ data: mapRow(row) });
    })
  );

  // 5. UPDATE: PATCH <basePath>/:id
  router.patch(
    p('/:id'),
    can('update', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = z.string().trim().min(1).parse(req.params.id);
      const parsed = config.updateSchema.parse(req.body) as Record<string, any>;
      const version = (parsed as any).version;

      if (version === undefined || version === null) {
        throw new AppError(400, 'VERSION_REQUIRED', 'version is mandatory for optimistic concurrency');
      }

      const candidateKey = config.columns?.find((col) => ['code', 'so_number', 'challan_number', 'pr_number', 'grn_number', 'po_number', 'inspection_no', 'ticket_number', 'account_code', 'je_number', 'invoice_number', 'employee_code'].includes(col));
      const idClause = candidateKey ? `(id::text = $1 OR ${candidateKey} = $1)` : 'id::text = $1';
      const where: string[] = [idClause, 'tenant_id = $2', 'deleted_at IS NULL'];
      const params: unknown[] = [id, a.tenantId];
      applyPlantScope(where, params, a, isPlantScoped);

      const t0 = performance.now();
      const row = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const { rows: existingRows } = await c.query(
          `SELECT ${cols} FROM ${config.table} WHERE ${where.join(' AND ')} FOR UPDATE`,
          params
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

        const sets: string[] = ['version = version + 1'];
        const values: unknown[] = [];
        let pIdx = 1;

        for (const [k, v] of Object.entries(updateData)) {
          sets.push(`${k} = $${pIdx}`);
          values.push(v !== null && typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v);
          pIdx++;
        }

        values.push(existing.id, a.tenantId, version);
        const idIdx = pIdx++;
        const tenantIdx = pIdx++;
        const versionIdx = pIdx++;

        const { rows: updatedRows } = await c.query(
          `UPDATE ${config.table} SET ${sets.join(', ')} WHERE id = $${idIdx} AND tenant_id = $${tenantIdx} AND version = $${versionIdx} RETURNING *`,
          values
        );

        const updated = updatedRows[0];
        if (!updated) {
          throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Record was modified elsewhere. Reload and retry.');
        }

        await writeAudit(c, {
          tenantId: a.tenantId,
          entityType: config.table,
          entityId: String(updated.id || existing.id),
          action: 'UPDATE',
          performedBy: a.userId,
          oldValues: mapRow(existing) as any,
          newValues: mapRow(updated) as any,
          ip: a.ip,
        });

        return updated;
      });
      const dbMs = Math.round((performance.now() - t0) * 10) / 10;
      res.setHeader('X-Invalidate', config.table);
      res.setHeader('Server-Timing', `db;dur=${dbMs};desc="queries=2"`);

      res.json({ data: mapRow(row) });
    })
  );

  // 6. DELETE: DELETE <basePath>/:id
  router.delete(
    p('/:id'),
    can('delete', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = z.string().trim().min(1).parse(req.params.id);

      const candidateKey = config.columns?.find((col) => ['code', 'so_number', 'challan_number', 'pr_number', 'grn_number', 'po_number', 'inspection_no', 'ticket_number', 'account_code', 'je_number', 'invoice_number', 'employee_code'].includes(col));
      const idClause = candidateKey ? `(id::text = $1 OR ${candidateKey} = $1)` : 'id::text = $1';
      const where: string[] = [idClause, 'tenant_id = $2', 'deleted_at IS NULL'];
      const params: unknown[] = [id, a.tenantId];
      applyPlantScope(where, params, a, isPlantScoped);

      const t0 = performance.now();
      await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const { rows: existingRows } = await c.query(
          `SELECT ${cols} FROM ${config.table} WHERE ${where.join(' AND ')} FOR UPDATE`,
          params
        );
        const existing = existingRows[0];
        if (!existing) throw new AppError(404, 'NOT_FOUND', 'Record not found');

        if (config.beforeDelete) {
          await config.beforeDelete(c, a, id, existing);
        }

        await c.query(
          `UPDATE ${config.table} SET deleted_at = now(), version = version + 1 WHERE id = $1 AND tenant_id = $2`,
          [existing.id, a.tenantId]
        );

        await writeAudit(c, {
          tenantId: a.tenantId,
          entityType: config.table,
          entityId: String(existing.id),
          action: 'DELETE',
          performedBy: a.userId,
          oldValues: mapRow(existing) as any,
          ip: a.ip,
        });
      });
      const dbMs = Math.round((performance.now() - t0) * 10) / 10;
      res.setHeader('X-Invalidate', config.table);
      res.setHeader('Server-Timing', `db;dur=${dbMs};desc="queries=2"`);

      res.status(204).end();
    })
  );

  // 7. HISTORY: GET <basePath>/:id/history
  router.get(
    p('/:id/history'),
    can('read', config.subject),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = z.string().trim().min(1).parse(req.params.id);

      const rows = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const res = await c.query(
          `SELECT id, action, changed_fields, old_values, new_values, performed_by, performed_at, ip_address
             FROM audit_logs
            WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3
            ORDER BY performed_at DESC
            LIMIT 50`,
          [a.tenantId, config.table, id]
        );
        return res.rows;
      });

      res.json({ data: rows });
    })
  );
}

export function createResourceRouter<TRow = any, TCreate = any, TUpdate = any>(
  config: ResourceRouterConfig<TRow, TCreate, TUpdate>
) {
  const router = createRouter(errorHandler);
  registerResourceRoutes(router, '', config);
  return router;
}
