import { Hono, type Context } from 'hono';

// Minimal Express-style router on top of Hono so the same route code runs on
// Node and on Cloudflare Workers (no Express / node:http dependency).
export interface Req {
  actor?: any;
  body: any;
  params: Record<string, string>;
  query: Record<string, string>;
  path: string;
  method: string;
  ip: string | null;
  headers: Headers;
}

export interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  end(): void;
}

export type Next = (err?: unknown) => void;
export type Handler = (req: Req, res: Res, next: Next) => unknown;
export type ErrorHandler = (err: any, req: Req, res: Res, next: Next) => unknown;

const DONE = Symbol('done');

export function createRouter(errorHandler: ErrorHandler) {
  type Entry = { method: string | null; pattern: RegExp | null; keys: string[]; handlers: Handler[] };
  const entries: Entry[] = [];

  const compile = (path: string) => {
    const keys: string[] = [];
    const src = path.replace(/:(\w+)/g, (_m, k) => (keys.push(k), '([^/]+)'));
    return { pattern: new RegExp(`^${src}/?$`), keys };
  };

  const add = (method: string | null, path: string | null, handlers: Handler[]) => {
    const c = path ? compile(path) : { pattern: null, keys: [] as string[] };
    entries.push({ method, pattern: c.pattern, keys: c.keys, handlers });
  };

  const api = {
    use: (...h: Handler[]) => add(null, null, h),
    get: (p: string, ...h: Handler[]) => add('GET', p, h),
    post: (p: string, ...h: Handler[]) => add('POST', p, h),
    put: (p: string, ...h: Handler[]) => add('PUT', p, h),
    patch: (p: string, ...h: Handler[]) => add('PATCH', p, h),
    delete: (p: string, ...h: Handler[]) => add('DELETE', p, h),
  };

  const dispatch = async (c: Context, relPath: string): Promise<Response> => {
    const method = c.req.method;
    let body: any = {};
    if (!['GET', 'HEAD', 'DELETE'].includes(method)) {
      const text = await c.req.text();
      if (text.length > 100_000) {
        return c.json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } }, 413);
      }
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON body' } }, 400);
        }
      }
    }
    const req: Req = {
      body,
      params: {},
      query: Object.fromEntries(new URL(c.req.url).searchParams),
      path: relPath,
      method,
      ip: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      headers: c.req.raw.headers,
    };
    let response: Response | undefined;
    const res: Res = {
      status(code) {
        (res as any)._code = code;
        return res;
      },
      json(b) {
        response = c.json(b as any, ((res as any)._code ?? 200) as any);
      },
      end() {
        response = new Response(null, { status: (res as any)._code ?? 200 });
      },
    };

    const run = async (handlers: Handler[]): Promise<void> => {
      for (const h of handlers) {
        let advanced = false;
        let failure: unknown = DONE;
        await new Promise<void>((resolve) => {
          const next: Next = (err) => {
            advanced = true;
            if (err !== undefined) failure = err;
            resolve();
          };
          Promise.resolve()
            .then(() => h(req, res, next))
            .then(() => { if (response) resolve(); }, (e) => { failure = e; resolve(); });
        });
        if (failure !== DONE) throw failure;
        if (response || !advanced) return;
      }
    };

    try {
      for (const e of entries) {
        if (response) break;
        if (e.method && e.method !== method) continue;
        if (e.pattern) {
          const m = e.pattern.exec(relPath);
          if (!m) continue;
          req.params = Object.fromEntries(e.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
        }
        await run(e.handlers);
      }
    } catch (err) {
      response = undefined;
      await errorHandler(err, req, res, () => {});
    }
    return response ?? new Response(null, { status: 404 });
  };

  const app = new Hono();
  app.all('*', (c) => dispatch(c, new URL(c.req.url).pathname.replace(/^\/api\/v1/, '') || '/'));
  return { ...api, app };
}
