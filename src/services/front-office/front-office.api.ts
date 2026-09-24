import axios, { AxiosInstance } from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// TypeScript Interfaces for Front Office (CRM & Sales - All 22 Screens)
// ============================================================================
export interface CrmLead {
  id: string;
  tenantId: string;
  leadNumber: string;
  leadSource: string;
  leadType: string;
  title: string;
  description?: string;
  companyName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  country?: string;
  state?: string;
  city?: string;
  estimatedValue: number;
  currency: string;
  probability: number;
  status: string;
  assignedToId?: string;
  assignedToName?: string;
  convertedToAccountId?: string;
  convertedToOpportunityId?: string;
  convertedAt?: string;
  version: string;
  createdAt: string;
}

export interface CrmOpportunity {
  id: string;
  tenantId: string;
  opportunityNumber: string;
  accountId: string;
  accountName?: string;
  leadId?: string;
  title: string;
  description?: string;
  stage: string;
  probability: number;
  estimatedValue: number;
  weightedValue: number;
  currency: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  closeReason?: string;
  isWon: boolean;
  assignedToId: string;
  assignedToName?: string;
  competitorInfo?: string;
  nextAction?: string;
  nextActionDate?: string;
  version: string;
  createdAt: string;
}

export interface CrmAccount {
  id: string;
  tenantId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  industry?: string;
  website?: string;
  annualRevenue?: number;
  employeeCount?: number;
  rating: string;
  status: string;
  parentId?: string;
  parentAccountName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  billingPincode?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingPincode?: string;
  gstin?: string;
  pan?: string;
  creditLimit: number;
  creditUsed: number;
  creditAvailable?: number;
  paymentTerms?: string;
  assignedToId?: string;
  version: string;
  createdAt: string;
}

export interface CrmContact {
  id: string;
  tenantId: string;
  accountId: string;
  accountName?: string;
  contactNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  designation?: string;
  department?: string;
  email: string;
  phone?: string;
  mobile?: string;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  preferredContact?: string;
  linkedinUrl?: string;
  notes?: string;
  version: string;
  createdAt: string;
}

export interface CrmComplaint {
  id: string;
  tenantId: string;
  complaintNumber: string;
  accountId: string;
  accountName?: string;
  contactId?: string;
  salesOrderId?: string;
  complaintType: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  resolution?: string;
  resolutionDate?: string;
  resolvedById?: string;
  assignedToId?: string;
  assignedToName?: string;
  dueDate?: string;
  version: string;
  createdAt: string;
}

export interface SalesQuotationLine {
  id?: string;
  lineNo: number;
  itemId: string;
  itemCode: string;
  itemName: string;
  description?: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  discountPct: number;
  taxPct: number;
  totalAmount: number;
  deliveryDate?: string;
}

export interface SalesQuotation {
  id: string;
  tenantId: string;
  quotationNumber: string;
  accountId: string;
  accountName?: string;
  contactId?: string;
  opportunityId?: string;
  validFrom: string;
  validUntil: string;
  status: string;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  taxPct: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  termsConditions?: string;
  convertedToOrderId?: string;
  convertedAt?: string;
  version: string;
  lines?: SalesQuotationLine[];
  createdAt: string;
}

export interface SalesOrderLine {
  id?: string;
  lineNo: number;
  itemId: string;
  itemCode: string;
  itemName: string;
  description?: string;
  bomId?: string;
  quantity: number;
  deliveredQty?: number;
  pendingQty?: number;
  uom: string;
  unitPrice: number;
  discountPct: number;
  taxPct: number;
  totalAmount: number;
  deliveryDate?: string;
  plantId?: string;
  warehouseId?: string;
}

export interface SalesOrder {
  id: string;
  tenantId: string;
  orderNumber: string;
  accountId: string;
  accountName?: string;
  contactId?: string;
  contactName?: string;
  quotationId?: string;
  orderDate: string;
  requiredDate: string;
  status: string;
  priority: string;
  plantId?: string;
  warehouseId?: string;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  taxPct: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  paymentTerms?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingPincode?: string;
  notes?: string;
  termsConditions?: string;
  version: string;
  lines?: SalesOrderLine[];
  createdAt: string;
}

export interface MonthlyPlanOrder {
  id: string;
  tenantId: string;
  planNumber: string;
  monthPeriod: string;
  year: number;
  month: number;
  accountId?: string;
  itemId?: string;
  itemCode?: string;
  plannedQty: number;
  confirmedQty: number;
  actualQty: number;
  uom: string;
  status: string;
  version: string;
  createdAt: string;
}

export interface DemandReconciliation {
  id: string;
  tenantId: string;
  reconNumber: string;
  monthPeriod: string;
  year: number;
  month: number;
  itemId: string;
  itemCode: string;
  forecastQty: number;
  actualOrderQty: number;
  actualDeliveryQty: number;
  varianceQty: number;
  accuracyPct: number;
  notes?: string;
}

export interface DeliveryRecord {
  id: string;
  tenantId: string;
  deliveryNumber: string;
  orderId: string;
  orderNumber?: string;
  accountName?: string;
  deliveryDate: string;
  status: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  transporter?: string;
  lrNumber?: string;
  ewayBillNumber?: string;
  ewayBillDate?: string;
  gstApplicable: boolean;
  totalWeight?: number;
  totalVolume?: number;
}

export interface CreditControlRecord {
  id: string;
  tenantId: string;
  accountId: string;
  accountName?: string;
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  outstandingAmount: number;
  overdueAmount: number;
  isOnHold: boolean;
  holdReason?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
}

export interface ReturnRecord {
  id: string;
  tenantId: string;
  rmaNumber: string;
  orderId?: string;
  orderNumber?: string;
  deliveryId?: string;
  accountId: string;
  accountName?: string;
  returnReason: string;
  returnStatus: string;
  requestedDate: string;
  refundAmount?: number;
  notes?: string;
}

export interface PriceListRecord {
  id: string;
  tenantId: string;
  priceListCode: string;
  priceListName: string;
  currency: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface DiscountRuleRecord {
  id: string;
  tenantId: string;
  ruleCode: string;
  ruleName: string;
  discountType: string;
  discountValue: number;
  applicableTo: string;
  applicableIds: string[];
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
}

export interface SalesPerformanceRecord {
  id: string;
  tenantId: string;
  userId: string;
  repName?: string;
  repEmail?: string;
  period: string;
  targetAmount: number;
  achievedAmount: number;
  achievementPct: number;
  ordersCount: number;
  newAccountsCount: number;
  commissionEarned: number;
  ranking?: number;
}

export interface SalesContractRecord {
  id: string;
  tenantId: string;
  contractNumber: string;
  accountId: string;
  accountName?: string;
  contractType: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  currency: string;
  status: string;
  autoRenewal: boolean;
  renewalNoticeDays: number;
}

export interface ExportDocRecord {
  id: string;
  tenantId: string;
  documentNumber: string;
  orderId?: string;
  deliveryId?: string;
  documentType: string;
  destinationCountry: string;
  destinationPort?: string;
  incoterms?: string;
  hsCode?: string;
  totalValue: number;
  currency: string;
  status: string;
}

export interface SalesForecastRecord {
  id: string;
  tenantId: string;
  forecastNumber: string;
  period: string;
  periodType: string;
  itemId?: string;
  itemCode?: string;
  accountId?: string;
  accountName?: string;
  forecastQty: number;
  forecastAmount: number;
  confidenceLevel: number;
  method: string;
}

// ============================================================================
// Front Office API Client (Singleton Pattern)
// ============================================================================
export class FrontOfficeApi {
  private static instance: FrontOfficeApi;
  private api: AxiosInstance;

  private constructor() {
    this.api = axios.create({
      baseURL: API_BASE,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const tenantId = this.getActiveTenantId();
      const csrfToken = this.getCsrfToken();
      if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
      if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
            return this.api(originalRequest);
          } catch (refreshErr) {
            console.warn('[FrontOfficeApi] Session expired.');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): FrontOfficeApi {
    if (!FrontOfficeApi.instance) {
      FrontOfficeApi.instance = new FrontOfficeApi();
    }
    return FrontOfficeApi.instance;
  }

  private getActiveTenantId(): string {
    return localStorage.getItem('reboot_tenant_id') || 'TENANT-ALPHA-IND';
  }

  private getCsrfToken(): string | null {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  // --------------------------------------------------------------------------
  // Telemetry & Observability
  // --------------------------------------------------------------------------
  public async getObservabilityMetrics(): Promise<any> {
    const res = await this.api.get('/front-office/observability/metrics');
    return res.data;
  }

  // --------------------------------------------------------------------------
  // CRM Screen 1: Leads
  // --------------------------------------------------------------------------
  public async getLeads(filters: any = {}): Promise<{ success: boolean; data: CrmLead[]; total: number }> {
    const res = await this.api.get('/front-office/crm/leads', { params: filters });
    return res.data;
  }

  public async getLeadById(id: string): Promise<{ success: boolean; data: CrmLead }> {
    const res = await this.api.get(`/front-office/crm/leads/${id}`);
    return res.data;
  }

  public async createLead(dto: Partial<CrmLead>): Promise<{ success: boolean; data: CrmLead }> {
    const res = await this.api.post('/front-office/crm/leads', dto);
    return res.data;
  }

  public async updateLead(id: string, dto: Partial<CrmLead>): Promise<{ success: boolean; data: CrmLead }> {
    const res = await this.api.put(`/front-office/crm/leads/${id}`, dto);
    return res.data;
  }

  public async convertLead(id: string): Promise<any> {
    const res = await this.api.post(`/front-office/crm/leads/${id}/convert`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // CRM Screen 2: Opportunities
  // --------------------------------------------------------------------------
  public async getOpportunities(filters: any = {}): Promise<{ success: boolean; data: CrmOpportunity[]; total: number }> {
    const res = await this.api.get('/front-office/crm/opportunities', { params: filters });
    return res.data;
  }

  public async createOpportunity(dto: Partial<CrmOpportunity>): Promise<{ success: boolean; data: CrmOpportunity }> {
    const res = await this.api.post('/front-office/crm/opportunities', dto);
    return res.data;
  }

  public async updateOpportunityStage(id: string, stage: string, probability?: number, closeReason?: string): Promise<any> {
    const res = await this.api.put(`/front-office/crm/opportunities/${id}/stage`, { stage, probability, closeReason });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // CRM Screen 3: Customer Accounts
  // --------------------------------------------------------------------------
  public async getAccounts(filters: any = {}): Promise<{ success: boolean; data: CrmAccount[]; total: number }> {
    const res = await this.api.get('/front-office/crm/accounts', { params: filters });
    return res.data;
  }

  public async getAccountById(id: string): Promise<{ success: boolean; data: CrmAccount }> {
    const res = await this.api.get(`/front-office/crm/accounts/${id}`);
    return res.data;
  }

  public async createAccount(dto: Partial<CrmAccount>): Promise<{ success: boolean; data: CrmAccount }> {
    const res = await this.api.post('/front-office/crm/accounts', dto);
    return res.data;
  }

  public async getAccount360(accountId: string): Promise<any> {
    const res = await this.api.get(`/front-office/crm/accounts/${accountId}/360`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // CRM Screen 4: Client Contacts
  // --------------------------------------------------------------------------
  public async getContacts(filters: any = {}): Promise<{ success: boolean; data: CrmContact[]; total: number }> {
    const res = await this.api.get('/front-office/crm/contacts', { params: filters });
    return res.data;
  }

  public async createContact(dto: Partial<CrmContact>): Promise<{ success: boolean; data: CrmContact }> {
    const res = await this.api.post('/front-office/crm/contacts', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // CRM Screen 5: Complaints & Claims
  // --------------------------------------------------------------------------
  public async getComplaints(filters: any = {}): Promise<{ success: boolean; data: CrmComplaint[]; total: number }> {
    const res = await this.api.get('/front-office/crm/complaints', { params: filters });
    return res.data;
  }

  public async createComplaint(dto: Partial<CrmComplaint>): Promise<{ success: boolean; data: CrmComplaint }> {
    const res = await this.api.post('/front-office/crm/complaints', dto);
    return res.data;
  }

  public async resolveComplaint(id: string, resolution: string, refundAmount?: number): Promise<any> {
    const res = await this.api.post(`/front-office/crm/complaints/${id}/resolve`, { resolution, refundAmount });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 6 & 7: Dashboard & Command Center
  // --------------------------------------------------------------------------
  public async getSalesDashboard(): Promise<any> {
    const res = await this.api.get('/front-office/sales/dashboard');
    return res.data;
  }

  public async getOrderCommandCenter(filters: any = {}): Promise<any> {
    const res = await this.api.get('/front-office/sales/order-command-center', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 8: Quotations
  // --------------------------------------------------------------------------
  public async getQuotations(filters: any = {}): Promise<{ success: boolean; data: SalesQuotation[]; total: number }> {
    const res = await this.api.get('/front-office/sales/quotations', { params: filters });
    return res.data;
  }

  public async createQuotation(dto: Partial<SalesQuotation>): Promise<{ success: boolean; data: SalesQuotation }> {
    const res = await this.api.post('/front-office/sales/quotations', dto);
    return res.data;
  }

  public async convertQuotationToOrder(quoteId: string): Promise<any> {
    const res = await this.api.post(`/front-office/sales/quotations/${quoteId}/convert-to-order`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 9: Sales Orders
  // --------------------------------------------------------------------------
  public async getSalesOrders(filters: any = {}): Promise<{ success: boolean; data: SalesOrder[]; total: number }> {
    const res = await this.api.get('/front-office/sales/orders', { params: filters });
    return res.data;
  }

  public async getSalesOrderById(id: string): Promise<{ success: boolean; data: SalesOrder }> {
    const res = await this.api.get(`/front-office/sales/orders/${id}`);
    return res.data;
  }

  public async createSalesOrder(dto: Partial<SalesOrder>): Promise<{ success: boolean; data: SalesOrder }> {
    const res = await this.api.post('/front-office/sales/orders', dto);
    return res.data;
  }

  public async updateSalesOrder(id: string, dto: Partial<SalesOrder>): Promise<{ success: boolean; data: SalesOrder }> {
    const res = await this.api.put(`/front-office/sales/orders/${id}`, dto);
    return res.data;
  }

  public async approveSalesOrder(id: string): Promise<any> {
    const res = await this.api.post(`/front-office/sales/orders/${id}/approve`);
    return res.data;
  }

  public async cancelOrder(id: string, reason: string): Promise<any> {
    const res = await this.api.post(`/front-office/sales/orders/${id}/cancel`, { reason });
    return res.data;
  }

  public async getOrderHistory(id: string): Promise<any> {
    const res = await this.api.get(`/front-office/sales/orders/${id}/history`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 10 & 11: Plans & Reconciliation
  // --------------------------------------------------------------------------
  public async getMonthlyPlans(filters: any = {}): Promise<{ success: boolean; data: MonthlyPlanOrder[]; total: number }> {
    const res = await this.api.get('/front-office/sales/monthly-plans', { params: filters });
    return res.data;
  }

  public async createMonthlyPlan(dto: Partial<MonthlyPlanOrder>): Promise<{ success: boolean; data: MonthlyPlanOrder }> {
    const res = await this.api.post('/front-office/sales/monthly-plans', dto);
    return res.data;
  }

  public async getDemandReconciliation(filters: any = {}): Promise<{ success: boolean; data: DemandReconciliation[]; total: number }> {
    const res = await this.api.get('/front-office/sales/demand-reconciliation', { params: filters });
    return res.data;
  }

  public async createReconciliation(dto: Partial<DemandReconciliation>): Promise<{ success: boolean; data: DemandReconciliation }> {
    const res = await this.api.post('/front-office/sales/demand-reconciliation', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 12 & 13: Deliveries & Credit Control
  // --------------------------------------------------------------------------
  public async getDeliveries(filters: any = {}): Promise<{ success: boolean; data: DeliveryRecord[]; total: number }> {
    const res = await this.api.get('/front-office/sales/deliveries', { params: filters });
    return res.data;
  }

  public async createDelivery(dto: any): Promise<{ success: boolean; data: DeliveryRecord }> {
    const res = await this.api.post('/front-office/sales/deliveries', dto);
    return res.data;
  }

  public async generateEwayBill(deliveryId: string): Promise<any> {
    const res = await this.api.post(`/front-office/sales/deliveries/${deliveryId}/generate-eway-bill`);
    return res.data;
  }

  public async getCreditControl(filters: any = {}): Promise<{ success: boolean; data: CreditControlRecord[]; total: number }> {
    const res = await this.api.get('/front-office/sales/credit-control', { params: filters });
    return res.data;
  }

  public async placeCreditHold(accountId: string, isOnHold: boolean, holdReason?: string): Promise<any> {
    const res = await this.api.post(`/front-office/sales/credit-control/${accountId}/hold`, { isOnHold, holdReason });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 14 & 15: Returns & Analytics
  // --------------------------------------------------------------------------
  public async getReturns(filters: any = {}): Promise<{ success: boolean; data: ReturnRecord[]; total: number }> {
    const res = await this.api.get('/front-office/sales/returns', { params: filters });
    return res.data;
  }

  public async createReturn(dto: Partial<ReturnRecord>): Promise<{ success: boolean; data: ReturnRecord }> {
    const res = await this.api.post('/front-office/sales/returns', dto);
    return res.data;
  }

  public async getSalesAnalytics(filters: any = {}): Promise<any> {
    const res = await this.api.get('/front-office/sales/analytics', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 17: Pricing & Discounts
  // --------------------------------------------------------------------------
  public async getPriceLists(): Promise<{ success: boolean; data: PriceListRecord[] }> {
    const res = await this.api.get('/front-office/sales/price-lists');
    return res.data;
  }

  public async createPriceList(dto: Partial<PriceListRecord>): Promise<{ success: boolean; data: PriceListRecord }> {
    const res = await this.api.post('/front-office/sales/price-lists', dto);
    return res.data;
  }

  public async getDiscountRules(): Promise<{ success: boolean; data: DiscountRuleRecord[] }> {
    const res = await this.api.get('/front-office/sales/discount-rules');
    return res.data;
  }

  public async createDiscountRule(dto: Partial<DiscountRuleRecord>): Promise<{ success: boolean; data: DiscountRuleRecord }> {
    const res = await this.api.post('/front-office/sales/discount-rules', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 18: Performance
  // --------------------------------------------------------------------------
  public async getPerformance(filters: any = {}): Promise<{ success: boolean; data: SalesPerformanceRecord[] }> {
    const res = await this.api.get('/front-office/sales/performance', { params: filters });
    return res.data;
  }

  public async createPerformanceRecord(dto: Partial<SalesPerformanceRecord>): Promise<{ success: boolean; data: SalesPerformanceRecord }> {
    const res = await this.api.post('/front-office/sales/performance', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 19: Contracts
  // --------------------------------------------------------------------------
  public async getContracts(filters: any = {}): Promise<{ success: boolean; data: SalesContractRecord[]; total: number }> {
    const res = await this.api.get('/front-office/sales/contracts', { params: filters });
    return res.data;
  }

  public async createContract(dto: Partial<SalesContractRecord>): Promise<{ success: boolean; data: SalesContractRecord }> {
    const res = await this.api.post('/front-office/sales/contracts', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 20: Export Docs
  // --------------------------------------------------------------------------
  public async getExportDocs(filters: any = {}): Promise<{ success: boolean; data: ExportDocRecord[]; total: number }> {
    const res = await this.api.get('/front-office/sales/export-docs', { params: filters });
    return res.data;
  }

  public async createExportDoc(dto: Partial<ExportDocRecord>): Promise<{ success: boolean; data: ExportDocRecord }> {
    const res = await this.api.post('/front-office/sales/export-docs', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 21: Customer Portal
  // --------------------------------------------------------------------------
  public async getPortalOrders(accountId: string): Promise<any> {
    const res = await this.api.get(`/front-office/portal/orders/${accountId}`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Sales Screen 22: Sales Forecasting
  // --------------------------------------------------------------------------
  public async getForecasts(filters: any = {}): Promise<{ success: boolean; data: SalesForecastRecord[]; total: number }> {
    const res = await this.api.get('/front-office/sales/forecasts', { params: filters });
    return res.data;
  }

  public async createForecast(dto: Partial<SalesForecastRecord>): Promise<{ success: boolean; data: SalesForecastRecord }> {
    const res = await this.api.post('/front-office/sales/forecasts', dto);
    return res.data;
  }
}

export const frontOfficeApi = FrontOfficeApi.getInstance();
