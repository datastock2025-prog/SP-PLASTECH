import { WorkOrder, MachineMaster } from '../../../types';
import { INITIAL_MOLDS, MoldMaster } from '../../../data/manufacturingData';
import { initialWorkOrders, initialMachines } from '../../../data/initialData';
import { db } from '../../../shared/db';
import { WorkOrderLogFormValues, CreateWorkOrderFormValues } from '../types/manufacturingSchemas';

export const manufacturingApi = {
  getWorkOrders: async (): Promise<WorkOrder[]> => {
    try {
      const data = await db.findMany<WorkOrder>('work_orders');
      return data && data.length > 0 ? data : initialWorkOrders;
    } catch {
      return initialWorkOrders;
    }
  },

  getMachines: async (): Promise<MachineMaster[]> => {
    try {
      const data = await db.findMany<MachineMaster>('machines');
      return data && data.length > 0 ? data : initialMachines;
    } catch {
      return initialMachines;
    }
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
    return await db.upsert<WorkOrder>('work_orders', newWO);
  },

  logOutput: async (data: WorkOrderLogFormValues): Promise<WorkOrder> => {
    const orders = await manufacturingApi.getWorkOrders();
    const target = orders.find((w) => w.id === data.workOrderId) || orders[0];
    const updated: WorkOrder = {
      ...target,
      completed: (target.completed || 0) + data.goodQty,
      scrap: (target.scrap || 0) + data.scrapQty,
    };
    return await db.upsert<WorkOrder>('work_orders', updated);
  },
};

