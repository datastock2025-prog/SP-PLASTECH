// ============================================================================
// ENGINEERING MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/engineering/index.ts
// ============================================================================

export { LegacyBomBuilderView } from './components/LegacyBomBuilderView';
export { MultiLevelBomTreeView } from './components/MultiLevelBomTreeView';
export { ProcessRoutingOperationsView } from './components/ProcessRoutingOperationsView';
export { EngineeringChangeOrderView } from './components/EngineeringChangeOrderView';
export { BomVersionDiffView } from './components/BomVersionDiffView';
export { ManufacturingBomWizardModal } from './components/bomWizard/ManufacturingBomWizardModal';

export {
  useEngineering,
  useBoms,
  useBomDetail,
  useSaveBom,
  useDeleteBom,
  useEcrs,
  useSaveEcr,
  useRoutings,
  useEngineeringBoms,
  useSaveEngineeringBom,
} from './api/useEngineering';
export { engineeringApi } from './api/engineeringApi';

export { EngineeringViews, engineeringRoutes } from './routes';

export type {
  BomContract,
  BomLineContract,
  CreateBomContract,
  UpdateBomContract,
  EcrContract,
} from '@/packages/contracts/engineering';
export type {
  BomVersionFormValues,
} from './model/engineeringSchemas';
