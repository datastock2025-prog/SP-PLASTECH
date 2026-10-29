/**
 * Drop-in replacement for crud.ts `registerResourceRoutes`, built on the typed Drizzle helpers (core/query.ts).
 * Same config shape and same endpoints, so a module migrates by changing one import line.
 *
 * Differences from crud.ts (asserted by core/golden.crud.test.ts):
 *  - audit rows come from the audit_row_change DB trigger (db/migrations/20261031000001_*), not app code;
 *  - create/patch return only the configured `columns` (crud.ts returned RETURNING *);
 *  - `includeTotal=false` is honoured; unknown body fields are dropped instead of failing in SQL.
 */
import { z } from 'zod';
import type { PoolClient } from 'pg';
import { and, count, desc, eq, getTableColumns } from 'drizzle-orm';
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';
import { is } from 'drizzle-orm';
import { withDrizzleTx } from '../db.js';
import { AppError } from './errors.js';
import { can, wrap, type Actor } from '../middleware.js';
import type { Subject } from '../ability.js';
import type { Req, Res } from '../router.js';
import * as schema from '../schema/index.js';
import { auditLogs } from '../schema/erp.js';
import {
  filterConditions, findOne, insertRow, listPage, plantScope, searchCondition, softDelete, tenantScope, updateRow, withIdempotency,
  type ScopedTable,
} from './query.js';

export interface ResourceRouterConfig<TRow = any, TCreate = any, TUpdate = any> {
  subject: Subject;
  table: string;
  columns?: string[];
  writableColumns?: string[];
  searchColumns?: string[];
  filterColumns?: string[];
  plantScoped?: boolean;
  sortAllowlist?: string[];
  defaultSort?: { column: string; order: 'asc' | 'desc' };
  createSchema: z.ZodType<TCreate>;
  updateSchema: z.ZodType<TUpdate>;
  mapRow?: (row: any) => TRow;
  beforeCreate?: (client: PoolClient, actor: Actor, data: TCreate, db?: any) => Promise<Record<string, unknown> | void> | Record<string, unknown> | void;
  beforeUpdate?: (client: PoolClient, actor: Actor, id: string, data: TUpdate, current: any) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeDelete?: (client: PoolClient, actor: Actor, id: string, current: any) => Promise<void> | void;
}

const NATURAL_KEYS = ['code', 'so_number', 'challan_number', 'pr_number', 'grn_number', 'po_number', 'inspection_no', 'ticket_number', 'account_code', 'je_number', 'invoice_number', 'employee_code'];
const NO_STORE = 'no-store, no-cache, must-revalidate';

let byName: Map<string, PgTable> | undefined;
/** Resolve a Drizzle table by its SQL name (config keeps the legacy string). Fails fast at startup. */
export function resolveTable(name: string): ScopedTable {
  if (!byName) {
    byName = new Map();
    for (const v of Object.values(schema)) if (is(v, PgTable)) byName.set(getTableConfig(v).name, v);
  }
  const t = byName.get(name);
  if (!t) throw new Error(`resource: no Drizzle table for "${name}"`);
  const cols = getTableColumns(t) as Record<string, unknown>;
  for (const p of ['id', 'tenantId', 'deletedAt', 'version']) if (!cols[p]) throw new Error(`resource: table "${name}" lacks ${p}`);
  return t as unknown as ScopedTable;
}

export function registerResourceRoutes<TRow = any, TCreate = any, TUpdate = any>(
  router: { get: Function; post: Function; patch: Function; delete: Function },
  basePath: string,
  config: ResourceRouterConfig<TRow, TCreate, TUpdate>,
) {
  const table = resolveTable(config.table);
  const dbCols = new Set(Object.values(getTableColumns(table)).map((c: any) => c.name as string));
  const p = (sub: string) => `${basePath}${sub}` || '/';
  const mapRow = config.mapRow ?? ((r: any) => r as TRow);
  const columns = config.columns?.length ? config.columns : ['id', 'created_at', 'updated_at'];
  const sortable = config.sortAllowlist ?? ['created_at', 'updated_at', 'id'];
  const searchable = (config.searchColumns ?? ['name', 'code', 'title']).filter((c) => dbCols.has(c));
  const filterable = config.filterColumns ?? columns;
  const plantScoped = (config.plantScoped ?? (columns.includes('plant_id') || ['items', 'work_orders', 'machines'].includes(config.table))) && dbCols.has('plant_id');
  const naturalKey = columns.find((c) => NATURAL_KEYS.includes(c));
  const row = { naturalKey, plantScoped };
  const list = { columns, searchable, sortable, filterable, defaultSort: config.defaultSort, plantScoped };

  const tx = <T>(a: Actor, fn: (db: any, client: PoolClient) => Promise<T>, readOnly = false) =>
    withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, fn as any, { readOnly }) as Promise<T>;
  const parseId = (req: Req) => z.string().trim().min(1).parse(req.params.id);

  router.get(p(''), can('read', config.subject), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const out = await tx(a, (db) => listPage(db, table, a, req.query, list), true);
    res.setHeader('Cache-Control', NO_STORE);
    res.json({ data: out.data.map(mapRow), meta: out.meta });
  }));

  router.get(p('/count'), can('read', config.subject), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const term = String(req.query?.search ?? req.query?.q ?? '');
    const n = await tx(a, async (db) => {
      const [r] = await db.select({ n: count() }).from(table).where(and(
        tenantScope(table, a.tenantId),
        plantScoped ? plantScope(table, a) : undefined,
        searchCondition(table, term, searchable),
        ...filterConditions(table, req.query, filterable),
      ));
      return Number(r?.n ?? 0);
    }, true);
    res.setHeader('Cache-Control', NO_STORE);
    res.json({ data: { count: n } });
  }));

  router.get(p('/:id'), can('read', config.subject), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const data = await tx(a, (db) => findOne(db, table, a, parseId(req), columns, row), true);
    res.setHeader('Cache-Control', NO_STORE);
    res.json({ data: mapRow(data) });
  }));

  router.post(p(''), can('create', config.subject), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const parsed = config.createSchema.parse(req.body);
    const key = (req.headers as any)?.get?.('idempotency-key') ?? (req.headers as any)?.['idempotency-key'];
    const out = await tx(a, (db, client) =>
      withIdempotency(db, a, typeof key === 'string' ? key : undefined, req.body, async () => {
        const extra = config.beforeCreate ? ((await config.beforeCreate(client, a, parsed, db)) as any) ?? {} : {};
        const created = await insertRow(db, table, a, { ...(parsed as any), ...extra }, columns, { plantScoped });
        return { data: mapRow(created) };
      }));
    res.setHeader('X-Invalidate', config.table);
    if (out.replay) res.setHeader('X-Cache', 'IDEMPOTENT-HIT');
    res.status(out.replay ? 200 : 201).json(out.data);
  }));

  router.patch(p('/:id'), can('update', config.subject), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = parseId(req);
    const parsed = config.updateSchema.parse(req.body) as Record<string, unknown>;
    const IMMUTABLE = ['id', 'tenantId', 'tenant_id', 'deletedAt', 'deleted_at', 'createdAt', 'created_at'];
    for (const k of IMMUTABLE) delete parsed[k];

    if (config.writableColumns && config.writableColumns.length > 0) {
      const allowed = new Set([...config.writableColumns, 'version']);
      const disallowed = Object.keys(parsed).filter((k) => !allowed.has(k));
      if (disallowed.length > 0) {
        throw new AppError(422, 'UNWRITABLE_FIELD', `Fields not writable on ${config.subject}: ${disallowed.join(', ')}`);
      }
    }
    const data = await tx(a, async (db, client) => {
      let patch = parsed;
      if (config.beforeUpdate && parsed.version != null) {
        const current = await findOne(db, table, a, id, columns, row);
        patch = { ...parsed, ...(await config.beforeUpdate(client, a, id, parsed as any, current)) };
      }
      return updateRow(db, table, a, id, patch, columns, row);
    });
    res.setHeader('X-Invalidate', config.table);
    res.json({ data: mapRow(data) });
  }));

  router.delete(p('/:id'), can('delete', config.subject), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = parseId(req);
    await tx(a, async (db, client) => {
      if (config.beforeDelete) await config.beforeDelete(client, a, id, await findOne(db, table, a, id, columns, row));
      await softDelete(db, table, a, id, row);
    });
    res.setHeader('X-Invalidate', config.table);
    res.status(204).end();
  }));

  router.get(p('/:id/history'), can('read', config.subject), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const data = await tx(a, async (db) => {
      const found = await findOne(db, table, a, parseId(req), ['id'], row);
      return db.select({
        id: auditLogs.id, action: auditLogs.action, changed_fields: auditLogs.changedFields, old_values: auditLogs.oldValues,
        new_values: auditLogs.newValues, performed_by: auditLogs.performedBy, performed_at: auditLogs.performedAt, ip_address: auditLogs.ipAddress,
      }).from(auditLogs)
        .where(and(eq(auditLogs.tenantId, a.tenantId), eq(auditLogs.entityType, config.table), eq(auditLogs.entityId, String(found.id))))
        .orderBy(desc(auditLogs.performedAt)).limit(50);
    }, true);
    res.json({ data });
  }));
}
