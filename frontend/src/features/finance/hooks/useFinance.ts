import { useQuery } from '@tanstack/react-query';
import { Account, JournalEntry } from '../../../types';
import { initialAccounts, initialJournalEntries } from '../../../data/initialData';
import { db } from '../../../shared/db';

export const ACCOUNTS_QUERY_KEY = ['finance', 'accounts'];
export const JOURNAL_QUERY_KEY = ['finance', 'journalEntries'];

export function useFinance() {
  const { data: accounts = [], isLoading: isAccountsLoading } = useQuery<Account[]>({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await db.findMany<Account>('accounts');
        return data && data.length > 0 ? data : initialAccounts;
      } catch {
        return initialAccounts;
      }
    },
  });

  const { data: journalEntries = [], isLoading: isJournalLoading } = useQuery<JournalEntry[]>({
    queryKey: JOURNAL_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await db.findMany<JournalEntry>('journal_entries');
        return data && data.length > 0 ? data : initialJournalEntries;
      } catch {
        return initialJournalEntries;
      }
    },
  });

  return {
    accounts,
    journalEntries,
    isLoading: isAccountsLoading || isJournalLoading,
  };
}
