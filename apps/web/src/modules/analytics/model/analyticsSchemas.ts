import { z } from 'zod';
import {
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
} from '@/src/types/analyticsTypes';

export {
  ExecutiveKpiSchema,
  CreateExecutiveKpiInputSchema,
  UpdateExecutiveKpiInputSchema,
  OeeRecordSchema,
  SavedReportSchema,
  ChatMessageSchema,
  KpiCategoryEnum,
  PeriodTypeEnum,
} from '@/packages/contracts/analytics';

export type {
  ExecutiveKpiContract,
  CreateExecutiveKpiContract,
  UpdateExecutiveKpiContract,
  OeeRecordContract,
  SavedReportContract,
  ChatMessageContract,
  KpiCategory,
  PeriodType,
} from '@/packages/contracts/analytics';

export type {
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
};
