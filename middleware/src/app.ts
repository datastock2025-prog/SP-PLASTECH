import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { etag } from 'hono/etag';
import { config } from './config.js';
import { createAuth } from './auth.js';
import { migrate } from './migrate.js';
import { bootstrap } from './bootstrap.js';
import { buildRouter } from './routes.js';
import { mapErrorToResponse } from './core/errors.js';
import { streamSSE } from 'hono/streaming';
import { csrfMiddleware, rateLimitMiddleware, requestLoggingMiddleware, requireSession } from './middleware/index.js';
import { subscribe } from './core/events.js';

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

// Runtime-agnostic HTTP app: used by the Node dev server and by Cloudflare Pages Functions.
export function buildApp(_sqlText?: string) {
  const auth = createAuth();
  const app = new Hono();

  app.use('*', requestLoggingMiddleware());
  app.use('*', secureHeaders());
  app.use('/api/*', etag());
  app.use('/api/*', cors({ origin: (o) => (config.trustedOrigins.includes(o) ? o : null), credentials: true }));
  app.use('/api/*', async (c, next) => {
    await next();
    if (!c.res.headers.has('Cache-Control')) {
      c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  });
  app.use('/api/*', rateLimitMiddleware());
  app.use('/api/*', csrfMiddleware());

  app.onError((err, c) => {
    const reqId = c.res.headers.get('X-Request-Id') || c.req.header('x-request-id') || crypto.randomUUID();
    const mapped = mapErrorToResponse(err, reqId);
    if (mapped.headers) {
      Object.entries(mapped.headers).forEach(([k, v]: [string, any]) => c.header(k, v));
    }
    if (mapped.status >= 500) {
      console.error(JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        request_id: reqId,
        method: c.req.method,
        path: c.req.path,
        status: mapped.status,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      }));
    }
    return c.json(mapped.body, mapped.status as any);
  });

  // Shallow liveness probe (no DB query, 200 OK)
  app.get('/health', (c) => c.json({ data: { status: 'ok' } }));

  // API health probe with DB query and Server-Timing header (D5)
  app.get('/api/health', async (c) => {
    const t0 = performance.now();
    try {
      const { getDrizzle } = await import('./db.js');
      const { sql } = await import('drizzle-orm');
      await getDrizzle().select({ one: sql`1` }).from(sql`(VALUES (1))`);
      const dur = Math.round((performance.now() - t0) * 10) / 10;
      c.header('Server-Timing', `db;dur=${dur};desc="queries=1"`);
      return c.json({ data: { status: 'ok' } });
    } catch (err: any) {
      return c.json({ error: { code: 'UNAVAILABLE', message: 'Database unreachable', details: err?.message } }, 503);
    }
  });

  // Deep readiness probe (executes SELECT 1 against active pool, 503 if unreachable)
  const readinessCheck = async (c: any) => {
    const t0 = performance.now();
    try {
      const { getDrizzle } = await import('./db.js');
      const { sql } = await import('drizzle-orm');
      await getDrizzle().select({ one: sql`1` }).from(sql`(VALUES (1))`);
      const dur = Math.round((performance.now() - t0) * 10) / 10;
      c.header('Server-Timing', `db;dur=${dur};desc="queries=1"`);
      return c.json({ data: { status: 'ready', db: 'connected' } });
    } catch (err: any) {
      return c.json({ error: { code: 'UNAVAILABLE', message: 'Database unreachable', details: err?.message } }, 503);
    }
  };
  app.get('/ready', readinessCheck);
  app.get('/api/ready', readinessCheck);

  // One-time provisioning of bootstrap tenant and first admin, protected by SETUP_TOKEN.
  app.post('/api/setup', async (c) => {
    const token = c.req.header('x-setup-token') ?? '';
    if (!config.setupToken || !safeEqual(token, config.setupToken)) {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Setup is disabled or the token is invalid' } }, 403);
    }
    const { verifySchemaVersion } = await import('./migrate.js');
    const schemaVersion = await verifySchemaVersion();
    const { tenantId } = await bootstrap();
    return c.json({ data: { status: 'provisioned', tenantId, schemaVersion } });
  });

  // Platform Standards Specification (Page 2): Client Error Ingestion (rate-limited, structured JSON logs)
  app.post('/api/v1/client-errors', async (c) => {
    try {
      const body = await c.req.json();
      const reqId = c.req.header('x-request-id') || crypto.randomUUID();
      const logEntry = {
        level: 'error',
        type: 'client_telemetry_error',
        timestamp: new Date().toISOString(),
        request_id: reqId,
        message: String(body?.message ?? 'Unknown client error').slice(0, 500),
        url: String(body?.url ?? '').slice(0, 200),
        component_stack: String(body?.componentStack ?? '').slice(0, 1000),
        client_ip: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local',
      };
      console.error(JSON.stringify(logEntry));
      return c.json({ data: { recorded: true, requestId: reqId } });
    } catch {
      return c.json({ data: { recorded: false } }, 400);
    }
  });

  app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

  // OpenAPI 3.1.0 Contract and Interactive Documentation (Part A2)
  app.get('/api/v1/openapi.json', async (c) => {
    const { openApiSpec } = await import('./openapi.js');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.json(openApiSpec);
  });
  app.get('/api/v1/docs', async (c) => {
    const { swaggerDocsHtml } = await import('./openapi.js');
    return c.html(swaggerDocsHtml);
  });

  // HTTP 304 ETag Cache Validation Middleware (Enterprise Checklist Item 2.1)
  app.use('/api/v1/*', etag());

  // Realtime change feed (G3). Lives outside buildRouter because the custom router buffers whole responses.
  app.get('/api/v1/events', async (c) => {
    const req: any = { headers: c.req.raw.headers, ip: null };
    await new Promise<void>((resolve, reject) => requireSession(auth)(req, null as any, (e) => (e ? reject(e) : resolve())));
    const tenantId: string = req.actor.tenantId;
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    c.header('X-Accel-Buffering', 'no');
    c.header('ETag', 'W/"sse"'); // hono etag() skips hashing (and so buffering) when ETag is already set
    return streamSSE(c, async (stream) => {
      const off = subscribe(tenantId, (e) => { void stream.writeSSE({ event: 'change', data: JSON.stringify({ table: e.table, id: e.id, op: e.op }) }); });
      stream.onAbort(off);
      while (!stream.aborted) {
        await stream.writeSSE({ event: 'ping', data: '' });
        await stream.sleep(25_000);
      }
      off();
    });
  });

  app.route('/api/v1', buildRouter(auth));

  app.notFound((c) => {
    const reqId = c.res.headers.get('X-Request-Id') || c.req.header('x-request-id') || crypto.randomUUID();
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint or resource not found',
        requestId: reqId,
      },
    }, 404);
  });

  return app;
}
