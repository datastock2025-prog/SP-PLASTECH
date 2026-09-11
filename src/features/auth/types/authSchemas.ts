import { z } from 'zod';
import { AuthUser } from '../../../types';

export const loginWithPinSchema = z.object({
  userId: z.string().min(1, 'Please select or enter an operator identity'),
  pin: z.string().length(4, 'PIN must be exactly 4 numeric digits').regex(/^\d+$/, 'PIN must contain numbers only'),
  plantId: z.string().min(1, 'Plant selection is required'),
  shiftId: z.string().min(1, 'Shift selection is required'),
});

export type LoginWithPinFormValues = z.infer<typeof loginWithPinSchema>;

export const loginWithCredentialsSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  plantId: z.string().min(1, 'Plant selection is required'),
  shiftId: z.string().min(1, 'Shift selection is required'),
});

export type LoginWithCredentialsFormValues = z.infer<typeof loginWithCredentialsSchema>;

export type { AuthUser };
