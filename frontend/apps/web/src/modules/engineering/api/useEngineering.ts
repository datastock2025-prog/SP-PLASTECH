import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { bomEndpoints, BomDto } from '@/src/lib/api-client';
import { adminEventBus } from '@/src/services/adminService';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { BomMaster } from '@/src/types';
import { engineeringApi } from './engineeringApi';

export interface BomRecord {
  id: string;
  bomNumber: string;
  productCode: string;
  productName: string;
  version: string;
  isActive: boolean;
  components: Array<{
    itemCode: string;
    description: string;
    quantity: number;
    uom: string;
    scrapFactor?: number;
  }>;
}

export interface EcrRecord {
  id: string;
  ecrNumber: string;
  title: string;
  itemCode: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  requestedBy: string;
}

function mapBomDtoToMaster(b: any): BomMaster {
  return {
    ...b,
    id: b.id,
    parent: b.item_code || b.parent || '',
    parentName: b.parentName || b.bomName || b.item_code || '',
    version: b.version || b.bom_version || '1.0',
    status: (b.status as any) || 'draft',
    updated: b.updated || (b.updated_at ? String(b.updated_at).split('T')[0] : new Date().toISOString().split('T')[0]),
    lines: Array.isArray(b.lines) ? b.lines : Array.isArray(b.components) ? b.components : [],
    processType: b.processType || b.mfgCategory || 'Injection Molding',
    batchSize: Number(b.batchSize || 1000),
    baseUOM: b.baseUOM || b.batchUOM || 'PCS',
    yieldPct: b.yieldPct !== undefined ? Number(b.yieldPct) : undefined,
    scrapPct: b.scrapPct !== undefined ? Number(b.scrapPct) : undefined,
    standardCost: b.standardCost !== undefined ? Number(b.standardCost) : undefined,
    cycleTimeSec: b.cycleTimeSec !== undefined ? Number(b.cycleTimeSec) : b.standardCycleTimeSec !== undefined ? Number(b.standardCycleTimeSec) : undefined,
    cavities: b.cavities !== undefined ? Number(b.cavities) : b.moldCavities !== undefined ? Number(b.moldCavities) : undefined,
    shotWeightGrams: b.shotWeightGrams !== undefined ? Number(b.shotWeightGrams) : b.totalShotWeightGrams !== undefined ? Number(b.totalShotWeightGrams) : undefined,
    effectiveDate: b.effectiveDate || b.effectiveFrom || '',
    effectiveTo: b.effectiveTo || '',
    plant: b.plant || b.plantCode || b.plantId || '',
    department: b.department || b.owner || '',
    description: b.description || '',
    remarks: b.remarks || b.notes || '',
    notes: b.notes || b.description || '',
  } as BomMaster;
}

// 1. All Engineering BOMs (TanStack Query SSOT)
export function useBoms(filter?: Record<string, any>) {
  return useQuery<BomMaster[]>({
    queryKey: queryKeys.engineering.boms(filter),
    initialData: () => {
      if (filter || typeof window === 'undefined') return undefined;
      try {
        const raw = sessionStorage.getItem('sp_engineering_boms_v1');
        return raw ? JSON.parse(raw) : undefined;
      } catch {
        return undefined;
      }
    },
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      try {
        const fetched = await bomEndpoints.getBoms();
        if (Array.isArray(fetched)) {
          const mapped = fetched.map(mapBomDtoToMaster);
          if (!filter && typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('sp_engineering_boms_v1', JSON.stringify(mapped));
            } catch {}
          }
          return mapped;
        }
      } catch (e) {
        console.debug('[useBoms] Query notice:', e);
      }
      return [];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}

// 2. Single BOM Detail by ID
export function useBomDetail(id?: string) {
  return useQuery<BomDto | null>({
    queryKey: ['engineering', 'bom', id],
    queryFn: async () => {
      if (!id) return null;
      return await bomEndpoints.getBomById(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

// 3. Save BOM Mutation (Create or Update with Direct Cache Hydration)
export function useSaveBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bom: Partial<BomMaster>) => {
      const saved = await bomEndpoints.saveBom(bom as any);
      return mapBomDtoToMaster({ ...bom, ...saved });
    },
    onSuccess: (saved) => {
      queryClient.setQueriesData({ queryKey: ['engineering', 'boms'] }, (old: BomMaster[] | undefined) => {
        const list = Array.isArray(old) ? old : [];
        const exists = list.some((b) => b.id === saved.id);
        const next = exists ? list.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...list];
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('sp_engineering_boms_v1', JSON.stringify(next));
          }
        } catch {}
        return next;
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.engineering.boms() });
      adminEventBus.emit('BOM_SAVED', saved);
      broadcastLocalMutation('BOMS', 'INSERT', saved);
    },
  });
}

// 4. Delete BOM Mutation
export function useDeleteBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await bomEndpoints.deleteBom(id);
    },
    onSuccess: (_, id) => {
      queryClient.setQueriesData({ queryKey: ['engineering', 'boms'] }, (old: BomMaster[] | undefined) => {
        const list = Array.isArray(old) ? old : [];
        const next = list.filter((b) => b.id !== id);
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('sp_engineering_boms_v1', JSON.stringify(next));
          }
        } catch {}
        return next;
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.engineering.boms() });
      adminEventBus.emit('BOM_DELETED', { id });
      broadcastLocalMutation('BOMS', 'DELETE', { id });
    },
  });
}

// Legacy alias for backward compatibility
export const useEngineeringBoms = useBoms;
export const useSaveEngineeringBom = useSaveBom;

// 5. Engineering Change Requests (ECR)
export function useEcrs() {
  return useQuery({
    queryKey: queryKeys.engineering.ecrs(),
    queryFn: async (): Promise<EcrRecord[]> => [],
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveEcr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ecr: Partial<EcrRecord>): Promise<EcrRecord> => ecr as EcrRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engineering.ecrs() });
    },
  });
}

// 6. Process Routings
export function useRoutings() {
  return useQuery({
    queryKey: queryKeys.engineering.routings(),
    queryFn: async (): Promise<any[]> => [],
    staleTime: 1000 * 60 * 5,
  });
}

export const BOM_QUERY_KEY = ['engineering', 'boms'];

export function useEngineering() {
  const { data: boms = [], isLoading } = useBoms();
  return {
    boms,
    isLoading,
  };
}

// 7. Server-Side Recursive BOM Explosion Hook
export function useExplodeBom(bomId?: string, qty: number = 1) {
  return useQuery({
    queryKey: ['engineering', 'bom-explosion', bomId, qty],
    queryFn: async () => {
      if (!bomId) return null;
      return await bomEndpoints.explodeBom(bomId, qty);
    },
    enabled: Boolean(bomId),
    staleTime: 1000 * 60,
  });
}

// 8. Release BOM Version Hook
export function useReleaseBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await bomEndpoints.releaseBom(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engineering.boms() });
    },
  });
}

// 9. Normalized BOM Lines Hooks
export function useBomLines(bomId?: string) {
  return useQuery({
    queryKey: ['engineering', 'bom-lines', bomId],
    queryFn: async () => {
      if (!bomId) return [];
      return await bomEndpoints.getBomLines(bomId);
    },
    enabled: Boolean(bomId),
  });
}

export function useSaveBomLine(bomId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (line: Record<string, any>) => {
      return await bomEndpoints.saveBomLine(line);
    },
    onSuccess: () => {
      if (bomId) {
        queryClient.invalidateQueries({ queryKey: ['engineering', 'bom-lines', bomId] });
      }
    },
  });
}

export function useDeleteBomLine(bomId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lineId: string) => {
      return await bomEndpoints.deleteBomLine(lineId);
    },
    onSuccess: () => {
      if (bomId) {
        queryClient.invalidateQueries({ queryKey: ['engineering', 'bom-lines', bomId] });
      }
    },
  });
}
