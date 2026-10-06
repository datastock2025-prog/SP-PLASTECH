import { Account, JournalEntry } from '../../../types';
import { db } from '../../../shared/db';
import { initialAccounts, initialJournalEntries } from '../../../data/initialData';

export const financeApi = {
  getAccounts: async (): Promise<Account[]> => {
    try {
      const data = await db.findMany<Account>('accounts');
      return data && data.length > 0 ? data : initialAccounts;
    } catch {
      return initialAccounts;
    }
  },

  getJournalEntries: async (): Promise<JournalEntry[]> => {
    try {
      const data = await db.findMany<JournalEntry>('journal_entries');
      return data && data.length > 0 ? data : initialJournalEntries;
    } catch {
      return initialJournalEntries;
    }
  },
};


