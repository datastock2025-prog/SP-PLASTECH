import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const EngineeringViews = React.lazy(() =>
  import('./screens/EngineeringViews').then((m) => ({ default: m.EngineeringViews }))
);

export const engineeringRoutes: RouteObject[] = [
  {
    path: '/engineering/*',
    element: React.createElement(EngineeringViews, {
      view: 'bom',
      items: [],
      boms: [],
      onNavigate: () => {},
      onUpdateBom: () => {},
      onDeleteBom: () => {},
      onCreateBom: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
      openConfirm: () => {},
      showToast: () => {},
    }),
  },
];
