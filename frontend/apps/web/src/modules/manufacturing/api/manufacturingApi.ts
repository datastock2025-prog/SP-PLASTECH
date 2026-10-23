import { api } from '@/src/lib/api-client';
import { WorkOrder, MachineMaster } from '@/src/types';
import { CreateWorkOrderFormValues, WorkOrderLogFormValues } from '../model/manufacturingSchemas';

export const manufacturingApi = {
  getWorkOrders: async (): Promise<WorkOrder[]> => {
    try {
      const res = await api.get<any>('/work-orders', {
        params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch (e) {
      console.debug('[manufacturingApi.getWorkOrders] REST query notice:', e);
    }
    return [];
  },

  createWorkOrder: async (data: CreateWorkOrderFormValues): Promise<WorkOrder> => {
    const payload = {
      code: `WO-${Date.now().toString().slice(-4)}`,
      item_code: data.itemCode,
      machine_id: data.machineId,
      target_qty: data.qty,
      status: 'planned',
      priority: data.priority === 'urgent' ? 'High' : (data.priority.charAt(0).toUpperCase() + data.priority.slice(1).toLowerCase()),
      due_date: data.dueDate,
    };

    try {
      const res = await api.post<any>('/work-orders', payload);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object') return row as WorkOrder;
    } catch (e) {
      console.debug('[manufacturingApi.createWorkOrder] REST notice:', e);
    }

    return payload as unknown as WorkOrder;
  },

  getMachines: async (): Promise<MachineMaster[]> => {
    try {
      const res = await api.get<any>('/machines', { params: { limit: 100, includeTotal: true } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch (e) {
      console.debug('[manufacturingApi.getMachines] REST query notice:', e);
    }
    return [];
  },

  logProduction: async (log: WorkOrderLogFormValues): Promise<void> => {
    const payload = {
      work_order_id: log.workOrderId,
      machine_id: log.machineId,
      good_qty: log.goodQty,
      rejected_qty: log.scrapQty,
      operator_id: log.operator,
      shift_id: log.shift,
    };

    try {
      await api.post<any>('/production-entries', payload);
    } catch (e) {
      console.debug('[manufacturingApi.logProduction] REST notice:', e);
    }
  },
};
