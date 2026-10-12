import { z } from 'zod';

export const userRoleUpdateSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(2),
  plantId: z.string().min(1),
  permissions: z.array(z.string()),
});

export type UserRoleUpdateFormValues = z.infer<typeof userRoleUpdateSchema>;
