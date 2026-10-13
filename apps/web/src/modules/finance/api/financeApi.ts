import { db } from '@/src/shared/db';
import { Account, JournalEntry } from '@/src/types';
import { initialAccounts } from '@/src/data/initialData';
import { JournalEntryFormValues } from '../model/financeSchemas';

export const financeApi = {
  getAccounts: async (): Promise<Account[]> => {
    try {
      const data = await db.findMany<Account>('accounts');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return initialAccounts as any;
  },

  createAccount: async (acc: Partial<Account>): Promise<Account> => {
    const newAcc: Account = {
      id: acc.id || `ACC-${Date.now().toString().slice(-4)}`,
      code: acc.code || '1000',
      name: acc.name || 'New General Account',
      type: acc.type || 'Asset',
      category: acc.category || 'Current Assets',
      balance: acc.balance || 0,
      currency: acc.currency || 'INR',
    };
    try {
      await db.upsert('accounts', newAcc, 'id');
    } catch {}
    return newAcc;
  },

  getJournalEntries: async (): Promise<JournalEntry[]> => {
    try {
      const data = await db.findMany<JournalEntry>('journal_entries');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return [];
  },

  createJournalEntry: async (data: JournalEntryFormValues): Promise<JournalEntry> => {
    const newJE: JournalEntry = {
      id: `JE-${Date.now().toString().slice(-4)}`,
      date: data.date,
      description: data.description,
      lines: [
        { account: data.debitAccount, debit: data.amount, credit: 0 },
        { account: data.creditAccount, debit: 0, credit: data.amount },
      ],
      posted: true,
      reference: 'Manual Journal Entry',
    };
    try {
      await db.upsert('journal_entries', newJE, 'id');
    } catch {}
    return newJE;
  },
};
