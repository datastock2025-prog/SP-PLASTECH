import pg from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { config } from './config.js';
import * as schema from './schema/index.js';

export * as schema from './schema/index.js';

const APP_ROLE = 'erp_app';
let globalPool: pg.Pool | undefined;

export const createPool = (connectionString: string) => new pg.Pool({ connectionString, max: 10 });
export const setGlobalPool = (p: pg.Pool) => { globalPool = p; };
export const getGlobalPool = () => {
  if (!globalPool && config.databaseUrl) {
    globalPool = createPool(config.databaseUrl);
  }
  return globalPool;
};
export const runWithPool = async <T>(p: pg.Pool, fn: () => Promise<T>): Promise<T> => {
  setGlobalPool(p);
  return fn();
};

const current = () => {
  const p = getGlobalPool();
  if (!p) throw new Error('Database is not initialised');
  return p;
};

export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_t, key) {
    const p = current() as any;
    const v = p[key];
    return typeof v === 'function' ? v.bind(p) : v;
  },
  has: (_t, key) => key in (getGlobalPool() ?? pg.Pool.prototype),
});

export interface RequestContext {
  tenantId: string;
  userId: string;
}

// Runs fn in ONE transaction as the non-owner role so Row-Level Security is
// enforced, with the tenant/user bound as transaction-local settings.
export async function withTx<T>(ctx: RequestContext, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await current().connect();
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

export type DrizzleTransaction = NodePgDatabase<any>;

// Drizzle ORM transaction wrapper binding RLS settings via withTx
export async function withDrizzleTx<T>(
  ctx: RequestContext,
  fn: (tx: DrizzleTransaction, client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  return withTx(ctx, (client) => {
    const tx = drizzle(client, { schema });
    return fn(tx, client);
  });
}

