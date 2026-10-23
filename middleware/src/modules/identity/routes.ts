import { z } from 'zod';
import type { Auth } from '../../auth.js';
import { hashPassword, verifyPassword, getSecurityPolicy, validatePasswordPolicy, invalidateSecurityPolicyCache } from '../../auth.js';
import { eq, ne, and, sql, desc } from 'drizzle-orm';
import { withTx, withDrizzleTx, schema } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import { generateTempPassword, insertUser, writeAudit } from '../../userStore.js';
import { ctx, mapUser, mapPlant, loadUser, assertAssignable, replacePlants, snapshot, USER_SELECT } from '../../core/helpers.js';

const str = (max = 200) => z.string().trim().min(1).max(max);
const optStr = (max = 200) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));
const idParam = z.string().trim().min(1).max(64);

export function identityRoutes(r: any, auth: Auth) {
  // ---------- current user ----------
  r.get('/me', wrap(async (req, res) => {
    const a = req.actor!;
    const data = await withTx(ctx(a), async (c) => {
      const u = mapUser(await loadUser(c, a.userId));
      // Strict Plant Scoping:
      // Only SUPER_ADMIN can view and access all plants tenant-wide.
      // All other users strictly access only the plants allocated to them in plant_user.
      const isSuperAdmin = a.roleCode === 'SUPER_ADMIN';
      const plants = await c.query(
        isSuperAdmin
          ? `SELECT id, code, name, location, is_active, version FROM plants WHERE deleted_at IS NULL AND is_active ORDER BY code`
          : `SELECT pl.id, pl.code, pl.name, pl.location, pl.is_active, pl.version FROM plants pl JOIN plant_user pu ON pu.plant_id = pl.id
              WHERE pu.user_id = $1 AND pl.deleted_at IS NULL AND pl.is_active ORDER BY pl.code`,
        isSuperAdmin ? [] : [a.userId],
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
      const isSuperAdmin = a.roleCode === 'SUPER_ADMIN';
      if (!isSuperAdmin) {
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
    const body = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(8).max(128) }).strict().parse(req.body);
    if (body.currentPassword === body.newPassword) throw new AppError(422, 'WEAK_PASSWORD', 'New password must differ from the current one');

    const policy = await getSecurityPolicy();
    const validation = validatePasswordPolicy(body.newPassword, policy);
    if (!validation.valid) {
      throw new AppError(422, 'WEAK_PASSWORD', validation.message!);
    }

    await withDrizzleTx(ctx(a), async (tx, c) => {
      const acc = await c.query(`SELECT id, password FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential' FOR UPDATE`, [a.userId]);
      if (!acc.rows[0] || !(await verifyPassword({ hash: acc.rows[0].password, password: body.currentPassword }))) {
        throw new AppError(403, 'INVALID_CREDENTIALS', 'Current password is incorrect');
      }

      // Check password history limit to prevent password reuse
      const { rows: historyRows } = await c.query(
        `SELECT password_hash FROM user_password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [a.userId, policy.passwordHistoryLimit || 3]
      );
      for (const h of historyRows) {
        if (await verifyPassword({ hash: h.password_hash, password: body.newPassword })) {
          throw new AppError(422, 'PASSWORD_REUSED', `You cannot reuse any of your last ${policy.passwordHistoryLimit || 3} passwords`);
        }
      }

      const newHash = await hashPassword(body.newPassword);
      await tx
        .update(schema.account)
        .set({ password: newHash, updatedAt: new Date() })
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

      // Record in user_password_history
      await c.query(
        `INSERT INTO user_password_history (tenant_id, user_id, password_hash, created_at)
         VALUES ($1, $2, $3, now())`,
        [a.tenantId, a.userId, newHash]
      );

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
      const old = (await c.query(`SELECT user_id, theme, density, landing_view, language, timezone, date_format, notifications, version FROM user_preferences WHERE user_id = $1 FOR UPDATE`, [a.userId])).rows[0];
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

  // ---------- sessions (Protocol 1B) ----------
  r.get('/me/sessions', can('manage', 'Session'), wrap(async (req, res) => {
    const a = req.actor!;
    const rows = await withTx(ctx(a), async (c) => {
      const q = await c.query(
        `SELECT id, "ipAddress", "userAgent", "createdAt", "expiresAt",
                (id = $2) AS "isCurrent"
           FROM "session"
          WHERE "userId" = $1 AND "expiresAt" > now()
          ORDER BY "createdAt" DESC`,
        [a.userId, a.sessionId],
      );
      return q.rows;
    }, { readOnly: true });
    res.json({ data: rows });
  }));

  r.delete('/me/sessions/:id', can('manage', 'Session'), wrap(async (req, res) => {
    const a = req.actor!;
    const targetId = req.params.id;
    await withTx(ctx(a), async (c) => {
      await c.query(`DELETE FROM "session" WHERE id = $1 AND "userId" = $2`, [targetId, a.userId]);
      await writeAudit(c, {
        tenantId: a.tenantId, entityType: 'session', entityId: targetId, action: 'DELETE', performedBy: a.userId, ip: a.ip,
      });
    });
    res.json({ data: { ok: true } });
  }));

  r.post('/me/sessions/revoke-others', can('manage', 'Session'), wrap(async (req, res) => {
    const a = req.actor!;
    const count = await withTx(ctx(a), async (c) => {
      const q = await c.query(`DELETE FROM "session" WHERE "userId" = $1 AND id != $2`, [a.userId, a.sessionId]);
      await writeAudit(c, {
        tenantId: a.tenantId, entityType: 'session', entityId: a.sessionId, action: 'REVOKE_OTHERS', performedBy: a.userId, ip: a.ip,
      });
      return q.rowCount || 0;
    });
    res.json({ data: { revokedCount: count } });
  }));

  // ---------- login events (Protocol 1B) ----------
  r.get('/login-events', can('read', 'AuditLog'), wrap(async (req, res) => {
    const a = req.actor!;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;
    const successParam = req.query.success != null ? req.query.success === 'true' : null;

    const data = await withTx(ctx(a), async (c) => {
      const countRes = await c.query(
        `SELECT count(*)::int as total
           FROM login_events
          WHERE (tenant_id = $1 OR tenant_id IS NULL)
            AND ($2::boolean IS NULL OR success = $2)`,
        [a.tenantId, successParam],
      );
      const total = countRes.rows[0]?.total || 0;
      const rowsRes = await c.query(
        `SELECT id, tenant_id, user_id, identifier_hash, success, reason, ip, user_agent, created_at
           FROM login_events
          WHERE (tenant_id = $1 OR tenant_id IS NULL)
            AND ($2::boolean IS NULL OR success = $2)
          ORDER BY created_at DESC
          LIMIT $3 OFFSET $4`,
        [a.tenantId, successParam, limit, offset],
      );
      return {
        data: rowsRes.rows,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }, { readOnly: true });

    res.json(data);
  }));

  // ---------- security policy (Protocol 1B) ----------
  r.get('/security-policy', can('read', 'SecurityPolicy'), wrap(async (req, res) => {
    const policy = await getSecurityPolicy();
    res.json({ data: policy });
  }));

  r.patch('/security-policy', can('update', 'SecurityPolicy'), wrap(async (req, res) => {
    const a = req.actor!;
    const body = z.object({
      minPasswordLength: z.number().int().min(8).max(64).optional(),
      requireUppercase: z.boolean().optional(),
      requireLowercase: z.boolean().optional(),
      requireNumbers: z.boolean().optional(),
      requireSymbols: z.boolean().optional(),
      passwordHistoryLimit: z.number().int().min(0).max(24).optional(),
      lockoutThreshold: z.number().int().min(3).max(20).optional(),
      lockoutDurationMinutes: z.number().int().min(1).max(1440).optional(),
      sessionMaxAgeHours: z.number().int().min(1).max(720).optional(),
      idleTimeoutMinutes: z.number().int().min(5).max(1440).optional(),
      mfaRequiredRoles: z.array(z.string()).optional(),
      ipAllowlist: z.array(z.string()).optional(),
      version: z.number().int().min(1),
    }).strict().parse(req.body);

    const updated = await withTx(ctx(a), async (c) => {
      const current = (await c.query(`SELECT id, version FROM security_policies WHERE tenant_id = $1 FOR UPDATE`, [a.tenantId])).rows[0];
      if (!current) throw new AppError(404, 'NOT_FOUND', 'Security policy not found');
      if (current.version !== body.version) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Security policy changed elsewhere');

      const setClauses: string[] = ['version = version + 1', 'updated_at = now()'];
      const params: any[] = [a.tenantId, body.version];
      let idx = 3;

      if (body.minPasswordLength != null) { setClauses.push(`min_password_length = $${idx++}`); params.push(body.minPasswordLength); }
      if (body.requireUppercase != null) { setClauses.push(`require_uppercase = $${idx++}`); params.push(body.requireUppercase); }
      if (body.requireLowercase != null) { setClauses.push(`require_lowercase = $${idx++}`); params.push(body.requireLowercase); }
      if (body.requireNumbers != null) { setClauses.push(`require_numbers = $${idx++}`); params.push(body.requireNumbers); }
      if (body.requireSymbols != null) { setClauses.push(`require_symbols = $${idx++}`); params.push(body.requireSymbols); }
      if (body.passwordHistoryLimit != null) { setClauses.push(`password_history_limit = $${idx++}`); params.push(body.passwordHistoryLimit); }
      if (body.lockoutThreshold != null) { setClauses.push(`lockout_threshold = $${idx++}`); params.push(body.lockoutThreshold); }
      if (body.lockoutDurationMinutes != null) { setClauses.push(`lockout_duration_minutes = $${idx++}`); params.push(body.lockoutDurationMinutes); }
      if (body.sessionMaxAgeHours != null) { setClauses.push(`session_max_age_hours = $${idx++}`); params.push(body.sessionMaxAgeHours); }
      if (body.idleTimeoutMinutes != null) { setClauses.push(`idle_timeout_minutes = $${idx++}`); params.push(body.idleTimeoutMinutes); }
      if (body.mfaRequiredRoles != null) { setClauses.push(`mfa_required_roles = $${idx++}`); params.push(body.mfaRequiredRoles); }
      if (body.ipAllowlist != null) { setClauses.push(`ip_allowlist = $${idx++}`); params.push(body.ipAllowlist); }

      const q = await c.query(
        `UPDATE security_policies
            SET ${setClauses.join(', ')}
          WHERE tenant_id = $1 AND version = $2
      RETURNING *`,
        params,
      );
      await writeAudit(c, {
        tenantId: a.tenantId, entityType: 'security_policy', entityId: q.rows[0].id, action: 'UPDATE', performedBy: a.userId,
        newValues: body, ip: a.ip,
      });
      return q.rows[0];
    });

    invalidateSecurityPolicyCache();
    res.json({ data: updated });
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

    const body = z.object({
      password: z.string().min(8).max(128).optional(),
      mustChangePassword: z.boolean().optional(),
    }).strict().optional().parse(req.body);

    const policy = await getSecurityPolicy();
    let finalPassword = body?.password?.trim();
    if (finalPassword) {
      const validation = validatePasswordPolicy(finalPassword, policy);
      if (!validation.valid) {
        throw new AppError(422, 'WEAK_PASSWORD', validation.message!);
      }
    } else {
      finalPassword = generateTempPassword();
    }
    const mustChange = body?.mustChangePassword ?? true;

    await withDrizzleTx(ctx(a), async (tx, c) => {
      await loadUser(c, id, true);
      const tempHash = await hashPassword(finalPassword!);
      await tx
        .update(schema.account)
        .set({ password: tempHash, updatedAt: new Date() })
        .where(and(eq(schema.account.userId, id), eq(schema.account.providerId, 'credential')));
      await c.query(
        `INSERT INTO user_password_history (tenant_id, user_id, password_hash, created_at)
         VALUES ($1, $2, $3, now())`,
        [a.tenantId, id, tempHash]
      );
      await tx
        .update(schema.userProfiles)
        .set({
          mustChangePassword: mustChange,
          version: sql`${schema.userProfiles.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.userProfiles.userId, id));
      await tx
        .delete(schema.session)
        .where(eq(schema.session.userId, id));
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'user', entityId: id, action: 'UPDATE', performedBy: a.userId, newValues: { passwordReset: true, manualPassword: Boolean(body?.password) }, ip: a.ip });
    });
    res.json({ data: { ok: true }, meta: { tempPassword: finalPassword } });
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

}
