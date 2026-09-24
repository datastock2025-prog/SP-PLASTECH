import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { PlanningService } from './planning.service';
import {
  CreateItemDto,
  UpdateItemDto,
  CreateBomDto,
  UpdateBomDto,
  CreateEcrDto,
  CreateEcoDto,
  CreateRoutingDto,
  UpdateRoutingDto,
  RunMrpDto,
  CreateDemandPlanDto,
  CreateSopPlanDto,
  GenerateForecastDto,
  CreateMpsDto,
  CalculateCrpDto,
  CalculateRccpDto,
  CreateScheduleDto,
  UpdateSupplierCapacityDto,
} from './planning.dto';

@Controller('planning')
export class PlanningController {
  constructor(private readonly service: PlanningService) {}

  // ============================================================================
  // BOM / ENGINEERING (Screens 1 – 7)
  // ============================================================================

  // Screen 1: Item Master
  @Get('items')
  async getItems(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const items = await this.service.getItems(tenantId, filters);
    return { success: true, data: items, total: items.length };
  }

  @Get('items/:id')
  async getItemById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const item = await this.service.getItemById(id, tenantId);
    return { success: true, data: item };
  }

  @Post('items')
  async createItem(@Body() dto: CreateItemDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const item = await this.service.createItem(dto, tenantId, userId);
    return { success: true, data: item };
  }

  @Put('items/:id')
  async updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const item = await this.service.updateItem(id, dto, tenantId, userId);
    return { success: true, data: item };
  }

  @Post('items/:id/approve')
  async approveItem(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const item = await this.service.approveItem(id, tenantId, userId);
    return { success: true, data: item };
  }

  // Screen 2: BOM List
  @Get('boms')
  async getBoms(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const boms = await this.service.getBoms(tenantId, filters);
    return { success: true, data: boms, total: boms.length };
  }

  @Get('boms/:id')
  async getBomWithLines(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const bom = await this.service.getBomWithLines(id, tenantId);
    return { success: true, data: bom };
  }

  // Screen 3: Visual Multi-Level BOM Builder
  @Get('boms/:id/multi-level')
  async getMultiLevelBom(
    @Param('id') id: string,
    @Query('maxLevel') maxLevel: string,
    @Req() req: any
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const tree = await this.service.getMultiLevelBom(id, tenantId, maxLevel ? parseInt(maxLevel, 10) : 10);
    return { success: true, data: tree };
  }

  @Post('boms')
  async createBom(@Body() dto: CreateBomDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const bom = await this.service.createBom(dto, tenantId, userId);
    return { success: true, data: bom };
  }

  @Put('boms/:id')
  async updateBom(@Param('id') id: string, @Body() dto: UpdateBomDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const bom = await this.service.updateBom(id, dto, tenantId, userId);
    return { success: true, data: bom };
  }

  // Screen 4: BOM Versions & Diff
  @Post('boms/:id/version')
  async createBomVersion(
    @Param('id') id: string,
    @Body('changeReason') changeReason: string,
    @Req() req: any
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const version = await this.service.createBomVersion(id, tenantId, userId, changeReason || 'Engineering optimization');
    return { success: true, data: version };
  }

  @Get('boms/:id/versions')
  async getBomVersions(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const versions = await this.service.getBomVersions(id, tenantId);
    return { success: true, data: versions };
  }

  @Get('boms/diff')
  async diffBomVersions(
    @Query('bomId1') bomId1: string,
    @Query('bomId2') bomId2: string,
    @Req() req: any
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const diff = await this.service.diffBomVersions(bomId1, bomId2, tenantId);
    return { success: true, data: diff };
  }

  // Screen 5: ECO/ECR
  @Get('ecrs')
  async getEcrs(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const ecrs = await this.service.getEcrs(tenantId, filters);
    return { success: true, data: ecrs, total: ecrs.length };
  }

  @Post('ecrs')
  async createEcr(@Body() dto: CreateEcrDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const ecr = await this.service.createEcr(dto, tenantId, userId);
    return { success: true, data: ecr };
  }

  @Get('ecos')
  async getEcos(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const ecos = await this.service.getEcos(tenantId, filters);
    return { success: true, data: ecos, total: ecos.length };
  }

  @Post('ecos')
  async createEco(@Body() dto: CreateEcoDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const eco = await this.service.createEco(dto, tenantId, userId);
    return { success: true, data: eco };
  }

  // Screen 6: Process Routing
  @Get('routings')
  async getRoutings(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const routings = await this.service.getRoutings(tenantId, filters);
    return { success: true, data: routings, total: routings.length };
  }

  @Post('routings')
  async createRouting(@Body() dto: CreateRoutingDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const routing = await this.service.createRouting(dto, tenantId, userId);
    return { success: true, data: routing };
  }

  // Screen 7: Standard Cost Rollup
  @Get('costing/items/:itemId')
  async getStandardCost(@Param('itemId') itemId: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const cost = await this.service.getStandardCost(itemId, tenantId);
    return { success: true, data: cost };
  }

  @Post('costing/rollup')
  async performCostRollup(@Body('itemIds') itemIds: string[], @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.service.performCostRollup(itemIds || [], tenantId, userId);
    return result;
  }

  // ============================================================================
  // MRP ENGINE (Screens 8 – 9)
  // ============================================================================

  @Post('mrp/run')
  async runMrp(@Body() dto: RunMrpDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.service.runMrp(dto, tenantId, userId);
    return result;
  }

  @Get('mrp/runs')
  async getMrpRuns(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const runs = await this.service.getMrpRuns(tenantId, filters);
    return { success: true, data: runs };
  }

  @Get('mrp/planned-orders')
  async getPlannedOrders(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const orders = await this.service.getPlannedOrders(tenantId, filters);
    return { success: true, data: orders };
  }

  @Post('mrp/planned-orders/:id/firm')
  async firmPlannedOrder(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.service.firmPlannedOrder(id, tenantId, userId);
    return result;
  }

  @Get('mrp/exceptions')
  async getMrpExceptions(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const exceptions = await this.service.getMrpExceptions(tenantId, filters);
    return { success: true, data: exceptions };
  }

  // ============================================================================
  // DEMAND PLANNING (Screens 10 – 13)
  // ============================================================================

  @Get('demand/plans')
  async getDemandPlans(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const plans = await this.service.getDemandPlans(tenantId, filters);
    return { success: true, data: plans };
  }

  @Post('demand/plans')
  async createDemandPlan(@Body() dto: CreateDemandPlanDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const plan = await this.service.createDemandPlan(dto, tenantId, userId);
    return { success: true, data: plan };
  }

  @Get('forecast/sales')
  async getSalesForecast(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const forecast = await this.service.getSalesForecast(tenantId, filters);
    return { success: true, data: forecast };
  }

  @Get('mps/schedules')
  async getMpsSchedules(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const schedules = await this.service.getMpsSchedules(tenantId, filters);
    return { success: true, data: schedules };
  }

  @Post('mps/schedules')
  async createMpsSchedule(@Body() dto: CreateMpsDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const schedule = await this.service.createMpsSchedule(dto, tenantId, userId);
    return { success: true, data: schedule };
  }

  // ============================================================================
  // CAPACITY & ADVANCED PLANNING (Screens 14 – 19)
  // ============================================================================

  @Post('capacity/crp/calculate')
  async calculateCrp(@Body() dto: CalculateCrpDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.service.calculateCrp(dto, tenantId, userId);
    return { success: true, data: result };
  }

  @Post('capacity/rccp/calculate')
  async calculateRccp(@Body() dto: CalculateRccpDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.service.calculateRccp(dto, tenantId, userId);
    return { success: true, data: result };
  }

  @Get('scheduling/finite')
  async getFiniteSchedules(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const schedules = await this.service.getFiniteSchedules(tenantId, filters);
    return { success: true, data: schedules };
  }

  @Post('scheduling/finite')
  async createFiniteSchedule(@Body() dto: CreateScheduleDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const schedule = await this.service.createFiniteSchedule(dto, tenantId, userId);
    return { success: true, data: schedule };
  }

  @Get('dashboard/material')
  async getMaterialDashboard(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getMaterialDashboard(tenantId);
    return { success: true, data };
  }

  @Get('supplier-capacity')
  async getSupplierCapacity(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSupplierCapacity(tenantId, filters);
    return { success: true, data };
  }

  @Post('supplier-capacity')
  async updateSupplierCapacity(@Body() dto: UpdateSupplierCapacityDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.service.updateSupplierCapacity(dto, tenantId, userId);
    return { success: true, data: result };
  }

  @Get('analytics/kpis')
  async getPlanningAnalytics(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getPlanningAnalytics(tenantId, filters);
    return { success: true, data };
  }
}
