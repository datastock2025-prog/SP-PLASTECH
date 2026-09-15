// Enterprise Finance Models & Types
// Covers Journal Entry, Ledger, AP 3-Way Match, AR & Collections, Advance Check & Audit

export type FinanceRole =
  | 'Finance Manager'
  | 'AP Accountant'
  | 'AR Accountant'
  | 'Collection Agent'
  | 'Controller/CFO'
  | 'Auditor'
  | 'Admin';

// STEP-22: Status Architecture & Colors
// Gray = Draft/Not Started
// Amber = Pending/Warning/Variance
// Green = Posted/Paid/Matched/Completed
// Blue = In Progress/Allocated
// Red = Rejected/Overdue/Blocked/Variance
// Purple = Manual Override/Dispute

export type JournalEntryStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Posted'
  | 'Reversed'
  | 'Rejected'
  | 'Error';

export type JournalType =
  | 'Standard'
  | 'Adjustment'
  | 'Reversal'
  | 'Recurring'
  | 'Intercompany'
  | 'Tax'
  | 'Payroll'
  | 'Depreciation'
  | 'Accrual'
  | 'Provision'
  | 'Opening Balance'
  | 'Module-generated';

export type LedgerEntryStatus =
  | 'Unposted'
  | 'Posted'
  | 'Reversed'
  | 'Partially Reconciled'
  | 'Reconciled';

export type SupplierInvoiceStatus =
  | 'Draft'
  | 'Pending Match'
  | 'Auto-Matched'
  | 'Manual Review'
  | 'Variance'
  | 'Pending Approval'
  | 'Approved'
  | 'Posted'
  | 'Paid'
  | 'Partially Paid'
  | 'Disputed'
  | 'On Hold'
  | 'Rejected';

export type ThreeWayMatchStatus =
  | 'Not Started'
  | 'Auto-Matched'
  | 'Partially Matched'
  | 'Matched'
  | 'Variance'
  | 'Exception'
  | 'Manually Overridden'
  | 'Blocked';

export type CustomerInvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Disputed'
  | 'Credit Note Issued'
  | 'Advance Adjusted'
  | 'Written Off'
  | 'Closed';

export type ReceiptStatus =
  | 'Draft'
  | 'Posted'
  | 'Reconciled'
  | 'Unreconciled'
  | 'Reversed';

export type AdvanceStatus =
  | 'Unallocated'
  | 'Partially Allocated'
  | 'Fully Allocated'
  | 'On Hold'
  | 'Refunded'
  | 'Expired';

export type AdvanceCheckBadge =
  | 'No Advance'
  | 'Advance Available'
  | 'Partially Used'
  | 'Fully Used'
  | 'Advance Exceeded';

export type AdvanceType =
  | 'General Advance'
  | 'Order-Specific Advance'
  | 'Project Advance'
  | 'Proforma Advance';

export type ApExceptionType =
  | 'Missing PO'
  | 'Missing GRN'
  | 'Price variance'
  | 'Quantity variance'
  | 'Tax mismatch'
  | 'Duplicate invoice'
  | 'Supplier mismatch'
  | 'Currency mismatch'
  | 'Invoice amount mismatch'
  | 'Expired PO'
  | 'Blocked supplier'
  | 'Quality-hold GRN';

// STEP-24: Audit & Compliance
export interface AuditRecord {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  role: FinanceRole;
  field?: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
  sourceDoc?: string;
  ipAddress?: string;
}

// STEP-3: Journal Entry Lines
export interface JournalLineItem {
  lineNo: number;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  currency: string;
  exchangeRate: number;
  taxCode: string;
  costCenter: string;
  department: string;
  project?: string;
  intercompanyEntity?: string;
  reference?: string;
  hasAttachment?: boolean;
  status: 'Valid' | 'Warning' | 'Error';
}

// STEP-3 & STEP-4: Full Journal Entry
export interface EnterpriseJournalEntry {
  jeNumber: string;
  postingDate: string;
  period: string;
  journalType: JournalType;
  entity: string;
  currency: string;
  exchangeRate: number;
  description: string;
  referenceDocument?: string;
  sourceModule: string;
  costCenter: string;
  department: string;
  project?: string;
  isReversal: boolean;
  reverseOnDate?: string;
  attachmentRequired: boolean;
  status: JournalEntryStatus;
  lines: JournalLineItem[];
  totalDebit: number;
  totalCredit: number;
  balanceDifference: number;
  isBalanced: boolean;
  attachments: Array<{ name: string; size: string; type: string; url?: string }>;
  approvalWorkflow: {
    stage: 'Draft' | 'Submitted' | 'Manager Review' | 'CFO Review' | 'Approved' | 'Posted';
    approverName: string;
    approverRole: string;
    approvalLimit: number;
    submitDate: string;
    dueDate: string;
    comments: string[];
    timeline: Array<{ stage: string; timestamp: string; user: string; status: 'done' | 'active' | 'pending' }>;
    plImpact: number;
    balanceSheetImpact: number;
    affectsClosedPeriod: boolean;
  };
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  approvedBy?: string;
  postedBy?: string;
  auditTrail: AuditRecord[];
}

// STEP-5 & STEP-6: Ledger Models
export interface LedgerTransaction {
  id: string;
  date: string;
  jeNumber: string;
  description: string;
  reference: string;
  sourceDocument: string;
  sourceType: 'Invoice' | 'GRN' | 'Payment' | 'Payroll' | 'Manual JE';
  debit: number;
  credit: number;
  runningBalance: number;
  currency: string;
  costCenter: string;
  department?: string;
  status: LedgerEntryStatus;
  isPosted: boolean;
  hasSourceDoc: boolean;
  subLedgerParty?: string;
  subLedgerType?: 'Customer' | 'Supplier' | 'Account';
  reconciliationStatus?: 'Reconciled' | 'Pending' | 'Unmatched';
}

export interface ChartOfAccountDetail {
  accountCode: string;
  accountName: string;
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  parentAccount?: string;
  currency: string;
  status: 'Active' | 'Inactive';
  taxRelevance: boolean;
  costCenterEnabled: boolean;
  reconciliationRequired: boolean;
  currentBalance: number;
  ptdActivity: number;
  ytdActivity: number;
  budgetVsActual: { budget: number; actual: number; variance: number };
  lastReconciliationDate: string;
  openItemsCount: number;
  relatedCostCenters: string[];
  subLedgerBreakdown?: Array<{ partyName: string; openAmount: number; current: number; aging30: number; aging60: number; aging90Plus: number }>;
  settings: {
    classification: string;
    postingRules: string[];
    allowedTransactionTypes: string[];
    mandatoryFields: string[];
  };
}

// STEP-8 & STEP-9: AP Supplier Invoice
export interface EnterpriseSupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  supplierGstin?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  exchangeRate: number;
  entity: string;
  paymentTerms: string;
  paymentMethod: string;
  supplierBankAccount: string;
  taxInvoiceNumber: string;
  totalInvoiceAmount: number;
  taxAmount: number;
  freightAmount: number;
  otherCharges: number;
  matchedAmount: number;
  varianceAmount: number;
  poReference?: string;
  grnReference?: string;
  matchStatus: ThreeWayMatchStatus;
  approvalStatus: 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'On Hold';
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Scheduled';
  status: SupplierInvoiceStatus;
  ocrConfidence?: number;
  ocrExtracted?: boolean;
  attachments: string[];
  lineItems: Array<{
    lineNo: number;
    itemCode: string;
    description: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    taxCode: string;
    costCenter: string;
    glAccount: string;
    poLineRef?: number;
    grnLineRef?: number;
    amount: number;
  }>;
  auditTrail: AuditRecord[];
}

// STEP-13: 3-Way Match Workspace Detail
export interface ThreeWayMatchRecord {
  invoiceId: string;
  invoiceNumber: string;
  supplier: string;
  invoiceDate: string;
  invoiceAmount: number;
  matchStatus: ThreeWayMatchStatus;
  isAutoMode: boolean;
  toleranceStatus: 'Within Tolerance' | 'Exceeded Tolerance' | 'No Variance';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | 'Manual Override';
  
  po: {
    poNumber: string;
    poDate: string;
    supplier: string;
    currency: string;
    paymentTerms: string;
    status: string;
    lines: Array<{
      lineNo: number;
      item: string;
      description: string;
      poQty: number;
      uom: string;
      poUnitPrice: number;
      tax: number;
      lineTotal: number;
    }>;
  };

  grn: {
    grnNumber: string;
    grnDate: string;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    batchLot: string;
    warehouse: string;
    inspector: string;
    status: string;
  };

  invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    invoiceQty: number;
    invoiceUnitPrice: number;
    tax: number;
    charges: number;
    lineTotal: number;
    status: string;
  };

  linesComparison: Array<{
    matched: boolean;
    poLineNo: number;
    item: string;
    poQty: number;
    grnQty: number;
    invoiceQty: number;
    qtyVariance: number;
    poPrice: number;
    invoicePrice: number;
    priceVariance: number;
    taxVariance: number;
    status: 'Matched' | 'Partial' | 'Mismatch' | 'Unmatched' | 'Manual Override';
    varianceReason?: string;
    toleranceOverrideApproved?: boolean;
  }>;
}

// STEP-14: AP Exceptions
export interface ApExceptionRecord {
  exceptionId: string;
  invoiceNumber: string;
  supplier: string;
  exceptionType: ApExceptionType;
  poReference?: string;
  grnReference?: string;
  varianceAmount: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  assignedTo: string;
  status: 'Open' | 'In Review' | 'Resolved' | 'Escalated' | 'Approved Variance';
  notes?: string;
  createdAt: string;
  auditTrail: AuditRecord[];
}

// STEP-16: Customer Invoice
export interface EnterpriseCustomerInvoice {
  invoiceNumber: string;
  customer: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  paymentTerms: string;
  salesOrderRef?: string;
  deliveryNoteRef?: string;
  invoiceAmount: number;
  advanceApplied: number;
  paidAmount: number;
  balanceDue: number;
  agingDays: number;
  agingBucket: 'Current' | '1-30' | '31-60' | '61-90' | '90+';
  collectionStatus: 'Normal' | 'Follow-up Required' | 'Promise to Pay' | 'Disputed' | 'Escalated';
  disputeStatus?: 'None' | 'Under Investigation' | 'Pricing Dispute' | 'Quality Issue' | 'Resolved';
  status: CustomerInvoiceStatus;
  collectionAgent: string;
  auditTrail: AuditRecord[];
}

// STEP-17: AR Collection Workbench Models
export interface CustomerCollectionProfile {
  customerCode: string;
  customerName: string;
  totalOutstanding: number;
  overdueAmount: number;
  agingBucket: 'Current' | '1-30' | '31-60' | '61-90' | '90+';
  creditLimit: number;
  creditLimitUsed: number;
  creditLimitPct: number;
  advanceAvailable: number;
  lastContactDate: string;
  promiseDate?: string;
  promisedAmount?: number;
  hasBrokenPromise?: boolean;
  riskRating: 'Low' | 'Moderate' | 'High' | 'Critical';
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  openInvoicesCount: number;
  unappliedReceiptsCount: number;
  activeDisputesCount: number;
  nextAction: string;
  collectionNotes: string[];
  communicationHistory: Array<{
    date: string;
    type: 'Call' | 'Email' | 'Meeting' | 'Statement' | 'Dispute';
    agent: string;
    summary: string;
    outcome: string;
  }>;
}

// STEP-18, 19, 20, 21: Advance Models
export interface CustomerAdvanceRecord {
  receiptNumber: string;
  receiptDate: string;
  customerCode: string;
  customerName: string;
  paymentMethod: 'Bank Wire' | 'NEFT/RTGS' | 'Cheque' | 'Credit Card' | 'Letter of Credit';
  bankAccount: string;
  currency: string;
  exchangeRate: number;
  amountReceived: number;
  advanceType: AdvanceType;
  referenceSalesOrder?: string;
  referenceProforma?: string;
  remarks: string;
  availableBalance: number;
  allocatedAmount: number;
  refundedAmount: number;
  status: AdvanceStatus;
  allocations: Array<{
    invoiceOrSoNumber: string;
    allocationAmount: number;
    allocationDate: string;
    allocatedBy: string;
  }>;
  auditTrail: AuditRecord[];
}

export interface AdvanceCheckData {
  customerCode: string;
  customerName: string;
  totalAdvanceReceived: number;
  advanceAlreadyAllocated: number;
  availableAdvanceBalance: number;
  orderSpecificAdvance: number;
  generalAdvance: number;
  currentDocumentAmount: number;
  recommendedAdvanceToApply: number;
  remainingPayableAfterAdvance: number;
  creditLimitAvailable: number;
  advanceStatusBadge: AdvanceCheckBadge;
  isOnHold?: boolean;
  holdReason?: string;
  hasOverdueInvoices?: boolean;
}
