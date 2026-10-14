import { db } from '@/src/shared/db';
import { WorkOrder, MachineMaster } from '@/src/types';
import { initialWorkOrders, initialMachines } from '@/src/data/initialData';
import { CreateWorkOrderFormValues, WorkOrderLogFormValues } from '../model/manufacturingSchemas';

export const manufacturingApi = {
  getWorkOrders: async (): Promise<WorkOrder[]> => {
    try {
      const data = await db.findMany<WorkOrder>('work_orders');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return initialWorkOrders;
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
      priority: data.priority === 'urgent' ? 'High' : (data.priority.charAt(0).toUpperCase() + data.priority.slice(1).toLowerCase()) as any,
      dueDate: data.dueDate,
      operator: 'Floor Lead',
      downtimeMin: 0,
      outputLogs: [],
      downtimeLogs: [],
      checklist: [],
      history: [{ event: 'Created Work Order', time: 'Just now' }],
    };

    try {
      await db.upsert('work_orders', newWO, 'id');
    } catch {}

    return newWO;
  },

  getMachines: async (): Promise<MachineMaster[]> => {
    try {
      const data = await db.findMany<MachineMaster>('machines');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return initialMachines;
  },

  logProduction: async (log: WorkOrderLogFormValues): Promise<void> => {
    try {
      await db.upsert('daily_production_entries', {
        work_order_id: log.workOrderId,
        good_qty: log.goodQty,
        scrap_qty: log.scrapQty,
        operator: log.operator,
        shift: log.shift,
        machine_id: log.machineId,
        entry_date: new Date().toISOString(),
      });
    } catch {}
  },
};
