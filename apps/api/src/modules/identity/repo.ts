import type { PoolClient } from 'pg';

export const USER_SELECT = `
  SELECT u.id, u.username, u.email, p.full_name, p.phone, p.badge_id, p.department, p.designation,
         p.assigned_shift, p.status, p.must_change_password, p.last_login_at, p.version,
         p.created_at, p.updated_at, p.role_id, r.code AS role_code, r.name AS role_name,
         COALESCE((SELECT array_agg(pu.plant_id ORDER BY pu.plant_id) FROM plant_user pu WHERE pu.user_id = p.user_id), '{}') AS plant_ids
    FROM user_profiles p
    JOIN "user" u ON u.id = p.user_id
    JOIN roles r ON r.id = p.role_id`;

export const mapUser = (r: any) => ({
  id: r.id,
  username: r.username,
  email: r.email,
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
  isActive: r.is_active,
  version: r.version,
});

export async function findUserById(c: PoolClient, id: string, lock = false) {
  const { rows } = await c.query(
    `${USER_SELECT} WHERE p.user_id = $1 AND p.deleted_at IS NULL ${lock ? 'FOR UPDATE OF p' : ''}`,
    [id]
  );
  return rows[0] || null;
}

export async function findPlantsForUser(c: PoolClient, userId: string) {
  const { rows } = await c.query(
    `SELECT pl.id, pl.code, pl.name, pl.location, pl.is_active, pl.version
       FROM plants pl
       JOIN plant_user pu ON pu.plant_id = pl.id
      WHERE pu.user_id = $1 AND pl.deleted_at IS NULL`,
    [userId]
  );
  return rows.map(mapPlant);
}

export async function findRoleById(c: PoolClient, roleId: string) {
  const { rows } = await c.query(`SELECT id, code, name, description, is_system FROM roles WHERE id = $1 AND deleted_at IS NULL`, [roleId]);
  return rows[0] || null;
}
