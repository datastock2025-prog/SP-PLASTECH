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
      code: acc.code || `ACC-${Date.now().toString().slice(-4)}`,
      name: acc.name || 'New General Account',
      type: acc.type || 'Asset',
      sub: acc.sub || 'Current Assets',
      parent: acc.parent || null,
      balance: acc.balance || 0,
      currency: acc.currency || 'INR',
      tax: acc.tax ?? false,
      cc: acc.cc ?? false,
      status: acc.status || 'active',
    };
    try {
      await db.upsert('accounts', newAcc, 'code');
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
      ref: 'Manual Journal Entry',
      memo: data.description,
      currency: 'INR',
      status: 'posted',
      createdBy: 'Finance Admin',
      approvedBy: 'Finance Controller',
      lines: [
        { account: data.debitAccount, desc: data.description, debit: data.amount, credit: 0, cc: 'CC-01', tax: 'GST-18' },
        { account: data.creditAccount, desc: data.description, debit: 0, credit: data.amount, cc: 'CC-01', tax: 'GST-18' },
      ],
    };
    try {
      await db.upsert('journal_entries', newJE, 'id');
    } catch {}
    return newJE;
  },
};
