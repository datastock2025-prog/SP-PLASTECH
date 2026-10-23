import { PgDialect } from 'drizzle-orm/pg-core';
import { and } from 'drizzle-orm';
import assert from 'node:assert/strict';
import { qcInspections as t } from '../schema/erp.js';
import { encodeCursor } from './pagination.js';
import {
  cursorCondition, filterConditions, idCondition, parseListQuery, plantScope, searchCondition, snakeSelect, tenantScope, toValues,
} from './query.js';

const d = new PgDialect();
const render = (c: any) => d.sqlToQuery(c);
const must = <T>(v: T | undefined): T => { assert.ok(v); return v as T; };

// parseListQuery: bounded limit, sort allowlist
assert.equal(parseListQuery({ limit: '100' }, { sortable: ['created_at'] }).limit, 100);
assert.throws(() => parseListQuery({ limit: '101' }, { sortable: ['created_at'] }));
assert.equal(parseListQuery({ sortBy: 'drop table' }, { sortable: ['created_at'] }).sortBy, 'created_at');
assert.equal(parseListQuery({ includeTotal: 'false' }, { sortable: [] }).includeTotal, false);

// tenant scope always parameterised
{
  const r = render(tenantScope(t as any, 'T1'));
  assert.match(r.sql, /"tenant_id" = \$1/); assert.match(r.sql, /"deleted_at" is null/); assert.deepEqual(r.params, ['T1']);
}

// filters: allowlist, operators, no injection via keys
{
  const f = filterConditions(t, { disposition: 'in:ACCEPTED,REJECTED', 'filter[inspected_qty]': 'gte:5', evil: 'x', 'id; drop': '1' }, ['disposition', 'inspected_qty']);
  assert.equal(f.length, 2);
  const r = render(and(...f));
  assert.match(r.sql, /"disposition" in \(\$1, \$2\)/); assert.match(r.sql, /"inspected_qty" >= \$3/);
  assert.deepEqual(r.params, ['ACCEPTED', 'REJECTED', '5']);
  assert.equal(filterConditions(t, { created_at: 'gte:not-a-date' }, ['created_at']).length, 0);
}

// search escapes LIKE wildcards
{
  const r = render(must(searchCondition(t, '50%_x', ['item_code'])));
  assert.deepEqual(r.params, ['%50\\%\\_x%']);
}
assert.equal(searchCondition(t, '  ', ['item_code']), undefined);

// plant scope
assert.equal(plantScope(t, { tenantId: 'T', userId: 'U', roleCode: 'SUPER_ADMIN' }), undefined);
assert.match(render(must(plantScope(t, { tenantId: 'T', userId: 'U', activePlantId: 'P1' }))).sql, /"plant_id" is null or "qc_inspections"\."plant_id" = \$1/);
assert.match(render(must(plantScope(t, { tenantId: 'T', userId: 'U', plantIds: ['P1', 'P2'] }))).sql, /"plant_id" in \(\$1, \$2\)/);
assert.equal(render(must(plantScope(t, { tenantId: 'T', userId: 'U' }))).sql, 'false');

// cursor: timestamp column gets a Date, bad cursor ignored
{
  const cur = encodeCursor({ t: '2026-01-01T00:00:00.000Z', id: 'abc' });
  const r = render(must(cursorCondition((t as any).createdAt, (t as any).id, 'desc', cur)));
  assert.match(r.sql, /"created_at" < \$1/); assert.equal(r.params[0], '2026-01-01T00:00:00.000Z'); // Date coerced, then encoded by the column
  assert.equal(cursorCondition((t as any).createdAt, (t as any).id, 'desc', 'garbage'), undefined);
}

// id vs natural key
assert.match(render(idCondition(t as any, '11111111-1111-4111-8111-111111111111', 'inspection_no')).sql, /"id" = \$1/);
assert.match(render(idCondition(t as any, 'QC-001', 'inspection_no')).sql, /"inspection_no" = \$1/);
assert.equal(render(idCondition(t as any, 'QC-001')).sql, 'false');

// write mapping: snake -> camel; protected + unknown dropped; trimmed
assert.deepEqual(toValues(t, { item_code: ' A ', tenant_id: 'evil', version: 9, nope: 1, lot_number: null }), { itemCode: 'A', lotNumber: null });

// unknown column in projection fails fast
assert.throws(() => snakeSelect(t, ['item_code', 'no_such_col']));

console.log('core/query.ts: all assertions passed');
