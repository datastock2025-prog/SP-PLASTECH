/**
 * Typed Drizzle query helpers (Layer 1 helper; replaces the SQL-string builders of crud.ts).
 *
 * Pure functions, no router and no SQL strings: every column is resolved against the Drizzle
 * table definition, so an unknown column cannot reach the database. API field names stay
 * snake_case (the wire contract); Drizzle property names stay camelCase (internal).
 */
import {
  and, asc, desc, eq, gt, gte, ilike, inArray, isNull, lt, lte, ne, or, sql, count, getTableColumns,
  type SQL,
} from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import { AppError } from './errors.js';
import { decodeCursor, encodeCursor } from './pagination.js';
import { idempotencyKeys } from '../schema/erp.js';
import { createHash, randomUUID } from 'node:crypto';

type Db = NodePgDatabase<any>;
type Row = Record<string, any>;

/** Every tenant-owned, soft-deletable, OCC-versioned table the helpers operate on. */
export type ScopedTable = PgTable & {
  id: AnyPgColumn;
  tenantId: AnyPgColumn;
  deletedAt: AnyPgColumn;
  version: AnyPgColumn;
};

/** Minimal actor shape (avoids importing middleware.ts and creating a cycle). */
export interface ScopeActor {
  tenantId: string;
  userId: string;
  roleCode?: string;
  activePlantId?: string | null;
  plantIds?: string[];
}

// ── Column resolution ────────────────────────────────────────────────────────────────────────

interface ColumnMaps {
  /** db (snake_case) name → column */
  byDb: Map<string, AnyPgColumn>;
  /** db (snake_case) name → drizzle property name */
  propByDb: Map<string, string>;
}
const maps = new WeakMap<object, ColumnMaps>();

function columnMaps(table: PgTable): ColumnMaps {
  let m = maps.get(table);
  if (!m) {
    m = { byDb: new Map(), propByDb: new Map() };
    for (const [prop, col] of Object.entries(getTableColumns(table))) {
      m.byDb.set(col.name, col as AnyPgColumn);
      m.propByDb.set(col.name, prop);
    }
    maps.set(table, m);
  }
  return m;
}

function requireColumn(table: PgTable, dbName: string): AnyPgColumn {
  const col = columnMaps(table).byDb.get(dbName);
  if (!col) throw new Error(`Unknown column "${dbName}"`);
  return col;
}

/** Projection `{ snake_name: column }` so rows keep the snake_case wire contract. */
export function snakeSelect(table: PgTable, names?: string[]): Record<string, AnyPgColumn> {
  const { byDb } = columnMaps(table);
  const out: Record<string, AnyPgColumn> = {};
  for (const name of names ?? byDb.keys()) out[name] = requireColumn(table, name);
  return out;
}

/** Coerce a query-string value to the column's JS type (drizzle does not parse strings for us). */
function coerce(col: AnyPgColumn, v: string): unknown {
  switch (col.dataType) {
    case 'date': {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    case 'boolean': return v === 'true';
    case 'number': {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    default: return v;
  }
}

// ── List query parsing ───────────────────────────────────────────────────────────────────────

export interface ListQuery {
  page: number;
  limit: number;
  cursor?: string;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  includeTotal: boolean;
}

export function parseListQuery(
  raw: unknown,
  opts: { sortable: string[]; defaultSort?: { column: string; order: 'asc' | 'desc' } },
): ListQuery {
  const def = opts.defaultSort ?? { column: 'created_at', order: 'desc' as const };
  const q = z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      cursor: z.string().trim().optional(),
      search: z.string().trim().max(100).optional(),
      q: z.string().trim().max(100).optional(),
      sortBy: z.string().trim().default(def.column),
      sortOrder: z.enum(['asc', 'desc']).default(def.order),
      includeTotal: z.string().default('true').transform((v) => v.trim().toLowerCase() !== 'false'),
    })
    .parse(raw ?? {});
  return {
    page: q.page,
    limit: q.limit,
    cursor: q.cursor,
    search: q.search || q.q || undefined,
    sortBy: opts.sortable.includes(q.sortBy) ? q.sortBy : def.column,
    sortOrder: q.sortOrder,
    includeTotal: q.includeTotal,
  };
}

// ── Conditions ───────────────────────────────────────────────────────────────────────────────

const SYSTEM_PARAMS = new Set(['page', 'limit', 'cursor', 'search', 'q', 'sortBy', 'sortOrder', 'includeTotal']);
const FILTER_KEY = /^(?:filter|where|whereIn)\[([a-zA-Z0-9_]+)\]$/;

/** Tenant + soft-delete scope. Always the first condition of every query. */
export function tenantScope(table: ScopedTable, tenantId: string): SQL {
  return and(eq(table.tenantId, tenantId), isNull(table.deletedAt))!;
}

/**
 * Plant isolation: SUPER_ADMIN is unrestricted; others see rows of their plants (or plant-less rows).
 * Table must expose a `plantId` column to be plant scoped.
 */
export function plantScope(table: PgTable, actor: ScopeActor): SQL | undefined {
  if (actor.roleCode === 'SUPER_ADMIN') return undefined;
  const plant = columnMaps(table).byDb.get('plant_id');
  if (!plant) return undefined;
  if (actor.activePlantId) return or(isNull(plant), eq(plant, actor.activePlantId));
  if (actor.plantIds?.length) return or(isNull(plant), inArray(plant, actor.plantIds));
  return sql`false`;
}

export function searchCondition(table: PgTable, term: string | undefined, searchable: string[]): SQL | undefined {
  const t = term?.trim();
  if (!t || !searchable.length) return undefined;
  const pattern = `%${t.replace(/[\\%_]/g, '\\$&')}%`;
  return or(...searchable.map((name) => ilike(requireColumn(table, name), pattern)));
}

/** Column filters: `field=v`, `field=a,b`, `field=in:a,b`, `gte:`/`gt:`/`lte:`/`lt:`/`ne:`, `true|false`. */
export function filterConditions(
  table: PgTable,
  raw: Record<string, unknown> | undefined,
  filterable: string[],
): SQL[] {
  const allowed = new Set(filterable);
  const out: SQL[] = [];
  for (const [key, rawVal] of Object.entries(raw ?? {})) {
    if (SYSTEM_PARAMS.has(key) || rawVal === undefined || rawVal === null || rawVal === '') continue;
    const field = key.match(FILTER_KEY)?.[1] ?? key;
    if (!allowed.has(field)) continue;
    const col = requireColumn(table, field);
    const val = String(rawVal).trim();
    const list = (s: string) =>
      s.split(',').map((x) => x.trim()).filter(Boolean).map((x) => coerce(col, x)).filter((x) => x !== undefined);
    const one = (s: string) => coerce(col, s.trim());

    const ops: Array<[string, (v: any) => SQL]> = [
      ['gte:', (v) => gte(col, v)], ['gt:', (v) => gt(col, v)],
      ['lte:', (v) => lte(col, v)], ['lt:', (v) => lt(col, v)], ['ne:', (v) => ne(col, v)],
    ];
    if (val.startsWith('in:') || val.includes(',')) {
      const values = list(val.startsWith('in:') ? val.slice(3) : val);
      if (values.length) out.push(inArray(col, values as any[]));
      continue;
    }
    const op = ops.find(([p]) => val.startsWith(p));
    if (op) {
      const v = one(val.slice(op[0].length));
      if (v !== undefined) out.push(op[1](v));
      continue;
    }
    const v = col.dataType === 'boolean' ? val === 'true' : one(val);
    if (v !== undefined) out.push(eq(col, v as any));
  }
  return out;
}

/** Keyset condition for `(sort, id)` ordering. */
export function cursorCondition(sortCol: AnyPgColumn, idCol: AnyPgColumn, order: 'asc' | 'desc', cursor?: string): SQL | undefined {
  const c = decodeCursor(cursor);
  if (!c) return undefined;
  const t = coerce(sortCol, c.t);
  if (t === undefined) return undefined;
  const cmp = order === 'desc' ? lt : gt;
  return or(cmp(sortCol, t as any), and(eq(sortCol, t as any), cmp(idCol, c.id)));
}

// ── Reads ────────────────────────────────────────────────────────────────────────────────────

export interface ListConfig {
  columns: string[];
  searchable?: string[];
  sortable: string[];
  filterable?: string[];
  defaultSort?: { column: string; order: 'asc' | 'desc' };
  /** Apply plant isolation (table must have plant_id). */
  plantScoped?: boolean;
}

export async function listPage(db: Db, table: ScopedTable, actor: ScopeActor, rawQuery: unknown, cfg: ListConfig) {
  const q = parseListQuery(rawQuery, { sortable: cfg.sortable, defaultSort: cfg.defaultSort });
  const base = and(
    tenantScope(table, actor.tenantId),
    cfg.plantScoped ? plantScope(table, actor) : undefined,
    searchCondition(table, q.search, cfg.searchable ?? []),
    ...filterConditions(table, rawQuery as Row, cfg.filterable ?? cfg.columns),
  );

  const sortCol = requireColumn(table, q.sortBy);
  const dir = q.sortOrder === 'desc' ? desc : asc;
  const keyset = cursorCondition(sortCol, table.id, q.sortOrder, q.cursor);
  const offset = keyset ? 0 : (q.page - 1) * q.limit;

  const rows = (await db
    .select(snakeSelect(table, cfg.columns))
    .from(table)
    .where(and(base, keyset))
    .orderBy(dir(sortCol), dir(table.id))
    .limit(q.limit + 1)
    .offset(offset)) as Row[];

  const hasMore = rows.length > q.limit;
  const data = hasMore ? rows.slice(0, q.limit) : rows;

  let total = 0;
  if (q.includeTotal && !keyset) {
    const [r] = await db.select({ n: count() }).from(table).where(base);
    total = Number(r?.n ?? 0);
  } else if (!keyset) {
    total = hasMore ? offset + q.limit + 1 : offset + data.length;
  }

  let nextCursor: string | null = null;
  if (hasMore && data.length) {
    const last = data[data.length - 1];
    const v = last[q.sortBy];
    nextCursor = encodeCursor({ t: v instanceof Date ? v.toISOString() : String(v ?? ''), id: String(last.id) });
  }

  return {
    data,
    meta: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.limit)),
      hasMore,
      cursor: q.cursor ?? null,
      nextCursor,
    },
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Row identifier condition: UUID → id, otherwise the table's natural key column (e.g. `inspection_no`). */
export function idCondition(table: ScopedTable, idOrKey: string, naturalKey?: string): SQL {
  const byId = UUID.test(idOrKey) || isTextId(table) ? eq(table.id, idOrKey) : undefined;
  const byKey = naturalKey ? eq(requireColumn(table, naturalKey), idOrKey) : undefined;
  if (byId && byKey && !UUID.test(idOrKey)) return or(byId, byKey)!;
  return byId ?? byKey ?? sql`false`;
}

/** Several core tables (items-era schema) keep a text primary key; legacy crud.ts matched id::text. */
function isTextId(table: PgTable): boolean {
  return columnMaps(table).byDb.get('id')?.columnType === 'PgText';
}

export interface RowScope {
  naturalKey?: string;
  plantScoped?: boolean;
}

function rowWhere(table: ScopedTable, actor: ScopeActor, idOrKey: string, s: RowScope): SQL {
  return and(
    tenantScope(table, actor.tenantId),
    idCondition(table, idOrKey, s.naturalKey),
    s.plantScoped ? plantScope(table, actor) : undefined,
  )!;
}

export async function findOne(db: Db, table: ScopedTable, actor: ScopeActor, idOrKey: string, columns: string[], s: RowScope = {}) {
  const [row] = (await db.select(snakeSelect(table, columns)).from(table).where(rowWhere(table, actor, idOrKey, s)).limit(1)) as Row[];
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Record not found');
  return row;
}

// ── Writes ───────────────────────────────────────────────────────────────────────────────────

const PROTECTED = new Set(['id', 'tenant_id', 'version', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by']);

/** snake_case body → drizzle values. Unknown and protected fields are dropped, strings trimmed. */
export function toValues(table: PgTable, data: Record<string, unknown>): Row {
  const { propByDb } = columnMaps(table);
  const out: Row = {};
  for (const [k, v] of Object.entries(data ?? {})) {
    const prop = propByDb.get(k);
    if (!prop || PROTECTED.has(k) || v === undefined) continue;
    out[prop] = typeof v === 'string' ? v.trim() : v;
  }
  return out;
}

/** created_by / updated_by exist on most, not all, tables (e.g. notifications): stamp only what is there. */
function actorStamp(table: PgTable, actor: ScopeActor, creating: boolean): Row {
  const { propByDb } = columnMaps(table);
  const out: Row = {};
  if (creating && propByDb.has('created_by')) out.createdBy = actor.userId;
  if (propByDb.has('updated_by')) out.updatedBy = actor.userId;
  return out;
}

export async function insertRow(
  db: Db, table: ScopedTable, actor: ScopeActor, data: Record<string, unknown>, columns: string[],
  opts: { plantScoped?: boolean } = {},
) {
  const values = toValues(table, data);
  const hasPlant = columnMaps(table).byDb.has('plant_id');
  if (opts.plantScoped && hasPlant && !values.plantId) {
    values.plantId = actor.activePlantId ?? actor.plantIds?.[0] ?? undefined;
  }
  const textId = isTextId(table);
  if (typeof data.id === 'string' && data.id.trim() && (UUID.test(data.id) || textId)) values.id = data.id.trim();
  else if (textId) values.id = randomUUID(); // text PKs have no DB default
  const [row] = (await db
    .insert(table)
    .values({ ...values, tenantId: actor.tenantId, ...actorStamp(table, actor, true), version: 1 } as any)
    .returning(snakeSelect(table, columns))) as Row[];
  return row;
}

/** PATCH with optimistic concurrency: 404 if missing, 409 if `version` is stale. */
export async function updateRow(
  db: Db, table: ScopedTable, actor: ScopeActor, idOrKey: string,
  data: Record<string, unknown>, columns: string[], s: RowScope = {},
) {
  const version = Number(data.version);
  if (!Number.isInteger(version)) throw new AppError(400, 'VERSION_REQUIRED', 'version is mandatory for optimistic concurrency');

  const where = rowWhere(table, actor, idOrKey, s);
  const [row] = (await db
    .update(table)
    .set({ ...toValues(table, data), ...actorStamp(table, actor, false), updatedAt: new Date(), version: sql`${table.version} + 1` } as any)
    .where(and(where, eq(table.version, version)))
    .returning(snakeSelect(table, columns))) as Row[];
  if (row) return row;

  const [exists] = await db.select({ id: table.id }).from(table).where(where).limit(1);
  if (!exists) throw new AppError(404, 'NOT_FOUND', 'Record not found');
  throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Record was modified elsewhere. Reload and retry.');
}

/** Action / status-transition update: no caller OCC version required. Version is incremented atomically. */
export async function patchRow(
  db: Db, table: ScopedTable, actor: ScopeActor, idOrKey: string,
  data: Record<string, unknown>, columns?: string[], s: RowScope = {},
) {
  const where = rowWhere(table, actor, idOrKey, s);
  const setObj: Row = {
    ...toValues(table, data),
    ...actorStamp(table, actor, false),
  };
  const { propByDb } = columnMaps(table);
  if (propByDb.has('updated_at')) setObj.updatedAt = new Date();
  if (propByDb.has('version')) setObj.version = sql`${table.version} + 1`;

  const [row] = (await db
    .update(table)
    .set(setObj as any)
    .where(where)
    .returning(snakeSelect(table, columns))) as Row[];
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Record not found');
  return row;
}

export async function softDelete(db: Db, table: ScopedTable, actor: ScopeActor, idOrKey: string, s: RowScope = {}) {
  const res = await db
    .update(table)
    .set({ deletedAt: new Date(), ...actorStamp(table, actor, false), version: sql`${table.version} + 1` } as any)
    .where(rowWhere(table, actor, idOrKey, s))
    .returning({ id: table.id });
  if (!res.length) throw new AppError(404, 'NOT_FOUND', 'Record not found');
}

// ── Idempotency ──────────────────────────────────────────────────────────────────────────────

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Replay-safe create: same key + same body within 24h returns the stored response (`replay: true`);
 * same key + different body is a 409. Runs inside the caller's transaction.
 */
export async function withIdempotency<T>(
  db: Db, actor: ScopeActor, key: string | undefined, body: unknown, run: () => Promise<T>,
): Promise<{ replay: boolean; data: T }> {
  const k = key?.trim();
  if (!k) return { replay: false, data: await run() };

  const hash = createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex');
  const [hit] = await db
    .select()
    .from(idempotencyKeys)
    .where(and(eq(idempotencyKeys.tenantId, actor.tenantId), eq(idempotencyKeys.key, k)))
    .limit(1);
  if (hit && Date.now() - hit.createdAt.getTime() < IDEMPOTENCY_TTL_MS) {
    if (hit.requestHash !== hash) {
      throw new AppError(409, 'IDEMPOTENCY_KEY_MISMATCH', 'Idempotency key was previously used with a different request payload');
    }
    return { replay: true, data: hit.response as T };
  }

  const data = await run();
  await db
    .insert(idempotencyKeys)
    .values({ tenantId: actor.tenantId, key: k, requestHash: hash, response: data as any })
    .onConflictDoUpdate({
      target: [idempotencyKeys.tenantId, idempotencyKeys.key],
      set: { requestHash: hash, response: data as any, createdAt: new Date() },
    });
  return { replay: false, data };
}

export const ctx = (a: { tenantId: string; userId: string }) => ({ tenantId: a.tenantId, userId: a.userId });
