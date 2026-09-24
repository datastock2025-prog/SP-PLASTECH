import axios, { AxiosInstance } from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// TypeScript Interfaces for Module-8 Procurement (All 12 Screens)
// ============================================================================

// Screen 1: Supplier Directory
export interface Supplier {
  id: string;
  tenantId: string;
  supplierCode: string;
  supplierName: string;
  legalName?: string;
  supplierType: 'MANUFACTURER' | 'DISTRIBUTOR' | 'TRADER' | 'SERVICE_PROVIDER' | 'CONTRACTOR';
  category?: string;
  subCategory?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  tan?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  paymentTerms?: string;
  currency: string;
  isoCertified: boolean;
  isoCertificate?: string;
  msmeRegistered: boolean;
  msmeNumber?: string;
  rating: number;
  totalOrders: number;
  totalValue: number;
  onTimeDeliveryPct: number;
  qualityScore: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED';
  complianceStatus: string;
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

// Screen 2: Purchase Requisitions (PR)
export interface PurchaseRequisitionLine {
  id?: string;
  prId?: string;
  lineNo: number;
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  description?: string;
  quantity: number;
  uom: string;
  estimatedPrice?: number;
  totalAmount: number;
  requiredDate?: string;
  notes?: string;
}

export interface PurchaseRequisition {
  id: string;
  tenantId: string;
  prNumber: string;
  prDate: string;
  department?: string;
  plantId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CONVERTED_TO_PO' | 'CANCELLED';
  totalAmount: number;
  currency: string;
  justification?: string;
  budgetCode?: string;
  approvedAt?: string;
  approvedById?: string;
  convertedToPoId?: string;
  lines: PurchaseRequisitionLine[];
  version: string;
  createdAt?: string;
}

// Screen 3: Requests for Quotation (RFQ)
export interface RfqLine {
  id?: string;
  rfqId?: string;
  lineNo: number;
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  description?: string;
  quantity: number;
  uom: string;
  specifications?: string;
  requiredDate?: string;
}

export interface Rfq {
  id: string;
  tenantId: string;
  rfqNumber: string;
  rfqDate: string;
  prId?: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'BIDS_RECEIVED' | 'EVALUATION_IN_PROGRESS' | 'AWARDED' | 'CONVERTED_TO_PO' | 'CANCELLED' | 'EXPIRED';
  validUntil: string;
  quotationDeadline: string;
  totalBids: number;
  awardedToId?: string;
  convertedToPoId?: string;
  lines: RfqLine[];
  invitedSuppliers?: string[];
  version: string;
  createdAt?: string;
}

// Screen 4: RFQ Bid Comparison
export interface RfqBidLine {
  rfqLineId?: string;
  itemId?: string;
  itemCode?: string;
  quantity: number;
  unitPrice: number;
  deliveryDays?: number;
  totalAmount?: number;
}

export interface RfqBid {
  id: string;
  tenantId: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  validityDays: number;
  deliveryDays: number;
  paymentTerms?: string;
  isAwarded: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_EVALUATION' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  lines: RfqBidLine[];
}

export interface BidComparisonMatrixResult {
  rfq: {
    number: string;
    title: string;
    deadline: string;
    totalBids: number;
  };
  suppliers: Array<{
    supplierId: string;
    supplierName: string;
    totalAmount: number;
    deliveryDays: number;
    paymentTerms?: string;
    status: string;
    isAwarded: boolean;
  }>;
  lineComparison: Array<{
    rfqLineId: string;
    itemCode?: string;
    itemName?: string;
    quantity: number;
    uom: string;
    bids: Array<{
      supplierId: string;
      supplierName: string;
      unitPrice: number;
      totalAmount: number;
      deliveryDays?: number;
    }>;
    lowestPrice: number;
    recommendedSupplier?: string;
  }>;
  summary: {
    lowestBid: number;
    highestBid: number;
    averageBid: number;
  };
}

// Screen 5: Purchase Orders (PO)
export interface PurchaseOrderLine {
  id?: string;
  poId?: string;
  lineNo: number;
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  description?: string;
  quantity: number;
  receivedQty: number;
  pendingQty: number;
  rejectedQty: number;
  uom: string;
  unitPrice: number;
  discountPct?: number;
  taxPct?: number;
  taxAmount?: number;
  totalAmount: number;
  deliveryDate?: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  poNumber: string;
  poDate: string;
  supplierId: string;
  supplierName?: string;
  prId?: string;
  rfqId?: string;
  contractId?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT_TO_SUPPLIER' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CLOSED' | 'CANCELLED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subtotal: number;
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  notes?: string;
  termsConditions?: string;
  approvedAt?: string;
  approvedById?: string;
  lines: PurchaseOrderLine[];
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

// Screen 6: PO Approvals
export interface PoApproval {
  id: string;
  tenantId: string;
  poId: string;
  stageNumber: number;
  approverId: string;
  approverRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELEGATED' | 'ESCALATED' | 'CANCELLED';
  comments?: string;
  reason?: string;
  actedAt?: string;
}

// Screen 7: Goods Receipts (GRN)
export interface GoodsReceiptLine {
  id?: string;
  grnId?: string;
  poLineId?: string;
  lineNo: number;
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  uom: string;
  batchNumber?: string;
  expiryDate?: string;
  locationId?: string;
  rejectionReason?: string;
}

export interface GoodsReceipt {
  id: string;
  tenantId: string;
  grnNumber: string;
  grnDate: string;
  poId: string;
  poNumber?: string;
  supplierId: string;
  warehouseId?: string;
  status: 'DRAFT' | 'PENDING_INSPECTION' | 'INSPECTED' | 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED' | 'POSTED_TO_INVENTORY';
  totalQty: number;
  acceptedQty: number;
  rejectedQty: number;
  inspectionStatus: string;
  vehicleNumber?: string;
  lrNumber?: string;
  transporter?: string;
  lines: GoodsReceiptLine[];
  version: string;
  createdAt?: string;
}

// Screen 8: Vendor Returns & Debit Notes
export interface PurchaseReturnLine {
  id?: string;
  returnId?: string;
  grnLineId?: string;
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  totalAmount: number;
  reason?: string;
}

export interface PurchaseReturn {
  id: string;
  tenantId: string;
  returnNumber: string;
  returnDate: string;
  poId?: string;
  grnId?: string;
  supplierId: string;
  returnReason: 'DEFECTIVE' | 'WRONG_ITEM' | 'DAMAGED' | 'EXCESS_SUPPLY' | 'QUALITY_ISSUE' | 'OTHER';
  status: 'PENDING' | 'APPROVED' | 'PICKED_UP' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  debitNoteNumber?: string;
  debitNoteDate?: string;
  refundStatus: string;
  lines: PurchaseReturnLine[];
  version: string;
  createdAt?: string;
}

// Screen 9: Supplier Performance Scorecards
export interface SupplierPerformanceScorecard {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  category?: string;
  overallRating: number;
  overallScore: number;
  kpis: {
    onTimeDeliveryPct: number;
    qualityAcceptancePct: number;
    responsivenessPct: number;
    complianceScorePct: number;
  };
  auditCompliance: string;
}

// Screen 10: Supplier Risk & Compliance
export interface SupplierRiskAssessment {
  id: string;
  tenantId: string;
  supplierId: string;
  assessmentDate: string;
  riskCategory: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  financialRisk: number;
  operationalRisk: number;
  complianceRisk: number;
  qualityRisk: number;
  deliveryRisk: number;
  findings?: string;
  recommendations?: string;
  nextReviewDate?: string;
  status: string;
  createdAt?: string;
}

// Screen 11: Supplier Contracts & Blanket POs
export interface SupplierContract {
  id: string;
  tenantId: string;
  contractNumber: string;
  supplierId: string;
  contractType: 'STANDARD' | 'BLANKET_ORDER' | 'FRAMEWORK_AGREEMENT' | 'RATE_CONTRACT' | 'SERVICE_AGREEMENT';
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  currency: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  autoRenewal: boolean;
  renewalNoticeDays: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';
  version: string;
  createdAt?: string;
}

// Screen 12: Supplier Price Lists
export interface SupplierPriceList {
  id: string;
  tenantId: string;
  priceListCode: string;
  supplierId: string;
  priceListName: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  isDefault: boolean;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'EXPIRED' | 'SUPERSEDED';
  items: Array<{
    itemCode: string;
    itemName: string;
    unitPrice: number;
    minQty: number;
    discountPct: number;
  }>;
}

// ============================================================================
// Frontend Procurement API Client Class
// ============================================================================

class ProcurementApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE}/procurement`,
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
  // Screen 1: Supplier Directory
  // --------------------------------------------------------------------------
  public async getSuppliers(filters: any = {}) {
    const res = await this.client.get('/suppliers', { params: filters });
    return res.data;
  }

  public async createSupplier(supplierData: Partial<Supplier>) {
    const res = await this.client.post('/suppliers', supplierData);
    return res.data;
  }

  public async updateSupplier(id: string, supplierData: Partial<Supplier>) {
    const res = await this.client.put(`/suppliers/${id}`, supplierData);
    return res.data;
  }

  public async approveSupplier(id: string) {
    const res = await this.client.post(`/suppliers/${id}/approve`);
    return res.data;
  }

  public async getSupplier360(id: string) {
    const res = await this.client.get(`/suppliers/${id}/360`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 2: Purchase Requisitions (PR)
  // --------------------------------------------------------------------------
  public async getPurchaseRequisitions(filters: any = {}) {
    const res = await this.client.get('/purchase-requisitions', { params: filters });
    return res.data;
  }

  public async createPurchaseRequisition(prData: Partial<PurchaseRequisition>) {
    const res = await this.client.post('/purchase-requisitions', prData);
    return res.data;
  }

  public async updatePurchaseRequisition(id: string, prData: Partial<PurchaseRequisition>) {
    const res = await this.client.put(`/purchase-requisitions/${id}`, prData);
    return res.data;
  }

  public async approvePurchaseRequisition(id: string) {
    const res = await this.client.post(`/purchase-requisitions/${id}/approve`);
    return res.data;
  }

  public async convertPrToPo(id: string) {
    const res = await this.client.post(`/purchase-requisitions/${id}/convert-to-po`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 3: Requests for Quotation (RFQ)
  // --------------------------------------------------------------------------
  public async getRfqs(filters: any = {}) {
    const res = await this.client.get('/rfqs', { params: filters });
    return res.data;
  }

  public async createRfq(rfqData: Partial<Rfq>) {
    const res = await this.client.post('/rfqs', rfqData);
    return res.data;
  }

  public async publishRfq(id: string) {
    const res = await this.client.post(`/rfqs/${id}/publish`);
    return res.data;
  }

  public async inviteSuppliers(id: string, supplierIds: string[]) {
    const res = await this.client.post(`/rfqs/${id}/invite-suppliers`, { supplierIds });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 4: RFQ Bid Comparison Matrix & Award
  // --------------------------------------------------------------------------
  public async submitBid(bidData: any) {
    const res = await this.client.post('/rfqs/submit-bid', bidData);
    return res.data;
  }

  public async getBidComparisonMatrix(id: string) {
    const res = await this.client.get(`/rfqs/${id}/bid-comparison`);
    return res.data;
  }

  public async awardBid(id: string, bidId: string) {
    const res = await this.client.post(`/rfqs/${id}/award-bid`, { bidId });
    return res.data;
  }

  public async convertRfqToPo(id: string) {
    const res = await this.client.post(`/rfqs/${id}/convert-to-po`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 5: Purchase Orders (PO)
  // --------------------------------------------------------------------------
  public async getPurchaseOrders(filters: any = {}) {
    const res = await this.client.get('/purchase-orders', { params: filters });
    return res.data;
  }

  public async createPurchaseOrder(poData: Partial<PurchaseOrder>) {
    const res = await this.client.post('/purchase-orders', poData);
    return res.data;
  }

  public async updatePurchaseOrder(id: string, poData: Partial<PurchaseOrder>) {
    const res = await this.client.put(`/purchase-orders/${id}`, poData);
    return res.data;
  }

  public async submitPoForApproval(id: string) {
    const res = await this.client.post(`/purchase-orders/${id}/submit-approval`);
    return res.data;
  }

  public async sendPoToSupplier(id: string) {
    const res = await this.client.post(`/purchase-orders/${id}/send-to-supplier`);
    return res.data;
  }

  public async getPoHistory(id: string) {
    const res = await this.client.get(`/purchase-orders/${id}/history`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 6: Multi-Tier PO Approvals
  // --------------------------------------------------------------------------
  public async getPendingPoApprovals() {
    const res = await this.client.get('/po-approvals/pending');
    return res.data;
  }

  public async approvePo(id: string, stageNumber: number, comments?: string) {
    const res = await this.client.post(`/po-approvals/${id}/approve`, { stageNumber, comments });
    return res.data;
  }

  public async rejectPo(id: string, stageNumber: number, reason: string) {
    const res = await this.client.post(`/po-approvals/${id}/reject`, { stageNumber, reason });
    return res.data;
  }

  public async delegatePoApproval(id: string, stageNumber: number, delegateToId: string) {
    const res = await this.client.post(`/po-approvals/${id}/delegate`, { stageNumber, delegateToId });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 7: Goods Receipts (GRN) & QA Inspection
  // --------------------------------------------------------------------------
  public async getGoodsReceipts(filters: any = {}) {
    const res = await this.client.get('/goods-receipts', { params: filters });
    return res.data;
  }

  public async createGoodsReceipt(grnData: Partial<GoodsReceipt>) {
    const res = await this.client.post('/goods-receipts', grnData);
    return res.data;
  }

  public async inspectGoodsReceipt(id: string, inspectionData: any) {
    const res = await this.client.post(`/goods-receipts/${id}/inspect`, inspectionData);
    return res.data;
  }

  public async postGrnToInventory(id: string) {
    const res = await this.client.post(`/goods-receipts/${id}/post-to-inventory`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 8: Vendor Returns & Debit Notes
  // --------------------------------------------------------------------------
  public async getPurchaseReturns(filters: any = {}) {
    const res = await this.client.get('/purchase-returns', { params: filters });
    return res.data;
  }

  public async createPurchaseReturn(returnData: Partial<PurchaseReturn>) {
    const res = await this.client.post('/purchase-returns', returnData);
    return res.data;
  }

  public async approvePurchaseReturn(id: string) {
    const res = await this.client.post(`/purchase-returns/${id}/approve`);
    return res.data;
  }

  public async generateDebitNote(id: string) {
    const res = await this.client.post(`/purchase-returns/${id}/generate-debit-note`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 9: Supplier Performance Scorecards
  // --------------------------------------------------------------------------
  public async getSupplierPerformance(filters: any = {}) {
    const res = await this.client.get('/supplier-performance', { params: filters });
    return res.data;
  }

  public async calculateSupplierPerformance(calcData: any) {
    const res = await this.client.post('/supplier-performance/calculate', calcData);
    return res.data;
  }

  public async getSupplierScorecard(supplierId: string) {
    const res = await this.client.get(`/supplier-performance/${supplierId}/scorecard`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 10: Supplier Risk & Compliance
  // --------------------------------------------------------------------------
  public async getSupplierRiskAssessments(filters: any = {}) {
    const res = await this.client.get('/supplier-risk', { params: filters });
    return res.data;
  }

  public async createRiskAssessment(assessmentData: any) {
    const res = await this.client.post('/supplier-risk/assess', assessmentData);
    return res.data;
  }

  public async getSupplierRiskHistory(supplierId: string) {
    const res = await this.client.get(`/supplier-risk/${supplierId}/history`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 11: Supplier Contracts & Blanket POs
  // --------------------------------------------------------------------------
  public async getSupplierContracts(filters: any = {}) {
    const res = await this.client.get('/supplier-contracts', { params: filters });
    return res.data;
  }

  public async createSupplierContract(contractData: Partial<SupplierContract>) {
    const res = await this.client.post('/supplier-contracts', contractData);
    return res.data;
  }

  public async approveContract(id: string) {
    const res = await this.client.post(`/supplier-contracts/${id}/approve`);
    return res.data;
  }

  public async createBlanketPo(id: string, blanketPoData: any) {
    const res = await this.client.post(`/supplier-contracts/${id}/create-blanket-po`, blanketPoData);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 12: Supplier Price Lists
  // --------------------------------------------------------------------------
  public async getSupplierPriceLists(filters: any = {}) {
    const res = await this.client.get('/supplier-price-lists', { params: filters });
    return res.data;
  }

  public async createSupplierPriceList(priceListData: any) {
    const res = await this.client.post('/supplier-price-lists', priceListData);
    return res.data;
  }

  public async approvePriceList(id: string) {
    const res = await this.client.post(`/supplier-price-lists/${id}/approve`);
    return res.data;
  }

  public async getActivePriceList(supplierId: string) {
    const res = await this.client.get(`/supplier-price-lists/${supplierId}/active`);
    return res.data;
  }
}

export const procurementApi = new ProcurementApiClient();
