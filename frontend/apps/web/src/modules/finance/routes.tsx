import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const FinanceViews = React.lazy(() =>
  import('./screens/FinanceViews').then((m) => ({ default: m.FinanceViews }))
);

export const financeRoutes: RouteObject[] = [
  {
    path: '/finance/*',
    element: React.createElement(FinanceViews, {
      view: 'dashboard',
      accounts: [],
      journalEntries: [],
      costCenters: [],
      onNavigate: () => {},
      onUpdateAccount: () => {},
      onCreateJE: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
      openConfirm: () => {},
      showToast: () => {},
    }),
  },
];
