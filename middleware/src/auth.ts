import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { jwt, username, twoFactor } from 'better-auth/plugins';
import { config } from './config.js';
import { pool } from './db.js';
import { hashPassword, verifyPassword } from './hash.js';

export { hashPassword, verifyPassword };

export interface SecurityPolicy {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  passwordHistoryLimit: number;
  lockoutThreshold: number;
  lockoutDurationMinutes: number;
  sessionMaxAgeHours: number;
  idleTimeoutMinutes: number;
  mfaRequiredRoles: string[];
  ipAllowlist: string[];
}

let cachedPolicy: SecurityPolicy | null = null;
let policyCachedAt = 0;

export async function getSecurityPolicy(): Promise<SecurityPolicy> {
  const now = Date.now();
  if (cachedPolicy && now - policyCachedAt < 60000) {
    return cachedPolicy;
  }
  try {
    const { rows } = await pool.query(
      `SELECT min_password_length, require_uppercase, require_lowercase, require_numbers, require_symbols,
              password_history_limit, lockout_threshold, lockout_duration_minutes,
              session_max_age_hours, idle_timeout_minutes, mfa_required_roles, ip_allowlist
         FROM security_policies
        LIMIT 1`
    );
    if (rows[0]) {
      cachedPolicy = {
        minPasswordLength: Number(rows[0].min_password_length || 10),
        requireUppercase: Boolean(rows[0].require_uppercase ?? true),
        requireLowercase: Boolean(rows[0].require_lowercase ?? true),
        requireNumbers: Boolean(rows[0].require_numbers ?? true),
        requireSymbols: Boolean(rows[0].require_symbols ?? true),
        passwordHistoryLimit: Number(rows[0].password_history_limit ?? 3),
        lockoutThreshold: Number(rows[0].lockout_threshold || 5),
        lockoutDurationMinutes: Number(rows[0].lockout_duration_minutes || 15),
        sessionMaxAgeHours: Number(rows[0].session_max_age_hours || 8),
        idleTimeoutMinutes: Number(rows[0].idle_timeout_minutes || 30),
        mfaRequiredRoles: rows[0].mfa_required_roles || [],
        ipAllowlist: rows[0].ip_allowlist || [],
      };
    } else {
      cachedPolicy = {
        minPasswordLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
        passwordHistoryLimit: 3,
        lockoutThreshold: 5,
        lockoutDurationMinutes: 15,
        sessionMaxAgeHours: 8,
        idleTimeoutMinutes: 30,
        mfaRequiredRoles: [],
        ipAllowlist: [],
      };
    }
  } catch {
    cachedPolicy = {
      minPasswordLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      passwordHistoryLimit: 3,
      lockoutThreshold: 5,
      lockoutDurationMinutes: 15,
      sessionMaxAgeHours: 8,
      idleTimeoutMinutes: 30,
      mfaRequiredRoles: [],
      ipAllowlist: [],
    };
  }
  policyCachedAt = now;
  return cachedPolicy;
}

export function validatePasswordPolicy(password: string, policy: SecurityPolicy): { valid: boolean; message?: string } {
  if (password.length < policy.minPasswordLength) {
    return { valid: false, message: `Password must be at least ${policy.minPasswordLength} characters long` };
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (policy.requireNumbers && !/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (policy.requireSymbols && !/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one symbol or special character' };
  }
  return { valid: true };
}

export function invalidateSecurityPolicyCache() {
  cachedPolicy = null;
  policyCachedAt = 0;
}

const SIGN_IN_PATHS = new Set(['/sign-in/username', '/sign-in/email']);

async function findProfileByIdentifier(body: any) {
  const identifier = String(body?.username ?? body?.email ?? '').trim().toLowerCase();
  if (!identifier) return null;
  const { rows } = await pool.query(
    `SELECT p.user_id, p.tenant_id, p.status, p.failed_login_attempts, p.locked_until, r.code as role_code
       FROM "user" u
       JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN roles r ON r.id = p.role_id
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
    rateLimit: {
      enabled: true,
      window: 60,
      max: config.isProd ? 30 : 1000,
      customRules: { '/sign-in/*': { window: 60, max: config.isProd ? 8 : 200 } },
    },
    advanced: {
      useSecureCookies: config.isProd,
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: config.isProd },
    },
    plugins: [
      username({ minUsernameLength: 3, maxUsernameLength: 40 }),
      jwt({ jwt: { expirationTime: '15m', issuer: config.baseURL, audience: 'sp-plastech-erp' } }),
      twoFactor({
        issuer: 'SP-PLASTECH ERP',
      }),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (!SIGN_IN_PATHS.has(ctx.path)) return;
        const profile = await findProfileByIdentifier(ctx.body);
        if (!profile) return;

        // Account Auto-unlock check: if locked_until has expired, auto-unlock
        if (profile.locked_until && new Date(profile.locked_until).getTime() <= Date.now()) {
          await pool.query(
            `UPDATE user_profiles SET status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL WHERE user_id = $1`,
            [profile.user_id]
          );
          profile.status = 'ACTIVE';
          profile.locked_until = null;
        }

        if (profile.status === 'LOCKED' || (profile.locked_until && new Date(profile.locked_until).getTime() > Date.now())) {
          throw new APIError('FORBIDDEN', { message: 'Account is temporarily locked due to consecutive failed attempts. Please try again later or contact your administrator.' });
        }

        if (profile.status !== 'ACTIVE') {
          throw new APIError('FORBIDDEN', { message: 'Account is suspended. Contact your administrator.' });
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (!SIGN_IN_PATHS.has(ctx.path)) return;
        const policy = await getSecurityPolicy();
        const profile = await findProfileByIdentifier(ctx.body);
        const ip = ctx.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
        const userAgent = ctx.headers?.get('user-agent') || null;
        const identifier = String(ctx.body?.username ?? ctx.body?.email ?? '').trim().toLowerCase();

        // Compute sha256 hash of identifier for audit logging without storing raw credentials
        let identifierHash = 'unknown';
        if (identifier) {
          const encoder = new TextEncoder();
          const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(identifier));
          identifierHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
        }

        if (ctx.context.newSession) {
          // Successful sign-in
          if (profile) {
            await pool.query(
              `UPDATE user_profiles
                  SET failed_login_attempts = 0,
                      locked_until = NULL,
                      last_login_at = now(),
                      last_login_ip = $2
                WHERE user_id = $1`,
              [profile.user_id, ip],
            );
            await pool.query(
              `INSERT INTO login_events (tenant_id, user_id, identifier_hash, success, reason, ip, user_agent)
               VALUES ($1, $2, $3, true, 'SIGN_IN_SUCCESS', $4, $5)`,
              [profile.tenant_id, profile.user_id, identifierHash, ip, userAgent],
            );
          }
        } else {
          // Failed sign-in attempt
          if (profile) {
            const nextAttempts = (profile.failed_login_attempts || 0) + 1;
            const isLockout = nextAttempts >= policy.lockoutThreshold;
            await pool.query(
              `UPDATE user_profiles
                  SET failed_login_attempts = $2,
                      status = CASE WHEN $3 = true THEN 'LOCKED' ELSE status END,
                      locked_until = CASE WHEN $3 = true THEN now() + ($4 || ' minutes')::interval ELSE locked_until END
                WHERE user_id = $1`,
              [profile.user_id, nextAttempts, isLockout, policy.lockoutDurationMinutes],
            );
            await pool.query(
              `INSERT INTO login_events (tenant_id, user_id, identifier_hash, success, reason, ip, user_agent)
               VALUES ($1, $2, $3, false, $4, $5, $6)`,
              [profile.tenant_id, profile.user_id, identifierHash, isLockout ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS', ip, userAgent],
            );
          } else {
            await pool.query(
              `INSERT INTO login_events (tenant_id, user_id, identifier_hash, success, reason, ip, user_agent)
               VALUES (NULL, NULL, $1, false, 'USER_NOT_FOUND', $2, $3)`,
              [identifierHash, ip, userAgent],
            );
          }
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
