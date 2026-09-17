import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import {
  CreateUserDto,
  CreateUserDtoSchema,
  UpdateUserDto,
  UpdateUserDtoSchema,
  CreateRoleDto,
  CreateRoleDtoSchema,
  UpdateRoleDto,
  UpdateRoleDtoSchema,
  CreatePlantDto,
  CreatePlantDtoSchema,
  UpdatePlantDto,
  UpdatePlantDtoSchema,
  CreateNumberingSequenceDto,
  CreateNumberingSequenceDtoSchema,
  UpdateNumberingSequenceDto,
  UpdateNumberingSequenceDtoSchema,
  CreateWorkflowDto,
  CreateWorkflowDtoSchema,
  UpdateWorkflowDto,
  UpdateWorkflowDtoSchema,
  CreateSystemParamDto,
  CreateSystemParamDtoSchema,
  UpdateSystemParamDto,
  UpdateSystemParamDtoSchema,
} from './admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly db: DatabaseService) {}

  // ============================================================================
  // 1. USER MANAGEMENT (CRUD + Security Controls)
  // ============================================================================
  public async getUsers(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT u.id, u.email, u.username, u.full_name, u.phone, u.designation, u.department,
              u.role_id, r.name as role_name, u.tenant_id, t.name as tenant_name,
              u.plant_ids, u.assigned_shift, u.badge_id, u.avatar_color, u.initials,
              u.status, u.mfa_enabled, u.mfa_method, u.failed_login_attempts, u.is_locked,
              u.last_login_at, u.last_login_ip, u.is_active, u.created_at, u.updated_at
       FROM auth_users u
       LEFT JOIN auth_roles r ON u.role_id = r.id
       LEFT JOIN tenant_profiles t ON u.tenant_id = t.id
       WHERE u.deleted_at IS NULL AND u.tenant_id = $1
       ORDER BY u.created_at ASC`,
      [tenantId]
    );
    return res.rows;
  }

  public async getUserById(userId: string) {
    const res = await this.db.query(
      `SELECT u.*, r.name as role_name, t.name as tenant_name
       FROM auth_users u
       LEFT JOIN auth_roles r ON u.role_id = r.id
       LEFT JOIN tenant_profiles t ON u.tenant_id = t.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [userId]
    );
    if (res.rows.length === 0) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    const user = res.rows[0];
    delete user.password_hash;
    delete user.pin_hash;
    return user;
  }

  public async createUser(dto: CreateUserDto, actorId: string = 'USR-ADMIN-01') {
    const parsed = CreateUserDtoSchema.parse(dto);
    const userId = parsed.id || `USR-${Date.now().toString().slice(-6)}`;
    const passwordHash = await bcrypt.hash(parsed.password || 'Reboot2026!#', 10);
    const pinHash = await bcrypt.hash(parsed.pin || '1234', 10);

    const initials =
      parsed.initials ||
      parsed.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const avatarColor = parsed.avatarColor || 'from-[#0F8B8D] to-[#E8622C]';

    const res = await this.db.query(
      `INSERT INTO auth_users (
        id, email, username, full_name, phone, designation, department,
        role_id, tenant_id, plant_ids, assigned_shift, badge_id, avatar_color,
        initials, password_hash, pin_hash, status, mfa_enabled, mfa_method,
        is_active, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19,
        true, $20, $20
      ) RETURNING id, email, full_name, role_id, tenant_id, status, is_active, created_at`,
      [
        userId,
        parsed.email,
        parsed.username || parsed.email.split('@')[0],
        parsed.fullName,
        parsed.phone || null,
        parsed.designation || 'Staff',
        parsed.department,
        parsed.roleId,
        parsed.tenantId,
        JSON.stringify(parsed.plantIds),
        parsed.assignedShift || 'General Shift (09:00 – 18:00)',
        parsed.badgeId || null,
        avatarColor,
        initials,
        passwordHash,
        pinHash,
        parsed.status,
        parsed.mfaEnabled,
        parsed.mfaMethod || 'Authenticator App (TOTP)',
        actorId,
      ]
    );

    // Audit log
    await this.logSecurityEvent(parsed.tenantId, actorId, 'USER_CREATED', 'INFO', {
      createdUserId: userId,
      email: parsed.email,
      roleId: parsed.roleId,
    });

    return res.rows[0];
  }

  public async updateUser(userId: string, dto: UpdateUserDto, actorId: string = 'USR-ADMIN-01') {
    const parsed = UpdateUserDtoSchema.parse(dto);
    const existing = await this.getUserById(userId);

    const email = parsed.email ?? existing.email;
    const fullName = parsed.fullName ?? existing.full_name;
    const phone = parsed.phone !== undefined ? parsed.phone : existing.phone;
    const designation = parsed.designation !== undefined ? parsed.designation : existing.designation;
    const department = parsed.department ?? existing.department;
    const roleId = parsed.roleId ?? existing.role_id;
    const plantIds = parsed.plantIds ? JSON.stringify(parsed.plantIds) : JSON.stringify(existing.plant_ids);
    const assignedShift = parsed.assignedShift ?? existing.assigned_shift;
    const badgeId = parsed.badgeId !== undefined ? parsed.badgeId : existing.badge_id;
    const status = parsed.status ?? existing.status;
    const mfaEnabled = parsed.mfaEnabled !== undefined ? parsed.mfaEnabled : existing.mfa_enabled;

    let updatePasswordSql = '';
    const queryParams: any[] = [
      email,
      fullName,
      phone,
      designation,
      department,
      roleId,
      plantIds,
      assignedShift,
      badgeId,
      status,
      mfaEnabled,
      actorId,
      userId,
    ];

    if (parsed.password) {
      const pHash = await bcrypt.hash(parsed.password, 10);
      queryParams.splice(11, 0, pHash);
      updatePasswordSql = `, password_hash = $${queryParams.length - 1}`;
    }

    const res = await this.db.query(
      `UPDATE auth_users SET
        email = $1, full_name = $2, phone = $3, designation = $4, department = $5,
        role_id = $6, plant_ids = $7, assigned_shift = $8, badge_id = $9, status = $10,
        mfa_enabled = $11, updated_by = $12, updated_at = NOW(), version = version + 1
        ${updatePasswordSql}
       WHERE id = $13 AND deleted_at IS NULL
       RETURNING id, email, full_name, role_id, status, is_active, updated_at`,
      queryParams
    );

    await this.logSecurityEvent(existing.tenant_id, actorId, 'USER_UPDATED', 'INFO', {
      targetUserId: userId,
      changes: dto,
    });

    return res.rows[0];
  }

  public async deleteUser(userId: string, actorId: string = 'USR-ADMIN-01') {
    const existing = await this.getUserById(userId);
    await this.db.query(
      `UPDATE auth_users SET deleted_at = NOW(), is_active = false, updated_by = $1 WHERE id = $2`,
      [actorId, userId]
    );

    // Revoke any active sessions
    await this.db.query(
      `UPDATE auth_active_sessions SET is_revoked = true WHERE user_id = $1`,
      [userId]
    );

    await this.logSecurityEvent(existing.tenant_id, actorId, 'USER_DELETED', 'WARNING', {
      deletedUserId: userId,
    });

    return { success: true, message: `User ${userId} soft-deleted successfully.` };
  }

  public async resetUserPin(userId: string, newPin: string = '1234', actorId: string = 'USR-ADMIN-01') {
    const pinHash = await bcrypt.hash(newPin, 10);
    await this.db.query(
      `UPDATE auth_users SET pin_hash = $1, updated_by = $2, updated_at = NOW() WHERE id = $3`,
      [pinHash, actorId, userId]
    );
    return { success: true, message: `PIN for user ${userId} reset to default.` };
  }

  // ============================================================================
  // 2. ROLES & PERMISSIONS MANAGEMENT
  // ============================================================================
  public async getRoles() {
    const rolesRes = await this.db.query(
      `SELECT * FROM auth_roles WHERE deleted_at IS NULL ORDER BY created_at ASC`
    );
    const permsRes = await this.db.query(`SELECT * FROM auth_role_permissions`);

    const permMap = new Map<string, string[]>();
    permsRes.rows.forEach((p: any) => {
      const list = permMap.get(p.role_id) || [];
      list.push(p.permission_key);
      permMap.set(p.role_id, list);
    });

    // Also count users assigned to each role
    const countRes = await this.db.query(
      `SELECT role_id, COUNT(*) as user_count FROM auth_users WHERE deleted_at IS NULL GROUP BY role_id`
    );
    const countMap = new Map<string, number>();
    countRes.rows.forEach((c: any) => countMap.set(c.role_id, parseInt(c.user_count, 10)));

    return rolesRes.rows.map((r: any) => ({
      ...r,
      permissions: permMap.get(r.id) || [],
      userCount: countMap.get(r.id) || 0,
    }));
  }

  public async createRole(dto: CreateRoleDto, actorId: string = 'USR-ADMIN-01') {
    const parsed = CreateRoleDtoSchema.parse(dto);
    const res = await this.db.query(
      `INSERT INTO auth_roles (id, name, description, scope, department, is_system_role, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, $7) RETURNING *`,
      [
        parsed.id,
        parsed.name,
        parsed.description || '',
        parsed.scope,
        parsed.department,
        parsed.isSystemRole,
        actorId,
      ]
    );

    if (parsed.permissions && parsed.permissions.length > 0) {
      for (const perm of parsed.permissions) {
        await this.db.query(
          `INSERT INTO auth_role_permissions (role_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [parsed.id, perm]
        );
      }
    }

    return { ...res.rows[0], permissions: parsed.permissions };
  }

  public async updateRole(roleId: string, dto: UpdateRoleDto, actorId: string = 'USR-ADMIN-01') {
    const parsed = UpdateRoleDtoSchema.parse(dto);
    const res = await this.db.query(
      `UPDATE auth_roles SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        scope = COALESCE($3, scope),
        department = COALESCE($4, department),
        updated_by = $5,
        updated_at = NOW(),
        version = version + 1
       WHERE id = $6 AND deleted_at IS NULL RETURNING *`,
      [parsed.name, parsed.description, parsed.scope, parsed.department, actorId, roleId]
    );

    if (parsed.permissions) {
      await this.db.query(`DELETE FROM auth_role_permissions WHERE role_id = $1`, [roleId]);
      for (const perm of parsed.permissions) {
        await this.db.query(
          `INSERT INTO auth_role_permissions (role_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [roleId, perm]
        );
      }
    }

    return { ...res.rows[0], permissions: parsed.permissions };
  }

  public async deleteRole(roleId: string, actorId: string = 'USR-ADMIN-01') {
    // Check if system role
    const roleRes = await this.db.query(`SELECT is_system_role FROM auth_roles WHERE id = $1`, [roleId]);
    if (roleRes.rows.length > 0 && roleRes.rows[0].is_system_role) {
      throw new BadRequestException(`Cannot delete system-protected role ${roleId}.`);
    }

    await this.db.query(
      `UPDATE auth_roles SET deleted_at = NOW(), is_active = false, updated_by = $1 WHERE id = $2`,
      [actorId, roleId]
    );
    return { success: true, message: `Role ${roleId} deleted.` };
  }

  // ============================================================================
  // 3. COMPANY PLANTS & FACILITIES MANAGEMENT
  // ============================================================================
  public async getPlants() {
    const res = await this.db.query(
      `SELECT * FROM tenant_profiles WHERE deleted_at IS NULL ORDER BY code ASC`
    );
    return res.rows;
  }

  public async createPlant(dto: CreatePlantDto, actorId: string = 'USR-ADMIN-01') {
    const parsed = CreatePlantDtoSchema.parse(dto);
    const plantId = parsed.id || `PLANT-${parsed.code.toUpperCase()}`;

    if (parsed.isDefault) {
      await this.db.query(`UPDATE tenant_profiles SET is_default = false WHERE is_default = true`);
    }

    const res = await this.db.query(
      `INSERT INTO tenant_profiles (
        id, code, name, location, entity_type, address, contact_person,
        contact_email, contact_phone, gstin, capacity_rating, is_default,
        is_active, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14
      ) RETURNING *`,
      [
        plantId,
        parsed.code,
        parsed.name,
        parsed.location,
        parsed.entityType,
        parsed.address || null,
        parsed.contactPerson || null,
        parsed.contactEmail || null,
        parsed.contactPhone || null,
        parsed.gstin || null,
        parsed.capacityRating || null,
        parsed.isDefault,
        parsed.isActive,
        actorId,
      ]
    );
    return res.rows[0];
  }

  public async updatePlant(plantId: string, dto: UpdatePlantDto, actorId: string = 'USR-ADMIN-01') {
    const parsed = UpdatePlantDtoSchema.parse(dto);

    if (parsed.isDefault) {
      await this.db.query(`UPDATE tenant_profiles SET is_default = false WHERE is_default = true`);
    }

    const res = await this.db.query(
      `UPDATE tenant_profiles SET
        code = COALESCE($1, code),
        name = COALESCE($2, name),
        location = COALESCE($3, location),
        entity_type = COALESCE($4, entity_type),
        address = COALESCE($5, address),
        contact_person = COALESCE($6, contact_person),
        contact_email = COALESCE($7, contact_email),
        contact_phone = COALESCE($8, contact_phone),
        gstin = COALESCE($9, gstin),
        capacity_rating = COALESCE($10, capacity_rating),
        is_default = COALESCE($11, is_default),
        is_active = COALESCE($12, is_active),
        updated_by = $13,
        updated_at = NOW(),
        version = version + 1
       WHERE id = $14 AND deleted_at IS NULL RETURNING *`,
      [
        parsed.code,
        parsed.name,
        parsed.location,
        parsed.entityType,
        parsed.address,
        parsed.contactPerson,
        parsed.contactEmail,
        parsed.contactPhone,
        parsed.gstin,
        parsed.capacityRating,
        parsed.isDefault,
        parsed.isActive,
        actorId,
        plantId,
      ]
    );
    return res.rows[0];
  }

  public async deletePlant(plantId: string, actorId: string = 'USR-ADMIN-01') {
    await this.db.query(
      `UPDATE tenant_profiles SET deleted_at = NOW(), is_active = false, updated_by = $1 WHERE id = $2`,
      [actorId, plantId]
    );
    return { success: true, message: `Plant ${plantId} soft-deleted.` };
  }

  // ============================================================================
  // 4. DOCUMENT NUMBERING SEQUENCES
  // ============================================================================
  public async getNumberingSequences(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT * FROM admin_numbering_sequences WHERE deleted_at IS NULL AND tenant_id = $1 ORDER BY module ASC, document_type ASC`,
      [tenantId]
    );
    return res.rows;
  }

  public async createNumberingSequence(dto: CreateNumberingSequenceDto, actorId: string = 'USR-ADMIN-01') {
    const parsed = CreateNumberingSequenceDtoSchema.parse(dto);
    const seqId = parsed.id || `SEQ-${parsed.prefix.replace(/[^A-Za-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

    const currentYear = new Date().getFullYear();
    const formattedYear = parsed.yearFormat === 'YY' ? currentYear.toString().slice(-2) : currentYear.toString();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

    let preview = parsed.prefix;
    if (parsed.includeYear) preview += `${formattedYear}${parsed.separator}`;
    if (parsed.includeMonth) preview += `${currentMonth}${parsed.separator}`;
    preview += parsed.currentNumber.toString().padStart(parsed.paddingLength, '0');

    const res = await this.db.query(
      `INSERT INTO admin_numbering_sequences (
        id, tenant_id, module, document_type, prefix, include_year, year_format,
        include_month, separator, padding_length, current_number, step_size,
        reset_frequency, sample_preview, is_active, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16
      ) RETURNING *`,
      [
        seqId,
        parsed.tenantId,
        parsed.module,
        parsed.documentType,
        parsed.prefix,
        parsed.includeYear,
        parsed.yearFormat,
        parsed.includeMonth,
        parsed.separator,
        parsed.paddingLength,
        parsed.currentNumber,
        parsed.stepSize,
        parsed.resetFrequency,
        preview,
        parsed.isActive,
        actorId,
      ]
    );
    return res.rows[0];
  }

  public async updateNumberingSequence(seqId: string, dto: UpdateNumberingSequenceDto, actorId: string = 'USR-ADMIN-01') {
    const parsed = UpdateNumberingSequenceDtoSchema.parse(dto);

    const res = await this.db.query(
      `UPDATE admin_numbering_sequences SET
        prefix = COALESCE($1, prefix),
        padding_length = COALESCE($2, padding_length),
        current_number = COALESCE($3, current_number),
        step_size = COALESCE($4, step_size),
        reset_frequency = COALESCE($5, reset_frequency),
        is_active = COALESCE($6, is_active),
        updated_by = $7,
        updated_at = NOW(),
        version = version + 1
       WHERE id = $8 AND deleted_at IS NULL RETURNING *`,
      [
        parsed.prefix,
        parsed.paddingLength,
        parsed.currentNumber,
        parsed.stepSize,
        parsed.resetFrequency,
        parsed.isActive,
        actorId,
        seqId,
      ]
    );
    return res.rows[0];
  }

  public async generateNextNumber(module: string, documentType: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT * FROM admin_numbering_sequences WHERE module = $1 AND document_type = $2 AND tenant_id = $3 AND deleted_at IS NULL`,
      [module, documentType, tenantId]
    );

    if (res.rows.length === 0) {
      // Return fallback formatted timestamp
      return `${documentType.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    }

    const seq = res.rows[0];
    const num = seq.current_number;
    const nextNum = num + seq.step_size;

    const currentYear = new Date().getFullYear();
    const formattedYear = seq.year_format === 'YY' ? currentYear.toString().slice(-2) : currentYear.toString();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

    let formattedCode = seq.prefix;
    if (seq.include_year) formattedCode += `${formattedYear}${seq.separator}`;
    if (seq.include_month) formattedCode += `${currentMonth}${seq.separator}`;
    formattedCode += num.toString().padStart(seq.padding_length, '0');

    // Update sequence counter
    await this.db.query(
      `UPDATE admin_numbering_sequences SET current_number = $1, updated_at = NOW() WHERE id = $2`,
      [nextNum, seq.id]
    );

    return formattedCode;
  }

  // ============================================================================
  // 5. MULTI-TIER APPROVAL WORKFLOWS
  // ============================================================================
  public async getWorkflows(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT * FROM admin_approval_workflows WHERE deleted_at IS NULL AND tenant_id = $1 ORDER BY module ASC, name ASC`,
      [tenantId]
    );
    return res.rows;
  }

  public async createWorkflow(dto: CreateWorkflowDto, actorId: string = 'USR-ADMIN-01') {
    const parsed = CreateWorkflowDtoSchema.parse(dto);
    const wfId = parsed.id || `WF-${parsed.module.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO admin_approval_workflows (
        id, tenant_id, name, module, document_type, description,
        min_amount, max_amount, tiers, is_active, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11
      ) RETURNING *`,
      [
        wfId,
        parsed.tenantId,
        parsed.name,
        parsed.module,
        parsed.documentType,
        parsed.description || null,
        parsed.minAmount || 0,
        parsed.maxAmount || null,
        JSON.stringify(parsed.tiers),
        parsed.isActive,
        actorId,
      ]
    );
    return res.rows[0];
  }

  public async updateWorkflow(wfId: string, dto: UpdateWorkflowDto, actorId: string = 'USR-ADMIN-01') {
    const parsed = UpdateWorkflowDtoSchema.parse(dto);
    const res = await this.db.query(
      `UPDATE admin_approval_workflows SET
        name = COALESCE($1, name),
        min_amount = COALESCE($2, min_amount),
        max_amount = COALESCE($3, max_amount),
        tiers = COALESCE($4, tiers),
        is_active = COALESCE($5, is_active),
        updated_by = $6,
        updated_at = NOW(),
        version = version + 1
       WHERE id = $7 AND deleted_at IS NULL RETURNING *`,
      [
        parsed.name,
        parsed.minAmount,
        parsed.maxAmount,
        parsed.tiers ? JSON.stringify(parsed.tiers) : null,
        parsed.isActive,
        actorId,
        wfId,
      ]
    );
    return res.rows[0];
  }

  public async deleteWorkflow(wfId: string, actorId: string = 'USR-ADMIN-01') {
    await this.db.query(
      `UPDATE admin_approval_workflows SET deleted_at = NOW(), is_active = false, updated_by = $1 WHERE id = $2`,
      [actorId, wfId]
    );
    return { success: true, message: `Workflow ${wfId} soft-deleted.` };
  }

  // ============================================================================
  // 6. SYSTEM PARAMETERS & CONFIG
  // ============================================================================
  public async getParameters(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT * FROM admin_system_parameters WHERE deleted_at IS NULL AND tenant_id = $1 ORDER BY param_group ASC, param_name ASC`,
      [tenantId]
    );
    return res.rows;
  }

  public async updateParameter(paramId: string, paramValue: string, actorId: string = 'USR-ADMIN-01') {
    const res = await this.db.query(
      `UPDATE admin_system_parameters SET
        param_value = $1,
        updated_by = $2,
        updated_at = NOW(),
        version = version + 1
       WHERE id = $3 AND deleted_at IS NULL RETURNING *`,
      [paramValue, actorId, paramId]
    );
    return res.rows[0];
  }

  // ============================================================================
  // 7. SYSTEM HEALTH & TELEMETRY
  // ============================================================================
  public async getSystemHealth() {
    const userCountRes = await this.db.query(`SELECT COUNT(*) as count FROM auth_users WHERE deleted_at IS NULL`);
    const plantCountRes = await this.db.query(`SELECT COUNT(*) as count FROM tenant_profiles WHERE deleted_at IS NULL`);
    const sessionCountRes = await this.db.query(`SELECT COUNT(*) as count FROM auth_active_sessions WHERE is_revoked = false AND expires_at > NOW()`);
    const roleCountRes = await this.db.query(`SELECT COUNT(*) as count FROM auth_roles WHERE deleted_at IS NULL`);

    const poolMetrics = this.db.getPoolMetrics();

    return {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      database: {
        pool: poolMetrics,
        mode: this.db.isPostgresConnected() ? 'POSTGRESQL_LIVE' : 'HYBRID_SQL_FALLBACK',
        stats: {
          totalUsers: parseInt(userCountRes.rows[0]?.count || '0', 10),
          totalPlants: parseInt(plantCountRes.rows[0]?.count || '0', 10),
          activeSessions: parseInt(sessionCountRes.rows[0]?.count || '0', 10),
          totalRoles: parseInt(roleCountRes.rows[0]?.count || '0', 10),
        },
      },
    };
  }

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================
  private async logSecurityEvent(
    tenantId: string,
    actorId: string,
    eventType: string,
    severity: string,
    details: Record<string, any>
  ) {
    try {
      const logId = `AUD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      await this.db.query(
        `INSERT INTO security_audit_logs (id, tenant_id, actor_id, actor_email, event_type, severity, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          logId,
          tenantId,
          actorId,
          'admin@reboot-erp.com',
          eventType,
          severity,
          '127.0.0.1',
          'AdminService Internal',
          JSON.stringify(details),
        ]
      );
    } catch (e) {
      this.logger.warn(`Failed to write security audit log: ${(e as Error).message}`);
    }
  }
}
