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
import { FrontOfficeService } from './front-office.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  CreateOpportunityDto,
  UpdateOpportunityDto,
  UpdateStageDto,
  CreateAccountDto,
  UpdateAccountDto,
  CreateContactDto,
  UpdateContactDto,
  CreateComplaintDto,
  ResolveComplaintDto,
  CreateQuotationDto,
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  CancelOrderDto,
  CreateMonthlyPlanDto,
  CreateReconciliationDto,
  CreateDeliveryDto,
  CreditHoldDto,
  CreateReturnDto,
  CreatePriceListDto,
  CreateDiscountRuleDto,
  CreateSalesPerformanceDto,
  CreateContractDto,
  CreateExportDocDto,
  CreateForecastDto,
} from './front-office.dto';

@Controller('front-office')
export class FrontOfficeController {
  constructor(private readonly service: FrontOfficeService) {}

  // ============================================================================
  // DATABASE OBSERVABILITY & TELEMETRY
  // ============================================================================
  @Get('observability/metrics')
  async getObservabilityMetrics() {
    const metrics = this.service.getObservabilityMetrics();
    return { success: true, ...metrics };
  }

  // ============================================================================
  // CRM SCREEN 1: LEADS & INQUIRIES
  // ============================================================================
  @Get('crm/leads')
  async getLeads(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const leads = await this.service.getLeads(tenantId, filters);
    return { success: true, data: leads, total: leads.length };
  }

  @Get('crm/leads/:id')
  async getLeadById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const lead = await this.service.getLeadById(id, tenantId);
    return { success: true, data: lead };
  }

  @Post('crm/leads')
  async createLead(@Body() dto: CreateLeadDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const lead = await this.service.createLead(dto, tenantId, userId);
    return { success: true, data: lead };
  }

  @Put('crm/leads/:id')
  async updateLead(@Param('id') id: string, @Body() dto: UpdateLeadDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const lead = await this.service.updateLead(id, dto, tenantId, userId);
    return { success: true, data: lead };
  }

  @Post('crm/leads/:id/convert')
  async convertLead(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.service.convertLead(id, tenantId, userId);
    return result;
  }

  // ============================================================================
  // CRM SCREEN 2: OPPORTUNITIES
  // ============================================================================
  @Get('crm/opportunities')
  async getOpportunities(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const opportunities = await this.service.getOpportunities(tenantId, filters);
    return { success: true, data: opportunities, total: opportunities.length };
  }

  @Post('crm/opportunities')
  async createOpportunity(@Body() dto: CreateOpportunityDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const opportunity = await this.service.createOpportunity(dto, tenantId, userId);
    return { success: true, data: opportunity };
  }

  @Put('crm/opportunities/:id/stage')
  async updateOpportunityStage(
    @Param('id') id: string,
    @Body() dto: UpdateStageDto,
    @Req() req: any
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const opportunity = await this.service.updateOpportunityStage(id, dto, tenantId, userId);
    return { success: true, data: opportunity };
  }

  // ============================================================================
  // CRM SCREEN 3: CUSTOMER ACCOUNTS
  // ============================================================================
  @Get('crm/accounts')
  async getAccounts(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const accounts = await this.service.getAccounts(tenantId, filters);
    return { success: true, data: accounts, total: accounts.length };
  }

  @Get('crm/accounts/:id')
  async getAccountById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const account = await this.service.getAccountById(id, tenantId);
    return { success: true, data: account };
  }

  @Post('crm/accounts')
  async createAccount(@Body() dto: CreateAccountDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const account = await this.service.createAccount(dto, tenantId, userId);
    return { success: true, data: account };
  }

  @Get('crm/accounts/:id/360')
  async getAccount360(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAccount360(id, tenantId);
    return { success: true, data };
  }

  // ============================================================================
  // CRM SCREEN 4: CLIENT CONTACTS
  // ============================================================================
  @Get('crm/contacts')
  async getContacts(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const contacts = await this.service.getContacts(tenantId, filters);
    return { success: true, data: contacts, total: contacts.length };
  }

  @Post('crm/contacts')
  async createContact(@Body() dto: CreateContactDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const contact = await this.service.createContact(dto, tenantId, userId);
    return { success: true, data: contact };
  }

  // ============================================================================
  // CRM SCREEN 5: COMPLAINTS & CLAIMS
  // ============================================================================
  @Get('crm/complaints')
  async getComplaints(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const complaints = await this.service.getComplaints(tenantId, filters);
    return { success: true, data: complaints, total: complaints.length };
  }

  @Post('crm/complaints')
  async createComplaint(@Body() dto: CreateComplaintDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const complaint = await this.service.createComplaint(dto, tenantId, userId);
    return { success: true, data: complaint };
  }

  @Post('crm/complaints/:id/resolve')
  async resolveComplaint(
    @Param('id') id: string,
    @Body() dto: ResolveComplaintDto,
    @Req() req: any
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const complaint = await this.service.resolveComplaint(id, dto, tenantId, userId);
    return { success: true, data: complaint };
  }

  // ============================================================================
  // SALES SCREEN 6: SALES DASHBOARD
  // ============================================================================
  @Get('sales/dashboard')
  async getSalesDashboard(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const dashboard = await this.service.getDashboard(tenantId);
    return { success: true, data: dashboard };
  }

  // ============================================================================
  // SALES SCREEN 7: ORDER COMMAND CENTER
  // ============================================================================
  @Get('sales/order-command-center')
  async getOrderCommandCenter(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getOrderCommandCenter(tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SALES SCREEN 8: QUOTATIONS
  // ============================================================================
  @Get('sales/quotations')
  async getQuotations(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const quotations = await this.service.getQuotations(tenantId, filters);
    return { success: true, data: quotations, total: quotations.length };
  }

  @Post('sales/quotations')
  async createQuotation(@Body() dto: CreateQuotationDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const quotation = await this.service.createQuotation(dto, tenantId, userId);
    return { success: true, data: quotation };
  }

  @Post('sales/quotations/:id/convert-to-order')
  async convertQuotationToOrder(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.service.convertQuotationToOrder(id, tenantId, userId);
    return result;
  }

  // ============================================================================
  // SALES SCREEN 9: SALES ORDERS (REDESIGNED)
  // ============================================================================
  @Get('sales/orders')
  async getSalesOrders(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const orders = await this.service.getSalesOrders(tenantId, filters);
    return { success: true, data: orders, total: orders.length };
  }

  @Get('sales/orders/:id')
  async getSalesOrderById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const order = await this.service.getSalesOrderById(id, tenantId);
    return { success: true, data: order };
  }

  @Post('sales/orders')
  async createSalesOrder(@Body() dto: CreateSalesOrderDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const order = await this.service.createSalesOrder(dto, tenantId, userId);
    return { success: true, data: order };
  }

  @Put('sales/orders/:id')
  async updateSalesOrder(
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderDto,
    @Req() req: any
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const order = await this.service.updateSalesOrder(id, dto, tenantId, userId);
    return { success: true, data: order };
  }

  @Post('sales/orders/:id/approve')
  async approveSalesOrder(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const order = await this.service.approveSalesOrder(id, tenantId, userId);
    return { success: true, data: order };
  }

  @Post('sales/orders/:id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @Req() req: any
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const order = await this.service.cancelOrder(id, dto, tenantId, userId);
    return { success: true, data: order };
  }

  @Get('sales/orders/:id/history')
  async getOrderHistory(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const history = await this.service.getOrderHistory(id, tenantId);
    return { success: true, ...history };
  }

  // ============================================================================
  // SALES SCREEN 10: MONTHLY PLAN ORDERS
  // ============================================================================
  @Get('sales/monthly-plans')
  async getMonthlyPlans(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const plans = await this.service.getMonthlyPlans(tenantId, filters);
    return { success: true, data: plans, total: plans.length };
  }

  @Post('sales/monthly-plans')
  async createMonthlyPlan(@Body() dto: CreateMonthlyPlanDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const plan = await this.service.createMonthlyPlan(dto, tenantId, userId);
    return { success: true, data: plan };
  }

  // ============================================================================
  // SALES SCREEN 11: DEMAND RECONCILIATION
  // ============================================================================
  @Get('sales/demand-reconciliation')
  async getDemandReconciliation(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const recon = await this.service.getDemandReconciliation(tenantId, filters);
    return { success: true, data: recon, total: recon.length };
  }

  @Post('sales/demand-reconciliation')
  async createReconciliation(@Body() dto: CreateReconciliationDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const recon = await this.service.createReconciliation(dto, tenantId, userId);
    return { success: true, data: recon };
  }

  // ============================================================================
  // SALES SCREEN 12: DELIVERIES & DISPATCH
  // ============================================================================
  @Get('sales/deliveries')
  async getDeliveries(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const deliveries = await this.service.getDeliveries(tenantId, filters);
    return { success: true, data: deliveries, total: deliveries.length };
  }

  @Post('sales/deliveries')
  async createDelivery(@Body() dto: CreateDeliveryDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const delivery = await this.service.createDelivery(dto, tenantId, userId);
    return { success: true, data: delivery };
  }

  @Post('sales/deliveries/:id/generate-eway-bill')
  async generateEwayBill(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const ewb = await this.service.generateEwayBill(id, tenantId, userId);
    return ewb;
  }

  // ============================================================================
  // SALES SCREEN 13: CREDIT CONTROL
  // ============================================================================
  @Get('sales/credit-control')
  async getCreditControl(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const credit = await this.service.getCreditControl(tenantId, filters);
    return { success: true, data: credit, total: credit.length };
  }

  @Post('sales/credit-control/:accountId/hold')
  async placeCreditHold(
    @Param('accountId') accountId: string,
    @Body() dto: CreditHoldDto,
    @Req() req: any
  ) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const credit = await this.service.placeCreditHold(accountId, dto, tenantId, userId);
    return { success: true, data: credit };
  }

  // ============================================================================
  // SALES SCREEN 14: RETURNS & RMA
  // ============================================================================
  @Get('sales/returns')
  async getReturns(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const returns = await this.service.getReturns(tenantId, filters);
    return { success: true, data: returns, total: returns.length };
  }

  @Post('sales/returns')
  async createReturn(@Body() dto: CreateReturnDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const returnItem = await this.service.createReturn(dto, tenantId, userId);
    return { success: true, data: returnItem };
  }

  // ============================================================================
  // SALES SCREEN 15: SALES ANALYTICS
  // ============================================================================
  @Get('sales/analytics')
  async getAnalytics(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const analytics = await this.service.getAnalytics(tenantId, filters);
    return { success: true, data: analytics };
  }

  // ============================================================================
  // SALES SCREEN 17: PRICING & DISCOUNTS
  // ============================================================================
  @Get('sales/price-lists')
  async getPriceLists(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const priceLists = await this.service.getPriceLists(tenantId);
    return { success: true, data: priceLists };
  }

  @Post('sales/price-lists')
  async createPriceList(@Body() dto: CreatePriceListDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const priceList = await this.service.createPriceList(dto, tenantId, userId);
    return { success: true, data: priceList };
  }

  @Get('sales/discount-rules')
  async getDiscountRules(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const rules = await this.service.getDiscountRules(tenantId);
    return { success: true, data: rules };
  }

  @Post('sales/discount-rules')
  async createDiscountRule(@Body() dto: CreateDiscountRuleDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const rule = await this.service.createDiscountRule(dto, tenantId, userId);
    return { success: true, data: rule };
  }

  // ============================================================================
  // SALES SCREEN 18: SALES TEAM PERFORMANCE
  // ============================================================================
  @Get('sales/performance')
  async getPerformance(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const performance = await this.service.getPerformance(tenantId, filters);
    return { success: true, data: performance };
  }

  @Post('sales/performance')
  async createPerformanceRecord(@Body() dto: CreateSalesPerformanceDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const record = await this.service.createPerformanceRecord(dto, tenantId, userId);
    return { success: true, data: record };
  }

  // ============================================================================
  // SALES SCREEN 19: CONTRACT MANAGEMENT
  // ============================================================================
  @Get('sales/contracts')
  async getContracts(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const contracts = await this.service.getContracts(tenantId, filters);
    return { success: true, data: contracts, total: contracts.length };
  }

  @Post('sales/contracts')
  async createContract(@Body() dto: CreateContractDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const contract = await this.service.createContract(dto, tenantId, userId);
    return { success: true, data: contract };
  }

  // ============================================================================
  // SALES SCREEN 20: EXPORT DOCUMENTATION
  // ============================================================================
  @Get('sales/export-docs')
  async getExportDocs(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const docs = await this.service.getExportDocs(tenantId, filters);
    return { success: true, data: docs, total: docs.length };
  }

  @Post('sales/export-docs')
  async createExportDoc(@Body() dto: CreateExportDocDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const doc = await this.service.createExportDoc(dto, tenantId, userId);
    return { success: true, data: doc };
  }

  // ============================================================================
  // SALES SCREEN 21: CUSTOMER PORTAL
  // ============================================================================
  @Get('portal/orders/:accountId')
  async getPortalOrders(@Param('accountId') accountId: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const orders = await this.service.getPortalOrders(accountId, tenantId);
    return { success: true, data: orders, total: orders.length };
  }

  // ============================================================================
  // SALES SCREEN 22: SALES FORECASTING (AI/ML)
  // ============================================================================
  @Get('sales/forecasts')
  async getForecasts(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const forecasts = await this.service.getForecasts(tenantId, filters);
    return { success: true, data: forecasts, total: forecasts.length };
  }

  @Post('sales/forecasts')
  async createForecast(@Body() dto: CreateForecastDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const forecast = await this.service.createForecast(dto, tenantId, userId);
    return { success: true, data: forecast };
  }
}
