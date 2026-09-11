import { apiClient } from '../../../shared/api/client';
import { SalesOrder } from '../../../types';
import { initialSalesOrders } from '../../../data/initialData';

export const salesApi = {
  getSalesOrders: async (): Promise<SalesOrder[]> => {
    try {
      const response = await apiClient.get<SalesOrder[]>('/sales/orders');
      return response.data;
    } catch {
      return initialSalesOrders;
    }
  },
};
