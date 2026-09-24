import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ApprovalWorkflowModule } from '../approval-workflow/approval-workflow.module';
import { MfgQualityController } from './mfg-quality.controller';
import { MfgQualityService } from './mfg-quality.service';

@Module({
  imports: [DatabaseModule, ApprovalWorkflowModule],
  controllers: [MfgQualityController],
  providers: [MfgQualityService],
  exports: [MfgQualityService],
})
export class MfgQualityModule {}
