import { z } from 'zod';

export const PlantSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  location: z.string().nullable(),
  isActive: z.boolean(),
  version: z.number(),
});
export type Plant = z.infer<typeof PlantSchema>;

export const RoleSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
});
export type Role = z.infer<typeof RoleSchema>;

export const UserStatusSchema = z.enum(['ACTIVE', 'LOCKED', 'SUSPENDED']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const ManagedUserSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  email: z.string(),
  fullName: z.string(),
  phone: z.string().nullable(),
  badgeId: z.string().nullable(),
  department: z.string().nullable(),
  designation: z.string().nullable(),
  assignedShift: z.string().nullable(),
  status: UserStatusSchema,
  mustChangePassword: z.boolean(),
  lastLoginAt: z.coerce.string().nullable(),
  version: z.number(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
  roleId: z.string(),
  roleCode: z.string(),
  roleName: z.string(),
  plantIds: z.array(z.string()),
});
export type ManagedUser = z.infer<typeof ManagedUserSchema>;

export const AbilityRuleSchema = z.object({
  action: z.union([z.string(), z.array(z.string())]),
  subject: z.union([z.string(), z.array(z.string())]),
  conditions: z.record(z.string(), z.unknown()).optional(),
  inverted: z.boolean().optional(),
});
export type AbilityRule = z.infer<typeof AbilityRuleSchema>;

export const MeSchema = ManagedUserSchema.extend({
  plants: z.array(PlantSchema),
  activePlantId: z.string().nullable(),
  activeShift: z.string().nullable(),
  abilityRules: z.array(AbilityRuleSchema),
});
export type Me = z.infer<typeof MeSchema>;

export const PreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  landingView: z.string(),
  language: z.string(),
  timezone: z.string(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  notifications: z.record(z.string(), z.boolean()),
  version: z.number(),
});
export type Preferences = z.infer<typeof PreferencesSchema>;

export const AuditEntrySchema = z.object({
  id: z.coerce.string(),
  action: z.string(),
  changedFields: z.array(z.string()).nullish(),
  oldValues: z.record(z.string(), z.unknown()).nullish(),
  newValues: z.record(z.string(), z.unknown()).nullish(),
  performedAt: z.coerce.string(),
  performedBy: z.string().nullish(),
  performedByName: z.string(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const PageMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type PageMeta = z.infer<typeof PageMetaSchema>;

export interface UserListParams {
  page: number;
  limit: number;
  search?: string;
  status?: UserStatus;
  roleId?: string;
}

export interface CreateUserInput {
  fullName: string;
  username: string;
  email: string;
  roleId: string;
  phone?: string | null;
  badgeId?: string | null;
  department?: string | null;
  designation?: string | null;
  assignedShift?: string | null;
  plantIds: string[];
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'username' | 'email'>> & { version: number };
