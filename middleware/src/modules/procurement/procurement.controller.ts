import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePrDto,
  UpdatePrDto,
  CreateRfqDto,
  SubmitBidDto,
  CreatePoDto,
  UpdatePoDto,
  CreateGrnDto,
  InspectGrnDto,
  CreateReturnDto,
  CalculatePerformanceDto,
  CreateRiskAssessmentDto,
  CreateContractDto,
  CreateBlanketPoDto,
  CreatePriceListDto,
} from './procurement.dto';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly service: ProcurementService) {}

  // ============================================================================
  // SCREEN 1: SUPPLIER DIRECTORY
  // ============================================================================

  @Get('suppliers')
  async getSuppliers(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSuppliers(tenantId, filters);
    return { success: true, data };
  }

  @Post('suppliers')
  async createSupplier(@Body() dto: CreateSupplierDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createSupplier(dto, tenantId, userId);
    return { success: true, data };
  }

  @Put('suppliers/:id')
  async updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.updateSupplier(id, dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('suppliers/:id/approve')
  async approveSupplier(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approveSupplier(id, tenantId, userId);
  }

  @Get('suppliers/:id/360')
  async getSupplier360(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSupplier360(id, tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 2: PURCHASE REQUISITIONS (PR)
  // ============================================================================

  @Get('purchase-requisitions')
  async getPurchaseRequisitions(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getPurchaseRequisitions(tenantId, filters);
    return { success: true, data };
  }

  @Post('purchase-requisitions')
  async createPurchaseRequisition(@Body() dto: CreatePrDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createPurchaseRequisition(dto, tenantId, userId);
    return { success: true, data };
  }

  @Put('purchase-requisitions/:id')
  async updatePurchaseRequisition(@Param('id') id: string, @Body() dto: UpdatePrDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.updatePurchaseRequisition(id, dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('purchase-requisitions/:id/approve')
  async approvePurchaseRequisition(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approvePurchaseRequisition(id, tenantId, userId);
  }

  @Post('purchase-requisitions/:id/convert-to-po')
  async convertPrToPo(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.convertPrToPo(id, tenantId, userId);
  }

  // ============================================================================
  // SCREEN 3: REQUESTS FOR QUOTATION (RFQ)
  // ============================================================================

  @Get('rfqs')
  async getRfqs(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getRfqs(tenantId, filters);
    return { success: true, data };
  }

  @Post('rfqs')
  async createRfq(@Body() dto: CreateRfqDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createRfq(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('rfqs/:id/publish')
  async publishRfq(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.publishRfq(id, tenantId, userId);
  }

  @Post('rfqs/:id/invite-suppliers')
  async inviteSuppliers(@Param('id') id: string, @Body('supplierIds') supplierIds: string[], @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.inviteSuppliers(id, supplierIds || [], tenantId, userId);
  }

  // ============================================================================
  // SCREEN 4: RFQ BID COMPARISON MATRIX & AWARD
  // ============================================================================

  @Post('rfqs/submit-bid')
  async submitBid(@Body() dto: SubmitBidDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.submitBid(dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('rfqs/:id/bid-comparison')
  async getBidComparisonMatrix(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getBidComparisonMatrix(id, tenantId);
    return { success: true, data };
  }

  @Post('rfqs/:id/award-bid')
  async awardBid(@Param('id') id: string, @Body('bidId') bidId: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.awardBid(id, bidId, tenantId, userId);
  }

  @Post('rfqs/:id/convert-to-po')
  async convertRfqToPo(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.convertRfqToPo(id, tenantId, userId);
  }

  // ============================================================================
  // SCREEN 5: PURCHASE ORDERS (PO)
  // ============================================================================

  @Get('purchase-orders')
  async getPurchaseOrders(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getPurchaseOrders(tenantId, filters);
    return { success: true, data };
  }

  @Post('purchase-orders')
  async createPurchaseOrder(@Body() dto: CreatePoDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createPurchaseOrder(dto, tenantId, userId);
    return { success: true, data };
  }

  @Put('purchase-orders/:id')
  async updatePurchaseOrder(@Param('id') id: string, @Body() dto: UpdatePoDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.updatePurchaseOrder(id, dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('purchase-orders/:id/submit-approval')
  async submitPoForApproval(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.submitPoForApproval(id, tenantId, userId);
  }

  @Post('purchase-orders/:id/send-to-supplier')
  async sendPoToSupplier(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.sendPoToSupplier(id, tenantId, userId);
  }

  @Get('purchase-orders/:id/history')
  async getPoHistory(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getPoHistory(id, tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 6: MULTI-TIER PO APPROVALS
  // ============================================================================

  @Get('po-approvals/pending')
  async getPendingPoApprovals(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.getPendingApprovals(tenantId, userId);
    return { success: true, data };
  }

  @Post('po-approvals/:id/approve')
  async approvePo(@Param('id') id: string, @Body('stageNumber') stageNumber: number, @Body('comments') comments: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const approverId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approvePo(id, stageNumber || 1, tenantId, approverId, comments);
  }

  @Post('po-approvals/:id/reject')
  async rejectPo(@Param('id') id: string, @Body('stageNumber') stageNumber: number, @Body('reason') reason: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const approverId = req.user?.id || 'USR-ADMIN-01';
    return this.service.rejectPo(id, stageNumber || 1, tenantId, approverId, reason);
  }

  @Post('po-approvals/:id/delegate')
  async delegatePoApproval(@Param('id') id: string, @Body('stageNumber') stageNumber: number, @Body('delegateToId') delegateToId: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.delegateApproval(id, stageNumber || 1, tenantId, userId, delegateToId);
  }

  // ============================================================================
  // SCREEN 7: GOODS RECEIPTS (GRN) & QA INSPECTION
  // ============================================================================

  @Get('goods-receipts')
  async getGoodsReceipts(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getGoodsReceipts(tenantId, filters);
    return { success: true, data };
  }

  @Post('goods-receipts')
  async createGoodsReceipt(@Body() dto: CreateGrnDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createGoodsReceipt(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('goods-receipts/:id/inspect')
  async inspectGoodsReceipt(@Param('id') id: string, @Body() dto: InspectGrnDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.inspectGoodsReceipt(id, dto, tenantId, userId);
  }

  @Post('goods-receipts/:id/post-to-inventory')
  async postGrnToInventory(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.postGrnToInventory(id, tenantId, userId);
  }

  // ============================================================================
  // SCREEN 8: VENDOR DEBIT NOTES & RETURNS
  // ============================================================================

  @Get('purchase-returns')
  async getPurchaseReturns(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getPurchaseReturns(tenantId, filters);
    return { success: true, data };
  }

  @Post('purchase-returns')
  async createPurchaseReturn(@Body() dto: CreateReturnDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createPurchaseReturn(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('purchase-returns/:id/approve')
  async approvePurchaseReturn(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approvePurchaseReturn(id, tenantId, userId);
  }

  @Post('purchase-returns/:id/generate-debit-note')
  async generateDebitNote(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.generateDebitNote(id, tenantId, userId);
  }

  // ============================================================================
  // SCREEN 9: SUPPLIER PERFORMANCE SCORECARDS
  // ============================================================================

  @Get('supplier-performance')
  async getSupplierPerformance(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSupplierPerformance(tenantId, filters);
    return { success: true, data };
  }

  @Post('supplier-performance/calculate')
  async calculateSupplierPerformance(@Body() dto: CalculatePerformanceDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.calculateSupplierPerformance(dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('supplier-performance/:supplierId/scorecard')
  async getSupplierScorecard(@Param('supplierId') supplierId: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSupplierScorecard(supplierId, tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 10: SUPPLIER RISK & COMPLIANCE
  // ============================================================================

  @Get('supplier-risk')
  async getSupplierRiskAssessments(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getRiskAssessments(tenantId, filters);
    return { success: true, data };
  }

  @Post('supplier-risk/assess')
  async createRiskAssessment(@Body() dto: CreateRiskAssessmentDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createRiskAssessment(dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('supplier-risk/:supplierId/history')
  async getSupplierRiskHistory(@Param('supplierId') supplierId: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSupplierRiskHistory(supplierId, tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 11: SUPPLIER CONTRACTS & BLANKET POS
  // ============================================================================

  @Get('supplier-contracts')
  async getSupplierContracts(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSupplierContracts(tenantId, filters);
    return { success: true, data };
  }

  @Post('supplier-contracts')
  async createSupplierContract(@Body() dto: CreateContractDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createSupplierContract(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('supplier-contracts/:id/approve')
  async approveContract(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approveContract(id, tenantId, userId);
  }

  @Post('supplier-contracts/:id/create-blanket-po')
  async createBlanketPo(@Param('id') id: string, @Body() dto: CreateBlanketPoDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.createBlanketPo(id, dto, tenantId, userId);
  }

  // ============================================================================
  // SCREEN 12: SUPPLIER PRICE LISTS
  // ============================================================================

  @Get('supplier-price-lists')
  async getSupplierPriceLists(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSupplierPriceLists(tenantId, filters);
    return { success: true, data };
  }

  @Post('supplier-price-lists')
  async createSupplierPriceList(@Body() dto: CreatePriceListDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createSupplierPriceList(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('supplier-price-lists/:id/approve')
  async approvePriceList(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approvePriceList(id, tenantId, userId);
  }

  @Get('supplier-price-lists/:supplierId/active')
  async getActivePriceList(@Param('supplierId') supplierId: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getActivePriceList(supplierId, tenantId);
    return { success: true, data };
  }
}
