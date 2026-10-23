import React from 'react';
import type { RouteObject } from 'react-router-dom';

import { SalesViews } from './screens/SalesViews';
export { SalesViews };

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
