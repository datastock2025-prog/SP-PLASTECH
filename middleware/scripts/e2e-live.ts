// Live end-to-end check against a real migrated database (G0). Run with the server up on BASE and DATABASE_URL set.
import assert from 'node:assert/strict';
import pg from 'pg';
import { engineeringRoutes } from '../src/modules/engineering/routes.js';
import { financeRoutes } from '../src/modules/finance/routes.js';
import { hrRoutes } from '../src/modules/hr/routes.js';
import { maintenanceRoutes } from '../src/modules/maintenance/routes.js';
import { manufacturingRoutes } from '../src/modules/manufacturing/routes.js';
import { planningRoutes } from '../src/modules/planning/routes.js';
import { platformRoutes } from '../src/modules/platform/routes.js';
import { procurementRoutes } from '../src/modules/procurement/routes.js';
import { qualityRoutes } from '../src/modules/quality/routes.js';
import { salesRoutes } from '../src/modules/sales/routes.js';
import { warehouseRoutes } from '../src/modules/warehouse/routes.js';
import { workspaceRoutes } from '../src/modules/workspace/routes.js';

const BASE = process.env.BASE ?? 'http://localhost:4010';
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

// 1. sign in (bootstrap admin), clear the forced password change so the API is usable
await db.query(`UPDATE user_profiles SET must_change_password = false`);
const login = await fetch(`${BASE}/api/auth/sign-in/username`, {
  method: 'POST', headers: { 'content-type': 'application/json', origin: BASE },
  body: JSON.stringify({ username: 'admin', password: 'Verify#Pass12345' }),
});
assert.equal(login.status, 200, `login: ${login.status} ${await login.clone().text()}`);
const cookie = login.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
  fetch(`${BASE}/api/v1${path}`, { method, headers: { cookie, origin: BASE, 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });

// 2. SSE stream open before any mutation
const events: any[] = [];
const sse = await fetch(`${BASE}/api/v1/events`, { headers: { cookie } });
assert.equal(sse.status, 200); assert.match(sse.headers.get('content-type') ?? '', /text\/event-stream/);
void (async () => {
  const reader = sse.body!.getReader(); const dec = new TextDecoder(); let buf = '';
  for (;;) {
    const { value, done } = await reader.read(); if (done) return;
    buf += dec.decode(value);
    for (const block of buf.split('\n\n').slice(0, -1)) if (block.includes('event: change')) events.push(JSON.parse(block.split('data: ')[1]));
    buf = buf.split('\n\n').pop()!;
  }
})();

// 3. every GET list endpoint of every migrated module answers 200 with the envelope
const paths: string[] = [];
const fake = { get: (p: string) => { if (!p.includes(':')) paths.push(p); }, post() {}, patch() {}, delete() {}, put() {}, use() {} };
for (const m of [engineeringRoutes, financeRoutes, hrRoutes, maintenanceRoutes, manufacturingRoutes, planningRoutes, platformRoutes,
  procurementRoutes, qualityRoutes, salesRoutes, warehouseRoutes, workspaceRoutes]) { try { m(fake as any); } catch {} }
const failures: string[] = [];
let ok = 0;
for (const p of [...new Set(paths)]) {
  if (p.endsWith('/count') || p.includes('/search') || p.includes('/summary')) continue;
  const r = await call('GET', `${p}?limit=5`);
  if (r.status === 200) ok++; else failures.push(`${r.status} GET ${p} ${(await r.text()).slice(0, 140)}`);
}
console.log(`list endpoints: ${ok} ok, ${failures.length} failing`);
failures.forEach((f) => console.log('  FAIL', f));

// 4. full CRUD cycle on tables that previously had schema drift
async function cycle(base: string, create: object, patch: object) {
  const c = await call('POST', base, create);
  const cb: any = await c.json().catch(() => ({}));
  assert.equal(c.status, 201, `POST ${base}: ${c.status} ${JSON.stringify(cb)}`);
  const row = cb.data; assert.ok(row?.id, `POST ${base} returned no id`);
  const g = await call('GET', `${base}/${row.id}`); assert.equal(g.status, 200, `GET ${base}/id`);
  const u = await call('PATCH', `${base}/${row.id}`, { ...patch, version: row.version ?? 1 });
  assert.equal(u.status, 200, `PATCH ${base}: ${u.status} ${await u.clone().text()}`);
  const stale = await call('PATCH', `${base}/${row.id}`, { ...patch, version: row.version ?? 1 }); assert.equal(stale.status, 409, `stale PATCH ${base}`);
  const h = await call('GET', `${base}/${row.id}/history`); assert.equal(h.status, 200);
  const d = await call('DELETE', `${base}/${row.id}`); assert.equal(d.status, 204, `DELETE ${base}`);
  assert.equal((await call('GET', `${base}/${row.id}`)).status, 404);
  return row.id as string;
}
const results: Record<string, string> = {};
const tryCycle = async (name: string, base: string, create: object, patch: object) => {
  try { results[name] = await cycle(base, create, patch); console.log(`CRUD ok    ${base}`); }
  catch (e: any) { console.log(`CRUD FAIL  ${base}: ${e.message.slice(0, 300)}`); failures.push(base); }
};
await tryCycle('qc', '/qc-inspections', { inspection_no: `QC-E2E-${Date.now()}`, doc_id: 'WO-1', item_code: 'CAP', inspected_qty: '4' }, { disposition: 'REJECTED' });
await tryCycle('reason', '/reason-codes', { category: 'SCRAP', code: `E2E-${Date.now()}`, description: 'e2e' }, { description: 'e2e2' });
await tryCycle('param', '/system-parameters', { category: 'GENERAL', param_key: `E2E_${Date.now()}`, param_value: '1' }, { param_value: '2' });
await tryCycle('priv', '/privacy-requests', { request_type: 'DATA_PORTABILITY' }, { status: 'PROCESSING' });

// hr bulk import (Drizzle insertRow path)
{
  const empId = `E2E-EMP-${Date.now()}`;
  const imp = await call('POST', '/attendance/import', { records: [{ employee_id: empId, check_in: new Date().toISOString() }, { employee_id: empId, status: 'ABSENT', date: '2026-01-02' }] });
  const impBody: any = await imp.json().catch(() => ({}));
  if (imp.status !== 201 || impBody?.data?.imported !== 2) { failures.push(`attendance import: ${imp.status} ${JSON.stringify(impBody)}`); console.log('FAIL attendance import', imp.status, JSON.stringify(impBody)); }
  else {
    const r = await db.query(`SELECT count(*)::int n, min(version) v, count(created_by)::int cb FROM attendance_records WHERE employee_id = $1 AND tenant_id IS NOT NULL`, [empId]);
    assert.deepEqual([r.rows[0].n, r.rows[0].v, r.rows[0].cb], [2, 1, 2]);
    console.log('import ok  /attendance/import');
  }
}

// 5. DB-side audit rows exist for the whole cycle, and SSE delivered change events
await new Promise((r) => setTimeout(r, 400));
for (const [name, id] of Object.entries(results)) {
  const a = await db.query(`SELECT array_agg(action ORDER BY performed_at) acts FROM audit_logs WHERE entity_id = $1`, [id]);
  console.log(`audit ${name}: ${JSON.stringify(a.rows[0].acts)}`);
  assert.ok(a.rows[0].acts?.includes('CREATE') && a.rows[0].acts.includes('UPDATE') && a.rows[0].acts.includes('DELETE'), `audit trail for ${name}`);
}
console.log(`SSE change events received: ${events.length}`, [...new Set(events.map((e) => e.table))]);
assert.ok(events.length >= 8, 'SSE delivered events for create/update/delete');

console.log(failures.length ? `\n${failures.length} FAILURE(S)` : '\nE2E: all checks passed');
await db.end();
process.exit(failures.length ? 1 : 0);
