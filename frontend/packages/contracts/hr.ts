import { z } from 'zod';

export const EmployeeStatusEnum = z.enum([
  'Active',
  'On Leave',
  'Resigned',
  'Suspended',
  'Probation',
]);

export const SkillLevelEnum = z.enum([
  'Trainee',
  'Semi-Skilled',
  'Skilled',
  'Expert',
]);

export const AttendanceStatusEnum = z.enum([
  'Present',
  'Absent',
  'Half Day',
  'On Leave',
  'Overtime',
]);

export const EmployeeSchema = z.object({
  id: z.string().optional(),
  employeeCode: z.string().min(1, 'Employee code is required'),
  fullName: z.string().min(1, 'Full name is required'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  role: z.string().default('Operator'),
  shift: z.string().default('Shift A'),
  status: EmployeeStatusEnum.default('Active'),
  email: z.string().optional(),
  phone: z.string().optional(),
  joiningDate: z.string().min(1, 'Joining date is required'),
  skillLevel: SkillLevelEnum.default('Skilled'),
  plantId: z.string().default('plant-01'),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateEmployeeInputSchema = EmployeeSchema.omit({ id: true });
export const UpdateEmployeeInputSchema = EmployeeSchema.partial().extend({
  version: z.number().int().min(1),
});

export const AttendanceRecordSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  employeeName: z.string().default(''),
  date: z.string().min(1, 'Date is required'),
  shift: z.string().default('Shift A'),
  status: AttendanceStatusEnum.default('Present'),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  overtimeHours: z.number().min(0).default(0),
});

export const ShiftRosterSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  employeeName: z.string().default(''),
  shiftCode: z.string().min(1, 'Shift code is required'),
  date: z.string().min(1, 'Date is required'),
  department: z.string().default('Production'),
});

export const PayrollRunSchema = z.object({
  id: z.string().optional(),
  month: z.string().min(1, 'Month is required'),
  year: z.number().int().min(2020),
  totalGrossPay: z.number().min(0).default(0),
  totalDeductions: z.number().min(0).default(0),
  totalNetPay: z.number().min(0).default(0),
  employeeCount: z.number().int().min(0).default(0),
  status: z.enum(['Draft', 'Processed', 'Approved', 'Paid']).default('Draft'),
});

export const SkillCertificationSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  skillName: z.string().min(1, 'Skill name is required'),
  level: z.enum([
    'Level 1 - Learner',
    'Level 2 - Supervised',
    'Level 3 - Autonomous',
    'Level 4 - Trainer',
  ]).default('Level 3 - Autonomous'),
  certifiedDate: z.string().min(1),
  expiryDate: z.string().optional(),
});

export type EmployeeContract = z.infer<typeof EmployeeSchema>;
export type CreateEmployeeContract = z.infer<typeof CreateEmployeeInputSchema>;
export type UpdateEmployeeContract = z.infer<typeof UpdateEmployeeInputSchema>;
export type AttendanceRecordContract = z.infer<typeof AttendanceRecordSchema>;
export type ShiftRosterContract = z.infer<typeof ShiftRosterSchema>;
export type PayrollRunContract = z.infer<typeof PayrollRunSchema>;
export type SkillCertificationContract = z.infer<typeof SkillCertificationSchema>;
