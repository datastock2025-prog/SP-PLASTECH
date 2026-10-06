import { SalesOrder } from '../../../types';
import { db } from '../../../shared/db';
import { initialSalesOrders } from '../../../data/initialData';

export const salesApi = {
  getSalesOrders: async (): Promise<SalesOrder[]> => {
    try {
      const data = await db.findMany<SalesOrder>('sales_orders');
      return data && data.length > 0 ? data : initialSalesOrders;
    } catch {
      return initialSalesOrders;
    }
  },
};


