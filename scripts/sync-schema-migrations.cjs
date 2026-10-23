const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://erp:erp_local_only@172.18.214.127:5432/erp',
  });
  await client.connect();
  const versions = [
    '20261017000000',
    '20261018000000',
    '20261019000000',
    '20261020000000',
    '20261021000000',
    '20261022000000',
  ];
  for (const v of versions) {
    await client.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING', [v]);
  }
  console.log('schema_migrations synced successfully!');
  await client.end();
}

main().catch(console.error);
