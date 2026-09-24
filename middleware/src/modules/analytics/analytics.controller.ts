import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RagService } from './rag/rag.service';
import {
  CreateKpiSnapshotDto,
  CalculateOeeDto,
  DefectAnalysisDto,
  CreateAgingSnapshotDto,
  CreateScmSnapshotDto,
  CreateEsgSnapshotDto,
  CreateMaintenanceSnapshotDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  SetPermissionsDto,
  ExportDocumentDto,
  CreateCustomReportDto,
  SetCacheDto,
} from './analytics.dto';
import { CreateChatSessionDto, SendMessageDto, ExportChatDto } from './rag/rag.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly ragService: RagService,
  ) {}

  // ==================== SCREEN 1: EXECUTIVE KPI DASHBOARD ====================
  @Get('executive-kpis')
  async getExecutiveKpis(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getExecutiveKpis(tenantId, filters);
  }

  @Get('executive-kpis/:category')
  async getKpisByCategory(@Param('category') category: string, @Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getKpisByCategory(category, tenantId, filters);
  }

  @Post('executive-kpis/snapshot')
  async createKpiSnapshot(@Body() dto: CreateKpiSnapshotDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.createKpiSnapshot(dto, tenantId, userId);
  }

  // ==================== SCREEN 2: OEE ANALYTICS & LOSS PARETO ====================
  @Get('oee/metrics')
  async getOeeMetrics(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getOeeMetrics(tenantId, filters);
  }

  @Get('oee/machines/:machineId')
  async getMachineOee(@Param('machineId') machineId: string, @Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getMachineOee(machineId, tenantId, filters);
  }

  @Get('oee/loss-pareto')
  async getLossPareto(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getLossPareto(tenantId, filters);
  }

  @Post('oee/calculate')
  async calculateOee(@Body() dto: CalculateOeeDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.calculateOee(dto, tenantId, userId);
  }

  // ==================== SCREEN 3: QUALITY DEFECT PPM & SIX SIGMA ====================
  @Get('quality/metrics')
  async getQualityMetrics(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getQualityMetrics(tenantId, filters);
  }

  @Get('quality/ppm')
  async getPpmMetrics(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getPpmMetrics(tenantId, filters);
  }

  @Get('quality/six-sigma')
  async getSixSigmaMetrics(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getSixSigmaMetrics(tenantId, filters);
  }

  @Post('quality/defect-analysis')
  async recordDefectAnalysis(@Body() dto: DefectAnalysisDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.recordDefectAnalysis(dto, tenantId);
  }

  // ==================== SCREEN 4: INVENTORY AGING & VELOCITY ====================
  @Get('inventory/aging')
  async getInventoryAging(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getInventoryAging(tenantId, filters);
  }

  @Get('inventory/velocity')
  async getInventoryVelocity(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getInventoryVelocity(tenantId, filters);
  }

  @Post('inventory/aging/snapshot')
  async createAgingSnapshot(@Body() dto: CreateAgingSnapshotDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.createAgingSnapshot(dto, tenantId, userId);
  }

  // ==================== SCREEN 5: SUPPLY CHAIN PERFORMANCE REPORTS ====================
  @Get('scm/performance')
  async getScmPerformance(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getScmPerformance(tenantId, filters);
  }

  @Get('scm/supplier-performance')
  async getSupplierPerformance(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getSupplierPerformance(tenantId, filters);
  }

  @Post('scm/performance/snapshot')
  async createScmSnapshot(@Body() dto: CreateScmSnapshotDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.createScmSnapshot(dto, tenantId, userId);
  }

  // ==================== SCREEN 6: ESG & CARBON FOOTPRINT ====================
  @Get('esg/metrics')
  async getEsgMetrics(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getEsgMetrics(tenantId, filters);
  }

  @Get('esg/carbon-footprint')
  async getCarbonFootprint(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getCarbonFootprint(tenantId, filters);
  }

  @Post('esg/metrics/snapshot')
  async createEsgSnapshot(@Body() dto: CreateEsgSnapshotDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.createEsgSnapshot(dto, tenantId, userId);
  }

  // ==================== SCREEN 7: MAINTENANCE MTBF & MTTR ====================
  @Get('maintenance/metrics')
  async getMaintenanceMetrics(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getMaintenanceMetrics(tenantId, filters);
  }

  @Get('maintenance/mtbf-mttr')
  async getMtbfMttr(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getMtbfMttr(tenantId, filters);
  }

  @Post('maintenance/metrics/snapshot')
  async createMaintenanceSnapshot(@Body() dto: CreateMaintenanceSnapshotDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.createMaintenanceSnapshot(dto, tenantId, userId);
  }

  // ==================== DOCUMENT MANAGEMENT SYSTEM ====================
  @Get('documents/templates')
  async getDocumentTemplates(@Query() filters: any, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getDocumentTemplates(tenantId, filters);
  }

  @Post('documents/templates')
  async createDocumentTemplate(@Body() dto: CreateTemplateDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.createDocumentTemplate(dto, tenantId, userId);
  }

  @Put('documents/templates/:id')
  async updateDocumentTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.updateDocumentTemplate(id, dto, tenantId, userId);
  }

  @Get('documents/templates/:id/permissions')
  async getTemplatePermissions(@Param('id') id: string, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getTemplatePermissions(id, tenantId);
  }

  @Post('documents/templates/:id/permissions')
  async setTemplatePermissions(@Param('id') id: string, @Body() dto: SetPermissionsDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.setTemplatePermissions(id, dto, tenantId, userId);
  }

  @Post('documents/templates/:id/export')
  async exportDocument(@Param('id') id: string, @Body() dto: ExportDocumentDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.exportDocument(id, dto, tenantId, userId);
  }

  @Get('documents/custom-reports')
  async getCustomReports(@Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.getCustomReports(tenantId, userId);
  }

  @Post('documents/custom-reports')
  async createCustomReport(@Body() dto: CreateCustomReportDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.analyticsService.createCustomReport(dto, tenantId, userId);
  }

  // ==================== RAG CHAT SYSTEM ====================
  @Post('chat/sessions')
  async createChatSession(@Body() dto: CreateChatSessionDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.ragService.createChatSession(dto, tenantId, userId);
  }

  @Post('chat/sessions/:sessionId/messages')
  async sendMessage(@Param('sessionId') sessionId: string, @Body() dto: SendMessageDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.ragService.sendMessage(sessionId, dto, tenantId, userId);
  }

  @Get('chat/sessions/:sessionId/messages')
  async getChatHistory(@Param('sessionId') sessionId: string, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.ragService.getChatHistory(sessionId, tenantId);
  }

  @Post('chat/sessions/:sessionId/export')
  async exportChatToDocument(@Param('sessionId') sessionId: string, @Body() dto: ExportChatDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req?.user?.id || 'USR-ADMIN-01';
    return this.ragService.exportChatToDocument(sessionId, dto, tenantId, userId);
  }

  // ==================== HIGH-TRAFFIC CACHE OPTIMIZATION ====================
  @Get('cache/analytics')
  async getCachedAnalytics(@Query('key') key: string, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.getCachedAnalytics(key, tenantId);
  }

  @Post('cache/analytics')
  async setCachedAnalytics(@Body() dto: SetCacheDto, @Req() req?: any) {
    const tenantId = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.analyticsService.setCachedAnalytics(dto, tenantId);
  }
}
