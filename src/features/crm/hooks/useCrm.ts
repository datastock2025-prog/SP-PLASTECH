import { useQuery } from '@tanstack/react-query';
import { crmApi } from '../api/crmApi';
import { Customer, Quotation } from '../../../types';

export const CUSTOMERS_QUERY_KEY = ['crm', 'customers'];
export const QUOTATIONS_QUERY_KEY = ['crm', 'quotations'];

export function useCrm() {
  const { data: customers = [], isLoading: isCustomersLoading } = useQuery<Customer[]>({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: () => crmApi.getCustomers(),
  });

  const { data: quotations = [], isLoading: isQuotationsLoading } = useQuery<Quotation[]>({
    queryKey: QUOTATIONS_QUERY_KEY,
    queryFn: () => crmApi.getQuotations(),
  });

  return {
    customers,
    quotations,
    isLoading: isCustomersLoading || isQuotationsLoading,
  };
}
