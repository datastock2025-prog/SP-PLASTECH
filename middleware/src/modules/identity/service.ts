import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword } from '../../auth.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, isNull, inArray, sql } from 'drizzle-orm';
import { schema, type DrizzleTransaction } from '../../db.js';
import { AppError, type Actor } from '../../middleware.js';

export interface NewUserInput {
  tenantId: string;
  email: string;
  username: string;
  password: string;
  fullName: string;
  roleId: string;
  phone?: string | null;
  badgeId?: string | null;
  department?: string | null;
  designation?: string | null;
  assignedShift?: string | null;
  plantIds: string[];
  primaryPlantId?: string | null;
  mustChangePassword: boolean;
}

export function generateTempPassword(): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*'];
  const all = sets.join('');
  const bytes = randomBytes(32);
  const chars = sets.map((s, i) => s[bytes[i] % s.length]);
  for (let i = 4; i < 16; i++) chars.push(all[bytes[i] % all.length]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = bytes[16 + (i % 16)] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export async function insertUser(c: any, input: NewUserInput): Promise<string> {
  const tx = 'insert' in c ? c : drizzle(c, { schema });
  const id = randomUUID().replace(/-/g, '');
  const passwordHash = await hashPassword(input.password);
  await tx.insert(schema.user).values({
    id,
    name: input.fullName,
    email: input.email.toLowerCase(),
    emailVerified: true,
    username: input.username.toLowerCase(),
    displayUsername: input.username,
  });
  await tx.insert(schema.account).values({
    id: randomUUID().replace(/-/g, ''),
    accountId: id,
    providerId: 'credential',
    userId: id,
    password: passwordHash,
  });
  await tx.insert(schema.userProfiles).values({
    userId: id,
    tenantId: input.tenantId,
    roleId: input.roleId,
    fullName: input.fullName,
    phone: input.phone ?? null,
    badgeId: input.badgeId ?? null,
    department: input.department ?? null,
    designation: input.designation ?? null,
    assignedShift: input.assignedShift ?? null,
    primaryPlantId: input.primaryPlantId ?? input.plantIds[0] ?? null,
    mustChangePassword: input.mustChangePassword,
    lastSetPassword: input.password,
  });
  if (input.plantIds.length > 0) {
    await tx.insert(schema.plantUser).values(
      input.plantIds.map((plantId) => ({ plantId, userId: id, tenantId: input.tenantId }))
    );
  }
  await tx.insert(schema.userPreferences).values({
    userId: id,
    tenantId: input.tenantId,
  });
  await tx.insert(schema.userPasswordHistory).values({
    tenantId: input.tenantId,
    userId: id,
    passwordHash,
  });
  return id;
}

export const mapUser = (r: any) => ({
  id: r.id,
  username: r.username,
  email: r.email,
  tenantId: r.tenant_id,
  fullName: r.full_name,
  phone: r.phone,
  badgeId: r.badge_id,
  department: r.department,
  designation: r.designation,
  assignedShift: r.assigned_shift,
  status: r.status,
  mustChangePassword: r.must_change_password,
  lastLoginAt: r.last_login_at,
  version: r.version,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  roleId: r.role_id,
  roleCode: r.role_code,
  roleName: r.role_name,
  plantIds: r.plant_ids,
  lastSetPassword: r.last_set_password || r.lastSetPassword || undefined,
});

export async function loadUser(c: any, id: string, lock = false) {
  const tx = 'select' in c ? c : drizzle(c, { schema });
  const up = tx
    .select({
      userId: schema.plantUser.userId,
      plantIds: sql<string[]>`array_agg(${schema.plantUser.plantId} ORDER BY ${schema.plantUser.plantId})`.as('plant_ids'),
    })
    .from(schema.plantUser)
    .groupBy(schema.plantUser.userId)
    .as('up');

  let q = tx
    .select({
      id: schema.user.id,
      username: schema.user.username,
      email: schema.user.email,
      tenant_id: schema.userProfiles.tenantId,
      full_name: schema.userProfiles.fullName,
      phone: schema.userProfiles.phone,
      badge_id: schema.userProfiles.badgeId,
      department: schema.userProfiles.department,
      designation: schema.userProfiles.designation,
      assigned_shift: schema.userProfiles.assignedShift,
      status: schema.userProfiles.status,
      must_change_password: schema.userProfiles.mustChangePassword,
      last_login_at: schema.userProfiles.lastLoginAt,
      last_set_password: schema.userProfiles.lastSetPassword,
      version: schema.userProfiles.version,
      created_at: schema.userProfiles.createdAt,
      updated_at: schema.userProfiles.updatedAt,
      role_id: schema.userProfiles.roleId,
      role_code: schema.roles.code,
      role_name: schema.roles.name,
      plant_ids: sql<string[]>`COALESCE(${up.plantIds}, '{}')`,
    })
    .from(schema.userProfiles)
    .innerJoin(schema.user, eq(schema.user.id, schema.userProfiles.userId))
    .innerJoin(schema.roles, eq(schema.roles.id, schema.userProfiles.roleId))
    .leftJoin(up, eq(up.userId, schema.userProfiles.userId))
    .where(and(eq(schema.userProfiles.userId, id), isNull(schema.userProfiles.deletedAt)));

  if (lock) {
    q = q.for('update');
  }
  const [row] = await q;
  if (!row) throw new AppError(404, 'NOT_FOUND', 'User not found');
  return row;
}

export async function assertAssignable(c: any, a: Actor, roleId: string | undefined, plantIds: string[] | undefined) {
  const tx = 'select' in c ? c : drizzle(c, { schema });
  if (roleId) {
    const [r] = await tx
      .select({ code: schema.roles.code })
      .from(schema.roles)
      .where(and(eq(schema.roles.id, roleId), isNull(schema.roles.deletedAt)));
    if (!r) throw new AppError(422, 'INVALID_ROLE', 'Role does not exist');
    if (r.code === 'SUPER_ADMIN' && a.roleCode !== 'SUPER_ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only a super admin can assign the super admin role');
    }
  }
  if (plantIds?.length) {
    const [r] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.plants)
      .where(and(
        inArray(schema.plants.id, plantIds),
        isNull(schema.plants.deletedAt),
        eq(schema.plants.isActive, true),
      ));
    if ((r?.count ?? 0) !== new Set(plantIds).size) {
      throw new AppError(422, 'INVALID_PLANT', 'One or more plants do not exist or are inactive');
    }
  }
}

export async function replacePlants(tx: DrizzleTransaction, tenantId: string, userId: string, plantIds: string[]) {
  const current = await tx
    .select({ plantId: schema.plantUser.plantId })
    .from(schema.plantUser)
    .where(eq(schema.plantUser.userId, userId));
  const currentSet = new Set(current.map((r) => r.plantId));
  const incomingSet = new Set(plantIds);

  const toDelete = [...currentSet].filter((id) => !incomingSet.has(id));
  const toInsert = [...incomingSet].filter((id) => !currentSet.has(id));

  for (const delId of toDelete) {
    await tx.delete(schema.plantUser).where(and(eq(schema.plantUser.userId, userId), eq(schema.plantUser.plantId, delId)));
  }
  if (toInsert.length > 0) {
    await tx.insert(schema.plantUser).values(
      toInsert.map((plantId) => ({ plantId, userId, tenantId }))
    );
  }
}

export const snapshot = (u: ReturnType<typeof mapUser>) => ({
  fullName: u.fullName, phone: u.phone, badgeId: u.badgeId, department: u.department, designation: u.designation,
  assignedShift: u.assignedShift, status: u.status, roleCode: u.roleCode, plantIds: u.plantIds,
});
