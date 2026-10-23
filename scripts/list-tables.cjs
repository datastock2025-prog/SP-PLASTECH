const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://erp:erp_local_only@172.18.214.127:5432/erp',
  });
  await client.connect();
  const res = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log('Total tables in public schema:', res.rows.length);
  console.log(res.rows.map(r => r.table_name).join(', '));

  for (const row of res.rows) {
    try {
      const countRes = await client.query(`SELECT count(*)::int as cnt FROM public."${row.table_name}"`);
      console.log(`  ${row.table_name}: ${countRes.rows[0].cnt} rows`);
    } catch (e) {
      console.log(`  ${row.table_name}: [query error]`);
    }
  }

  await client.end();
}

main().catch(console.error);
