import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ApprovalWorkflowController } from './approval-workflow.controller';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { SlaEscalationService } from './sla-escalation.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ApprovalWorkflowController],
  providers: [ApprovalWorkflowService, SlaEscalationService],
  exports: [ApprovalWorkflowService],
})
export class ApprovalWorkflowModule {}
