import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { dispatchChange, subscribe, type ChangeEvent } from './events.js';

// Real erp_notify migration on in-memory Postgres -> dispatchChange -> tenant-filtered subscribers.
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const pg = new PGlite();
await pg.exec(`CREATE TABLE qc_inspections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, name text, deleted_at timestamptz)`);
await pg.exec(readFileSync(new URL('../../../db/migrations/20261031000000_erp_notify.sql', import.meta.url), 'utf8').split('-- migrate:down')[0]);

const gotA: ChangeEvent[] = []; const gotB: ChangeEvent[] = [];
const offA = subscribe(A, (e) => gotA.push(e));
subscribe(B, (e) => gotB.push(e));
await pg.listen('erp_changes', (payload) => dispatchChange(payload));

const [{ id }] = (await pg.query<{ id: string }>(`INSERT INTO qc_inspections (tenant_id, name) VALUES ($1,'x') RETURNING id`, [A])).rows;
await pg.query(`UPDATE qc_inspections SET name = 'y' WHERE id = $1`, [id]);
await pg.query(`UPDATE qc_inspections SET deleted_at = now() WHERE id = $1`, [id]);
await new Promise((r) => setTimeout(r, 50));

assert.deepEqual(gotA.map((e) => e.op), ['CREATE', 'UPDATE', 'DELETE']);
assert.ok(gotA.every((e) => e.table === 'qc_inspections' && e.id === id));
assert.equal(gotB.length, 0, 'other tenant receives nothing');

offA();
dispatchChange('not json'); dispatchChange(undefined); dispatchChange('{}'); // dropped, must not throw
await pg.query(`INSERT INTO qc_inspections (tenant_id) VALUES ($1)`, [A]);
await new Promise((r) => setTimeout(r, 50));
assert.equal(gotA.length, 3, 'unsubscribed');

console.log('core/events.ts + erp_notify trigger: all assertions passed');
process.exit(0);
