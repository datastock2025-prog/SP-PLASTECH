import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { config } from './config.js';
import { createAuth } from './auth.js';
import { migrate } from './migrate.js';
import { bootstrap } from './bootstrap.js';
import { buildRouter } from './routes.js';

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
export function buildApp(sqlText: string) {
  const auth = createAuth();
  const app = new Hono();

  app.use('*', secureHeaders());
  app.use('/api/*', cors({ origin: (o) => (config.trustedOrigins.includes(o) ? o : null), credentials: true }));
  app.use('/api/*', async (c, next) => {
    await next();
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
  });
  app.use('/api/*', async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    if (limited(ip)) {
      return c.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, 429);
    }
    await next();
  });

  // CSRF defence-in-depth (cookies are already SameSite=Lax).
  const allowedOrigins = new Set([...config.trustedOrigins, config.baseURL]);
  app.use('/api/*', async (c, next) => {
    const origin = c.req.header('origin');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) && origin && !allowedOrigins.has(origin)) {
      return c.json({ error: { code: 'FORBIDDEN_ORIGIN', message: 'Cross-origin request refused' } }, 403);
    }
    await next();
  });

  app.onError((err, c) => {
    console.error('[error]', err);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } }, 500);
  });

  app.get('/api/health', (c) => c.json({ data: { status: 'ok' } }));

  // One-time provisioning of the identity schema and first admin, protected by SETUP_TOKEN.
  app.post('/api/setup', async (c) => {
    const token = c.req.header('x-setup-token') ?? '';
    if (!config.setupToken || !safeEqual(token, config.setupToken)) {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Setup is disabled or the token is invalid' } }, 403);
    }
    await migrate(auth, sqlText);
    const { tenantId } = await bootstrap();
    return c.json({ data: { status: 'provisioned', tenantId } });
  });

  app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  app.route('/api/v1', buildRouter(auth));
  return app;
}
