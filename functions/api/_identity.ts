import { configure } from '../../auth-server/src/config';
import { createPool, runWithPool } from '../../auth-server/src/db';
import { buildApp } from '../../auth-server/src/app';
import { identitySql } from '../../auth-server/src/identitySql';

export interface IdentityEnv {
  AUTH_DATABASE_URL?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  AUTH_TRUSTED_ORIGINS?: string;
  BOOTSTRAP_ADMIN_EMAIL?: string;
  BOOTSTRAP_ADMIN_USERNAME?: string;
  BOOTSTRAP_ADMIN_PASSWORD?: string;
  SETUP_TOKEN?: string;
  [key: string]: unknown;
}

const IDENTITY_V1 = /^\/api\/v1\/(me|roles|plants|users|system)(\/|$)/;

export const isIdentityPath = (p: string) =>
  p.startsWith('/api/auth/') || p === '/api/health' || p === '/api/setup' || IDENTITY_V1.test(p);

let app: ReturnType<typeof buildApp> | undefined;

export async function handleIdentity(request: Request, env: IdentityEnv, waitUntil: (p: Promise<unknown>) => void) {
  if (!env.AUTH_DATABASE_URL || !env.BETTER_AUTH_SECRET) {
    return Response.json(
      { error: { code: 'NOT_CONFIGURED', message: 'AUTH_DATABASE_URL and BETTER_AUTH_SECRET must be set in Cloudflare' } },
      { status: 503 },
    );
  }
  configure({
    ...env,
    APP_ENV: 'production',
    BETTER_AUTH_URL: env.BETTER_AUTH_URL ?? new URL(request.url).origin,
    AUTH_TRUSTED_ORIGINS: env.AUTH_TRUSTED_ORIGINS ?? new URL(request.url).origin,
  });

  // Workers cannot reuse sockets across requests, so every request gets its own single-connection pool.
  const pool = createPool(env.AUTH_DATABASE_URL);
  try {
    return await runWithPool(pool, async () => {
      // Built inside the pool scope: Better-Auth starts its schema check eagerly at construction.
      app ??= buildApp(identitySql);
      return app.fetch(request);
    });
  } finally {
    waitUntil(pool.end().catch(() => {}));
  }
}
