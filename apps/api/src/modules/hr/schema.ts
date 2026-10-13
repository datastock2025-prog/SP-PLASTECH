import { z } from 'zod';

export const CreateEmployeeInputSchema = z.object({
  employeeCode: z.string().trim().min(1),
  fullName: z.string().trim().min(1),
  department: z.string().trim().min(1),
  designation: z.string().trim().min(1),
  role: z.string().trim().default('Operator'),
  shift: z.string().trim().default('Shift A'),
  status: z.enum(['Active', 'On Leave', 'Resigned', 'Suspended', 'Probation']).default('Active'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  joiningDate: z.string().trim().min(1),
  skillLevel: z.enum(['Trainee', 'Semi-Skilled', 'Skilled', 'Expert']).default('Skilled'),
  plantId: z.string().trim().default('plant-01'),
});

export const UpdateEmployeeInputSchema = CreateEmployeeInputSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CreateAttendanceRecordInputSchema = z.object({
  employeeId: z.string().trim().min(1),
  date: z.string().trim().min(1),
  shift: z.string().trim().default('Shift A'),
  status: z.enum(['Present', 'Absent', 'Half Day', 'On Leave', 'Overtime']).default('Present'),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
});
