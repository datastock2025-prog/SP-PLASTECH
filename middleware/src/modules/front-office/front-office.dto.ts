import { z } from 'zod';

// ============================================================================
// BASE DTOs & AUDIT MIXINS
// ============================================================================
export const BaseFilterSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc'),
});
export type BaseFilterDto = z.input<typeof BaseFilterSchema>;

// ============================================================================
// CRM SCREEN 1: LEADS & INQUIRIES
// ============================================================================
export const CreateLeadDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  leadNumber: z.string().optional(),
  leadSource: z.enum(['WEBSITE', 'REFERRAL', 'COLD_CALL', 'TRADE_SHOW', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'PARTNER', 'OTHER']).default('WEBSITE'),
  leadType: z.enum(['INQUIRY', 'QUOTE_REQUEST', 'COMPLAINT', 'GENERAL', 'BULK_ORDER']).default('INQUIRY'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  companyName: z.string().optional(),
  contactName: z.string().min(2, 'Contact Name is required'),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  country: z.string().default('India'),
  state: z.string().optional(),
  city: z.string().optional(),
  estimatedValue: z.number().nonnegative().default(0),
  currency: z.string().default('INR'),
  probability: z.number().min(0).max(100).default(10),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST', 'UNQUALIFIED']).default('NEW'),
  assignedToId: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateLeadDto = z.input<typeof CreateLeadDtoSchema>;
export const UpdateLeadDtoSchema = CreateLeadDtoSchema.partial();
export type UpdateLeadDto = z.input<typeof UpdateLeadDtoSchema>;

// ============================================================================
// CRM SCREEN 2: OPPORTUNITIES & SALES PIPELINE
// ============================================================================
export const CreateOpportunityDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  opportunityNumber: z.string().optional(),
  accountId: z.string().min(1, 'Account ID is required'),
  leadId: z.string().optional(),
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  stage: z.enum(['QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).default('QUALIFICATION'),
  probability: z.number().min(0).max(100).default(20),
  estimatedValue: z.number().positive('Estimated value must be positive'),
  currency: z.string().default('INR'),
  expectedCloseDate: z.string().optional(),
  assignedToId: z.string().min(1, 'Assignee is required'),
  competitorInfo: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateOpportunityDto = z.input<typeof CreateOpportunityDtoSchema>;
export const UpdateOpportunityDtoSchema = CreateOpportunityDtoSchema.partial();
export type UpdateOpportunityDto = z.input<typeof UpdateOpportunityDtoSchema>;

export const UpdateStageDtoSchema = z.object({
  stage: z.enum(['QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
  probability: z.number().min(0).max(100).optional(),
  closeReason: z.string().optional(),
});
export type UpdateStageDto = z.input<typeof UpdateStageDtoSchema>;

// ============================================================================
// CRM SCREEN 3: CUSTOMER ACCOUNTS
// ============================================================================
export const CreateAccountDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  accountNumber: z.string().optional(),
  accountName: z.string().min(2, 'Account Name is required'),
  accountType: z.enum(['CUSTOMER', 'PROSPECT', 'PARTNER', 'VENDOR', 'DISTRIBUTOR']).default('CUSTOMER'),
  industry: z.string().default('Plastic Manufacturing / Automotive Tier 1'),
  website: z.string().optional(),
  annualRevenue: z.number().optional(),
  employeeCount: z.number().int().optional(),
  rating: z.enum(['A', 'B', 'C', 'D']).default('B'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED']).default('ACTIVE'),
  parentId: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingCountry: z.string().default('India'),
  billingPincode: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingCountry: z.string().default('India'),
  shippingPincode: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  creditLimit: z.number().nonnegative().default(1000000),
  creditUsed: z.number().nonnegative().default(0),
  paymentTerms: z.string().default('Net 30'),
  assignedToId: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateAccountDto = z.input<typeof CreateAccountDtoSchema>;
export const UpdateAccountDtoSchema = CreateAccountDtoSchema.partial();
export type UpdateAccountDto = z.input<typeof UpdateAccountDtoSchema>;

// ============================================================================
// CRM SCREEN 4: CLIENT CONTACTS
// ============================================================================
export const CreateContactDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  accountId: z.string().min(1, 'Account ID is required'),
  contactNumber: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  designation: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  isPrimary: z.boolean().default(false),
  isDecisionMaker: z.boolean().default(false),
  preferredContact: z.enum(['EMAIL', 'PHONE', 'MOBILE']).default('EMAIL'),
  linkedinUrl: z.string().optional(),
  notes: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateContactDto = z.input<typeof CreateContactDtoSchema>;
export const UpdateContactDtoSchema = CreateContactDtoSchema.partial();
export type UpdateContactDto = z.input<typeof UpdateContactDtoSchema>;

// ============================================================================
// CRM SCREEN 5: COMPLAINTS & CLAIMS (FEEDBACK)
// ============================================================================
export const CreateComplaintDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  complaintNumber: z.string().optional(),
  accountId: z.string().min(1, 'Account ID is required'),
  contactId: z.string().optional(),
  salesOrderId: z.string().optional(),
  complaintType: z.enum(['QUALITY', 'DELIVERY', 'SERVICE', 'BILLING', 'PRODUCT_DEFECT', 'OTHER']).default('QUALITY'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'RESOLVED', 'CLOSED', 'ESCALATED']).default('OPEN'),
  subject: z.string().min(3, 'Subject is required'),
  description: z.string().min(5, 'Description is required'),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateComplaintDto = z.input<typeof CreateComplaintDtoSchema>;

export const ResolveComplaintDtoSchema = z.object({
  resolution: z.string().min(5, 'Resolution details required'),
  status: z.enum(['RESOLVED', 'CLOSED']).default('RESOLVED'),
  refundAmount: z.number().nonnegative().optional(),
});
export type ResolveComplaintDto = z.input<typeof ResolveComplaintDtoSchema>;

// ============================================================================
// SALES SCREEN 8: QUOTATIONS
// ============================================================================
export const QuotationLineDtoSchema = z.object({
  id: z.string().optional(),
  lineNo: z.number().int().default(1),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().positive(),
  uom: z.string().default('PCS'),
  unitPrice: z.number().positive(),
  discountPct: z.number().min(0).max(100).default(0),
  taxPct: z.number().min(0).max(100).default(18),
  totalAmount: z.number().positive(),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
});
export type QuotationLineDto = z.input<typeof QuotationLineDtoSchema>;

export const CreateQuotationDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  quotationNumber: z.string().optional(),
  accountId: z.string().min(1, 'Account ID is required'),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  validFrom: z.string().default(new Date().toISOString()),
  validUntil: z.string().default(new Date(Date.now() + 30 * 86400000).toISOString()),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_CUSTOMER', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED_TO_ORDER']).default('DRAFT'),
  currency: z.string().default('INR'),
  discountPct: z.number().default(0),
  taxPct: z.number().default(18),
  paymentTerms: z.string().default('Net 30 Days'),
  deliveryTerms: z.string().default('Ex-Works Chakan'),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
  lines: z.array(QuotationLineDtoSchema).min(1, 'At least 1 quotation line required'),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateQuotationDto = z.input<typeof CreateQuotationDtoSchema>;

// ============================================================================
// SALES SCREEN 9: SALES ORDERS (REDESIGNED)
// ============================================================================
export const SalesOrderLineDtoSchema = z.object({
  id: z.string().optional(),
  lineNo: z.number().int().default(1),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  description: z.string().optional(),
  bomId: z.string().optional(),
  quantity: z.number().positive(),
  uom: z.string().default('PCS'),
  unitPrice: z.number().positive(),
  discountPct: z.number().min(0).max(100).default(0),
  taxPct: z.number().min(0).max(100).default(18),
  totalAmount: z.number().positive(),
  deliveryDate: z.string().optional(),
  plantId: z.string().optional(),
  warehouseId: z.string().optional(),
  notes: z.string().optional(),
});
export type SalesOrderLineDto = z.input<typeof SalesOrderLineDtoSchema>;

export const CreateSalesOrderDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  orderNumber: z.string().optional(),
  accountId: z.string().min(1, 'Account ID is required'),
  contactId: z.string().optional(),
  quotationId: z.string().optional(),
  orderDate: z.string().default(new Date().toISOString()),
  requiredDate: z.string().default(new Date(Date.now() + 14 * 86400000).toISOString()),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH', 'PARTIALLY_DISPATCHED', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).default('DRAFT'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).default('MEDIUM'),
  plantId: z.string().default('PLANT-01'),
  warehouseId: z.string().default('WH-FG-01'),
  discountPct: z.number().default(0),
  taxPct: z.number().default(18),
  currency: z.string().default('INR'),
  paymentTerms: z.string().default('Net 30'),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPincode: z.string().optional(),
  shippingCountry: z.string().default('India'),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
  lines: z.array(SalesOrderLineDtoSchema).min(1, 'At least 1 order line required'),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateSalesOrderDto = z.input<typeof CreateSalesOrderDtoSchema>;
export const UpdateSalesOrderDtoSchema = CreateSalesOrderDtoSchema.partial();
export type UpdateSalesOrderDto = z.input<typeof UpdateSalesOrderDtoSchema>;

export const CancelOrderDtoSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason required'),
});
export type CancelOrderDto = z.input<typeof CancelOrderDtoSchema>;

// ============================================================================
// SALES SCREEN 10: MONTHLY PLAN ORDERS
// ============================================================================
export const CreateMonthlyPlanDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  planNumber: z.string().optional(),
  monthPeriod: z.string().default('September 2026'),
  year: z.number().int().default(2026),
  month: z.number().int().default(9),
  accountId: z.string().optional(),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  plannedQty: z.number().positive(),
  confirmedQty: z.number().nonnegative().default(0),
  actualQty: z.number().nonnegative().default(0),
  uom: z.string().default('PCS'),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateMonthlyPlanDto = z.input<typeof CreateMonthlyPlanDtoSchema>;

// ============================================================================
// SALES SCREEN 11: DEMAND RECONCILIATION
// ============================================================================
export const CreateReconciliationDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  reconNumber: z.string().optional(),
  monthPeriod: z.string().default('September 2026'),
  year: z.number().int().default(2026),
  month: z.number().int().default(9),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  forecastQty: z.number().positive(),
  actualOrderQty: z.number().nonnegative(),
  actualDeliveryQty: z.number().nonnegative(),
  notes: z.string().optional(),
});
export type CreateReconciliationDto = z.input<typeof CreateReconciliationDtoSchema>;

// ============================================================================
// SALES SCREEN 12: DELIVERIES & DISPATCH (GST/EWB)
// ============================================================================
export const DeliveryLineDtoSchema = z.object({
  id: z.string().optional(),
  orderLineId: z.string().min(1),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().positive(),
  uom: z.string().default('PCS'),
  batchNumber: z.string().optional(),
  serialNumbers: z.array(z.string()).default([]),
  weight: z.number().optional(),
});
export type DeliveryLineDto = z.input<typeof DeliveryLineDtoSchema>;

export const CreateDeliveryDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  deliveryNumber: z.string().optional(),
  orderId: z.string().min(1, 'Sales Order ID is required'),
  deliveryDate: z.string().default(new Date().toISOString()),
  status: z.enum(['PENDING', 'PARTIALLY_DELIVERED', 'DELIVERED', 'RETURNED']).default('PENDING'),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  transporter: z.string().optional(),
  lrNumber: z.string().optional(),
  ewayBillNumber: z.string().optional(),
  ewayBillDate: z.string().optional(),
  gstApplicable: z.boolean().default(true),
  shippingAddress: z.string().default('Plot 42, Hinjewadi Phase 3'),
  shippingCity: z.string().default('Pune'),
  shippingState: z.string().default('Maharashtra'),
  shippingPincode: z.string().default('411057'),
  shippingCountry: z.string().default('India'),
  totalWeight: z.number().optional().default(1250.5),
  totalVolume: z.number().optional().default(4.2),
  notes: z.string().optional(),
  lines: z.array(DeliveryLineDtoSchema).min(1, 'At least 1 delivery line required'),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateDeliveryDto = z.input<typeof CreateDeliveryDtoSchema>;

// ============================================================================
// SALES SCREEN 13: CREDIT CONTROL
// ============================================================================
export const CreditHoldDtoSchema = z.object({
  isOnHold: z.boolean(),
  holdReason: z.string().optional(),
});
export type CreditHoldDto = z.input<typeof CreditHoldDtoSchema>;

// ============================================================================
// SALES SCREEN 14: RETURNS & RMA
// ============================================================================
export const ReturnLineDtoSchema = z.object({
  id: z.string().optional(),
  orderLineId: z.string().optional(),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().positive(),
  uom: z.string().default('PCS'),
  reason: z.string().optional(),
  condition: z.enum(['NEW', 'USED', 'DAMAGED']).default('DAMAGED'),
});
export type ReturnLineDto = z.input<typeof ReturnLineDtoSchema>;

export const CreateReturnDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  rmaNumber: z.string().optional(),
  orderId: z.string().optional(),
  deliveryId: z.string().optional(),
  accountId: z.string().min(1, 'Account ID is required'),
  returnReason: z.enum(['DEFECTIVE', 'WRONG_ITEM', 'DAMAGED_IN_TRANSIT', 'CUSTOMER_REQUEST', 'EXCESS_SUPPLY', 'OTHER']).default('DEFECTIVE'),
  returnStatus: z.enum(['PENDING', 'APPROVED', 'RECEIVED', 'INSPECTED', 'REFUNDED', 'REPLACED', 'REJECTED']).default('PENDING'),
  requestedDate: z.string().default(new Date().toISOString()),
  refundAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  lines: z.array(ReturnLineDtoSchema).default([]),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateReturnDto = z.input<typeof CreateReturnDtoSchema>;

// ============================================================================
// SALES SCREEN 17: PRICING & DISCOUNTS
// ============================================================================
export const PriceListItemDtoSchema = z.object({
  id: z.string().optional(),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  unitPrice: z.number().positive(),
  minQty: z.number().positive().default(1),
  maxQty: z.number().positive().optional(),
  discountPct: z.number().min(0).max(100).default(0),
});
export type PriceListItemDto = z.input<typeof PriceListItemDtoSchema>;

export const CreatePriceListDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  priceListCode: z.string().min(2),
  priceListName: z.string().min(2),
  currency: z.string().default('INR'),
  effectiveFrom: z.string().default(new Date().toISOString()),
  effectiveUntil: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  items: z.array(PriceListItemDtoSchema).default([]),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreatePriceListDto = z.input<typeof CreatePriceListDtoSchema>;

export const CreateDiscountRuleDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  ruleCode: z.string().min(2),
  ruleName: z.string().min(2),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'TIERED', 'BUY_X_GET_Y']).default('PERCENTAGE'),
  discountValue: z.number().positive(),
  applicableTo: z.enum(['ALL', 'CATEGORY', 'ITEM', 'CUSTOMER']).default('ALL'),
  applicableIds: z.array(z.string()).default([]),
  minOrderValue: z.number().optional(),
  maxDiscount: z.number().optional(),
  validFrom: z.string().default(new Date().toISOString()),
  validUntil: z.string().optional(),
  isActive: z.boolean().default(true),
});
export type CreateDiscountRuleDto = z.input<typeof CreateDiscountRuleDtoSchema>;

// ============================================================================
// SALES SCREEN 18: SALES TEAM PERFORMANCE
// ============================================================================
export const CreateSalesPerformanceDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  userId: z.string().min(1),
  period: z.string().default('2026-09'),
  targetAmount: z.number().positive(),
  achievedAmount: z.number().nonnegative().default(0),
  ordersCount: z.number().int().nonnegative().default(0),
  newAccountsCount: z.number().int().nonnegative().default(0),
  commissionEarned: z.number().nonnegative().default(0),
});
export type CreateSalesPerformanceDto = z.input<typeof CreateSalesPerformanceDtoSchema>;

// ============================================================================
// SALES SCREEN 19: CONTRACT MANAGEMENT
// ============================================================================
export const ContractLineDtoSchema = z.object({
  id: z.string().optional(),
  lineNo: z.number().int().default(1),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().positive(),
  uom: z.string().default('PCS'),
  unitPrice: z.number().positive(),
  totalAmount: z.number().positive(),
  deliverySchedule: z.string().optional().default('Monthly'),
});
export type ContractLineDto = z.input<typeof ContractLineDtoSchema>;

export const CreateContractDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  contractNumber: z.string().optional(),
  accountId: z.string().min(1, 'Account ID is required'),
  contractType: z.enum(['ANNUAL', 'MULTI_YEAR', 'PROJECT_BASED', 'FRAMEWORK', 'BLANKET_ORDER']).default('ANNUAL'),
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().default(new Date().toISOString()),
  endDate: z.string().default(new Date(Date.now() + 365 * 86400000).toISOString()),
  totalValue: z.number().positive(),
  currency: z.string().default('INR'),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED']).default('DRAFT'),
  autoRenewal: z.boolean().default(false),
  renewalNoticeDays: z.number().int().default(90),
  termsConditions: z.string().optional(),
  lines: z.array(ContractLineDtoSchema).default([]),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateContractDto = z.input<typeof CreateContractDtoSchema>;

// ============================================================================
// SALES SCREEN 20: EXPORT DOCUMENTATION
// ============================================================================
export const CreateExportDocDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  documentNumber: z.string().optional(),
  orderId: z.string().optional(),
  deliveryId: z.string().optional(),
  documentType: z.enum(['COMMERCIAL_INVOICE', 'PACKING_LIST', 'CERTIFICATE_OF_ORIGIN', 'BILL_OF_LADING', 'AIRWAY_BILL', 'EXPORT_LICENSE', 'INSURANCE_CERTIFICATE']).default('COMMERCIAL_INVOICE'),
  destinationCountry: z.string().default('Germany'),
  destinationPort: z.string().optional().default('Hamburg Port'),
  incoterms: z.string().optional().default('FOB Mumbai'),
  hsCode: z.string().optional().default('3923.10.90'),
  totalValue: z.number().positive(),
  currency: z.string().default('USD'),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SUBMITTED_TO_CUSTOMS', 'CLEARED', 'SHIPPED']).default('DRAFT'),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateExportDocDto = z.input<typeof CreateExportDocDtoSchema>;

// ============================================================================
// SALES SCREEN 22: SALES FORECASTING
// ============================================================================
export const CreateForecastDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  forecastNumber: z.string().optional(),
  period: z.string().default('Q4-2026'),
  periodType: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('QUARTERLY'),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  accountId: z.string().optional(),
  forecastQty: z.number().positive(),
  forecastAmount: z.number().positive(),
  confidenceLevel: z.number().min(0).max(100).default(85),
  method: z.enum(['HISTORICAL', 'AI_ML', 'MANUAL', 'COMBINED']).default('AI_ML'),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateForecastDto = z.input<typeof CreateForecastDtoSchema>;
