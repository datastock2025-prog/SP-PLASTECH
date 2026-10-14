import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const QualityViews = React.lazy(() =>
  import('./screens/QualityViews').then((m) => ({ default: m.QualityViews }))
);

export const qualityRoutes: RouteObject[] = [
  {
    path: '/quality/*',
    element: React.createElement(QualityViews, {
      view: 'dashboard',
      inspectionPlans: [],
      ncrs: [],
      capas: [],
      coas: [],
      onNavigate: () => {},
      onUpdateNCR: () => {},
      onCreateNCR: () => {},
      onUpdateCAPA: () => {},
      onCreateCAPA: () => {},
      onUpdateCOA: () => {},
      onCreateCOA: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
      openConfirm: () => {},
      showToast: () => {},
    }),
  },
];
