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

export const hrApi = {
  getEmployees: async (): Promise<HrEmployee[]> => {
    try {
      const data = await db.findMany<HrEmployee>('employees');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return INITIAL_HR_EMPLOYEES;
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
    };
    try {
      await db.upsert('employees', newEmp, 'id');
    } catch {}
    return newEmp;
  },

  updateEmployee: async (emp: HrEmployee): Promise<HrEmployee> => {
    try {
      await db.upsert('employees', emp, 'id');
    } catch {}
    return emp;
  },

  getAttendance: async (_date?: string): Promise<HrAttendanceRecord[]> => {
    try {
      const data = await db.findMany<HrAttendanceRecord>('attendance_records');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return INITIAL_HR_ATTENDANCE;
  },

  getDepartments: async (): Promise<HrDepartment[]> => {
    return INITIAL_HR_DEPARTMENTS;
  },
};
