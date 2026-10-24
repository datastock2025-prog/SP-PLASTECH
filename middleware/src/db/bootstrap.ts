import { SYSTEM_ROLES } from '../ability.js';
import { config } from '../config.js';
import { getDrizzle, schema } from '../db.js';
import { insertUser } from '../modules/identity/service.js';
import { writeAudit } from '../core/audit.js';
import { eq, and, isNull, sql } from 'drizzle-orm';

// Ensures the tenant and the system roles (reference data) exist and, only when
// the system has no users at all, creates the first super admin from env vars.
export async function bootstrap(): Promise<{ tenantId: string }> {
  return await getDrizzle().transaction(async (tx) => {
    const [tenant] = await tx
      .insert(schema.tenants)
      .values({
        code: config.tenantCode,
        name: config.tenantName,
        slug: config.tenantCode.toLowerCase(),
      })
      .onConflictDoUpdate({
        target: schema.tenants.code,
        set: {
          name: config.tenantName,
          slug: config.tenantCode.toLowerCase(),
        },
      })
      .returning({ id: schema.tenants.id });
    const tenantId: string = tenant.id;

    for (const r of SYSTEM_ROLES) {
      await tx
        .insert(schema.roles)
        .values({
          tenantId,
          code: r.code,
          name: r.name,
          description: r.description,
          isSystem: true,
          permissions: r.permissions as any,
        })
        .onConflictDoUpdate({
          target: [schema.roles.tenantId, schema.roles.code],
          targetWhere: isNull(schema.roles.deletedAt),
          set: {
            name: r.name,
            description: r.description,
            permissions: r.permissions as any,
          },
        });
    }

    const [users] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.userProfiles);

    if ((users?.count ?? 0) === 0) {
      const { email, username, password, name } = config.bootstrapAdmin;
      if (email && password) {
        const [role] = await tx
          .select({ id: schema.roles.id })
          .from(schema.roles)
          .where(and(eq(schema.roles.tenantId, tenantId), eq(schema.roles.code, 'SUPER_ADMIN')));

        const id = await insertUser(tx, {
          tenantId,
          email,
          username,
          password,
          fullName: name,
          roleId: role.id,
          plantIds: [],
          mustChangePassword: true,
        });

        await writeAudit(tx, {
          tenantId,
          entityType: 'user',
          entityId: id,
          action: 'CREATE',
          performedBy: null,
          newValues: { email, username, role: 'SUPER_ADMIN', source: 'bootstrap' },
        });
        console.log(`[bootstrap] super admin '${username}' created (password change required at first login)`);
      } else {
        console.warn('[bootstrap] no users exist. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create the first admin.');
      }
    }

    return { tenantId };
  });
}
