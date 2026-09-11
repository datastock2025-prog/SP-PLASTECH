import { apiClient } from '../../../shared/api/client';
import { Account, JournalEntry } from '../../../types';
import { initialAccounts, initialJournalEntries } from '../../../data/initialData';

export const financeApi = {
  getAccounts: async (): Promise<Account[]> => {
    try {
      const response = await apiClient.get<Account[]>('/finance/accounts');
      return response.data;
    } catch {
      return initialAccounts;
    }
  },

  getJournalEntries: async (): Promise<JournalEntry[]> => {
    try {
      const response = await apiClient.get<JournalEntry[]>('/finance/journal-entries');
      return response.data;
    } catch {
      return initialJournalEntries;
    }
  },
};
