import type { PoolClient } from 'pg';
import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword } from './auth.js';

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

// Strong one-time password: 16 chars from an unambiguous alphabet, guaranteed to
// contain upper, lower, digit and symbol.
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

// Creates the Better Auth user + credential account + profile + preferences +
// plant links inside the CALLER's transaction so provisioning is atomic.
export async function insertUser(c: PoolClient, input: NewUserInput): Promise<string> {
  const id = randomUUID().replace(/-/g, '');
  const passwordHash = await hashPassword(input.password);
  await c.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", username, "displayUsername", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,true,$4,$5,now(),now())`,
    [id, input.fullName, input.email.toLowerCase(), input.username.toLowerCase(), input.username],
  );
  await c.query(
    `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
     VALUES ($1,$2,'credential',$2,$3,now(),now())`,
    [randomUUID().replace(/-/g, ''), id, passwordHash],
  );
  await c.query(
    `INSERT INTO user_profiles (user_id, tenant_id, role_id, full_name, phone, badge_id, department, designation,
                                assigned_shift, primary_plant_id, must_change_password)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [id, input.tenantId, input.roleId, input.fullName, input.phone ?? null, input.badgeId ?? null,
     input.department ?? null, input.designation ?? null, input.assignedShift ?? null,
     input.primaryPlantId ?? input.plantIds[0] ?? null, input.mustChangePassword],
  );
  for (const plantId of input.plantIds) {
    await c.query(`INSERT INTO plant_user (plant_id, user_id, tenant_id) VALUES ($1,$2,$3)`, [plantId, id, input.tenantId]);
  }
  await c.query(`INSERT INTO user_preferences (user_id, tenant_id) VALUES ($1,$2)`, [id, input.tenantId]);
  return id;
}

export async function writeAudit(
  c: PoolClient,
  a: {
    tenantId: string;
    entityType: string;
    entityId: string;
    action: string;
    performedBy: string | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    ip?: string | null;
  },
) {
  const changed = a.newValues
    ? Object.keys(a.newValues).filter((k) => JSON.stringify(a.oldValues?.[k]) !== JSON.stringify(a.newValues![k]))
    : [];
  await c.query(
    `INSERT INTO audit_logs (tenant_id, entity_type, entity_id, action, changed_fields, old_values, new_values, performed_by, ip_address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [a.tenantId, a.entityType, a.entityId, a.action, changed, a.oldValues ?? null, a.newValues ?? null, a.performedBy, a.ip ?? null],
  );
}
