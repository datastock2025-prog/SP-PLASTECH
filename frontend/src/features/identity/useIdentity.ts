import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { identityApi, ApiError } from './api';
import { MeSchema, type ManagedUser, type Me, type UpdateUserInput, type UserListParams } from './types';

const SESSION_CACHE_KEY = 'sp_me_session';
const SESSION_ACTIVITY_KEY = 'sp_last_activity';
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function getCachedSession(): Me | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const lastActive = Number(sessionStorage.getItem(SESSION_ACTIVITY_KEY) || '0');
    if (lastActive && Date.now() - lastActive > SESSION_IDLE_TIMEOUT_MS) {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      sessionStorage.removeItem(SESSION_ACTIVITY_KEY);
      return null;
    }
    sessionStorage.setItem(SESSION_ACTIVITY_KEY, Date.now().toString());
    return JSON.parse(raw) as Me;
  } catch {
    return null;
  }
}

export function setCachedSession(me: Me | null) {
  try {
    if (typeof window === 'undefined') return;
    if (me) {
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(me));
      sessionStorage.setItem(SESSION_ACTIVITY_KEY, Date.now().toString());
    } else {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      sessionStorage.removeItem(SESSION_ACTIVITY_KEY);
    }
  } catch {}
}

export const identityKeys = {
  me: ['identity', 'me'] as const,
  prefs: ['identity', 'preferences'] as const,
  roles: ['identity', 'roles'] as const,
  plants: ['identity', 'plants'] as const,
  users: ['identity', 'users'] as const,
  usersList: (p: UserListParams) => ['identity', 'users', p] as const,
  history: (id: string) => ['identity', 'history', id] as const,
};

export function useMe() {
  return useQuery<Me | null>({
    queryKey: identityKeys.me,
    initialData: () => getCachedSession() ?? undefined,
    queryFn: async () => {
      try {
        const me = await identityApi.me();
        setCachedSession(me);
        return me;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          setCachedSession(null);
          return null;
        }
        const cached = getCachedSession();
        return cached;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { username: string; password: string }) => {
      const res = await identityApi.signIn(v.username, v.password);
      if (res.twoFactorRequired) {
        return { twoFactorRequired: true, me: null };
      }
      const me = await identityApi.me();
      return { twoFactorRequired: false, me };
    },
    onSuccess: (res) => {
      if (res.me) {
        setCachedSession(res.me);
        qc.setQueryData(identityKeys.me, res.me);
      }
    },
  });
}

export function useVerifyTotp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      await identityApi.verifyTotp(code);
      return identityApi.me();
    },
    onSuccess: (me) => {
      setCachedSession(me);
      qc.setQueryData(identityKeys.me, me);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => identityApi.signOut(),
    onSettled: () => {
      setCachedSession(null);
      qc.clear();
      qc.setQueryData(identityKeys.me, null);
    },
  });
}

export function useSelectContext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { plantId: string; shift: string }) => identityApi.selectContext(v.plantId, v.shift),
    onSuccess: (_r, v) =>
      qc.setQueryData<Me | null>(identityKeys.me, (m) => {
        if (!m) return m;
        const updated = { ...m, activePlantId: v.plantId, activeShift: v.shift };
        setCachedSession(updated);
        return updated;
      }),
  });
}

export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { currentPassword: string; newPassword: string }) => identityApi.changePassword(v.currentPassword, v.newPassword),
    onSuccess: () => qc.invalidateQueries({ queryKey: identityKeys.me }),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.updateMe,
    onSuccess: (u) => {
      qc.setQueryData<Me | null>(identityKeys.me, (m) => (m ? { ...m, ...u } : m));
      qc.invalidateQueries({ queryKey: identityKeys.users });
    },
  });
}

export function usePreferences(enabled = true) {
  return useQuery({ queryKey: identityKeys.prefs, queryFn: identityApi.preferences, enabled });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.updatePreferences,
    onSuccess: (p) => qc.setQueryData(identityKeys.prefs, p),
  });
}

export const useRoles = () => useQuery({ queryKey: identityKeys.roles, queryFn: identityApi.roles });
export const usePlants = () => useQuery({ queryKey: identityKeys.plants, queryFn: identityApi.plants });

export const useSystemHealth = () => useQuery({
  queryKey: ['identity', 'systemHealth'],
  queryFn: identityApi.systemHealth,
  refetchInterval: 15_000,
});

// A plant change must reach every consumer: plant list, the signed-in user's plant switcher, and the users grid.
export function usePlantMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: identityKeys.plants });
    qc.invalidateQueries({ queryKey: identityKeys.me });
    qc.invalidateQueries({ queryKey: identityKeys.users });
  };
  return {
    create: useMutation({ mutationFn: identityApi.createPlant, onSuccess: refresh }),
    update: useMutation({
      mutationFn: (v: { id: string; body: Parameters<typeof identityApi.updatePlant>[1] }) => identityApi.updatePlant(v.id, v.body),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => identityApi.deletePlant(id), onSuccess: refresh }),
    setDefault: useMutation({ mutationFn: (id: string) => identityApi.setDefaultPlant(id), onSuccess: refresh }),
  };
}

export function useUsers(p: UserListParams) {
  return useQuery({ queryKey: identityKeys.usersList(p), queryFn: () => identityApi.users(p), placeholderData: (prev) => prev });
}

export function useUserHistory(id: string | null) {
  return useQuery({ queryKey: identityKeys.history(id ?? ''), queryFn: () => identityApi.history(id!), enabled: !!id });
}

export function useUserMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: identityKeys.users });
  const patchCached = (u: ManagedUser) => {
    qc.setQueriesData<{ data: ManagedUser[]; meta: unknown }>({ queryKey: identityKeys.users }, (old) =>
      old && Array.isArray(old.data) ? { ...old, data: old.data.map((x) => (x.id === u.id ? u : x)) } : old);
    qc.invalidateQueries({ queryKey: identityKeys.history(u.id) });
  };
  return {
    create: useMutation({ mutationFn: identityApi.createUser, onSuccess: refresh }),
    update: useMutation({
      mutationFn: (v: { id: string; body: UpdateUserInput }) => identityApi.updateUser(v.id, v.body),
      onSuccess: (u) => { patchCached(u); refresh(); },
    }),
    resetPassword: useMutation({
      mutationFn: (v: string | { id: string; password?: string; mustChangePassword?: boolean }) => {
        const id = typeof v === 'string' ? v : v.id;
        const opts = typeof v === 'string' ? undefined : { password: v.password, mustChangePassword: v.mustChangePassword };
        return identityApi.resetPassword(id, opts);
      },
      onSuccess: (_t, v) => {
        const id = typeof v === 'string' ? v : v.id;
        qc.invalidateQueries({ queryKey: identityKeys.history(id) });
        refresh();
      },
    }),
    setLocked: useMutation({
      mutationFn: (v: { id: string; locked: boolean }) => identityApi.setLocked(v.id, v.locked),
      onSuccess: (u) => { patchCached(u); refresh(); },
    }),
    remove: useMutation({ mutationFn: (id: string) => identityApi.deleteUser(id), onSuccess: refresh }),
  };
}

// --- sessions hooks (Protocol 1B) ---
export function useSessions() {
  return useQuery({
    queryKey: ['identity', 'sessions'],
    queryFn: identityApi.sessions,
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.revokeSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'sessions'] }),
  });
}

export function useRevokeOtherSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.revokeOtherSessions,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'sessions'] }),
  });
}

// --- security policy & login events hooks (Protocol 1B) ---
export function useSecurityPolicy() {
  return useQuery({
    queryKey: ['identity', 'securityPolicy'],
    queryFn: identityApi.securityPolicy,
  });
}

export function useUpdateSecurityPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.updateSecurityPolicy,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'securityPolicy'] }),
  });
}

export function useLoginEvents(params: { page?: number; limit?: number; success?: boolean } = {}) {
  return useQuery({
    queryKey: ['identity', 'loginEvents', params],
    queryFn: () => identityApi.loginEvents(params),
  });
}

// --- RBAC & Governance hooks (Protocol 1C) ---
export function usePermissionCatalog() {
  return useQuery({
    queryKey: ['identity', 'permissions', 'catalog'],
    queryFn: identityApi.permissionCatalog,
    staleTime: 300_000,
  });
}

export function useRole(id: string | null) {
  return useQuery({
    queryKey: ['identity', 'roles', id],
    queryFn: () => (id ? identityApi.role(id) : null),
    enabled: Boolean(id),
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; version: number; permissions: any[] }) =>
      identityApi.updateRolePermissions(v.id, v.version, v.permissions),
    onSuccess: (_data, v) => {
      qc.invalidateQueries({ queryKey: ['identity', 'roles'] });
      qc.invalidateQueries({ queryKey: ['identity', 'roles', v.id] });
    },
  });
}

export function useRoleScreens(roleId: string | null) {
  return useQuery({
    queryKey: ['identity', 'roles', roleId, 'screens'],
    queryFn: () => (roleId ? identityApi.roleScreens(roleId) : []),
    enabled: Boolean(roleId),
  });
}

export function useUpdateRoleScreens() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { roleId: string; screens: string[] }) =>
      identityApi.updateRoleScreens(v.roleId, v.screens),
    onSuccess: (_data, v) => {
      qc.invalidateQueries({ queryKey: ['identity', 'roles', v.roleId, 'screens'] });
    },
  });
}

export function useUserGroups() {
  return useQuery({
    queryKey: ['identity', 'userGroups'],
    queryFn: identityApi.userGroups,
  });
}

export function useCreateUserGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.createUserGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'userGroups'] }),
  });
}

export function useUpdateUserGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; data: { name?: string; description?: string | null; isActive?: boolean } }) =>
      identityApi.updateUserGroup(v.id, v.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'userGroups'] }),
  });
}

export function useDeleteUserGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.deleteUserGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'userGroups'] }),
  });
}

export function useSoDRules() {
  return useQuery({
    queryKey: ['identity', 'sodRules'],
    queryFn: identityApi.sodRules,
  });
}

export function useSoDViolations() {
  return useQuery({
    queryKey: ['identity', 'sodViolations'],
    queryFn: identityApi.sodViolations,
  });
}

// --- Protocol 1D: Master Config & Numbering Hooks ---
export function useCompanySettings() {
  return useQuery({
    queryKey: ['identity', 'companySettings'],
    queryFn: identityApi.companySettings,
  });
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.updateCompanySettings,
    onSuccess: (data) => {
      qc.setQueryData(['identity', 'companySettings'], data);
    },
  });
}

export function useWarehouseBins(warehouseId?: string) {
  return useQuery({
    queryKey: ['identity', 'warehouseBins', warehouseId],
    queryFn: () => identityApi.warehouseBins(warehouseId),
  });
}

export function useCreateWarehouseBin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.createWarehouseBin,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'warehouseBins'] }),
  });
}

export function useShifts(plantId?: string) {
  return useQuery({
    queryKey: ['identity', 'shifts', plantId],
    queryFn: () => identityApi.shifts(plantId),
  });
}

export function useTransporters() {
  return useQuery({
    queryKey: ['identity', 'transporters'],
    queryFn: identityApi.transporters,
  });
}

export function useNumberingSeries() {
  return useQuery({
    queryKey: ['identity', 'numberingSeries'],
    queryFn: identityApi.numberingSeries,
  });
}

export function useNextDocNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { seriesCode: string; plantId?: string }) => identityApi.nextDocNumber(v.seriesCode, v.plantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'numberingSeries'] }),
  });
}

// --- Protocol 1E: Approvals, Governance, Audit Logs & Search Hooks ---
export function useApprovalWorkflows() {
  return useQuery({
    queryKey: ['identity', 'approvalWorkflows'],
    queryFn: identityApi.approvalWorkflows,
  });
}

export function useCreateApprovalWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.createApprovalWorkflow,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'approvalWorkflows'] }),
  });
}

export function useApprovalRequests(params: { status?: string; entityType?: string } = {}) {
  return useQuery({
    queryKey: ['identity', 'approvalRequests', params],
    queryFn: () => identityApi.approvalRequests(params),
  });
}

export function useCreateApprovalRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.createApprovalRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'approvalRequests'] }),
  });
}

export function useDecideApprovalRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; action: 'APPROVE' | 'REJECT'; comments?: string }) =>
      identityApi.decideApprovalRequest(v.id, { action: v.action, comments: v.comments }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['identity', 'approvalRequests'] });
      qc.invalidateQueries({ queryKey: ['identity', 'auditLogs'] });
    },
  });
}

export function useAuditLogs(params: { cursor?: string; limit?: number; entityType?: string; action?: string } = {}) {
  return useQuery({
    queryKey: ['identity', 'auditLogs', params],
    queryFn: () => identityApi.auditLogs(params),
  });
}

export function useSearchCatalog(term: string) {
  return useQuery({
    queryKey: ['identity', 'searchCatalog', term],
    queryFn: () => identityApi.search(term),
    enabled: term.trim().length >= 2,
    staleTime: 30_000,
  });
}

// --- Protocol 1F: Integrations, Import/Export & Retention Hooks ---
export function useIntegrations() {
  return useQuery({
    queryKey: ['identity', 'integrations'],
    queryFn: identityApi.integrations,
  });
}

export function useCreateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.createIntegration,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'integrations'] }),
  });
}

export function useTestIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.testIntegration,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'integrations'] }),
  });
}

export function useDeleteIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.deleteIntegration,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'integrations'] }),
  });
}

export function useDataJobs() {
  return useQuery({
    queryKey: ['identity', 'dataJobs'],
    queryFn: identityApi.dataJobs,
    refetchInterval: 10_000,
  });
}

export function useDryRunImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.dryRunImport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'dataJobs'] }),
  });
}

export function useCommitImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.commitImport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['identity', 'dataJobs'] });
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useRetentionPolicies() {
  return useQuery({
    queryKey: ['identity', 'retentionPolicies'],
    queryFn: identityApi.retentionPolicies,
  });
}

export function useRunRetentionPurge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityApi.runRetentionPurge,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity', 'retentionPolicies'] }),
  });
}




