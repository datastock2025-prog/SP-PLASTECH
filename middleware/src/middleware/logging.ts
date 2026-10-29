import { extractClientIp } from '../core/ip.js';
import type { MiddlewareHandler } from 'hono';

export function requestLoggingMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const t0 = performance.now();
    const reqId = c.req.header('x-request-id') || crypto.randomUUID();
    c.header('X-Request-Id', reqId);
    await next();
    const duration = Math.round((performance.now() - t0) * 10) / 10;
    const existingTiming = c.res.headers.get('Server-Timing') || c.res.headers.get('server-timing');
    const totalTiming = `total;dur=${duration}`;
    c.header('Server-Timing', existingTiming ? `${existingTiming}, ${totalTiming}` : totalTiming);

    // Structured JSON log for observability
    const status = c.res.status;
    if (c.req.path.startsWith('/api/') && !c.req.path.endsWith('/health') && !c.req.path.endsWith('/ready')) {
      const actor = (c.req as any).actor || (c as any).get?.('actor');
      const serverTiming = c.res.headers.get('Server-Timing') || c.res.headers.get('server-timing') || '';
      const dbMatch = serverTiming.match(/db;dur=([\d.]+)/);
      const dbMs = dbMatch ? parseFloat(dbMatch[1]) : undefined;

      const logEntry = {
        level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
        timestamp: new Date().toISOString(),
        request_id: reqId,
        tenant_id: actor?.tenantId,
        user_id: actor?.userId,
        plant_id: actor?.activePlantId,
        method: c.req.method,
        path: c.req.path,
        status,
        duration_ms: duration,
        db_ms: dbMs,
        client_ip: extractClientIp({ header: (n) => c.req.header(n), raw: c.req.raw, env: c.env as any }),
      };
      if (status >= 500) {
        console.error(JSON.stringify(logEntry));
      } else if (status >= 400) {
        console.warn(JSON.stringify(logEntry));
      } else {
        console.log(JSON.stringify(logEntry));
      }
    }
  };
}
