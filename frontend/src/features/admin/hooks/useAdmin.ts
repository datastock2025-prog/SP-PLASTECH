import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { AdminUser } from '../../../types/admin';

export const ADMIN_USERS_KEY = ['admin', 'users'];

export function useAdmin() {
  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ADMIN_USERS_KEY,
    queryFn: () => adminApi.getUsers(),
  });

  return {
    users,
    isLoading,
  };
}

