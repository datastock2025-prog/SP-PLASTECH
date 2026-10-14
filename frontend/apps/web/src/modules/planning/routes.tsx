import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const PlanningViews = React.lazy(() =>
  import('./screens/PlanningViews').then((m) => ({ default: m.ScmViews }))
);

export const planningRoutes: RouteObject[] = [
  {
    path: '/planning/*',
    element: React.createElement(PlanningViews, {
      onNavigate: () => {},
      showToast: () => {},
    }),
  },
];
