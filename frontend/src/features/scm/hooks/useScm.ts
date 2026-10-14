import { useQuery } from '@tanstack/react-query';
import { scmApi } from '../api/scmApi';

export const SCM_QUERY_KEY = ['scm', 'shipments'];

export function useScm() {
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: SCM_QUERY_KEY,
    queryFn: () => scmApi.getShipments(),
  });

  return {
    shipments,
    isLoading,
  };
}
