// Runtime-agnostic configuration. On Node the values come from process.env at
// start-up; on Cloudflare Workers `configure(env)` is called with the bindings.
const read = (env: Record<string, any>) => {
  const port = Number(env.AUTH_PORT ?? 4000);
  return {
    isProd: env.NODE_ENV === 'production' || env.APP_ENV === 'production',
    port,
    secret: String(env.BETTER_AUTH_SECRET ?? ''),
    baseURL: String(env.BETTER_AUTH_URL ?? `http://localhost:${port}`),
    trustedOrigins: String(env.AUTH_TRUSTED_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    databaseUrl: String(env.AUTH_DATABASE_URL ?? ''),
    embeddedPgPort: Number(env.EMBEDDED_PG_PORT ?? 54329),
    tenantCode: String(env.TENANT_CODE ?? 'SP-PLASTECH'),
    tenantName: String(env.TENANT_NAME ?? 'SP-PLASTECH Polymer Solutions'),
    setupToken: String(env.SETUP_TOKEN ?? ''),
    bootstrapAdmin: {
      email: String(env.BOOTSTRAP_ADMIN_EMAIL ?? ''),
      username: String(env.BOOTSTRAP_ADMIN_USERNAME ?? 'admin'),
      password: String(env.BOOTSTRAP_ADMIN_PASSWORD ?? ''),
      name: String(env.BOOTSTRAP_ADMIN_NAME ?? 'System Administrator'),
    },
  };
};

export const config = { root: '', ...read(typeof process !== 'undefined' ? process.env : {}) };

export function configure(env: Record<string, any>) {
  Object.assign(config, read(env));
  if (!config.secret) throw new Error('BETTER_AUTH_SECRET is required');
}
