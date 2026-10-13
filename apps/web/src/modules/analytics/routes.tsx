import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const AnalyticsViews = React.lazy(() =>
  import('./screens/AnalyticsViews').then((m) => ({ default: m.AnalyticsViews }))
);

export const analyticsRoutes: RouteObject[] = [
  {
    path: '/analytics/*',
    element: React.createElement(AnalyticsViews, {
      currentView: 'analyticsDash',
      onNavigate: () => {},
      showToast: () => {},
    }),
  },
];
