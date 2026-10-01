import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../services/api';

export interface EmployeeRecord {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string;
  designation: string;
  shift: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'SUSPENDED';
  joinedDate: string;
}

export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.hr.employees(),
    queryFn: async () => {
      const response = await apiClient.get<EmployeeRecord[]>('/api/v1/hr/employees');
      return response.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useSaveEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (emp: Partial<EmployeeRecord>) => {
      if (emp.id) {
        const response = await apiClient.put<EmployeeRecord>(`/api/v1/hr/employees/${emp.id}`, emp);
        return response.data;
      }
      const response = await apiClient.post<EmployeeRecord>('/api/v1/hr/employees', emp);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hr.employees() });
    },
  });
}

export function useAttendance(date?: string) {
  return useQuery({
    queryKey: queryKeys.hr.attendance(date),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/api/v1/hr/attendance', { params: date ? { date } : undefined });
      return response.data || [];
    },
  });
}

export function useShiftRosters() {
  return useQuery({
    queryKey: queryKeys.hr.shiftRosters(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/api/v1/hr/shift-rosters');
      return response.data || [];
    },
  });
}
