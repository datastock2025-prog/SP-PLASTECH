const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL || 'postgres://erp:erp_local_only@172.18.214.127:5432/erp';

async function run() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  console.log(`Connected to database at ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`);

  const res = await client.query('SELECT version FROM schema_migrations ORDER BY version');
  const applied = new Set(res.rows.map(x => x.version));

  const migrationsDir = path.resolve(__dirname, '../db/migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const version = file.split('_')[0];
    if (applied.has(version)) continue;

    console.log(`Applying migration: ${file}...`);
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const upPart = content.split('-- migrate:down')[0].replace('-- migrate:up', '');

    try {
      await client.query('BEGIN');
      await client.query(upPart);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING', [version]);
      await client.query('COMMIT');
      console.log(`  ✔ ${file} applied successfully.`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ❌ Failed applying ${file}:`, err.message);
      process.exit(1);
    }
  }

  console.log('🎉 All migrations applied successfully!');
  await client.end();
}

run().catch(console.error);
