import { apiClient } from '../../../shared/api/client';
import { EmployeeSummary } from '../types/hrSchemas';

export const hrApi = {
  getEmployees: async (): Promise<EmployeeSummary[]> => {
    try {
      const response = await apiClient.get<EmployeeSummary[]>('/hr/employees');
      return response.data;
    } catch {
      return [
        { id: 'EMP-01', name: 'Vikram Singh', department: 'Production', role: 'Supervisor', shift: 'Shift A', status: 'present' },
        { id: 'EMP-02', name: 'Ananya Sen', department: 'Quality', role: 'QA Lead', shift: 'Shift A', status: 'present' },
        { id: 'EMP-03', name: 'Rajesh Kumar', department: 'Warehouse', role: 'Store Manager', shift: 'General', status: 'present' },
      ];
    }
  },
};
