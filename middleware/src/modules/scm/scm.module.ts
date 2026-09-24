import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ApprovalWorkflowModule } from '../approval-workflow/approval-workflow.module';
import { ScmController } from './scm.controller';
import { ScmService } from './scm.service';

@Module({
  imports: [DatabaseModule, ApprovalWorkflowModule],
  controllers: [ScmController],
  providers: [ScmService],
  exports: [ScmService],
})
export class ScmModule {}
