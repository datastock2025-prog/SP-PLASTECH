import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualityApi } from '../api/qualityApi';
import { NonConformanceReport, CapaReport } from '../../../types';
import { NcrCreateFormValues } from '../types/qualitySchemas';
import { useUiStore } from '../../../shared/stores/uiStore';

export const NCR_QUERY_KEY = ['quality', 'ncrs'];
export const CAPA_QUERY_KEY = ['quality', 'capas'];

export function useQuality() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  const { data: ncrs = [], isLoading: isNcrsLoading } = useQuery<NonConformanceReport[]>({
    queryKey: NCR_QUERY_KEY,
    queryFn: () => qualityApi.getNcrs(),
  });

  const { data: capas = [], isLoading: isCapasLoading } = useQuery<CapaReport[]>({
    queryKey: CAPA_QUERY_KEY,
    queryFn: () => qualityApi.getCapas(),
  });

  const createNcrMutation = useMutation({
    mutationFn: (data: NcrCreateFormValues) => qualityApi.createNcr(data),
    onSuccess: (newNcr) => {
      queryClient.setQueryData<NonConformanceReport[]>(NCR_QUERY_KEY, (old = []) => [newNcr, ...old]);
      showToast(`NCR ${newNcr.id} registered`);
    },
  });

  return {
    ncrs,
    capas,
    isLoading: isNcrsLoading || isCapasLoading,
    createNcr: createNcrMutation.mutateAsync,
    isCreatingNcr: createNcrMutation.isPending,
  };
}
