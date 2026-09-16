// ============================================================================
// UNIFIED OPERATIONS-TO-LEDGER WORKSPACE: DATA TYPES & SCHEMAS
// Based on Manager-Level UI/UX Architecture Specification (Reboot ERP)
// Covers Stock | PO | GRN | QC | Dispatch | Invoice | Ledger Traceability
// ============================================================================

export type LedgerWorkspaceTab =
  | 'controlTower'
  | 'stock'
  | 'purchaseOrder'
  | 'grn'
  | 'qc'
  | 'dispatch'
  | 'invoiceLedger'
  | 'accountingLedger'
  | 'traceability'
  | 'reconciliation'
  | 'exceptions';

export type UserWorkspaceRole =
  | 'finance_manager'
  | 'warehouse_manager'
  | 'purchase_user'
  | 'sales_user'
  | 'quality_user'
  | 'management'
  | 'admin';

export interface GlobalWorkspaceContext {
  entity: string;
  plantId: string;
  period: string;
  currency: string;
  userRole: UserWorkspaceRole;
  savedView: string;
}

// Accounting Impact line definition
export interface AccountingEntryLine {
  id: string;
  lineNo: number;
  accountCode: string;
  accountName: string;
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  debit: number;
  credit: number;
  costCenter?: string;
  taxCode?: string;
  referenceDoc?: string;
}

export interface DocumentAccountingImpact {
  documentType: 'PO' | 'GRN' | 'QC' | 'Stock' | 'Dispatch' | 'Invoice' | 'Payment' | 'Receipt';
  documentNumber: string;
  postingDate: string;
  status: 'Draft' | 'Posted' | 'Pending Approval' | 'Simulated';
  journalEntryNumber?: string;
  costCenter: string;
  taxImpact: number;
  totalDebit: number;
  totalCredit: number;
  lines: AccountingEntryLine[];
}

// Stock / Inventory Ledger
export interface StockOverviewItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: 'Raw Material' | 'Masterbatch' | 'Finished Goods' | 'WIP' | 'Packaging' | 'Additive';
  plant: string;
  store: string;
  location: string;
  batchLot: string;
  uom: string;
  openingQty: number;
  inQty: number;
  outQty: number;
  closingQty: number;
  stockValue: number;
  unitCost: number;
  qualityStatus: 'Available' | 'Quarantine' | 'QC Hold' | 'Rejected' | 'Reserved';
  expiryDate: string;
  reservedQty: number;
  availableQty: number;
  valuationMethod: 'FIFO' | 'Weighted Average' | 'Standard Cost';
}

export interface StockMovementLedgerItem {
  id: string;
  movementId: string;
  dateTime: string;
  itemCode: string;
  itemName: string;
  batchLot: string;
  movementType:
    | 'GRN'
    | 'Purchase Return'
    | 'Sales Dispatch'
    | 'Sales Return'
    | 'Production Issue'
    | 'Production Receipt'
    | 'Transfer In'
    | 'Transfer Out'
    | 'Adjustment'
    | 'Scrap'
    | 'QC Move';
  sourceDocument: string;
  referenceDocument: string;
  inQty: number;
  outQty: number;
  balanceQty: number;
  unitValue: number;
  totalValue: number;
  fromLocation: string;
  toLocation: string;
  accountingImpact: 'Posted' | 'Unposted' | 'Pending';
  journalEntryNo?: string;
  status: 'Completed' | 'Pending Approval' | 'Under Review';
}

// Purchase Order
export interface PoLineItem {
  lineNo: number;
  itemCode: string;
  itemName: string;
  description: string;
  hsnCode: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  taxPct: number;
  taxAmount: number;
  discount: number;
  lineValue: number;
  receivedQty: number;
  invoicedQty: number;
  remainingQty: number;
  status: 'Open' | 'Partially Received' | 'Received' | 'Closed';
}

export interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  poDate: string;
  supplier: string;
  supplierGstin: string;
  currency: string;
  poValue: number;
  openValue: number;
  receivedValue: number;
  invoicedValue: number;
  grnStatus: 'Pending' | 'Partially Received' | 'Fully Received';
  qcStatus: 'Pending Inspection' | 'QC Passed' | 'QC Rejected' | 'Not Required';
  invoiceStatus: 'Uninvoiced' | 'Partially Invoiced' | 'Fully Invoiced';
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  approvalStatus: 'Draft' | 'Pending Approval' | 'Approved' | 'Sent to Supplier' | 'Closed' | 'Cancelled';
  budgetStatus: 'Within Budget' | 'Budget Alert' | 'Exceeded';
  commitmentValue: number;
  lines: PoLineItem[];
  linkedGrns: string[];
  linkedInvoices: string[];
  linkedJournalEntries: string[];
}

// Goods Receipt Note (GRN)
export interface GrnLineItem {
  poLineNo: number;
  itemCode: string;
  itemName: string;
  uom: string;
  orderedQty: number;
  previouslyReceivedQty: number;
  currentReceivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  remainingQty: number;
  lotBatchNumber: string;
  supplierLot: string;
  mfgDate: string;
  expiryDate: string;
  locationCode: string;
  qualityStatus: 'Passed' | 'Under QC' | 'Rejected' | 'Concession';
  coaStatus: 'Verified' | 'Pending' | 'Missing';
  remarks?: string;
}

export interface GrnRecord {
  id: string;
  grnNumber: string;
  grnDate: string;
  poNumber: string;
  supplier: string;
  supplierInvoiceChallan: string;
  supplierInvoiceDate: string;
  vehicleNumber: string;
  gateEntryNumber: string;
  receivingPlant: string;
  receivingStore: string;
  qcMode: 'QC Before Stock Posting' | 'QC After Stock Posting' | 'No QC Required';
  status: 'Draft' | 'Pending QC' | 'Received' | 'Accepted' | 'Rejected' | 'Posted' | 'Closed' | 'Reversed';
  totalReceivedValue: number;
  lines: GrnLineItem[];
  accountingImpact: DocumentAccountingImpact;
  linkedPo: string;
  linkedQcId?: string;
  linkedStockMovement?: string;
  linkedSupplierInvoice?: string;
}

// QC Inspection
export interface QcInspectionRecord {
  id: string;
  inspectionId: string;
  sourceType: 'GRN' | 'Dispatch' | 'Production' | 'Return';
  sourceDocument: string;
  itemCode: string;
  itemName: string;
  batchLot: string;
  entityParty: string; // supplier or customer
  quantity: number;
  sampleQty: number;
  acceptedQty: number;
  rejectedQty: number;
  concessionQty: number;
  inspectionType: 'Incoming Raw Material' | 'In-Process MES' | 'Final Dispatch FG';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Accepted' | 'Rejected' | 'On Hold' | 'Concession Approved';
  inspector: string;
  inspectionDate: string;
  defectReason?: string;
  coaVerification: 'Verified' | 'Pending' | 'Failed';
  msdsVerification: 'Verified' | 'N/A';
  ncrReference?: string;
  capaReference?: string;
  stockStatusBefore: string;
  stockStatusAfter: string;
  ledgerImpactNote: string;
}

// Dispatch / Delivery Note
export interface DispatchLineItem {
  soLineNo: number;
  itemCode: string;
  itemName: string;
  orderedQty: number;
  reservedQty: number;
  dispatchQty: number;
  batchLot: string;
  location: string;
  expiryDate: string;
  qualityStatus: 'Passed' | 'Approved';
  uom: string;
  unitPrice: number;
  totalValue: number;
}

export interface DispatchRecord {
  id: string;
  deliveryNoteNumber: string;
  dispatchDate: string;
  salesOrderNumber: string;
  customer: string;
  plant: string;
  warehouse: string;
  itemCount: number;
  dispatchQty: number;
  packedQty: number;
  vehicleNumber: string;
  gatePassNumber: string;
  invoiceStatus: 'Invoiced' | 'Pending Invoice';
  eInvoiceStatus: 'Generated' | 'Pending' | 'N/A';
  eWayBillStatus: 'Active' | 'Pending' | 'Exempt';
  stockStatus: 'Issued from Stock' | 'Pending Pick';
  accountingStatus: 'COGS Posted' | 'Pending Posting';
  status:
    | 'Draft'
    | 'Reserved'
    | 'Pick List Created'
    | 'Picking'
    | 'Packed'
    | 'Ready for Dispatch'
    | 'Dispatched'
    | 'Delivered'
    | 'POD Received'
    | 'Invoiced'
    | 'Closed';
  lines: DispatchLineItem[];
  accountingImpact: DocumentAccountingImpact;
  linkedInvoice?: string;
  linkedArLedger?: string;
}

// Invoices & Invoice Ledger
export interface InvoiceLineItem {
  lineNo: number;
  itemService: string;
  hsnSac: string;
  quantity: number;
  uom: string;
  rate: number;
  discount: number;
  taxableValue: number;
  taxCode: string;
  taxAmount: number;
  total: number;
  batchLot?: string;
  referenceLine?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: 'Sales Invoice' | 'Purchase Invoice' | 'Credit Note' | 'Debit Note';
  customerSupplier: string;
  entity: string;
  currency: string;
  invoiceValue: number;
  taxAmount: number;
  netAmount: number;
  paidAdjustedAmount: number;
  balanceDue: number;
  dueDate: string;
  agingBucket: 'Current' | '1-30 Days' | '31-60 Days' | '61-90 Days' | '90+ Days';
  sourceDocument: string; // PO, GRN, SO, or DSP
  sourceReference: string;
  accountingStatus: 'Posted' | 'Unposted' | 'Pending Approval';
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  taxStatus: 'GSTR-1 Filed' | 'GSTR-2B Matched' | 'Tax Pending';
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Posted' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Disputed';
  lines: InvoiceLineItem[];
  accountingImpact: DocumentAccountingImpact;
  linkedJournalEntry?: string;
  linkedPayment?: string;
}

export interface InvoiceLedgerRecord extends InvoiceRecord {
  party?: string;
  partyGstin?: string;
  referenceDocument?: string;
  referenceGrn?: string;
  taxableValue?: number;
  totalTax?: number;
  invoiceTotal?: number;
  threeWayMatchStatus?: string;
  irn?: string;
  cgst?: number;
  sgst?: number;
  igst?: number;
  itcEligibility?: string;
}

// AR / AP Sub-Ledger Entry
export interface ArApLedgerEntry {
  id: string;
  date: string;
  subLedgerType: 'AR' | 'AP';
  partyName: string;
  documentType: 'Invoice' | 'Credit Note' | 'Debit Note' | 'Receipt' | 'Payment' | 'Advance' | 'Adjustment' | 'Journal';
  documentNumber: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  currency: string;
  dueDate: string;
  agingDays: number;
  status: 'Open' | 'Partially Settled' | 'Settled' | 'Disputed';
  linkedSourceDoc: string;
  linkedJournalEntry: string;
}

// Accounting Ledger & Trial Balance
export interface JournalEntryLine {
  lineNo: number;
  accountCode: string;
  accountName: string;
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  debit: number;
  credit: number;
  costCenter: string;
  plant?: string;
  batchLot?: string;
  itemCode?: string;
  description: string;
}

export interface JournalEntryItem {
  id: string;
  jeNumber: string;
  postingDate: string;
  documentDate: string;
  sourceModule: string;
  sourceDocNumber: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  approvedBy: string;
  lines: JournalEntryLine[];
}

export interface AccountStatementItem {
  id: string;
  date: string;
  journalNumber: string;
  description: string;
  reference: string;
  sourceModule: 'PO' | 'GRN' | 'QC' | 'Stock' | 'Dispatch' | 'Invoice' | 'Payment' | 'General Ledger';
  sourceDocument: string;
  debit: number;
  credit: number;
  balance: number;
  currency: string;
  costCenter: string;
  status: 'Posted' | 'Reversed' | 'Pending';
  reconciliationStatus: 'Reconciled' | 'Unreconciled';
}

// Universal Transaction Register
export interface UniversalTransaction {
  id: string;
  transactionId: string;
  dateTime: string;
  module: 'PO' | 'GRN' | 'QC' | 'Stock' | 'Dispatch' | 'Invoice' | 'Receipt' | 'Payment' | 'Journal';
  documentType: string;
  documentNumber: string;
  sourceDocument: string;
  itemAccount: string;
  customerSupplier: string;
  batchLot?: string;
  quantity?: number;
  uom?: string;
  amount: number;
  currency: string;
  debit?: number;
  credit?: number;
  status: string;
  accountingStatus: 'Posted' | 'Simulated' | 'Unposted' | 'N/A';
  traceChain: string[];
}

// End-to-End Lineage Node
export interface LineageNode {
  id: string;
  type: 'PO' | 'GRN' | 'QC' | 'Stock' | 'Dispatch' | 'Invoice' | 'Journal' | 'Payment' | 'Bank';
  title: string;
  docNumber: string;
  documentNumber?: string;
  date: string;
  amountOrQty: string;
  amount?: number;
  party?: string;
  status: string;
  statusColor: 'green' | 'amber' | 'blue' | 'purple' | 'red';
  partyOrItem: string;
  accountingImpact: string;
  details?: Record<string, string | number>;
  hasFlag?: 'none' | 'amber' | 'red';
  flagMessage?: string;
}

export interface LineageEdge {
  from: string;
  to: string;
  label?: string;
  isBroken?: boolean;
}

export interface ReconciliationRuleItem {
  id: string;
  reconType: string;
  description: string;
  tolerance: string;
  varianceAmount: number;
  lastRunTime: string;
  status: 'Reconciled' | 'Pending Review' | 'Action Needed' | 'Matched';
}

// Reconciliation Item
export interface ReconciliationItem {
  id: string;
  reconType:
    | 'GRN to Invoice'
    | 'Invoice to Payment'
    | 'Dispatch to Invoice'
    | 'Stock Ledger to GL'
    | 'AR Sub-Ledger to GL'
    | 'AP Sub-Ledger to GL'
    | 'Bank Ledger to Statement'
    | 'Tax Ledger to GSTR';
  sourceDocNumber: string;
  sourceType: string;
  sourceAmount: number;
  sourceQty?: number;
  targetDocNumber: string;
  targetType: string;
  targetAmount: number;
  targetQty?: number;
  variance: number;
  status: 'Matched' | 'Unmatched' | 'Partial' | 'Approved Variance';
  matchType: 'Automatic (100%)' | 'Tolerance Within 1%' | 'Manual Force' | 'Unmatched';
  matchedBy?: string;
  matchedDate?: string;
  agingDays: number;
}

// Exception Item
export interface ExceptionItem {
  id: string;
  exceptionId: string;
  date: string;
  module: 'PO' | 'GRN' | 'QC' | 'Stock' | 'Dispatch' | 'Invoice' | 'AP/AR' | 'General Ledger';
  category:
    | 'PO without GRN'
    | 'GRN without Invoice'
    | 'Invoice without GRN'
    | 'Dispatch without Invoice'
    | 'Stock movement without journal'
    | 'Journal in closed period'
    | 'Negative stock'
    | 'QC rejected stock not returned'
    | 'Invoice mismatch'
    | 'Tax mismatch'
    | 'Payment unallocated'
    | 'Advance unapplied'
    | 'Missing approval'
    | 'Reconciliation difference';
  documentNumber: string;
  entity: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  financialImpact: number;
  assignedTo: string;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Overridden';
  resolution?: string;
}
