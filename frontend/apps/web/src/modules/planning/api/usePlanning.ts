import { useQuery } from '@tanstack/react-query';
import { planningApi } from './planningApi';

export const PLANNING_QUERY_KEYS = {
  plannedOrders: ['planning', 'plannedOrders'],
  mrpRuns: ['planning', 'mrpRuns'],
  shipments: ['planning', 'shipments'],
};

export function usePlannedOrders() {
  return useQuery({
    queryKey: PLANNING_QUERY_KEYS.plannedOrders,
    queryFn: () => planningApi.getPlannedOrders(),
    staleTime: 1000 * 30,
  });
}

export function useMrpRuns() {
  return useQuery({
    queryKey: PLANNING_QUERY_KEYS.mrpRuns,
    queryFn: () => planningApi.getMrpRuns(),
    staleTime: 1000 * 30,
  });
}

export function useShipments() {
  return useQuery({
    queryKey: PLANNING_QUERY_KEYS.shipments,
    queryFn: () => planningApi.getShipments(),
    staleTime: 1000 * 30,
  });
}

export function usePlanning() {
  const { data: plannedOrders = [], isLoading: isLoadingOrders } = usePlannedOrders();
  const { data: mrpRuns = [], isLoading: isLoadingRuns } = useMrpRuns();
  const { data: shipments = [], isLoading: isLoadingShipments } = useShipments();

  return {
    plannedOrders,
    mrpRuns,
    shipments,
    isLoading: isLoadingOrders || isLoadingRuns || isLoadingShipments,
  };
}

// Backwards compatibility alias
export const useScm = usePlanning;
