import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const HrViews = React.lazy(() =>
  import('./screens/HrViews').then((m) => ({ default: m.HrViews }))
);

export const hrRoutes: RouteObject[] = [
  {
    path: '/hr/*',
    element: React.createElement(HrViews, {
      currentView: 'hr-command-center',
      onNavigate: () => {},
      showToast: () => {},
    }),
  },
];
