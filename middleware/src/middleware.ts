import type { Next, Req as Request, Res as Response } from './router.js';
import type { Auth } from './auth.js';
import { getSecurityPolicy } from './auth.js';
import { buildAbility, type AppAbility, type Action, type Subject, type StoredRule } from './ability.js';
import { pool } from './db.js';
import { AppError, mapErrorToResponse } from './core/errors.js';
export { AppError };

export interface Actor {
  userId: string;
  tenantId: string;
  sessionId: string;
  roleCode: string;
  roleId: string;
  fullName: string;
  email: string;
  username: string | null;
  mustChangePassword: boolean;
  activePlantId: string | null;
  activeShift: string | null;
  plantIds: string[];
  rules: StoredRule[];
  ability: AppAbility;
  ip: string | null;
}

const sessionActorCache = new Map<string, { actorData: any; expiresAt: number }>();

export function invalidateActorSession(sessionId?: string) {
  if (sessionId) sessionActorCache.delete(sessionId);
  else sessionActorCache.clear();
}

export function requireSession(auth: Auth) {
  return async (req: Request, _res: Response, next: Next) => {
    try {
      const s = await auth.api.getSession({ headers: req.headers });
      if (!s) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');

      const now = Date.now();
      const policy = await getSecurityPolicy();

      // Check session idle timeout (ASVS L2)
      if (policy.idleTimeoutMinutes > 0 && s.session.updatedAt) {
        const lastActive = new Date(s.session.updatedAt).getTime();
        if (now - lastActive > policy.idleTimeoutMinutes * 60 * 1000) {
          throw new AppError(401, 'SESSION_EXPIRED', 'Session expired due to inactivity. Please sign in again.');
        }
      }

      // Check max session lifetime (ASVS L2)
      if (policy.sessionMaxAgeHours > 0 && s.session.createdAt) {
        const sessionCreated = new Date(s.session.createdAt).getTime();
        if (now - sessionCreated > policy.sessionMaxAgeHours * 60 * 60 * 1000) {
          throw new AppError(401, 'SESSION_EXPIRED', 'Session maximum duration exceeded. Please sign in again.');
        }
      }

      // Check IP allowlist if policy has rules
      if (policy.ipAllowlist && policy.ipAllowlist.length > 0 && req.ip) {
        if (!policy.ipAllowlist.includes(req.ip)) {
          throw new AppError(403, 'IP_FORBIDDEN', 'Access from this IP address is not permitted by tenant security policy');
        }
      }

      const cached = sessionActorCache.get(s.session.id);
      let p = cached && cached.expiresAt > now ? cached.actorData : null;

      if (!p) {
        const { rows } = await pool.query(
          `SELECT p.tenant_id, p.role_id, p.full_name, p.status, p.must_change_password,
                  r.code AS role_code, r.permissions, u.email, u.username,
                  s.active_plant_id, s.active_shift,
                  COALESCE(up.plant_ids, '{}') AS plant_ids
             FROM user_profiles p
             JOIN roles r ON r.id = p.role_id
             JOIN "user" u ON u.id = p.user_id
             JOIN "session" s ON s.id = $2
             LEFT JOIN (
               SELECT pu.user_id, array_agg(pu.plant_id ORDER BY pu.plant_id) AS plant_ids
                 FROM plant_user pu
                GROUP BY pu.user_id
             ) up ON up.user_id = p.user_id
            WHERE p.user_id = $1 AND p.deleted_at IS NULL`,
          [s.user.id, s.session.id],
        );
        p = rows[0];
        if (p) {
          if (sessionActorCache.size > 2000) sessionActorCache.clear();
          sessionActorCache.set(s.session.id, { actorData: p, expiresAt: now + 10_000 });
        }
      }
      if (!p || p.status !== 'ACTIVE') throw new AppError(401, 'UNAUTHENTICATED', 'Account is not active');
      const rules = p.permissions as StoredRule[];
      req.actor = {
        userId: s.user.id,
        tenantId: p.tenant_id,
        sessionId: s.session.id,
        roleCode: p.role_code,
        roleId: p.role_id,
        fullName: p.full_name,
        email: p.email,
        username: p.username,
        mustChangePassword: p.must_change_password,
        activePlantId: p.active_plant_id,
        activeShift: p.active_shift,
        plantIds: p.plant_ids ?? [],
        rules,
        ability: buildAbility(rules, s.user.id),
        ip: req.ip,
      };
      next();
    } catch (e) {
      next(e);
    }
  };
}

// Blocks every action except changing the password while a forced change is pending.
export function enforcePasswordChange(req: Request, _res: Response, next: Next) {
  if (req.actor?.mustChangePassword && !req.path.startsWith('/me')) {
    return next(new AppError(403, 'PASSWORD_CHANGE_REQUIRED', 'You must change your password before continuing'));
  }
  next();
}

export const can = (action: Action, subject: Subject) => (req: Request, _res: Response, next: Next) => {
  if (!req.actor?.ability.can(action, subject)) {
    return next(new AppError(403, 'FORBIDDEN', `You are not permitted to ${action} ${subject}`));
  }
  next();
};

export function errorHandler(err: any, req: Request, res: Response, _next: Next) {
  const reqId = req.headers?.get?.('x-request-id') || crypto.randomUUID();
  res.setHeader('X-Request-Id', reqId);
  const mapped = mapErrorToResponse(err, reqId);
  if (mapped.headers) {
    Object.entries(mapped.headers).forEach(([k, v]) => res.setHeader(k, v));
  }

  if (mapped.status >= 500) {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      request_id: reqId,
      method: req.method,
      path: req.path,
      user_id: req.actor?.userId || 'anonymous',
      status: mapped.status,
      error: err?.message || String(err),
      stack: err?.stack,
    }));
  }

  return res.status(mapped.status).json(mapped.body);
}

export const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: Next) =>
    fn(req, res).catch(next);
