import { useQuery } from '@tanstack/react-query';
import { mepApi } from '../api/mepApi';
import { ScadaTelemetryItem } from '../types/mepSchemas';

export const MEP_QUERY_KEY = ['mep', 'telemetry'];

export function useMep() {
  const { data: telemetry = [], isLoading } = useQuery<ScadaTelemetryItem[]>({
    queryKey: MEP_QUERY_KEY,
    queryFn: () => mepApi.getTelemetry(),
  });

  return {
    telemetry,
    isLoading,
  };
}
