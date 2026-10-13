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
      employeeCode: emp.employeeCode || `EMP-${Date.now().toString().slice(-4)}`,
      fullName: emp.fullName || 'New Employee',
      firstName: emp.firstName || 'New',
      lastName: emp.lastName || 'Employee',
      department: emp.department || 'Production',
      designation: emp.designation || 'Operator',
      role: emp.role || 'Operator',
      shift: emp.shift || 'Shift A',
      status: emp.status || 'Active',
      employmentType: emp.employmentType || 'Permanent',
      joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
      email: emp.email || '',
      phone: emp.phone || '',
      gender: emp.gender || 'Male',
      bloodGroup: emp.bloodGroup || 'O+',
      emergencyContact: emp.emergencyContact || '',
      plantId: emp.plantId || 'plant-01',
      skills: emp.skills || [],
      trainingsCompleted: emp.trainingsCompleted || [],
      documents: emp.documents || [],
      salaryDetails: emp.salaryDetails || { ctcAnnual: 300000, basicMonthly: 15000, hraMonthly: 6000, allowancesMonthly: 4000 },
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
