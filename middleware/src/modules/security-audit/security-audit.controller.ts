import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Ip,
  Headers,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { SecurityAuditService } from './security-audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentTenant, RequirePermissions } from '../../common/decorators/auth.decorators';
import { RolesPermissionsGuard } from '../../common/guards/roles-permissions.guard';

@Controller('security')
export class SecurityAuditController {
  constructor(private readonly auditService: SecurityAuditService) {}

  @Post('events/batch')
  async ingestBatch(
    @Body('events') events: any[],
    @Ip() ip: string,
    @Headers('user-agent') userAgent = 'Unknown'
  ) {
    if (!Array.isArray(events) || events.length === 0) {
      return { success: true, count: 0 };
    }
    const res = await this.auditService.ingestBatch(events, ip, userAgent);
    return { success: true, ...res };
  }

  @UseGuards(JwtAuthGuard, RolesPermissionsGuard)
  @RequirePermissions('audit.view')
  @Get('events')
  async getEvents(
    @CurrentTenant() tenantId: string,
    @Query('severity') severity?: string,
    @Query('limit') limit = '100'
  ) {
    const logs = await this.auditService.getRecentLogs(tenantId, severity, parseInt(limit, 10));
    return {
      success: true,
      logs,
    };
  }

  @UseGuards(JwtAuthGuard, RolesPermissionsGuard)
  @RequirePermissions('audit.export')
  @Get('events/export')
  async exportEvents(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Query('format') format = 'xlsx',
    @Res() res: Response
  ) {
    const buffer = await this.auditService.exportAuditLogs(
      tenantId,
      user?.fullName || 'Security Auditor',
      user?.email || 'security@rebooterp.com',
      format
    );

    const ext = format.toLowerCase() === 'csv' ? 'csv' : 'xlsx';
    const filename = `security_audit_${tenantId}_${Date.now()}.${ext}`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader(
      'Content-Type',
      ext === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buffer);
  }
}
