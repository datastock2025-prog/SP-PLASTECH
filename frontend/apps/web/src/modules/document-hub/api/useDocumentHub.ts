import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/api-client';
import type {
  ReportCatalogItem,
  OeeReportPayload,
  DocumentJobRecord,
  EnqueueJobRequest,
  OeeReportFilters,
} from '../types';

export const DOCUMENT_HUB_KEYS = {
  catalog: ['documentHub', 'catalog'] as const,
  preview: (filters: OeeReportFilters) => ['documentHub', 'preview', filters] as const,
  jobs: ['documentHub', 'jobs'] as const,
};

export function useReportCatalog() {
  return useQuery({
    queryKey: DOCUMENT_HUB_KEYS.catalog,
    queryFn: async (): Promise<ReportCatalogItem[]> => {
      const res = await api.get<any>('/document-hub/catalog');
      const rows = res?.data?.data || res?.data || [];
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useOeePreview(filters: OeeReportFilters, enabled: boolean = true) {
  return useQuery({
    queryKey: DOCUMENT_HUB_KEYS.preview(filters),
    queryFn: async (): Promise<OeeReportPayload | null> => {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.plantId) params.set('plantId', filters.plantId);
      if (filters.machineId) params.set('machineId', filters.machineId);
      if (filters.shiftId) params.set('shiftId', filters.shiftId);

      const res = await api.get<any>(
        `/document-hub/reports/oee/preview?${params.toString()}`
      );
      return res?.data?.data || res?.data || null;
    },
    enabled: enabled && !!filters.dateFrom,
    staleTime: 30 * 1000,
  });
}

export function useReportJobs(limit: number = 20) {
  return useQuery({
    queryKey: DOCUMENT_HUB_KEYS.jobs,
    queryFn: async (): Promise<DocumentJobRecord[]> => {
      const res = await api.get<any>(`/document-hub/jobs?limit=${limit}`);
      const rows = res?.data?.data || res?.data || [];
      return Array.isArray(rows) ? rows : [];
    },
    // Auto-poll every 3s if any job is queued or processing
    refetchInterval: (query) => {
      const data = query.state.data;
      if (Array.isArray(data) && data.some((j) => j.status === 'QUEUED' || j.status === 'PROCESSING')) {
        return 3000;
      }
      return 15000;
    },
  });
}

export function useEnqueueReportJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (req: EnqueueJobRequest) => {
      const res = await api.post<{ data: { jobId: string; status: string; estimatedWaitSeconds: number } }>(
        '/document-hub/jobs',
        req
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENT_HUB_KEYS.jobs });
    },
  });
}

export function downloadDocument(docId: string, fileName?: string) {
  const link = document.createElement('a');
  link.href = `/api/v1/document-hub/documents/${docId}/download`;
  if (fileName) {
    link.download = fileName;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

