import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';
import { db } from '../shared/db';
import { WorkOrder, BomMaster } from '../types';
import { initialWorkOrders, initialBoms } from '../data/initialData';

// ============================================================================
// MANUFACTURING (MES) & ENGINEERING — TANSTACK REACT QUERY HOOKS (SSOT)
// ============================================================================

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
        const data = await db.findMany<any>('work_orders', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });

        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((row: any) => ({
            id: row.id || row.wo_number || row.woNumber,
            item: row.item_code || row.item || row.itemCode,
            itemCode: row.item_code || row.item || row.itemCode,
            machine: row.machine_code || row.machine_id || row.machine || row.machineId || 'IMM-250T-01',
            machineId: row.machine_code || row.machine_id || row.machine || row.machineId || 'IMM-250T-01',
            target: Number(row.target_qty || row.target || row.targetQty || 0),
            actual: Number(row.produced_qty || row.actual || row.actualQty || 0),
            scrap: Number(row.scrap_qty || row.scrap || 0),
            status: row.status || 'planned',
            priority: row.priority || 'Medium',
            plant: row.plant || 'Plant 1 - Pimpri Auto-Hub',
            shift: row.shift || 'Shift A',
            startDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-09-25',
            dueDate: row.due_date || '2026-10-15',
            progress: Number(row.target_qty || row.target || 0) > 0 
              ? Math.round((Number(row.produced_qty || row.actual || 0) / Number(row.target_qty || row.target || 1)) * 100) 
              : 0,
            created_at: row.created_at,
          }));
          const filtered = mapped.filter((w: any) => !['WO-1188', 'WO-1189', 'WO-1190', 'WO-1191', 'WO-1192', 'WO-1193'].includes(w.id));
          return status ? filtered.filter((w: any) => w.status?.toLowerCase() === status.toLowerCase()) : filtered;
        }
      } catch (e) {
        console.debug('[useWorkOrders] error:', e);
      }
      return initialWorkOrders;
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wo: WorkOrder) => {
      try {
        const payload: Record<string, any> = {
          id: wo.id,
          item_code: wo.item || (wo as any).itemCode,
          status: wo.status,
          updated_at: new Date().toISOString(),
        };
        if (wo.machine || (wo as any).machineId) {
          payload.machine_code = wo.machine || (wo as any).machineId;
        }
        await db.upsert('work_orders', payload);
      } catch (e) {
        console.debug('[useSaveWorkOrder] db upsert notice:', e);
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
      const updatedWO: WorkOrder = {
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
      };

      try {
        await db.upsert('work_orders', {
          id: payload.workOrderId,
          produced_qty: payload.goodQty,
          scrap_qty: payload.scrapQty,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.debug('[useLogProductionEntry] db upsert notice:', e);
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

export function useBoms(filter?: any) {
  return useQuery<BomMaster[]>({
    queryKey: queryKeys.engineering.boms(filter),
    queryFn: async () => {
      try {
        const res = await db.findMany<any>('boms', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useBoms] query error:', e);
      }
      return initialBoms;
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bom: BomMaster) => {
      try {
        await db.upsert('boms', bom, 'id');
      } catch (e) {
        console.debug('[useSaveBom] notice:', e);
      }
      return bom;
    },
    onSuccess: (savedBom) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engineering.boms() });
      broadcastLocalMutation('BOMS', 'UPDATE', savedBom);
    },
  });
}

