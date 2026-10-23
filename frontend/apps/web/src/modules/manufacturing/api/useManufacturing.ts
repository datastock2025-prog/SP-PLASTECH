import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { api } from '@/src/lib/api-client';
import { WorkOrder } from '@/src/types';
import { mapDbRowToWorkOrder } from '@/src/shared/utils/dtoMappers';

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

export function useWorkOrders(status?: string) {
  return useQuery<WorkOrder[]>({
    queryKey: queryKeys.manufacturing.workOrders(status),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/work-orders', {
          params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
        });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) {
          const mapped = rows.map((row: any) => mapDbRowToWorkOrder(row));
          return status ? mapped.filter((w: any) => w.status?.toLowerCase() === status.toLowerCase()) : mapped;
        }
      } catch (e) {
        console.debug('[useWorkOrders] REST query notice:', e);
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
      const updatedWO: WorkOrder = mapDbRowToWorkOrder({
        id: payload.workOrderId,
        item: 'MOLDED-PART',
        machine: 'IMM-250T-01',
        qty: payload.goodQty + payload.scrapQty,
        completed: payload.goodQty,
        scrap: payload.scrapQty,
        runnerQty: payload.runnerKg,
        lumbesQty: payload.lumpsKg,
        shift: payload.shift,
        operator: payload.operator,
        status: 'in_progress',
      });

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
