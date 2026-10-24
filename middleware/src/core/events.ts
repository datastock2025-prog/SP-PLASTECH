/**
 * Realtime change hub (G3). One dedicated Postgres connection LISTENs on `erp_changes` (fed by the
 * `erp_notify` trigger) and fans events out to SSE subscribers of the same tenant.
 *
 * shortcut: Node runtime only (Workers cannot hold a LISTEN connection) and single-process fan-out is
 * fine for one API instance; behind several instances every one listens, so it still works. Events carry
 * ids only and are tenant-filtered, not plant-filtered; clients refetch through the normal scoped API.
 */
import pg from 'pg';

export interface ChangeEvent { tenant_id: string; table: string; id: string; op: 'CREATE' | 'UPDATE' | 'DELETE' }
type Sub = { tenantId: string; send: (e: ChangeEvent) => void };

const subs = new Set<Sub>();

export function subscribe(tenantId: string, send: Sub['send']): () => void {
  const s = { tenantId, send };
  subs.add(s);
  return () => { subs.delete(s); };
}

/** Parse one NOTIFY payload and deliver it to that tenant's subscribers. Bad payloads are dropped. */
export function dispatchChange(payload: string | undefined): void {
  let e: ChangeEvent;
  try { e = JSON.parse(payload ?? ''); } catch { return; }
  if (!e?.tenant_id || !e.table) return;
  for (const s of subs) if (s.tenantId === e.tenant_id) s.send(e);
}

let stopped = false;
let client: pg.Client | undefined;

/** Starts the LISTEN connection; reconnects with backoff. Returns a stop function. */
export function startChangeListener(options: pg.ClientConfig): () => void {
  stopped = false;
  let delay = 1000;
  const connect = async () => {
    if (stopped) return;
    const c = new pg.Client(options);
    client = c;
    const retry = () => { if (client === c) { client = undefined; if (!stopped) setTimeout(connect, delay = Math.min(delay * 2, 30_000)); } };
    c.on('error', (err) => { console.error('[events] listener error', err.message); c.end().catch(() => {}); retry(); });
    c.on('end', retry);
    c.on('notification', (m) => dispatchChange(m.payload));
    try {
      await c.connect();
      await c.query('LISTEN erp_changes');
      delay = 1000;
    } catch (err) {
      console.error('[events] listen failed', (err as Error).message);
      c.end().catch(() => {});
      retry();
    }
  };
  void connect();
  return () => { stopped = true; const c = client; client = undefined; c?.end().catch(() => {}); };
}
