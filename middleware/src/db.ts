import pg from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { config } from './config.js';
import * as schema from './schema/index.js';

export * as schema from './schema/index.js';

const APP_ROLE = 'erp_app';
let globalPool: pg.Pool | undefined;

export const createPool = (connectionString: string) => {
  const isCloud = connectionString.includes('supabase.com') || connectionString.includes('sslmode=require');
  const p = new pg.Pool({
    connectionString,
    max: 20,
    ssl: isCloud ? { rejectUnauthorized: false } : undefined,
  });
  p.on('error', (err) => {
    console.error('[pg:pool error]', err?.message);
  });
  return p;
};
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

export interface TxOptions {
  readOnly?: boolean;
  timeoutMs?: number; // default 15000ms (15s); 60000ms (60s) for exports
}

// Runs fn in ONE transaction as the non-owner role so Row-Level Security is
// enforced, with role, tenant, user, and statement timeouts bound in ONE round trip.
export async function withTx<T>(
  ctx: RequestContext,
  fn: (c: pg.PoolClient) => Promise<T>,
  options?: TxOptions,
): Promise<T> {
  const client = await current().connect();
  let queryCount = 0;
  const originalQuery = client.query.bind(client);
  (client as any).query = async (...args: any[]) => {
    queryCount++;
    const t0 = performance.now();
    try {
      const res = await (originalQuery as any)(...args);
      const dur = Math.round((performance.now() - t0) * 10) / 10;
      if (dur > 500) {
        const queryText = typeof args[0] === 'string' ? args[0] : (args[0]?.text || 'unknown');
        const snippet = queryText.replace(/\s+/g, ' ').slice(0, 200);
        console.warn(JSON.stringify({
          level: 'warn',
          type: 'slow_query',
          timestamp: new Date().toISOString(),
          duration_ms: dur,
          query_snippet: snippet,
          param_count: Array.isArray(args[1]) ? args[1].length : 0,
          tenant_id: ctx.tenantId,
          user_id: ctx.userId,
        }));
      }
      return res;
    } catch (err) {
      const dur = Math.round((performance.now() - t0) * 10) / 10;
      if (dur > 500) {
        const queryText = typeof args[0] === 'string' ? args[0] : (args[0]?.text || 'unknown');
        console.warn(JSON.stringify({
          level: 'warn',
          type: 'slow_query_error',
          timestamp: new Date().toISOString(),
          duration_ms: dur,
          query_snippet: queryText.replace(/\s+/g, ' ').slice(0, 200),
          error: (err as any)?.message,
          tenant_id: ctx.tenantId,
          user_id: ctx.userId,
        }));
      }
      throw err;
    }
  };
  (client as any).getQueryCount = () => queryCount;

  try {
    await originalQuery(options?.readOnly ? 'BEGIN READ ONLY' : 'BEGIN');
    await originalQuery(
      `SELECT set_config('role', $1, true),
              set_config('app.tenant_id', $2, true),
              set_config('app.current_tenant_id', $2, true),
              set_config('app.user_id', $3, true),
              set_config('app.current_user_id', $3, true),
              set_config('statement_timeout', $4, true),
              set_config('lock_timeout', '10000', true),
              set_config('idle_in_transaction_session_timeout', '60000', true)`,
      [APP_ROLE, ctx.tenantId, ctx.userId, String(options?.timeoutMs ?? 30000)],
    );
    const result = await fn(client);
    await originalQuery('COMMIT');
    return result;
  } catch (err) {
    await originalQuery('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.query = originalQuery;
    client.release();
  }
}

export type DrizzleTransaction = NodePgDatabase<any>;

// Drizzle ORM transaction wrapper binding RLS settings via withTx
export async function withDrizzleTx<T>(
  ctx: RequestContext,
  fn: (tx: DrizzleTransaction, client: pg.PoolClient) => Promise<T>,
  options?: TxOptions,
): Promise<T> {
  return withTx(ctx, (client) => {
    const tx = drizzle(client, { schema });
    return fn(tx, client);
  }, options);
}

