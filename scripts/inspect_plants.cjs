const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: 'postgres://erp:erp_local_only@172.18.214.127:5432/erp' });
  await c.connect();
  const cols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plants'");
  console.log('Plants columns:', cols.rows);
  const tables = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('company_settings', 'warehouse_bins', 'shifts', 'holidays', 'transporters', 'numbering_series')");
  console.log('Existing target tables:', tables.rows);
  await c.end();
}

main().catch(err => { console.error(err); process.exit(1); });
