import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { manufacturingApi } from '../api/manufacturingApi';
import { WorkOrder, MachineMaster } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';
import { WorkOrderLogFormValues, CreateWorkOrderFormValues } from '../types/manufacturingSchemas';
import { useUiStore } from '../../../shared/stores/uiStore';

export const WORK_ORDERS_QUERY_KEY = ['manufacturing', 'workOrders'];
export const MACHINES_QUERY_KEY = ['manufacturing', 'machines'];
export const MOLDS_QUERY_KEY = ['manufacturing', 'molds'];

export function useManufacturing() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  const { data: workOrders = [], isLoading: isWOsLoading } = useQuery<WorkOrder[]>({
    queryKey: WORK_ORDERS_QUERY_KEY,
    queryFn: () => manufacturingApi.getWorkOrders(),
  });

  const { data: machines = [], isLoading: isMachinesLoading } = useQuery<MachineMaster[]>({
    queryKey: MACHINES_QUERY_KEY,
    queryFn: () => manufacturingApi.getMachines(),
  });

  const { data: molds = [], isLoading: isMoldsLoading } = useQuery<MoldMaster[]>({
    queryKey: MOLDS_QUERY_KEY,
    queryFn: () => manufacturingApi.getMolds(),
  });

  const createWOMutation = useMutation({
    mutationFn: (data: CreateWorkOrderFormValues) => manufacturingApi.createWorkOrder(data),
    onSuccess: (newWO) => {
      queryClient.setQueryData<WorkOrder[]>(WORK_ORDERS_QUERY_KEY, (old = []) => [newWO, ...old]);
      showToast(`Work Order ${newWO.id} scheduled successfully`);
    },
  });

  const logOutputMutation = useMutation({
    mutationFn: (data: WorkOrderLogFormValues) => manufacturingApi.logOutput(data),
    onSuccess: (updatedWO) => {
      queryClient.setQueryData<WorkOrder[]>(WORK_ORDERS_QUERY_KEY, (old = []) =>
        old.map((w) => (w.id === updatedWO.id ? updatedWO : w))
      );
      showToast(`Logged production for ${updatedWO.id}`);
    },
  });

  return {
    workOrders,
    machines,
    molds,
    isLoading: isWOsLoading || isMachinesLoading || isMoldsLoading,
    createWorkOrder: createWOMutation.mutateAsync,
    isCreatingWO: createWOMutation.isPending,
    logOutput: logOutputMutation.mutateAsync,
    isLoggingOutput: logOutputMutation.isPending,
  };
}
