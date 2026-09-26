import { Module } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';

@Module({
  providers: [WorkflowEngineService],
  exports: [WorkflowEngineService],
})
export class WorkflowModule {}
