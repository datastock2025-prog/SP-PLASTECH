import { apiClient } from '../../../shared/api/client';
import { StockTransaction } from '../../../types';
import { initialStockTransactions } from '../../../data/initialData';
import { StockTransferFormValues } from '../types/warehouseSchemas';

export const warehouseApi = {
  getTransactions: async (): Promise<StockTransaction[]> => {
    try {
      const response = await apiClient.get<StockTransaction[]>('/warehouse/transactions');
      return response.data;
    } catch {
      return initialStockTransactions;
    }
  },

  createTransfer: async (data: StockTransferFormValues): Promise<StockTransaction> => {
    try {
      const response = await apiClient.post<StockTransaction>('/warehouse/transfers', data);
      return response.data;
    } catch {
      const newTx: StockTransaction = {
        id: `TX-${Date.now().toString().slice(-4)}`,
        item: data.itemCode,
        type: 'transfer',
        qty: data.quantity,
        uom: 'KG',
        fromWh: data.fromLocation,
        toWh: data.toLocation,
        ref: data.reference || 'Manual Stock Transfer',
        date: new Date().toISOString().split('T')[0],
        by: 'System Operator',
      };
      return newTx;
    }
  },
};
