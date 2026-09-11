import { apiClient } from '../../../shared/api/client';
import { PurchaseOrder } from '../../../types';
import { initialPurchaseOrders } from '../../../data/initialData';
import { CreatePurchaseOrderFormValues } from '../types/procurementSchemas';

export const procurementApi = {
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    try {
      const response = await apiClient.get<PurchaseOrder[]>('/procurement/purchase-orders');
      return response.data;
    } catch {
      return initialPurchaseOrders;
    }
  },

  createPurchaseOrder: async (data: CreatePurchaseOrderFormValues): Promise<PurchaseOrder> => {
    try {
      const response = await apiClient.post<PurchaseOrder>('/procurement/purchase-orders', data);
      return response.data;
    } catch {
      const newPO: PurchaseOrder = {
        id: `PO-${Date.now().toString().slice(-4)}`,
        supplier: data.supplierName,
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: data.deliveryDate,
        approval: 'pending',
        lines: [{
          item: data.itemCode,
          name: data.itemName,
          qty: data.qty,
          uom: 'KG',
          price: data.unitPrice,
          received: 0,
        }],
        receiptLogs: [],
        history: [{ event: 'Created PO', time: 'Just now' }],
      };
      return newPO;
    }
  },
};
