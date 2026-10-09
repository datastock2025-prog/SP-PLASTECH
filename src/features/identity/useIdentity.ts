import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { identityApi, ApiError } from './api';
import type { ManagedUser, Me, UpdateUserInput, UserListParams } from './types';

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
    queryFn: async () => {
      try {
        return await identityApi.me();
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
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
      await identityApi.signIn(v.username, v.password);
      // Server blocks everything except /me* while a password change is pending, so /me is always reachable.
      return identityApi.me();
    },
    onSuccess: (me) => qc.setQueryData(identityKeys.me, me),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => identityApi.signOut(),
    onSettled: () => {
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
      qc.setQueryData<Me | null>(identityKeys.me, (m) => (m ? { ...m, activePlantId: v.plantId, activeShift: v.shift } : m)),
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
      mutationFn: (id: string) => identityApi.resetPassword(id),
      onSuccess: (_t, id) => {
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
