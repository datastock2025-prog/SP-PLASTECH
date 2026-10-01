import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/api/client';
import { queryKeys } from '../shared/queryKeys';
import { universalSyncManager } from '../services/realtime/UniversalSyncManager';
import { NonConformanceReport, CapaReport, CertificateOfAnalysis, InspectionPlan } from '../types';

// ============================================================================
// QUALITY & SPC — TANSTACK REACT QUERY HOOKS
// ============================================================================

export function useNcrs(filter?: any) {
  return useQuery<NonConformanceReport[]>({
    queryKey: queryKeys.quality.ncrs(filter),
    queryFn: async () => {
      const res = await apiClient.get('/quality/ncrs', { params: filter });
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveNcr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ncr: NonConformanceReport) => {
      const res = await apiClient.post('/quality/ncrs', ncr);
      return res.data?.data || res.data || ncr;
    },
    onSuccess: (savedNcr) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quality.ncrs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      universalSyncManager.broadcastMutation('QUALITY_NCRS', 'UPDATE', savedNcr);
    },
  });
}

export function useCapas(filter?: any) {
  return useQuery<CapaReport[]>({
    queryKey: queryKeys.quality.capas(filter),
    queryFn: async () => {
      const res = await apiClient.get('/quality/capas', { params: filter });
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveCapa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (capa: CapaReport) => {
      const res = await apiClient.post('/quality/capas', capa);
      return res.data?.data || res.data || capa;
    },
    onSuccess: (savedCapa) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quality.capas() });
      universalSyncManager.broadcastMutation('QUALITY_CAPAS', 'UPDATE', savedCapa);
    },
  });
}

export function useCoas(filter?: any) {
  return useQuery<CertificateOfAnalysis[]>({
    queryKey: queryKeys.quality.coas(filter),
    queryFn: async () => {
      const res = await apiClient.get('/quality/coas', { params: filter });
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveCoa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coa: CertificateOfAnalysis) => {
      const res = await apiClient.post('/quality/coas', coa);
      return res.data?.data || res.data || coa;
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
    queryFn: async () => {
      const res = await apiClient.get('/quality/inspection-plans');
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}
