import { db } from '../../../shared/db';
import { PurchaseOrder } from '../../../types';
import { initialPurchaseOrders } from '../../../data/initialData';
import { CreatePurchaseOrderFormValues } from '../types/procurementSchemas';

export const procurementApi = {
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    try {
      const data = await db.findMany<PurchaseOrder>('purchase_orders');
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}
    return initialPurchaseOrders;
  },

  createPurchaseOrder: async (data: CreatePurchaseOrderFormValues): Promise<PurchaseOrder> => {
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

    try {
      await db.upsert('purchase_orders', newPO, 'id');
    } catch {}

    return newPO;
  },
};
