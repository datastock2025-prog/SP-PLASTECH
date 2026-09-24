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
import { OperationsService } from './operations.service';
import {
  CreateJitScheduleDto,
  CreateWorkOrderDto,
  CreateProductionEntryDto,
  CreateWipOperationDto,
  LogMachineTelemetryDto,
  CreateDowntimeRecordDto,
  CreateBatchRecordDto,
  QrScanDto,
  CreateChangeoverDto,
  CreateMaterialIssueDto,
  CreateShiftHandoverDto,
  CreateGrnDto,
  CreatePutawayDto,
  CreatePickingDto,
  CreateStockMovementDto,
  CreateStockCountDto,
  CreateInspectionDto,
  CreateNcrDto,
  CreateCapaDto,
  CreateMaintenanceScheduleDto,
  CreateMaintenanceWorkOrderDto,
  CreateSparePartDto,
} from './operations.dto';

@Controller('operations')
export class OperationsController {
  constructor(private readonly service: OperationsService) {}

  // ============================================================================
  // PRODUCTION (Screens 1 – 16)
  // ============================================================================

  // Screen 1: JIT Scheduling
  @Get('production/jit-schedules')
  async getJitSchedules(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const schedules = await this.service.getJitSchedules(tenantId);
    return { success: true, data: schedules };
  }

  @Post('production/jit-schedules')
  async createJitSchedule(@Body() dto: CreateJitScheduleDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const schedule = await this.service.createJitSchedule(dto, tenantId, userId);
    return { success: true, data: schedule };
  }

  // Screen 2: Work Orders
  @Get('production/work-orders')
  async getWorkOrders(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const orders = await this.service.getWorkOrders(tenantId);
    return { success: true, data: orders };
  }

  @Get('production/work-orders/:id')
  async getWorkOrderById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const order = await this.service.getWorkOrderById(id, tenantId);
    return { success: true, data: order };
  }

  @Post('production/work-orders')
  async createWorkOrder(@Body() dto: CreateWorkOrderDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const order = await this.service.createWorkOrder(dto, tenantId, userId);
    return { success: true, data: order };
  }

  @Put('production/work-orders/:id/status')
  async updateWorkOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const order = await this.service.updateWorkOrderStatus(id, status, tenantId, userId);
    return { success: true, data: order };
  }

  // Screen 3: Daily Production Entry
  @Get('production/entries')
  async getProductionEntries(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const entries = await this.service.getProductionEntries(tenantId);
    return { success: true, data: entries };
  }

  @Post('production/entries')
  async createProductionEntry(@Body() dto: CreateProductionEntryDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const entry = await this.service.createProductionEntry(dto, tenantId, userId);
    return { success: true, data: entry };
  }

  // Screen 4: WIP Operations
  @Get('production/wip')
  async getWipOperations(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const wip = await this.service.getWipOperations(tenantId);
    return { success: true, data: wip };
  }

  @Post('production/wip')
  async createWipOperation(@Body() dto: CreateWipOperationDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const wip = await this.service.createWipOperation(dto, tenantId, userId);
    return { success: true, data: wip };
  }

  // Screen 5 & 6: Shop Floor & Machine Telemetry
  @Get('production/shop-floor')
  async getShopFloorConsole(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getShopFloorConsole(tenantId);
    return { success: true, data };
  }

  @Post('production/telemetry')
  async logTelemetry(@Body() dto: LogMachineTelemetryDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const telem = await this.service.logTelemetry(dto, tenantId);
    return { success: true, data: telem };
  }

  // Screen 7: Downtime & Scrap
  @Get('production/downtime')
  async getDowntimeRecords(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const records = await this.service.getDowntimeRecords(tenantId);
    return { success: true, data: records };
  }

  @Post('production/downtime')
  async createDowntimeRecord(@Body() dto: CreateDowntimeRecordDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const record = await this.service.createDowntimeRecord(dto, tenantId, userId);
    return { success: true, data: record };
  }

  // Screen 8 & 9: Batch Records, Genealogy & QR
  @Get('production/batches')
  async getBatchRecords(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const batches = await this.service.getBatchRecords(tenantId);
    return { success: true, data: batches };
  }

  @Post('production/batches')
  async createBatchRecord(@Body() dto: CreateBatchRecordDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const batch = await this.service.createBatchRecord(dto, tenantId, userId);
    return { success: true, data: batch };
  }

  @Post('production/traceability/verify-qr')
  async verifyQrCode(@Body() dto: QrScanDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.service.verifyQrCode(dto, tenantId, userId);
    return { success: true, ...result };
  }

  // Screen 10 & 11: Changeover Matrix & Material Issue
  @Get('production/changeovers')
  async getChangeovers(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const changeovers = await this.service.getChangeovers(tenantId);
    return { success: true, data: changeovers };
  }

  @Post('production/changeovers')
  async createChangeover(@Body() dto: CreateChangeoverDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const changeover = await this.service.createChangeover(dto, tenantId, userId);
    return { success: true, data: changeover };
  }

  @Get('production/material-issues')
  async getMaterialIssues(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const issues = await this.service.getMaterialIssues(tenantId);
    return { success: true, data: issues };
  }

  @Post('production/material-issues')
  async createMaterialIssue(@Body() dto: CreateMaterialIssueDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const issue = await this.service.createMaterialIssue(dto, tenantId, userId);
    return { success: true, data: issue };
  }

  // Screen 15 & 16: Yield Report & Shift Handover
  @Get('production/yield-report')
  async getYieldReport(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const yieldReport = await this.service.getYieldReport(tenantId);
    return { success: true, data: yieldReport };
  }

  @Get('production/shift-handovers')
  async getShiftHandovers(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const handovers = await this.service.getShiftHandovers(tenantId);
    return { success: true, data: handovers };
  }

  @Post('production/shift-handovers')
  async createShiftHandover(@Body() dto: CreateShiftHandoverDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const handover = await this.service.createShiftHandover(dto, tenantId, userId);
    return { success: true, data: handover };
  }

  // ============================================================================
  // WAREHOUSE (Screens 17 – 28)
  // ============================================================================

  // Screen 17: Inventory Stock
  @Get('warehouse/stocks')
  async getInventoryStock(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const stocks = await this.service.getInventoryStock(tenantId);
    return { success: true, data: stocks };
  }

  // Screen 18: Goods Receipts (GRN)
  @Get('warehouse/goods-receipts')
  async getGoodsReceipts(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const grns = await this.service.getGoodsReceipts(tenantId);
    return { success: true, data: grns };
  }

  @Post('warehouse/goods-receipts')
  async createGoodsReceipt(@Body() dto: CreateGrnDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const grn = await this.service.createGoodsReceipt(dto, tenantId, userId);
    return { success: true, data: grn };
  }

  // Screen 19 & 20: Putaway & Picking Tasks
  @Get('warehouse/putaways')
  async getPutawayTasks(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const tasks = await this.service.getPutawayTasks(tenantId);
    return { success: true, data: tasks };
  }

  @Post('warehouse/putaways')
  async createPutawayTask(@Body() dto: CreatePutawayDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const task = await this.service.createPutawayTask(dto, tenantId, userId);
    return { success: true, data: task };
  }

  @Get('warehouse/pickings')
  async getPickingTasks(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const tasks = await this.service.getPickingTasks(tenantId);
    return { success: true, data: tasks };
  }

  @Post('warehouse/pickings')
  async createPickingTask(@Body() dto: CreatePickingDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const task = await this.service.createPickingTask(dto, tenantId, userId);
    return { success: true, data: task };
  }

  // Screen 21 & 22: Stock Transfers & Counts
  @Get('warehouse/movements')
  async getStockMovements(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const movements = await this.service.getStockMovements(tenantId);
    return { success: true, data: movements };
  }

  @Post('warehouse/movements')
  async createStockMovement(@Body() dto: CreateStockMovementDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const movement = await this.service.createStockMovement(dto, tenantId, userId);
    return { success: true, data: movement };
  }

  @Get('warehouse/counts')
  async getStockCounts(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const counts = await this.service.getStockCounts(tenantId);
    return { success: true, data: counts };
  }

  @Post('warehouse/counts')
  async createStockCount(@Body() dto: CreateStockCountDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const count = await this.service.createStockCount(dto, tenantId, userId);
    return { success: true, data: count };
  }

  @Get('warehouse/dashboard')
  async getWarehouseDashboard(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getWarehouseDashboard(tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // QUALITY MANAGEMENT (Screens 29 – 33)
  // ============================================================================

  // Screen 29 & 30: QC Dashboard & Inspections
  @Get('quality/dashboard')
  async getQcDashboard(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getQcDashboard(tenantId);
    return { success: true, data };
  }

  @Get('quality/inspections')
  async getInspections(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const inspections = await this.service.getInspections(tenantId);
    return { success: true, data: inspections };
  }

  @Post('quality/inspections')
  async createInspection(@Body() dto: CreateInspectionDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const inspection = await this.service.createInspection(dto, tenantId, userId);
    return { success: true, data: inspection };
  }

  // Screen 31 & 32: NCR & CAPA
  @Get('quality/ncrs')
  async getNcrs(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const ncrs = await this.service.getNcrs(tenantId);
    return { success: true, data: ncrs };
  }

  @Post('quality/ncrs')
  async createNcr(@Body() dto: CreateNcrDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const ncr = await this.service.createNcr(dto, tenantId, userId);
    return { success: true, data: ncr };
  }

  @Get('quality/capas')
  async getCapas(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const capas = await this.service.getCapas(tenantId);
    return { success: true, data: capas };
  }

  @Post('quality/capas')
  async createCapa(@Body() dto: CreateCapaDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const capa = await this.service.createCapa(dto, tenantId, userId);
    return { success: true, data: capa };
  }

  @Get('quality/supplier-ratings')
  async getSupplierQuality(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const ratings = await this.service.getSupplierQuality(tenantId);
    return { success: true, data: ratings };
  }

  // ============================================================================
  // MAINTENANCE (Screens 34 – 36)
  // ============================================================================

  // Screen 34: Maintenance Schedule
  @Get('maintenance/schedules')
  async getMaintenanceSchedules(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const schedules = await this.service.getMaintenanceSchedules(tenantId);
    return { success: true, data: schedules };
  }

  @Post('maintenance/schedules')
  async createMaintenanceSchedule(@Body() dto: CreateMaintenanceScheduleDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const schedule = await this.service.createMaintenanceSchedule(dto, tenantId, userId);
    return { success: true, data: schedule };
  }

  // Screen 35: Maintenance Work Orders
  @Get('maintenance/work-orders')
  async getMaintenanceWorkOrders(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const orders = await this.service.getMaintenanceWorkOrders(tenantId);
    return { success: true, data: orders };
  }

  @Post('maintenance/work-orders')
  async createMaintenanceWorkOrder(@Body() dto: CreateMaintenanceWorkOrderDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const order = await this.service.createMaintenanceWorkOrder(dto, tenantId, userId);
    return { success: true, data: order };
  }

  // Screen 36: Spare Parts
  @Get('maintenance/spare-parts')
  async getSpareParts(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const parts = await this.service.getSpareParts(tenantId);
    return { success: true, data: parts };
  }

  @Post('maintenance/spare-parts')
  async createSparePart(@Body() dto: CreateSparePartDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const part = await this.service.createSparePart(dto, tenantId, userId);
    return { success: true, data: part };
  }
}
