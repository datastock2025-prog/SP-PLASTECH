/**
 * Drizzle <-> database drift check. Fails when a column the Drizzle schema declares is missing in the live database
 * (the failure mode that breaks queries at runtime). Usage: DATABASE_URL=... npm run check:schema
 */
import pg from 'pg';
import { getTableColumns, is } from 'drizzle-orm';
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';
import * as schema from '../src/schema/index.js';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const client = new pg.Client({ connectionString: url });
await client.connect();
const { rows } = await client.query<{ t: string; c: string; type: string; nullable: string; def: string | null }>(
  `SELECT table_name t, column_name c, data_type type, is_nullable nullable, column_default def FROM information_schema.columns WHERE table_schema = 'public'`);
await client.end();
const db = new Map<string, Map<string, (typeof rows)[number]>>();
for (const r of rows) (db.get(r.t) ?? db.set(r.t, new Map()).get(r.t)!).set(r.c, r);

let bad = 0;
let checked = 0;
for (const v of Object.values(schema)) {
  if (!is(v, PgTable)) continue;
  const name = getTableConfig(v).name;
  const live = db.get(name);
  checked++;
  if (!live) { console.log(`MISSING TABLE  ${name}`); bad++; continue; }
  for (const col of Object.values(getTableColumns(v))) {
    const l = live.get(col.name);
    if (!l) { console.log(`MISSING COLUMN ${name}.${col.name}`); bad++; continue; }
    // NOT NULL in Drizzle without a default, but nullable in the DB, is only a typing drift: report softly.
    if (col.notNull && l.nullable === 'YES') console.log(`note: ${name}.${col.name} is NOT NULL in Drizzle but nullable in DB`);
  }
}
console.log(`${checked} tables checked, ${bad} drift problem(s)`);
process.exit(bad ? 1 : 0);
