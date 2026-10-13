// ============================================================================
// DOMAIN MODULE: ENGINEERING & PROCESS ROUTINGS
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export {
  EngineeringViews,
  LegacyBomBuilderView,
  MultiLevelBomTreeView,
  ProcessRoutingOperationsView,
  EngineeringChangeOrderView,
  BomVersionDiffView,
  ManufacturingBomWizardModal,
} from '../../../apps/web/src/modules/engineering';
export { INITIAL_BOMS } from '../../data/engineeringData';
export type { BomMaster, BomLine, BomRouting } from '../../types';
