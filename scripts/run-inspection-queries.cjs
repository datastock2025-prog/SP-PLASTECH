const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const LOCAL_DB_URL = process.env.DATABASE_URL || 'postgres://erp:erp_local_only@172.18.214.127:5432/erp';

async function main() {
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();

  console.log('Running 5 inspection queries on local Podman Postgres...');

  // 1. Duplicate & Redundant Indexes
  const q1 = await client.query(`
    SELECT
      pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
      i.indrelid::regclass AS table_name,
      i.indexrelid::regclass AS index_name,
      array_to_string(array_agg(a.attname), ', ') AS indexed_columns
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    GROUP BY i.indrelid, i.indexrelid, i.indkey
    HAVING count(*) > 1;
  `);

  // 2. Foreign Keys Without Covering Indexes
  const q2 = await client.query(`
    SELECT
      c.conrelid::regclass AS table_name,
      c.conname AS constraint_name,
      a.attname AS fk_column
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = c.conrelid
          AND i.indkey[0] = a.attnum
      );
  `);

  // 3. Unused Indexes
  const q3 = await client.query(`
    SELECT
      s.schemaname || '.' || s.relname AS table_name,
      s.indexrelname AS index_name,
      s.idx_scan AS scan_count,
      pg_size_pretty(pg_relation_size(s.indexrelid)) AS size
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.idx_scan = 0
      AND NOT i.indisunique
      AND NOT i.indisprimary
    ORDER BY pg_relation_size(s.indexrelid) DESC;
  `);

  // 4. Full-Table Scans on Tables
  const q4 = await client.query(`
    SELECT
      schemaname || '.' || relname AS table_name,
      seq_scan,
      seq_tup_read,
      idx_scan,
      n_live_tup
    FROM pg_stat_user_tables
    WHERE n_live_tup > 0
    ORDER BY seq_tup_read DESC;
  `);

  // 5. Top Statements
  let q5Rows = [];
  try {
    const q5 = await client.query(`
      SELECT
        substring(query, 1, 80) AS short_query,
        calls,
        round(total_exec_time::numeric, 2) AS total_time_ms,
        round(mean_exec_time::numeric, 2) AS mean_time_ms
      FROM pg_stat_statements
      ORDER BY total_exec_time DESC
      LIMIT 10;
    `);
    q5Rows = q5.rows;
  } catch (e) {
    q5Rows = [{ note: 'pg_stat_statements extension not active; enable in postgresql.conf' }];
  }

  await client.end();

  const content = `# SP-PLASTECH ERP — Database Performance & Index Baseline

**Execution Date**: ${new Date().toISOString().split('T')[0]}  
**Target Database**: Local Podman PostgreSQL 16 (\`sp-plastech-db\`)  
**Scope**: Five Read-Only DBA Inspection Queries per Enterprise Protocol P3.

---

## 1. Duplicate & Redundant Indexes
Identifies indexes sharing duplicate column definitions:
\`\`\`json
${JSON.stringify(q1.rows, null, 2)}
\`\`\`

---

## 2. Foreign Keys Without Covering Indexes
Identifies foreign keys missing lead-column index coverage:
\`\`\`json
${JSON.stringify(q2.rows, null, 2)}
\`\`\`

---

## 3. Unused Indexes
Indexes with zero scan counts that consume write overhead:
\`\`\`json
${JSON.stringify(q3.rows, null, 2)}
\`\`\`

---

## 4. Table Scans vs. Index Scans
Monitors sequential read distribution across populated tables:
\`\`\`json
${JSON.stringify(q4.rows, null, 2)}
\`\`\`

---

## 5. Slow Statements (pg_stat_statements)
Top statements by execution duration:
\`\`\`json
${JSON.stringify(q5Rows, null, 2)}
\`\`\`
`;

  const outPath = path.resolve(__dirname, '../docs/db-performance-baseline.md');
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`✅ Baseline saved to ${outPath}`);
}

main().catch(console.error);
