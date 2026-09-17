import { z } from 'zod';

export const LoginDtoSchema = z.object({
  email: z.string().email('Valid corporate email is required'),
  password: z.string().min(4, 'Password / PIN is required').optional(),
  pin: z.string().min(4, 'Operator PIN is required').optional(),
  tenantId: z.string().optional(),
  rememberMe: z.boolean().optional(),
  deviceInfo: z.string().optional(),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;

export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  mfaRequired?: boolean;
  mfaChallengeId?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenantId: string;
    tenantName: string;
    permissions: string[];
    avatarColor?: string;
    initials?: string;
    mfaEnabled: boolean;
  };
}
