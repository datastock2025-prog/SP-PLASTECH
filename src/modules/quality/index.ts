// ============================================================================
// DOMAIN MODULE: QUALITY & COMPLIANCE (IATF 16949 / ISO 9001)
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export {
  QualityViews,
  useQuality,
  useNcrs,
  useSaveNcr,
  useCapas,
  useSaveCapa,
  useCoas,
  useSaveCoa,
  useInspectionPlans,
  qualityApi,
  qualityRoutes,
  QualityDashboardView,
  InspectionPlansView,
  IncomingInspectionView,
  SpcMonitorView,
  FinalInspectionView,
  NcrManagementView,
  CapaManagementView,
  CoaManagementView,
  CalibrationEquipmentView,
  DocControlAuditView,
  WipStoreQcInspectionView,
} from '../../../apps/web/src/modules/quality';

export {
  initialNcrs,
  initialCapas,
  initialCoas,
  initialInspectionPlans,
} from '../../data/initialData';

export type {
  NonConformanceReport,
  CapaReport,
  CertificateOfAnalysis,
  InspectionPlan,
} from '../../types';
