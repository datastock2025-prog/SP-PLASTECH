import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/supabaseRealtime';
import { IntegrationConnector } from '../model/integrationsSchemas';
import { integrationsApi } from './integrationsApi';

export function useIntegrations() {
  return useQuery<IntegrationConnector[]>({
    queryKey: queryKeys.integrations.connectors(),
    queryFn: async () => {
      try {
        const res = await integrationsApi.getConnectors();
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useIntegrations] query note:', e);
      }
      return [];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useSaveIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connector: Partial<IntegrationConnector>) => {
      return integrationsApi.saveConnector(connector);
    },
    onSuccess: (savedConn) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.connectors() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.integrations() });
      broadcastLocalMutation('INTEGRATIONS', 'UPDATE', savedConn);
    },
  });
}
