import type { Next, Req as Request, Res as Response } from '../router.js';
import { AppError, mapErrorToResponse } from '../core/errors.js';

export { AppError };

export function errorHandler(err: any, req: Request, res: Response, _next: Next) {
  const reqId = req.headers?.get?.('x-request-id') || crypto.randomUUID();
  res.setHeader('X-Request-Id', reqId);
  const mapped = mapErrorToResponse(err, reqId);
  if (mapped.headers) {
    Object.entries(mapped.headers).forEach(([k, v]) => res.setHeader(k, v));
  }

  if (mapped.status >= 500) {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      request_id: reqId,
      method: req.method,
      path: req.path,
      user_id: req.actor?.userId || 'anonymous',
      status: mapped.status,
      error: err?.message || String(err),
      stack: err?.stack,
    }));
  }

  return res.status(mapped.status).json(mapped.body);
}
