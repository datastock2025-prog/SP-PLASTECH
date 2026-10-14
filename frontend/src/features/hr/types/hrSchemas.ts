import { z } from 'zod';

export const attendanceLogSchema = z.object({
  employeeId: z.string().min(1, 'Employee badge ID is required'),
  shift: z.string().min(1, 'Shift is required'),
  action: z.enum(['check_in', 'check_out']),
  timestamp: z.string().optional(),
});

export type AttendanceLogFormValues = z.infer<typeof attendanceLogSchema>;

export interface EmployeeSummary {
  id: string;
  name: string;
  department: string;
  role: string;
  shift: string;
  status: 'present' | 'absent' | 'on_leave';
}
