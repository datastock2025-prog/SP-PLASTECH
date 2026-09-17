import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as crypto from 'crypto';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly db: DatabaseService) {}

  public async exportUserData(userId: string, tenantId: string) {
    // 1. Fetch user profile
    const userRes = await this.db.query(
      `SELECT id, email, full_name, department, badge_id, shift_code, is_active, mfa_enabled, last_login_at, created_at 
       FROM auth_users WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      throw new NotFoundException('User record not found.');
    }

    // 2. Fetch user audit trail
    const auditRes = await this.db.query(
      `SELECT id, event_type, severity, ip_address, details, created_at 
       FROM security_audit_logs WHERE actor_id = $1 ORDER BY created_at DESC LIMIT 500`,
      [userId]
    );

    // 3. Fetch active sessions history
    const sessionRes = await this.db.query(
      `SELECT session_id, device_info, device_type, ip_address, location, created_at, last_active_at 
       FROM auth_active_sessions WHERE user_id = $1`,
      [userId]
    );

    return {
      complianceStandard: 'GDPR_ARTICLE_20_PORTABILITY',
      exportTimestamp: new Date().toISOString(),
      tenantId,
      userProfile: userRes.rows[0],
      sessionHistory: sessionRes.rows,
      telemetryLogs: auditRes.rows,
    };
  }

  public async requestAnonymization(userId: string, tenantId: string, reason?: string) {
    const trackingNumber = `RTBF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    await this.db.query(
      `INSERT INTO gdpr_compliance_requests (tracking_number, tenant_id, user_id, request_type, status, reason)
       VALUES ($1, $2, $3, 'RIGHT_TO_BE_FORGOTTEN', 'PENDING', $4)`,
      [trackingNumber, tenantId, userId, reason || 'User requested account erasure']
    );

    // Log critical audit event
    await this.db.query(
      `INSERT INTO security_audit_logs (id, tenant_id, actor_id, event_type, severity, ip_address, details)
       VALUES ($1, $2, $3, 'GDPR_RIGHT_TO_BE_FORGOTTEN_SUBMITTED', 'CRITICAL', 'SERVER', $4)`,
      [
        `sec_${Date.now()}_rtbf`,
        tenantId,
        userId,
        JSON.stringify({ trackingNumber, reason }),
      ]
    );

    return {
      success: true,
      trackingNumber,
      message: 'Right to be forgotten request submitted. SLA: 30 days statutory review.',
    };
  }

  public async getRequestStatus(trackingNumber: string) {
    const res = await this.db.query(
      `SELECT * FROM gdpr_compliance_requests WHERE tracking_number = $1`,
      [trackingNumber]
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Compliance tracking number not found.');
    }

    return res.rows[0];
  }
}
