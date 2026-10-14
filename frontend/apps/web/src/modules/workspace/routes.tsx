import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const WorkspaceViews = React.lazy(() =>
  import('./screens/WorkspaceViews').then((m) => ({ default: m.WorkspaceViews }))
);

export const workspaceRoutes: RouteObject[] = [
  {
    path: '/workspace/*',
    element: React.createElement(WorkspaceViews, {
      currentView: 'home',
      onNavigate: () => {},
      showToast: () => {},
    }),
  },
];
