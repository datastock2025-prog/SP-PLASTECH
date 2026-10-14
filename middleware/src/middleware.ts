import type { Next, Req as Request, Res as Response } from './router.js';
import { ZodError } from 'zod';
import type { Auth } from './auth.js';
import { buildAbility, type AppAbility, type Action, type Subject, type StoredRule } from './ability.js';
import { pool } from './db.js';

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

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
  rules: StoredRule[];
  ability: AppAbility;
  ip: string | null;
}

export function requireSession(auth: Auth) {
  return async (req: Request, _res: Response, next: Next) => {
    try {
      const s = await auth.api.getSession({ headers: req.headers });
      if (!s) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
      const { rows } = await pool.query(
        `SELECT p.tenant_id, p.role_id, p.full_name, p.status, p.must_change_password,
                r.code AS role_code, r.permissions, u.email, u.username,
                s.active_plant_id, s.active_shift
           FROM user_profiles p
           JOIN roles r ON r.id = p.role_id
           JOIN "user" u ON u.id = p.user_id
           JOIN "session" s ON s.id = $2
          WHERE p.user_id = $1 AND p.deleted_at IS NULL`,
        [s.user.id, s.session.id],
      );
      const p = rows[0];
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

export function errorHandler(err: any, _req: Request, res: Response, _next: Next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
    });
  }
  if (err?.code === '23505') {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'A record with the same unique value already exists', details: err.constraint } });
  }
  if (err?.code === '23514' || err?.code === '23503' || err?.code === '22P02') {
    return res.status(422).json({ error: { code: 'CONSTRAINT_VIOLATION', message: 'The data violates an integrity rule' } });
  }
  console.error('[error]', err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
}

export const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: Next) =>
    fn(req, res).catch(next);
