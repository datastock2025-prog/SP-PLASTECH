import { api } from '@/src/lib/api-client';
import { SalesOrder, Customer, Quotation } from '@/src/types';
import { CreateSalesOrderFormValues } from '../model/salesSchemas';

export interface SalesSummaryDto {
  totalOrders: number;
  draftOrders: number;
  confirmedOrders: number;
  inProductionOrders: number;
  dispatchedOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

export const salesApi = {
  getSalesOrders: async (): Promise<SalesOrder[]> => {
    try {
      const res = await api.get<any>('/sales-orders', {
        params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch (e) {
      console.debug('[salesApi.getSalesOrders] REST query notice:', e);
    }
    return [];
  },

  getSalesSummary: async (): Promise<SalesSummaryDto> => {
    try {
      const res = await api.get<any>('/sales/summary');
      const stats = res?.data?.data || res?.data;
      if (stats && typeof stats === 'object') {
        return {
          totalOrders: stats.totalOrders || 0,
          draftOrders: stats.draftOrders || 0,
          confirmedOrders: stats.confirmedOrders || 0,
          inProductionOrders: stats.inProductionOrders || 0,
          dispatchedOrders: stats.dispatchedOrders || 0,
          totalRevenue: Number(stats.totalRevenue || 0),
          totalCustomers: stats.totalCustomers || 0,
        };
      }
    } catch (e) {
      console.debug('[salesApi.getSalesSummary] REST notice:', e);
    }
    return {
      totalOrders: 0,
      draftOrders: 0,
      confirmedOrders: 0,
      inProductionOrders: 0,
      dispatchedOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
    };
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
      const res = await api.post<any>('/sales-orders', newSO);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object') return row;
    } catch (e) {
      console.debug('[salesApi.createSalesOrder] REST notice:', e);
    }

    return newSO;
  },

  getQuotations: async (): Promise<Quotation[]> => {
    try {
      const res = await api.get<any>('/quotations', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch (e) {
      console.debug('[salesApi.getQuotations] REST notice:', e);
    }
    return [];
  },

  getCustomers: async (): Promise<Customer[]> => {
    try {
      const res = await api.get<any>('/customers', {
        params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc' },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch (e) {
      console.debug('[salesApi.getCustomers] REST notice:', e);
    }
    return [];
  },
};
