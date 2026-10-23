import { pool } from '../src/db.js';

async function main() {
  const r = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'items' 
    ORDER BY ordinal_position;
  `);
  console.log('Items columns:', r.rows.map((row: any) => `${row.column_name} (${row.data_type})`).join(', '));
  process.exit(0);
}

main().catch(console.error);
