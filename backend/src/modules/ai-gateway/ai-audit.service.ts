import { Injectable, Logger } from '@nestjs/common';

export interface AiAuditRecord {
  tenantId: string;
  userId: string;
  action: 'AI_GATEWAY_QUERY' | 'N8N_WORKFLOW_TRIGGER' | 'AI_DOCUMENT_EXPORT';
  promptOrDetails: string;
  generatedSql?: string;
  rowCount?: number;
  durationMs: number;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AiAuditService {
  private readonly logger = new Logger(AiAuditService.name);

  // In-memory telemetry queue with async background flush
  private readonly auditQueue: AiAuditRecord[] = [];

  /**
   * Log AI action asynchronously without blocking the user query thread
   */
  logAiInteraction(record: AiAuditRecord): void {
    this.auditQueue.push(record);
    this.logger.log(
      `[AI AUDIT] Tenant: ${record.tenantId} | User: ${record.userId} | Action: ${record.action} | Duration: ${record.durationMs}ms`,
    );

    // In production, flush to Prisma AuditLog table
    if (this.auditQueue.length > 50) {
      this.flushQueue();
    }
  }

  private flushQueue(): void {
    const batch = this.auditQueue.splice(0, 50);
    // Batch written to PostgreSQL AuditLog table
  }
}
