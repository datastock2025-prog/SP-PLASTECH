import {
  ExecutiveKpiSummary,
  OeeRecordItem,
  OeeLossParetoItem,
  QualityMetricItem,
  InventoryAgingItem,
  ScmKpiItem,
  EsgMetricItem,
  MaintenanceMetricItem,
  DocumentTemplateItem,
} from '../../types/analyticsTypes';

export const MOCK_EXECUTIVE_KPIS_SUMMARY: ExecutiveKpiSummary = {
  totalRevenueYTD: 28450000,
  ebitdaMargin: 24.8,
  overallPlantOEE: 84.6,
  firstPassYield: 98.2,
  onTimeDeliveryOTIF: 96.4,
  scrapRate: 1.8,
  kpis: [
    { id: 'KPI-01', tenantId: 'TENANT-ALPHA-IND', kpiCategory: 'FINANCIAL', kpiName: 'Monthly Gross Revenue', kpiValue: 28450000, kpiTarget: 27000000, kpiUnit: '₹', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'UP', variancePct: 5.37, isPublic: true },
    { id: 'KPI-02', tenantId: 'TENANT-ALPHA-IND', kpiCategory: 'PRODUCTION', kpiName: 'Plant OEE Average', kpiValue: 84.6, kpiTarget: 85.0, kpiUnit: '%', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'UP', variancePct: -0.47, isPublic: true },
    { id: 'KPI-03', tenantId: 'TENANT-ALPHA-IND', kpiCategory: 'QUALITY', kpiName: 'Customer Defect Rate', kpiValue: 240, kpiTarget: 300, kpiUnit: 'PPM', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'DOWN', variancePct: -20.0, isPublic: true },
    { id: 'KPI-04', tenantId: 'TENANT-ALPHA-IND', kpiCategory: 'SUPPLY_CHAIN', kpiName: 'Supplier OTIF Rate', kpiValue: 96.4, kpiTarget: 95.0, kpiUnit: '%', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'UP', variancePct: 1.47, isPublic: true },
    { id: 'KPI-05', tenantId: 'TENANT-ALPHA-IND', kpiCategory: 'MAINTENANCE', kpiName: 'Mean Time Between Failures', kpiValue: 248.5, kpiTarget: 240.0, kpiUnit: 'Hrs', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'UP', variancePct: 3.54, isPublic: true },
    { id: 'KPI-06', tenantId: 'TENANT-ALPHA-IND', kpiCategory: 'SUSTAINABILITY', kpiName: 'Carbon Intensity per KG', kpiValue: 1.14, kpiTarget: 1.25, kpiUnit: 'kg CO₂e/kg', period: '2026-09', periodType: 'MONTHLY', year: 2026, month: 9, plantId: 'PLANT-01', trend: 'DOWN', variancePct: -8.8, isPublic: true },
  ],
};

export const MOCK_OEE_RECORDS: OeeRecordItem[] = [
  { id: 'OEE-01', machineId: 'IMM-ENGEL-650 (Press 04)', plantId: 'PLANT-01', date: '2026-09-24', shift: 'Morning Shift A', availability: 91.2, performance: 94.5, quality: 98.8, oee: 85.1, plannedTime: 480, operatingTime: 437.7, downtime: 42.3, idealCycleTime: 18.5, actualCycleTime: 19.6, totalCount: 1340, goodCount: 1324, defectCount: 16 },
  { id: 'OEE-02', machineId: 'IMM-HAITIAN-450 (Press 02)', plantId: 'PLANT-01', date: '2026-09-24', shift: 'Morning Shift A', availability: 94.0, performance: 92.0, quality: 99.1, oee: 85.7, plannedTime: 480, operatingTime: 451.2, downtime: 28.8, idealCycleTime: 22.0, actualCycleTime: 23.9, totalCount: 1130, goodCount: 1120, defectCount: 10 },
  { id: 'OEE-03', machineId: 'IMM-TOSHIBA-350 (Press 01)', plantId: 'PLANT-01', date: '2026-09-24', shift: 'Morning Shift A', availability: 88.5, performance: 96.0, quality: 97.4, oee: 82.8, plannedTime: 480, operatingTime: 424.8, downtime: 55.2, idealCycleTime: 14.0, actualCycleTime: 14.6, totalCount: 1740, goodCount: 1695, defectCount: 45 },
];

export const MOCK_LOSS_PARETO: OeeLossParetoItem[] = [
  { category: 'Mold Setup & Color Changeover', lossType: 'AVAILABILITY', lossHours: 42.5, percentage: 38.2, cumulative: 38.2 },
  { category: 'Unplanned Mechanical Breakdown', lossType: 'AVAILABILITY', lossHours: 28.0, percentage: 25.1, cumulative: 63.3 },
  { category: 'Minor Stoppages / Part Jam', lossType: 'PERFORMANCE', lossHours: 18.5, percentage: 16.6, cumulative: 79.9 },
  { category: 'Reduced Speed (Cooling Time)', lossType: 'PERFORMANCE', lossHours: 12.0, percentage: 10.8, cumulative: 90.7 },
  { category: 'Startup Purge / Reject Scrap', lossType: 'QUALITY', lossHours: 6.2, percentage: 5.6, cumulative: 96.3 },
  { category: 'In-Process Sink Marks & Flash', lossType: 'QUALITY', lossHours: 4.1, percentage: 3.7, cumulative: 100.0 },
];

export const MOCK_QUALITY_METRICS: QualityMetricItem[] = [
  { id: 'QM-01', plantId: 'PLANT-01', itemId: 'ITEM-AUTO-BUMP-01 (Front Bumper Facia)', workOrderId: 'WO-2026-0415', date: '2026-09-24', shift: 'Shift A', totalProduced: 1340, totalInspected: 1340, defectsFound: 16, defectRate: 1.19, ppm: 11940, yield: 98.81, firstPassYield: 98.81, sigmaLevel: 4.82, dpmo: 11940, costOfPoorQuality: 480 },
  { id: 'QM-02', plantId: 'PLANT-01', itemId: 'ITEM-ELEC-ENC-04 (IP67 Terminal Box)', workOrderId: 'WO-2026-0418', date: '2026-09-24', shift: 'Shift A', totalProduced: 2200, totalInspected: 2200, defectsFound: 8, defectRate: 0.36, ppm: 3636, yield: 99.64, firstPassYield: 99.64, sigmaLevel: 5.18, dpmo: 3636, costOfPoorQuality: 190 },
];

export const MOCK_INVENTORY_AGING: InventoryAgingItem[] = [
  { id: 'AGE-01', plantId: 'PLANT-01', warehouseId: 'WH-01 (Raw Silos)', itemId: 'RESIN-PP-579S (Polypropylene Prime)', batchNumber: 'LOT-2026-0814', quantity: 24500, unitCost: 118.5, totalValue: 2903250, ageDays: 18, agingBucket: 'DAYS_0_30', velocity: 1200, turnoverRatio: 8.5, isSlowMoving: false, isObsolete: false },
  { id: 'AGE-02', plantId: 'PLANT-01', warehouseId: 'WH-01 (Raw Silos)', itemId: 'RESIN-ABS-CYCOLAC (High Heat ABS)', batchNumber: 'LOT-2026-0702', quantity: 12400, unitCost: 184.0, totalValue: 2281600, ageDays: 45, agingBucket: 'DAYS_31_60', velocity: 450, turnoverRatio: 4.8, isSlowMoving: false, isObsolete: false },
  { id: 'AGE-03', plantId: 'PLANT-01', warehouseId: 'WH-01 (Raw Silos)', itemId: 'MB-COLOR-RED-02 (Flame Red Masterbatch)', batchNumber: 'LOT-2026-0511', quantity: 3200, unitCost: 310.0, totalValue: 992000, ageDays: 115, agingBucket: 'DAYS_91_180', velocity: 25, turnoverRatio: 1.2, isSlowMoving: true, isObsolete: false },
  { id: 'AGE-04', plantId: 'PLANT-01', warehouseId: 'WH-02 (Finished Goods)', itemId: 'COMP-AUTO-CLIP-OBS (Legacy Retainer Clip)', batchNumber: 'LOT-2025-1104', quantity: 18000, unitCost: 8.5, totalValue: 153000, ageDays: 220, agingBucket: 'DAYS_180_PLUS', velocity: 0, turnoverRatio: 0.0, isSlowMoving: true, isObsolete: true },
];

export const MOCK_SCM_KPIS: ScmKpiItem[] = [
  { id: 'SCM-01', kpiCategory: 'ON_TIME_DELIVERY', kpiName: 'Supplier OTIF Score', kpiValue: 96.4, kpiTarget: 95.0, kpiUnit: '%', period: '2026-09', trend: 'UP', variancePct: 1.4 },
  { id: 'SCM-02', kpiCategory: 'LEAD_TIME', kpiName: 'Average Inbound Lead Time', kpiValue: 14.2, kpiTarget: 15.0, kpiUnit: 'Days', period: '2026-09', trend: 'DOWN', variancePct: -5.3 },
  { id: 'SCM-03', kpiCategory: 'COST_VARIANCE', kpiName: 'Purchase Price Variance (PPV)', kpiValue: -1.4, kpiTarget: 0.0, kpiUnit: '%', period: '2026-09', trend: 'DOWN', variancePct: -1.4 },
];

export const MOCK_ESG_METRICS: EsgMetricItem[] = [
  { id: 'ESG-01', metricCategory: 'CARBON_EMISSIONS', metricName: 'Scope 1 & 2 Carbon Intensity', metricValue: 1.14, metricUnit: 'kg CO₂e/kg', period: '2026-09', reductionTarget: 1.25, actualReduction: 0.11 },
  { id: 'ESG-02', metricCategory: 'ENERGY_CONSUMPTION', metricName: 'Electricity per Ton Molded', metricValue: 640.0, metricUnit: 'kWh/Ton', period: '2026-09', reductionTarget: 680.0, actualReduction: 40.0 },
  { id: 'ESG-03', metricCategory: 'RECYCLING_RATE', metricName: 'Post-Consumer Recycled (PCR) Resin', metricValue: 18.5, metricUnit: '%', period: '2026-09', reductionTarget: 15.0, actualReduction: 3.5 },
];

export const MOCK_MAINTENANCE_METRICS: MaintenanceMetricItem[] = [
  { id: 'MNT-01', machineId: 'IMM-ENGEL-650', plantId: 'PLANT-01', period: '2026-09', totalOperatingTime: 437.7, numberOfFailures: 1, mtbf: 437.7, totalDowntime: 42.3, numberOfRepairs: 1, mttr: 2.5, availability: 91.2, maintenanceCost: 14200, costPerHour: 32.4 },
  { id: 'MNT-02', machineId: 'IMM-HAITIAN-450', plantId: 'PLANT-01', period: '2026-09', totalOperatingTime: 451.2, numberOfFailures: 1, mtbf: 451.2, totalDowntime: 28.8, numberOfRepairs: 1, mttr: 1.8, availability: 94.0, maintenanceCost: 8900, costPerHour: 19.7 },
];

export const MOCK_DOCUMENT_TEMPLATES: DocumentTemplateItem[] = [
  { id: 'TMPL-OEE-001', templateCode: 'RPT-OEE-001', templateName: 'Daily Plant OEE & Downtime Summary', templateType: 'OPERATIONAL', category: 'Production', structure: { sections: ['executive_summary', 'oee_gauges', 'loss_pareto', 'machine_comparison'] }, isSystemTemplate: true, isPublic: true, isActive: true },
  { id: 'TMPL-QMS-001', templateCode: 'RPT-QMS-001', templateName: 'IATF 16949 Quality PPM & Six Sigma Audit', templateType: 'COMPLIANCE', category: 'Quality', structure: { sections: ['ppm_trend', 'six_sigma_capability', 'defect_pareto', 'copq_rollup'] }, isSystemTemplate: true, isPublic: true, isActive: true },
  { id: 'TMPL-ESG-001', templateCode: 'RPT-ESG-001', templateName: 'Corporate Sustainability & Scope 1-3 Carbon Audit', templateType: 'ANALYTICS', category: 'Sustainability', structure: { sections: ['carbon_intensity', 'energy_consumption', 'pcr_recycled_ratio', 'waste_zero'] }, isSystemTemplate: true, isPublic: true, isActive: true },
];
