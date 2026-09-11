import { useQuery } from '@tanstack/react-query';
import { hrApi } from '../api/hrApi';
import { EmployeeSummary } from '../types/hrSchemas';

export const HR_QUERY_KEY = ['hr', 'employees'];

export function useHr() {
  const { data: employees = [], isLoading } = useQuery<EmployeeSummary[]>({
    queryKey: HR_QUERY_KEY,
    queryFn: () => hrApi.getEmployees(),
  });

  return {
    employees,
    isLoading,
  };
}
