// ============================================================================
// QUALITY MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/quality/index.ts
// ============================================================================

export { QualityViews } from './screens/QualityViews';

export {
  useQuality,
  useNcrs,
  useSaveNcr,
  useCapas,
  useSaveCapa,
  useCoas,
  useSaveCoa,
  useInspectionPlans,
} from './api/useQuality';

export { qualityApi } from './api/qualityApi';
export { qualityRoutes } from './routes';

export {
  NcrSchema,
  CreateNcrInputSchema,
  UpdateNcrInputSchema,
  CapaSchema,
  CertificateOfAnalysisSchema,
  InspectionPlanSchema,
  ncrCreateSchema,
} from './model/qualitySchemas';

export type {
  NcrContract,
  CreateNcrContract,
  UpdateNcrContract,
  CapaContract,
  CertificateOfAnalysisContract,
  InspectionPlanContract,
  NcrCreateFormValues,
  NonConformanceReport,
  CapaReport,
  CertificateOfAnalysis,
  InspectionPlan,
} from './model/qualitySchemas';

// Quality Sub-components
export { QualityDashboardView } from './components/QualityDashboardView';
export { InspectionPlansView } from './components/InspectionPlansView';
export { IncomingInspectionView } from './components/IncomingInspectionView';
export { SpcMonitorView } from './components/SpcMonitorView';
export { FinalInspectionView } from './components/FinalInspectionView';
export { NcrManagementView } from './components/NcrManagementView';
export { CapaManagementView } from './components/CapaManagementView';
export { CoaManagementView } from './components/CoaManagementView';
export { CalibrationEquipmentView } from './components/CalibrationEquipmentView';
export { DocControlAuditView } from './components/DocControlAuditView';
export { WipStoreQcInspectionView } from './components/WipStoreQcInspectionView';
