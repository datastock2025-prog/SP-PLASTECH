import { apiClient } from '../../../shared/api/client';

export const scmApi = {
  getShipments: async () => {
    try {
      const response = await apiClient.get('/scm/shipments');
      return response.data;
    } catch {
      return [
        { id: 'SH-101', carrier: 'BlueDart Logistics', trackingNumber: 'BD-882910', status: 'in_transit', eta: 'Tomorrow 10:00' },
        { id: 'SH-102', carrier: 'TCI Freight', trackingNumber: 'TCI-44102', status: 'delivered', eta: 'Delivered' },
      ];
    }
  },
};
