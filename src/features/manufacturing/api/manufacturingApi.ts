import { apiClient } from '../../../shared/api/client';
import { WorkOrder, MachineMaster } from '../../../types';
import { initialWorkOrders, initialMachines } from '../../../data/initialData';
import { INITIAL_MOLDS, MoldMaster } from '../../../data/manufacturingData';
import { WorkOrderLogFormValues, CreateWorkOrderFormValues } from '../types/manufacturingSchemas';

export const manufacturingApi = {
  getWorkOrders: async (): Promise<WorkOrder[]> => {
    try {
      const response = await apiClient.get<WorkOrder[]>('/manufacturing/work-orders');
      return response.data;
    } catch {
      return initialWorkOrders;
    }
  },

  getMachines: async (): Promise<MachineMaster[]> => {
    try {
      const response = await apiClient.get<MachineMaster[]>('/manufacturing/machines');
      return response.data;
    } catch {
      return initialMachines;
    }
  },

  getMolds: async (): Promise<MoldMaster[]> => {
    try {
      const response = await apiClient.get<MoldMaster[]>('/manufacturing/molds');
      return response.data;
    } catch {
      return INITIAL_MOLDS;
    }
  },

  createWorkOrder: async (data: CreateWorkOrderFormValues): Promise<WorkOrder> => {
    try {
      const response = await apiClient.post<WorkOrder>('/manufacturing/work-orders', data);
      return response.data;
    } catch {
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
      return newWO;
    }
  },

  logOutput: async (data: WorkOrderLogFormValues): Promise<WorkOrder> => {
    try {
      const response = await apiClient.post<WorkOrder>(`/manufacturing/work-orders/${data.workOrderId}/output`, data);
      return response.data;
    } catch {
      const target = initialWorkOrders.find((w) => w.id === data.workOrderId) || initialWorkOrders[0];
      return {
        ...target,
        completed: (target.completed || 0) + data.goodQty,
        scrap: (target.scrap || 0) + data.scrapQty,
      };
    }
  },
};
