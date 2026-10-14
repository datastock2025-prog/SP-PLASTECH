import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { db } from '@/src/shared/db';
import {
  HrEmployee,
  HrAttendanceRecord,
  HrDepartment,
} from '../model/hrSchemas';
import {
  INITIAL_HR_EMPLOYEES,
  INITIAL_HR_ATTENDANCE,
  INITIAL_HR_DEPARTMENTS,
} from '@/src/data/hrData';
import { hrApi } from './hrApi';

export function useEmployees() {
  return useQuery<HrEmployee[]>({
    queryKey: queryKeys.hr.employees(),
    queryFn: async () => {
      try {
        const res = await db.findMany<HrEmployee>('employees', {
          orderBy: { column: 'employee_code', ascending: true },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useEmployees] fallback note:', e);
      }
      return INITIAL_HR_EMPLOYEES;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useSaveEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (emp: HrEmployee) => {
      try {
        await db.upsert('employees', emp, 'id');
      } catch (e) {
        console.debug('[useSaveEmployee] note:', e);
      }
      return emp;
    },
    onSuccess: (savedEmp) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hr.employees() });
      broadcastLocalMutation('EMPLOYEES', 'UPDATE', savedEmp);
    },
  });
}

export function useAttendance(date?: string) {
  return useQuery<HrAttendanceRecord[]>({
    queryKey: queryKeys.hr.attendance(date),
    queryFn: async () => {
      try {
        const res = await db.findMany<HrAttendanceRecord>('attendance_records', {
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useAttendance] fallback note:', e);
      }
      return INITIAL_HR_ATTENDANCE;
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
        const res = await db.findMany('shift_rosters', { limit: 100 });
        if (Array.isArray(res) && res.length > 0) return res;
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
