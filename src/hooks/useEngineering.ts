import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../services/api';

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

export function useEngineeringBoms(filter?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.engineering.boms(filter),
    queryFn: async () => {
      const response = await apiClient.get<BomRecord[]>('/api/v1/engineering/boms', { params: filter });
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveEngineeringBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bom: Partial<BomRecord>) => {
      if (bom.id) {
        const response = await apiClient.put<BomRecord>(`/api/v1/engineering/boms/${bom.id}`, bom);
        return response.data;
      }
      const response = await apiClient.post<BomRecord>('/api/v1/engineering/boms', bom);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engineering.boms() });
    },
  });
}

export function useEcrs() {
  return useQuery({
    queryKey: queryKeys.engineering.ecrs(),
    queryFn: async () => {
      const response = await apiClient.get<EcrRecord[]>('/api/v1/engineering/ecrs');
      return response.data || [];
    },
  });
}

export function useSaveEcr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ecr: Partial<EcrRecord>) => {
      if (ecr.id) {
        const response = await apiClient.put<EcrRecord>(`/api/v1/engineering/ecrs/${ecr.id}`, ecr);
        return response.data;
      }
      const response = await apiClient.post<EcrRecord>('/api/v1/engineering/ecrs', ecr);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engineering.ecrs() });
    },
  });
}

export function useRoutings() {
  return useQuery({
    queryKey: queryKeys.engineering.routings(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/api/v1/engineering/routings');
      return response.data || [];
    },
  });
}
