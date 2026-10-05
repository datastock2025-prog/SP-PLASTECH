import { WorkOrder, MachineMaster } from '../../../types';
import { liveDataStore } from '../../../services/liveDataStore';
import { INITIAL_MOLDS, MoldMaster } from '../../../data/manufacturingData';
import { db } from '../../../shared/db';
import { WorkOrderLogFormValues, CreateWorkOrderFormValues } from '../types/manufacturingSchemas';

export const manufacturingApi = {
  getWorkOrders: async (): Promise<WorkOrder[]> => {
    return await liveDataStore.getWorkOrders();
  },

  getMachines: async (): Promise<MachineMaster[]> => {
    return await liveDataStore.getMachines();
  },

  getMolds: async (): Promise<MoldMaster[]> => {
    try {
      const data = await db.findMany<MoldMaster>('molds');
      return data && data.length > 0 ? data : INITIAL_MOLDS;
    } catch {
      return INITIAL_MOLDS;
    }
  },

  createWorkOrder: async (data: CreateWorkOrderFormValues): Promise<WorkOrder> => {
    const newWO: WorkOrder = {
      id: `WO-${Date.now().toString().slice(-4)}`,
      item: data.itemCode,
      bomId: data.bomId || null,
      machine: data.machineId,
      day: new Date().toISOString().split('T')[0],
      qty: data.qty,
      uom: 'PCS',
      completed: 0,
      scrap: 0,
      status: 'planned',
      priority: 'Medium',
      dueDate: data.dueDate,
      operator: 'Unassigned',
      downtimeMin: 0,
      outputLogs: [],
      downtimeLogs: [],
      checklist: [],
      history: [{ event: 'Created via JIT planner', time: 'Just now' }],
    };
    return await liveDataStore.saveWorkOrder(newWO);
  },

  logOutput: async (data: WorkOrderLogFormValues): Promise<WorkOrder> => {
    const orders = await liveDataStore.getWorkOrders();
    const target = orders.find((w) => w.id === data.workOrderId) || orders[0];
    const updated: WorkOrder = {
      ...target,
      completed: (target.completed || 0) + data.goodQty,
      scrap: (target.scrap || 0) + data.scrapQty,
    };
    return await liveDataStore.saveWorkOrder(updated);
  },
};
