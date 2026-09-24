import { z } from 'zod';

// ============================================================================
// DTOs for Module-8: Procurement & Sourcing (All 12 Screens)
// ============================================================================

// ----------------------------------------------------------------------------
// Screen 1: Supplier Directory
// ----------------------------------------------------------------------------
export const SupplierTypeEnum = z.enum([
  'MANUFACTURER',
  'DISTRIBUTOR',
  'TRADER',
  'SERVICE_PROVIDER',
  'CONTRACTOR',
]);

export const SupplierStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'BLACKLISTED',
]);

export const CreateSupplierDtoSchema = z.object({
  supplierCode: z.string().min(1, 'Supplier code is required'),
  supplierName: z.string().min(1, 'Supplier name is required'),
  legalName: z.string().optional(),
  supplierType: SupplierTypeEnum.default('MANUFACTURER'),
  category: z.string().optional().default('Raw Materials'),
  subCategory: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional().default('India'),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  tan: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankIfsc: z.string().optional(),
  paymentTerms: z.string().optional().default('Net 30'),
  currency: z.string().optional().default('INR'),
  isoCertified: z.boolean().optional().default(false),
  isoCertificate: z.string().optional(),
  msmeRegistered: z.boolean().optional().default(false),
  msmeNumber: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateSupplierDto = z.input<typeof CreateSupplierDtoSchema>;

export const UpdateSupplierDtoSchema = CreateSupplierDtoSchema.partial();
export type UpdateSupplierDto = z.input<typeof UpdateSupplierDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 2: Purchase Requisitions (PR)
// ----------------------------------------------------------------------------
export const PrPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']);
export const PrStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CONVERTED_TO_PO',
  'CANCELLED',
]);

export const PurchaseRequisitionLineDtoSchema = z.object({
  lineNo: z.number().int().positive().optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  uom: z.string().optional().default('PCS'),
  estimatedPrice: z.number().min(0).optional().default(0),
  totalAmount: z.number().min(0).optional().default(0),
  requiredDate: z.string().optional(),
  notes: z.string().optional(),
});
export type PurchaseRequisitionLineDto = z.input<typeof PurchaseRequisitionLineDtoSchema>;

export const CreatePrDtoSchema = z.object({
  prNumber: z.string().optional(),
  prDate: z.string().default(new Date().toISOString().split('T')[0]),
  department: z.string().optional().default('Production'),
  plantId: z.string().optional(),
  priority: PrPriorityEnum.default('MEDIUM'),
  justification: z.string().min(3, 'Justification is required'),
  budgetCode: z.string().optional(),
  currency: z.string().optional().default('INR'),
  lines: z.array(PurchaseRequisitionLineDtoSchema).min(1, 'At least 1 line item is required'),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreatePrDto = z.input<typeof CreatePrDtoSchema>;

export const UpdatePrDtoSchema = CreatePrDtoSchema.partial();
export type UpdatePrDto = z.input<typeof UpdatePrDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 3: Requests for Quotation (RFQ)
// ----------------------------------------------------------------------------
export const RfqStatusEnum = z.enum([
  'DRAFT',
  'PUBLISHED',
  'BIDS_RECEIVED',
  'EVALUATION_IN_PROGRESS',
  'AWARDED',
  'CONVERTED_TO_PO',
  'CANCELLED',
  'EXPIRED',
]);

export const RfqLineDtoSchema = z.object({
  lineNo: z.number().int().positive().optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().positive(),
  uom: z.string().optional().default('PCS'),
  specifications: z.string().optional(),
  requiredDate: z.string().optional(),
});
export type RfqLineDto = z.input<typeof RfqLineDtoSchema>;

export const CreateRfqDtoSchema = z.object({
  rfqNumber: z.string().optional(),
  rfqDate: z.string().default(new Date().toISOString().split('T')[0]),
  prId: z.string().optional(),
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  validUntil: z.string().min(1, 'Valid until date is required'),
  quotationDeadline: z.string().min(1, 'Quotation deadline is required'),
  lines: z.array(RfqLineDtoSchema).min(1, 'At least 1 RFQ line item is required'),
  invitedSupplierIds: z.array(z.string()).optional().default([]),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateRfqDto = z.input<typeof CreateRfqDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 4: RFQ Bid Submissions & Comparison
// ----------------------------------------------------------------------------
export const RfqBidLineDtoSchema = z.object({
  rfqLineId: z.string().optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive('Unit price must be positive'),
  deliveryDays: z.number().int().optional().default(7),
  notes: z.string().optional(),
});
export type RfqBidLineDto = z.input<typeof RfqBidLineDtoSchema>;

export const SubmitBidDtoSchema = z.object({
  rfqId: z.string().min(1, 'RFQ ID is required'),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  validityDays: z.number().int().positive().default(30),
  deliveryDays: z.number().int().optional().default(7),
  paymentTerms: z.string().optional().default('Net 30'),
  notes: z.string().optional(),
  lines: z.array(RfqBidLineDtoSchema).min(1, 'At least 1 bid line is required'),
});
export type SubmitBidDto = z.input<typeof SubmitBidDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 5: Purchase Orders (PO)
// ----------------------------------------------------------------------------
export const PoStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SENT_TO_SUPPLIER',
  'PARTIALLY_RECEIVED',
  'FULLY_RECEIVED',
  'CLOSED',
  'CANCELLED',
  'ON_HOLD',
]);

export const PurchaseOrderLineDtoSchema = z.object({
  lineNo: z.number().int().positive().optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  uom: z.string().optional().default('PCS'),
  unitPrice: z.number().positive('Unit price must be positive'),
  discountPct: z.number().min(0).optional().default(0),
  taxPct: z.number().min(0).optional().default(18),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
});
export type PurchaseOrderLineDto = z.input<typeof PurchaseOrderLineDtoSchema>;

export const CreatePoDtoSchema = z.object({
  poNumber: z.string().optional(),
  poDate: z.string().default(new Date().toISOString().split('T')[0]),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  prId: z.string().optional(),
  rfqId: z.string().optional(),
  contractId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  paymentTerms: z.string().optional().default('Net 30'),
  deliveryTerms: z.enum(['FOB', 'CIF', 'Ex-Works', 'DAP']).default('Ex-Works'),
  deliveryDate: z.string().optional(),
  deliveryAddress: z.string().optional().default('SP-PLASTECH Plant 1, Pune'),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
  lines: z.array(PurchaseOrderLineDtoSchema).min(1, 'At least 1 PO line item is required'),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreatePoDto = z.input<typeof CreatePoDtoSchema>;

export const UpdatePoDtoSchema = CreatePoDtoSchema.partial();
export type UpdatePoDto = z.input<typeof UpdatePoDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 6: Multi-Tier PO Approvals
// ----------------------------------------------------------------------------
export const PoApprovalActionDtoSchema = z.object({
  stageNumber: z.number().int().positive().default(1),
  comments: z.string().optional(),
  reason: z.string().optional(),
  delegateToId: z.string().optional(),
});
export type PoApprovalActionDto = z.input<typeof PoApprovalActionDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 7: Goods Receipts (GRN) & QA Inspection
// ----------------------------------------------------------------------------
export const GrnLineDtoSchema = z.object({
  poLineId: z.string().optional(),
  lineNo: z.number().int().positive().optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  orderedQty: z.number().positive(),
  receivedQty: z.number().positive('Received quantity must be positive'),
  acceptedQty: z.number().min(0).optional(),
  rejectedQty: z.number().min(0).optional().default(0),
  uom: z.string().optional().default('PCS'),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  locationId: z.string().optional().default('BIN-RAW-01'),
  rejectionReason: z.string().optional(),
});
export type GrnLineDto = z.input<typeof GrnLineDtoSchema>;

export const CreateGrnDtoSchema = z.object({
  grnNumber: z.string().optional(),
  grnDate: z.string().default(new Date().toISOString().split('T')[0]),
  poId: z.string().min(1, 'PO ID is required'),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  warehouseId: z.string().optional().default('WH-MAIN-PUNE'),
  vehicleNumber: z.string().optional(),
  lrNumber: z.string().optional(),
  transporter: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(GrnLineDtoSchema).min(1, 'At least 1 receipt line is required'),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateGrnDto = z.input<typeof CreateGrnDtoSchema>;

export const InspectGrnDtoSchema = z.object({
  inspectionStatus: z.enum(['PASSED', 'FAILED', 'PARTIAL']),
  inspectedLines: z.array(
    z.object({
      lineNo: z.number().int().positive(),
      acceptedQty: z.number().min(0),
      rejectedQty: z.number().min(0).default(0),
      rejectionReason: z.string().optional(),
    })
  ).min(1),
  notes: z.string().optional(),
});
export type InspectGrnDto = z.input<typeof InspectGrnDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 8: Vendor Debit Notes & Returns
// ----------------------------------------------------------------------------
export const ReturnReasonEnum = z.enum([
  'DEFECTIVE',
  'WRONG_ITEM',
  'DAMAGED',
  'EXCESS_SUPPLY',
  'QUALITY_ISSUE',
  'OTHER',
]);

export const PurchaseReturnLineDtoSchema = z.object({
  grnLineId: z.string().optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  quantity: z.number().positive(),
  uom: z.string().optional().default('PCS'),
  unitPrice: z.number().positive(),
  reason: z.string().optional(),
});
export type PurchaseReturnLineDto = z.input<typeof PurchaseReturnLineDtoSchema>;

export const CreateReturnDtoSchema = z.object({
  returnNumber: z.string().optional(),
  returnDate: z.string().default(new Date().toISOString().split('T')[0]),
  poId: z.string().optional(),
  grnId: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  returnReason: ReturnReasonEnum.default('QUALITY_ISSUE'),
  notes: z.string().optional(),
  lines: z.array(PurchaseReturnLineDtoSchema).min(1, 'At least 1 return line is required'),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateReturnDto = z.input<typeof CreateReturnDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 9: Supplier Performance Scorecards
// ----------------------------------------------------------------------------
export const CalculatePerformanceDtoSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  period: z.string().min(1, 'Period is required (e.g. 2026-Q3)'),
  year: z.number().int().default(new Date().getFullYear()),
  month: z.number().int().min(1).max(12).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
});
export type CalculatePerformanceDto = z.input<typeof CalculatePerformanceDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 10: Supplier Risk & Compliance
// ----------------------------------------------------------------------------
export const RiskCategoryEnum = z.enum([
  'FINANCIAL',
  'OPERATIONAL',
  'COMPLIANCE',
  'QUALITY',
  'DELIVERY',
  'GEOPOLITICAL',
  'ENVIRONMENTAL',
]);

export const RiskLevelEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const CreateRiskAssessmentDtoSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  assessmentDate: z.string().default(new Date().toISOString().split('T')[0]),
  riskCategory: RiskCategoryEnum.default('QUALITY'),
  riskLevel: RiskLevelEnum.default('LOW'),
  financialRisk: z.number().min(0).max(100).default(10),
  operationalRisk: z.number().min(0).max(100).default(10),
  complianceRisk: z.number().min(0).max(100).default(10),
  qualityRisk: z.number().min(0).max(100).default(10),
  deliveryRisk: z.number().min(0).max(100).default(10),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  nextReviewDate: z.string().optional(),
});
export type CreateRiskAssessmentDto = z.input<typeof CreateRiskAssessmentDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 11: Supplier Contracts & Blanket POs
// ----------------------------------------------------------------------------
export const ContractTypeEnum = z.enum([
  'STANDARD',
  'BLANKET_ORDER',
  'FRAMEWORK_AGREEMENT',
  'RATE_CONTRACT',
  'SERVICE_AGREEMENT',
]);

export const SupplierContractLineDtoSchema = z.object({
  lineNo: z.number().int().positive().optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  quantity: z.number().positive(),
  uom: z.string().optional().default('PCS'),
  unitPrice: z.number().positive(),
  validityFrom: z.string().optional(),
  validityTo: z.string().optional(),
});
export type SupplierContractLineDto = z.input<typeof SupplierContractLineDtoSchema>;

export const CreateContractDtoSchema = z.object({
  contractNumber: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  contractType: ContractTypeEnum.default('BLANKET_ORDER'),
  title: z.string().min(3, 'Contract title is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalValue: z.number().positive(),
  currency: z.string().optional().default('INR'),
  paymentTerms: z.string().optional().default('Net 30'),
  deliveryTerms: z.string().optional().default('Ex-Works'),
  autoRenewal: z.boolean().optional().default(false),
  renewalNoticeDays: z.number().int().optional().default(90),
  lines: z.array(SupplierContractLineDtoSchema).optional().default([]),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreateContractDto = z.input<typeof CreateContractDtoSchema>;

export const CreateBlanketPoDtoSchema = z.object({
  releaseQuantity: z.number().positive('Release quantity must be positive'),
  itemId: z.string().min(1, 'Item ID is required'),
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  deliveryAddress: z.string().optional(),
});
export type CreateBlanketPoDto = z.input<typeof CreateBlanketPoDtoSchema>;

// ----------------------------------------------------------------------------
// Screen 12: Supplier Price Lists
// ----------------------------------------------------------------------------
export const SupplierPriceListItemDtoSchema = z.object({
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  unitPrice: z.number().positive(),
  minQty: z.number().min(1).default(1),
  maxQty: z.number().optional(),
  discountPct: z.number().min(0).optional().default(0),
  validityFrom: z.string().optional(),
  validityTo: z.string().optional(),
});
export type SupplierPriceListItemDto = z.input<typeof SupplierPriceListItemDtoSchema>;

export const CreatePriceListDtoSchema = z.object({
  priceListCode: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  priceListName: z.string().min(1, 'Price list name is required'),
  currency: z.string().optional().default('INR'),
  effectiveFrom: z.string().default(new Date().toISOString().split('T')[0]),
  effectiveTo: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
  items: z.array(SupplierPriceListItemDtoSchema).min(1, 'At least 1 price list item required'),
  customAttributes: z.record(z.string(), z.any()).optional(),
});
export type CreatePriceListDto = z.input<typeof CreatePriceListDtoSchema>;
