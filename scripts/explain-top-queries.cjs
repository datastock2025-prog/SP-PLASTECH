const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL || 'postgres://erp:erp_local_only@172.18.214.127:5432/erp';

const queries = [
  {
    name: 'Item Code Prefix Search (B-Tree text_pattern_ops)',
    sql: "EXPLAIN (ANALYZE, BUFFERS) SELECT id, code, name FROM public.items WHERE code LIKE 'FG-%' LIMIT 20;"
  },
  {
    name: 'Item Name Substring Fuzzy Search (GIN Trigram)',
    sql: "EXPLAIN (ANALYZE, BUFFERS) SELECT id, code, name FROM public.items WHERE name ILIKE '%cap%' LIMIT 20;"
  },
  {
    name: 'Customer Name Substring Search (GIN Trigram)',
    sql: "EXPLAIN (ANALYZE, BUFFERS) SELECT id, code, name FROM public.customers WHERE name ILIKE '%auto%' LIMIT 20;"
  },
  {
    name: 'Supplier Prefix Search (B-Tree text_pattern_ops)',
    sql: "EXPLAIN (ANALYZE, BUFFERS) SELECT id, code, name FROM public.suppliers WHERE code LIKE 'SUP-%' LIMIT 20;"
  },
  {
    name: 'Items Paginated by Category & Status',
    sql: "EXPLAIN (ANALYZE, BUFFERS) SELECT id, code, name, stock FROM public.items WHERE category = 'Raw Material' AND status = 'active' LIMIT 50;"
  }
];

async function runExplainBenchmark() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  console.log('Connected to local Podman database for EXPLAIN query analysis.\n');

  for (const q of queries) {
    console.log(`================================================================================`);
    console.log(`Query: ${q.name}`);
    console.log(`SQL: ${q.sql}`);
    console.log(`--------------------------------------------------------------------------------`);
    try {
      const res = await client.query(q.sql);
      const plan = res.rows.map(r => r['QUERY PLAN']).join('\n');
      console.log(plan);
    } catch (err) {
      console.error(`Error explaining query: ${err.message}`);
    }
    console.log(`\n`);
  }

  await client.end();
  console.log('EXPLAIN query analysis complete.');
}

runExplainBenchmark();
