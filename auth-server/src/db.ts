import pg from 'pg';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from './config.js';

const APP_ROLE = 'erp_app';
export let pool: pg.Pool;
let stopEmbedded: (() => Promise<void>) | null = null;

// Uses AUTH_DATABASE_URL (Supabase/Postgres) when provided, otherwise a real
// embedded PostgreSQL instance persisted in ./.pgdata for local development.
export async function initDatabase(): Promise<void> {
  let connectionString = config.databaseUrl;

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
    connectionString = `postgres://postgres:postgres@localhost:${config.embeddedPgPort}/reboot_auth`;
  }

  pool = new pg.Pool({ connectionString, max: 10 });
  await pool.query('SELECT 1');
}

export async function closeDatabase(): Promise<void> {
  await pool?.end();
  await stopEmbedded?.();
}

export interface RequestContext {
  tenantId: string;
  userId: string;
}

// Runs fn in ONE transaction as the non-owner role so Row-Level Security is
// enforced, with the tenant/user bound as transaction-local settings.
export async function withTx<T>(ctx: RequestContext, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL ROLE ${APP_ROLE}`);
    await client.query(`SELECT set_config('app.tenant_id', $1, true), set_config('app.user_id', $2, true)`, [
      ctx.tenantId,
      ctx.userId,
    ]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
