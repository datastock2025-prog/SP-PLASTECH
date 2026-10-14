import { z } from 'zod';

export const AccountSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']).default('Asset'),
  category: z.string().default('Current Assets'),
  balance: z.number().default(0),
  currency: z.string().default('INR'),
  active: z.boolean().default(true),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateAccountInputSchema = AccountSchema.omit({ id: true });
export const UpdateAccountInputSchema = AccountSchema.partial().extend({
  version: z.number().int().min(1),
});

export const JournalEntryLineSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  description: z.string().optional().default(''),
});

export const JournalEntrySchema = z.object({
  id: z.string().optional(),
  entryNumber: z.string().min(1, 'Entry number is required'),
  date: z.string().min(1, 'Posting date is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  lines: z.array(JournalEntryLineSchema).min(2, 'Journal entry requires at least 2 lines'),
  status: z.enum(['draft', 'posted', 'void']).default('posted'),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateJournalEntryInputSchema = JournalEntrySchema.omit({ id: true });

export const CostCenterSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Cost center code is required'),
  name: z.string().min(1, 'Cost center name is required'),
  department: z.string().default('Production'),
  budget: z.number().min(0).default(0),
});

export const FixedAssetSchema = z.object({
  id: z.string().optional(),
  assetCode: z.string().min(1, 'Asset code is required'),
  name: z.string().min(1, 'Asset name is required'),
  category: z.string().default('Machinery'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  cost: z.number().positive('Cost must be positive'),
  depreciationRate: z.number().min(0).max(100).default(15),
});

export type AccountContract = z.infer<typeof AccountSchema>;
export type CreateAccountContract = z.infer<typeof CreateAccountInputSchema>;
export type UpdateAccountContract = z.infer<typeof UpdateAccountInputSchema>;
export type JournalEntryLineContract = z.infer<typeof JournalEntryLineSchema>;
export type JournalEntryContract = z.infer<typeof JournalEntrySchema>;
export type CreateJournalEntryContract = z.infer<typeof CreateJournalEntryInputSchema>;
export type CostCenterContract = z.infer<typeof CostCenterSchema>;
export type FixedAssetContract = z.infer<typeof FixedAssetSchema>;
