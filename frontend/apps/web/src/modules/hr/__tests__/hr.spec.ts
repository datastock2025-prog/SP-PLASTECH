import { describe, it, expect } from 'vitest';
import {
  EmployeeSchema,
  CreateEmployeeInputSchema,
  UpdateEmployeeInputSchema,
  AttendanceRecordSchema,
  ShiftRosterSchema,
  PayrollRunSchema,
  SkillCertificationSchema,
} from '@/packages/contracts/hr';

describe('HR Module Contracts & Validation', () => {
  it('validates a valid EmployeeSchema payload', () => {
    const rawEmp = {
      id: 'emp-uuid-001',
      employeeCode: 'EMP-0104',
      fullName: 'Ramesh Patel',
      department: 'Injection Molding Production',
      designation: 'Senior Machine Operator',
      role: 'Operator',
      shift: 'Shift A',
      status: 'Active' as const,
      email: 'ramesh.patel@splastech.com',
      phone: '+91 98765 43210',
      joiningDate: '2023-04-15',
      skillLevel: 'Expert' as const,
      plantId: 'plant-01',
      version: 1,
    };

    const parsed = EmployeeSchema.safeParse(rawEmp);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.employeeCode).toBe('EMP-0104');
      expect(parsed.data.fullName).toBe('Ramesh Patel');
      expect(parsed.data.skillLevel).toBe('Expert');
      expect(parsed.data.status).toBe('Active');
    }
  });

  it('rejects an employee without code or full name', () => {
    const invalid = {
      employeeCode: '',
      fullName: '',
      department: 'Production',
      designation: 'Operator',
      joiningDate: '2023-04-15',
    };

    const parsed = EmployeeSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdateEmployeeInputSchema with OCC version check', () => {
    const update = {
      status: 'On Leave' as const,
      shift: 'Shift B',
      version: 3,
    };

    const parsed = UpdateEmployeeInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(3);
      expect(parsed.data.status).toBe('On Leave');
      expect(parsed.data.shift).toBe('Shift B');
    }
  });

  it('validates an AttendanceRecordSchema payload', () => {
    const rawAtt = {
      id: 'att-uuid-001',
      employeeId: 'EMP-0104',
      employeeName: 'Ramesh Patel',
      date: '2026-10-13',
      shift: 'Shift A',
      status: 'Present' as const,
      checkIn: '06:55 AM',
      checkOut: '03:10 PM',
      overtimeHours: 0.5,
    };

    const parsed = AttendanceRecordSchema.safeParse(rawAtt);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.employeeId).toBe('EMP-0104');
      expect(parsed.data.status).toBe('Present');
      expect(parsed.data.overtimeHours).toBe(0.5);
    }
  });

  it('validates a ShiftRosterSchema payload', () => {
    const rawRoster = {
      id: 'roster-uuid-001',
      employeeId: 'EMP-0104',
      employeeName: 'Ramesh Patel',
      shiftCode: 'Shift A (07:00 - 15:30)',
      date: '2026-10-14',
      department: 'Production',
    };

    const parsed = ShiftRosterSchema.safeParse(rawRoster);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.employeeId).toBe('EMP-0104');
      expect(parsed.data.shiftCode).toContain('Shift A');
    }
  });

  it('validates a PayrollRunSchema payload', () => {
    const rawPayroll = {
      id: 'pr-uuid-001',
      month: 'September',
      year: 2026,
      totalGrossPay: 1850000,
      totalDeductions: 195000,
      totalNetPay: 1655000,
      employeeCount: 48,
      status: 'Approved' as const,
    };

    const parsed = PayrollRunSchema.safeParse(rawPayroll);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.month).toBe('September');
      expect(parsed.data.totalNetPay).toBe(1655000);
      expect(parsed.data.employeeCount).toBe(48);
      expect(parsed.data.status).toBe('Approved');
    }
  });
});
