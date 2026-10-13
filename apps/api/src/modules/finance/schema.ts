import { z } from 'zod';

export const CreateAccountInputSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']).default('Asset'),
  category: z.string().trim().default('Current Assets'),
  currency: z.string().trim().default('INR'),
});

export const UpdateAccountInputSchema = CreateAccountInputSchema.partial().extend({
  active: z.boolean().optional(),
  version: z.number().int().min(1),
});

export const CreateJournalEntryInputSchema = z.object({
  date: z.string().trim().min(1),
  description: z.string().trim().min(5),
  lines: z.array(
    z.object({
      accountId: z.string().trim().min(1),
      debit: z.number().min(0).default(0),
      credit: z.number().min(0).default(0),
    })
  ).min(2),
});
