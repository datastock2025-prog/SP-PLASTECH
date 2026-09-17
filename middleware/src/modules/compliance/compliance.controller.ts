import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentTenant } from '../../common/decorators/auth.decorators';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @UseGuards(JwtAuthGuard)
  @Post('gdpr/export')
  async exportUserData(
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string
  ) {
    const data = await this.complianceService.exportUserData(userId, tenantId);
    return {
      success: true,
      ...data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('gdpr/anonymize')
  async requestAnonymization(
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
    @Body('reason') reason?: string
  ) {
    const res = await this.complianceService.requestAnonymization(userId, tenantId, reason);
    return res;
  }

  @Get('gdpr/status/:trackingNumber')
  async getStatus(@Param('trackingNumber') trackingNumber: string) {
    const status = await this.complianceService.getRequestStatus(trackingNumber);
    return {
      success: true,
      status,
    };
  }
}
