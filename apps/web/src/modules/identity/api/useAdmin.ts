import { useQuery } from '@tanstack/react-query';
import { adminApi } from './adminApi';
import { AdminUser } from '../model/types';

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

