import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';
import { db } from '../shared/db';
import { NonConformanceReport, CapaReport, CertificateOfAnalysis, InspectionPlan } from '../types';

// ============================================================================
// QUALITY & SPC — TANSTACK REACT QUERY HOOKS (SSOT)
// ============================================================================

export function useNcrs(_filter?: any) {
  return useQuery<NonConformanceReport[]>({
    queryKey: queryKeys.quality.ncrs(_filter),
    queryFn: async () => {
      try {
        const res = await db.findMany<NonConformanceReport>('quality_ncrs', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useNcrs] query note:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveNcr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ncr: NonConformanceReport) => {
      try {
        await db.upsert('quality_ncrs', ncr, 'id');
      } catch (e) {
        console.debug('[useSaveNcr] notice:', e);
      }
      return ncr;
    },
    onSuccess: (savedNcr) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quality.ncrs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      broadcastLocalMutation('QUALITY_NCRS', 'UPDATE', savedNcr);
    },
  });
}

export function useCapas(_filter?: any) {
  return useQuery<CapaReport[]>({
    queryKey: queryKeys.quality.capas(_filter),
    queryFn: async () => {
      try {
        const res = await db.findMany<CapaReport>('quality_capas', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useCapas] query note:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveCapa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (capa: CapaReport) => {
      try {
        await db.upsert('quality_capas', capa, 'id');
      } catch (e) {
        console.debug('[useSaveCapa] notice:', e);
      }
      return capa;
    },
    onSuccess: (savedCapa) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quality.capas() });
      broadcastLocalMutation('QUALITY_CAPAS', 'UPDATE', savedCapa);
    },
  });
}

export function useCoas(_filter?: any) {
  return useQuery<CertificateOfAnalysis[]>({
    queryKey: queryKeys.quality.coas(_filter),
    queryFn: async () => {
      try {
        const res = await db.findMany<CertificateOfAnalysis>('quality_coas', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useCoas] query note:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveCoa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coa: CertificateOfAnalysis) => {
      try {
        await db.upsert('quality_coas', coa, 'id');
      } catch (e) {
        console.debug('[useSaveCoa] notice:', e);
      }
      return coa;
    },
    onSuccess: (savedCoa) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quality.coas() });
      broadcastLocalMutation('QUALITY_COAS', 'UPDATE', savedCoa);
    },
  });
}


import { db } from '../shared/db';

export function useInspectionPlans() {
  return useQuery<InspectionPlan[]>({
    queryKey: queryKeys.quality.inspectionPlans(),
    queryFn: async () => {
      try {
        const res = await db.findMany<InspectionPlan>('inspection_plans');
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
