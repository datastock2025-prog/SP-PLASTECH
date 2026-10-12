import { z } from 'zod';

export const str = (max = 200) => z.string().trim().min(1).max(max);
export const optStr = (max = 200) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));
export const idParam = z.string().trim().min(1).max(64);

export const CreateUserSchema = z.object({
  fullName: str(120),
  username: optStr(60),
  email: z.string().trim().email().max(160),
  phone: optStr(30),
  badgeId: optStr(40),
  department: optStr(60),
  designation: optStr(60),
  assignedShift: optStr(40),
  roleId: idParam,
  plantIds: z.array(idParam).optional().default([]),
});

export const UpdateUserSchema = z.object({
  fullName: optStr(120),
  phone: optStr(30),
  badgeId: optStr(40),
  department: optStr(60),
  designation: optStr(60),
  assignedShift: optStr(40),
  roleId: idParam.optional(),
  status: z.enum(['ACTIVE', 'LOCKED', 'SUSPENDED']).optional(),
  plantIds: z.array(idParam).optional(),
  version: z.number().int().min(0),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export const SelectPlantShiftSchema = z.object({
  plantId: idParam,
  shift: str(40),
});

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
  landingView: optStr(60),
  language: optStr(20),
  timezone: optStr(40),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  notifications: z.record(z.string(), z.boolean()).optional(),
  version: z.number().int().min(0).optional(),
});
