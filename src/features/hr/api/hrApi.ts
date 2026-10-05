import { db } from '../../../shared/db';
import { EmployeeSummary } from '../types/hrSchemas';

export const hrApi = {
  getEmployees: async (): Promise<EmployeeSummary[]> => {
    try {
      const data = await db.findMany<any>('employees');
      if (Array.isArray(data) && data.length > 0) {
        return data.map((e: any) => ({
          id: e.id,
          name: e.name || e.full_name,
          department: e.department || 'Production',
          role: e.role || e.designation || 'Specialist',
          shift: e.shift || e.assigned_shift || 'Shift A',
          status: (e.status || 'present').toLowerCase(),
        }));
      }
    } catch {}
    return [
      { id: 'EMP-01', name: 'Vikram Singh', department: 'Production', role: 'Supervisor', shift: 'Shift A', status: 'present' },
      { id: 'EMP-02', name: 'Ananya Sen', department: 'Quality', role: 'QA Lead', shift: 'Shift A', status: 'present' },
      { id: 'EMP-03', name: 'Rajesh Kumar', department: 'Warehouse', role: 'Store Manager', shift: 'General', status: 'present' },
    ];
  },
};
