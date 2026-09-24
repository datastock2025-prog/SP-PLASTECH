import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class SlaEscalationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SlaEscalationService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    // Run SLA check every 60 seconds
    this.timer = setInterval(() => this.evaluateSlaBreaches(), 60000);
    this.logger.log('SLA Escalation Engine initialized (60s tick frequency)');
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /**
   * Scan for pending approval tasks exceeding due_date
   */
  public async evaluateSlaBreaches() {
    if (!this.db.isDbConnected()) return;

    try {
      const breached = await this.db.query(
        `SELECT t.id, t.instance_id, t.tier_number, t.stage_name, t.due_date,
                i.document_ref, i.domain, i.workflow_id
         FROM admin_approval_tasks t
         JOIN admin_approval_instances i ON t.instance_id = i.id
         WHERE t.status = 'PENDING' AND t.due_date < NOW()
         LIMIT 20`
      );

      if (breached.rows.length === 0) return;

      this.logger.warn(`Found ${breached.rows.length} approval tasks with breached turnaround SLAs.`);

      for (const task of breached.rows) {
        await this.db.withAdvisoryLock(`sla_escalate_${task.id}`, async () => {
          // Mark task as ESCALATED
          await this.db.query(
            `UPDATE admin_approval_tasks
             SET status = 'ESCALATED', decision_notes = 'Auto-escalated by system: Stage turnaround SLA exceeded.'
             WHERE id = $1`,
            [task.id]
          );

          this.logger.log(`Task ${task.id} for document ${task.document_ref} marked as ESCALATED.`);
        });
      }
    } catch (err: any) {
      this.logger.error(`SLA Escalation evaluation notice: ${err.message}`);
    }
  }
}
