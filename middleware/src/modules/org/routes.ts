import { z } from 'zod';
import { eq, and, isNull, asc, sql } from 'drizzle-orm';
import { withDrizzleTx, schema } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import { writeAudit } from '../../core/audit.js';
import { ctx } from '../../core/query.js';
import { mapPlant } from './service.js';
import { ERP_MODULES, ERP_SUBJECT_CATALOG, ERP_ACTIONS, STANDARD_SOD_RULES } from '../../contracts/permissions.js';

const str = (max = 200) => z.string().trim().min(1).max(max);
const optStr = (max = 200) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));

export function orgRoutes(r: any) {
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
    res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');
    res.json({ data: rows });
  }));

  // ---------- RBAC Matrix & Governance (Protocol 1C) ----------
  r.get('/permissions/catalog', can('read', 'Role'), wrap(async (_req, res) => {
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.json({
      data: {
        modules: ERP_MODULES,
        subjects: ERP_SUBJECT_CATALOG,
        actions: ERP_ACTIONS,
      },
    });
  }));

  r.get('/roles/:id', can('read', 'Role'), wrap(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const row = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      const [found] = await tx
        .select()
        .from(schema.roles)
        .where(and(eq(schema.roles.id, id), isNull(schema.roles.deletedAt)));
      return found;
    });
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Role not found');
    res.json({ data: row });
  }));

  r.put('/roles/:id/permissions', can('update', 'Role'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    const body = z.object({
      version: z.number().int().min(1),
      permissions: z.array(z.object({
        action: z.string(),
        subject: z.string(),
        fields: z.array(z.string()).optional(),
        conditions: z.record(z.string(), z.any()).optional(),
        inverted: z.boolean().optional(),
        reason: z.string().optional(),
      })),
    }).strict().parse(req.body);

    const updated = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [existing] = await tx
        .select({
          id: schema.roles.id,
          code: schema.roles.code,
          is_system: schema.roles.isSystem,
          version: schema.roles.version,
          permissions: schema.roles.permissions,
        })
        .from(schema.roles)
        .where(and(eq(schema.roles.id, id), isNull(schema.roles.deletedAt)))
        .for('update');
      if (!existing) throw new AppError(404, 'NOT_FOUND', 'Role not found');
      if (existing.is_system && existing.code === 'SUPER_ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'Super Administrator permissions are immutable.');
      }
      if (existing.version !== body.version) {
        throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Role permissions modified by another user. Please reload.');
      }

      const [resRow] = await tx
        .update(schema.roles)
        .set({
          permissions: body.permissions,
          version: sql`${schema.roles.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.roles.id, id))
        .returning();

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'role',
        entityId: id,
        action: 'UPDATE',
        performedBy: a.userId,
        oldValues: { permissions: existing.permissions },
        newValues: { permissions: body.permissions },
        ip: a.ip,
      });

      return resRow;
    });

    res.json({ data: updated });
  }));

  r.get('/roles/:id/screens', can('read', 'Role'), wrap(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const rows = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      return tx
        .select({ screenKey: schema.roleScreenAccess.screenKey, canView: schema.roleScreenAccess.canView })
        .from(schema.roleScreenAccess)
        .where(eq(schema.roleScreenAccess.roleId, id));
    });
    res.json({ data: rows });
  }));

  r.put('/roles/:id/screens', can('update', 'Role'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    const body = z.object({
      screens: z.array(z.string().min(1).max(100)),
    }).parse(req.body);

    await withDrizzleTx(ctx(a), async (tx, c) => {
      await tx.delete(schema.roleScreenAccess).where(eq(schema.roleScreenAccess.roleId, id));
      if (body.screens.length > 0) {
        await tx.insert(schema.roleScreenAccess).values(
          body.screens.map((screenKey) => ({
            tenantId: a.tenantId,
            roleId: id,
            screenKey,
            canView: true,
          }))
        );
      }
      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'role_screens',
        entityId: id,
        action: 'UPDATE',
        performedBy: a.userId,
        newValues: { screens: body.screens },
        ip: a.ip,
      });
    });

    res.json({ data: { roleId: id, screens: body.screens } });
  }));

  r.get('/user-groups', can('read', 'UserGroup'), wrap(async (req, res) => {
    const rows = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      return tx
        .select()
        .from(schema.userGroups)
        .where(isNull(schema.userGroups.deletedAt))
        .orderBy(asc(schema.userGroups.name));
    });
    res.json({ data: rows });
  }));

  r.post('/user-groups', can('create', 'UserGroup'), wrap(async (req, res) => {
    const a = req.actor!;
    const b = z.object({
      code: str(40).transform((v) => v.toUpperCase()),
      name: str(120),
      description: optStr(255),
    }).strict().parse(req.body);

    const created = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [row] = await tx
        .insert(schema.userGroups)
        .values({
          tenantId: a.tenantId,
          code: b.code,
          name: b.name,
          description: b.description,
        })
        .returning();
      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'user_group',
        entityId: row.id,
        action: 'CREATE',
        performedBy: a.userId,
        newValues: row,
        ip: a.ip,
      });
      return row;
    });

    res.status(201).json({ data: created });
  }));

  r.patch('/user-groups/:id', can('update', 'UserGroup'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    const b = z.object({
      name: str(120).optional(),
      description: optStr(255),
      isActive: z.boolean().optional(),
    }).strict().parse(req.body);

    const updated = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [existing] = await tx
        .select()
        .from(schema.userGroups)
        .where(and(eq(schema.userGroups.id, id), isNull(schema.userGroups.deletedAt)))
        .for('update');
      if (!existing) throw new AppError(404, 'NOT_FOUND', 'User group not found');

      const [row] = await tx
        .update(schema.userGroups)
        .set({
          ...b,
          updatedAt: new Date(),
        })
        .where(eq(schema.userGroups.id, id))
        .returning();

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'user_group',
        entityId: id,
        action: 'UPDATE',
        performedBy: a.userId,
        oldValues: existing,
        newValues: row,
        ip: a.ip,
      });
      return row;
    });

    res.json({ data: updated });
  }));

  r.delete('/user-groups/:id', can('delete', 'UserGroup'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    await withDrizzleTx(ctx(a), async (tx, c) => {
      const [existing] = await tx
        .select()
        .from(schema.userGroups)
        .where(and(eq(schema.userGroups.id, id), isNull(schema.userGroups.deletedAt)))
        .for('update');
      if (!existing) throw new AppError(404, 'NOT_FOUND', 'User group not found');

      await tx
        .update(schema.userGroups)
        .set({
          deletedAt: new Date(),
          isActive: false,
        })
        .where(eq(schema.userGroups.id, id));

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'user_group',
        entityId: id,
        action: 'DELETE',
        performedBy: a.userId,
        oldValues: existing,
        ip: a.ip,
      });
    });

    res.status(204).end();
  }));

  r.get('/sod-rules', can('read', 'SoDRule'), wrap(async (req, res) => {
    const rows = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      return tx
        .select()
        .from(schema.sodRules)
        .where(eq(schema.sodRules.isActive, true));
    });
    res.json({ data: rows });
  }));

  r.get('/sod-violations', can('read', 'SoDRule'), wrap(async (req, res) => {
    const violations = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      const usersRows = await tx
        .select({
          id: schema.user.id,
          username: schema.user.username,
          full_name: schema.userProfiles.fullName,
          role_id: schema.roles.id,
          role_code: schema.roles.code,
          permissions: schema.roles.permissions,
        })
        .from(schema.userProfiles)
        .innerJoin(schema.user, eq(schema.user.id, schema.userProfiles.userId))
        .innerJoin(schema.roles, eq(schema.roles.id, schema.userProfiles.roleId))
        .where(isNull(schema.userProfiles.deletedAt));

      const activeRules = await tx
        .select({
          rule_code: schema.sodRules.ruleCode,
          name: schema.sodRules.name,
          risk_level: schema.sodRules.riskLevel,
          conflicting_actions: schema.sodRules.conflictingActions,
        })
        .from(schema.sodRules)
        .where(eq(schema.sodRules.isActive, true));

      const detected: Array<{ userId: string; username: string; fullName: string; ruleCode: string; ruleName: string; riskLevel: string; details: string }> = [];

      for (const user of usersRows) {
        const perms: Array<{ action: string; subject: string }> = Array.isArray(user.permissions) ? (user.permissions as any[]) : [];
        for (const rule of activeRules) {
          const conflicting = rule.conflicting_actions as any;
          const c1 = conflicting?.first;
          const c2 = conflicting?.second;
          if (!c1 || !c2) continue;
          const has1 = perms.some((p) => (p.action === 'manage' || p.action === c1.action) && (p.subject === 'all' || p.subject === c1.subject));
          const has2 = perms.some((p) => (p.action === 'manage' || p.action === c2.action) && (p.subject === 'all' || p.subject === c2.subject));
          if (has1 && has2 && user.role_code !== 'SUPER_ADMIN') {
            detected.push({
              userId: user.id,
              username: user.username || '',
              fullName: user.full_name,
              ruleCode: rule.rule_code,
              ruleName: rule.name,
              riskLevel: rule.risk_level,
              details: `User role [${user.role_code}] grants both '${c1.action} on ${c1.subject}' and '${c2.action} on ${c2.subject}'.`,
            });
          }
        }
      }
      return detected;
    });
    res.json({ data: violations });
  }));

  r.get('/plants', can('read', 'Plant'), wrap(async (req, res) => {
    const page = Math.max(1, Number(req.query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit) || 20));
    const isPaginated = req.query?.page !== undefined || req.query?.limit !== undefined;

    const rows = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      return tx
        .select()
        .from(schema.plants)
        .where(isNull(schema.plants.deletedAt))
        .orderBy(asc(schema.plants.code));
    });
    res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');
    const mapped = rows.map(mapPlant);
    if (isPaginated) {
      const offset = (page - 1) * limit;
      return res.json({
        data: mapped.slice(offset, offset + limit),
        meta: {
          page,
          limit,
          total: mapped.length,
          totalPages: Math.max(1, Math.ceil(mapped.length / limit)),
        },
      });
    }
    res.json({ data: mapped });
  }));
  r.get('/plants/:id', can('read', 'Plant'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    const row = await withDrizzleTx(ctx(a), async (tx) => {
      const [found] = await tx
        .select()
        .from(schema.plants)
        .where(and(eq(schema.plants.id, id), isNull(schema.plants.deletedAt)));
      return found || null;
    });
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Plant not found');
    res.json({ data: mapPlant(row) });
  }));
  r.post('/plants', can('create', 'Plant'), wrap(async (req, res) => {
    res.setHeader('X-Invalidate', 'plants');
    const a = req.actor!;
    const headerKey = (req.headers as any)?.['idempotency-key'] ||
                      (typeof (req.headers as any)?.get === 'function' ? (req.headers as any).get('idempotency-key') : '') ||
                      '';
    const idempotencyKey = typeof headerKey === 'string' ? headerKey.trim() : '';

    if (idempotencyKey) {
      const [cached] = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (tx) => {
        return tx
          .select({ response: schema.idempotencyKeys.response })
          .from(schema.idempotencyKeys)
          .where(
            and(
              eq(schema.idempotencyKeys.tenantId, a.tenantId),
              eq(schema.idempotencyKeys.key, idempotencyKey)
            )
          );
      }, { readOnly: true });

      if (cached) {
        res.setHeader('X-Cache', 'IDEMPOTENT-HIT');
        return res.status(200).json(cached.response);
      }
    }

    const b = z.object({
      code: str(30).transform((v) => v.toUpperCase()),
      name: str(120),
      location: optStr(200),
      gstin: optStr(20),
      contactPerson: optStr(120),
      contactPhone: optStr(50),
      contactEmail: optStr(120),
      address: optStr(300),
      isDefault: z.boolean().optional(),
    }).strict().parse(req.body);
    const row = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [inserted] = await tx
        .insert(schema.plants)
        .values({
          tenantId: a.tenantId,
          code: b.code,
          name: b.name,
          location: b.location,
          gstin: b.gstin,
          contactPerson: b.contactPerson,
          contactPhone: b.contactPhone,
          contactEmail: b.contactEmail,
          address: b.address,
          isDefault: b.isDefault ?? false,
        })
        .returning();
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'plant', entityId: inserted.id, action: 'CREATE', performedBy: a.userId, newValues: mapPlant(inserted), ip: a.ip });
      return inserted;
    });

    const payload = { data: mapPlant(row) };
    if (idempotencyKey) {
      await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (tx) => {
        await tx
          .insert(schema.idempotencyKeys)
          .values({
            tenantId: a.tenantId,
            key: idempotencyKey,
            requestHash: '',
            response: payload,
          })
          .onConflictDoNothing();
      });
    }

    res.status(201).json(payload);
  }));
  const updatePlantHandler = wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    const b = z.object({
      version: z.number().int().min(1),
      code: str(30).transform((v) => v.toUpperCase()).optional(),
      name: str(120).optional(),
      location: optStr(200),
      gstin: optStr(20),
      contactPerson: optStr(120),
      contactPhone: optStr(50),
      contactEmail: optStr(120),
      address: optStr(300),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }).strict().parse(req.body);
    const row = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [old] = await tx
        .select()
        .from(schema.plants)
        .where(and(eq(schema.plants.id, id), isNull(schema.plants.deletedAt)))
        .for('update');
      if (!old) throw new AppError(404, 'NOT_FOUND', 'Plant not found');
      if (old.version !== b.version) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Plant was modified by someone else. Reload and retry.');
      const updateData: any = {
        version: sql`${schema.plants.version} + 1`,
        updatedAt: new Date(),
      };
      if (b.code !== undefined) updateData.code = b.code;
      if (b.name !== undefined) updateData.name = b.name;
      if (b.location !== undefined) updateData.location = b.location;
      if (b.gstin !== undefined) updateData.gstin = b.gstin;
      if (b.contactPerson !== undefined) updateData.contactPerson = b.contactPerson;
      if (b.contactPhone !== undefined) updateData.contactPhone = b.contactPhone;
      if (b.contactEmail !== undefined) updateData.contactEmail = b.contactEmail;
      if (b.address !== undefined) updateData.address = b.address;
      if (b.isActive !== undefined) updateData.isActive = b.isActive;
      if (b.isDefault !== undefined) updateData.isDefault = b.isDefault;

      const [updated] = await tx
        .update(schema.plants)
        .set(updateData)
        .where(eq(schema.plants.id, id))
        .returning();
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'plant', entityId: id, action: 'UPDATE', performedBy: a.userId,
        oldValues: mapPlant(old), newValues: mapPlant(updated), ip: a.ip });
      return updated;
    });
    res.setHeader('X-Invalidate', 'plants');
    res.json({ data: mapPlant(row) });
  });
  r.patch('/plants/:id', can('update', 'Plant'), updatePlantHandler);
  r.put?.('/plants/:id', can('update', 'Plant'), updatePlantHandler);
  r.delete('/plants/:id', can('delete', 'Plant'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    await withDrizzleTx(ctx(a), async (tx, c) => {
      const [old] = await tx
        .select()
        .from(schema.plants)
        .where(and(eq(schema.plants.id, id), isNull(schema.plants.deletedAt)))
        .for('update');
      if (!old) throw new AppError(404, 'NOT_FOUND', 'Plant not found');
      const [userCountRow] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.plantUser)
        .innerJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.plantUser.userId))
        .where(
          and(
            eq(schema.plantUser.plantId, id),
            isNull(schema.userProfiles.deletedAt)
          )
        );
      const n = userCountRow?.n || 0;
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
    res.setHeader('X-Invalidate', 'plants');
    res.status(204).end();
  }));

  // ---------- Protocol 1D: Org Master, Plants, Bins, Sequences ----------
  r.post('/plants/:id/set-default', can('update', 'Plant'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    await withDrizzleTx(ctx(a), async (tx, c) => {
      // Clear current default
      await tx.update(schema.plants).set({ isDefault: false }).where(eq(schema.plants.tenantId, a.tenantId));
      const [updated] = await tx
        .update(schema.plants)
        .set({ isDefault: true, version: sql`${schema.plants.version} + 1`, updatedAt: new Date() })
        .where(eq(schema.plants.id, id))
        .returning();
      if (!updated) throw new AppError(404, 'NOT_FOUND', 'Plant not found');
      await writeAudit(c, { tenantId: a.tenantId, entityType: 'plant', entityId: id, action: 'UPDATE', performedBy: a.userId, newValues: { isDefault: true }, ip: a.ip });
    });
    res.setHeader('X-Invalidate', 'plants');
    res.json({ success: true, message: 'Default facility updated successfully.' });
  }));

  r.get('/company-settings', can('read', 'Preference'), wrap(async (req, res) => {
    const row = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      const [found] = await tx
        .select()
        .from(schema.companySettings)
        .where(eq(schema.companySettings.tenantId, req.actor!.tenantId));
      return found;
    });
    res.json({ data: row || null });
  }));

  r.patch('/company-settings', can('manage', 'Preference'), wrap(async (req, res) => {
    const a = req.actor!;
    const b = z.object({
      version: z.number().int().min(1),
      companyName: str(140).optional(),
      legalName: optStr(160),
      cin: optStr(30),
      pan: optStr(20),
      gstin: optStr(20),
      currency: str(10).optional(),
      fiscalYearStart: str(10).optional(),
      registeredAddress: optStr(300),
    }).strict().parse(req.body);

    const updated = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [existing] = await tx
        .select()
        .from(schema.companySettings)
        .where(eq(schema.companySettings.tenantId, a.tenantId))
        .for('update');
      if (!existing) throw new AppError(404, 'NOT_FOUND', 'Company settings not found');
      if (existing.version !== b.version) {
        throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Company settings modified by another user. Reload and retry.');
      }
      const [row] = await tx
        .update(schema.companySettings)
        .set({
          ...b,
          version: sql`${schema.companySettings.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.companySettings.tenantId, a.tenantId))
        .returning();
      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'company_settings',
        entityId: row.id,
        action: 'UPDATE',
        performedBy: a.userId,
        oldValues: existing,
        newValues: row,
        ip: a.ip,
      });
      return row;
    });

    res.json({ data: updated });
  }));

  r.get('/warehouse-bins', can('read', 'Warehouse'), wrap(async (req, res) => {
    const warehouseId = req.query.warehouseId ? String(req.query.warehouseId) : undefined;
    const rows = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      if (warehouseId) {
        return tx
          .select()
          .from(schema.warehouseBins)
          .where(and(eq(schema.warehouseBins.warehouseId, warehouseId), isNull(schema.warehouseBins.deletedAt)))
          .orderBy(asc(schema.warehouseBins.binCode));
      }
      return tx
        .select()
        .from(schema.warehouseBins)
        .where(isNull(schema.warehouseBins.deletedAt))
        .orderBy(asc(schema.warehouseBins.binCode));
    });
    res.json({ data: rows });
  }));

  r.post('/warehouse-bins', can('create', 'Warehouse'), wrap(async (req, res) => {
    const a = req.actor!;
    const b = z.object({
      warehouseId: str(64),
      binCode: str(30).transform((v) => v.toUpperCase()),
      zone: optStr(30),
      aisle: optStr(30),
      rack: optStr(30),
      shelf: optStr(30),
      capacityKg: z.coerce.number().positive('Capacity must be strictly greater than 0 kg'),
    }).strict().parse(req.body);

    const created = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [row] = await tx
        .insert(schema.warehouseBins)
        .values({
          tenantId: a.tenantId,
          warehouseId: b.warehouseId,
          binCode: b.binCode,
          zone: b.zone,
          aisle: b.aisle,
          rack: b.rack,
          shelf: b.shelf,
          capacityKg: String(b.capacityKg),
        })
        .returning();
      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'warehouse_bin',
        entityId: row.id,
        action: 'CREATE',
        performedBy: a.userId,
        newValues: row,
        ip: a.ip,
      });
      return row;
    });

    res.status(201).json({ data: created });
  }));

  r.get('/shifts', can('read', 'Plant'), wrap(async (req, res) => {
    const rows = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      return tx
        .select()
        .from(schema.shifts)
        .where(eq(schema.shifts.isActive, true))
        .orderBy(asc(schema.shifts.code));
    });
    res.json({ data: rows });
  }));

  r.get('/transporters', can('read', 'Supplier'), wrap(async (req, res) => {
    const rows = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      return tx
        .select()
        .from(schema.transporters)
        .where(isNull(schema.transporters.deletedAt))
        .orderBy(asc(schema.transporters.name));
    });
    res.json({ data: rows });
  }));

  const transporterMeta = z.object({
    address: z.string().trim().max(255).optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    transportModes: z.array(z.enum(['Road', 'Rail', 'Air', 'Ship', 'Multi-Modal'])).max(5).optional(),
    vehicleTypes: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
    notes: z.string().trim().max(500).optional(),
  }).strict();
  const gstin = z.string().trim().toUpperCase().regex(/^[0-9A-Z]{15}$/, 'GSTIN must be 15 alphanumeric characters');

  r.post('/transporters', can('create', 'Supplier'), wrap(async (req, res) => {
    const a = req.actor!;
    const b = z.object({
      code: str(30).transform((v) => v.toUpperCase()),
      name: str(160),
      gstin,
      contactPerson: optStr(120),
      phone: optStr(30),
      email: z.string().trim().email().max(160).optional().nullable(),
      metadata: transporterMeta.default({}),
    }).strict().parse(req.body);

    const created = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [row] = await tx.insert(schema.transporters).values({ tenantId: a.tenantId, ...b }).returning();
      await writeAudit(c, {
        tenantId: a.tenantId, entityType: 'transporter', entityId: row.id,
        action: 'CREATE', performedBy: a.userId, newValues: row, ip: a.ip,
      });
      return row;
    });
    res.status(201).json({ data: created });
  }));

  r.patch('/transporters/:id', can('update', 'Supplier'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    const b = z.object({
      name: str(160).optional(),
      gstin: gstin.optional(),
      contactPerson: z.string().trim().max(120).nullable().optional(),
      phone: z.string().trim().max(30).nullable().optional(),
      email: z.string().trim().email().max(160).optional().nullable(),
      isActive: z.boolean().optional(),
      metadata: transporterMeta.optional(),
    }).strict().parse(req.body);

    const updated = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [existing] = await tx.select().from(schema.transporters)
        .where(and(eq(schema.transporters.id, id), isNull(schema.transporters.deletedAt)))
        .for('update');
      if (!existing) throw new AppError(404, 'NOT_FOUND', 'Transporter not found');
      const [row] = await tx.update(schema.transporters)
        .set({ ...b, updatedAt: new Date() })
        .where(eq(schema.transporters.id, id))
        .returning();
      await writeAudit(c, {
        tenantId: a.tenantId, entityType: 'transporter', entityId: id,
        action: 'UPDATE', performedBy: a.userId, oldValues: existing, newValues: row, ip: a.ip,
      });
      return row;
    });
    res.json({ data: updated });
  }));

  r.delete('/transporters/:id', can('delete', 'Supplier'), wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    await withDrizzleTx(ctx(a), async (tx, c) => {
      const [existing] = await tx.select().from(schema.transporters)
        .where(and(eq(schema.transporters.id, id), isNull(schema.transporters.deletedAt)))
        .for('update');
      if (!existing) throw new AppError(404, 'NOT_FOUND', 'Transporter not found');
      await tx.update(schema.transporters)
        .set({ deletedAt: new Date(), isActive: false })
        .where(eq(schema.transporters.id, id));
      await writeAudit(c, {
        tenantId: a.tenantId, entityType: 'transporter', entityId: id,
        action: 'DELETE', performedBy: a.userId, oldValues: existing, ip: a.ip,
      });
    });
    res.status(204).end();
  }));

  r.get('/numbering-series', can('read', 'Preference'), wrap(async (req, res) => {
    const rows = await withDrizzleTx(ctx(req.actor!), async (tx) => {
      return tx
        .select()
        .from(schema.numberingSeries)
        .where(eq(schema.numberingSeries.isActive, true))
        .orderBy(asc(schema.numberingSeries.seriesCode));
    });
    res.json({ data: rows });
  }));

  r.post('/numbering-series/next', can('read', 'Preference'), wrap(async (req, res) => {
    const a = req.actor!;
    const b = z.object({
      seriesCode: str(20).transform((v) => v.toUpperCase()),
      plantId: z.string().uuid().optional().nullable(),
    }).parse(req.body);

    const docNumber = await withDrizzleTx(ctx(a), async (tx) => {
      const [resVal] = await tx
        .select({
          doc_number: sql<string>`public.next_doc_number(${a.tenantId}::uuid, ${b.seriesCode}::text, ${b.plantId || null}::uuid)`,
        })
        .from(sql`(VALUES (1))`);
      return resVal?.doc_number;
    });

    res.json({ data: { docNumber, seriesCode: b.seriesCode } });
  }));

}
