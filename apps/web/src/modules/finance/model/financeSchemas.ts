import { z } from 'zod';
import { Account, JournalEntry } from '@/src/types';

export {
  AccountSchema,
  CreateAccountInputSchema,
  UpdateAccountInputSchema,
  JournalEntryLineSchema,
  JournalEntrySchema,
  CreateJournalEntryInputSchema,
  CostCenterSchema,
  FixedAssetSchema,
} from '@/packages/contracts/finance';

export type {
  AccountContract,
  CreateAccountContract,
  UpdateAccountContract,
  JournalEntryLineContract,
  JournalEntryContract,
  CreateJournalEntryContract,
  CostCenterContract,
  FixedAssetContract,
} from '@/packages/contracts/finance';

export const journalEntryFormSchema = z.object({
  date: z.string().min(1, 'Posting date is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  debitAccount: z.string().min(1, 'Debit account is required'),
  creditAccount: z.string().min(1, 'Credit account is required'),
  amount: z.number().positive('Amount must be greater than zero'),
});

export type JournalEntryFormValues = z.infer<typeof journalEntryFormSchema>;
export type { Account, JournalEntry };
