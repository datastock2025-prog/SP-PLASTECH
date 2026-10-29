import { z } from 'zod';
import type { Auth } from '../../auth.js';
import { hashPassword, verifyPassword, getSecurityPolicy, validatePasswordPolicy, invalidateSecurityPolicyCache } from '../../auth.js';
import { eq, ne, and, sql, desc, isNull, or, gt, ilike } from 'drizzle-orm';
import { withTx, withDrizzleTx, schema } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import { writeAudit } from '../../core/audit.js';
import { ctx } from '../../core/query.js';
import { mapPlant } from '../org/service.js';
import { generateTempPassword, insertUser, mapUser, loadUser, assertAssignable, replacePlants, snapshot } from './service.js';

const str = (max = 200) => z.string().trim().min(1).max(max);
const optStr = (max = 200) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));
const idParam = z.string().trim().min(1).max(64);

export function identityRoutes(r: any, auth: Auth) {
  // ---------- current user ----------
  r.get('/me', wrap(async (req, res) => {
    const a = req.actor!;
    const data = await withDrizzleTx(ctx(a), async (tx, c) => {
      const u = mapUser(await loadUser(c, a.userId));
      // Strict Plant Scoping:
      // Only SUPER_ADMIN can view and access all plants tenant-wide.
      // All other users strictly access only the plants allocated to them in plant_user.
      const isSuperAdmin = a.roleCode === 'SUPER_ADMIN';
      let plantRows;
      if (isSuperAdmin) {
        plantRows = await tx
          .select({
            id: schema.plants.id,
            code: schema.plants.code,
            name: schema.plants.name,
            location: schema.plants.location,
            isActive: schema.plants.isActive,
            version: schema.plants.version,
          })
          .from(schema.plants)
          .where(and(isNull(schema.plants.deletedAt), eq(schema.plants.isActive, true)))
          .orderBy(schema.plants.code);
      } else {
        plantRows = await tx
          .select({
            id: schema.plants.id,
            code: schema.plants.code,
            name: schema.plants.name,
            location: schema.plants.location,
            isActive: schema.plants.isActive,
            version: schema.plants.version,
          })
          .from(schema.plants)
          .innerJoin(schema.plantUser, eq(schema.plantUser.plantId, schema.plants.id))
          .where(and(
            eq(schema.plantUser.userId, a.userId),
            isNull(schema.plants.deletedAt),
            eq(schema.plants.isActive, true),
          ))
          .orderBy(schema.plants.code);
      }
      return { ...u, plants: plantRows.map(mapPlant) };
    });
    // Plant/shift come from the provisioned assignment: auto-activate the primary (or first) assigned plant.
    let activePlantId = a.activePlantId;
    let activeShift = a.activeShift;
    const stillValid = activePlantId && data.plants.some((p: any) => p.id === activePlantId);
    if (!stillValid && data.plants.length > 0) {
      const primary = await withDrizzleTx(ctx(a), async (tx) => {
        const [prof] = await tx
          .select({
            primaryPlantId: schema.userProfiles.primaryPlantId,
            assignedShift: schema.userProfiles.assignedShift,
          })
          .from(schema.userProfiles)
          .where(eq(schema.userProfiles.userId, a.userId));
        return prof;
      });
      const pick = data.plants.find((p: any) => p.id === primary?.primaryPlantId) ?? data.plants[0];
      activePlantId = pick.id;
      activeShift = activeShift ?? primary?.assignedShift ?? 'General';
      await withDrizzleTx(ctx(a), (tx) =>
        tx
          .update(schema.session)
          .set({ activePlantId, activeShift })
          .where(and(eq(schema.session.id, a.sessionId), eq(schema.session.userId, a.userId)))
      );
    }
    res.json({ data: { ...data, activePlantId, activeShift, abilityRules: a.rules } });
  }));

  // Plant / shift are chosen AFTER login and stored on the server session.
  r.post('/me/context', wrap(async (req, res) => {
    const a = req.actor!;
    const body = z.object({ plantId: z.string().uuid(), shift: str(20) }).strict().parse(req.body);
    await withDrizzleTx(ctx(a), async (tx, c) => {
      const [p] = await tx
        .select({ id: schema.plants.id })
        .from(schema.plants)
        .where(and(
          eq(schema.plants.id, body.plantId),
          isNull(schema.plants.deletedAt),
          eq(schema.plants.isActive, true),
        ));
      if (!p) throw new AppError(404, 'NOT_FOUND', 'Plant not found');
      const isSuperAdmin = a.roleCode === 'SUPER_ADMIN';
      if (!isSuperAdmin) {
        const [m] = await tx
          .select({ one: sql`1` })
          .from(schema.plantUser)
          .where(and(eq(schema.plantUser.plantId, body.plantId), eq(schema.plantUser.userId, a.userId)));
        if (!m) throw new AppError(403, 'FORBIDDEN', 'You are not assigned to this plant');
      }
      await tx
        .update(schema.session)
        .set({ activePlantId: body.plantId, activeShift: body.shift })
        .where(and(eq(schema.session.id, a.sessionId), eq(schema.session.userId, a.userId)));
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

    const policy = await getSecurityPolicy(a.tenantId);
    const validation = validatePasswordPolicy(body.newPassword, policy);
    if (!validation.valid) {
      throw new AppError(422, 'WEAK_PASSWORD', validation.message!);
    }

    await withDrizzleTx(ctx(a), async (tx, c) => {
      const [acc] = await tx
        .select({ id: schema.account.id, password: schema.account.password })
        .from(schema.account)
        .where(and(eq(schema.account.userId, a.userId), eq(schema.account.providerId, 'credential')))
        .for('update');
      if (!acc || !acc.password || !(await verifyPassword({ hash: acc.password, password: body.currentPassword }))) {
        throw new AppError(403, 'INVALID_CREDENTIALS', 'Current password is incorrect');
      }

      // Check password history limit to prevent password reuse
      const historyRows = await tx
        .select({ passwordHash: schema.userPasswordHistory.passwordHash })
        .from(schema.userPasswordHistory)
        .where(eq(schema.userPasswordHistory.userId, a.userId))
        .orderBy(desc(schema.userPasswordHistory.createdAt))
        .limit(policy.passwordHistoryLimit || 3);

      for (const h of historyRows) {
        if (h.passwordHash && (await verifyPassword({ hash: h.passwordHash, password: body.newPassword }))) {
          throw new AppError(422, 'PASSWORD_REUSED', `You cannot reuse any of your last ${policy.passwordHistoryLimit || 3} passwords`);
        }
      }

      const newHash = await hashPassword(body.newPassword);
      await tx
        .update(schema.account)
        .set({ password: newHash, updatedAt: new Date() })
        .where(eq(schema.account.id, acc.id));
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
      await tx.insert(schema.userPasswordHistory).values({
        tenantId: a.tenantId,
        userId: a.userId,
        passwordHash: newHash,
      });

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
      const [old] = await tx
        .select()
        .from(schema.userPreferences)
        .where(eq(schema.userPreferences.userId, a.userId))
        .for('update');
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
    const rows = await withDrizzleTx(ctx(a), async (tx) => {
      return await tx
        .select({
          id: schema.session.id,
          ipAddress: schema.session.ipAddress,
          userAgent: schema.session.userAgent,
          createdAt: schema.session.createdAt,
          expiresAt: schema.session.expiresAt,
          isCurrent: sql<boolean>`${schema.session.id} = ${a.sessionId}`,
        })
        .from(schema.session)
        .where(and(eq(schema.session.userId, a.userId), gt(schema.session.expiresAt, sql`now()`)))
        .orderBy(desc(schema.session.createdAt));
    }, { readOnly: true });
    res.json({ data: rows });
  }));

  r.delete('/me/sessions/:id', can('manage', 'Session'), wrap(async (req, res) => {
    const a = req.actor!;
    const targetId = req.params.id;
    await withDrizzleTx(ctx(a), async (tx, c) => {
      await tx
        .delete(schema.session)
        .where(and(eq(schema.session.id, targetId), eq(schema.session.userId, a.userId)));
      await writeAudit(c, {
        tenantId: a.tenantId, entityType: 'session', entityId: targetId, action: 'DELETE', performedBy: a.userId, ip: a.ip,
      });
    });
    res.json({ data: { ok: true } });
  }));

  r.post('/me/sessions/revoke-others', can('manage', 'Session'), wrap(async (req, res) => {
    const a = req.actor!;
    const count = await withDrizzleTx(ctx(a), async (tx, c) => {
      const deleted = await tx
        .delete(schema.session)
        .where(and(eq(schema.session.userId, a.userId), ne(schema.session.id, a.sessionId)))
        .returning({ id: schema.session.id });
      await writeAudit(c, {
        tenantId: a.tenantId, entityType: 'session', entityId: a.sessionId, action: 'REVOKE_OTHERS', performedBy: a.userId, ip: a.ip,
      });
      return deleted.length;
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

    const data = await withDrizzleTx(ctx(a), async (tx) => {
      const conds = [
        or(eq(schema.loginEvents.tenantId, a.tenantId), isNull(schema.loginEvents.tenantId))!,
      ];
      if (successParam != null) {
        conds.push(eq(schema.loginEvents.success, successParam));
      }
      const whereClause = and(...conds);

      const [countRes] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(schema.loginEvents)
        .where(whereClause);
      const total = countRes?.total || 0;

      const rows = await tx
        .select({
          id: schema.loginEvents.id,
          tenant_id: schema.loginEvents.tenantId,
          user_id: schema.loginEvents.userId,
          identifier_hash: schema.loginEvents.identifierHash,
          success: schema.loginEvents.success,
          reason: schema.loginEvents.reason,
          ip: schema.loginEvents.ip,
          user_agent: schema.loginEvents.userAgent,
          created_at: schema.loginEvents.createdAt,
        })
        .from(schema.loginEvents)
        .where(whereClause)
        .orderBy(desc(schema.loginEvents.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        data: rows,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }, { readOnly: true });

    res.json(data);
  }));

  // ---------- security policy (Protocol 1B) ----------
  r.get('/security-policy', can('read', 'SecurityPolicy'), wrap(async (req, res) => {
    const policy = await getSecurityPolicy(req.actor?.tenantId);
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

    const updated = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [current] = await tx
        .select({ id: schema.securityPolicies.id, version: schema.securityPolicies.version })
        .from(schema.securityPolicies)
        .where(eq(schema.securityPolicies.tenantId, a.tenantId))
        .for('update');
      if (!current) throw new AppError(404, 'NOT_FOUND', 'Security policy not found');
      if (current.version !== body.version) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Security policy changed elsewhere');

      const updateData: Record<string, any> = {
        version: sql`${schema.securityPolicies.version} + 1`,
        updatedAt: new Date(),
      };
      if (body.minPasswordLength != null) updateData.minPasswordLength = body.minPasswordLength;
      if (body.requireUppercase != null) updateData.requireUppercase = body.requireUppercase;
      if (body.requireLowercase != null) updateData.requireLowercase = body.requireLowercase;
      if (body.requireNumbers != null) updateData.requireNumbers = body.requireNumbers;
      if (body.requireSymbols != null) updateData.requireSymbols = body.requireSymbols;
      if (body.passwordHistoryLimit != null) updateData.passwordHistoryLimit = body.passwordHistoryLimit;
      if (body.lockoutThreshold != null) updateData.lockoutThreshold = body.lockoutThreshold;
      if (body.lockoutDurationMinutes != null) updateData.lockoutDurationMinutes = body.lockoutDurationMinutes;
      if (body.sessionMaxAgeHours != null) updateData.sessionMaxAgeHours = body.sessionMaxAgeHours;
      if (body.idleTimeoutMinutes != null) updateData.idleTimeoutMinutes = body.idleTimeoutMinutes;
      if (body.mfaRequiredRoles != null) updateData.mfaRequiredRoles = body.mfaRequiredRoles;
      if (body.ipAllowlist != null) updateData.ipAllowlist = body.ipAllowlist;

      const [updatedPolicy] = await tx
        .update(schema.securityPolicies)
        .set(updateData)
        .where(and(
          eq(schema.securityPolicies.tenantId, a.tenantId),
          eq(schema.securityPolicies.version, body.version),
        ))
        .returning();

      if (!updatedPolicy) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Security policy changed elsewhere');

      await writeAudit(c, {
        tenantId: a.tenantId, entityType: 'security_policy', entityId: updatedPolicy.id, action: 'UPDATE', performedBy: a.userId,
        newValues: body, ip: a.ip,
      });
      return updatedPolicy;
    });

    invalidateSecurityPolicyCache(a.tenantId);
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

    const searchPattern = q.search ? `%${q.search.replace(/[\\%_]/g, '\\$&')}%` : null;
    const conds = [isNull(schema.userProfiles.deletedAt)];
    if (searchPattern) {
      conds.push(
        or(
          ilike(schema.userProfiles.fullName, searchPattern),
          ilike(schema.user.email, searchPattern),
          ilike(schema.user.username, searchPattern),
          ilike(schema.userProfiles.badgeId, searchPattern),
        )!
      );
    }
    if (q.status) {
      conds.push(eq(schema.userProfiles.status, q.status));
    }
    if (q.roleId) {
      conds.push(eq(schema.userProfiles.roleId, q.roleId));
    }
    const whereClause = and(...conds);

    const out = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      const [countRes] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(schema.userProfiles)
        .innerJoin(schema.user, eq(schema.user.id, schema.userProfiles.userId))
        .where(whereClause);
      const total = countRes?.total ?? 0;

      const up = tx
        .select({
          userId: schema.plantUser.userId,
          plantIds: sql<string[]>`array_agg(${schema.plantUser.plantId} ORDER BY ${schema.plantUser.plantId})`.as('plant_ids'),
        })
        .from(schema.plantUser)
        .groupBy(schema.plantUser.userId)
        .as('up');

      let sortCol: any = schema.userProfiles.createdAt;
      if (q.sortBy === 'full_name') sortCol = schema.userProfiles.fullName;
      else if (q.sortBy === 'last_login_at') sortCol = schema.userProfiles.lastLoginAt;
      else if (q.sortBy === 'status') sortCol = schema.userProfiles.status;

      const orderExpr = q.sortOrder === 'asc' ? sql`${sortCol} ASC NULLS LAST` : sql`${sortCol} DESC NULLS LAST`;

      const rows = await tx
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
        .where(whereClause)
        .orderBy(orderExpr, schema.user.id)
        .limit(q.limit)
        .offset((q.page - 1) * q.limit);

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
      await tx.insert(schema.userPasswordHistory).values({
        tenantId: a.tenantId,
        userId: id,
        passwordHash: tempHash,
      });
      await tx
        .update(schema.userProfiles)
        .set({
          lastSetPassword: finalPassword,
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
