import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { api } from '@/src/lib/api-client';
import {
  HrEmployee,
  HrAttendanceRecord,
  HrDepartment,
} from '../model/hrSchemas';
import {
  INITIAL_HR_DEPARTMENTS,
} from '@/src/data/hrData';

export function useEmployees(filter?: any) {
  return useQuery<HrEmployee[]>({
    queryKey: [...queryKeys.hr.employees(), filter],
    queryFn: async () => {
      const res = await api.get<any>('/employees', {
        params: { limit: filter?.limit ?? 100, page: filter?.page ?? 1, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true, ...filter },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) return rows;
      return [];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useSaveEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (emp: HrEmployee) => {
      if (emp.id) {
        try {
          const res = await api.patch<any>(`/employees/${encodeURIComponent(emp.id)}`, emp);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      } else {
        try {
          const res = await api.post<any>('/employees', emp);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      }
      return emp;
    },
    onSuccess: (savedEmp) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hr.employees() });
      broadcastLocalMutation('EMPLOYEES', 'UPDATE', savedEmp);
    },
  });
}

export function useAttendance(date?: string, filter?: any) {
  return useQuery<HrAttendanceRecord[]>({
    queryKey: queryKeys.hr.attendance({ date, ...filter }),
    queryFn: async () => {
      const res = await api.get<any>('/attendance-records', {
        params: {
          ...(date ? { 'where[date]': date } : {}),
          limit: filter?.limit ?? 100,
          page: filter?.page ?? 1,
          includeTotal: true,
          ...filter,
        },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) return rows;
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useShiftRosters() {
  return useQuery({
    queryKey: queryKeys.hr.shiftRosters(),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/shift-rosters', { params: { limit: 100 } });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch {}
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useHr() {
  const { data: employees = [], isLoading: isLoadingEmp } = useEmployees();
  const { data: attendance = [], isLoading: isLoadingAtt } = useAttendance();

  return {
    employees,
    attendance,
    departments: INITIAL_HR_DEPARTMENTS,
    isLoading: isLoadingEmp || isLoadingAtt,
  };
}
