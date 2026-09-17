import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as XLSX from 'xlsx';

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(private readonly db: DatabaseService) {}

  public async ingestBatch(events: any[], ipAddress: string, userAgent: string) {
    let count = 0;
    for (const e of events) {
      const id = e.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const tenantId = e.tenantId || 'TENANT-ALPHA-IND';
      const actorId = e.actorId || 'current_user';
      const eventType = e.type || e.eventType || 'SECURITY_GENERIC_EVENT';
      const severity = e.severity || 'INFO';
      const details = JSON.stringify(e.details || {});
      const timestamp = e.timestamp ? new Date(e.timestamp) : new Date();

      try {
        await this.db.query(
          `INSERT INTO security_audit_logs (id, tenant_id, actor_id, event_type, severity, ip_address, user_agent, details, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [id, tenantId, actorId, eventType, severity, ipAddress, userAgent, details, timestamp]
        );
        count++;
      } catch (err: any) {
        this.logger.warn(`Failed to ingest log item: ${err.message}`);
      }
    }

    return { ingested: count };
  }

  public async getRecentLogs(tenantId?: string, severity?: string, limit = 100) {
    let query = `SELECT * FROM security_audit_logs WHERE 1=1`;
    const params: any[] = [];

    if (tenantId) {
      params.push(tenantId);
      query += ` AND tenant_id = $${params.length}`;
    }

    if (severity && severity !== 'ALL') {
      params.push(severity);
      query += ` AND severity = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await this.db.query(query, params);
    return res.rows;
  }

  public async exportAuditLogs(tenantId: string, userFullName: string, userEmail: string, format = 'xlsx'): Promise<Buffer> {
    const logs = await this.getRecentLogs(tenantId, undefined, 5000);

    const timestamp = new Date().toISOString();
    const watermarkBanner = `[CONFIDENTIAL] Exported by: ${userFullName} (${userEmail}) | Tenant: ${tenantId} | Timestamp: ${timestamp}`;

    const formattedRows = logs.map((l: any) => ({
      Timestamp: l.created_at,
      Incident_ID: l.id,
      Severity: l.severity,
      Event_Type: l.event_type,
      Actor_ID: l.actor_id,
      IP_Address: l.ip_address,
      Details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details),
    }));

    const ws = XLSX.utils.json_to_sheet(formattedRows);

    if (!ws['!comments']) ws['!comments'] = [];
    ws['!comments'].push({
      a: 'A1',
      t: {
        a: userFullName,
        r: watermarkBanner,
      },
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SecurityAudit');

    const ext = format.toLowerCase();
    const outputBuffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: ext === 'csv' ? 'csv' : 'xlsx',
    });

    return outputBuffer;
  }
}
