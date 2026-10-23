const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: 'postgres://erp:erp_local_only@172.18.214.127:5432/erp' });
  await c.connect();
  const res = await c.query("SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'public.roles'::regclass");
  console.log('Constraints:', JSON.stringify(res.rows, null, 2));
  const idx = await c.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'roles'");
  console.log('Indexes:', JSON.stringify(idx.rows, null, 2));
  await c.end();
}

main().catch(err => { console.error(err); process.exit(1); });
