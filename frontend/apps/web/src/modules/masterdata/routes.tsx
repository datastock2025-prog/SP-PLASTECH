import React from 'react';
import type { RouteObject } from 'react-router-dom';

export const MasterDataViews = React.lazy(() =>
  import('./screens/MasterDataViews').then((m) => ({ default: m.MasterDataViews }))
);

export const masterDataRoutes: RouteObject[] = [
  {
    path: '/masterdata/*',
    element: React.createElement(MasterDataViews, {
      view: 'items',
      items: [],
      boms: [],
      machines: [],
      onNavigate: () => {},
      onUpdateItem: () => {},
      onDeleteItem: () => {},
      onCreateItem: () => {},
      onUpdateBom: () => {},
      onDeleteBom: () => {},
      onCreateBom: () => {},
      onUpdateMachine: () => {},
      onDeleteMachine: () => {},
      onCreateMachine: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
      openConfirm: () => {},
      showToast: () => {},
    }),
  },
];
