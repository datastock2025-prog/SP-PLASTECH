import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { api } from '@/src/lib/api-client';
import { NonConformanceReport, CapaReport, CertificateOfAnalysis, InspectionPlan } from '@/src/types';

export function useNcrs(filter?: any) {
  return useQuery<NonConformanceReport[]>({
    queryKey: queryKeys.quality.ncrs(filter),
    queryFn: async () => {
      const res = await api.get<any>('/qc-inspections', {
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
      if (Array.isArray(rows) && rows.length > 0) return rows;
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
      if (ncr.id) {
        try {
          const res = await api.patch<any>(`/qc-inspections/${encodeURIComponent(ncr.id)}`, ncr);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      } else {
        try {
          const res = await api.post<any>('/qc-inspections', ncr);
          if (res?.data) return res.data.data || res.data;
        } catch {}
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
        const res = await api.get<any>('/qc-capas', { params: { limit: 100 } });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch {}
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
        const res = await api.post<any>('/qc-capas', capa);
        if (res?.data) return res.data.data || res.data;
      } catch {}
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
        const res = await api.get<any>('/qc-coas', { params: { limit: 100 } });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch {}
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
        const res = await api.post<any>('/qc-coas', coa);
        if (res?.data) return res.data.data || res.data;
      } catch {}
      return coa;
    },
    onSuccess: (savedCoa) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quality.coas() });
      broadcastLocalMutation('QUALITY_COAS', 'UPDATE', savedCoa);
    },
  });
}

export function useInspectionPlans() {
  return useQuery<InspectionPlan[]>({
    queryKey: queryKeys.quality.inspectionPlans(),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/qc-inspection-plans', { params: { limit: 100 } });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch {}
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useQuality() {
  const { data: ncrs = [], isLoading: isLoadingNcrs } = useNcrs();
  const { data: capas = [], isLoading: isLoadingCapas } = useCapas();
  const { data: coas = [], isLoading: isLoadingCoas } = useCoas();
  const { data: inspectionPlans = [], isLoading: isLoadingPlans } = useInspectionPlans();

  return {
    ncrs,
    capas,
    coas,
    inspectionPlans,
    isLoading: isLoadingNcrs || isLoadingCapas || isLoadingCoas || isLoadingPlans,
  };
}
