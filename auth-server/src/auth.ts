import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { jwt, username } from 'better-auth/plugins';
import { hash, verify, Algorithm } from '@node-rs/argon2';
import { config } from './config.js';
import { pool } from './db.js';

// OWASP-recommended Argon2id parameters (19 MiB, t=2, p=1).
const ARGON2_OPTS = { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (password: string) => hash(password, ARGON2_OPTS);
export const verifyPassword = async ({ hash: h, password }: { hash: string; password: string }) => {
  try {
    return await verify(h, password);
  } catch {
    return false;
  }
};

const MAX_FAILED_ATTEMPTS = 5;
const SIGN_IN_PATHS = new Set(['/sign-in/username', '/sign-in/email']);

async function findProfileByIdentifier(body: any) {
  const identifier = String(body?.username ?? body?.email ?? '').trim().toLowerCase();
  if (!identifier) return null;
  const { rows } = await pool.query(
    `SELECT p.user_id, p.status, p.failed_login_attempts
       FROM "user" u JOIN user_profiles p ON p.user_id = u.id
      WHERE p.deleted_at IS NULL AND (lower(u.email) = $1 OR lower(u.username) = $1)`,
    [identifier],
  );
  return rows[0] ?? null;
}

export function createAuth() {
  return betterAuth({
    appName: 'SP-PLASTECH ERP',
    database: pool,
    secret: config.secret,
    baseURL: config.baseURL,
    basePath: '/api/auth',
    trustedOrigins: config.trustedOrigins,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true, // accounts are provisioned by administrators only
      minPasswordLength: 10,
      maxPasswordLength: 128,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    session: {
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 15,
      cookieCache: { enabled: false },
    },
    rateLimit: { enabled: true, window: 60, max: 30, customRules: { '/sign-in/*': { window: 60, max: 8 } } },
    advanced: {
      useSecureCookies: config.isProd,
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: config.isProd },
    },
    plugins: [
      username({ minUsernameLength: 3, maxUsernameLength: 40 }),
      jwt({ jwt: { expirationTime: '15m', issuer: config.baseURL, audience: 'sp-plastech-erp' } }),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (!SIGN_IN_PATHS.has(ctx.path)) return;
        const profile = await findProfileByIdentifier(ctx.body);
        if (profile && profile.status !== 'ACTIVE') {
          throw new APIError('FORBIDDEN', { message: 'Account is locked or suspended. Contact your administrator.' });
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (!SIGN_IN_PATHS.has(ctx.path)) return;
        const profile = await findProfileByIdentifier(ctx.body);
        if (!profile) return;
        if (ctx.context.newSession) {
          await pool.query(
            `UPDATE user_profiles SET failed_login_attempts = 0, last_login_at = now(), last_login_ip = $2 WHERE user_id = $1`,
            [profile.user_id, ctx.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null],
          );
        } else {
          await pool.query(
            `UPDATE user_profiles
                SET failed_login_attempts = failed_login_attempts + 1,
                    status = CASE WHEN failed_login_attempts + 1 >= $2 THEN 'LOCKED' ELSE status END
              WHERE user_id = $1`,
            [profile.user_id, MAX_FAILED_ATTEMPTS],
          );
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
