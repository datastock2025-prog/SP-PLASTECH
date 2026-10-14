import { db } from '@/src/shared/db';
import {
  MepEquipment,
  MepAlarm,
  MepEnergyReading,
  MepUtilityReading,
  MepWorkOrder,
  MepCleanroomZone,
} from '../model/maintenanceSchemas';
import {
  INITIAL_MEP_EQUIPMENT,
  INITIAL_MEP_ALARMS,
  INITIAL_MEP_ENERGY_METERS,
  INITIAL_MEP_UTILITY_READINGS,
  INITIAL_MEP_WORK_ORDERS,
  INITIAL_MEP_CLEANROOM_ZONES,
} from '@/src/data/mepData';

export const maintenanceApi = {
  getWorkOrders: async (): Promise<MepWorkOrder[]> => {
    try {
      const data = await db.findMany<MepWorkOrder>('maintenance_work_orders');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return INITIAL_MEP_WORK_ORDERS;
  },

  createWorkOrder: async (wo: Partial<MepWorkOrder>): Promise<MepWorkOrder> => {
    const newWo: MepWorkOrder = {
      id: wo.id || `MWO-${Date.now().toString().slice(-4)}`,
      title: wo.title || 'Preventive Maintenance',
      equipmentId: wo.equipmentId || 'MEP-CHILL-01',
      equipmentName: wo.equipmentName || 'Central Chiller',
      category: wo.category || 'Mechanical',
      type: wo.type || 'Preventative (PM)',
      priority: wo.priority || 'Medium',
      assignedTo: wo.assignedTo || 'Maintenance Tech',
      status: wo.status || 'Assigned',
      dueDate: wo.dueDate || new Date().toISOString().split('T')[0],
      scheduledDate: wo.scheduledDate || new Date().toISOString().split('T')[0],
      estimatedHours: wo.estimatedHours || 2,
      actualHours: wo.actualHours || 0,
      tasks: wo.tasks || [],
      partsRequired: wo.partsRequired || [],
      permitRequired: wo.permitRequired || false,
    };
    try {
      await db.upsert('maintenance_work_orders', newWo, 'id');
    } catch {}
    return newWo;
  },

  updateWorkOrder: async (wo: MepWorkOrder): Promise<MepWorkOrder> => {
    try {
      await db.upsert('maintenance_work_orders', wo, 'id');
    } catch {}
    return wo;
  },

  getEquipment: async (): Promise<MepEquipment[]> => {
    try {
      const data = await db.findMany<MepEquipment>('equipment_assets');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return INITIAL_MEP_EQUIPMENT;
  },

  getAlarms: async (): Promise<MepAlarm[]> => {
    return INITIAL_MEP_ALARMS;
  },

  getEnergyMeters: async (): Promise<MepEnergyReading[]> => {
    return INITIAL_MEP_ENERGY_METERS;
  },

  getUtilityReadings: async (): Promise<MepUtilityReading[]> => {
    return INITIAL_MEP_UTILITY_READINGS;
  },

  getCleanroomZones: async (): Promise<MepCleanroomZone[]> => {
    return INITIAL_MEP_CLEANROOM_ZONES;
  },
};
