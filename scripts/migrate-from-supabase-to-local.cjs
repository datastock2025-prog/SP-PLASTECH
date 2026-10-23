const { Client } = require('pg');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gqrelwvmeoqvfnanoutz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_RN013pGcuejquwnEeW-n3Q_Ly2qVu2R';
const LOCAL_DB_URL = process.env.DATABASE_URL || 'postgres://erp:erp_local_only@172.18.214.127:5432/erp';

async function fetchAllRows(tableName) {
  const all = [];
  const pageSize = 500;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const end = offset + pageSize - 1;
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${offset}-${end}`,
      },
    });

    if (!res.ok) {
      console.warn(`[fetch] ${tableName} offset ${offset} failed: status ${res.status}`);
      break;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }
    all.push(...data);
    if (data.length < pageSize) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }
  return all;
}

async function migrate() {
  console.log('========================================================');
  console.log('🔄 MIGRATING MASTER DATA: SUPABASE CLOUD -> LOCAL PODMAN');
  console.log(`Source: ${SUPABASE_URL}`);
  console.log(`Target: ${LOCAL_DB_URL}`);
  console.log('========================================================\n');

  const pgClient = new Client({ connectionString: LOCAL_DB_URL });
  await pgClient.connect();

  const tables = ['warehouses', 'machines', 'customers', 'suppliers', 'items'];

  for (const table of tables) {
    console.log(`📥 Fetching ${table} from Supabase...`);
    const rows = await fetchAllRows(table);
    console.log(`   Found ${rows.length} rows.`);
    if (rows.length === 0) continue;

    // Get actual column names in local table
    const colRes = await pgClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
    `, [table]);
    const validCols = new Set(colRes.rows.map(r => r.column_name));
    console.log(`   Local columns (${validCols.size}):`, [...validCols].join(', '));

    console.log(`💾 Inserting ${rows.length} rows into local Podman Postgres...`);
    let inserted = 0;
    let errors = 0;

    for (const rawRow of rows) {
      // Map synonyms if any
      const row = { ...rawRow };
      if (!row.unit && row.uom) row.unit = row.uom;
      if (!row.cost && row.cost_price) row.cost = row.cost_price;
      if (!row.reorder_point && row.reorder_level) row.reorder_point = row.reorder_level;
      if (!row.code && row.machine_code) row.code = row.machine_code;
      if (!row.plant && row.plant_location) row.plant = row.plant_location;

      // Filter only columns that exist locally
      const keys = Object.keys(row).filter((k) => validCols.has(k) && row[k] !== undefined);
      if (keys.length === 0) continue;

      const values = keys.map((k) => {
        const val = row[k];
        if (val !== null && typeof val === 'object') {
          return JSON.stringify(val);
        }
        return val;
      });

      const colsStr = keys.map((k) => `"${k}"`).join(', ');
      const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
      const updates = keys
        .filter((k) => k !== 'id' && k !== 'code')
        .map((k) => `"${k}" = EXCLUDED."${k}"`)
        .join(', ');

      const conflictTarget = keys.includes('code') ? '(code)' : '(id)';
      const query = `
        INSERT INTO public."${table}" (${colsStr})
        VALUES (${placeholders})
        ON CONFLICT ${conflictTarget} DO UPDATE SET ${updates.length ? updates : 'id = EXCLUDED.id'}
      `;

      try {
        await pgClient.query(query, values);
        inserted++;
      } catch (err) {
        errors++;
        if (errors <= 3) {
          console.error(`   Error inserting ${table} row (${row.code || row.id}):`, err.message);
        }
      }
    }
    console.log(`   ✅ Successfully migrated ${inserted}/${rows.length} rows to ${table} (${errors} errors).\n`);
  }

  await pgClient.end();
  console.log('✨ Data migration to local Podman complete!');
}

migrate().catch(console.error);
