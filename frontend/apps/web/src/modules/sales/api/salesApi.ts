import { db } from '@/src/shared/db';
import { SalesOrder, Customer, Quotation } from '@/src/types';
import { initialSalesOrders, INITIAL_QUOTATIONS, initialCustomers } from '@/src/data/initialData';
import { CreateSalesOrderFormValues } from '../model/salesSchemas';

export const salesApi = {
  getSalesOrders: async (): Promise<SalesOrder[]> => {
    try {
      const data = await db.findMany<SalesOrder>('sales_orders');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return initialSalesOrders;
  },

  createSalesOrder: async (data: CreateSalesOrderFormValues): Promise<SalesOrder> => {
    const newSO: SalesOrder = {
      id: `SO-${Date.now().toString().slice(-4)}`,
      customer: data.customerId,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: data.deliveryDate,
      priority: 'medium',
      approval: 'pending',
      lines: [
        {
          item: data.itemCode,
          name: data.itemCode,
          qty: data.quantity,
          uom: 'PCS',
          price: 0,
          dispatched: 0,
        },
      ],
      dispatchLogs: [],
      history: [{ event: 'Created Sales Order', time: 'Just now' }],
    };

    try {
      await db.upsert('sales_orders', newSO, 'id');
    } catch {}

    return newSO;
  },

  getQuotations: async (): Promise<Quotation[]> => {
    try {
      const data = await db.findMany<Quotation>('quotations');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return INITIAL_QUOTATIONS as any;
  },

  getCustomers: async (): Promise<Customer[]> => {
    try {
      const data = await db.findMany<Customer>('customers');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return initialCustomers || [];
  },
};
