// ============================================================================
// MODULAR MONOLITH: MASTER DOMAIN REGISTRY & BARREL EXPORT
// Reboot ERP — Modular Monolithic Architecture
// ============================================================================

export * as AuthModule from './auth';
export * as HomeModule from './home';
export * as MasterDataModule from './masterdata';
export * as EngineeringModule from './engineering';
export * as ManufacturingModule from './manufacturing';
export * as ProcurementModule from './procurement';
export * as WarehouseModule from './warehouse';
export * as SalesModule from './sales';
export * as FinanceModule from './finance';
export * as QualityModule from './quality';
export * as HrModule from './hr';
export * as MepModule from './mep';
export * as ScmModule from './scm';
export * as CrmModule from './crm';
export * as AdminModule from './admin';
export * as ArchitectureModule from './architecture';

// Direct Feature Facades for Ergonomic Routing
export { LoginScreen } from './auth';
export { HomeView, WorkspaceTasksView, WorkspaceApprovalsView, WorkspaceNotificationsView, WorkspaceSavedViewsView, WorkspaceRecentRecordsView } from './home';
export { MasterDataViews } from './masterdata';
export { EngineeringViews } from './engineering';
export { ManufacturingViews } from './manufacturing';
export { ProcurementViews } from './procurement';
export { WarehouseViews } from './warehouse';
export { SalesViews } from './sales';
export { FinanceViews } from './finance';
export { QualityViews } from './quality';
export { HrViews } from './hr';
export { MepViews } from './mep';
export { ScmViews } from './scm';
export { CrmViews } from './crm';
export { AdminViews } from './admin';
export { ReactArchitectureGuide } from './architecture';
