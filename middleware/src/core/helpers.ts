import type { PoolClient } from 'pg';
import { eq, and } from 'drizzle-orm';
import { schema, type DrizzleTransaction } from '../db.js';
import { AppError, type Actor } from '../middleware.js';

export const USER_SELECT = `
  SELECT u.id, u.username, u.email, p.tenant_id, p.full_name, p.phone, p.badge_id, p.department, p.designation,
         p.assigned_shift, p.status, p.must_change_password, p.last_login_at, p.version,
         p.created_at, p.updated_at, p.role_id, r.code AS role_code, r.name AS role_name,
         COALESCE(up.plant_ids, '{}') AS plant_ids
    FROM user_profiles p
    JOIN "user" u ON u.id = p.user_id
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN (
      SELECT pu.user_id, array_agg(pu.plant_id ORDER BY pu.plant_id) AS plant_ids
        FROM plant_user pu
       GROUP BY pu.user_id
    ) up ON up.user_id = p.user_id`;

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
});

export const mapPlant = (r: any) => ({
  id: r.id,
  code: r.code,
  name: r.name,
  location: r.location,
  gstin: r.gstin,
  contactPerson: r.contact_person ?? r.contactPerson,
  contactPhone: r.contact_phone ?? r.contactPhone,
  contactEmail: r.contact_email ?? r.contactEmail,
  address: r.address,
  isDefault: Boolean(r.is_default ?? r.isDefault),
  isActive: r.is_active ?? r.isActive,
  version: r.version,
  createdAt: r.created_at ?? r.createdAt,
  updatedAt: r.updated_at ?? r.updatedAt,
});

export const ctx = (a: Actor) => ({ tenantId: a.tenantId, userId: a.userId });

export async function loadUser(c: PoolClient, id: string, lock = false) {
  const { rows } = await c.query(`${USER_SELECT} WHERE p.user_id = $1 AND p.deleted_at IS NULL ${lock ? 'FOR UPDATE OF p' : ''}`, [id]);
  if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');
  return rows[0];
}

export async function assertAssignable(c: PoolClient, a: Actor, roleId: string | undefined, plantIds: string[] | undefined) {
  if (roleId) {
    const r = await c.query(`SELECT code FROM roles WHERE id = $1 AND deleted_at IS NULL`, [roleId]);
    if (!r.rows[0]) throw new AppError(422, 'INVALID_ROLE', 'Role does not exist');
    if (r.rows[0].code === 'SUPER_ADMIN' && a.roleCode !== 'SUPER_ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only a super admin can assign the super admin role');
    }
  }
  if (plantIds?.length) {
    const r = await c.query(`SELECT count(*)::int AS n FROM plants WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL AND is_active`, [plantIds]);
    if (r.rows[0].n !== new Set(plantIds).size) throw new AppError(422, 'INVALID_PLANT', 'One or more plants do not exist or are inactive');
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

export async function hostMetrics() {
  try {
    const os = await import('node:os');
    const cores = os.cpus().length;
    if (!cores) throw new Error('no host metrics');
    const total = os.totalmem();
    return {
      cpuCores: cores,
      loadPct: Math.min(100, Math.round((os.loadavg()[0] / cores) * 1000) / 10),
      memoryTotalGb: Math.round((total / 1073741824) * 10) / 10,
      memoryUsedGb: Math.round(((total - os.freemem()) / 1073741824) * 10) / 10,
      uptimeSeconds: Math.round(process.uptime()),
    };
  } catch {
    return { cpuCores: null, loadPct: null, memoryTotalGb: null, memoryUsedGb: null, uptimeSeconds: null };
  }
}
