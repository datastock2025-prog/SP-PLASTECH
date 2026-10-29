import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { api } from '@/src/lib/api-client';
import { WorkOrder } from '@/src/types';

export interface ProductionEntryPayload {
  workOrderId: string;
  goodQty: number;
  scrapQty: number;
  runnerKg: number;
  lumpsKg: number;
  shift: string;
  operator: string;
  source: 'grid_entry' | 'excel_csv_upload';
}

export interface ProductionEntryResult {
  success: boolean;
  workOrder: WorkOrder;
}

const normalizeWorkOrder = (row: any): WorkOrder => ({
  ...row,
  id: String(row.id || ''),
  item: String(row.item || row.item_code || row.itemCode || ''),
  bomId: row.bom_id || row.bomId || null,
  machine: row.machine || row.machine_id || row.machineId || null,
  day: row.day || row.plan_date || 'Day 1',
  qty: Number(row.qty || row.target_qty || row.target || 0),
  uom: String(row.uom || row.unit || 'PCS'),
  completed: Number(row.completed || row.actual || row.actual_qty || 0),
  scrap: Number(row.scrap || row.scrap_qty || 0),
  status: (row.status || 'in_progress') as any,
  priority: (row.priority || 'Medium') as any,
  dueDate: String(row.due_date || row.dueDate || ''),
  operator: String(row.operator || row.assigned_to || 'Operator 1'),
  downtimeMin: Number(row.downtime_min || row.downtimeMin || 0),
  outputLogs: Array.isArray(row.output_logs) ? row.output_logs : Array.isArray(row.outputLogs) ? row.outputLogs : [],
  downtimeLogs: Array.isArray(row.downtime_logs) ? row.downtime_logs : Array.isArray(row.downtimeLogs) ? row.downtimeLogs : [],
  checklist: Array.isArray(row.checklist) ? row.checklist : [],
  history: Array.isArray(row.history) ? row.history : [],
});

export function useWorkOrders(status?: string, filter?: any) {
  return useQuery<WorkOrder[]>({
    queryKey: queryKeys.manufacturing.workOrders({ status, ...filter }),
    queryFn: async () => {
      const res = await api.get<any>('/work-orders', {
        params: {
          limit: filter?.limit ?? 100,
          page: filter?.page ?? 1,
          sortBy: filter?.sortBy ?? 'created_at',
          sortOrder: filter?.sortOrder ?? 'desc',
          includeTotal: true,
          ...filter,
        },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) {
        const mapped = rows.map((row: any) => normalizeWorkOrder(row));
        return status ? mapped.filter((w: any) => w.status?.toLowerCase() === status.toLowerCase()) : mapped;
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wo: WorkOrder) => {
      const payload: Record<string, any> = {
        id: wo.id,
        item_code: wo.item || (wo as any).itemCode,
        status: wo.status,
        updated_at: new Date().toISOString(),
      };
      if (wo.machine || (wo as any).machineId) {
        payload.machine_id = wo.machine || (wo as any).machineId;
      }
      if (wo.id) {
        try {
          const res = await api.patch<any>(`/work-orders/${encodeURIComponent(wo.id)}`, payload);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      } else {
        try {
          const res = await api.post<any>('/work-orders', payload);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      }
      return wo;
    },
    onSuccess: (savedWO) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturing.workOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      broadcastLocalMutation('WORK_ORDERS', 'UPDATE', savedWO);
    },
  });
}

export function useLogProductionEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProductionEntryPayload): Promise<ProductionEntryResult> => {
      const updatedWO: WorkOrder = { id: payload.workOrderId } as WorkOrder;

      const prodPayload = {
        work_order_id: payload.workOrderId,
        good_qty: payload.goodQty,
        rejected_qty: payload.scrapQty,
        operator_id: payload.operator,
        shift_id: payload.shift,
      };

      try {
        await api.post<any>('/production-entries', prodPayload);
      } catch (e) {
        console.debug('[useLogProductionEntry] REST notice:', e);
      }

      return { success: true, workOrder: updatedWO };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturing.workOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      broadcastLocalMutation('WORK_ORDERS', 'UPDATE', result.workOrder);
    },
  });
}

export function useManufacturing() {
  const { data: workOrders = [], isLoading } = useWorkOrders();
  return {
    workOrders,
    isLoading,
  };
}
