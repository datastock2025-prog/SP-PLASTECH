import { z } from 'zod';
import type { PoolClient } from 'pg';
import type { Auth } from './auth.js';
import { hashPassword, verifyPassword } from './auth.js';
import { eq, ne, and, isNull, asc, desc, sql } from 'drizzle-orm';
import { pool, withTx, withDrizzleTx, schema, type DrizzleTransaction } from './db.js';
import { AppError, can, enforcePasswordChange, errorHandler, requireSession, wrap, type Actor } from './middleware.js';
import { createRouter } from './router.js';
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

const mapPlant = (r: any) => ({ id: r.id, code: r.code, name: r.name, location: r.location, isActive: r.is_active ?? r.isActive, version: r.version });
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

async function replacePlants(tx: DrizzleTransaction, tenantId: string, userId: string, plantIds: string[]) {
  await tx.delete(schema.plantUser).where(eq(schema.plantUser.userId, userId));
  const uniquePlants = Array.from(new Set(plantIds));
  if (uniquePlants.length > 0) {
    await tx.insert(schema.plantUser).values(
      uniquePlants.map((plantId) => ({ plantId, userId, tenantId }))
    );
  }
}

const snapshot = (u: ReturnType<typeof mapUser>) => ({
  fullName: u.fullName, phone: u.phone, badgeId: u.badgeId, department: u.department, designation: u.designation,
  assignedShift: u.assignedShift, status: u.status, roleCode: u.roleCode, plantIds: u.plantIds,
});

// Host metrics exist on Node only; on Cloudflare Workers the edge runtime does not expose them.
async function hostMetrics() {
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

export function buildRouter(auth: Auth) {
  const r = createRouter(errorHandler);
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
    const data = await withDrizzleTx(ctx(a), async (tx, c) => {
      const before = mapUser(await loadUser(c, a.userId, true));
      const next = {
        fullName: body.fullName ?? before.fullName,
        phone: 'phone' in req.body ? body.phone : before.phone,
        department: 'department' in req.body ? body.department : before.department,
        designation: 'designation' in req.body ? body.designation : before.designation,
      };
      const [u] = await tx
        .update(schema.userProfiles)
        .set({
          fullName: next.fullName,
          phone: next.phone,
          department: next.department,
          designation: next.designation,
          version: sql`${schema.userProfiles.version} + 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.userProfiles.userId, a.userId), eq(schema.userProfiles.version, body.version)))
        .returning();
      if (!u) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Profile was changed elsewhere. Reload and retry.');
      await tx
        .update(schema.user)
        .set({ name: next.fullName, updatedAt: new Date() })
        .where(eq(schema.user.id, a.userId));
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
    await withDrizzleTx(ctx(a), async (tx, c) => {
      const acc = await c.query(`SELECT id, password FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential' FOR UPDATE`, [a.userId]);
      if (!acc.rows[0] || !(await verifyPassword({ hash: acc.rows[0].password, password: body.currentPassword }))) {
        throw new AppError(403, 'INVALID_CREDENTIALS', 'Current password is incorrect');
      }
      await tx
        .update(schema.account)
        .set({ password: await hashPassword(body.newPassword), updatedAt: new Date() })
        .where(eq(schema.account.id, acc.rows[0].id));
      await tx
        .update(schema.userProfiles)
        .set({
          mustChangePassword: false,
          version: sql`${schema.userProfiles.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.userProfiles.userId, a.userId));
      await tx
        .delete(schema.session)
        .where(and(eq(schema.session.userId, a.userId), ne(schema.session.id, a.sessionId)));
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'user', entityId: a.userId, action: 'UPDATE', performedBy: a.userId,
        newValues: { passwordChanged: true }, ip: a.ip });
    });
    res.json({ data: { ok: true } });
  }));

  // ---------- preferences ----------
  const prefRow = (p: any) => ({
    theme: p.theme, density: p.density, landingView: p.landing_view ?? p.landingView, language: p.language, timezone: p.timezone,
    dateFormat: p.date_format ?? p.dateFormat, notifications: p.notifications, version: p.version,
  });
  r.get('/me/preferences', can('read', 'Preference'), wrap(async (req, res) => {
    const a = req.actor!;
    const row = await withDrizzleTx(ctx(a), async (tx) => {
      const [p] = await tx
        .select()
        .from(schema.userPreferences)
        .where(eq(schema.userPreferences.userId, a.userId));
      return p;
    });
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
    const data = await withDrizzleTx(ctx(a), async (tx, c) => {
      const old = (await c.query(`SELECT * FROM user_preferences WHERE user_id = $1 FOR UPDATE`, [a.userId])).rows[0];
      if (!old) throw new AppError(404, 'NOT_FOUND', 'Preferences not found');
      if (old.version !== b.version) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Preferences were changed elsewhere. Reload and retry.');
      const [up] = await tx
        .update(schema.userPreferences)
        .set({
          ...(b.theme ? { theme: b.theme } : {}),
          ...(b.density ? { density: b.density } : {}),
          ...(b.landingView ? { landingView: b.landingView } : {}),
          ...(b.language ? { language: b.language } : {}),
          ...(b.timezone ? { timezone: b.timezone } : {}),
          ...(b.dateFormat ? { dateFormat: b.dateFormat } : {}),
          ...(b.notifications ? { notifications: b.notifications } : {}),
          version: sql`${schema.userPreferences.version} + 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.userPreferences.userId, a.userId), eq(schema.userPreferences.version, b.version)))
        .returning();
      if (!up) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Preferences were changed elsewhere. Reload and retry.');
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'preference', entityId: a.userId, action: 'UPDATE', performedBy: a.userId,
        oldValues: prefRow(old), newValues: prefRow(up), ip: a.ip });
      return prefRow(up);
    });
    res.json({ data });
  }));

  // ---------- reference lists ----------
  r.get('/roles', can('read', 'Role'), wrap(async (req, res) => {
    const rows = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      return tx
        .select({
          id: schema.roles.id,
          code: schema.roles.code,
          name: schema.roles.name,
          description: schema.roles.description,
          isSystem: schema.roles.isSystem,
        })
        .from(schema.roles)
        .where(isNull(schema.roles.deletedAt))
        .orderBy(asc(schema.roles.name));
    });
    res.json({ data: rows });
  }));

  r.get('/system/health', can('manage', 'Plant'), wrap(async (_req, res) => {
    const t0 = performance.now();
    const sessions = await pool.query(`SELECT count(*)::int AS n FROM "session" WHERE "expiresAt" > now()`);
    const dbLatencyMs = performance.now() - t0;
    const users = await pool.query(`SELECT count(*)::int AS n FROM user_profiles WHERE deleted_at IS NULL`);
    res.json({ data: {
      status: 'ok',
      dbLatencyMs: Math.round(dbLatencyMs * 10) / 10,
      activeSessions: sessions.rows[0].n,
      userCount: users.rows[0].n,
      ...(await hostMetrics()),
    } });
  }));
  r.get('/plants', can('read', 'Plant'), wrap(async (req, res) => {
    const rows = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      return tx
        .select()
        .from(schema.plants)
        .where(isNull(schema.plants.deletedAt))
        .orderBy(asc(schema.plants.code));
    });
    res.json({ data: rows.map(mapPlant) });
  }));
  r.post('/plants', can('create', 'Plant'), wrap(async (req, res) => {
    const a = req.actor!;
    const b = z.object({ code: str(30).transform((v) => v.toUpperCase()), name: str(120), location: optStr(200) }).strict().parse(req.body);
    const row = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [inserted] = await tx
        .insert(schema.plants)
        .values({
          tenantId: a.tenantId,
          code: b.code,
          name: b.name,
          location: b.location,
        })
        .returning();
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'plant', entityId: inserted.id, action: 'CREATE', performedBy: a.userId, newValues: mapPlant(inserted), ip: a.ip });
      return inserted;
    });
    res.status(201).json({ data: mapPlant(row) });
  }));
  r.patch('/plants/:id', can('update', 'Plant'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    const b = z.object({
      version: z.number().int().min(1), code: str(30).transform((v) => v.toUpperCase()), name: str(120), location: optStr(200),
    }).strict().parse(req.body);
    const row = await withDrizzleTx(ctx(a), async (tx, c) => {
      const old = (await c.query(`SELECT * FROM plants WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [id])).rows[0];
      if (!old) throw new AppError(404, 'NOT_FOUND', 'Plant not found');
      if (old.version !== b.version) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Plant was modified by someone else. Reload and retry.');
      const [updated] = await tx
        .update(schema.plants)
        .set({
          code: b.code,
          name: b.name,
          location: b.location,
          version: sql`${schema.plants.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.plants.id, id))
        .returning();
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'plant', entityId: id, action: 'UPDATE', performedBy: a.userId,
        oldValues: mapPlant(old), newValues: mapPlant(updated), ip: a.ip });
      return updated;
    });
    res.json({ data: mapPlant(row) });
  }));
  r.delete('/plants/:id', can('delete', 'Plant'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    await withDrizzleTx(ctx(a), async (tx, c) => {
      const old = (await c.query(`SELECT * FROM plants WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [id])).rows[0];
      if (!old) throw new AppError(404, 'NOT_FOUND', 'Plant not found');
      const n = (await c.query(
        `SELECT count(*)::int AS n FROM plant_user pu JOIN user_profiles p ON p.user_id = pu.user_id
          WHERE pu.plant_id = $1 AND p.deleted_at IS NULL`, [id])).rows[0].n;
      if (n > 0) throw new AppError(409, 'PLANT_IN_USE', `${n} user(s) are assigned to this plant. Reassign them first.`);
      await tx
        .update(schema.plants)
        .set({
          deletedAt: new Date(),
          isActive: false,
          version: sql`${schema.plants.version} + 1`,
        })
        .where(eq(schema.plants.id, id));
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
    const row = await withDrizzleTx(ctx(a), async (tx, c) => {
      const before = mapUser(await loadUser(c, id, true));
      await assertAssignable(c, a, b.roleId, b.plantIds);
      const has = (k: string) => k in req.body;
      const [up] = await tx
        .update(schema.userProfiles)
        .set({
          fullName: b.fullName ?? before.fullName,
          roleId: b.roleId ?? before.roleId,
          phone: has('phone') ? b.phone : before.phone,
          badgeId: has('badgeId') ? b.badgeId : before.badgeId,
          department: has('department') ? b.department : before.department,
          designation: has('designation') ? b.designation : before.designation,
          assignedShift: has('assignedShift') ? b.assignedShift : before.assignedShift,
          version: sql`${schema.userProfiles.version} + 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.userProfiles.userId, id), eq(schema.userProfiles.version, b.version)))
        .returning();
      if (!up) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'User was changed by someone else. Reload and retry.');
      if (b.fullName) await tx.update(schema.user).set({ name: b.fullName, updatedAt: new Date() }).where(eq(schema.user.id, id));
      if (b.plantIds) await replacePlants(tx, a.tenantId, id, b.plantIds);
      if (b.roleId && b.roleId !== before.roleId) await tx.delete(schema.session).where(eq(schema.session.userId, id));
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
    await withDrizzleTx(ctx(a), async (tx, c) => {
      await loadUser(c, id, true);
      await tx
        .update(schema.account)
        .set({ password: await hashPassword(tempPassword), updatedAt: new Date() })
        .where(and(eq(schema.account.userId, id), eq(schema.account.providerId, 'credential')));
      await tx
        .update(schema.userProfiles)
        .set({
          mustChangePassword: true,
          version: sql`${schema.userProfiles.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.userProfiles.userId, id));
      await tx
        .delete(schema.session)
        .where(eq(schema.session.userId, id));
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'user', entityId: id, action: 'UPDATE', performedBy: a.userId, newValues: { passwordReset: true }, ip: a.ip });
    });
    res.json({ data: { ok: true }, meta: { tempPassword } });
  }));

  r.post('/users/:id/lock', can('lock', 'User'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = idParam.parse(req.params.id);
    const { locked } = z.object({ locked: z.boolean() }).strict().parse(req.body);
    if (id === a.userId) throw new AppError(403, 'FORBIDDEN', 'You cannot lock your own account');
    const row = await withDrizzleTx(ctx(a), async (tx, c) => {
      const before = mapUser(await loadUser(c, id, true));
      await tx
        .update(schema.userProfiles)
        .set({
          status: locked ? 'LOCKED' : 'ACTIVE',
          failedLoginAttempts: 0,
          version: sql`${schema.userProfiles.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.userProfiles.userId, id));
      if (locked) await tx.delete(schema.session).where(eq(schema.session.userId, id));
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
    await withDrizzleTx(ctx(a), async (tx, c) => {
      const before = mapUser(await loadUser(c, id, true));
      if (before.roleCode === 'SUPER_ADMIN' && a.roleCode !== 'SUPER_ADMIN') throw new AppError(403, 'FORBIDDEN', 'Only a super admin can delete a super admin');
      await tx
        .update(schema.userProfiles)
        .set({
          deletedAt: new Date(),
          status: 'SUSPENDED',
          version: sql`${schema.userProfiles.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.userProfiles.userId, id));
      // Frees the unique email/username so they can be reused.
      await tx
        .update(schema.user)
        .set({
          email: `deleted+${id}@invalid.local`,
          username: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.user.id, id));
      await tx.delete(schema.session).where(eq(schema.session.userId, id));
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'user', entityId: id, action: 'DELETE', performedBy: a.userId, oldValues: snapshot(before), ip: a.ip });
    });
    res.status(204).end();
  }));

  r.get('/users/:id/history', can('read', 'AuditLog'), wrap(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const q = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }).parse(req.query);
    const out = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      const [countResult] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.auditLogs)
        .where(and(eq(schema.auditLogs.entityType, 'user'), eq(schema.auditLogs.entityId, id)));
      const total = countResult?.count ?? 0;
      const rows = await tx
        .select({
          id: schema.auditLogs.id,
          action: schema.auditLogs.action,
          changedFields: schema.auditLogs.changedFields,
          oldValues: schema.auditLogs.oldValues,
          newValues: schema.auditLogs.newValues,
          performedAt: schema.auditLogs.performedAt,
          performedBy: schema.auditLogs.performedBy,
          performedByName: schema.userProfiles.fullName,
        })
        .from(schema.auditLogs)
        .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.auditLogs.performedBy))
        .where(and(eq(schema.auditLogs.entityType, 'user'), eq(schema.auditLogs.entityId, id)))
        .orderBy(desc(schema.auditLogs.performedAt))
        .limit(q.limit)
        .offset((q.page - 1) * q.limit);
      return { total, rows };
    });
    res.json({
      data: out.rows.map((l) => ({ id: l.id, action: l.action, changedFields: l.changedFields, oldValues: l.oldValues, newValues: l.newValues, performedAt: l.performedAt, performedBy: l.performedBy, performedByName: l.performedByName ?? 'System' })),
      meta: { page: q.page, limit: q.limit, total: out.total, totalPages: Math.max(1, Math.ceil(out.total / q.limit)) },
    });
  }));

  r.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found')));
  return r.app;
}

export { pool };
