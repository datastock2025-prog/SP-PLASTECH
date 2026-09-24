import { z } from 'zod';

export const JournalLineItemSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  accountName: z.string().min(1, 'Account Name is required'),
  debitAmount: z.number().nonnegative('Debit amount must be non-negative'),
  creditAmount: z.number().nonnegative('Credit amount must be non-negative'),
  costCenter: z.string().optional().default('PLANT-01-MOLDING'),
  narration: z.string().optional().default(''),
});
export type JournalLineItem = z.input<typeof JournalLineItemSchema>;

export const PostJournalEntryDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  entryNumber: z.string().optional(),
  entryDate: z.string().default(new Date().toISOString().split('T')[0]),
  voucherType: z.enum(['GENERAL_JOURNAL', 'AP_PURCHASE_VOUCHER', 'AR_SALES_INVOICE', 'PAYMENT', 'RECEIPT', 'CREDIT_NOTE', 'DEBIT_NOTE']),
  referenceDoc: z.string().optional(),
  narration: z.string().min(5, 'Narration required'),
  lines: z.array(JournalLineItemSchema).min(2, 'At least 2 balanced journal lines required'),
  postedByUserId: z.string().min(1, 'User ID required'),
});
export type PostJournalEntryDto = z.input<typeof PostJournalEntryDtoSchema>;

export const CreateVendorInvoiceDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  vendorName: z.string().min(1, 'Vendor Name is required'),
  poNumber: z.string().min(1, 'PO number is required'),
  grnNumber: z.string().min(1, 'GRN number is required'),
  invoiceDate: z.string().default(new Date().toISOString().split('T')[0]),
  dueDate: z.string().min(1, 'Due date is required'),
  baseAmount: z.number().positive(),
  cgstAmount: z.number().nonnegative().default(0),
  sgstAmount: z.number().nonnegative().default(0),
  igstAmount: z.number().nonnegative().default(0),
  tdsDeducted: z.number().nonnegative().default(0),
  totalPayableAmount: z.number().positive(),
});
export type CreateVendorInvoiceDto = z.infer<typeof CreateVendorInvoiceDtoSchema>;

export const ProcessDisbursementDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  invoiceId: z.string().min(1),
  bankAccountId: z.string().default('HDFC-OPERATING-01'),
  paymentMode: z.enum(['NEFT', 'RTGS', 'IMPS', 'INTERNAL_TRANSFER', 'CHEQUE']),
  amountPaid: z.number().positive(),
  authorizationCode: z.string().min(1, 'MFA Authorization Code is required for disbursement'),
  authorizedByUserId: z.string().min(1),
});
export type ProcessDisbursementDto = z.infer<typeof ProcessDisbursementDtoSchema>;
