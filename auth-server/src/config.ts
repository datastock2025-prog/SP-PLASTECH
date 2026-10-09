import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

// A random secret is persisted on first run so dev sessions survive restarts.
// Production MUST provide BETTER_AUTH_SECRET explicitly.
function resolveSecret(): string {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('BETTER_AUTH_SECRET is required in production');
  }
  const file = resolve(root, '.dev-secret');
  if (existsSync(file)) return readFileSync(file, 'utf8').trim();
  const secret = randomBytes(48).toString('hex');
  writeFileSync(file, secret, { mode: 0o600 });
  return secret;
}

const port = Number(process.env.AUTH_PORT ?? 4000);

export const config = {
  root,
  isProd: process.env.NODE_ENV === 'production',
  port,
  secret: resolveSecret(),
  baseURL: process.env.BETTER_AUTH_URL ?? `http://localhost:${port}`,
  trustedOrigins: (process.env.AUTH_TRUSTED_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  databaseUrl: process.env.AUTH_DATABASE_URL || '',
  embeddedPgPort: Number(process.env.EMBEDDED_PG_PORT ?? 54329),
  tenantCode: process.env.TENANT_CODE ?? 'SP-PLASTECH',
  tenantName: process.env.TENANT_NAME ?? 'SP-PLASTECH Polymer Solutions',
  bootstrapAdmin: {
    email: process.env.BOOTSTRAP_ADMIN_EMAIL ?? '',
    username: process.env.BOOTSTRAP_ADMIN_USERNAME ?? 'admin',
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? '',
    name: process.env.BOOTSTRAP_ADMIN_NAME ?? 'System Administrator',
  },
};
