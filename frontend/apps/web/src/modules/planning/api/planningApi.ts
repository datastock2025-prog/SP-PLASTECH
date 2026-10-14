import { db } from '@/src/shared/db';

export const planningApi = {
  getPlannedOrders: async () => {
    try {
      const data = await db.findMany<any>('planned_orders');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return [];
  },

  getMrpRuns: async () => {
    try {
      const data = await db.findMany<any>('mrp_runs');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return [];
  },

  getShipments: async () => {
    try {
      const response = await db.findMany<any>('shipments');
      if (response && response.length > 0) return response;
    } catch {}
    return [
      { id: 'SH-101', carrier: 'BlueDart Logistics', trackingNumber: 'BD-882910', status: 'in_transit', eta: 'Tomorrow 10:00' },
      { id: 'SH-102', carrier: 'TCI Freight', trackingNumber: 'TCI-44102', status: 'delivered', eta: 'Delivered' },
    ];
  },
};
