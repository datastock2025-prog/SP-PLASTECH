import type { PoolClient } from 'pg';
import { hashPassword, verifyPassword } from '../../core/hash.js';
import { AppError, type Actor } from '../../core/middleware.js';
import { findUserById, findPlantsForUser, findRoleById, mapUser } from './repo.js';
import type { CreateUserSchema, UpdateUserSchema } from './schema.js';
import type { z } from 'zod';

export class IdentityService {
  public async getUser(c: PoolClient, id: string) {
    const raw = await findUserById(c, id);
    if (!raw) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return mapUser(raw);
  }

  public async getUserPlants(c: PoolClient, userId: string) {
    return await findPlantsForUser(c, userId);
  }

  public async assertAssignableRole(c: PoolClient, actor: Actor, roleId: string) {
    const role = await findRoleById(c, roleId);
    if (!role) throw new AppError(422, 'INVALID_ROLE', 'Role does not exist');
    if (role.code === 'SUPER_ADMIN' && actor.roleCode !== 'SUPER_ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only a super admin can assign the super admin role');
    }
    return role;
  }
}

export const identityService = new IdentityService();
