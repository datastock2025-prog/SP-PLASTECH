import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { jwt, username, twoFactor } from 'better-auth/plugins';
import { config } from '../../config.js';
import { pool, getDrizzle, schema } from '../../db.js';
import { hashPassword, verifyPassword } from '../../hash.js';
import { eq, and, or, isNull, sql } from 'drizzle-orm';

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
    const [row] = await getDrizzle()
      .select({
        minPasswordLength: schema.securityPolicies.minPasswordLength,
        requireUppercase: schema.securityPolicies.requireUppercase,
        requireLowercase: schema.securityPolicies.requireLowercase,
        requireNumbers: schema.securityPolicies.requireNumbers,
        requireSymbols: schema.securityPolicies.requireSymbols,
        passwordHistoryLimit: schema.securityPolicies.passwordHistoryLimit,
        lockoutThreshold: schema.securityPolicies.lockoutThreshold,
        lockoutDurationMinutes: schema.securityPolicies.lockoutDurationMinutes,
        sessionMaxAgeHours: schema.securityPolicies.sessionMaxAgeHours,
        idleTimeoutMinutes: schema.securityPolicies.idleTimeoutMinutes,
        mfaRequiredRoles: schema.securityPolicies.mfaRequiredRoles,
        ipAllowlist: schema.securityPolicies.ipAllowlist,
      })
      .from(schema.securityPolicies)
      .limit(1);

    if (row) {
      cachedPolicy = {
        minPasswordLength: Number(row.minPasswordLength || 10),
        requireUppercase: Boolean(row.requireUppercase ?? true),
        requireLowercase: Boolean(row.requireLowercase ?? true),
        requireNumbers: Boolean(row.requireNumbers ?? true),
        requireSymbols: Boolean(row.requireSymbols ?? true),
        passwordHistoryLimit: Number(row.passwordHistoryLimit ?? 3),
        lockoutThreshold: Number(row.lockoutThreshold || 5),
        lockoutDurationMinutes: Number(row.lockoutDurationMinutes || 15),
        sessionMaxAgeHours: Number(row.sessionMaxAgeHours || 8),
        idleTimeoutMinutes: Number(row.idleTimeoutMinutes || 30),
        mfaRequiredRoles: (row.mfaRequiredRoles as string[]) || [],
        ipAllowlist: (row.ipAllowlist as string[]) || [],
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
  const d = getDrizzle();
  const [row] = await d
    .select({
      user_id: schema.userProfiles.userId,
      tenant_id: schema.userProfiles.tenantId,
      status: schema.userProfiles.status,
      failed_login_attempts: schema.userProfiles.failedLoginAttempts,
      locked_until: schema.userProfiles.lockedUntil,
      role_code: schema.roles.code,
    })
    .from(schema.user)
    .innerJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.user.id))
    .leftJoin(schema.roles, eq(schema.roles.id, schema.userProfiles.roleId))
    .where(and(
      isNull(schema.userProfiles.deletedAt),
      or(
        sql`lower(${schema.user.email}) = ${identifier}`,
        sql`lower(${schema.user.username}) = ${identifier}`,
      ),
    ))
    .limit(1);
  return row ?? null;
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

        const d = getDrizzle();
        if (profile.locked_until && new Date(profile.locked_until).getTime() <= Date.now()) {
          await d
            .update(schema.userProfiles)
            .set({ status: 'ACTIVE', failedLoginAttempts: 0, lockedUntil: null })
            .where(eq(schema.userProfiles.userId, profile.user_id));
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

        let identifierHash = 'unknown';
        if (identifier) {
          const encoder = new TextEncoder();
          const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(identifier));
          identifierHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
        }

        const d = getDrizzle();
        if (ctx.context.newSession) {
          if (profile) {
            await d
              .update(schema.userProfiles)
              .set({
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
                lastLoginIp: ip,
              })
              .where(eq(schema.userProfiles.userId, profile.user_id));

            await d
              .insert(schema.loginEvents)
              .values({
                tenantId: profile.tenant_id,
                userId: profile.user_id,
                identifierHash,
                success: true,
                reason: 'SIGN_IN_SUCCESS',
                ip,
                userAgent,
              });
          }
        } else {
          if (profile) {
            const nextAttempts = (profile.failed_login_attempts || 0) + 1;
            const isLockout = nextAttempts >= policy.lockoutThreshold;
            await d
              .update(schema.userProfiles)
              .set({
                failedLoginAttempts: nextAttempts,
                status: isLockout ? 'LOCKED' : profile.status,
                lockedUntil: isLockout ? sql`now() + (${policy.lockoutDurationMinutes} || ' minutes')::interval` : profile.locked_until,
              })
              .where(eq(schema.userProfiles.userId, profile.user_id));

            await d
              .insert(schema.loginEvents)
              .values({
                tenantId: profile.tenant_id,
                userId: profile.user_id,
                identifierHash,
                success: false,
                reason: isLockout ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
                ip,
                userAgent,
              });
          } else {
            await d
              .insert(schema.loginEvents)
              .values({
                tenantId: null as any,
                userId: null,
                identifierHash,
                success: false,
                reason: 'USER_NOT_FOUND',
                ip,
                userAgent,
              });
          }
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
