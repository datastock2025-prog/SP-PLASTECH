import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantContextInterceptor } from './interceptors/tenant-context.interceptor';
import { AiGatewayService } from './ai-gateway.service';

export interface AiGatewayQueryDto {
  prompt: string;
  generateDoc?: boolean;
}

export interface N8nTriggerDto {
  workflowName: string;
  payload: Record<string, any>;
}

@Controller('api/ai-gateway')
@UseInterceptors(TenantContextInterceptor)
export class AiGatewayController {
  constructor(private readonly aiGatewayService: AiGatewayService) {}

  /**
   * Endpoint for Open WebUI & Frontend Chat to query ERP data
   */
  @Post('query')
  @HttpCode(HttpStatus.OK)
  async handleAiQuery(
    @Body() dto: AiGatewayQueryDto,
    @Req() req: any,
    @Headers('x-tenant-id') headerTenant?: string,
  ) {
    const tenantId = headerTenant || req.user?.tenantId || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'openwebui-user';

    return await this.aiGatewayService.processAiQuery({
      prompt: dto.prompt,
      tenantId,
      userId,
      userRole: req.user?.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  /**
   * Endpoint to trigger external n8n workflows (Google, Outlook, Notion, Slack)
   */
  @Post('n8n-trigger')
  @HttpCode(HttpStatus.OK)
  async triggerN8n(
    @Body() dto: N8nTriggerDto,
    @Req() req: any,
    @Headers('x-tenant-id') headerTenant?: string,
  ) {
    const tenantId = headerTenant || req.user?.tenantId || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'system-user';

    return await this.aiGatewayService.triggerN8nWorkflow({
      workflowName: dto.workflowName,
      tenantId,
      userId,
      payload: dto.payload || {},
    });
  }
}
