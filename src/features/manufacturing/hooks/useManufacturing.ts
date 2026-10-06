import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkOrder, MachineMaster } from '../../../types';
import { MoldMaster, INITIAL_MOLDS } from '../../../data/manufacturingData';
import { initialWorkOrders, initialMachines } from '../../../data/initialData';
import { db } from '../../../shared/db';
import { WorkOrderLogFormValues, CreateWorkOrderFormValues } from '../types/manufacturingSchemas';
import { useUiStore } from '../../../shared/stores/uiStore';

export const WORK_ORDERS_QUERY_KEY = ['manufacturing', 'workOrders'];
export const MACHINES_QUERY_KEY = ['manufacturing', 'machines'];
export const MOLDS_QUERY_KEY = ['manufacturing', 'molds'];

export function useManufacturing() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  const { data: workOrders = [], isLoading: isWOsLoading } = useQuery<WorkOrder[]>({
    queryKey: WORK_ORDERS_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await db.findMany<WorkOrder>('work_orders');
        return data && data.length > 0 ? data : initialWorkOrders;
      } catch {
        return initialWorkOrders;
      }
    },
  });

  const { data: machines = [], isLoading: isMachinesLoading } = useQuery<MachineMaster[]>({
    queryKey: MACHINES_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await db.findMany<MachineMaster>('machines');
        return data && data.length > 0 ? data : initialMachines;
      } catch {
        return initialMachines;
      }
    },
  });

  const { data: molds = [], isLoading: isMoldsLoading } = useQuery<MoldMaster[]>({
    queryKey: MOLDS_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await db.findMany<MoldMaster>('molds');
        return data && data.length > 0 ? data : INITIAL_MOLDS;
      } catch {
        return INITIAL_MOLDS;
      }
    },
  });

  const createWOMutation = useMutation({
    mutationFn: async (data: CreateWorkOrderFormValues): Promise<WorkOrder> => {
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
    onSuccess: (newWO) => {
      queryClient.setQueryData<WorkOrder[]>(WORK_ORDERS_QUERY_KEY, (old = []) => [newWO, ...old]);
      showToast(`Work Order ${newWO.id} scheduled successfully`);
    },
  });

  const logOutputMutation = useMutation({
    mutationFn: async (data: WorkOrderLogFormValues): Promise<WorkOrder> => {
      const orders = queryClient.getQueryData<WorkOrder[]>(WORK_ORDERS_QUERY_KEY) || initialWorkOrders;
      const target = orders.find((w) => w.id === data.workOrderId) || orders[0];
      const updated: WorkOrder = {
        ...target,
        completed: (target.completed || 0) + data.goodQty,
        scrap: (target.scrap || 0) + data.scrapQty,
      };
      return await db.upsert<WorkOrder>('work_orders', updated);
    },
    onSuccess: (updatedWO) => {
      queryClient.setQueryData<WorkOrder[]>(WORK_ORDERS_QUERY_KEY, (old = []) =>
        old.map((w) => (w.id === updatedWO.id ? updatedWO : w))
      );
      showToast(`Logged production for ${updatedWO.id}`);
    },
  });

  return {
    workOrders,
    machines,
    molds,
    isLoading: isWOsLoading || isMachinesLoading || isMoldsLoading,
    createWorkOrder: createWOMutation.mutateAsync,
    isCreatingWO: createWOMutation.isPending,
    logOutput: logOutputMutation.mutateAsync,
    isLoggingOutput: logOutputMutation.isPending,
  };
}
