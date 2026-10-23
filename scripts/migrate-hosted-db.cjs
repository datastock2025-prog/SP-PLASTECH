const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
} catch {}

async function migrateHostedDb() {
  let connectionString = process.env.SUPABASE_DATABASE_URL;
  if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
    connectionString = process.env.DATABASE_URL;
  }

  if (!connectionString) {
    console.error('Error: Neither SUPABASE_DATABASE_URL nor DATABASE_URL is defined.');
    process.exit(1);
  }

  // Obfuscate credentials for secure logging in CI/CD
  const safeLogUrl = connectionString.replace(/:[^:@]+@/, ':***@');
  console.log(`[migrate-hosted-db] Connecting to target database: ${safeLogUrl}`);

  const isCloud = connectionString.includes('supabase.com') || connectionString.includes('pooler.supabase.com');
  const client = new Client({
    connectionString,
    ssl: isCloud ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('[migrate-hosted-db] Connection established.');

    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch already applied migration versions
    const { rows } = await client.query('SELECT version FROM public.schema_migrations ORDER BY version ASC;');
    const appliedVersions = new Set(rows.map((r) => r.version));

    // 3. Scan db/migrations directory
    const migrationsDir = path.resolve(__dirname, '../db/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`[migrate-hosted-db] Discovered ${files.length} migration file(s).`);

    let appliedCount = 0;

    for (const file of files) {
      const version = file.split('_')[0];

      if (appliedVersions.has(version)) {
        console.log(`[migrate-hosted-db] Migration ${file} is already applied (skipped).`);
        continue;
      }

      console.log(`[migrate-hosted-db] Applying pending migration: ${file}...`);
      const fullPath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(fullPath, 'utf8');

      // Extract migrate:up segment if formatted with dbmate markers
      let upSql = sqlContent;
      if (sqlContent.includes('-- migrate:up')) {
        upSql = sqlContent.split('-- migrate:down')[0].replace('-- migrate:up', '');
      }

      await client.query('BEGIN');
      try {
        await client.query(upSql);
        await client.query('INSERT INTO public.schema_migrations (version) VALUES ($1)', [version]);
        await client.query('COMMIT');
        console.log(`[migrate-hosted-db] ✓ Successfully applied ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[migrate-hosted-db] ✗ Failed to apply ${file}:`, err);
        throw err;
      }
    }

    console.log(`[migrate-hosted-db] Complete! ${appliedCount} new migration(s) applied to hosted database.`);
  } catch (error) {
    console.error('[migrate-hosted-db] Fatal migration error:', error);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

migrateHostedDb();
