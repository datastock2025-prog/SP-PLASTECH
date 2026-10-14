import { z } from 'zod';
import {
  AuditEntrySchema, ManagedUserSchema, MeSchema, PageMetaSchema, PlantSchema, PreferencesSchema, RoleSchema,
  type CreateUserInput, type UpdateUserInput, type UserListParams,
} from './types';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

async function request(method: string, path: string, body?: unknown): Promise<any> {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    cache: 'no-store',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return null;
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON body (e.g. gateway offline)
  }
  if (!res.ok) {
    const e = json?.error;
    const detail = Array.isArray(e?.details) && e.details[0]?.message ? `: ${e.details[0].message}` : '';
    throw new ApiError(
      res.status,
      typeof e === 'object' && e?.code ? e.code : 'HTTP_ERROR',
      typeof e === 'object' && e?.message ? `${e.message}${detail}` : res.status >= 500 ? 'Server is unavailable. Please try again.' : 'Request failed',
      e?.details,
    );
  }
  return json;
}

const one = <T extends z.ZodTypeAny>(schema: T, json: any) => schema.parse(json.data) as z.infer<T>;
const page = <T extends z.ZodTypeAny>(schema: T, json: any) => ({
  data: z.array(schema).parse(json.data) as z.infer<T>[],
  meta: PageMetaSchema.parse(json.meta),
});

export const identityApi = {
  // --- authentication (Better Auth) ---
  async signIn(identifier: string, password: string) {
    const id = identifier.trim();
    const isEmail = id.includes('@');
    const res = await fetch(isEmail ? '/api/auth/sign-in/email' : '/api/auth/sign-in/username', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEmail ? { email: id, password } : { username: id, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      const msg =
        res.status === 429 ? 'Too many attempts. Please wait a minute and try again.'
        : res.status === 403 ? (j?.message ?? 'Account is locked or suspended. Contact your administrator.')
        : res.status >= 500 || res.status === 404 ? 'Authentication service is unavailable.'
        : 'Invalid username or password.';
      throw new ApiError(res.status, 'AUTH_FAILED', msg);
    }
  },
  async signOut() {
    await fetch('/api/auth/sign-out', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}',
    }).catch(() => {});
  },

  // --- current user ---
  me: async () => one(MeSchema, await request('GET', '/api/v1/me')),
  selectContext: (plantId: string, shift: string) => request('POST', '/api/v1/me/context', { plantId, shift }),
  updateMe: async (b: { version: number; fullName?: string; phone?: string | null; department?: string | null; designation?: string | null }) =>
    one(ManagedUserSchema, await request('PATCH', '/api/v1/me', b)),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('POST', '/api/v1/me/password', { currentPassword, newPassword }),
  preferences: async () => one(PreferencesSchema, await request('GET', '/api/v1/me/preferences')),
  updatePreferences: async (b: Partial<z.infer<typeof PreferencesSchema>> & { version: number }) =>
    one(PreferencesSchema, await request('PATCH', '/api/v1/me/preferences', b)),

  // --- reference data ---
  roles: async () => z.array(RoleSchema).parse((await request('GET', '/api/v1/roles')).data),
  plants: async () => z.array(PlantSchema).parse((await request('GET', '/api/v1/plants')).data),
  systemHealth: async () => z.object({
    status: z.string(), dbLatencyMs: z.number(), activeSessions: z.number(), userCount: z.number(),
    cpuCores: z.number(), loadPct: z.number(), memoryTotalGb: z.number(), memoryUsedGb: z.number(), uptimeSeconds: z.number(),
  }).parse((await request('GET', '/api/v1/system/health')).data),
  createPlant: async (b: { code: string; name: string; location?: string | null }) =>
    one(PlantSchema, await request('POST', '/api/v1/plants', b)),
  updatePlant: async (id: string, b: { version: number; code: string; name: string; location?: string | null }) =>
    one(PlantSchema, await request('PATCH', `/api/v1/plants/${id}`, b)),
  deletePlant: async (id: string) => { await request('DELETE', `/api/v1/plants/${id}`); },

  // --- user management ---
  users: async (p: UserListParams) => {
    const q = new URLSearchParams({ page: String(p.page), limit: String(p.limit) });
    if (p.search) q.set('search', p.search);
    if (p.status) q.set('status', p.status);
    if (p.roleId) q.set('roleId', p.roleId);
    return page(ManagedUserSchema, await request('GET', `/api/v1/users?${q}`));
  },
  createUser: async (b: CreateUserInput) => {
    const j = await request('POST', '/api/v1/users', b);
    return { user: one(ManagedUserSchema, j), tempPassword: z.string().parse(j.meta.tempPassword) };
  },
  updateUser: async (id: string, b: UpdateUserInput) =>
    one(ManagedUserSchema, await request('PATCH', `/api/v1/users/${id}`, b)),
  resetPassword: async (id: string) =>
    z.string().parse((await request('POST', `/api/v1/users/${id}/reset-password`)).meta.tempPassword),
  setLocked: async (id: string, locked: boolean) =>
    one(ManagedUserSchema, await request('POST', `/api/v1/users/${id}/lock`, { locked })),
  deleteUser: (id: string) => request('DELETE', `/api/v1/users/${id}`),
  history: async (id: string, p = 1) =>
    page(AuditEntrySchema, await request('GET', `/api/v1/users/${id}/history?page=${p}&limit=20`)),
};
