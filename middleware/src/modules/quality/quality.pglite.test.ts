import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { AppError } from '../../core/errors.js';
import { findOne, insertRow, listPage, softDelete, updateRow, type ScopedTable } from '../../core/query.js';
import * as schema from '../../schema/erp.js';

// Exercises the Drizzle helpers + the real audit-trigger migration against in-memory Postgres.
const table = schema.qcInspections as unknown as ScopedTable;
const COLS = ['id', 'inspection_no', 'item_code', 'disposition', 'inspected_qty', 'version', 'created_at'];
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const actor = (tenantId: string) => ({ tenantId, userId: 'u1', roleCode: 'SUPER_ADMIN' });

const pg = new PGlite();
const db = drizzle(pg, { schema }) as any;
await pg.exec(`
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
`);
await pg.exec(readFileSync(new URL('../../../../db/migrations/20261030000000_audit_trigger.sql', import.meta.url), 'utf8').split('-- migrate:down')[0]);

const mk = (n: string, tenant = A) =>
  insertRow(db, table, actor(tenant), { inspection_no: n, doc_id: 'WO-1', item_code: 'CAP', inspected_qty: '10', tenant_id: 'evil' }, COLS);

// create: tenant forced from actor, version starts at 1
const q1 = await mk('QC-1');
assert.equal(q1.version, 1);
assert.equal((await mk('QC-X', B)).inspection_no, 'QC-X');

// list: tenant isolation + search + pagination meta
const page = await listPage(db, table, actor(A), { search: 'qc-1', limit: '5' }, { columns: COLS, searchable: ['inspection_no'], sortable: ['created_at'] });
assert.equal(page.data.length, 1);
assert.equal(page.meta.total, 1);
assert.equal((await listPage(db, table, actor(A), {}, { columns: COLS, sortable: ['created_at'] })).meta.total, 1);

// get by natural key; cross-tenant is 404
assert.equal((await findOne(db, table, actor(A), 'QC-1', COLS, { naturalKey: 'inspection_no' })).id, q1.id);
await assert.rejects(() => findOne(db, table, actor(B), q1.id, COLS), (e: any) => e instanceof AppError && e.status === 404);

// OCC: stale version -> 409, fresh -> bumps version
const u = await updateRow(db, table, actor(A), q1.id, { disposition: 'REJECTED', version: 1 }, COLS);
assert.equal(u.version, 2);
await assert.rejects(() => updateRow(db, table, actor(A), q1.id, { disposition: 'REWORK', version: 1 }, COLS), (e: any) => e.status === 409);
await assert.rejects(() => updateRow(db, table, actor(A), q1.id, { disposition: 'REWORK' }, COLS), (e: any) => e.status === 400);

// soft delete hides the row
await softDelete(db, table, actor(A), q1.id);
await assert.rejects(() => findOne(db, table, actor(A), q1.id, COLS), (e: any) => e.status === 404);

// audit trigger wrote CREATE, UPDATE, DELETE for q1 (and nothing was written by app code)
const { rows } = await pg.query<{ action: string; changed_fields: string[] }>(
  `select action, changed_fields from audit_logs where entity_id = $1 order by performed_at, action`, [q1.id]);
assert.deepEqual(rows.map((r) => r.action).sort(), ['CREATE', 'DELETE', 'UPDATE']);
assert.ok(rows.find((r) => r.action === 'UPDATE')!.changed_fields.includes('disposition'));

console.log('quality.pglite: all assertions passed');
