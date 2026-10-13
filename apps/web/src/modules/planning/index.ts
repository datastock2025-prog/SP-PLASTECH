// ============================================================================
// PLANNING MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/planning/index.ts
// ============================================================================

export { ScmViews as PlanningViews, ScmViews } from './screens/PlanningViews';

export {
  usePlanning,
  useScm,
  usePlannedOrders,
  useMrpRuns,
  useShipments,
} from './api/usePlanning';

export { planningApi } from './api/planningApi';
export { planningRoutes } from './routes';

export {
  PlannedOrderSchema,
  CreatePlannedOrderInputSchema,
  UpdatePlannedOrderInputSchema,
  MrpRunSchema,
  JitScheduleSchema,
  ShipmentTrackingSchema,
  shipmentTrackingFormSchema,
} from './model/planningSchemas';

export type {
  PlannedOrderContract,
  CreatePlannedOrderContract,
  UpdatePlannedOrderContract,
  MrpRunContract,
  JitScheduleContract,
  ShipmentTrackingContract,
  ShipmentTrackingFormValues,
} from './model/planningSchemas';

// Core planning/SCM Sub-components
export { ScmControlTowerView } from './components/ScmControlTowerView';
export { ScmDemandPlanningView } from './components/ScmDemandPlanningView';
export { ScmSalesForecastView } from './components/ScmSalesForecastView';
export { ScmSopView } from './components/ScmSopView';
export { ScmInventoryPlanningView } from './components/ScmInventoryPlanningView';
export { ScmMrpView } from './components/ScmMrpView';
export { ScmReplenishmentView } from './components/ScmReplenishmentView';
export { ScmSupplierCollaborationView } from './components/ScmSupplierCollaborationView';
export { ScmInboundLogisticsView } from './components/ScmInboundLogisticsView';
export { ScmOutboundLogisticsView } from './components/ScmOutboundLogisticsView';
export { ScmFreightTransportView } from './components/ScmFreightTransportView';
export { ScmTrackTraceView } from './components/ScmTrackTraceView';
export { ScmSupplierRiskView } from './components/ScmSupplierRiskView';
export { ScmInventoryAgingView } from './components/ScmInventoryAgingView';
export { ScmOrderTimelineView } from './components/ScmOrderTimelineView';
export { ScmExceptionsView } from './components/ScmExceptionsView';
export { ScmSustainabilityView } from './components/ScmSustainabilityView';
export { ScmReportsView } from './components/ScmReportsView';
export { ScmSettingsView } from './components/ScmSettingsView';
export { ScmRbacView } from './components/ScmRbacView';
