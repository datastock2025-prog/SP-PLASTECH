import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import pg from 'pg';
import { config } from './config.js';
import { setGlobalPool } from './db.js';

let stopEmbedded: (() => Promise<void>) | null = null;

// A random secret is persisted on first run so dev sessions survive restarts.
export function resolveDevSecret(): string {
  if (config.secret) return config.secret;
  if (config.isProd) throw new Error('BETTER_AUTH_SECRET is required in production');
  const file = resolve(config.root, '.dev-secret');
  if (existsSync(file)) return readFileSync(file, 'utf8').trim();
  const secret = randomBytes(48).toString('hex');
  writeFileSync(file, secret, { mode: 0o600 });
  return secret;
}

// Uses AUTH_DATABASE_URL (Supabase/Postgres) when provided, otherwise a real
// embedded PostgreSQL instance persisted in ./.pgdata for local development.
export async function initNodeDatabase(): Promise<void> {
  let connectionString: string | undefined = config.databaseUrl || undefined;
  let embeddedConn: pg.PoolConfig | undefined;

  if (!connectionString) {
    if (config.isProd) throw new Error('AUTH_DATABASE_URL is required in production');
    const { default: EmbeddedPostgres } = await import('embedded-postgres');
    const dataDir = resolve(config.root, '.pgdata');
    const initialised = existsSync(resolve(dataDir, 'PG_VERSION'));
    const server = new EmbeddedPostgres({
      databaseDir: dataDir,
      user: 'postgres',
      password: 'postgres',
      port: config.embeddedPgPort,
      persistent: true,
      onLog: (m: unknown) => { if (process.env.PG_DEBUG) console.log('[pg]', String(m)); },
      onError: (e: unknown) => console.error('[pg]', e),
    });
    if (!initialised) await server.initialise();
    await server.start();
    stopEmbedded = () => server.stop();
    const admin = new pg.Client({
      host: 'localhost',
      port: config.embeddedPgPort,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    });
    await admin.connect();
    const exists = await admin.query(`SELECT 1 FROM pg_database WHERE datname = 'reboot_auth'`);
    if (exists.rowCount === 0) await admin.query('CREATE DATABASE reboot_auth');
    await admin.end();
    embeddedConn = { host: 'localhost', port: config.embeddedPgPort, user: 'postgres', password: 'postgres', database: 'reboot_auth' };
  }

  const p = new pg.Pool({ ...(embeddedConn ?? { connectionString }), max: 10 });
  await p.query('SELECT 1');
  setGlobalPool(p);
}

export async function closeNodeDatabase(pool: pg.Pool): Promise<void> {
  await pool.end();
  await stopEmbedded?.();
}
