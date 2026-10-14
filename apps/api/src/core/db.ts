import pg from 'pg';

const APP_ROLE = 'erp_app';
let globalPool: pg.Pool | undefined;

export const createPool = (connectionString: string) => new pg.Pool({ connectionString, max: 10 });
export const setGlobalPool = (p: pg.Pool) => { globalPool = p; };
export const getGlobalPool = () => globalPool;
export const runWithPool = async <T>(p: pg.Pool, fn: () => Promise<T>): Promise<T> => {
  setGlobalPool(p);
  return fn();
};

const current = () => {
  if (!globalPool) throw new Error('Database is not initialised');
  return globalPool;
};

export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_t, key) {
    const p = current() as any;
    const v = p[key];
    return typeof v === 'function' ? v.bind(p) : v;
  },
  has: (_t, key) => key in (globalPool ?? pg.Pool.prototype),
});

export interface RequestContext {
  tenantId: string;
  userId: string;
}

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
