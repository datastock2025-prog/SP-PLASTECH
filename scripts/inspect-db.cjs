const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://erp:erp_local_only@172.18.214.127:5432/erp',
  });
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type, udt_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenants'
    ORDER BY ordinal_position;
  `);
  console.table(res.rows);
  await client.end();
}

main().catch(console.error);
