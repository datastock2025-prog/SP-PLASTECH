import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NonConformanceReport, CapaReport } from '../../../types';
import { initialNcrs, initialCapas } from '../../../data/initialData';
import { db } from '../../../shared/db';
import { NcrCreateFormValues } from '../types/qualitySchemas';
import { useUiStore } from '../../../shared/stores/uiStore';

export const NCR_QUERY_KEY = ['quality', 'ncrs'];
export const CAPA_QUERY_KEY = ['quality', 'capas'];

export function useQuality() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  const { data: ncrs = [], isLoading: isNcrsLoading } = useQuery<NonConformanceReport[]>({
    queryKey: NCR_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await db.findMany<NonConformanceReport>('ncrs');
        return data && data.length > 0 ? data : initialNcrs;
      } catch {
        return initialNcrs;
      }
    },
  });

  const { data: capas = [], isLoading: isCapasLoading } = useQuery<CapaReport[]>({
    queryKey: CAPA_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await db.findMany<CapaReport>('capas');
        return data && data.length > 0 ? data : initialCapas;
      } catch {
        return initialCapas;
      }
    },
  });

  const createNcrMutation = useMutation({
    mutationFn: async (data: NcrCreateFormValues): Promise<NonConformanceReport> => {
      const newNcr: NonConformanceReport = {
        id: `NCR-${Date.now().toString().slice(-4)}`,
        source: 'Production Floor',
        item: data.itemCode,
        itemName: data.title,
        ref: `WO-REF-${Date.now().toString().slice(-3)}`,
        lot: data.lotNumber,
        qty: data.quantityAffected,
        uom: 'PCS',
        severity: data.severity,
        category: data.defectType,
        description: data.description,
        containment: 'Segregated into quarantine area pending review.',
        status: 'open',
        discoveredBy: data.reportedBy,
        discoveredDate: new Date().toISOString().split('T')[0],
        rca: {
          method: '5-Why',
          whys: [],
          rootCause: '',
        },
        disposition: {
          action: null,
          qty: null,
          approvedBy: null,
        },
        capaId: null,
        history: [{ event: 'Created NCR', time: 'Just now' }],
      };
      return await db.upsert<NonConformanceReport>('ncrs', newNcr);
    },
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
