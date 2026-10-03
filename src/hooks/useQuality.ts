import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/api/client';
import { queryKeys } from '../shared/queryKeys';
import { universalSyncManager } from '../services/realtime/UniversalSyncManager';
import { liveDataStore } from '../services/liveDataStore';
import { NonConformanceReport, CapaReport, CertificateOfAnalysis, InspectionPlan } from '../types';

// ============================================================================
// QUALITY & SPC — TANSTACK REACT QUERY HOOKS
// ============================================================================

export function useNcrs(_filter?: any) {
  return useQuery<NonConformanceReport[]>({
    queryKey: queryKeys.quality.ncrs(_filter),
    queryFn: async () => {
      return await liveDataStore.getNcrs();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveNcr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ncr: NonConformanceReport) => {
      return await liveDataStore.saveNcr(ncr);
    },
    onSuccess: (savedNcr) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quality.ncrs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      universalSyncManager.broadcastMutation('QUALITY_NCRS', 'UPDATE', savedNcr);
    },
  });
}

export function useCapas(_filter?: any) {
  return useQuery<CapaReport[]>({
    queryKey: queryKeys.quality.capas(_filter),
    queryFn: async () => {
      return await liveDataStore.getCapas();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveCapa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (capa: CapaReport) => {
      return await liveDataStore.saveCapa(capa);
    },
    onSuccess: (savedCapa) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quality.capas() });
      universalSyncManager.broadcastMutation('QUALITY_CAPAS', 'UPDATE', savedCapa);
    },
  });
}

export function useCoas(_filter?: any) {
  return useQuery<CertificateOfAnalysis[]>({
    queryKey: queryKeys.quality.coas(_filter),
    queryFn: async () => {
      return await liveDataStore.getCoas();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveCoa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coa: CertificateOfAnalysis) => {
      return await liveDataStore.saveCoa(coa);
    },
    onSuccess: (savedCoa) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quality.coas() });
      universalSyncManager.broadcastMutation('QUALITY_COAS', 'UPDATE', savedCoa);
    },
  });
}


export function useInspectionPlans() {
  return useQuery<InspectionPlan[]>({
    queryKey: queryKeys.quality.inspectionPlans(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get('/quality/inspection-plans', { signal });
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
