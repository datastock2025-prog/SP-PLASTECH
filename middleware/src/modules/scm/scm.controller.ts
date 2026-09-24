import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ScmService } from './scm.service';
import {
  CreatePurchaseRequisitionDto,
  CreatePurchaseOrderDto,
  CreateGoodsReceiptNoteDto,
  ThreeWayMatchEvaluationDto,
  InventoryStockMovementDto,
  AtomicStockReservationDto,
} from './scm.dto';

@Controller('scm')
export class ScmController {
  constructor(private readonly scmService: ScmService) {}

  @Post('requisitions')
  async createRequisition(@Body() dto: CreatePurchaseRequisitionDto) {
    return this.scmService.createPurchaseRequisition(dto);
  }

  @Get('requisitions')
  async getRequisitions(@Query('tenantId') tenantId?: string) {
    return this.scmService.getPurchaseRequisitions(tenantId || 'TENANT-ALPHA-IND');
  }

  @Post('purchase-orders')
  async createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto) {
    return this.scmService.createPurchaseOrder(dto);
  }

  @Get('purchase-orders')
  async getPurchaseOrders(@Query('tenantId') tenantId?: string) {
    return this.scmService.getPurchaseOrders(tenantId || 'TENANT-ALPHA-IND');
  }

  @Post('grn')
  async createGoodsReceiptNote(@Body() dto: CreateGoodsReceiptNoteDto) {
    return this.scmService.createGoodsReceiptNote(dto);
  }

  @Post('3-way-match')
  async evaluateMatch(@Body() dto: ThreeWayMatchEvaluationDto) {
    return this.scmService.evaluateThreeWayMatch(dto);
  }

  @Post('inventory/move')
  async recordMovement(@Body() dto: InventoryStockMovementDto) {
    return this.scmService.recordStockMovement(dto);
  }

  @Post('inventory/reserve')
  async reserveStock(@Body() dto: AtomicStockReservationDto) {
    return this.scmService.reserveAtomicStock(dto);
  }

  @Get('inventory/balances')
  async getBalances(@Query('tenantId') tenantId?: string) {
    return this.scmService.getInventoryBalances(tenantId || 'TENANT-ALPHA-IND');
  }
}
