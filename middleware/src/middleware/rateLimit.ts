import type { MiddlewareHandler } from 'hono';

const hits = new Map<string, { n: number; reset: number }>();

export function limited(key: string, limit = 300, windowMs = 60_000): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  return ++h.n > limit;
}

export function rateLimitMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    if (limited(ip)) {
      return c.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } }, 429);
    }
    await next();
  };
}
