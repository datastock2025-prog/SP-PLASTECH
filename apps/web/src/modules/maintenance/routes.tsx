import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const MaintenanceViews = React.lazy(() =>
  import('./screens/MaintenanceViews').then((m) => ({ default: m.MaintenanceViews }))
);

export const maintenanceRoutes: RouteObject[] = [
  {
    path: '/maintenance/*',
    element: React.createElement(MaintenanceViews, {
      currentView: 'mep-dash',
      onNavigate: () => {},
      showToast: () => {},
    }),
  },
];
