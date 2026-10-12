import pg from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';

const APP_ROLE = 'erp_app';
const als = new AsyncLocalStorage<pg.Pool>();
let globalPool: pg.Pool | undefined;

export const createPool = (connectionString: string) => new pg.Pool({ connectionString, max: 1 });
export const setGlobalPool = (p: pg.Pool) => { globalPool = p; };
export const getGlobalPool = () => globalPool;
// Cloudflare Workers cannot share sockets between requests, so each request runs with its own pool.
export const runWithPool = <T>(p: pg.Pool, fn: () => Promise<T>) => als.run(p, fn);
const current = () => {
  const p = als.getStore() ?? globalPool;
  if (!p) throw new Error('Database is not initialised');
  return p;
};

export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_t, key) {
    const p = current() as any;
    const v = p[key];
    return typeof v === 'function' ? v.bind(p) : v;
  },
  // Better Auth probes the pool shape while constructing, before any request-scoped pool exists.
  has: (_t, key) => key in (als.getStore() ?? globalPool ?? pg.Pool.prototype),
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
