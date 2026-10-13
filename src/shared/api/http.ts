import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
    public requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

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

  const { params: _params, headers: customHeaders, ...restOptions } = options || {};

  const headers: Record<string, string> = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...((customHeaders as Record<string, string>) || {}),
  };

  const res = await fetch(url, {
    method,
    credentials: 'include',
    cache: 'no-store',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...restOptions,
  });

  if (res.status === 204) {
    return null as T;
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON response (e.g. gateway error or empty payload)
  }

  if (!res.ok) {
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
