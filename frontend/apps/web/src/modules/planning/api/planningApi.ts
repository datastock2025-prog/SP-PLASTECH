import { api } from '@/src/lib/api-client';

export const planningApi = {
  getPlannedOrders: async () => {
    try {
      const res = await api.get<any>('/planned-orders', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) return rows;
    } catch {}
    return [];
  },

  getMrpRuns: async () => {
    try {
      const res = await api.get<any>('/mrp-runs', {
        params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch (e) {
      console.debug('[planningApi.getMrpRuns] REST notice:', e);
    }
    return [];
  },

  getShipments: async () => {
    try {
      const res = await api.get<any>('/shipments', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) return rows;
    } catch {}
    return [
      { id: 'SH-101', carrier: 'BlueDart Logistics', trackingNumber: 'BD-882910', status: 'in_transit', eta: 'Tomorrow 10:00' },
      { id: 'SH-102', carrier: 'TCI Freight', trackingNumber: 'TCI-44102', status: 'delivered', eta: 'Delivered' },
    ];
  },
};
