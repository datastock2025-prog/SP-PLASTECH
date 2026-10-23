import { buildApp } from '../middleware/src/app.js';
import { identitySql } from '../middleware/src/identitySql.js';
import { configure, config } from '../middleware/src/config.js';
import { createPool, setGlobalPool } from '../middleware/src/db.js';

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
  HYPERDRIVE?: { connectionString: string };
  DATABASE_URL?: string;
  AUTH_DATABASE_URL?: string;
  SUPABASE_DATABASE_URL?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  AUTH_TRUSTED_ORIGINS?: string;
  SETUP_TOKEN?: string;
  [key: string]: any;
}

let cachedApp: ReturnType<typeof buildApp> | undefined;

function getApp() {
  if (!cachedApp) {
    cachedApp = buildApp(identitySql);
  }
  return cachedApp;
}

const edgeLimits = new Map<string, { count: number; reset: number }>();
function checkEdgeRateLimit(key: string, limit = 300, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = edgeLimits.get(key);
  if (!entry || entry.reset < now) {
    if (edgeLimits.size > 10000) edgeLimits.clear();
    edgeLimits.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  return ++entry.count > limit;
}

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-ancestors 'none';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function applySecurityHeaders(res: Response): Response {
  const newHeaders = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!newHeaders.has(k)) {
      newHeaders.set(k, v);
    }
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Edge rate limiting per client IP
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (checkEdgeRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60', ...SECURITY_HEADERS } }
      );
    }

    // API endpoints and health/ready probes execute through Worker middleware
    const isAppRoute =
      url.pathname.startsWith('/api/') ||
      url.pathname === '/health' ||
      url.pathname === '/ready';

    // Static assets handled by Cloudflare Static Assets binding with edge security headers
    if (!isAppRoute && env.ASSETS) {
      const assetRes = await env.ASSETS.fetch(request);
      return applySecurityHeaders(assetRes);
    }

    // Configure middleware with runtime environment variables
    configure({
      ...env,
      databaseUrl: env.HYPERDRIVE?.connectionString || env.AUTH_DATABASE_URL || env.DATABASE_URL || env.SUPABASE_DATABASE_URL,
    });

    // Create a connection pool scoped to this request
    const connStr = env.HYPERDRIVE?.connectionString || config.databaseUrl;
    const pool = createPool(connStr);
    setGlobalPool(pool);

    try {
      const app = getApp();
      const res = await app.fetch(request, env, ctx);
      return applySecurityHeaders(res);
    } finally {
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(pool.end().catch(() => {}));
      } else {
        pool.end().catch(() => {});
      }
    }
  },
};
