import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const SalesViews = React.lazy(() =>
  import('./screens/SalesViews').then((m) => ({ default: m.SalesViews }))
);

export const salesRoutes: RouteObject[] = [
  {
    path: '/sales/*',
    element: React.createElement(SalesViews, {
      view: 'dashboard',
      sos: [],
      quotes: [],
      customers: [],
      rmas: [],
      onNavigate: () => {},
      onUpdateSO: () => {},
      onCreateSO: () => {},
      onUpdateQuote: () => {},
      onCreateQuote: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
      openConfirm: () => {},
      showToast: () => {},
    }),
  },
];
