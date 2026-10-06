import { useQuery } from '@tanstack/react-query';
import { SalesOrder } from '../../../types';
import { initialSalesOrders } from '../../../data/initialData';
import { db } from '../../../shared/db';

export const SALES_QUERY_KEY = ['sales', 'orders'];

export function useSales() {
  const { data: salesOrders = [], isLoading } = useQuery<SalesOrder[]>({
    queryKey: SALES_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await db.findMany<SalesOrder>('sales_orders');
        return data && data.length > 0 ? data : initialSalesOrders;
      } catch {
        return initialSalesOrders;
      }
    },
  });

  return {
    salesOrders,
    isLoading,
  };
}
