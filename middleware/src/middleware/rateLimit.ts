import type { MiddlewareHandler } from 'hono';
import { extractClientIp } from '../core/ip.js';

const hits = new Map<string, { n: number; reset: number }>();

export function limited(key: string, limit = 300, windowMs = 60_000): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    if (hits.size > 5000) {
      for (const [k, v] of hits) {
        if (v.reset < now) hits.delete(k);
      }
      if (hits.size > 5000) {
        let toRemove = hits.size - 4000;
        for (const k of hits.keys()) {
          hits.delete(k);
          if (--toRemove <= 0) break;
        }
      }
    }
    hits.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  return ++h.n > limit;
}

export function rateLimitMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const ip = extractClientIp({ header: (n) => c.req.header(n), raw: c.req.raw, env: c.env as any });
    
    const path = c.req.path;
    const isAuthRoute = path.includes('/auth/sign-in') || path.includes('/auth/sign-up');
    
    const rateKey = isAuthRoute ? `auth:${ip}` : `ip:${ip}`;
    const maxLimit = isAuthRoute ? 20 : 300;

    if (limited(rateKey, maxLimit)) {
      return c.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } }, 429);
    }
    await next();
  };
}
