import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const CrmViews = React.lazy(() =>
  import('./screens/CrmViews').then((m) => ({ default: m.CrmViews }))
);

export const crmRoutes: RouteObject[] = [
  {
    path: '/crm/*',
    element: React.createElement(CrmViews, {
      currentView: 'crmDashboard',
      onNavigate: () => {},
      showToast: () => {},
    }),
  },
];
