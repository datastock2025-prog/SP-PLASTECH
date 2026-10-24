import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { z } from 'zod';
import { setGlobalPool } from '../db.js';
import { registerResourceRoutes } from './resource.js';

/**
 * Behavioural test of the core/resource.ts adapter: real handlers -> withDrizzleTx -> Drizzle -> PGlite,
 * with the real audit + notify migrations installed. Covers every endpoint, hooks, idempotency and isolation.
 */
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const P1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const P2 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
const COLS = ['id', 'tenant_id', 'plant_id', 'inspection_no', 'item_code', 'disposition', 'inspected_qty', 'version', 'created_at'];

const pg = new PGlite();
await pg.exec(`
  CREATE ROLE erp_app;
  CREATE TABLE qc_inspections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, plant_id uuid,
    inspection_no text NOT NULL, doc_type text NOT NULL DEFAULT 'WORK_ORDER', doc_id text NOT NULL, item_code text NOT NULL,
    lot_number text, inspected_qty numeric(14,2) NOT NULL DEFAULT 0, sample_size numeric(14,2) NOT NULL DEFAULT 0,
    accepted_qty numeric(14,2) NOT NULL DEFAULT 0, rejected_qty numeric(14,2) NOT NULL DEFAULT 0,
    disposition text NOT NULL DEFAULT 'ACCEPTED', defects jsonb NOT NULL DEFAULT '[]', inspector_id text, notes text,
    version integer NOT NULL DEFAULT 1, created_by text, updated_by text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
  CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL,
    action text NOT NULL, changed_fields text[] NOT NULL DEFAULT '{}', old_values jsonb, new_values jsonb,
    performed_by text, ip_address text, performed_at timestamptz NOT NULL DEFAULT now());
  CREATE TABLE idempotency_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, key text NOT NULL, request_hash text NOT NULL,
    response jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
  CREATE UNIQUE INDEX idx_idempotency_keys_tenant_key ON idempotency_keys (tenant_id, key);
`);
const mig = (f: string) => pg.exec(readFileSync(new URL(`../../../db/migrations/${f}`, import.meta.url), 'utf8').split('-- migrate:down')[0]);
await mig('20261030000000_audit_trigger.sql');
await mig('20261031000000_erp_notify.sql');
await mig('20261031000001_resource_triggers.sql'); // skips absent tables; must not fail
await pg.exec('GRANT ALL ON ALL TABLES IN SCHEMA public TO erp_app');

// pg.Pool facade: drizzle's node-postgres driver sends {text, values, rowMode}; PGlite takes (sql, params, opts).
const client = {
  query: (q: any, params?: unknown[]) =>
    typeof q === 'string' ? pg.query(q, params as any[]) : pg.query(q.text, (q.values ?? params) as any[], q.rowMode ? { rowMode: q.rowMode } : undefined),
  release() {},
};
setGlobalPool({ connect: async () => client } as any);

const hookCalls: string[] = [];
const handlers = new Map<string, Function>();
const reg = (m: string) => (path: string, ...fns: Function[]) => { handlers.set(`${m} ${path}`, fns[fns.length - 1]); };
registerResourceRoutes({ get: reg('GET'), post: reg('POST'), patch: reg('PATCH'), delete: reg('DELETE') }, '/qc', {
  subject: 'QcInspection' as any, table: 'qc_inspections', columns: COLS,
  searchColumns: ['inspection_no', 'item_code', 'name'], // 'name' does not exist: must be ignored, not crash
  sortAllowlist: ['created_at', 'inspection_no'],
  createSchema: z.object({ inspection_no: z.string(), doc_id: z.string(), item_code: z.string(), inspected_qty: z.string().optional(), id: z.string().optional() }),
  updateSchema: z.object({ version: z.number(), disposition: z.string().optional(), notes: z.string().optional() }),
  mapRow: (r: any) => ({ ...r, mapped: true }),
  beforeCreate: async (c: any, _a: any, d: any) => { hookCalls.push('create'); await c.query('select 1'); return { notes: `hook:${d.inspection_no}` }; },
  beforeUpdate: (_c: any, _a: any, _id: string, _d: any, cur: any) => { hookCalls.push(`update:${cur.inspection_no}`); return {}; },
  beforeDelete: (_c: any, _a: any, _id: string, cur: any) => { hookCalls.push(`delete:${cur.inspection_no}`); },
});

type Actor = { tenantId: string; userId: string; roleCode?: string; activePlantId?: string | null; plantIds?: string[] };
const sa = (t = A): Actor => ({ tenantId: t, userId: 'u1', roleCode: 'SUPER_ADMIN' });
const plant: Actor = { tenantId: A, userId: 'u2', roleCode: 'QC', activePlantId: P1 };

async function call(method: string, path: string, actor: Actor, o: { query?: any; params?: any; body?: any; headers?: Record<string, string> } = {}) {
  const out: { status: number; body: any; headers: Record<string, string> } = { status: 200, body: undefined, headers: {} };
  const res: any = {
    setHeader(k: string, v: string) { out.headers[k] = v; return res; }, status(s: number) { out.status = s; return res; },
    json(b: unknown) { out.body = JSON.parse(JSON.stringify(b)); return res; }, end() { return res; },
  };
  const req: any = { actor, query: o.query ?? {}, params: o.params ?? {}, body: o.body ?? {}, headers: new Headers(o.headers ?? {}) };
  let err: any;
  await handlers.get(`${method} ${path}`)!(req, res, (e: any) => { err = e; });
  if (err?.name === 'ZodError') err.status = 400; // real errorHandler maps this
  if (err && !err.status) console.error('[unexpected]', err.cause?.message ?? err.message);
  return err ? { ...out, status: err.status ?? 500, body: { code: err.code ?? err.name } } : out;
}
const create = (no: string, actor = sa(), extra: any = {}, headers?: Record<string, string>) =>
  call('POST', '/qc', actor, { body: { inspection_no: no, doc_id: 'WO', item_code: 'CAP', inspected_qty: '5', ...extra }, headers });

// CREATE: 201, tenant from actor, mapRow applied, hook merged, X-Invalidate set, audit + client id honoured
const own = '33333333-3333-4333-8333-333333333333';
const c1 = await create('QC-1', sa(), { id: own });
assert.equal(c1.status, 201);
assert.equal(c1.body.data.id, own); assert.equal(c1.body.data.tenant_id, A); assert.equal(c1.body.data.version, 1); assert.equal(c1.body.data.mapped, true);
assert.equal(c1.headers['X-Invalidate'], 'qc_inspections');
assert.deepEqual(hookCalls, ['create']);
assert.equal((await pg.query<{ notes: string }>('select notes from qc_inspections where id = $1', [own])).rows[0].notes, 'hook:QC-1');
assert.equal((await create('X', sa(), { doc_id: undefined })).status, 400, 'createSchema validates');
const cPlant = await create('QC-2', plant);
assert.equal(cPlant.body.data.plant_id, P1, 'plant defaults from actor');
await create('QC-3', sa(B));

// IDEMPOTENCY: same key+body replays 200, different body 409, no second row
const k = { 'idempotency-key': 'key-1' };
const i1 = await create('QC-IDEM', sa(), {}, k);
const i2 = await create('QC-IDEM', sa(), {}, k);
assert.equal(i1.status, 201); assert.equal(i2.status, 200); assert.equal(i2.headers['X-Cache'], 'IDEMPOTENT-HIT');
assert.equal(i2.body.data.id, i1.body.data.id);
assert.equal((await create('QC-OTHER', sa(), {}, k)).status, 409);
assert.equal((await pg.query<{ n: number }>(`select count(*)::int n from qc_inspections where inspection_no = 'QC-IDEM'`)).rows[0].n, 1);

await pg.query(`INSERT INTO qc_inspections (tenant_id, plant_id, inspection_no, doc_id, item_code) VALUES ($1,$2,'QC-P2','WO','CAP')`, [A, P2]);

// LIST / COUNT: envelope, tenant isolation, plant scope, search (bad search column ignored), no-store
const l1 = await call('GET', '/qc', sa(), { query: { limit: '2' } });
assert.equal(l1.body.data.length, 2); assert.equal(l1.body.meta.total, 4); assert.equal(l1.body.meta.hasMore, true);
assert.equal(l1.headers['Cache-Control'], 'no-store, no-cache, must-revalidate');
assert.equal((await call('GET', '/qc', sa(), { query: { search: 'qc-idem' } })).body.data.length, 1);
const seenByPlant = (await call('GET', '/qc', plant)).body.data.map((r: any) => r.inspection_no).sort();
assert.deepEqual(seenByPlant, ['QC-1', 'QC-2', 'QC-IDEM'], 'plant P1 actor sees P1 + plant-less rows, never P2');
assert.equal((await call('GET', '/qc', sa(B))).body.meta.total, 1);
assert.equal((await call('GET', '/qc/count', sa())).body.data.count, 4);
assert.equal((await call('GET', '/qc/count', sa(), { query: { search: 'QC-1' } })).body.data.count, 1);

// GET ONE: by uuid and natural key, mapRow applied, cross-tenant/plant 404
assert.equal((await call('GET', '/qc/:id', sa(), { params: { id: own } })).body.data.mapped, true);
assert.equal((await call('GET', '/qc/:id', sa(), { params: { id: 'QC-1' } })).body.data.id, own);
assert.equal((await call('GET', '/qc/:id', sa(B), { params: { id: own } })).status, 404);
assert.equal((await call('GET', '/qc/:id', plant, { params: { id: 'QC-P2' } })).status, 404, 'other plant is hidden');
assert.equal((await call('GET', '/qc/:id', plant, { params: { id: own } })).status, 200, 'plant-less row is visible');

// PATCH: OCC (200 then 409), 400 without version, 404, hook sees current row, tenant isolation
const p1 = await call('PATCH', '/qc/:id', sa(), { params: { id: 'QC-1' }, body: { version: 1, disposition: 'REJECTED' } });
assert.equal(p1.status, 200); assert.equal(p1.body.data.version, 2); assert.equal(p1.body.data.disposition, 'REJECTED'); assert.equal(p1.body.data.mapped, true);
assert.ok(hookCalls.includes('update:QC-1'));
assert.equal((await call('PATCH', '/qc/:id', sa(), { params: { id: 'QC-1' }, body: { version: 1, disposition: 'REWORK' } })).body.code, 'CONCURRENCY_CONFLICT');
assert.equal((await call('PATCH', '/qc/:id', sa(), { params: { id: 'QC-1' }, body: { disposition: 'REWORK' } })).status, 400);
assert.equal((await call('PATCH', '/qc/:id', sa(), { params: { id: 'NOPE' }, body: { version: 1 } })).status, 404);
assert.equal((await call('PATCH', '/qc/:id', sa(B), { params: { id: 'QC-1' }, body: { version: 2 } })).status, 404);

// HISTORY + DB-trigger audit (app code wrote nothing)
const h = await call('GET', '/qc/:id/history', sa(), { params: { id: 'QC-1' } });
assert.deepEqual(h.body.data.map((r: any) => r.action).sort(), ['CREATE', 'UPDATE']);
assert.ok(h.body.data.find((r: any) => r.action === 'UPDATE').changed_fields.includes('disposition'));
assert.equal((await call('GET', '/qc/:id/history', sa(B), { params: { id: 'QC-1' } })).status, 404);

// DELETE: hook runs, 204, then hidden; audit DELETE; cross-tenant 404
assert.equal((await call('DELETE', '/qc/:id', sa(B), { params: { id: 'QC-1' } })).status, 404);
assert.equal((await call('DELETE', '/qc/:id', sa(), { params: { id: 'QC-1' } })).status, 204);
assert.ok(hookCalls.includes('delete:QC-1'));
assert.equal((await call('GET', '/qc/:id', sa(), { params: { id: 'QC-1' } })).status, 404);
assert.equal((await call('GET', '/qc/count', sa())).body.data.count, 3);
assert.ok((await pg.query<{ action: string }>(`select action from audit_logs where entity_id = $1`, [own])).rows.some((r) => r.action === 'DELETE'));

console.log('core/resource.ts adapter: all assertions passed');
process.exit(0);
