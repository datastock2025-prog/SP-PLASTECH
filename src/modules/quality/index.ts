// ============================================================================
// DOMAIN MODULE: QUALITY & COMPLIANCE (IATF 16949 / ISO 9001)
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export { QualityViews } from '../../components/QualityViews';
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
