import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { MfgQualityService } from './mfg-quality.service';
import {
  CreateBomRevisionDto,
  CreateWorkOrderDto,
  MachineTelemetryDto,
  SpcDataEntryDto,
  CreateMrbDispositionDto,
} from './mfg-quality.dto';

@Controller('mfg-quality')
export class MfgQualityController {
  constructor(private readonly mfgService: MfgQualityService) {}

  @Post('boms')
  async createBomRevision(@Body() dto: CreateBomRevisionDto) {
    return this.mfgService.createBomRevision(dto);
  }

  @Get('boms/:productCode')
  async getBomExplosion(
    @Param('productCode') productCode: string,
    @Query('revision') revision?: string
  ) {
    return this.mfgService.getBomExplosion(productCode, revision || 'Rev-A');
  }

  @Post('work-orders')
  async createWorkOrder(@Body() dto: CreateWorkOrderDto) {
    return this.mfgService.createWorkOrder(dto);
  }

  @Get('work-orders')
  async getWorkOrders(@Query('tenantId') tenantId?: string) {
    return this.mfgService.getWorkOrders(tenantId || 'TENANT-ALPHA-IND');
  }

  @Post('oee/calculate')
  async calculateOee(@Body() dto: MachineTelemetryDto) {
    return this.mfgService.calculateOee(dto);
  }

  @Post('spc/datapoints')
  async recordSpcSubgroup(@Body() dto: SpcDataEntryDto) {
    return this.mfgService.recordSpcSubgroup(dto);
  }

  @Post('mrb/dispositions')
  async createMrbDisposition(@Body() dto: CreateMrbDispositionDto) {
    return this.mfgService.createMrbDisposition(dto);
  }

  @Get('mrb/dispositions')
  async getMrbDispositions(@Query('tenantId') tenantId?: string) {
    return this.mfgService.getMrbDispositions(tenantId || 'TENANT-ALPHA-IND');
  }
}
