const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: 'postgres://erp:erp_local_only@172.18.214.127:5432/erp' });
  await c.connect();
  const tenantRes = await c.query('SELECT id FROM tenants LIMIT 1');
  const tenantId = tenantRes.rows[0].id;
  console.log('Testing next_doc_number for tenant:', tenantId);

  // Generate 5 consecutive work order numbers
  const results = [];
  for (let i = 0; i < 5; i++) {
    const res = await c.query('SELECT public.next_doc_number($1, $2, NULL) as doc_num', [tenantId, 'WO']);
    results.push(res.rows[0].doc_num);
  }
  console.log('Generated numbers:', results);
  await c.end();
}

main().catch(err => { console.error(err); process.exit(1); });
