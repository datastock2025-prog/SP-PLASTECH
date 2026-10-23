import { api } from '@/src/lib/api-client';
import {
  HrEmployee,
  HrAttendanceRecord,
  HrDepartment,
} from '../model/hrSchemas';
import {
  INITIAL_HR_DEPARTMENTS,
} from '@/src/data/hrData';

export const hrApi = {
  getEmployees: async (): Promise<HrEmployee[]> => {
    try {
      const res = await api.get<any>('/employees', {
        params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) return rows;
    } catch (e) {
      console.debug('[hrApi.getEmployees] REST notice:', e);
    }
    return [];
  },

  createEmployee: async (emp: Partial<HrEmployee>): Promise<HrEmployee> => {
    const newEmp: HrEmployee = {
      id: emp.id || `EMP-${Date.now().toString().slice(-4)}`,
      firstName: emp.firstName || 'New',
      lastName: emp.lastName || 'Employee',
      gender: emp.gender || 'Male',
      dob: emp.dob || '1990-01-01',
      bloodGroup: emp.bloodGroup || 'O+',
      department: emp.department || 'Production',
      designation: emp.designation || 'Operator',
      employeeType: emp.employeeType || 'Permanent',
      status: emp.status || 'Active',
      plant: emp.plant || 'Plant 1',
      shift: emp.shift || 'Shift A',
      supervisor: emp.supervisor || 'Production Manager',
      mobile: emp.mobile || '+91 98765 43210',
      email: emp.email || 'employee@spplastech.com',
      nationalIdMasked: emp.nationalIdMasked || 'XXXX-XXXX-1234',
      bankAccountMasked: emp.bankAccountMasked || 'XXXX-XXXX-5678',
      emergencyContact: emp.emergencyContact || {
        name: 'Emergency Contact',
        relationship: 'Spouse',
        phone: '+91 98765 00000',
      },
      address: emp.address || 'Ahmedabad, Gujarat',
      joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
      noticePeriodDays: emp.noticePeriodDays || 30,
      grade: emp.grade || 'L1',
      costCenter: emp.costCenter || 'CC-PROD-01',
      skills: emp.skills || [],
      certifications: emp.certifications || [],
      assignedTrainings: emp.assignedTrainings || [],
      issuedPpe: emp.issuedPpe || [],
      leaveBalances: emp.leaveBalances || {
        casual: 12,
        sick: 10,
        earned: 15,
        compOff: 0,
      },
    };

    try {
      const res = await api.post<any>('/employees', newEmp);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object') return row;
    } catch (e) {
      console.debug('[hrApi.createEmployee] REST notice:', e);
    }

    return newEmp;
  },

  updateEmployee: async (emp: HrEmployee): Promise<HrEmployee> => {
    if (emp.id) {
      try {
        const res = await api.patch<any>(`/employees/${encodeURIComponent(emp.id)}`, emp);
        const row = res?.data?.data || res?.data;
        if (row && typeof row === 'object') return row;
      } catch (e) {
        console.debug('[hrApi.updateEmployee] REST notice:', e);
      }
    }
    return emp;
  },

  getAttendance: async (): Promise<HrAttendanceRecord[]> => {
    try {
      const res = await api.get<any>('/attendance-records', {
        params: { limit: 100, sortBy: 'date', sortOrder: 'desc', includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) return rows;
    } catch (e) {
      console.debug('[hrApi.getAttendance] REST notice:', e);
    }
    return [];
  },

  getDepartments: async (): Promise<HrDepartment[]> => {
    return INITIAL_HR_DEPARTMENTS;
  },
};
