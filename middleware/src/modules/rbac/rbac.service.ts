import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class RbacService {
  constructor(private readonly db: DatabaseService) {}

  public async getRoles() {
    const res = await this.db.query(`SELECT * FROM auth_roles ORDER BY name ASC`);
    return res.rows;
  }

  public async getRolePermissions(roleId: string) {
    const res = await this.db.query(
      `SELECT permission_key FROM auth_role_permissions WHERE role_id = $1`,
      [roleId]
    );
    return res.rows.map((r: any) => r.permission_key);
  }

  public async getTenants() {
    const res = await this.db.query(
      `SELECT id, code, name, location, entity_type, is_active, is_default FROM tenant_profiles WHERE is_active = true ORDER BY code ASC`
    );
    return res.rows;
  }
}
