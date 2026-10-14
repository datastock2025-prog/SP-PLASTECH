import { db } from '../../../shared/db';
import { StockTransaction } from '../../../types';
import { initialStockTransactions } from '../../../data/initialData';
import { StockTransferFormValues } from '../types/warehouseSchemas';

export const warehouseApi = {
  getTransactions: async (): Promise<StockTransaction[]> => {
    try {
      const response = await db.findMany<StockTransaction>('stock_transactions');
      return response && response.length > 0 ? response : initialStockTransactions;
    } catch {
      return initialStockTransactions;
    }
  },

  createTransfer: async (data: StockTransferFormValues): Promise<StockTransaction> => {
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
    try {
      await db.upsert('stock_transactions', newTx, 'id');
      return newTx;
    } catch {
      return newTx;
    }
  },
};
