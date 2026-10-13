import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const ProcurementViews = React.lazy(() =>
  import('./screens/ProcurementViews').then((m) => ({ default: m.ProcurementViews }))
);

export const procurementRoutes: RouteObject[] = [
  {
    path: '/procurement/*',
    element: React.createElement(ProcurementViews, {
      view: 'dashboard',
      onNavigate: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
      showToast: () => {},
    }),
  },
];
