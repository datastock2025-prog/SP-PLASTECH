import { z } from 'zod';
import { queryClient } from '../queryClient.js';

export { ApiError } from './errors.js';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

class LruMap<K, V> {
  private max: number;
  private map: Map<K, V>;

  constructor(max: number = 200) {
    this.max = max;
    this.map = new Map<K, V>();
  }

  get(key: K): V | undefined {
    const item = this.map.get(key);
    if (item !== undefined) {
      this.map.delete(key);
      this.map.set(key, item);
    }
    return item;
  }

  set(key: K, value: V): this {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.max) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
    return this;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  invalidateMatching(predicate: (key: K) => boolean): void {
    for (const key of Array.from(this.map.keys())) {
      if (predicate(key)) {
        this.map.delete(key);
      }
    }
  }

  clear(): void {
    this.map.clear();
  }
}

const eTagStore = new LruMap<string, string>(200);
const eTagResponseStore = new LruMap<string, any>(200);

export async function request<T = any>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  let url = path;
  if (options?.params) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined && v !== null && v !== '') {
        sp.set(k, String(v));
      }
    }
    const qs = sp.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const { params: _params, timeoutMs = 15000, headers: customHeaders, ...restOptions } = options || {};

  const headers: Record<string, string> = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    'X-Requested-With': 'XMLHttpRequest',
    ...((customHeaders as Record<string, string>) || {}),
  };

  const isGet = method === 'GET' || method === 'HEAD';
  const savedEtag = isGet ? eTagStore.get(url) : null;
  if (savedEtag && !headers['If-None-Match']) {
    headers['If-None-Match'] = savedEtag;
  }

  const maxAttempts = isGet ? 2 : 1;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(new Error('Request timeout')), timeoutMs);

    try {
      const combinedSignal = options?.signal
        ? (typeof AbortSignal.any === 'function' ? AbortSignal.any([options.signal, controller.signal]) : options.signal)
        : controller.signal;

      const res = await fetch(url, {
        method,
        credentials: 'include',
        cache: 'no-store',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: combinedSignal,
        ...restOptions,
      });
      clearTimeout(timeoutTimer);

      // Handle write invalidations emitted by backend
      const invalidateHeader = res.headers.get('x-invalidate');
      if (invalidateHeader) {
        for (const r of invalidateHeader.split(',')) {
          const key = r.trim();
          if (key) {
            queryClient.invalidateQueries({ queryKey: [key] });
          }
        }
      }

      // On successful write mutation, purge matching cached ETags to avoid 304 stale returns
      if (!isGet && res.ok) {
        const basePath = path.split('?')[0].replace(/\/+$/, '');
        eTagStore.invalidateMatching((k) => k.startsWith(basePath) || basePath.startsWith(k.split('?')[0]));
        eTagResponseStore.invalidateMatching((k) => k.startsWith(basePath) || basePath.startsWith(k.split('?')[0]));
      }

      if (res.status === 304 && eTagResponseStore.has(url)) {
        return eTagResponseStore.get(url) as T;
      }

      if (res.status === 204) {
        return null as T;
      }

      let json: any = null;
      try {
        json = await res.json();
        if (isGet && res.ok && res.headers.get('etag')) {
          eTagStore.set(url, res.headers.get('etag')!);
          eTagResponseStore.set(url, json);
        }
      } catch {
        // Non-JSON response (e.g. gateway error or empty payload)
      }

      if (!res.ok) {
        // Retry on transient 502/503/504 for GET requests on first attempt
        if (isGet && attempt < maxAttempts && [502, 503, 504].includes(res.status)) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }

        const e = json?.error;
        const detail = Array.isArray(e?.details) && e.details[0]?.message ? `: ${e.details[0].message}` : '';
        const requestId = res.headers.get('x-request-id') || (typeof e === 'object' && e?.requestId) || undefined;

        throw new ApiError(
          res.status,
          typeof e === 'object' && e?.code ? e.code : 'HTTP_ERROR',
          typeof e === 'object' && e?.message
            ? `${e.message}${detail}`
            : res.status >= 500
            ? 'Server is unavailable. Please try again.'
            : 'Request failed',
          e?.details,
          requestId
        );
      }

      return json;
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      lastError = err;
      if (err instanceof ApiError) throw err;
      if (isGet && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }
      throw new ApiError(
        0,
        err.name === 'AbortError'
          ? (options?.signal?.aborted ? 'ABORTED' : 'TIMEOUT')
          : 'NETWORK_ERROR',
        err.message || 'Network request failed'
      );
    }
  }

  throw lastError;
}

export const one = <T extends z.ZodTypeAny>(schema: T, json: any): z.infer<T> => {
  return schema.parse(json && typeof json === 'object' && 'data' in json ? json.data : json);
};

export const page = <T extends z.ZodTypeAny>(
  schema: T,
  json: any
): { data: z.infer<T>[]; meta: { page: number; limit: number; total: number; totalPages: number } } => {
  const data = json && typeof json === 'object' && 'data' in json ? json.data : json;
  const meta = json && typeof json === 'object' && 'meta' in json ? json.meta : { page: 1, limit: 20, total: 0, totalPages: 1 };
  return {
    data: z.array(schema).parse(data ?? []),
    meta: {
      page: Number(meta?.page ?? 1),
      limit: Number(meta?.limit ?? 20),
      total: Number(meta?.total ?? 0),
      totalPages: Number(meta?.totalPages ?? 1),
    },
  };
};

export const http = {
  get: <T = any>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T = any>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  patch: <T = any>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  put: <T = any>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
  delete: <T = any>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
};

export interface HttpClient {
  get<T = any>(path: string, options?: RequestOptions): Promise<{ data: T; status: number }>;
  post<T = any>(path: string, body?: unknown, options?: RequestOptions): Promise<{ data: T; status: number }>;
  patch<T = any>(path: string, body?: unknown, options?: RequestOptions): Promise<{ data: T; status: number }>;
  put<T = any>(path: string, body?: unknown, options?: RequestOptions): Promise<{ data: T; status: number }>;
  delete<T = any>(path: string, options?: RequestOptions): Promise<{ data: T; status: number }>;
  interceptors: {
    request: { use: (...args: any[]) => void };
    response: { use: (...args: any[]) => void };
  };
}

export const createHttpClient = (baseURL = ''): HttpClient => {
  const normPath = (p: string) => {
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    const base = baseURL.replace(/\/+$/, '');
    const path = p.startsWith('/') ? p : `/${p}`;
    return `${base}${path}`;
  };

  return {
    get: async <T = any>(p: string, opt?: RequestOptions) => {
      const data = await http.get<T>(normPath(p), opt);
      return { data, status: 200 };
    },
    post: async <T = any>(p: string, body?: unknown, opt?: RequestOptions) => {
      const data = await http.post<T>(normPath(p), body, opt);
      return { data, status: 200 };
    },
    patch: async <T = any>(p: string, body?: unknown, opt?: RequestOptions) => {
      const data = await http.patch<T>(normPath(p), body, opt);
      return { data, status: 200 };
    },
    put: async <T = any>(p: string, body?: unknown, opt?: RequestOptions) => {
      const data = await http.put<T>(normPath(p), body, opt);
      return { data, status: 200 };
    },
    delete: async <T = any>(p: string, opt?: RequestOptions) => {
      const data = await http.delete<T>(normPath(p), opt);
      return { data, status: 200 };
    },
    interceptors: {
      request: { use: () => {} },
      response: { use: () => {} },
    },
  };
};
