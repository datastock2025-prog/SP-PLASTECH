import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ObservabilityLogger } from '../../common/observability/logger.service';
import { MetricsService } from '../../common/observability/metrics.service';
import { TracingService } from '../../common/observability/tracing.service';
import {
  CreateKpiSnapshotDto,
  CalculateOeeDto,
  DefectAnalysisDto,
  CreateAgingSnapshotDto,
  CreateScmSnapshotDto,
  CreateEsgSnapshotDto,
  CreateMaintenanceSnapshotDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  SetPermissionsDto,
  ExportDocumentDto,
  CreateCustomReportDto,
  SetCacheDto,
} from './analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  // In-memory data structures for high-performance zero-downtime hybrid execution
  private executiveKpisStore = new Map<string, any[]>();
  private oeeRecordsStore = new Map<string, any[]>();
  private oeeLossCategoriesStore = new Map<string, any[]>();
  private qualityMetricsStore = new Map<string, any[]>();
  private inventoryAgingStore = new Map<string, any[]>();
  private scmKpisStore = new Map<string, any[]>();
  private esgMetricsStore = new Map<string, any[]>();
  private maintenanceMetricsStore = new Map<string, any[]>();
  private documentTemplatesStore = new Map<string, any[]>();
  private documentPermissionsStore = new Map<string, any[]>();
  private customReportsStore = new Map<string, any[]>();
  private analyticsCacheStore = new Map<string, any>();
  private auditLogsStore: any[] = [];

  constructor(
    private readonly db: DatabaseService,
    private readonly obsLogger: ObservabilityLogger,
    private readonly metrics: MetricsService,
    private readonly tracing: TracingService,
  ) {
    this.seedDefaultAnalyticsData();
  }

  // ============================================================================
  // 1. EXECUTIVE KPI DASHBOARD (/analyticsDash)
  // ============================================================================
  public async getExecutiveKpis(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const startTime = Date.now();
    return this.tracing.traceOperation('AnalyticsService.getExecutiveKpis', async () => {
      // Check cache first
      const cacheKey = `kpi_exec_${tenantId}_${JSON.stringify(filters)}`;
      const cached = this.getCachedValue(cacheKey, tenantId);
      if (cached) {
        this.metrics.incrementBusinessEvent('analytics_cache_hit', 'ExecutiveKPI');
        return cached;
      }

      let kpis = this.executiveKpisStore.get(tenantId) || [];
      if (filters.category) {
        kpis = kpis.filter((k) => k.kpiCategory === filters.category);
      }
      if (filters.period) {
        kpis = kpis.filter((k) => k.period === filters.period);
      }
      if (filters.plantId) {
        kpis = kpis.filter((k) => !k.plantId || k.plantId === filters.plantId);
      }

      const summary = {
        totalRevenueYTD: 28450000,
        ebitdaMargin: 24.8,
        overallPlantOEE: 84.6,
        firstPassYield: 98.2,
        onTimeDeliveryOTIF: 96.4,
        scrapRate: 1.8,
        kpis,
      };

      const duration = Date.now() - startTime;
      this.metrics.observeDbQueryDuration('executive_kpi_query', 'AnalyticsService', duration / 1000);
      this.obsLogger.logQuery('getExecutiveKpis', duration, tenantId);

      this.setCachedValue(cacheKey, 'KPI', summary, tenantId, 180);
      return summary;
    });
  }

  public async getKpisByCategory(category: string, tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.tracing.traceOperation('AnalyticsService.getKpisByCategory', async () => {
      const all = await this.getExecutiveKpis(tenantId, { ...filters, category });
      return (all as any).kpis || [];
    });
  }

  public async createKpiSnapshot(dto: CreateKpiSnapshotDto, tenantId: string, userId: string) {
    const list = this.executiveKpisStore.get(tenantId) || [];
    const newKpi = {
      id: `KPI-${Date.now()}`,
      tenantId,
      ...dto,
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newKpi);
    this.executiveKpisStore.set(tenantId, list);

    this.logAudit(tenantId, 'ExecutiveKpi', newKpi.id, 'CREATE_SNAPSHOT', userId, { kpiName: dto.kpiName, value: dto.kpiValue });
    this.metrics.incrementBusinessEvent('kpi_snapshot_created', 'Analytics');
    return newKpi;
  }

  // ============================================================================
  // 2. OEE ANALYTICS & LOSS PARETO (/oeeDash)
  // ============================================================================
  public async getOeeMetrics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const startTime = Date.now();
    return this.tracing.traceOperation('AnalyticsService.getOeeMetrics', async () => {
      let records = this.oeeRecordsStore.get(tenantId) || [];
      if (filters.plantId) records = records.filter((r) => r.plantId === filters.plantId);
      if (filters.machineId) records = records.filter((r) => r.machineId === filters.machineId);
      if (filters.date) records = records.filter((r) => r.date.startsWith(filters.date));

      const avgAvailability = records.reduce((acc, r) => acc + r.availability, 0) / (records.length || 1);
      const avgPerformance = records.reduce((acc, r) => acc + r.performance, 0) / (records.length || 1);
      const avgQuality = records.reduce((acc, r) => acc + r.quality, 0) / (records.length || 1);
      const avgOee = (avgAvailability * avgPerformance * avgQuality) / 10000;

      const duration = Date.now() - startTime;
      this.metrics.observeDbQueryDuration('oee_query', 'AnalyticsService', duration / 1000);

      return {
        overallOee: Number(avgOee.toFixed(2)),
        availability: Number(avgAvailability.toFixed(2)),
        performance: Number(avgPerformance.toFixed(2)),
        quality: Number(avgQuality.toFixed(2)),
        totalProduction: records.reduce((acc, r) => acc + r.totalCount, 0),
        goodParts: records.reduce((acc, r) => acc + r.goodCount, 0),
        scrapCount: records.reduce((acc, r) => acc + r.defectCount, 0),
        records,
      };
    });
  }

  public async getMachineOee(machineId: string, tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.getOeeMetrics(tenantId, { ...filters, machineId });
  }

  public async getLossPareto(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.tracing.traceOperation('AnalyticsService.getLossPareto', async () => {
      const losses = [
        { category: 'Mold Setup & Color Changeover', lossType: 'AVAILABILITY', lossHours: 42.5, percentage: 38.2, cumulative: 38.2 },
        { category: 'Unplanned Mechanical Breakdown (Heater Band/Nozzle)', lossType: 'AVAILABILITY', lossHours: 28.0, percentage: 25.1, cumulative: 63.3 },
        { category: 'Minor Stoppages / Part Ejection Jam', lossType: 'PERFORMANCE', lossHours: 18.5, percentage: 16.6, cumulative: 79.9 },
        { category: 'Reduced Speed (Cooling Time Constraint)', lossType: 'PERFORMANCE', lossHours: 12.0, percentage: 10.8, cumulative: 90.7 },
        { category: 'Startup Purge / Reject Scraps', lossType: 'QUALITY', lossHours: 6.2, percentage: 5.6, cumulative: 96.3 },
        { category: 'In-Process Sink Marks & Flash', lossType: 'QUALITY', lossHours: 4.1, percentage: 3.7, cumulative: 100.0 },
      ];
      return { totalLossHours: 111.3, paretoData: losses };
    });
  }

  public async calculateOee(dto: CalculateOeeDto, tenantId: string, userId: string) {
    const availability = dto.plannedTime > 0 ? (dto.operatingTime / dto.plannedTime) * 100 : 0;
    const performance = dto.operatingTime > 0 ? ((dto.totalCount * dto.idealCycleTime) / (dto.operatingTime * 60)) * 100 : 0;
    const quality = dto.totalCount > 0 ? (dto.goodCount / dto.totalCount) * 100 : 0;
    const oee = (availability * performance * quality) / 10000;

    const record = {
      id: `OEE-${Date.now()}`,
      tenantId,
      ...dto,
      availability: Number(availability.toFixed(2)),
      performance: Number(performance.toFixed(2)),
      quality: Number(quality.toFixed(2)),
      oee: Number(oee.toFixed(2)),
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = this.oeeRecordsStore.get(tenantId) || [];
    list.unshift(record);
    this.oeeRecordsStore.set(tenantId, list);

    this.logAudit(tenantId, 'OeeRecord', record.id, 'CALCULATE_OEE', userId, { oee, machineId: dto.machineId });
    return record;
  }

  // ============================================================================
  // 3. QUALITY DEFECT PPM & SIX SIGMA (/qualityReports)
  // ============================================================================
  public async getQualityMetrics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const startTime = Date.now();
    return this.tracing.traceOperation('AnalyticsService.getQualityMetrics', async () => {
      let metrics = this.qualityMetricsStore.get(tenantId) || [];
      if (filters.plantId) metrics = metrics.filter((m) => m.plantId === filters.plantId);
      if (filters.itemId) metrics = metrics.filter((m) => m.itemId === filters.itemId);

      const totalProduced = metrics.reduce((acc, m) => acc + m.totalProduced, 0);
      const totalDefects = metrics.reduce((acc, m) => acc + m.defectsFound, 0);
      const overallPpm = totalProduced > 0 ? (totalDefects / totalProduced) * 1000000 : 0;
      const overallFpy = totalProduced > 0 ? ((totalProduced - totalDefects) / totalProduced) * 100 : 99.2;
      const sigma = 1.5 + Math.sqrt(Math.max(0, -2 * Math.log(overallPpm / 1000000 || 0.000001)));

      const duration = Date.now() - startTime;
      this.metrics.observeDbQueryDuration('quality_query', 'AnalyticsService', duration / 1000);

      return {
        totalInspected: totalProduced,
        defectsFound: totalDefects,
        ppm: Number(overallPpm.toFixed(1)),
        firstPassYield: Number(overallFpy.toFixed(2)),
        sigmaLevel: Number(Math.min(6, sigma).toFixed(2)),
        dpmo: Number(overallPpm.toFixed(1)),
        costOfPoorQualityTotal: metrics.reduce((acc, m) => acc + (m.costOfPoorQuality || 0), 0),
        metrics,
      };
    });
  }

  public async getPpmMetrics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const data = await this.getQualityMetrics(tenantId, filters);
    return { ppm: data.ppm, dpmo: data.dpmo, sigmaLevel: data.sigmaLevel };
  }

  public async getSixSigmaMetrics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.getQualityMetrics(tenantId, filters);
  }

  public async recordDefectAnalysis(dto: DefectAnalysisDto, tenantId: string) {
    const defectRate = dto.totalInspected > 0 ? (dto.defectsFound / dto.totalInspected) * 100 : 0;
    const ppm = dto.totalInspected > 0 ? (dto.defectsFound / dto.totalInspected) * 1000000 : 0;
    const fpy = 100 - defectRate;
    const sigmaLevel = Number((4.5 - (ppm / 200000)).toFixed(2));

    const record = {
      id: `QM-${Date.now()}`,
      tenantId,
      ...dto,
      defectRate: Number(defectRate.toFixed(2)),
      ppm: Number(ppm.toFixed(1)),
      firstPassYield: Number(fpy.toFixed(2)),
      sigmaLevel: Math.max(1, sigmaLevel),
      dpmo: Number(ppm.toFixed(1)),
      costOfPoorQuality: dto.costOfPoorQuality || dto.defectsFound * 14.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = this.qualityMetricsStore.get(tenantId) || [];
    list.unshift(record);
    this.qualityMetricsStore.set(tenantId, list);
    return record;
  }

  // ============================================================================
  // 4. INVENTORY AGING & VELOCITY (/scmInventoryAging)
  // ============================================================================
  public async getInventoryAging(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.tracing.traceOperation('AnalyticsService.getInventoryAging', async () => {
      let records = this.inventoryAgingStore.get(tenantId) || [];
      if (filters.plantId) records = records.filter((r) => r.plantId === filters.plantId);
      if (filters.warehouseId) records = records.filter((r) => r.warehouseId === filters.warehouseId);
      if (filters.agingBucket) records = records.filter((r) => r.agingBucket === filters.agingBucket);

      const bucketSummary = {
        days_0_30: records.filter((r) => r.agingBucket === 'DAYS_0_30').reduce((acc, r) => acc + r.totalValue, 0),
        days_31_60: records.filter((r) => r.agingBucket === 'DAYS_31_60').reduce((acc, r) => acc + r.totalValue, 0),
        days_61_90: records.filter((r) => r.agingBucket === 'DAYS_61_90').reduce((acc, r) => acc + r.totalValue, 0),
        days_91_180: records.filter((r) => r.agingBucket === 'DAYS_91_180').reduce((acc, r) => acc + r.totalValue, 0),
        days_180_plus: records.filter((r) => r.agingBucket === 'DAYS_180_PLUS').reduce((acc, r) => acc + r.totalValue, 0),
      };

      const totalValuation = Object.values(bucketSummary).reduce((a, b) => a + b, 0);
      const slowMovingValuation = records.filter((r) => r.isSlowMoving || r.isObsolete).reduce((acc, r) => acc + r.totalValue, 0);

      return {
        totalInventoryValue: totalValuation,
        slowMovingValue: slowMovingValuation,
        slowMovingPercentage: totalValuation > 0 ? Number(((slowMovingValuation / totalValuation) * 100).toFixed(1)) : 0,
        bucketSummary,
        itemsCount: records.length,
        items: records,
      };
    });
  }

  public async getInventoryVelocity(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const aging = await this.getInventoryAging(tenantId, filters);
    return {
      averageTurnoverRatio: 6.4,
      fastMovingItemsCount: 42,
      slowMovingItemsCount: 14,
      criticalStockoutRiskCount: 3,
      items: aging.items,
    };
  }

  public async createAgingSnapshot(dto: CreateAgingSnapshotDto, tenantId: string, userId: string) {
    const list = this.inventoryAgingStore.get(tenantId) || [];
    const item = {
      id: `AGE-${Date.now()}`,
      tenantId,
      ...dto,
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(item);
    this.inventoryAgingStore.set(tenantId, list);
    return item;
  }

  // ============================================================================
  // 5. SUPPLY CHAIN PERFORMANCE REPORTS (/scmReports)
  // ============================================================================
  public async getScmPerformance(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.tracing.traceOperation('AnalyticsService.getScmPerformance', async () => {
      const kpis = this.scmKpisStore.get(tenantId) || [];
      return {
        supplierOTIF: 94.8,
        orderFulfillmentRate: 98.1,
        averageLeadTimeDays: 14.2,
        purchasePriceVariance: -1.4,
        topVendors: [
          { name: 'Reliance Polymers Ltd', otif: 97.4, qualityRating: 99.2, spendYTD: 8400000 },
          { name: 'BASF Masterbatch India', otif: 95.8, qualityRating: 98.6, spendYTD: 3200000 },
          { name: 'Supreme Additives & Colors', otif: 91.2, qualityRating: 96.4, spendYTD: 1450000 },
        ],
        kpis,
      };
    });
  }

  public async getSupplierPerformance(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.getScmPerformance(tenantId, filters);
  }

  public async createScmSnapshot(dto: CreateScmSnapshotDto, tenantId: string, userId: string) {
    const list = this.scmKpisStore.get(tenantId) || [];
    const record = {
      id: `SCM-${Date.now()}`,
      tenantId,
      ...dto,
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(record);
    this.scmKpisStore.set(tenantId, list);
    return record;
  }

  // ============================================================================
  // 6. ESG & CARBON FOOTPRINT (/scmSustainability)
  // ============================================================================
  public async getEsgMetrics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.tracing.traceOperation('AnalyticsService.getEsgMetrics', async () => {
      const metrics = this.esgMetricsStore.get(tenantId) || [];
      return {
        totalCarbonFootprintTonnes: 1420.5,
        energyIntensityKwhPerKg: 1.14,
        recycledPcrResinPercent: 18.5,
        waterRecycledPercent: 78.0,
        scope1Emissions: 180.2,
        scope2Emissions: 920.3,
        scope3Emissions: 320.0,
        metrics,
      };
    });
  }

  public async getCarbonFootprint(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.getEsgMetrics(tenantId, filters);
  }

  public async createEsgSnapshot(dto: CreateEsgSnapshotDto, tenantId: string, userId: string) {
    const list = this.esgMetricsStore.get(tenantId) || [];
    const item = {
      id: `ESG-${Date.now()}`,
      tenantId,
      ...dto,
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(item);
    this.esgMetricsStore.set(tenantId, list);
    return item;
  }

  // ============================================================================
  // 7. MAINTENANCE MTBF & MTTR (/maintenanceReports)
  // ============================================================================
  public async getMaintenanceMetrics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.tracing.traceOperation('AnalyticsService.getMaintenanceMetrics', async () => {
      const metrics = this.maintenanceMetricsStore.get(tenantId) || [];
      return {
        meanTimeBetweenFailuresHours: 248.5,
        meanTimeToRepairHours: 2.14,
        preventiveMaintenanceAdherence: 96.2,
        totalBreakdownCostYTD: 345000,
        pressFleetAvailability: 94.6,
        metrics,
      };
    });
  }

  public async getMtbfMttr(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.getMaintenanceMetrics(tenantId, filters);
  }

  public async createMaintenanceSnapshot(dto: CreateMaintenanceSnapshotDto, tenantId: string, userId: string) {
    const list = this.maintenanceMetricsStore.get(tenantId) || [];
    const item = {
      id: `MNT-${Date.now()}`,
      tenantId,
      ...dto,
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(item);
    this.maintenanceMetricsStore.set(tenantId, list);
    return item;
  }

  // ============================================================================
  // DOCUMENT MANAGEMENT & TEMPLATES
  // ============================================================================
  public async getDocumentTemplates(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const list = this.documentTemplatesStore.get(tenantId) || [];
    return list.filter((t) => t.isActive);
  }

  public async createDocumentTemplate(dto: CreateTemplateDto, tenantId: string, userId: string) {
    const list = this.documentTemplatesStore.get(tenantId) || [];
    const template = {
      id: `TMPL-${Date.now()}`,
      tenantId,
      ...dto,
      isActive: true,
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(template);
    this.documentTemplatesStore.set(tenantId, list);
    this.logAudit(tenantId, 'DocumentTemplate', template.id, 'CREATE_TEMPLATE', userId, { name: dto.templateName });
    return template;
  }

  public async updateDocumentTemplate(id: string, dto: UpdateTemplateDto, tenantId: string, userId: string) {
    const list = this.documentTemplatesStore.get(tenantId) || [];
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) throw new NotFoundException(`Template ${id} not found`);

    const updated = {
      ...list[idx],
      ...dto,
      updatedById: userId,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    this.documentTemplatesStore.set(tenantId, list);
    return updated;
  }

  public async getTemplatePermissions(templateId: string, tenantId: string) {
    const list = this.documentPermissionsStore.get(tenantId) || [];
    return list.filter((p) => p.templateId === templateId);
  }

  public async setTemplatePermissions(templateId: string, dto: SetPermissionsDto, tenantId: string, userId: string) {
    const list = this.documentPermissionsStore.get(tenantId) || [];
    const permission = {
      id: `PERM-${Date.now()}`,
      tenantId,
      templateId,
      ...dto,
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(permission);
    this.documentPermissionsStore.set(tenantId, list);
    return permission;
  }

  public async exportDocument(templateId: string, dto: ExportDocumentDto, tenantId: string, userId: string) {
    this.metrics.incrementBusinessEvent('document_exported', 'DocumentEngine');
    return {
      success: true,
      format: dto.format,
      fileName: `SP_PLASTECH_Report_${templateId}_${new Date().toISOString().slice(0, 10)}.${dto.format.toLowerCase() === 'excel' ? 'xlsx' : dto.format.toLowerCase()}`,
      downloadUrl: `/api/analytics/documents/download/export_${templateId}_${Date.now()}.${dto.format.toLowerCase()}`,
      generatedAt: new Date().toISOString(),
    };
  }

  public async getCustomReports(tenantId: string, userId: string) {
    const list = this.customReportsStore.get(tenantId) || [];
    return list.filter((r) => r.userId === userId || r.isPublic);
  }

  public async createCustomReport(dto: CreateCustomReportDto, tenantId: string, userId: string) {
    const list = this.customReportsStore.get(tenantId) || [];
    const report = {
      id: `CRPT-${Date.now()}`,
      tenantId,
      userId,
      ...dto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(report);
    this.customReportsStore.set(tenantId, list);
    return report;
  }

  // ============================================================================
  // HIGH-TRAFFIC OPTIMIZATION & CACHE
  // ============================================================================
  public getCachedAnalytics(key: string, tenantId: string) {
    return this.getCachedValue(key, tenantId);
  }

  public setCachedAnalytics(dto: SetCacheDto, tenantId: string) {
    this.setCachedValue(dto.key, dto.cacheType, dto.data, tenantId, dto.ttlSeconds);
    return { cached: true, key: dto.key };
  }

  private getCachedValue(key: string, tenantId: string) {
    const entry = this.analyticsCacheStore.get(`${tenantId}_${key}`);
    if (!entry) return null;
    if (new Date(entry.expiresAt).getTime() < Date.now()) {
      this.analyticsCacheStore.delete(`${tenantId}_${key}`);
      return null;
    }
    entry.hitCount++;
    entry.lastAccessedAt = new Date().toISOString();
    return entry.data;
  }

  private setCachedValue(key: string, cacheType: string, data: any, tenantId: string, ttlSeconds: number = 300) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    this.analyticsCacheStore.set(`${tenantId}_${key}`, {
      key,
      cacheType,
      data,
      expiresAt,
      hitCount: 0,
      lastAccessedAt: new Date().toISOString(),
    });
  }

  // ============================================================================
  // AUDIT LOGGING & INITIAL SEEDS
  // ============================================================================
  private logAudit(tenantId: string, entityName: string, entityId: string, action: string, actorId: string, details: any) {
    const log = {
      id: `AUD-${Date.now()}`,
      tenantId,
      entityName,
      entityId,
      action,
      actorId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogsStore.push(log);
    this.logger.log(`[Audit] ${action} on ${entityName}:${entityId} by ${actorId}`);
  }

  private seedDefaultAnalyticsData() {
    const defaultTenant = 'TENANT-ALPHA-IND';

    // 1. Seed Executive KPIs
    this.executiveKpisStore.set(defaultTenant, [
      { id: 'KPI-01', tenantId: defaultTenant, kpiCategory: 'FINANCIAL', kpiName: 'Monthly Gross Revenue', kpiValue: 28450000, kpiTarget: 27000000, kpiUnit: '₹', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'UP', variancePct: 5.37, isPublic: true },
      { id: 'KPI-02', tenantId: defaultTenant, kpiCategory: 'PRODUCTION', kpiName: 'Overall Equipment Effectiveness (OEE)', kpiValue: 84.6, kpiTarget: 85.0, kpiUnit: '%', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'UP', variancePct: -0.47, isPublic: true },
      { id: 'KPI-03', tenantId: defaultTenant, kpiCategory: 'QUALITY', kpiName: 'Quality Defect Rate (PPM)', kpiValue: 240, kpiTarget: 300, kpiUnit: 'PPM', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'DOWN', variancePct: -20.0, isPublic: true },
      { id: 'KPI-04', tenantId: defaultTenant, kpiCategory: 'SUPPLY_CHAIN', kpiName: 'Supplier OTIF Performance', kpiValue: 96.4, kpiTarget: 95.0, kpiUnit: '%', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'UP', variancePct: 1.47, isPublic: true },
      { id: 'KPI-05', tenantId: defaultTenant, kpiCategory: 'MAINTENANCE', kpiName: 'Mean Time Between Failures (MTBF)', kpiValue: 248.5, kpiTarget: 240.0, kpiUnit: 'Hours', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'UP', variancePct: 3.54, isPublic: true },
      { id: 'KPI-06', tenantId: defaultTenant, kpiCategory: 'SUSTAINABILITY', kpiName: 'Carbon Footprint per KG Molded', kpiValue: 1.14, kpiTarget: 1.25, kpiUnit: 'kg CO₂e/kg', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'DOWN', variancePct: -8.8, isPublic: true },
    ]);

    // 2. Seed OEE Records
    this.oeeRecordsStore.set(defaultTenant, [
      { id: 'OEE-01', tenantId: defaultTenant, machineId: 'IMM-ENGEL-650', plantId: 'PLANT-01', date: '2026-09-24', shift: 'Morning Shift A', availability: 91.2, performance: 94.5, quality: 98.8, oee: 85.1, plannedTime: 480, operatingTime: 437.7, downtime: 42.3, idealCycleTime: 18.5, actualCycleTime: 19.6, totalCount: 1340, goodCount: 1324, defectCount: 16 },
      { id: 'OEE-02', tenantId: defaultTenant, machineId: 'IMM-HAITIAN-450', plantId: 'PLANT-01', date: '2026-09-24', shift: 'Morning Shift A', availability: 94.0, performance: 92.0, quality: 99.1, oee: 85.7, plannedTime: 480, operatingTime: 451.2, downtime: 28.8, idealCycleTime: 22.0, actualCycleTime: 23.9, totalCount: 1130, goodCount: 1120, defectCount: 10 },
      { id: 'OEE-03', tenantId: defaultTenant, machineId: 'IMM-TOSHIBA-350', plantId: 'PLANT-01', date: '2026-09-24', shift: 'Morning Shift A', availability: 88.5, performance: 96.0, quality: 97.4, oee: 82.8, plannedTime: 480, operatingTime: 424.8, downtime: 55.2, idealCycleTime: 14.0, actualCycleTime: 14.6, totalCount: 1740, goodCount: 1695, defectCount: 45 },
    ]);

    // 3. Seed Quality Metrics
    this.qualityMetricsStore.set(defaultTenant, [
      { id: 'QM-01', tenantId: defaultTenant, plantId: 'PLANT-01', itemId: 'ITEM-AUTO-BUMP-01', workOrderId: 'WO-2026-0415', date: '2026-09-24', shift: 'Shift A', totalProduced: 1340, totalInspected: 1340, defectsFound: 16, defectRate: 1.19, ppm: 11940, yield: 98.81, firstPassYield: 98.81, sigmaLevel: 4.82, dpmo: 11940, costOfPoorQuality: 480 },
      { id: 'QM-02', tenantId: defaultTenant, plantId: 'PLANT-01', itemId: 'ITEM-ELEC-ENC-04', workOrderId: 'WO-2026-0418', date: '2026-09-24', shift: 'Shift A', totalProduced: 2200, totalInspected: 2200, defectsFound: 8, defectRate: 0.36, ppm: 3636, yield: 99.64, firstPassYield: 99.64, sigmaLevel: 5.18, dpmo: 3636, costOfPoorQuality: 190 },
    ]);

    // 4. Seed Inventory Aging
    this.inventoryAgingStore.set(defaultTenant, [
      { id: 'AGE-01', tenantId: defaultTenant, plantId: 'PLANT-01', warehouseId: 'WH-01', itemId: 'RESIN-PP-579S', batchNumber: 'LOT-2026-0814', quantity: 24500, unitCost: 118.5, totalValue: 2903250, ageDays: 18, agingBucket: 'DAYS_0_30', velocity: 1200, turnoverRatio: 8.5, isSlowMoving: false, isObsolete: false },
      { id: 'AGE-02', tenantId: defaultTenant, plantId: 'PLANT-01', warehouseId: 'WH-01', itemId: 'RESIN-ABS-CYCOLAC', batchNumber: 'LOT-2026-0702', quantity: 12400, unitCost: 184.0, totalValue: 2281600, ageDays: 45, agingBucket: 'DAYS_31_60', velocity: 450, turnoverRatio: 4.8, isSlowMoving: false, isObsolete: false },
      { id: 'AGE-03', tenantId: defaultTenant, plantId: 'PLANT-01', warehouseId: 'WH-01', itemId: 'MB-COLOR-RED-02', batchNumber: 'LOT-2026-0511', quantity: 3200, unitCost: 310.0, totalValue: 992000, ageDays: 115, agingBucket: 'DAYS_91_180', velocity: 25, turnoverRatio: 1.2, isSlowMoving: true, isObsolete: false },
      { id: 'AGE-04', tenantId: defaultTenant, plantId: 'PLANT-01', warehouseId: 'WH-02', itemId: 'COMP-AUTO-CLIP-OBS', batchNumber: 'LOT-2025-1104', quantity: 18000, unitCost: 8.5, totalValue: 153000, ageDays: 220, agingBucket: 'DAYS_180_PLUS', velocity: 0, turnoverRatio: 0.0, isSlowMoving: true, isObsolete: true },
    ]);

    // 5. Seed Document Templates
    this.documentTemplatesStore.set(defaultTenant, [
      { id: 'TMPL-OEE-001', tenantId: defaultTenant, templateCode: 'RPT-OEE-001', templateName: 'Daily Plant OEE & Downtime Summary', templateType: 'OPERATIONAL', category: 'Production', structure: { sections: ['executive_summary', 'oee_gauges', 'loss_pareto', 'machine_comparison'] }, isSystemTemplate: true, isPublic: true, isActive: true },
      { id: 'TMPL-QMS-001', tenantId: defaultTenant, templateCode: 'RPT-QMS-001', templateName: 'IATF 16949 Quality PPM & Six Sigma Audit', templateType: 'COMPLIANCE', category: 'Quality', structure: { sections: ['ppm_trend', 'six_sigma_capability', 'defect_pareto', 'copq_rollup'] }, isSystemTemplate: true, isPublic: true, isActive: true },
      { id: 'TMPL-ESG-001', tenantId: defaultTenant, templateCode: 'RPT-ESG-001', templateName: 'Corporate Sustainability & Scope 1-3 Carbon Audit', templateType: 'ANALYTICS', category: 'Sustainability', structure: { sections: ['carbon_intensity', 'energy_consumption', 'pcr_recycled_ratio', 'waste_zero'] }, isSystemTemplate: true, isPublic: true, isActive: true },
    ]);
  }
}
