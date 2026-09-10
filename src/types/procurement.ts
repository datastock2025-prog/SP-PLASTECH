import { ApprovalStatus } from '../types';

export type SupplierType = 'Manufacturer' | 'Authorized Distributor' | 'Trader' | 'Service Provider' | 'Subcontractor' | 'Importer';

export type SupplierCategory = 
  | 'Virgin Resin' 
  | 'Masterbatch & Colorants' 
  | 'Additives & Fillers' 
  | 'Regrind & Recycled' 
  | 'Packaging Materials' 
  | 'Molds & Tooling' 
  | 'Machine Spare Parts' 
  | 'Consumables & Lubricants' 
  | 'Logistics & Freight' 
  | 'Testing & Calibration Services'
  | 'Subcontracting Services';

export type SupplierStatus = 'active' | 'pending_approval' | 'blocked' | 'preferred' | 'under_review' | 'inactive';

export interface SupplierContact {
  id: string;
  name: string;
  role: string;
  department: 'Sales' | 'Quality' | 'Accounts' | 'Logistics' | 'Technical' | 'Management';
  email: string;
  phone: string;
  isPrimary: boolean;
  preferredContact: 'Email' | 'Phone' | 'WhatsApp';
  active: boolean;
}

export interface SupplierAddress {
  id: string;
  type: 'Billing' | 'Shipping' | 'Pickup' | 'Return';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  contactPerson?: string;
  contactPhone?: string;
}

export interface SupplierBankTax {
  bankName: string;
  accountNumber: string;
  ifscOrSwift: string;
  branch: string;
  paymentMethod: 'NEFT/RTGS' | 'Wire Transfer' | 'Letter of Credit' | 'Cheque' | 'PDC';
  taxId: string; // GSTIN / Tax ID
  panNumber: string;
  msmeRegistered: boolean;
  msmeNumber?: string;
  withholdingTaxPct: number; // TDS %
  eInvoicingEnabled: boolean;
}

export interface SupplierItemSupplied {
  itemCode: string;
  itemName: string;
  category: string;
  supplierItemCode: string;
  uom: string;
  leadTimeDays: number;
  moq: number;
  lastPurchasePrice: number;
  contractPrice?: number;
  preferredItem: boolean;
  approvalStatus: ApprovalStatus;
  coaRequired: boolean;
  msdsRequired: boolean;
}

export interface SupplierPriceListEntry {
  id: string;
  priceListId: string;
  supplierId?: string;
  supplierName?: string;
  itemCode: string;
  itemName: string;
  uom?: string;
  currency: string;
  unitPrice: number;
  effectiveFrom: string;
  effectiveTo: string;
  moq: number;
  leadTimeDays: number;
  priceType: 'Fixed' | 'Indexed' | 'Tiered' | 'Contract';
  indexReference?: string;
  baseIndexValue?: number;
  adjustmentFormula?: string;
  freightIncluded: boolean;
  packingIncluded: boolean;
  taxPct: number;
  status: 'Active' | 'Expired' | 'Pending Approval';
  tiers?: Array<{
    minQty: number;
    maxQty: number;
    price: number;
    discountPct: number;
  }>;
}

export interface SupplierDocument {
  id: string;
  title: string;
  type: 'ISO Certificate' | 'Tax Certificate' | 'MSDS/SDS' | 'COA Template' | 'Quality Agreement' | 'NDA' | 'Banking Document' | 'Food Grade Certificate' | 'REACH/RoHS Compliance' | 'Recycled Content Certificate';
  documentNumber: string;
  issueDate: string;
  expiryDate?: string;
  uploadedBy: string;
  fileName: string;
  fileSize: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired' | 'Pending Verification';
  verified: boolean;
}

export interface SupplierComplianceRecord {
  esgRating: 'A+' | 'A' | 'B' | 'C' | 'Unrated';
  esgScore: number;
  iso9001Valid: boolean;
  iso9001Expiry: string;
  iso14001Valid: boolean;
  iso14001Expiry?: string;
  foodGradeCompliant: boolean;
  fdaCfrRef?: string;
  reachCompliant: boolean;
  rohsCompliant: boolean;
  recycledContentCert: boolean;
  grsCertNumber?: string;
  conflictMineralsDeclaration: boolean;
  lastAuditDate: string;
  lastAuditScore: number; // %
  auditFindings: number;
  openCapas: number;
}

export interface SupplierScorecardData {
  overallScore: number; // 0 - 100
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  trend: 'improving' | 'stable' | 'declining';
  evaluationPeriod: string;
  onTimeDeliveryPct: number; // e.g. 96.5%
  quantityAccuracyPct: number; // e.g. 99.2%
  qualityAcceptancePct: number; // e.g. 98.8%
  priceCompetitivenessPct: number; // e.g. 92.0%
  priceVariancePct: number; // e.g. -1.2%
  responsivenessScore: number; // e.g. 90
  documentCompliancePct: number; // e.g. 100%
  complaintResolutionDays: number; // e.g. 4.2 days
  returnRatePct: number; // e.g. 0.8%
  metrics: Array<{
    name: string;
    category: 'Delivery' | 'Quality' | 'Price' | 'Compliance' | 'Service';
    target: string;
    actual: string;
    weight: number;
    score: number;
    status: 'pass' | 'warning' | 'fail';
  }>;
}

export interface SupplierMaster {
  id: string;
  code: string;
  name: string;
  legalName?: string;
  type: SupplierType;
  category: SupplierCategory;
  status: SupplierStatus;
  rating: number; // 1.0 - 5.0
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  preferred: boolean;
  blocked: boolean;
  blockedReason?: string;
  industry: string;
  country: string;
  currency: string;
  paymentTerms: string;
  deliveryTerms: string; // Incoterms e.g. FOB, CIF, EXW
  leadTimeDays: number;
  minimumOrderValue: number;
  website?: string;
  notes?: string;
  createdDate: string;
  openPOsCount: number;
  openPOValue: number;
  outstandingBalance: number;
  lastPurchaseDate?: string;
  contacts: SupplierContact[];
  addresses: SupplierAddress[];
  bankingTax: SupplierBankTax;
  itemsSupplied: SupplierItemSupplied[];
  priceLists: SupplierPriceListEntry[];
  documents: SupplierDocument[];
  compliance: SupplierComplianceRecord;
  scorecard: SupplierScorecardData;
  activityHistory: Array<{
    id: string;
    date: string;
    user: string;
    action: string;
    details: string;
  }>;
}

// ----------------------------------------------------
// 2. PURCHASE REQUISITIONS (PR)
// ----------------------------------------------------
export type PrStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted_rfq' | 'converted_po' | 'on_hold' | 'cancelled';
export type PrSource = 'Manual' | 'MRP' | 'Production Work Order' | 'Warehouse Reorder' | 'Maintenance Job' | 'Project Requirement';

export interface PurchaseRequisitionLine {
  id: string;
  lineNo: number;
  itemCode: string;
  itemName: string;
  itemCategory: string;
  description?: string;
  quantity: number;
  uom: string;
  requiredDate: string;
  suggestedSupplierId?: string;
  suggestedSupplierName?: string;
  estimatedUnitPrice: number;
  estimatedTotal: number;
  workOrderRef?: string;
  salesOrderRef?: string;
  machineRef?: string;
  moldRef?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'converted' | 'rejected';
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  requestDate: string;
  requestedBy: string;
  department: string;
  plantWarehouse: string;
  requiredDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  source: PrSource;
  currency: string;
  estimatedTotal: number;
  budgetAllocated: number;
  budgetRemaining: number;
  budgetExceeded: boolean;
  status: PrStatus;
  approvalStatus: ApprovalStatus;
  currentApprover?: string;
  notes?: string;
  justification?: string;
  lines: PurchaseRequisitionLine[];
  approvalHistory: Array<{
    step: number;
    role: string;
    user: string;
    action: 'Approved' | 'Rejected' | 'Requested Change' | 'Pending';
    date?: string;
    comment?: string;
  }>;
  convertedPoId?: string;
  convertedRfqId?: string;
}

// ----------------------------------------------------
// 3. REQUEST FOR QUOTATION (RFQ)
// ----------------------------------------------------
export type RfqStatus = 'draft' | 'sent' | 'supplier_reviewing' | 'response_received' | 'partial_response' | 'closed' | 'awarded' | 'cancelled';

export interface RfqLineItem {
  lineNo: number;
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  uom: string;
  requiredDate: string;
  targetPrice: number;
  historicalPrice: number;
  technicalSpecs?: string;
  coaRequired: boolean;
  msdsRequired: boolean;
}

export interface RfqSupplierInvite {
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  invitedDate: string;
  status: 'Invited' | 'Viewed' | 'Responded' | 'Declined' | 'Expired';
  responseDate?: string;
  quotationRef?: string;
  totalQuoteAmount?: number;
  leadTimeDays?: number;
  paymentTerms?: string;
  validUntil?: string;
  awarded?: boolean;
}

export interface RequestForQuotation {
  id: string;
  rfqNumber: string;
  title: string;
  sourcePrNumber?: string;
  createdDate: string;
  closingDate: string;
  requiredDeliveryDate: string;
  currency: string;
  incoterms: string;
  shippingTerms: string;
  paymentTerms: string;
  owner: string;
  status: RfqStatus;
  submissionInstructions: string;
  lines: RfqLineItem[];
  invitedSuppliers: RfqSupplierInvite[];
  responsesCount: number;
  awardedSupplierId?: string;
  awardedPoId?: string;
}

// ----------------------------------------------------
// 4. SUPPLIER QUOTATION COMPARISON
// ----------------------------------------------------
export interface QuotationComparisonColumn {
  supplierId: string;
  supplierName: string;
  supplierRating: number;
  quoteRef: string;
  currency: string;
  exchangeRate: number;
  leadTimeDays: number;
  paymentTerms: string;
  deliveryDate: string;
  validUntil: string;
  moq: number;
  qualityAcceptanceRate: number;
  onTimeDeliveryPct: number;
  freightAmount: number;
  packingAmount: number;
  taxAmount: number;
  totalLandedAmount: number;
  weightedScore: number; // 0 - 100
  priceScore: number;
  deliveryScore: number;
  qualityScore: number;
  termsScore: number;
  riskScore: number;
  isBestPrice: boolean;
  isBestTotalScore: boolean;
  selected: boolean;
  linePrices: Array<{
    itemCode: string;
    unitPrice: number;
    totalPrice: number;
    isLowest: boolean;
    targetVariancePct: number;
    historicalVariancePct: number;
  }>;
}

export interface QuotationComparisonSession {
  rfqNumber: string;
  rfqTitle: string;
  evaluationMethod: 'Lowest Price' | 'Best Total Cost' | 'Best Delivery' | 'Best Quality' | 'Weighted Scoring';
  weights: {
    price: number; // e.g. 40
    delivery: number; // e.g. 20
    quality: number; // e.g. 25
    paymentTerms: number; // e.g. 10
    supplierRisk: number; // e.g. 5
  };
  suppliers: QuotationComparisonColumn[];
  splitAwardLines?: Record<string, string>; // itemCode -> supplierId
}

// ----------------------------------------------------
// 5. EXTENDED PURCHASE ORDER (PO)
// ----------------------------------------------------
export type ExtendedPoStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'sent_to_supplier' 
  | 'partially_received' 
  | 'received' 
  | 'partially_invoiced' 
  | 'invoiced' 
  | 'closed' 
  | 'cancelled' 
  | 'on_hold';

export interface ExtendedPoLine {
  lineNo: number;
  itemCode: string;
  itemName: string;
  supplierItemCode?: string;
  description: string;
  orderedQty: number;
  receivedQty: number;
  invoicedQty: number;
  remainingQty: number;
  uom: string;
  unitPrice: number;
  discountPct: number;
  taxPct: number;
  lineTotal: number;
  expectedDate: string;
  warehouse: string;
  binLocation: string;
  lotRequired: boolean;
  shelfLifeDaysReq?: number;
  coaRequired: boolean;
  msdsRequired: boolean;
  status: 'open' | 'partially_received' | 'received' | 'closed' | 'cancelled';
}

export interface ExtendedPurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  buyer: string;
  plantWarehouse: string;
  poDate: string;
  expectedDeliveryDate: string;
  promisedDeliveryDate: string;
  currency: string;
  exchangeRate: number;
  paymentTerms: string;
  deliveryTerms: string; // Incoterms
  orderType: 'Standard PO' | 'Blanket Release' | 'Subcontracting PO' | 'Service PO' | 'Capital PO' | 'Import PO';
  sourcePrNumber?: string;
  sourceRfqNumber?: string;
  contractRef?: string;
  status: ExtendedPoStatus;
  approvalStatus: ApprovalStatus;
  totalSubtotal: number;
  totalDiscount: number;
  totalTax: number;
  freightAmount: number;
  totalAmount: number;
  receivedAmount: number;
  invoicedAmount: number;
  outstandingAmount: number;
  shippingAddress: string;
  billingAddress: string;
  notes: string;
  specialInstructions: string;
  lines: ExtendedPoLine[];
  grnList: string[]; // GRN IDs
  invoiceList: string[]; // Invoice IDs
  approvals: Array<{
    level: string;
    approver: string;
    status: 'Approved' | 'Pending' | 'Rejected';
    date?: string;
    comment?: string;
  }>;
  activityHistory: Array<{
    date: string;
    event: string;
    by: string;
  }>;
}

// ----------------------------------------------------
// 6. GOODS RECEIPT NOTE (GRN) & INCOMING INSPECTION
// ----------------------------------------------------
export type GrnStatus = 'draft' | 'posted' | 'pending_inspection' | 'accepted' | 'partially_accepted' | 'rejected' | 'returned' | 'closed';

export interface GrnLineItem {
  lineNo: number;
  poLineNo: number;
  itemCode: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  uom: string;
  lotBatchNumber: string;
  mfgDate: string;
  expiryDate: string;
  coaReference: string;
  binLocation: string;
  quarantineBin: string;
  inspectionRequired: boolean;
  inspectionStatus: 'Pending QC' | 'Passed QC' | 'Failed QC' | 'Waived';
  ncrNumber?: string;
  qcParameters?: Array<{
    testName: string; // e.g. MFI Test, Density, Moisture %
    target: string;
    actual: string;
    passed: boolean;
  }>;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  receiptDate: string;
  warehouse: string;
  receivingDock: string;
  deliveryChallanNo: string;
  vehicleNumber: string;
  transporterName: string;
  packingSlipRef: string;
  invoiceRef?: string;
  status: GrnStatus;
  inspectionStatus: 'Pending' | 'In Inspection' | 'Approved' | 'Quarantined' | 'Rejected';
  receivedBy: string;
  notes: string;
  lines: GrnLineItem[];
}

// ----------------------------------------------------
// 7. SUPPLIER INVOICES & 3-WAY MATCHING
// ----------------------------------------------------
export type MatchStatus = 'matched' | 'price_variance' | 'qty_variance' | 'no_grn' | 'no_po' | 'missing_approval' | 'blocked' | 'disputed';

export interface ThreeWayMatchLine {
  lineNo: number;
  itemCode: string;
  itemName: string;
  poQty: number;
  poPrice: number;
  poTotal: number;
  grnQty: number;
  grnAcceptedQty: number;
  grnDate: string;
  grnRef: string;
  invoiceQty: number;
  invoicePrice: number;
  invoiceTotal: number;
  qtyVariance: number;
  priceVariance: number;
  variancePct: number;
  status: 'Exact Match' | 'Within Tolerance (≤2%)' | 'Price Variance Warning' | 'Qty Shortage Discrepancy';
}

export interface SupplierInvoiceRecord {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  invoiceDate: string;
  dueDate: string;
  poNumber: string;
  grnNumber: string;
  currency: string;
  exchangeRate: number;
  subtotal: number;
  taxAmount: number;
  freightAmount: number;
  otherCharges: number;
  totalInvoiceAmount: number;
  matchedAmount: number;
  varianceAmount: number;
  matchStatus: MatchStatus;
  approvalStatus: ApprovalStatus;
  paymentStatus: 'Unpaid' | 'Scheduled' | 'Partially Paid' | 'Paid' | 'Hold';
  disputeReason?: string;
  debitNoteRef?: string;
  lines: ThreeWayMatchLine[];
}

// ----------------------------------------------------
// 8. PURCHASE RETURNS (SUPPLIER RMA / DEBIT NOTE)
// ----------------------------------------------------
export type SupplierReturnStatus = 'draft' | 'pending_approval' | 'approved' | 'sent_to_supplier' | 'supplier_acknowledged' | 'credit_note_received' | 'replacement_received' | 'closed' | 'rejected';

export interface SupplierReturnRecord {
  id: string;
  returnNumber: string;
  supplierId: string;
  supplierName: string;
  poNumber: string;
  grnNumber: string;
  itemCode: string;
  itemName: string;
  lotBatchNumber: string;
  returnQty: number;
  uom: string;
  unitPrice: number;
  creditAmount: number;
  returnDate: string;
  reason: 'Quality rejection' | 'Damaged material' | 'Wrong item received' | 'Excess receipt' | 'Expired material' | 'Supplier recall';
  dispositionRequested: 'Credit Note' | 'Replacement' | 'Refund' | 'Repair';
  status: SupplierReturnStatus;
  linkedNcrId?: string;
  debitNoteNumber?: string;
  trackingNumber?: string;
  notes: string;
}

// ----------------------------------------------------
// 9. SUPPLIER CONTRACTS
// ----------------------------------------------------
export type ContractType = 'Pricing Agreement' | 'Volume Contract' | 'Blanket Order' | 'Service Agreement' | 'Logistics Agreement' | 'Quality Agreement' | 'Tooling/Mold Agreement' | 'Subcontracting Agreement';

export interface SupplierContractRecord {
  id: string;
  contractNumber: string;
  supplierId: string;
  supplierName: string;
  title: string;
  contractType: ContractType;
  startDate: string;
  endDate: string;
  renewalDate: string;
  totalCommittedValue: number;
  releasedValue: number;
  remainingValue: number;
  totalCommittedQty?: number;
  releasedQty?: number;
  uom?: string;
  status: 'Active' | 'Expiring Soon (<30 Days)' | 'Expired' | 'Draft' | 'Terminated';
  indexedPricing: boolean;
  indexReference?: string;
  priceRevisionFormula?: string;
  penaltyClauses?: string;
  qualityTerms?: string;
  items: Array<{
    itemCode: string;
    itemName: string;
    contractQty: number;
    unitPrice: number;
    moq: number;
    leadTimeDays: number;
  }>;
}

// ----------------------------------------------------
// 10. MRP PURCHASE SUGGESTIONS & SHORTAGE ALERTS
// ----------------------------------------------------
export interface MrpPurchaseSuggestion {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  requiredDate: string;
  requiredQty: number;
  uom: string;
  availableStock: number;
  reservedStock: number;
  incomingPoQty: number;
  incomingProdQty: number;
  safetyStock: number;
  reorderPoint: number;
  shortageQty: number;
  suggestedOrderQty: number;
  preferredSupplierId: string;
  preferredSupplierName: string;
  leadTimeDays: number;
  estimatedUnitPrice: number;
  estimatedTotalCost: number;
  priority: 'Critical Shortage' | 'High (Production Risk)' | 'Medium (Reorder Point)' | 'Low (Safety Buffer)';
  source: 'Sales Order Demand' | 'Production Work Order' | 'Safety Stock Breach' | 'Forecast Demand';
  linkedWorkOrderId?: string;
  linkedSalesOrderId?: string;
  exceptionAlerts: string[];
  status: 'Open Suggestion' | 'PR Generated' | 'PO Generated' | 'Ignored';
}

// ----------------------------------------------------
// 11. SUPPLIER RISK & COMPLIANCE
// ----------------------------------------------------
export interface SupplierRiskItem {
  id: string;
  supplierId: string;
  supplierName: string;
  riskCategory: 'Quality Risk' | 'Delivery Risk' | 'Financial Risk' | 'Compliance Risk' | 'Regulatory Risk' | 'ESG Risk' | 'Single-Source Risk' | 'Logistics Risk';
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  issueDescription: string;
  impact: string;
  mitigationAction: string;
  owner: string;
  dueDate: string;
  status: 'Open' | 'Mitigating' | 'Resolved' | 'Accepted Exception';
}
