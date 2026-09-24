import { z } from 'zod';

// ============================================================================
// DTOs for Module-6: Finance & Accounting (All 14 Screens)
// ============================================================================

// ----------------------------------------------------------------------------
// Screen 3: Chart of Accounts (COA)
// ----------------------------------------------------------------------------
export const AccountTypeEnum = z.enum([
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
  'CONTRA_ASSET',
  'CONTRA_LIABILITY',
]);

export const CreateAccountDtoSchema = z.object({
  accountCode: z.string().min(1, 'Account code is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountType: AccountTypeEnum,
  accountGroup: z.string().optional(),
  accountSubGroup: z.string().optional(),
  parentAccountId: z.string().optional(),
  isPostable: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
  currency: z.string().optional().default('INR'),
  taxCode: z.string().optional(),
  costCenterId: z.string().optional(),
  openingBalance: z.number().optional().default(0),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateAccountDto = z.input<typeof CreateAccountDtoSchema>;

export const UpdateAccountDtoSchema = CreateAccountDtoSchema.partial();
export type UpdateAccountDto = z.input<typeof UpdateAccountDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 4: Journal Entries & General Ledger
// ----------------------------------------------------------------------------
export const JeTypeEnum = z.enum([
  'MANUAL',
  'AUTO_FROM_INVOICE',
  'AUTO_FROM_PAYMENT',
  'AUTO_FROM_GRN',
  'AUTO_FROM_DISPATCH',
  'AUTO_FROM_PRODUCTION',
  'AUTO_FROM_COSTING',
  'REVERSAL',
  'OPENING_BALANCE',
  'ADJUSTMENT',
]);

export const JeStatusEnum = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'POSTED',
  'APPROVED',
  'REVERSED',
  'CANCELLED',
]);

export const JournalEntryLineDtoSchema = z.object({
  lineNo: z.number().int().positive().optional(),
  accountId: z.string().min(1, 'Account ID is required'),
  accountCode: z.string().optional(),
  accountName: z.string().optional(),
  debitAmount: z.number().min(0).default(0),
  creditAmount: z.number().min(0).default(0),
  description: z.string().optional(),
  costCenterId: z.string().optional(),
  projectId: z.string().optional(),
  taxCode: z.string().optional(),
  taxAmount: z.number().min(0).optional().default(0),
  currency: z.string().optional().default('INR'),
  exchangeRate: z.number().positive().optional().default(1),
});
export type JournalEntryLineDto = z.input<typeof JournalEntryLineDtoSchema>;

export const CreateJournalEntryDtoSchema = z.object({
  jeNumber: z.string().optional(),
  jeDate: z.string().default(new Date().toISOString().split('T')[0]),
  period: z.string().optional(),
  fiscalYear: z.number().int().optional().default(new Date().getFullYear()),
  jeType: JeTypeEnum.optional().default('MANUAL'),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  referenceNumber: z.string().optional(),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  currency: z.string().optional().default('INR'),
  exchangeRate: z.number().positive().optional().default(1),
  lines: z.array(JournalEntryLineDtoSchema).min(2, 'Journal entry must contain at least 2 lines'),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateJournalEntryDto = z.input<typeof CreateJournalEntryDtoSchema>;

export const UpdateJournalEntryDtoSchema = CreateJournalEntryDtoSchema.partial();
export type UpdateJournalEntryDto = z.input<typeof UpdateJournalEntryDtoSchema>;

export const ReverseJournalEntryDtoSchema = z.object({
  reason: z.string().min(3, 'Reversal reason is required'),
});
export type ReverseJournalEntryDto = z.input<typeof ReverseJournalEntryDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 1: Operations-to-Ledger Workspace
// ----------------------------------------------------------------------------
export const AutoPostFromOperationsDtoSchema = z.object({
  sourceModule: z.enum(['PURCHASE_GRN', 'SALES_DISPATCH', 'PRODUCTION_ISSUE', 'PAYMENT', 'INVOICE', 'DEPRECIATION']),
  sourceEntityId: z.string().min(1, 'Source entity ID is required'),
  sourceEntityNumber: z.string().min(1, 'Source entity number is required'),
  transactionDate: z.string().default(new Date().toISOString().split('T')[0]),
  amount: z.number().positive(),
  taxAmount: z.number().min(0).optional().default(0),
  customMappings: z.record(z.string(), z.any()).optional(),
});
export type AutoPostFromOperationsDto = z.input<typeof AutoPostFromOperationsDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 5: Accounts Payable & 3-Way Match
// ----------------------------------------------------------------------------
export const ApLineDtoSchema = z.object({
  lineNo: z.number().int().positive().optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  poQty: z.number().optional(),
  grnQty: z.number().optional(),
  invoiceQty: z.number().positive('Invoice quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  totalAmount: z.number().positive(),
  taxPct: z.number().min(0).optional().default(0),
  taxAmount: z.number().min(0).optional().default(0),
  uom: z.string().optional().default('PCS'),
});
export type ApLineDto = z.input<typeof ApLineDtoSchema>;

export const CreateApDtoSchema = z.object({
  apNumber: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  supplierName: z.string().min(1, 'Supplier name is required'),
  poNumber: z.string().optional(),
  poId: z.string().optional(),
  grnNumber: z.string().optional(),
  grnId: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Supplier invoice number is required'),
  invoiceDate: z.string().default(new Date().toISOString().split('T')[0]),
  dueDate: z.string().min(1, 'Due date is required'),
  invoiceAmount: z.number().positive(),
  taxAmount: z.number().min(0).optional().default(0),
  totalAmount: z.number().positive(),
  paymentTerms: z.string().optional().default('Net 30'),
  discountPct: z.number().min(0).optional().default(0),
  discountAmount: z.number().min(0).optional().default(0),
  lines: z.array(ApLineDtoSchema).min(1, 'At least 1 line item is required'),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateApDto = z.input<typeof CreateApDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 6: Accounts Receivable & Collections
// ----------------------------------------------------------------------------
export const ArLineDtoSchema = z.object({
  lineNo: z.number().int().positive().optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  totalAmount: z.number().positive(),
  taxPct: z.number().min(0).optional().default(0),
  taxAmount: z.number().min(0).optional().default(0),
  uom: z.string().optional().default('PCS'),
});
export type ArLineDto = z.input<typeof ArLineDtoSchema>;

export const CreateArDtoSchema = z.object({
  arNumber: z.string().optional(),
  accountId: z.string().min(1, 'Customer Account ID is required'),
  accountName: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceId: z.string().optional(),
  invoiceDate: z.string().default(new Date().toISOString().split('T')[0]),
  dueDate: z.string().min(1, 'Due date is required'),
  invoiceAmount: z.number().positive(),
  taxAmount: z.number().min(0).optional().default(0),
  totalAmount: z.number().positive(),
  paymentTerms: z.string().optional().default('Net 30'),
  discountPct: z.number().min(0).optional().default(0),
  discountAmount: z.number().min(0).optional().default(0),
  lines: z.array(ArLineDtoSchema).optional().default([]),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateArDto = z.input<typeof CreateArDtoSchema>;

export const RecordCollectionDtoSchema = z.object({
  amount: z.number().positive('Collection amount must be positive'),
  collectionDate: z.string().default(new Date().toISOString().split('T')[0]),
  paymentMethod: z.enum(['NEFT', 'RTGS', 'CHEQUE', 'CASH', 'UPI', 'BANK_TRANSFER']).default('NEFT'),
  referenceNumber: z.string().optional(),
  bankAccountId: z.string().optional(),
  notes: z.string().optional(),
});
export type RecordCollectionDto = z.input<typeof RecordCollectionDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 7: Invoicing & Customer Billing
// ----------------------------------------------------------------------------
export const InvoiceLineDtoSchema = z.object({
  lineNo: z.number().int().positive().optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().positive(),
  uom: z.string().optional().default('PCS'),
  unitPrice: z.number().positive(),
  discountPct: z.number().min(0).optional().default(0),
  taxPct: z.number().min(0).optional().default(18),
  taxAmount: z.number().min(0).optional().default(0),
  totalAmount: z.number().positive(),
  hsnSacCode: z.string().optional(),
});
export type InvoiceLineDto = z.input<typeof InvoiceLineDtoSchema>;

export const CreateInvoiceDtoSchema = z.object({
  invoiceNumber: z.string().optional(),
  invoiceType: z.enum(['STANDARD', 'PROFORMA', 'CREDIT_NOTE', 'DEBIT_NOTE', 'RECURRING', 'INTERIM', 'FINAL']).default('STANDARD'),
  accountId: z.string().min(1, 'Account ID is required'),
  accountName: z.string().optional(),
  contactId: z.string().optional(),
  salesOrderId: z.string().optional(),
  deliveryId: z.string().optional(),
  invoiceDate: z.string().default(new Date().toISOString().split('T')[0]),
  dueDate: z.string().min(1, 'Due date is required'),
  period: z.string().optional(),
  fiscalYear: z.number().int().optional().default(new Date().getFullYear()),
  subtotal: z.number().positive(),
  discountPct: z.number().min(0).optional().default(0),
  discountAmount: z.number().min(0).optional().default(0),
  taxPct: z.number().min(0).optional().default(18),
  taxAmount: z.number().min(0).optional().default(0),
  totalAmount: z.number().positive(),
  currency: z.string().optional().default('INR'),
  gstApplicable: z.boolean().optional().default(true),
  gstin: z.string().optional(),
  placeOfSupply: z.string().optional(),
  reverseCharge: z.boolean().optional().default(false),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
  lines: z.array(InvoiceLineDtoSchema).min(1, 'At least 1 invoice line is required'),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateInvoiceDto = z.input<typeof CreateInvoiceDtoSchema>;

export const UpdateInvoiceDtoSchema = CreateInvoiceDtoSchema.partial();
export type UpdateInvoiceDto = z.input<typeof UpdateInvoiceDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 8: Batch Payment Run
// ----------------------------------------------------------------------------
export const CreatePaymentRunDtoSchema = z.object({
  runNumber: z.string().optional(),
  runType: z.enum(['AP_PAYMENT', 'AR_COLLECTION', 'PAYROLL', 'EXPENSE_REIMBURSEMENT']).default('AP_PAYMENT'),
  runDate: z.string().default(new Date().toISOString().split('T')[0]),
  period: z.string().optional(),
  fiscalYear: z.number().int().optional().default(new Date().getFullYear()),
  paymentMethod: z.enum(['NEFT', 'RTGS', 'CHEQUE', 'CASH', 'UPI', 'BANK_TRANSFER']).default('NEFT'),
  bankAccountId: z.string().optional(),
  itemIdsToPay: z.array(z.string()).optional().default([]),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreatePaymentRunDto = z.input<typeof CreatePaymentRunDtoSchema>;

export const CreatePaymentDtoSchema = z.object({
  paymentNumber: z.string().optional(),
  paymentType: z.enum(['OUTGOING', 'INCOMING']),
  paymentDate: z.string().default(new Date().toISOString().split('T')[0]),
  amount: z.number().positive(),
  currency: z.string().optional().default('INR'),
  paymentMethod: z.string().default('NEFT'),
  referenceNumber: z.string().optional(),
  apId: z.string().optional(),
  arId: z.string().optional(),
  paymentRunId: z.string().optional(),
  bankAccountId: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreatePaymentDto = z.input<typeof CreatePaymentDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 9: Product Costing & Standard Margins
// ----------------------------------------------------------------------------
export const CalculateCostDtoSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  costType: z.enum(['STANDARD', 'ACTUAL', 'ESTIMATED', 'SIMULATED']).default('STANDARD'),
  costVersion: z.string().optional().default('v1.0'),
  materialCost: z.number().min(0).default(0),
  laborCost: z.number().min(0).default(0),
  overheadCost: z.number().min(0).default(0),
  machineCost: z.number().min(0).default(0),
  subcontractCost: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  effectiveFrom: z.string().default(new Date().toISOString().split('T')[0]),
  effectiveTo: z.string().optional(),
});
export type CalculateCostDto = z.input<typeof CalculateCostDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 10: Cost Centers & Budgets
// ----------------------------------------------------------------------------
export const CreateCostCenterDtoSchema = z.object({
  costCenterCode: z.string().min(1, 'Cost center code is required'),
  costCenterName: z.string().min(1, 'Cost center name is required'),
  costCenterType: z.enum(['PRODUCTION', 'ADMIN', 'SALES', 'R&D', 'LOGISTICS', 'QUALITY']).default('PRODUCTION'),
  department: z.string().optional(),
  managerId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateCostCenterDto = z.input<typeof CreateCostCenterDtoSchema>;

export const CreateBudgetDtoSchema = z.object({
  budgetNumber: z.string().optional(),
  budgetName: z.string().min(1, 'Budget name is required'),
  fiscalYear: z.number().int().default(new Date().getFullYear()),
  period: z.string().min(1, 'Period is required (e.g. 2026-Q1, 2026-09)'),
  periodType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).default('MONTHLY'),
  costCenterId: z.string().optional(),
  accountId: z.string().optional(),
  budgetAmount: z.number().positive(),
  currency: z.string().optional().default('INR'),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateBudgetDto = z.input<typeof CreateBudgetDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 11: Financial Statements
// ----------------------------------------------------------------------------
export const GenerateStatementsDtoSchema = z.object({
  statementType: z.enum(['PROFIT_AND_LOSS', 'BALANCE_SHEET', 'CASH_FLOW', 'TRIAL_BALANCE']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  period: z.string().optional(),
  fiscalYear: z.number().int().optional().default(new Date().getFullYear()),
  compareWithPreviousPeriod: z.boolean().optional().default(false),
  costCenterId: z.string().optional(),
});
export type GenerateStatementsDto = z.input<typeof GenerateStatementsDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 12: Fixed Asset Register
// ----------------------------------------------------------------------------
export const CreateAssetDtoSchema = z.object({
  assetNumber: z.string().optional(),
  assetName: z.string().min(1, 'Asset name is required'),
  assetCategory: z.enum(['MACHINERY', 'BUILDING', 'VEHICLE', 'COMPUTER', 'FURNITURE', 'MOLD_AND_DIE', 'OTHER']).default('MACHINERY'),
  assetGroupId: z.string().optional(),
  location: z.string().optional(),
  department: z.string().optional(),
  acquisitionDate: z.string().default(new Date().toISOString().split('T')[0]),
  acquisitionCost: z.number().positive(),
  salvageValue: z.number().min(0).optional().default(0),
  usefulLifeYears: z.number().int().positive().default(5),
  depreciationMethod: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION']).default('STRAIGHT_LINE'),
  depreciationRate: z.number().min(0).optional().default(20),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateAssetDto = z.input<typeof CreateAssetDtoSchema>;

export const RunDepreciationDtoSchema = z.object({
  period: z.string().min(1, 'Period is required (e.g. 2026-09)'),
  fiscalYear: z.number().int().default(new Date().getFullYear()),
  assetCategory: z.string().optional(),
  postJournalEntries: z.boolean().optional().default(true),
});
export type RunDepreciationDto = z.input<typeof RunDepreciationDtoSchema>;

export const DisposeAssetDtoSchema = z.object({
  disposalDate: z.string().default(new Date().toISOString().split('T')[0]),
  disposalValue: z.number().min(0).default(0),
  reason: z.string().optional().default('SOLD'),
});
export type DisposeAssetDto = z.input<typeof DisposeAssetDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 13: GST & Tax Workbench
// ----------------------------------------------------------------------------
export const CreateGstReturnDtoSchema = z.object({
  returnNumber: z.string().optional(),
  returnType: z.enum(['GSTR1', 'GSTR2', 'GSTR3B', 'GSTR9', 'GSTR9C']).default('GSTR3B'),
  period: z.string().min(1, 'Period is required (e.g. 2026-09)'),
  fiscalYear: z.number().int().default(new Date().getFullYear()),
  month: z.number().int().min(1).max(12).default(new Date().getMonth() + 1),
  quarter: z.number().int().min(1).max(4).optional(),
  totalSales: z.number().min(0).optional().default(0),
  totalPurchases: z.number().min(0).optional().default(0),
  outputTax: z.number().min(0).optional().default(0),
  inputTax: z.number().min(0).optional().default(0),
  netTaxPayable: z.number().min(0).optional().default(0),
  taxPaid: z.number().min(0).optional().default(0),
  arn: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateGstReturnDto = z.input<typeof CreateGstReturnDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 14: EPR Plastic Waste Credit Exchange
// ----------------------------------------------------------------------------
export const CreateEprCreditDtoSchema = z.object({
  creditNumber: z.string().optional(),
  creditType: z.enum(['PLASTIC_WASTE', 'E_WASTE', 'BATTERY_WASTE', 'TYRE_WASTE', 'OIL_WASTE']).default('PLASTIC_WASTE'),
  period: z.string().min(1, 'Period is required (e.g. 2026-Q3)'),
  fiscalYear: z.number().int().default(new Date().getFullYear()),
  quarter: z.number().int().min(1).max(4).optional(),
  month: z.number().int().min(1).max(12).optional(),
  plasticCategory: z.enum(['PET', 'HDPE', 'LDPE', 'PP', 'PS', 'OTHER']).default('HDPE'),
  quantityKg: z.number().positive(),
  creditValue: z.number().min(0).optional().default(0),
  unitPrice: z.number().min(0).optional().default(0),
  certificateNumber: z.string().optional(),
  issuedBy: z.string().optional().default('CPCB / SPCB Authority'),
  expiryDate: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateEprCreditDto = z.input<typeof CreateEprCreditDtoSchema>;

export const TradeEprCreditDtoSchema = z.object({
  counterparty: z.string().min(1, 'Counterparty name is required'),
  tradeValue: z.number().positive(),
  quantityKg: z.number().positive(),
  tradeDate: z.string().default(new Date().toISOString().split('T')[0]),
});
export type TradeEprCreditDto = z.input<typeof TradeEprCreditDtoSchema>;
