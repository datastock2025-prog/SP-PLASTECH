import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const WarehouseViews = React.lazy(() =>
  import('./screens/WarehouseViews').then((m) => ({ default: m.WarehouseViews }))
);

export const warehouseRoutes: RouteObject[] = [
  {
    path: '/warehouse/*',
    element: React.createElement(WarehouseViews, {
      view: 'inventoryDashboard',
      items: [],
      pos: [],
      subcontracts: [],
      stockTxns: [],
      onNavigate: () => {},
      onUpdateItem: () => {},
      onUpdatePO: () => {},
      onCreatePO: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
      openConfirm: () => {},
      showToast: () => {},
    }),
  },
];
