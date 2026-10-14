import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const ManufacturingViews = React.lazy(() =>
  import('./screens/ManufacturingViews').then((m) => ({ default: m.ManufacturingViews }))
);

export const manufacturingRoutes: RouteObject[] = [
  {
    path: '/manufacturing/*',
    element: React.createElement(ManufacturingViews, {
      view: 'commandCenter',
      workOrders: [],
      items: [],
      machines: [],
      boms: [],
      stockTxns: [],
      onNavigate: () => {},
      onUpdateWO: () => {},
      onCreateWO: () => {},
      onDeleteWO: () => {},
      onIssueMaterial: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
      openConfirm: () => {},
      showToast: () => {},
    }),
  },
];
