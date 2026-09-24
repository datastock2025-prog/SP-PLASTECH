import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { FinanceService } from './finance.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
  AutoPostFromOperationsDto,
  CreateApDto,
  CreateArDto,
  RecordCollectionDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreatePaymentRunDto,
  CreatePaymentDto,
  CalculateCostDto,
  CreateCostCenterDto,
  CreateBudgetDto,
  GenerateStatementsDto,
  CreateAssetDto,
  RunDepreciationDto,
  DisposeAssetDto,
  CreateGstReturnDto,
  CreateEprCreditDto,
  TradeEprCreditDto,
} from './finance.dto';

@Controller('finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  // ============================================================================
  // SCREEN 1: OPERATIONS-TO-LEDGER WORKSPACE
  // ============================================================================

  @Get('unified-ledger')
  async getUnifiedLedger(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getUnifiedLedger(tenantId, filters);
    return { success: true, data };
  }

  @Get('unified-ledger/operations')
  async getOperationsFeed(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getOperationsFeed(tenantId, filters);
    return { success: true, data };
  }

  @Post('unified-ledger/auto-post')
  async autoPostFromOperations(@Body() dto: AutoPostFromOperationsDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.autoPostFromOperations(dto, tenantId, userId);
  }

  // ============================================================================
  // SCREEN 2: FINANCE COMMAND CENTER (DASHBOARD & KPIS)
  // ============================================================================

  @Get('dashboard/finance')
  async getFinanceDashboard(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getFinanceDashboard(tenantId);
    return { success: true, data };
  }

  @Get('dashboard/kpis')
  async getFinanceKpis(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getFinanceKpis(tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 3: CHART OF ACCOUNTS (COA)
  // ============================================================================

  @Get('coa')
  async getChartOfAccounts(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAccounts(tenantId, filters);
    return { success: true, data };
  }

  @Post('coa')
  async createAccount(@Body() dto: CreateAccountDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createAccount(dto, tenantId, userId);
    return { success: true, data };
  }

  @Put('coa/:id')
  async updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.updateAccount(id, dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('coa/:id/balance')
  async getAccountBalance(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAccountBalance(id, tenantId);
    return { success: true, data };
  }

  @Get('coa/hierarchy')
  async getAccountHierarchy(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAccountHierarchy(tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 4: JOURNAL ENTRIES & GENERAL LEDGER
  // ============================================================================

  @Get('journal-entries')
  async getJournalEntries(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getJournalEntries(tenantId, filters);
    return { success: true, data };
  }

  @Post('journal-entries')
  async createJournalEntry(@Body() dto: CreateJournalEntryDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createJournalEntry(dto, tenantId, userId);
    return { success: true, data };
  }

  @Put('journal-entries/:id')
  async updateJournalEntry(@Param('id') id: string, @Body() dto: UpdateJournalEntryDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.updateJournalEntry(id, dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('journal-entries/:id/post')
  async postJournalEntry(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.postJournalEntry(id, tenantId, userId);
  }

  @Post('journal-entries/:id/reverse')
  async reverseJournalEntry(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.reverseJournalEntry(id, tenantId, userId, reason);
  }

  @Get('journal-entries/:id/ledger')
  async getAccountLedger(@Param('id') id: string, @Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAccountLedger(id, tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 5: ACCOUNTS PAYABLE & 3-WAY MATCH
  // ============================================================================

  @Get('ap')
  async getAccountsPayable(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAccountsPayable(tenantId, filters);
    return { success: true, data };
  }

  @Post('ap')
  async createAccountsPayable(@Body() dto: CreateApDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createAccountsPayable(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('ap/:id/match')
  async performThreeWayMatch(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.performThreeWayMatch(id, tenantId, userId);
    return { success: true, data };
  }

  @Post('ap/:id/approve')
  async approveAp(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approveAp(id, tenantId, userId);
  }

  @Get('ap/:id/match-status')
  async getMatchStatus(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getMatchStatus(id, tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 6: ACCOUNTS RECEIVABLE & COLLECTIONS
  // ============================================================================

  @Get('ar')
  async getAccountsReceivable(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAccountsReceivable(tenantId, filters);
    return { success: true, data };
  }

  @Post('ar')
  async createAccountsReceivable(@Body() dto: CreateArDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createAccountsReceivable(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('ar/:id/collect')
  async recordCollection(@Param('id') id: string, @Body() dto: RecordCollectionDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.recordCollection(id, dto, tenantId, userId);
  }

  @Get('ar/aging')
  async getAgingReport(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAgingReport(tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 7: INVOICING & CUSTOMER BILLING
  // ============================================================================

  @Get('invoices')
  async getInvoices(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getInvoices(tenantId, filters);
    return { success: true, data };
  }

  @Post('invoices')
  async createInvoice(@Body() dto: CreateInvoiceDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createInvoice(dto, tenantId, userId);
    return { success: true, data };
  }

  @Put('invoices/:id')
  async updateInvoice(@Param('id') id: string, @Body() dto: UpdateInvoiceDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.updateInvoice(id, dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('invoices/:id/approve')
  async approveInvoice(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approveInvoice(id, tenantId, userId);
  }

  @Post('invoices/:id/issue')
  async issueInvoice(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.issueInvoice(id, tenantId, userId);
  }

  @Post('invoices/:id/generate-pdf')
  async generateInvoicePdf(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.generateInvoicePdf(id, tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 8: BATCH PAYMENT RUN & PAYMENTS
  // ============================================================================

  @Get('payment-runs')
  async getPaymentRuns(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getPaymentRuns(tenantId, filters);
    return { success: true, data };
  }

  @Post('payment-runs')
  async createPaymentRun(@Body() dto: CreatePaymentRunDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createPaymentRun(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('payment-runs/:id/approve')
  async approvePaymentRun(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approvePaymentRun(id, tenantId, userId);
  }

  @Post('payment-runs/:id/execute')
  async executePaymentRun(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.executePaymentRun(id, tenantId, userId);
  }

  @Get('payments')
  async getPayments(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getPayments(tenantId, filters);
    return { success: true, data };
  }

  @Post('payments')
  async createPayment(@Body() dto: CreatePaymentDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createPayment(dto, tenantId, userId);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 9: PRODUCT COSTING & STANDARD MARGINS
  // ============================================================================

  @Get('product-costing')
  async getProductCosts(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getProductCosts(tenantId, filters);
    return { success: true, data };
  }

  @Post('product-costing/calculate')
  async calculateProductCost(@Body() dto: CalculateCostDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.calculateProductCost(dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('product-costing/:itemId/margins')
  async getProductMargins(@Param('itemId') itemId: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getProductMargins(itemId, tenantId);
    return { success: true, data };
  }

  @Post('product-costing/rollup')
  async performCostRollup(@Body('itemIds') itemIds: string[], @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.performCostRollup(itemIds || [], tenantId, userId);
  }

  // ============================================================================
  // SCREEN 10: COST CENTERS & BUDGETS
  // ============================================================================

  @Get('cost-centers')
  async getCostCenters(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getCostCenters(tenantId, filters);
    return { success: true, data };
  }

  @Post('cost-centers')
  async createCostCenter(@Body() dto: CreateCostCenterDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createCostCenter(dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('budgets')
  async getBudgets(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getBudgets(tenantId, filters);
    return { success: true, data };
  }

  @Post('budgets')
  async createBudget(@Body() dto: CreateBudgetDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createBudget(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('budgets/:id/approve')
  async approveBudget(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approveBudget(id, tenantId, userId);
  }

  @Get('budgets/variance')
  async getBudgetVariance(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getBudgetVariance(tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 11: FINANCIAL STATEMENTS
  // ============================================================================

  @Get('financial-statements/profit-loss')
  async getProfitLoss(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getProfitLoss(tenantId, filters);
    return { success: true, data };
  }

  @Get('financial-statements/balance-sheet')
  async getBalanceSheet(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getBalanceSheet(tenantId, filters);
    return { success: true, data };
  }

  @Get('financial-statements/cash-flow')
  async getCashFlow(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getCashFlow(tenantId, filters);
    return { success: true, data };
  }

  @Post('financial-statements/generate')
  async generateFinancialStatements(@Body() dto: GenerateStatementsDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.generateFinancialStatements(dto, tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 12: FIXED ASSET REGISTER
  // ============================================================================

  @Get('fixed-assets')
  async getFixedAssets(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getFixedAssets(tenantId, filters);
    return { success: true, data };
  }

  @Post('fixed-assets')
  async createFixedAsset(@Body() dto: CreateAssetDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createFixedAsset(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('fixed-assets/depreciation/run')
  async runDepreciation(@Body() dto: RunDepreciationDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.runDepreciation(dto, tenantId, userId);
  }

  @Post('fixed-assets/:id/dispose')
  async disposeAsset(@Param('id') id: string, @Body() dto: DisposeAssetDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.disposeAsset(id, dto, tenantId, userId);
  }

  @Get('fixed-assets/:id/depreciation-schedule')
  async getDepreciationSchedule(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getDepreciationSchedule(id, tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 13: GST & TAX WORKBENCH
  // ============================================================================

  @Get('gst/returns')
  async getGstReturns(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getGstReturns(tenantId, filters);
    return { success: true, data };
  }

  @Post('gst/returns')
  async createGstReturn(@Body() dto: CreateGstReturnDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createGstReturn(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('gst/returns/:id/calculate')
  async calculateGstReturn(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.calculateGstReturn(id, tenantId, userId);
  }

  @Post('gst/returns/:id/file')
  async fileGstReturn(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.fileGstReturn(id, tenantId, userId);
  }

  @Get('gst/input-tax-credit')
  async getInputTaxCredit(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getInputTaxCredit(tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 14: EPR PLASTIC WASTE CREDIT EXCHANGE
  // ============================================================================

  @Get('epr/credits')
  async getEprCredits(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getEprCredits(tenantId, filters);
    return { success: true, data };
  }

  @Post('epr/credits')
  async createEprCredit(@Body() dto: CreateEprCreditDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createEprCredit(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('epr/credits/:id/verify')
  async verifyEprCredit(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.verifyEprCredit(id, tenantId, userId);
  }

  @Post('epr/credits/:id/trade')
  async tradeEprCredit(@Param('id') id: string, @Body() dto: TradeEprCreditDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.tradeEprCredit(id, dto, tenantId, userId);
  }

  @Get('epr/credits/portfolio')
  async getEprPortfolio(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getEprPortfolio(tenantId);
    return { success: true, data };
  }
}
