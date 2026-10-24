import type { Next, Req as Request, Res as Response } from '../router.js';
import type { Auth } from '../auth.js';
import { getSecurityPolicy } from '../auth.js';
import { buildAbility, type AppAbility, type StoredRule } from '../ability.js';
import { getDrizzle, schema } from '../db.js';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { AppError } from '../core/errors.js';

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
        const d = getDrizzle();
        const up = d
          .select({
            userId: schema.plantUser.userId,
            plantIds: sql<string[]>`array_agg(${schema.plantUser.plantId} ORDER BY ${schema.plantUser.plantId})`.as('plant_ids'),
          })
          .from(schema.plantUser)
          .groupBy(schema.plantUser.userId)
          .as('up');

        const [row] = await d
          .select({
            tenant_id: schema.userProfiles.tenantId,
            role_id: schema.userProfiles.roleId,
            full_name: schema.userProfiles.fullName,
            status: schema.userProfiles.status,
            must_change_password: schema.userProfiles.mustChangePassword,
            role_code: schema.roles.code,
            permissions: schema.roles.permissions,
            email: schema.user.email,
            username: schema.user.username,
            active_plant_id: schema.session.activePlantId,
            active_shift: schema.session.activeShift,
            plant_ids: sql<string[]>`COALESCE(${up.plantIds}, '{}')`,
          })
          .from(schema.userProfiles)
          .innerJoin(schema.roles, eq(schema.roles.id, schema.userProfiles.roleId))
          .innerJoin(schema.user, eq(schema.user.id, schema.userProfiles.userId))
          .innerJoin(schema.session, eq(schema.session.id, s.session.id))
          .leftJoin(up, eq(up.userId, schema.userProfiles.userId))
          .where(and(
            eq(schema.userProfiles.userId, s.user.id),
            isNull(schema.userProfiles.deletedAt),
          ));
        p = row;
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
