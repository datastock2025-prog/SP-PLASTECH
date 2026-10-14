import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const AdminViews = React.lazy(() => import('./screens/AdminViews').then((m) => ({ default: m.AdminViews })));
export const LoginScreen = React.lazy(() => import('./screens/LoginScreen').then((m) => ({ default: m.LoginScreen })));
export const UserProfilePreferencesView = React.lazy(() =>
  import('./screens/UserProfilePreferencesView').then((m) => ({ default: m.UserProfilePreferencesView }))
);

export const identityRoutes: RouteObject[] = [
  {
    path: '/login',
    element: React.createElement(LoginScreen),
  },
  {
    path: '/admin/*',
    element: React.createElement(AdminViews),
  },
  {
    path: '/profile',
    element: React.createElement(UserProfilePreferencesView),
  },
];
