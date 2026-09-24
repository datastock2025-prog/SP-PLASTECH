export interface ExecutiveKpiItem {
  id: string;
  tenantId: string;
  kpiCategory: 'FINANCIAL' | 'PRODUCTION' | 'QUALITY' | 'SUPPLY_CHAIN' | 'MAINTENANCE' | 'SAFETY' | 'SUSTAINABILITY' | 'HR' | 'CUSTOMER';
  kpiName: string;
  kpiValue: number;
  kpiTarget?: number;
  kpiUnit: string;
  period: string;
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  year: number;
  month?: number;
  plantId?: string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  previousValue?: number;
  variance?: number;
  variancePct?: number;
  isPublic: boolean;
}

export interface ExecutiveKpiSummary {
  totalRevenueYTD: number;
  ebitdaMargin: number;
  overallPlantOEE: number;
  firstPassYield: number;
  onTimeDeliveryOTIF: number;
  scrapRate: number;
  kpis: ExecutiveKpiItem[];
}

export interface OeeRecordItem {
  id: string;
  machineId: string;
  plantId: string;
  date: string;
  shift?: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  plannedTime: number;
  operatingTime: number;
  downtime: number;
  idealCycleTime: number;
  actualCycleTime: number;
  totalCount: number;
  goodCount: number;
  defectCount: number;
}

export interface OeeLossParetoItem {
  category: string;
  lossType: 'AVAILABILITY' | 'PERFORMANCE' | 'QUALITY';
  lossHours: number;
  percentage: number;
  cumulative: number;
}

export interface QualityMetricItem {
  id: string;
  plantId: string;
  itemId?: string;
  workOrderId?: string;
  date: string;
  shift?: string;
  totalProduced: number;
  totalInspected: number;
  defectsFound: number;
  defectRate: number;
  ppm: number;
  yield: number;
  firstPassYield: number;
  sigmaLevel: number;
  dpmo: number;
  costOfPoorQuality: number;
}

export interface InventoryAgingItem {
  id: string;
  plantId: string;
  warehouseId: string;
  itemId: string;
  batchNumber?: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  ageDays: number;
  agingBucket: 'DAYS_0_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'DAYS_91_180' | 'DAYS_180_PLUS';
  velocity: number;
  turnoverRatio: number;
  isSlowMoving: boolean;
  isObsolete: boolean;
}

export interface ScmKpiItem {
  id: string;
  kpiCategory: string;
  kpiName: string;
  kpiValue: number;
  kpiTarget?: number;
  kpiUnit: string;
  period: string;
  plantId?: string;
  supplierId?: string;
  trend?: string;
  variancePct?: number;
}

export interface EsgMetricItem {
  id: string;
  metricCategory: string;
  metricName: string;
  metricValue: number;
  metricUnit: string;
  period: string;
  plantId?: string;
  scope?: string;
  source?: string;
  reductionTarget?: number;
  actualReduction?: number;
}

export interface MaintenanceMetricItem {
  id: string;
  machineId: string;
  plantId: string;
  period: string;
  totalOperatingTime: number;
  numberOfFailures: number;
  mtbf: number;
  totalDowntime: number;
  numberOfRepairs: number;
  mttr: number;
  availability: number;
  maintenanceCost: number;
  costPerHour: number;
}

export interface DocumentTemplateItem {
  id: string;
  templateCode: string;
  templateName: string;
  templateType: 'ANALYTICS' | 'OPERATIONAL' | 'COMPLIANCE' | 'FINANCIAL' | 'CUSTOM';
  category: string;
  description?: string;
  structure: any;
  defaultFilters?: any;
  defaultColumns?: any;
  isSystemTemplate?: boolean;
  isPublic?: boolean;
  isActive: boolean;
}

export interface ChatSessionItem {
  id: string;
  userId: string;
  sessionType: string;
  title?: string;
  context?: any;
  isActive: boolean;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  metadata?: any;
  createdAt: string;
}
