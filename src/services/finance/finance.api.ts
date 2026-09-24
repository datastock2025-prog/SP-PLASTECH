import axios, { AxiosInstance } from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// TypeScript Interfaces for Module-6 Finance (All 14 Screens)
// ============================================================================

// Screen 3: Chart of Accounts
export interface ChartOfAccount {
  id: string;
  tenantId: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'CONTRA_ASSET' | 'CONTRA_LIABILITY';
  accountGroup?: string;
  accountSubGroup?: string;
  parentAccountId?: string;
  isPostable: boolean;
  isActive: boolean;
  currency: string;
  taxCode?: string;
  costCenterId?: string;
  openingBalance: number;
  currentBalance: number;
  version: string;
  children?: ChartOfAccount[];
  createdAt?: string;
  updatedAt?: string;
}

// Screen 4: Journal Entry & General Ledger
export interface JournalEntryLine {
  id?: string;
  jeId?: string;
  lineNo: number;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  costCenterId?: string;
  projectId?: string;
  taxCode?: string;
  taxAmount?: number;
  currency?: string;
  exchangeRate?: number;
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  jeNumber: string;
  jeDate: string;
  period: string;
  fiscalYear: number;
  jeType: 'MANUAL' | 'AUTO_FROM_INVOICE' | 'AUTO_FROM_PAYMENT' | 'AUTO_FROM_GRN' | 'AUTO_FROM_DISPATCH' | 'AUTO_FROM_PRODUCTION' | 'AUTO_FROM_COSTING' | 'REVERSAL' | 'OPENING_BALANCE' | 'ADJUSTMENT';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'POSTED' | 'APPROVED' | 'REVERSED' | 'CANCELLED';
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  currency: string;
  exchangeRate: number;
  isReversed: boolean;
  reversedByJeId?: string;
  postedAt?: string;
  postedById?: string;
  version: string;
  lines: JournalEntryLine[];
  createdAt?: string;
  updatedAt?: string;
}

// Screen 5: Accounts Payable & 3-Way Match
export interface ApLine {
  id?: string;
  apId?: string;
  lineNo: number;
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  poQty?: number;
  grnQty?: number;
  invoiceQty: number;
  unitPrice: number;
  totalAmount: number;
  taxPct?: number;
  taxAmount?: number;
  uom: string;
}

export interface AccountsPayable {
  id: string;
  tenantId: string;
  apNumber: string;
  supplierId: string;
  supplierName: string;
  poNumber?: string;
  poId?: string;
  grnNumber?: string;
  grnId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  invoiceAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  status: 'PENDING_MATCH' | 'MATCHED' | 'APPROVED' | 'SCHEDULED_FOR_PAYMENT' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'DISPUTED';
  matchStatus: 'PENDING' | 'PARTIAL_MATCH' | 'FULL_MATCH' | 'MISMATCH';
  poMatch: boolean;
  grnMatch: boolean;
  invoiceMatch: boolean;
  threeWayMatch: boolean;
  paymentTerms?: string;
  discountPct?: number;
  discountAmount?: number;
  jeId?: string;
  lines: ApLine[];
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

// Screen 6: Accounts Receivable & Collections
export interface ArLine {
  id?: string;
  arId?: string;
  lineNo: number;
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  taxPct?: number;
  taxAmount?: number;
  uom: string;
}

export interface AccountsReceivable {
  id: string;
  tenantId: string;
  arNumber: string;
  accountId: string;
  accountName?: string;
  invoiceNumber: string;
  invoiceId?: string;
  invoiceDate: string;
  dueDate: string;
  invoiceAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  status: 'DRAFT' | 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'WRITTEN_OFF' | 'DISPUTED' | 'CANCELLED';
  agingBucket?: 'Current' | '1-30' | '31-60' | '61-90' | '90+';
  paymentTerms?: string;
  discountPct?: number;
  discountAmount?: number;
  lines: ArLine[];
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

// Screen 7: Invoicing & Customer Billing
export interface InvoiceLine {
  id?: string;
  invoiceId?: string;
  lineNo: number;
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  description?: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  discountPct?: number;
  taxPct?: number;
  taxAmount?: number;
  totalAmount: number;
  hsnSacCode?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  invoiceType: 'STANDARD' | 'PROFORMA' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'RECURRING' | 'INTERIM' | 'FINAL';
  accountId: string;
  accountName?: string;
  contactId?: string;
  salesOrderId?: string;
  deliveryId?: string;
  invoiceDate: string;
  dueDate: string;
  period?: string;
  fiscalYear: number;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  taxPct: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'WRITTEN_OFF';
  gstApplicable: boolean;
  gstin?: string;
  placeOfSupply?: string;
  reverseCharge: boolean;
  notes?: string;
  termsConditions?: string;
  lines: InvoiceLine[];
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

// Screen 8: Batch Payment Run & Payments
export interface PaymentRun {
  id: string;
  tenantId: string;
  runNumber: string;
  runType: 'AP_PAYMENT' | 'AR_COLLECTION' | 'PAYROLL' | 'EXPENSE_REIMBURSEMENT';
  runDate: string;
  period?: string;
  fiscalYear: number;
  totalAmount: number;
  paymentCount: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROCESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentMethod: string;
  bankAccountId?: string;
  itemIdsToPay?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  paymentNumber: string;
  paymentType: 'OUTGOING' | 'INCOMING';
  paymentDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  referenceNumber?: string;
  apId?: string;
  arId?: string;
  paymentRunId?: string;
  bankAccountId?: string;
  status: 'PENDING' | 'SCHEDULED' | 'IN_PROCESS' | 'COMPLETED' | 'FAILED' | 'REVERSED' | 'CANCELLED';
  createdAt?: string;
}

// Screen 9: Product Costing & Margins
export interface ProductCost {
  id: string;
  tenantId: string;
  itemId: string;
  costType: 'STANDARD' | 'ACTUAL' | 'ESTIMATED' | 'SIMULATED';
  costVersion: string;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  machineCost: number;
  subcontractCost: number;
  totalCost: number;
  sellingPrice: number;
  marginAmount: number;
  marginPct: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt?: string;
}

// Screen 10: Cost Centers & Budgets
export interface CostCenter {
  id: string;
  tenantId: string;
  costCenterCode: string;
  costCenterName: string;
  costCenterType: string;
  department?: string;
  managerId?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Budget {
  id: string;
  tenantId: string;
  budgetNumber: string;
  budgetName: string;
  fiscalYear: number;
  period: string;
  periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  costCenterId?: string;
  accountId?: string;
  budgetAmount: number;
  actualAmount: number;
  committedAmount: number;
  availableAmount: number;
  variance: number;
  variancePct: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  createdAt?: string;
}

// Screen 11: Financial Statements
export interface ProfitLossStatement {
  statement: string;
  period: string;
  revenue: { total: number; breakdown: any[] };
  costOfGoodsSold: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: { total: number; breakdown: any[] };
  ebitda: number;
  taxExpense: number;
  netIncome: number;
  netMarginPct: number;
}

export interface BalanceSheetStatement {
  statement: string;
  asOfDate: string;
  assets: { total: number; breakdown: any[] };
  liabilities: { total: number; breakdown: any[] };
  equity: { total: number; breakdown: any[] };
  isBalanced: boolean;
}

// Screen 12: Fixed Asset Register
export interface FixedAsset {
  id: string;
  tenantId: string;
  assetNumber: string;
  assetName: string;
  assetCategory: string;
  assetGroupId?: string;
  location?: string;
  department?: string;
  acquisitionDate: string;
  acquisitionCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: string;
  depreciationRate: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  status: 'ACTIVE' | 'FULLY_DEPRECIATED' | 'DISPOSED' | 'SOLD' | 'SCRAPPED' | 'TRANSFERRED';
  disposalDate?: string;
  disposalValue?: number;
  disposalGainLoss?: number;
  createdAt?: string;
}

// Screen 13: GST & Tax Workbench
export interface GstReturn {
  id: string;
  tenantId: string;
  returnNumber: string;
  returnType: 'GSTR1' | 'GSTR2' | 'GSTR3B' | 'GSTR9' | 'GSTR9C';
  period: string;
  fiscalYear: number;
  month: number;
  quarter?: number;
  totalSales: number;
  totalPurchases: number;
  outputTax: number;
  inputTax: number;
  netTaxPayable: number;
  taxPaid: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'READY_TO_FILE' | 'FILED' | 'ACCEPTED' | 'REJECTED' | 'AMENDED';
  filedAt?: string;
  arn?: string;
  createdAt?: string;
}

// Screen 14: EPR Plastic Waste Credit Exchange
export interface EprCredit {
  id: string;
  tenantId: string;
  creditNumber: string;
  creditType: string;
  period: string;
  fiscalYear: number;
  quarter?: number;
  plasticCategory: string;
  quantityKg: number;
  creditValue: number;
  unitPrice: number;
  status: 'PENDING' | 'VERIFIED' | 'ISSUED' | 'AVAILABLE_FOR_TRADE' | 'TRADED' | 'RETIRED' | 'EXPIRED' | 'CANCELLED';
  certificateNumber?: string;
  issuedBy?: string;
  issuedAt?: string;
  tradedAt?: string;
  tradedWith?: string;
  tradeValue?: number;
  createdAt?: string;
}

// ============================================================================
// Frontend Finance API Client Class
// ============================================================================

class FinanceApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE}/finance`,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Auto-inject CSRF and Tenant headers
    this.client.interceptors.request.use((config) => {
      const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
      if (match) {
        config.headers['x-csrf-token'] = decodeURIComponent(match[2]);
      }
      const tenantId = localStorage.getItem('tenant_id') || 'TENANT-ALPHA-IND';
      config.headers['x-tenant-id'] = tenantId;
      return config;
    });
  }

  // --------------------------------------------------------------------------
  // Screen 1: Operations-to-Ledger Workspace
  // --------------------------------------------------------------------------
  public async getUnifiedLedger(filters: any = {}) {
    const res = await this.client.get('/unified-ledger', { params: filters });
    return res.data;
  }

  public async getOperationsFeed(filters: any = {}) {
    const res = await this.client.get('/unified-ledger/operations', { params: filters });
    return res.data;
  }

  public async autoPostFromOperations(postData: any) {
    const res = await this.client.post('/unified-ledger/auto-post', postData);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 2: Finance Command Center (Dashboard & KPIs)
  // --------------------------------------------------------------------------
  public async getFinanceDashboard() {
    const res = await this.client.get('/dashboard/finance');
    return res.data;
  }

  public async getFinanceKpis() {
    const res = await this.client.get('/dashboard/kpis');
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 3: Chart of Accounts (COA)
  // --------------------------------------------------------------------------
  public async getChartOfAccounts(filters: any = {}) {
    const res = await this.client.get('/coa', { params: filters });
    return res.data;
  }

  public async createAccount(accountData: Partial<ChartOfAccount>) {
    const res = await this.client.post('/coa', accountData);
    return res.data;
  }

  public async updateAccount(id: string, accountData: Partial<ChartOfAccount>) {
    const res = await this.client.put(`/coa/${id}`, accountData);
    return res.data;
  }

  public async getAccountBalance(id: string) {
    const res = await this.client.get(`/coa/${id}/balance`);
    return res.data;
  }

  public async getAccountHierarchy() {
    const res = await this.client.get('/coa/hierarchy');
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 4: Journal Entries & General Ledger
  // --------------------------------------------------------------------------
  public async getJournalEntries(filters: any = {}) {
    const res = await this.client.get('/journal-entries', { params: filters });
    return res.data;
  }

  public async createJournalEntry(jeData: Partial<JournalEntry>) {
    const res = await this.client.post('/journal-entries', jeData);
    return res.data;
  }

  public async updateJournalEntry(id: string, jeData: Partial<JournalEntry>) {
    const res = await this.client.put(`/journal-entries/${id}`, jeData);
    return res.data;
  }

  public async postJournalEntry(id: string) {
    const res = await this.client.post(`/journal-entries/${id}/post`);
    return res.data;
  }

  public async reverseJournalEntry(id: string, reason: string) {
    const res = await this.client.post(`/journal-entries/${id}/reverse`, { reason });
    return res.data;
  }

  public async getAccountLedger(id: string, filters: any = {}) {
    const res = await this.client.get(`/journal-entries/${id}/ledger`, { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 5: Accounts Payable & 3-Way Match
  // --------------------------------------------------------------------------
  public async getAccountsPayable(filters: any = {}) {
    const res = await this.client.get('/ap', { params: filters });
    return res.data;
  }

  public async createAccountsPayable(apData: Partial<AccountsPayable>) {
    const res = await this.client.post('/ap', apData);
    return res.data;
  }

  public async performThreeWayMatch(id: string) {
    const res = await this.client.post(`/ap/${id}/match`);
    return res.data;
  }

  public async approveAp(id: string) {
    const res = await this.client.post(`/ap/${id}/approve`);
    return res.data;
  }

  public async getMatchStatus(id: string) {
    const res = await this.client.get(`/ap/${id}/match-status`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 6: Accounts Receivable & Collections
  // --------------------------------------------------------------------------
  public async getAccountsReceivable(filters: any = {}) {
    const res = await this.client.get('/ar', { params: filters });
    return res.data;
  }

  public async createAccountsReceivable(arData: Partial<AccountsReceivable>) {
    const res = await this.client.post('/ar', arData);
    return res.data;
  }

  public async recordCollection(id: string, collectionData: any) {
    const res = await this.client.post(`/ar/${id}/collect`, collectionData);
    return res.data;
  }

  public async getAgingReport(filters: any = {}) {
    const res = await this.client.get('/ar/aging', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 7: Invoicing & Customer Billing
  // --------------------------------------------------------------------------
  public async getInvoices(filters: any = {}) {
    const res = await this.client.get('/invoices', { params: filters });
    return res.data;
  }

  public async createInvoice(invoiceData: Partial<Invoice>) {
    const res = await this.client.post('/invoices', invoiceData);
    return res.data;
  }

  public async updateInvoice(id: string, invoiceData: Partial<Invoice>) {
    const res = await this.client.put(`/invoices/${id}`, invoiceData);
    return res.data;
  }

  public async approveInvoice(id: string) {
    const res = await this.client.post(`/invoices/${id}/approve`);
    return res.data;
  }

  public async issueInvoice(id: string) {
    const res = await this.client.post(`/invoices/${id}/issue`);
    return res.data;
  }

  public async generateInvoicePdf(id: string) {
    const res = await this.client.post(`/invoices/${id}/generate-pdf`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 8: Batch Payment Run & Payments
  // --------------------------------------------------------------------------
  public async getPaymentRuns(filters: any = {}) {
    const res = await this.client.get('/payment-runs', { params: filters });
    return res.data;
  }

  public async createPaymentRun(paymentRunData: Partial<PaymentRun>) {
    const res = await this.client.post('/payment-runs', paymentRunData);
    return res.data;
  }

  public async approvePaymentRun(id: string) {
    const res = await this.client.post(`/payment-runs/${id}/approve`);
    return res.data;
  }

  public async executePaymentRun(id: string) {
    const res = await this.client.post(`/payment-runs/${id}/execute`);
    return res.data;
  }

  public async getPayments(filters: any = {}) {
    const res = await this.client.get('/payments', { params: filters });
    return res.data;
  }

  public async createPayment(paymentData: Partial<Payment>) {
    const res = await this.client.post('/payments', paymentData);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 9: Product Costing & Standard Margins
  // --------------------------------------------------------------------------
  public async getProductCosts(filters: any = {}) {
    const res = await this.client.get('/product-costing', { params: filters });
    return res.data;
  }

  public async calculateProductCost(costData: any) {
    const res = await this.client.post('/product-costing/calculate', costData);
    return res.data;
  }

  public async getProductMargins(itemId: string) {
    const res = await this.client.get(`/product-costing/${itemId}/margins`);
    return res.data;
  }

  public async performCostRollup(itemIds: string[]) {
    const res = await this.client.post('/product-costing/rollup', { itemIds });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 10: Cost Centers & Budgets
  // --------------------------------------------------------------------------
  public async getCostCenters(filters: any = {}) {
    const res = await this.client.get('/cost-centers', { params: filters });
    return res.data;
  }

  public async createCostCenter(costCenterData: Partial<CostCenter>) {
    const res = await this.client.post('/cost-centers', costCenterData);
    return res.data;
  }

  public async getBudgets(filters: any = {}) {
    const res = await this.client.get('/budgets', { params: filters });
    return res.data;
  }

  public async createBudget(budgetData: Partial<Budget>) {
    const res = await this.client.post('/budgets', budgetData);
    return res.data;
  }

  public async approveBudget(id: string) {
    const res = await this.client.post(`/budgets/${id}/approve`);
    return res.data;
  }

  public async getBudgetVariance(filters: any = {}) {
    const res = await this.client.get('/budgets/variance', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 11: Financial Statements
  // --------------------------------------------------------------------------
  public async getProfitLoss(filters: any = {}) {
    const res = await this.client.get('/financial-statements/profit-loss', { params: filters });
    return res.data;
  }

  public async getBalanceSheet(filters: any = {}) {
    const res = await this.client.get('/financial-statements/balance-sheet', { params: filters });
    return res.data;
  }

  public async getCashFlow(filters: any = {}) {
    const res = await this.client.get('/financial-statements/cash-flow', { params: filters });
    return res.data;
  }

  public async generateFinancialStatements(generateData: any) {
    const res = await this.client.post('/financial-statements/generate', generateData);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 12: Fixed Asset Register
  // --------------------------------------------------------------------------
  public async getFixedAssets(filters: any = {}) {
    const res = await this.client.get('/fixed-assets', { params: filters });
    return res.data;
  }

  public async createFixedAsset(assetData: Partial<FixedAsset>) {
    const res = await this.client.post('/fixed-assets', assetData);
    return res.data;
  }

  public async runDepreciation(depreciationData: any) {
    const res = await this.client.post('/fixed-assets/depreciation/run', depreciationData);
    return res.data;
  }

  public async disposeAsset(id: string, disposeData: any) {
    const res = await this.client.post(`/fixed-assets/${id}/dispose`, disposeData);
    return res.data;
  }

  public async getDepreciationSchedule(id: string) {
    const res = await this.client.get(`/fixed-assets/${id}/depreciation-schedule`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 13: GST & Tax Workbench
  // --------------------------------------------------------------------------
  public async getGstReturns(filters: any = {}) {
    const res = await this.client.get('/gst/returns', { params: filters });
    return res.data;
  }

  public async createGstReturn(gstData: Partial<GstReturn>) {
    const res = await this.client.post('/gst/returns', gstData);
    return res.data;
  }

  public async calculateGstReturn(id: string) {
    const res = await this.client.post(`/gst/returns/${id}/calculate`);
    return res.data;
  }

  public async fileGstReturn(id: string) {
    const res = await this.client.post(`/gst/returns/${id}/file`);
    return res.data;
  }

  public async getInputTaxCredit(filters: any = {}) {
    const res = await this.client.get('/gst/input-tax-credit', { params: filters });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 14: EPR Plastic Waste Credit Exchange
  // --------------------------------------------------------------------------
  public async getEprCredits(filters: any = {}) {
    const res = await this.client.get('/epr/credits', { params: filters });
    return res.data;
  }

  public async createEprCredit(eprData: Partial<EprCredit>) {
    const res = await this.client.post('/epr/credits', eprData);
    return res.data;
  }

  public async verifyEprCredit(id: string) {
    const res = await this.client.post(`/epr/credits/${id}/verify`);
    return res.data;
  }

  public async tradeEprCredit(id: string, tradeData: any) {
    const res = await this.client.post(`/epr/credits/${id}/trade`, tradeData);
    return res.data;
  }

  public async getEprPortfolio() {
    const res = await this.client.get('/epr/credits/portfolio');
    return res.data;
  }
}

export const financeApi = new FinanceApiClient();
