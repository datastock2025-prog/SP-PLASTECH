import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { AuthUser, LoginWithPinFormValues, LoginWithCredentialsFormValues } from '../types/authSchemas';
import { useUiStore } from '../../../shared/stores/uiStore';

export const AUTH_QUERY_KEY = ['auth', 'currentUser'];

export function useAuth(initialUser?: AuthUser | null) {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  // TanStack Query for session state
  const { data: currentUser = initialUser || null, isLoading } = useQuery<AuthUser | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => authApi.getCurrentUser(),
    initialData: initialUser || undefined,
    staleTime: Infinity, // Keep session valid until mutation
  });

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginWithPinFormValues | LoginWithCredentialsFormValues) =>
      authApi.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
      showToast(`Welcome back, ${data.user.name}`);
    },
    onError: (error: Error) => {
      showToast(error.message || 'Authentication failed');
    },
  });

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      showToast('Logged out successfully');
    },
  });

  return {
    currentUser,
    isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    setCurrentUser: (user: AuthUser | null) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
  };
}
