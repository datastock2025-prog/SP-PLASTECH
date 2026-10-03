import { SalesOrder } from '../../../types';
import { liveDataStore } from '../../../services/liveDataStore';

export const salesApi = {
  getSalesOrders: async (): Promise<SalesOrder[]> => {
    return await liveDataStore.getSalesOrders();
  },
};

