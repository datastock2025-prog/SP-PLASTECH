import { z } from 'zod';
import { Account, JournalEntry } from '../../../types';

export const journalEntrySchema = z.object({
  date: z.string().min(1, 'Posting date is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  debitAccount: z.string().min(1, 'Debit account is required'),
  creditAccount: z.string().min(1, 'Credit account is required'),
  amount: z.number().positive('Amount must be greater than zero'),
});

export type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;
export type { Account, JournalEntry };
