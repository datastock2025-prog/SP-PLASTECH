import type { MiddlewareHandler } from 'hono';
import { config } from '../config.js';

export function csrfMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
      if (c.req.path === '/api/setup' || c.req.path === '/api/v1/client-errors' || c.req.path.startsWith('/api/auth')) {
        return next();
      }

      const allowedOrigins = new Set([...config.trustedOrigins, config.baseURL]);
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
        if (requestedWith !== 'XMLHttpRequest' && !c.req.header('authorization')) {
          return c.json({ error: { code: 'CSRF_PROTECTION', message: 'State-changing requests must include Origin, Referer, or X-Requested-With' } }, 403);
        }
      }
    }
    await next();
  };
}
