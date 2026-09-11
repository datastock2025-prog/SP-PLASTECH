import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { AuthUser } from '../../../types';

export const ADMIN_USERS_KEY = ['admin', 'users'];

export function useAdmin() {
  const { data: users = [], isLoading } = useQuery<AuthUser[]>({
    queryKey: ADMIN_USERS_KEY,
    queryFn: () => adminApi.getUsers(),
  });

  return {
    users,
    isLoading,
  };
}
