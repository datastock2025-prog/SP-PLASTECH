import { useQuery } from '@tanstack/react-query';
import { engineeringApi } from '../api/engineeringApi';
import { BomMaster } from '../../../types';

export const BOM_QUERY_KEY = ['engineering', 'boms'];

export function useEngineering() {
  const { data: boms = [], isLoading } = useQuery<BomMaster[]>({
    queryKey: BOM_QUERY_KEY,
    queryFn: () => engineeringApi.getBoms(),
  });

  return {
    boms,
    isLoading,
  };
}
