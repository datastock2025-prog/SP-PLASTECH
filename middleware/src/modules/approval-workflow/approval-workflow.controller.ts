import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApprovalWorkflowService } from './approval-workflow.service';
import {
  SubmitWorkflowInstanceDto,
  ProcessApprovalActionDto,
  CreateDelegationDto,
  BreakGlassOverrideDto,
  WorkflowSimulationDto,
} from './approval-workflow.dto';

@Controller('approvals')
export class ApprovalWorkflowController {
  constructor(private readonly workflowService: ApprovalWorkflowService) {}

  @Post('submit')
  async submitDocument(@Body() dto: SubmitWorkflowInstanceDto) {
    return this.workflowService.submitDocumentForApproval(dto);
  }

  @Post('tasks/:id/action')
  async processAction(
    @Param('id') taskId: string,
    @Body() dto: ProcessApprovalActionDto
  ) {
    return this.workflowService.processApprovalAction(taskId, dto);
  }

  @Get('inbox')
  async getInbox(
    @Query('userId') userId: string,
    @Query('tenantId') tenantId?: string
  ) {
    return this.workflowService.getUserApprovalsInbox(userId || 'USR-ADMIN-01', tenantId || 'TENANT-ALPHA-IND');
  }

  @Post('delegations')
  async createDelegation(@Body() dto: CreateDelegationDto) {
    return this.workflowService.createDelegation(dto);
  }

  @Post('break-glass')
  async executeBreakGlass(
    @Body() dto: BreakGlassOverrideDto,
    @Req() req: any
  ) {
    const clientIp = req?.ip || req?.connection?.remoteAddress || '127.0.0.1';
    return this.workflowService.executeBreakGlassOverride({ ...dto, clientIp });
  }

  @Post('simulate')
  async simulateRouting(@Body() dto: WorkflowSimulationDto) {
    return this.workflowService.simulateWorkflow(dto);
  }
}
