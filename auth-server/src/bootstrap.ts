import { SYSTEM_ROLES } from './ability.js';
import { config } from './config.js';
import { pool } from './db.js';
import { insertUser, writeAudit } from './userStore.js';

// Ensures the tenant and the system roles (reference data) exist and, only when
// the system has no users at all, creates the first super admin from env vars.
export async function bootstrap(): Promise<{ tenantId: string }> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const t = await c.query(
      `INSERT INTO tenants (code, name) VALUES ($1,$2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [config.tenantCode, config.tenantName],
    );
    const tenantId: string = t.rows[0].id;
    await c.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);

    for (const r of SYSTEM_ROLES) {
      await c.query(
        `INSERT INTO roles (tenant_id, code, name, description, is_system, permissions)
         VALUES ($1,$2,$3,$4,true,$5)
         ON CONFLICT (tenant_id, code) WHERE deleted_at IS NULL
         DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, permissions = EXCLUDED.permissions`,
        [tenantId, r.code, r.name, r.description, JSON.stringify(r.permissions)],
      );
    }

    const users = await c.query(`SELECT count(*)::int AS n FROM user_profiles`);
    if (users.rows[0].n === 0) {
      const { email, username, password, name } = config.bootstrapAdmin;
      if (email && password) {
        const role = await c.query(`SELECT id FROM roles WHERE tenant_id = $1 AND code = 'SUPER_ADMIN'`, [tenantId]);
        const id = await insertUser(c, {
          tenantId, email, username, password, fullName: name,
          roleId: role.rows[0].id, plantIds: [], mustChangePassword: true,
        });
        await writeAudit(c, {
          tenantId, entityType: 'user', entityId: id, action: 'CREATE', performedBy: null,
          newValues: { email, username, role: 'SUPER_ADMIN', source: 'bootstrap' },
        });
        console.log(`[bootstrap] super admin '${username}' created (password change required at first login)`);
      } else {
        console.warn('[bootstrap] no users exist. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create the first admin.');
      }
    }
    await c.query('COMMIT');
    return { tenantId };
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
