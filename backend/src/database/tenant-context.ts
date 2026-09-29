import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  tenantId: string;
  userId: string;
  userRole?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();
export const tenantStorage = requestContextStorage;

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export function runWithRequestContext<R>(context: RequestContext, fn: () => R): R {
  return requestContextStorage.run(context, fn);
}
