import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const IntegrationsViews = React.lazy(() =>
  import('./screens/IntegrationsViews').then((m) => ({ default: m.IntegrationsViews }))
);

export const integrationsRoutes: RouteObject[] = [
  {
    path: '/integrations/*',
    element: React.createElement(IntegrationsViews, {
      currentView: 'management',
      onNavigate: () => {},
      showToast: () => {},
    }),
  },
];
