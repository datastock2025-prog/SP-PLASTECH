import { api } from '@/src/lib/api-client';
import {
  MepEquipment,
  MepAlarm,
  MepEnergyReading,
  MepUtilityReading,
  MepWorkOrder,
  MepCleanroomZone,
} from '../model/maintenanceSchemas';

export const maintenanceApi = {
  getWorkOrders: async (): Promise<MepWorkOrder[]> => {
    try {
      const res = await api.get<any>('/maintenance-work-orders', {
        params: { limit: 100, includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch (e) {
      console.debug('[maintenanceApi.getWorkOrders] REST notice:', e);
    }
    return [];
  },

  createWorkOrder: async (wo: Partial<MepWorkOrder>): Promise<MepWorkOrder> => {
    const newWo = {
      machine_id: wo.equipmentId || 'IMM-01',
      task_description: wo.title || 'Preventive Maintenance',
      frequency_type: 'DAYS',
      threshold_value: '30',
      status: 'ACTIVE',
    };

    try {
      const res = await api.post<any>('/maintenance-work-orders', newWo);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object') return row as MepWorkOrder;
    } catch (e) {
      console.debug('[maintenanceApi.createWorkOrder] REST notice:', e);
    }

    return newWo as unknown as MepWorkOrder;
  },

  updateWorkOrder: async (wo: MepWorkOrder): Promise<MepWorkOrder> => {
    if (wo.id) {
      try {
        const res = await api.patch<any>(`/maintenance-work-orders/${encodeURIComponent(wo.id)}`, wo);
        const row = res?.data?.data || res?.data;
        if (row && typeof row === 'object') return row as MepWorkOrder;
      } catch (e) {
        console.debug('[maintenanceApi.updateWorkOrder] REST notice:', e);
      }
    }
    return wo;
  },

  getEquipment: async (): Promise<MepEquipment[]> => {
    try {
      const res = await api.get<any>('/machines', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },

  getAlarms: async (): Promise<MepAlarm[]> => {
    return [];
  },

  getEnergyMeters: async (): Promise<MepEnergyReading[]> => {
    return [];
  },

  getUtilityReadings: async (): Promise<MepUtilityReading[]> => {
    return [];
  },

  getCleanroomZones: async (): Promise<MepCleanroomZone[]> => {
    return [];
  },
};
