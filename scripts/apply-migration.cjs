const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL || 'postgres://erp:erp_local_only@172.18.214.127:5432/erp';

async function applyMigration() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  console.log(`Connected to database at ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`);

  const targetArg = process.argv[2] || '20261017000000_standard_business_tables_d3.sql';
  const migrationFile = path.resolve(__dirname, '../db/migrations', targetArg);
  const content = fs.readFileSync(migrationFile, 'utf8');

  // Extract migrate:up section
  const upPart = content.split('-- migrate:down')[0].replace('-- migrate:up', '');

  console.log('Executing migrate:up commands...');
  try {
    await client.query('BEGIN');
    await client.query(upPart);
    await client.query('COMMIT');
    console.log('Migration 20261016000000_index_cleanup.sql applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
