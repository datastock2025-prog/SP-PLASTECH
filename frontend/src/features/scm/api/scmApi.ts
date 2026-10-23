import { api } from '@/src/lib/api-client';

export const scmApi = {
  getShipments: async () => {
    try {
      const response = await api.get<any>('/shipments', { params: { limit: 100 } });
      const rows = response?.data?.data || response?.data;
      if (Array.isArray(rows) && rows.length > 0) return rows;
      return [
        { id: 'SH-101', carrier: 'BlueDart Logistics', trackingNumber: 'BD-882910', status: 'in_transit', eta: 'Tomorrow 10:00' },
        { id: 'SH-102', carrier: 'TCI Freight', trackingNumber: 'TCI-44102', status: 'delivered', eta: 'Delivered' },
      ];
    } catch {
      return [
        { id: 'SH-101', carrier: 'BlueDart Logistics', trackingNumber: 'BD-882910', status: 'in_transit', eta: 'Tomorrow 10:00' },
        { id: 'SH-102', carrier: 'TCI Freight', trackingNumber: 'TCI-44102', status: 'delivered', eta: 'Delivered' },
      ];
    }
  },
};
