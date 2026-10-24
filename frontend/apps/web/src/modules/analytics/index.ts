// ============================================================================
// ANALYTICS MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/analytics/index.ts
// ============================================================================

export { AnalyticsViews, analyticsRoutes } from './routes';

export {
  useAnalytics,
  useOeeStream,
  useExecutiveKpis,
  useKpiReports,
} from './api/useAnalytics';

export { analyticsApi } from './api/analyticsApi';

export {
  ExecutiveKpiSchema,
  CreateExecutiveKpiInputSchema,
  UpdateExecutiveKpiInputSchema,
  OeeRecordSchema,
  SavedReportSchema,
  ChatMessageSchema,
  KpiCategoryEnum,
  PeriodTypeEnum,
} from './model/analyticsSchemas';

export type {
  ExecutiveKpiContract,
  CreateExecutiveKpiContract,
  UpdateExecutiveKpiContract,
  OeeRecordContract,
  SavedReportContract,
  ChatMessageContract,
  KpiCategory,
  PeriodType,
  ExecutiveKpiItem,
  ExecutiveKpiSummary,
  OeeRecordItem,
  OeeLossParetoItem,
  QualityMetricItem,
  ScmKpiItem,
  MaintenanceMetricItem,
  InventoryAgingItem,
  EsgSustainabilityItem,
  ChatMessageItem,
} from './model/analyticsSchemas';

// Analytics & AI Sub-components
export { ModernAnalyticsDashboard } from './components/ModernAnalyticsDashboard';
export { OeeAnalyticsView } from './components/OeeAnalyticsView';
export { QualityDefectReportsView } from './components/QualityDefectReportsView';
export { InventoryAgingView } from './components/InventoryAgingView';
export { ScmPerformanceView } from './components/ScmPerformanceView';
export { EsgSustainabilityView } from './components/EsgSustainabilityView';
export { MaintenanceMtbfView } from './components/MaintenanceMtbfView';
export { CustomDocumentBuilder } from './components/CustomDocumentBuilder';
export { AdminDomainRbacControl } from './components/AdminDomainRbacControl';
export { ChatAssistantModal } from './components/ChatAssistantModal';
export { ChatMessageRenderer } from './components/ChatMessageRenderer';
export { FixedBottomChatWidget } from './components/FixedBottomChatWidget';
export { KpiCard } from './components/KpiCard';
export { FilterPanel } from './components/FilterPanel';
export { ExportModal } from './components/ExportModal';
