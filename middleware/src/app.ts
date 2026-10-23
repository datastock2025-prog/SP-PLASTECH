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

const hits = new Map<string, { n: number; reset: number }>();
function limited(key: string, limit = 300, windowMs = 60_000) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  return ++h.n > limit;
}

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

  app.use('*', async (c, next) => {
    const t0 = performance.now();
    const reqId = c.req.header('x-request-id') || crypto.randomUUID();
    c.header('X-Request-Id', reqId);
    await next();
    const duration = Math.round((performance.now() - t0) * 10) / 10;
    const existingTiming = c.res.headers.get('Server-Timing') || c.res.headers.get('server-timing');
    const totalTiming = `total;dur=${duration}`;
    c.header('Server-Timing', existingTiming ? `${existingTiming}, ${totalTiming}` : totalTiming);

    // Structured JSON log for observability (Part A6 spec)
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
        client_ip: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local',
      };
      if (status >= 500) {
        console.error(JSON.stringify(logEntry));
      } else if (status >= 400) {
        console.warn(JSON.stringify(logEntry));
      } else {
        console.log(JSON.stringify(logEntry));
      }
    }
  });
  app.use('*', secureHeaders());
  app.use('/api/*', etag());
  app.use('/api/*', cors({ origin: (o) => (config.trustedOrigins.includes(o) ? o : null), credentials: true }));
  app.use('/api/*', async (c, next) => {
    await next();
    if (!c.res.headers.has('Cache-Control')) {
      c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  });
  app.use('/api/*', async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    if (limited(ip)) {
      return c.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } }, 429);
    }
    await next();
  });

  // CSRF defence-in-depth (OWASP ASVS L2: origin/referer verification and custom header requirement).
  const allowedOrigins = new Set([...config.trustedOrigins, config.baseURL]);
  app.use('/api/*', async (c, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
      // Exclude setup endpoint and client-errors telemetry
      if (c.req.path === '/api/setup' || c.req.path === '/api/v1/client-errors' || c.req.path.startsWith('/api/auth')) {
        return next();
      }

      const origin = c.req.header('origin');
      const referer = c.req.header('referer');
      const requestedWith = c.req.header('x-requested-with');

      if (origin) {
        if (!allowedOrigins.has(origin)) {
          return c.json({ error: { code: 'FORBIDDEN_ORIGIN', message: 'Cross-origin request refused' } }, 403);
        }
      } else if (referer) {
        try {
          const refOrigin = new URL(referer).origin;
          if (!allowedOrigins.has(refOrigin)) {
            return c.json({ error: { code: 'FORBIDDEN_REFERER', message: 'Cross-origin referer refused' } }, 403);
          }
        } catch {
          return c.json({ error: { code: 'FORBIDDEN_REFERER', message: 'Invalid referer header' } }, 403);
        }
      } else {
        // When neither Origin nor Referer is present (e.g. form posts or forged cross-origin contexts),
        // require custom X-Requested-With or Authorization header to prevent browser state change.
        if (requestedWith !== 'XMLHttpRequest' && !c.req.header('authorization')) {
          return c.json({ error: { code: 'CSRF_PROTECTION', message: 'State-changing requests must include Origin, Referer, or X-Requested-With' } }, 403);
        }
      }
    }
    await next();
  });

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
      const { pool } = await import('./db.js');
      await pool.query('SELECT 1');
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
      const { pool } = await import('./db.js');
      await pool.query('SELECT 1');
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
