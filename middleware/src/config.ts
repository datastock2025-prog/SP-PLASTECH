import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import dotenv from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

if (typeof process !== 'undefined') {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    dotenv.config({ path: resolve(here, '../../.env') });
    dotenv.config({ path: resolve(here, '../.env') });
    dotenv.config();
  } catch {
    // Ignore in non-Node or restricted environments
  }
}

// T3 Env Schema for strict enterprise environment validation
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_ENV: z.string().optional(),
    PORT: z.coerce.number().default(4000),
    AUTH_PORT: z.coerce.number().optional(),
    BETTER_AUTH_SECRET: z.string().default(''),
    BETTER_AUTH_URL: z.string().optional(),
    AUTH_TRUSTED_ORIGINS: z.string().default('http://localhost:3000,http://127.0.0.1:3000'),
    DATABASE_URL: z.string().optional(),
    AUTH_DATABASE_URL: z.string().optional(),
    SUPABASE_DATABASE_URL: z.string().optional(),
    EMBEDDED_PG_PORT: z.coerce.number().default(54329),
    TENANT_CODE: z.string().default('SP-PLASTECH'),
    TENANT_NAME: z.string().default('SP-PLASTECH Polymer Solutions'),
    SETUP_TOKEN: z.string().default(''),
    BOOTSTRAP_ADMIN_EMAIL: z.string().default(''),
    BOOTSTRAP_ADMIN_USERNAME: z.string().default('admin'),
    BOOTSTRAP_ADMIN_PASSWORD: z.string().default(''),
    BOOTSTRAP_ADMIN_NAME: z.string().default('System Administrator'),
  },
  runtimeEnv: typeof process !== 'undefined' ? process.env : {},
});

// Runtime-agnostic configuration. On Node the values come from process.env / T3 env at
// start-up; on Cloudflare Workers `configure(env)` is called with the bindings.
const read = (rawEnv: Record<string, any>) => {
  const merged = { ...env, ...rawEnv };
  const port = Number(merged.PORT ?? merged.AUTH_PORT ?? 4000);
  return {
    isProd: merged.NODE_ENV === 'production' || merged.APP_ENV === 'production',
    port,
    secret: String(merged.BETTER_AUTH_SECRET ?? ''),
    baseURL: String(merged.BETTER_AUTH_URL ?? `http://localhost:${port}`),
    trustedOrigins: String(merged.AUTH_TRUSTED_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    databaseUrl: String(rawEnv.HYPERDRIVE?.connectionString ?? merged.AUTH_DATABASE_URL ?? merged.DATABASE_URL ?? merged.SUPABASE_DATABASE_URL ?? ''),
    embeddedPgPort: Number(merged.EMBEDDED_PG_PORT ?? 54329),
    tenantCode: String(merged.TENANT_CODE ?? 'SP-PLASTECH'),
    tenantName: String(merged.TENANT_NAME ?? 'SP-PLASTECH Polymer Solutions'),
    setupToken: String(merged.SETUP_TOKEN ?? ''),
    bootstrapAdmin: {
      email: String(merged.BOOTSTRAP_ADMIN_EMAIL ?? ''),
      username: String(merged.BOOTSTRAP_ADMIN_USERNAME ?? 'admin'),
      password: String(merged.BOOTSTRAP_ADMIN_PASSWORD ?? ''),
      name: String(merged.BOOTSTRAP_ADMIN_NAME ?? 'System Administrator'),
    },
  };
};

export const config = { root: '', ...read(typeof process !== 'undefined' ? process.env : {}) };

export function configure(rawEnv: Record<string, any>) {
  Object.assign(config, read(rawEnv));
  if (!config.secret) throw new Error('BETTER_AUTH_SECRET is required');
}

export function resolveDevSecret(): string {
  if (config.secret) return config.secret;
  if (config.isProd) throw new Error('BETTER_AUTH_SECRET is required in production');
  try {
    const file = resolve(config.root, '.dev-secret');
    if (existsSync(file)) return readFileSync(file, 'utf8').trim();
    const secret = randomBytes(48).toString('hex');
    writeFileSync(file, secret, { mode: 0o600 });
    return secret;
  } catch {
    return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  }
}
