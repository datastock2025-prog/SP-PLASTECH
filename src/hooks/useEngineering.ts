import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { bomEndpoints, BomDto } from '../lib/api-client';
import { db } from '../shared/db';
import { adminEventBus } from '../services/adminService';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';
import { INITIAL_BOMS } from '../data/engineeringData';
import { BomMaster } from '../types';

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

// 1. All Engineering BOMs (TanStack Query SSOT)
export function useBoms(filter?: Record<string, any>) {
  return useQuery<BomMaster[]>({
    queryKey: queryKeys.engineering.boms(filter),
    queryFn: async () => {
      try {
        const fetched = await bomEndpoints.getBoms();
        if (Array.isArray(fetched) && fetched.length > 0) {
          return fetched.map((b) => ({
            id: b.id,
            parent: b.item_code || (b as any).parent || '',
            parentName: (b as any).parentName || b.item_code || '',
            version: b.version || 'v1.0',
            status: (b.status as any) || 'approved',
            updated: b.updated_at || new Date().toISOString().split('T')[0],
            lines: (b as any).components || [],
          } as BomMaster));
        }
      } catch (e) {
        console.debug('[useBoms] Query notice:', e);
      }
      return INITIAL_BOMS;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
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

// 3. Save BOM Mutation (Create or Update)
export function useSaveBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bom: Partial<BomMaster>) => {
      const saved = await bomEndpoints.saveBom(bom as any);
      return saved;
    },
    onSuccess: (saved) => {
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
    queryFn: async () => {
      try {
        const rows = await db.findMany<EcrRecord>('ecr_requests', {
          orderBy: { column: 'created_at', ascending: false },
        });
        if (Array.isArray(rows) && rows.length > 0) return rows;
      } catch {}
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveEcr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ecr: Partial<EcrRecord>) => {
      return await db.upsert('ecr_requests', ecr);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engineering.ecrs() });
    },
  });
}

// 6. Process Routings
export function useRoutings() {
  return useQuery({
    queryKey: queryKeys.engineering.routings(),
    queryFn: async () => {
      try {
        const rows = await db.findMany<any>('routing_operations');
        if (Array.isArray(rows) && rows.length > 0) return rows;
      } catch {}
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

