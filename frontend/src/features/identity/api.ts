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
        : res.status === 403 ? (j?.message ?? 'Account is locked due to security policy. Please wait or contact administrator.')
        : res.status >= 500 || res.status === 404 ? 'Authentication service is unavailable.'
        : 'Invalid username or password.';
      throw new ApiError(res.status, 'AUTH_FAILED', msg);
    }
    const data = await res.json().catch(() => ({}));
    return {
      twoFactorRequired: Boolean(data?.twoFactorRedirect || data?.requiresTwoFactor),
    };
  },
  async verifyTotp(code: string) {
    const res = await fetch('/api/auth/two-factor/verify-totp', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      throw new ApiError(res.status, 'MFA_FAILED', j?.message ?? 'Invalid two-factor authentication code.');
    }
    return await res.json().catch(() => ({}));
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

  // --- sessions (Protocol 1B) ---
  sessions: async () => (await request('GET', '/api/v1/me/sessions')).data,
  revokeSession: async (id: string) => request('DELETE', `/api/v1/me/sessions/${id}`),
  revokeOtherSessions: async () => request('POST', '/api/v1/me/sessions/revoke-others'),

  // --- security policy & login events (Protocol 1B) ---
  securityPolicy: async () => (await request('GET', '/api/v1/security-policy')).data,
  updateSecurityPolicy: async (b: any) => (await request('PATCH', '/api/v1/security-policy', b)).data,
  loginEvents: async (p: { page?: number; limit?: number; success?: boolean } = {}) => {
    const q = new URLSearchParams({ page: String(p.page || 1), limit: String(p.limit || 20) });
    if (p.success != null) q.set('success', String(p.success));
    return request('GET', `/api/v1/login-events?${q}`);
  },

  // --- reference data ---
  roles: async () => z.array(RoleSchema).parse((await request('GET', '/api/v1/roles')).data),
  plants: async () => z.array(PlantSchema).parse((await request('GET', '/api/v1/plants')).data),
  systemHealth: async () => z.object({
    status: z.string(), dbLatencyMs: z.number(), activeSessions: z.number(), userCount: z.number(),
    cpuCores: z.number(), loadPct: z.number(), memoryTotalGb: z.number(), memoryUsedGb: z.number(), uptimeSeconds: z.number(),
  }).parse((await request('GET', '/api/v1/system/health')).data),
  createPlant: async (b: {
    code: string;
    name: string;
    location?: string | null;
    gstin?: string | null;
    contactPerson?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    address?: string | null;
    isDefault?: boolean;
  }) => one(PlantSchema, await request('POST', '/api/v1/plants', b)),
  updatePlant: async (
    id: string,
    b: {
      version: number;
      code?: string;
      name?: string;
      location?: string | null;
      gstin?: string | null;
      contactPerson?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
      address?: string | null;
      isActive?: boolean;
      isDefault?: boolean;
    }
  ) => one(PlantSchema, await request('PATCH', `/api/v1/plants/${id}`, b)),
  setDefaultPlant: async (id: string) => request('POST', `/api/v1/plants/${id}/set-default`),
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
  resetPassword: async (id: string, options?: { password?: string; mustChangePassword?: boolean } | string) => {
    const body = typeof options === 'string' ? { password: options } : options;
    const res = await request('POST', `/api/v1/users/${id}/reset-password`, body);
    return z.string().parse(res.meta.tempPassword);
  },
  setLocked: async (id: string, locked: boolean) =>
    one(ManagedUserSchema, await request('POST', `/api/v1/users/${id}/lock`, { locked })),
  deleteUser: (id: string) => request('DELETE', `/api/v1/users/${id}`),
  history: async (id: string, p = 1) =>
    page(AuditEntrySchema, await request('GET', `/api/v1/users/${id}/history?page=${p}&limit=20`)),

  // --- RBAC & Governance (Protocol 1C) ---
  permissionCatalog: async () => (await request('GET', '/api/v1/permissions/catalog')).data,
  role: async (id: string) => (await request('GET', `/api/v1/roles/${id}`)).data,
  updateRolePermissions: async (id: string, version: number, permissions: any[]) =>
    (await request('PUT', `/api/v1/roles/${id}/permissions`, { version, permissions })).data,
  roleScreens: async (id: string) => (await request('GET', `/api/v1/roles/${id}/screens`)).data,
  updateRoleScreens: async (id: string, screens: string[]) =>
    (await request('PUT', `/api/v1/roles/${id}/screens`, { screens })).data,
  userGroups: async () => (await request('GET', '/api/v1/user-groups')).data,
  createUserGroup: async (b: { code: string; name: string; description?: string | null }) =>
    (await request('POST', '/api/v1/user-groups', b)).data,
  updateUserGroup: async (id: string, b: { name?: string; description?: string | null; isActive?: boolean }) =>
    (await request('PATCH', `/api/v1/user-groups/${id}`, b)).data,
  deleteUserGroup: async (id: string) => { await request('DELETE', `/api/v1/user-groups/${id}`); },
  sodRules: async () => (await request('GET', '/api/v1/sod-rules')).data,
  sodViolations: async () => (await request('GET', '/api/v1/sod-violations')).data,

  // --- Protocol 1D: Master Config & Numbering ---
  companySettings: async () => (await request('GET', '/api/v1/company-settings')).data,
  updateCompanySettings: async (b: any) => (await request('PATCH', '/api/v1/company-settings', b)).data,
  warehouseBins: async (warehouseId?: string) =>
    (await request('GET', warehouseId ? `/api/v1/warehouse-bins?warehouseId=${encodeURIComponent(warehouseId)}` : '/api/v1/warehouse-bins')).data,
  createWarehouseBin: async (b: any) => (await request('POST', '/api/v1/warehouse-bins', b)).data,
  shifts: async (plantId?: string) =>
    (await request('GET', plantId ? `/api/v1/shifts?plantId=${encodeURIComponent(plantId)}` : '/api/v1/shifts')).data,
  transporters: async () => (await request('GET', '/api/v1/transporters')).data,
  numberingSeries: async () => (await request('GET', '/api/v1/numbering-series')).data,
  nextDocNumber: async (seriesCode: string, plantId?: string) =>
    (await request('POST', '/api/v1/numbering-series/next', { seriesCode, plantId })).data,

  // --- Protocol 1E: Approvals, Governance, Audit Logs & Search ---
  approvalWorkflows: async () => (await request('GET', '/api/v1/approval-workflows')).data,
  createApprovalWorkflow: async (b: any) => (await request('POST', '/api/v1/approval-workflows', b)).data,
  approvalRequests: async (p: { status?: string; entityType?: string } = {}) => {
    const q = new URLSearchParams();
    if (p.status) q.set('status', p.status);
    if (p.entityType) q.set('entityType', p.entityType);
    return (await request('GET', `/api/v1/approval-requests${q.toString() ? `?${q}` : ''}`)).data;
  },
  createApprovalRequest: async (b: any) => (await request('POST', '/api/v1/approval-requests', b)).data,
  decideApprovalRequest: async (id: string, b: { action: 'APPROVE' | 'REJECT'; comments?: string }) =>
    (await request('POST', `/api/v1/approval-requests/${id}/decide`, b)).data,
  auditLogs: async (p: { cursor?: string; limit?: number; entityType?: string; action?: string } = {}) => {
    const q = new URLSearchParams();
    if (p.cursor) q.set('cursor', p.cursor);
    if (p.limit) q.set('limit', String(p.limit));
    if (p.entityType) q.set('entityType', p.entityType);
    if (p.action) q.set('action', p.action);
    return await request('GET', `/api/v1/audit-logs${q.toString() ? `?${q}` : ''}`);
  },
  search: async (term: string, limit = 20) =>
    (await request('GET', `/api/v1/search?q=${encodeURIComponent(term)}&limit=${limit}`)).data,

  // --- Protocol 1F: Integrations, Import/Export & Retention ---
  integrations: async () => (await request('GET', '/api/v1/integrations')).data,
  createIntegration: async (b: any) => (await request('POST', '/api/v1/integrations', b)).data,
  testIntegration: async (id: string) => (await request('POST', `/api/v1/integrations/${id}/test`)).data,
  deleteIntegration: async (id: string) => { await request('DELETE', `/api/v1/integrations/${id}`); },
  dataJobs: async () => (await request('GET', '/api/v1/data-jobs')).data,
  dryRunImport: async (b: { entityType: string; fileName: string; rows: any[] }) =>
    (await request('POST', '/api/v1/data-jobs/dry-run', b)).data,
  commitImport: async (id: string) => (await request('POST', `/api/v1/data-jobs/${id}/commit`)).data,
  retentionPolicies: async () => (await request('GET', '/api/v1/retention-policies')).data,
  runRetentionPurge: async () => (await request('POST', '/api/v1/retention-policies/run')).data,
};
