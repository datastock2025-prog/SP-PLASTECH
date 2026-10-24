import type { Next, Req as Request, Res as Response } from '../router.js';
import type { Action, Subject } from '../ability.js';
import { AppError } from '../core/errors.js';

export const can = (action: Action, subject: Subject) => (req: Request, _res: Response, next: Next) => {
  if (!req.actor?.ability.can(action, subject)) {
    return next(new AppError(403, 'FORBIDDEN', `You are not permitted to ${action} ${subject}`));
  }
  next();
};

export const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: Next) =>
    fn(req, res).catch(next);
