import React, { ReactNode } from 'react';
import { Permission, UserRole } from '../types';
import { useAuth } from '../auth/AuthProvider';

export interface NavItemConfig {
  id: string;
  label: string;
  icon?: ReactNode;
  path: string;
  requiredPermission?: Permission;
  requiredRole?: UserRole | UserRole[];
  children?: NavItemConfig[];
}

/**
 * Filters navigation tree by current user role & permissions
 */
export function filterAuthorizedNavigation(
  items: NavItemConfig[],
  hasPermission: (p: Permission) => boolean,
  hasRole: (r: UserRole | UserRole[]) => boolean,
  isSuperAdmin: boolean
): NavItemConfig[] {
  if (isSuperAdmin) return items;

  return items
    .filter((item) => {
      if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
        return false;
      }
      if (item.requiredRole && !hasRole(item.requiredRole)) {
        return false;
      }
      return true;
    })
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: filterAuthorizedNavigation(item.children, hasPermission, hasRole, isSuperAdmin),
        };
      }
      return item;
    });
}
