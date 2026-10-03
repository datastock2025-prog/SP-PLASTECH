import { Account, JournalEntry } from '../../../types';
import { liveDataStore } from '../../../services/liveDataStore';

export const financeApi = {
  getAccounts: async (): Promise<Account[]> => {
    return await liveDataStore.getAccounts();
  },

  getJournalEntries: async (): Promise<JournalEntry[]> => {
    return await liveDataStore.getJournalEntries();
  },
};

