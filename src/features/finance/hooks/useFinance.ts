import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';
import { Account, JournalEntry } from '../../../types';

export const ACCOUNTS_QUERY_KEY = ['finance', 'accounts'];
export const JOURNAL_QUERY_KEY = ['finance', 'journalEntries'];

export function useFinance() {
  const { data: accounts = [], isLoading: isAccountsLoading } = useQuery<Account[]>({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: () => financeApi.getAccounts(),
  });

  const { data: journalEntries = [], isLoading: isJournalLoading } = useQuery<JournalEntry[]>({
    queryKey: JOURNAL_QUERY_KEY,
    queryFn: () => financeApi.getJournalEntries(),
  });

  return {
    accounts,
    journalEntries,
    isLoading: isAccountsLoading || isJournalLoading,
  };
}
