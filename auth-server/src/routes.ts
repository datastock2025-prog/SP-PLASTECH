import os from 'node:os';
import { Router } from 'express';
import { z } from 'zod';
import type { PoolClient } from 'pg';
import type { Auth } from './auth.js';
import { hashPassword, verifyPassword } from './auth.js';
import { pool, withTx } from './db.js';
import { AppError, can, enforcePasswordChange, requireSession, wrap, type Actor } from './middleware.js';
import { generateTempPassword, insertUser, writeAudit } from './userStore.js';

const str = (max = 200) => z.string().trim().min(1).max(max);
const optStr = (max = 200) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));
const idParam = z.string().trim().min(1).max(64);

const USER_SELECT = `
  SELECT u.id, u.username, u.email, p.full_name, p.phone, p.badge_id, p.department, p.designation,
         p.assigned_shift, p.status, p.must_change_password, p.last_login_at, p.version,
         p.created_at, p.updated_at, p.role_id, r.code AS role_code, r.name AS role_name,
         COALESCE((SELECT array_agg(pu.plant_id ORDER BY pu.plant_id) FROM plant_user pu WHERE pu.user_id = p.user_id), '{}') AS plant_ids
    FROM user_profiles p
    JOIN "user" u ON u.id = p.user_id
    JOIN roles r ON r.id = p.role_id`;

const mapUser = (r: any) => ({
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

const mapPlant = (r: any) => ({ id: r.id, code: r.code, name: r.name, location: r.location, isActive: r.is_active, version: r.version });
const ctx = (a: Actor) => ({ tenantId: a.tenantId, userId: a.userId });

async function loadUser(c: PoolClient, id: string, lock = false) {
  const { rows } = await c.query(`${USER_SELECT} WHERE p.user_id = $1 AND p.deleted_at IS NULL ${lock ? 'FOR UPDATE OF p' : ''}`, [id]);
  if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');
  return rows[0];
}

async function assertAssignable(c: PoolClient, a: Actor, roleId: string | undefined, plantIds: string[] | undefined) {
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

async function replacePlants(c: PoolClient, tenantId: string, userId: string, plantIds: string[]) {
  await c.query(`DELETE FROM plant_user WHERE user_id = $1`, [userId]);
  for (const p of new Set(plantIds)) {
    await c.query(`INSERT INTO plant_user (plant_id, user_id, tenant_id) VALUES ($1,$2,$3)`, [p, userId, tenantId]);
  }
}

const snapshot = (u: ReturnType<typeof mapUser>) => ({
  fullName: u.fullName, phone: u.phone, badgeId: u.badgeId, department: u.department, designation: u.designation,
  assignedShift: u.assignedShift, status: u.status, roleCode: u.roleCode, plantIds: u.plantIds,
});

export function buildRouter(auth: Auth) {
  const r = Router();
  r.use(requireSession(auth), enforcePasswordChange);

  // ---------- current user ----------
  r.get('/me', wrap(async (req, res) => {
    const a = req.actor!;
    const data = await withTx(ctx(a), async (c) => {
      const u = mapUser(await loadUser(c, a.userId));
      const canSeeAll = a.ability.can('manage', 'Plant');
      const plants = await c.query(
        canSeeAll
          ? `SELECT * FROM plants WHERE deleted_at IS NULL AND is_active ORDER BY code`
          : `SELECT pl.* FROM plants pl JOIN plant_user pu ON pu.plant_id = pl.id
              WHERE pu.user_id = $1 AND pl.deleted_at IS NULL AND pl.is_active ORDER BY pl.code`,
        canSeeAll ? [] : [a.userId],
      );
      return { ...u, plants: plants.rows.map(mapPlant) };
    });
    // Plant/shift come from the provisioned assignment: auto-activate the primary (or first) assigned plant.
    let activePlantId = a.activePlantId;
    let activeShift = a.activeShift;
    const stillValid = activePlantId && data.plants.some((p: any) => p.id === activePlantId);
    if (!stillValid && data.plants.length > 0) {
      const primary = await withTx(ctx(a), async (c) =>
        (await c.query(`SELECT primary_plant_id, assigned_shift FROM user_profiles WHERE user_id = $1`, [a.userId])).rows[0]);
      const pick = data.plants.find((p: any) => p.id === primary?.primary_plant_id) ?? data.plants[0];
      activePlantId = pick.id;
      activeShift = activeShift ?? primary?.assigned_shift ?? 'General';
      await withTx(ctx(a), (c) => c.query(`UPDATE "session" SET active_plant_id = $1, active_shift = $2 WHERE id = $3 AND "userId" = $4`,
        [activePlantId, activeShift, a.sessionId, a.userId]));
    }
    res.json({ data: { ...data, activePlantId, activeShift, abilityRules: a.rules } });
  }));

  // Plant / shift are chosen AFTER login and stored on the server session.
  r.post('/me/context', wrap(async (req, res) => {
    const a = req.actor!;
    const body = z.object({ plantId: z.string().uuid(), shift: str(20) }).strict().parse(req.body);
    await withTx(ctx(a), async (c) => {
      const p = await c.query(`SELECT id FROM plants WHERE id = $1 AND deleted_at IS NULL AND is_active`, [body.plantId]);
      if (!p.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Plant not found');
      if (!a.ability.can('manage', 'Plant')) {
        const m = await c.query(`SELECT 1 FROM plant_user WHERE plant_id = $1 AND user_id = $2`, [body.plantId, a.userId]);
        if (!m.rows[0]) throw new AppError(403, 'FORBIDDEN', 'You are not assigned to this plant');
      }
      await c.query(`UPDATE "session" SET active_plant_id = $1, active_shift = $2 WHERE id = $3 AND "userId" = $4`,
        [body.plantId, body.shift, a.sessionId, a.userId]);
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'session', entityId: a.sessionId, action: 'UPDATE', performedBy: a.userId,
        newValues: { activePlantId: body.plantId, activeShift: body.shift }, ip: a.ip });
    });
    res.json({ data: { activePlantId: body.plantId, activeShift: body.shift } });
  }));

  r.patch('/me', wrap(async (req, res) => {
    const a = req.actor!;
    const body = z.object({
      version: z.number().int().min(1),
      fullName: str(120).optional(),
      phone: optStr(40),
      department: optStr(100),
      designation: optStr(100),
    }).strict().parse(req.body);
    const data = await withTx(ctx(a), async (c) => {
      const before = mapUser(await loadUser(c, a.userId, true));
      const next = {
        fullName: body.fullName ?? before.fullName,
        phone: 'phone' in req.body ? body.phone : before.phone,
        department: 'department' in req.body ? body.department : before.department,
        designation: 'designation' in req.body ? body.designation : before.designation,
      };
      const u = await c.query(
        `UPDATE user_profiles SET full_name=$1, phone=$2, department=$3, designation=$4, version = version + 1
          WHERE user_id = $5 AND version = $6`,
        [next.fullName, next.phone, next.department, next.designation, a.userId, body.version],
      );
      if (u.rowCount === 0) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Profile was changed elsewhere. Reload and retry.');
      await c.query(`UPDATE "user" SET name = $1, "updatedAt" = now() WHERE id = $2`, [next.fullName, a.userId]);
      const after = mapUser(await loadUser(c, a.userId));
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'user', entityId: a.userId, action: 'UPDATE', performedBy: a.userId,
        oldValues: snapshot(before), newValues: snapshot(after), ip: a.ip });
      return after;
    });
    res.json({ data });
  }));

  r.post('/me/password', wrap(async (req, res) => {
    const a = req.actor!;
    const body = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(10).max(128) }).strict().parse(req.body);
    if (body.currentPassword === body.newPassword) throw new AppError(422, 'WEAK_PASSWORD', 'New password must differ from the current one');
    if (!/[a-z]/.test(body.newPassword) || !/[A-Z]/.test(body.newPassword) || !/\d/.test(body.newPassword) || !/[^A-Za-z0-9]/.test(body.newPassword)) {
      throw new AppError(422, 'WEAK_PASSWORD', 'Password needs upper, lower, digit and symbol characters');
    }
    await withTx(ctx(a), async (c) => {
      const acc = await c.query(`SELECT id, password FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential' FOR UPDATE`, [a.userId]);
      if (!acc.rows[0] || !(await verifyPassword({ hash: acc.rows[0].password, password: body.currentPassword }))) {
        throw new AppError(403, 'INVALID_CREDENTIALS', 'Current password is incorrect');
      }
      await c.query(`UPDATE "account" SET password = $1, "updatedAt" = now() WHERE id = $2`, [await hashPassword(body.newPassword), acc.rows[0].id]);
      await c.query(`UPDATE user_profiles SET must_change_password = false, version = version + 1 WHERE user_id = $1`, [a.userId]);
      await c.query(`DELETE FROM "session" WHERE "userId" = $1 AND id <> $2`, [a.userId, a.sessionId]);
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'user', entityId: a.userId, action: 'UPDATE', performedBy: a.userId,
        newValues: { passwordChanged: true }, ip: a.ip });
    });
    res.json({ data: { ok: true } });
  }));

  // ---------- preferences ----------
  const prefRow = (p: any) => ({
    theme: p.theme, density: p.density, landingView: p.landing_view, language: p.language, timezone: p.timezone,
    dateFormat: p.date_format, notifications: p.notifications, version: p.version,
  });
  r.get('/me/preferences', can('read', 'Preference'), wrap(async (req, res) => {
    const a = req.actor!;
    const row = await withTx(ctx(a), async (c) => (await c.query(`SELECT * FROM user_preferences WHERE user_id = $1`, [a.userId])).rows[0]);
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Preferences not found');
    res.json({ data: prefRow(row) });
  }));
  r.patch('/me/preferences', can('update', 'Preference'), wrap(async (req, res) => {
    const a = req.actor!;
    const b = z.object({
      version: z.number().int().min(1),
      theme: z.enum(['light', 'dark', 'system']).optional(),
      density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
      landingView: str(60).optional(),
      language: str(10).optional(),
      timezone: str(60).optional(),
      dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
      notifications: z.record(z.string().max(40), z.boolean()).optional(),
    }).strict().parse(req.body);
    const data = await withTx(ctx(a), async (c) => {
      const old = (await c.query(`SELECT * FROM user_preferences WHERE user_id = $1 FOR UPDATE`, [a.userId])).rows[0];
      if (!old) throw new AppError(404, 'NOT_FOUND', 'Preferences not found');
      const up = await c.query(
        `UPDATE user_preferences SET theme=$1, density=$2, landing_view=$3, language=$4, timezone=$5, date_format=$6,
                notifications=$7, version = version + 1
          WHERE user_id = $8 AND version = $9 RETURNING *`,
        [b.theme ?? old.theme, b.density ?? old.density, b.landingView ?? old.landing_view, b.language ?? old.language,
         b.timezone ?? old.timezone, b.dateFormat ?? old.date_format, JSON.stringify(b.notifications ?? old.notifications),
         a.userId, b.version],
      );
      if (up.rowCount === 0) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Preferences were changed elsewhere. Reload and retry.');
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'preference', entityId: a.userId, action: 'UPDATE', performedBy: a.userId,
        oldValues: prefRow(old), newValues: prefRow(up.rows[0]), ip: a.ip });
      return prefRow(up.rows[0]);
    });
    res.json({ data });
  }));

  // ---------- reference lists ----------
  r.get('/roles', can('read', 'Role'), wrap(async (req, res) => {
    const rows = await withTx(ctx(req.actor!), async (c) => (await c.query(`SELECT id, code, name, description, is_system FROM roles WHERE deleted_at IS NULL ORDER BY name`)).rows);
    res.json({ data: rows.map((x) => ({ id: x.id, code: x.code, name: x.name, description: x.description, isSystem: x.is_system })) });
  }));

  r.get('/system/health', can('manage', 'Plant'), wrap(async (_req, res) => {
    const t0 = process.hrtime.bigint();
    const sessions = await pool.query(`SELECT count(*)::int AS n FROM "session" WHERE "expiresAt" > now()`);
    const dbLatencyMs = Number(process.hrtime.bigint() - t0) / 1e6;
    const users = await pool.query(`SELECT count(*)::int AS n FROM user_profiles WHERE deleted_at IS NULL`);
    const total = os.totalmem();
    const free = os.freemem();
    res.json({ data: {
      status: 'ok',
      dbLatencyMs: Math.round(dbLatencyMs * 10) / 10,
      activeSessions: sessions.rows[0].n,
      userCount: users.rows[0].n,
      cpuCores: os.cpus().length,
      loadPct: Math.min(100, Math.round((os.loadavg()[0] / os.cpus().length) * 1000) / 10),
      memoryTotalGb: Math.round((total / 1073741824) * 10) / 10,
      memoryUsedGb: Math.round(((total - free) / 1073741824) * 10) / 10,
      uptimeSeconds: Math.round(process.uptime()),
    } });
  }));
  r.get('/plants', can('read', 'Plant'), wrap(async (req, res) => {
    const rows = await withTx(ctx(req.actor!), async (c) => (await c.query(`SELECT * FROM plants WHERE deleted_at IS NULL ORDER BY code`)).rows);
    res.json({ data: rows.map(mapPlant) });
  }));
  r.post('/plants', can('create', 'Plant'), wrap(async (req, res) => {
    const a = req.actor!;
    const b = z.object({ code: str(30).transform((v) => v.toUpperCase()), name: str(120), location: optStr(200) }).strict().parse(req.body);
    const row = await withTx(ctx(a), async (c) => {
      const { rows } = await c.query(`INSERT INTO plants (tenant_id, code, name, location) VALUES ($1,$2,$3,$4) RETURNING *`, [a.tenantId, b.code, b.name, b.location]);
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'plant', entityId: rows[0].id, action: 'CREATE', performedBy: a.userId, newValues: mapPlant(rows[0]), ip: a.ip });
      return rows[0];
    });
    res.status(201).json({ data: mapPlant(row) });
  }));
  r.patch('/plants/:id', can('update', 'Plant'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    const b = z.object({
      version: z.number().int().min(1), code: str(30).transform((v) => v.toUpperCase()), name: str(120), location: optStr(200),
    }).strict().parse(req.body);
    const row = await withTx(ctx(a), async (c) => {
      const old = (await c.query(`SELECT * FROM plants WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [id])).rows[0];
      if (!old) throw new AppError(404, 'NOT_FOUND', 'Plant not found');
      if (old.version !== b.version) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Plant was modified by someone else. Reload and retry.');
      const { rows } = await c.query(
        `UPDATE plants SET code=$1, name=$2, location=$3, version = version + 1, updated_at = now() WHERE id = $4 RETURNING *`,
        [b.code, b.name, b.location, id]);
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'plant', entityId: id, action: 'UPDATE', performedBy: a.userId,
        oldValues: mapPlant(old), newValues: mapPlant(rows[0]), ip: a.ip });
      return rows[0];
    });
    res.json({ data: mapPlant(row) });
  }));
  r.delete('/plants/:id', can('delete', 'Plant'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    await withTx(ctx(a), async (c) => {
      const old = (await c.query(`SELECT * FROM plants WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [id])).rows[0];
      if (!old) throw new AppError(404, 'NOT_FOUND', 'Plant not found');
      const n = (await c.query(
        `SELECT count(*)::int AS n FROM plant_user pu JOIN user_profiles p ON p.user_id = pu.user_id
          WHERE pu.plant_id = $1 AND p.deleted_at IS NULL`, [id])).rows[0].n;
      if (n > 0) throw new AppError(409, 'PLANT_IN_USE', `${n} user(s) are assigned to this plant. Reassign them first.`);
      await c.query(`UPDATE plants SET deleted_at = now(), is_active = false, version = version + 1 WHERE id = $1`, [id]);
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'plant', entityId: id, action: 'DELETE', performedBy: a.userId, oldValues: mapPlant(old), ip: a.ip });
    });
    res.status(204).end();
  }));

  // ---------- user management ----------
  r.get('/users', can('read', 'User'), wrap(async (req, res) => {
    const q = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      search: z.string().trim().max(100).optional(),
      status: z.enum(['ACTIVE', 'LOCKED', 'SUSPENDED']).optional(),
      roleId: z.string().uuid().optional(),
      sortBy: z.enum(['full_name', 'created_at', 'last_login_at', 'status']).default('created_at'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }).parse(req.query);
    const where = ['p.deleted_at IS NULL'];
    const params: unknown[] = [];
    if (q.search) { params.push(`%${q.search.replace(/[\\%_]/g, '\\$&')}%`); where.push(`(p.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.username ILIKE $${params.length} OR p.badge_id ILIKE $${params.length})`); }
    if (q.status) { params.push(q.status); where.push(`p.status = $${params.length}`); }
    if (q.roleId) { params.push(q.roleId); where.push(`p.role_id = $${params.length}`); }
    const clause = where.join(' AND ');
    const out = await withTx(ctx(req.actor!), async (c) => {
      const total = (await c.query(`SELECT count(*)::int AS n FROM user_profiles p JOIN "user" u ON u.id = p.user_id WHERE ${clause}`, params)).rows[0].n;
      const rows = (await c.query(`${USER_SELECT} WHERE ${clause} ORDER BY p.${q.sortBy} ${q.sortOrder} NULLS LAST, u.id LIMIT ${q.limit} OFFSET ${(q.page - 1) * q.limit}`, params)).rows;
      return { total, rows };
    });
    res.json({ data: out.rows.map(mapUser), meta: { page: q.page, limit: q.limit, total: out.total, totalPages: Math.max(1, Math.ceil(out.total / q.limit)) } });
  }));

  r.post('/users', can('create', 'User'), wrap(async (req, res) => {
    const a = req.actor!;
    const b = z.object({
      fullName: str(120),
      username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,40}$/, 'Use 3-40 letters, digits, . _ -'),
      email: z.string().trim().toLowerCase().email().max(200),
      roleId: z.string().uuid(),
      phone: optStr(40), badgeId: optStr(40), department: optStr(100), designation: optStr(100), assignedShift: optStr(20),
      plantIds: z.array(z.string().uuid()).max(100).default([]),
    }).strict().parse(req.body);
    const tempPassword = generateTempPassword();
    const row = await withTx(ctx(a), async (c) => {
      await assertAssignable(c, a, b.roleId, b.plantIds);
      const id = await insertUser(c, { tenantId: a.tenantId, ...b, password: tempPassword, mustChangePassword: true });
      const created = mapUser(await loadUser(c, id));
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'user', entityId: id, action: 'CREATE', performedBy: a.userId, newValues: snapshot(created), ip: a.ip });
      return created;
    });
    res.status(201).json({ data: row, meta: { tempPassword } });
  }));

  r.get('/users/:id', can('read', 'User'), wrap(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const row = await withTx(ctx(req.actor!), (c) => loadUser(c, id));
    res.json({ data: mapUser(row) });
  }));

  r.patch('/users/:id', can('update', 'User'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = idParam.parse(req.params.id);
    const b = z.object({
      version: z.number().int().min(1),
      fullName: str(120).optional(), roleId: z.string().uuid().optional(),
      phone: optStr(40), badgeId: optStr(40), department: optStr(100), designation: optStr(100), assignedShift: optStr(20),
      plantIds: z.array(z.string().uuid()).max(100).optional(),
    }).strict().parse(req.body);
    if (id === a.userId && b.roleId && b.roleId !== a.roleId) throw new AppError(403, 'FORBIDDEN', 'You cannot change your own role');
    const row = await withTx(ctx(a), async (c) => {
      const before = mapUser(await loadUser(c, id, true));
      await assertAssignable(c, a, b.roleId, b.plantIds);
      const has = (k: string) => k in req.body;
      const up = await c.query(
        `UPDATE user_profiles SET full_name=$1, role_id=$2, phone=$3, badge_id=$4, department=$5, designation=$6, assigned_shift=$7, version = version + 1
          WHERE user_id = $8 AND version = $9`,
        [b.fullName ?? before.fullName, b.roleId ?? before.roleId, has('phone') ? b.phone : before.phone, has('badgeId') ? b.badgeId : before.badgeId,
         has('department') ? b.department : before.department, has('designation') ? b.designation : before.designation,
         has('assignedShift') ? b.assignedShift : before.assignedShift, id, b.version],
      );
      if (up.rowCount === 0) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'User was changed by someone else. Reload and retry.');
      if (b.fullName) await c.query(`UPDATE "user" SET name = $1, "updatedAt" = now() WHERE id = $2`, [b.fullName, id]);
      if (b.plantIds) await replacePlants(c, a.tenantId, id, b.plantIds);
      if (b.roleId && b.roleId !== before.roleId) await c.query(`DELETE FROM "session" WHERE "userId" = $1`, [id]);
      const after = mapUser(await loadUser(c, id));
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'user', entityId: id, action: 'UPDATE', performedBy: a.userId, oldValues: snapshot(before), newValues: snapshot(after), ip: a.ip });
      return after;
    });
    res.json({ data: row });
  }));

  r.post('/users/:id/reset-password', can('reset-password', 'User'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = idParam.parse(req.params.id);
    if (id === a.userId) throw new AppError(403, 'FORBIDDEN', 'Use Change Password for your own account');
    const tempPassword = generateTempPassword();
    await withTx(ctx(a), async (c) => {
      await loadUser(c, id, true);
      await c.query(`UPDATE "account" SET password = $1, "updatedAt" = now() WHERE "userId" = $2 AND "providerId" = 'credential'`, [await hashPassword(tempPassword), id]);
      await c.query(`UPDATE user_profiles SET must_change_password = true, version = version + 1 WHERE user_id = $1`, [id]);
      await c.query(`DELETE FROM "session" WHERE "userId" = $1`, [id]);
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'user', entityId: id, action: 'UPDATE', performedBy: a.userId, newValues: { passwordReset: true }, ip: a.ip });
    });
    res.json({ data: { ok: true }, meta: { tempPassword } });
  }));

  r.post('/users/:id/lock', can('lock', 'User'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = idParam.parse(req.params.id);
    const { locked } = z.object({ locked: z.boolean() }).strict().parse(req.body);
    if (id === a.userId) throw new AppError(403, 'FORBIDDEN', 'You cannot lock your own account');
    const row = await withTx(ctx(a), async (c) => {
      const before = mapUser(await loadUser(c, id, true));
      await c.query(`UPDATE user_profiles SET status = $1, failed_login_attempts = 0, version = version + 1 WHERE user_id = $2`, [locked ? 'LOCKED' : 'ACTIVE', id]);
      if (locked) await c.query(`DELETE FROM "session" WHERE "userId" = $1`, [id]);
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'user', entityId: id, action: 'UPDATE', performedBy: a.userId,
        oldValues: { status: before.status }, newValues: { status: locked ? 'LOCKED' : 'ACTIVE' }, ip: a.ip });
      return mapUser(await loadUser(c, id));
    });
    res.json({ data: row });
  }));

  r.delete('/users/:id', can('delete', 'User'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = idParam.parse(req.params.id);
    if (id === a.userId) throw new AppError(403, 'FORBIDDEN', 'You cannot delete your own account');
    await withTx(ctx(a), async (c) => {
      const before = mapUser(await loadUser(c, id, true));
      if (before.roleCode === 'SUPER_ADMIN' && a.roleCode !== 'SUPER_ADMIN') throw new AppError(403, 'FORBIDDEN', 'Only a super admin can delete a super admin');
      await c.query(`UPDATE user_profiles SET deleted_at = now(), status = 'SUSPENDED', version = version + 1 WHERE user_id = $1`, [id]);
      // Frees the unique email/username so they can be reused.
      await c.query(`UPDATE "user" SET email = $2, username = NULL, "displayUsername" = NULL, "updatedAt" = now() WHERE id = $1`, [id, `deleted+${id}@invalid.local`]);
      await c.query(`DELETE FROM "session" WHERE "userId" = $1`, [id]);
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'user', entityId: id, action: 'DELETE', performedBy: a.userId, oldValues: snapshot(before), ip: a.ip });
    });
    res.status(204).end();
  }));

  r.get('/users/:id/history', can('read', 'AuditLog'), wrap(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const q = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }).parse(req.query);
    const out = await withTx(ctx(req.actor!), async (c) => {
      const total = (await c.query(`SELECT count(*)::int AS n FROM audit_logs WHERE entity_type = 'user' AND entity_id = $1`, [id])).rows[0].n;
      const rows = (await c.query(
        `SELECT l.id, l.action, l.changed_fields, l.old_values, l.new_values, l.performed_at, l.performed_by, pu.full_name AS performed_by_name
           FROM audit_logs l LEFT JOIN user_profiles pu ON pu.user_id = l.performed_by
          WHERE l.entity_type = 'user' AND l.entity_id = $1 ORDER BY l.performed_at DESC LIMIT $2 OFFSET $3`,
        [id, q.limit, (q.page - 1) * q.limit])).rows;
      return { total, rows };
    });
    res.json({
      data: out.rows.map((l) => ({ id: l.id, action: l.action, changedFields: l.changed_fields, oldValues: l.old_values, newValues: l.new_values, performedAt: l.performed_at, performedBy: l.performed_by, performedByName: l.performed_by_name ?? 'System' })),
      meta: { page: q.page, limit: q.limit, total: out.total, totalPages: Math.max(1, Math.ceil(out.total / q.limit)) },
    });
  }));

  r.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found')));
  return r;
}

export { pool };
