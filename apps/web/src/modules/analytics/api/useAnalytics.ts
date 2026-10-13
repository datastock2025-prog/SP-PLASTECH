import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { analyticsApi } from './analyticsApi';
import { ExecutiveKpiSummary } from '../model/analyticsSchemas';

export interface OeeMetric {
  machineId: string;
  machineName: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  timestamp: string;
}

export function useOeeStream(plantId?: string) {
  return useQuery({
    queryKey: queryKeys.analytics.oeeStream(plantId),
    queryFn: async () => {
      try {
        const records = await analyticsApi.getOeeRecords({ plantId });
        if (Array.isArray(records) && records.length > 0) {
          return records.map((r: any) => ({
            machineId: r.machineId,
            machineName: `IMM-${r.machineId}`,
            availability: r.availability,
            performance: r.performance,
            quality: r.quality,
            oee: r.oee,
            timestamp: r.date,
          }));
        }
      } catch {}
      return [];
    },
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  });
}

export function useExecutiveKpis(filters: any = {}) {
  return useQuery<ExecutiveKpiSummary>({
    queryKey: ['analytics', 'executiveKpis', filters],
    queryFn: () => analyticsApi.getExecutiveKpis(filters),
    staleTime: 1000 * 60,
  });
}

export function useKpiReports(filter?: any) {
  return useQuery({
    queryKey: queryKeys.analytics.kpiReports(),
    queryFn: async () => {
      try {
        const res = await analyticsApi.getExecutiveKpis(filter);
        return res?.kpis || [];
      } catch {}
      return [];
    },
    staleTime: 1000 * 60,
  });
}

export function useAnalytics() {
  const { data: oee = [], isLoading: isOeeLoading } = useOeeStream();
  const { data: kpis, isLoading: isKpisLoading } = useExecutiveKpis();

  return {
    oee,
    kpis,
    isLoading: isOeeLoading || isKpisLoading,
  };
}
