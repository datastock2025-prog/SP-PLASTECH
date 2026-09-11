import { useQuery } from '@tanstack/react-query';
import { salesApi } from '../api/salesApi';
import { SalesOrder } from '../../../types';

export const SALES_QUERY_KEY = ['sales', 'orders'];

export function useSales() {
  const { data: salesOrders = [], isLoading } = useQuery<SalesOrder[]>({
    queryKey: SALES_QUERY_KEY,
    queryFn: () => salesApi.getSalesOrders(),
  });

  return {
    salesOrders,
    isLoading,
  };
}
