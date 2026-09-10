export type SCMViewType =
  | 'scmControlTower'
  | 'scmDemandPlanning'
  | 'scmSalesForecast'
  | 'scmSOP'
  | 'scmInventoryPlanning'
  | 'scmMRP'
  | 'scmReplenishment'
  | 'scmSupplierCollaboration'
  | 'scmInboundLogistics'
  | 'scmOutboundLogistics'
  | 'scmFreight'
  | 'scmTrackTrace'
  | 'scmSupplierRisk'
  | 'scmInventoryAging'
  | 'scmOrderTimeline'
  | 'scmExceptions'
  | 'scmSustainability'
  | 'scmReports'
  | 'scmSettings'
  | 'scmRbac';

export type SCMStatusColor = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray';

export interface SCMKPI {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status: 'healthy' | 'warning' | 'critical' | 'neutral';
  category: 'demand' | 'supply' | 'inventory' | 'logistics' | 'quality' | 'risk';
}

export interface SupplyChainFlowNode {
  id: string;
  name: string;
  shortCode: string;
  status: 'healthy' | 'warning' | 'critical';
  recordCount: number;
  exceptionsCount: number;
  delayCount: number;
  valueSummary: string;
  targetView: SCMViewType;
  description: string;
  icon: string;
}

export interface SCMException {
  id: string;
  date: string;
  category: 'Demand' | 'Supply' | 'Inventory' | 'Production' | 'Quality' | 'Logistics' | 'Supplier' | 'Compliance';
  module: string;
  itemCode?: string;
  itemName?: string;
  customerOrSupplier: string;
  referenceDoc: string; // e.g. PO-8841, SO-4021, WO-9912
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: string;
  owner: string;
  status: 'Open' | 'Assigned' | 'Under Review' | 'Action Planned' | 'In Progress' | 'Resolved' | 'Closed';
  dueDate: string;
  recommendedAction: string;
  auditHistory?: Array<{ date: string; action: string; user: string }>;
}

export interface DemandPlanItem {
  id: string;
  period: string; // e.g. "Sep 2026", "W36 2026"
  customer: string;
  customerGroup: 'Automotive Tier-1' | 'FMCG Packaging' | 'Appliances & Consumer' | 'Industrial Pharma';
  itemCode: string;
  itemName: string;
  productFamily: string;
  resinGrade: string;
  forecastQty: number;
  orderQty: number;
  blanketOrderQty: number;
  consensusDemandQty: number;
  uom: string;
  variancePct: number;
  forecastAccuracyPct: number;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Locked' | 'Closed' | 'Rejected';
  salesperson: string;
  plant: string;
  warehouse: string;
}

export interface SalesForecastEntry {
  id: string;
  customer: string;
  itemCode: string;
  itemName: string;
  productFamily: string;
  periodType: 'Daily' | 'Weekly' | 'Monthly';
  periodValue: string;
  forecastQty: number;
  uom: string;
  priceEstimate: number;
  probabilityPct: number;
  source: 'Salesperson' | 'Customer Portal' | 'EDI / JIT Schedule' | 'CRM Opportunity' | 'Historical Trend';
  salesperson: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Locked' | 'Closed' | 'Rejected';
  lastUpdated: string;
  notes?: string;
  actualSalesOrderQty: number;
  actualDeliveredQty: number;
  varianceQty: number;
  variancePct: number;
  accuracyPct: number;
}

export interface SOPScenario {
  id: string;
  name: string;
  type: 'Baseline' | 'Best Case' | 'Worst Case' | 'Capacity-Constrained' | 'Inventory-Optimized';
  projectedRevenue: string;
  procurementCost: string;
  inventoryCarryingCost: string;
  expediteCost: string;
  stockoutRiskCost: string;
  overtimeCost: string;
  capacityUtilizationPct: number;
  stockCoverageDays: number;
  mfgFeasibilityPct: number;
  status: 'Active' | 'Draft' | 'Approved Consensus' | 'Archived';
}

export interface SCMInventoryItem {
  itemCode: string;
  itemName: string;
  category: 'Virgin Resin' | 'Masterbatch' | 'Chemical Additive' | 'Regrind' | 'Finished Good' | 'Packaging' | 'Spare Part';
  warehouseLocation: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  incomingSupply: number;
  outgoingDemand: number;
  projectedStock: number;
  safetyStock: number;
  reorderLevel: number;
  daysOfCover: number;
  uom: string;
  stockValue: number;
  status: 'Healthy' | 'Low Stock' | 'Critical Stock' | 'Overstock' | 'Expiring' | 'Obsolete' | 'Quarantined' | 'Stockout Risk';
  resinGrade?: string;
  mfi?: string;
  dosageCompatibility?: string;
  shelfLifeExpiryDate?: string;
  regrindSourceBatch?: string;
  customerAssigned?: string;
  ageBucket: '0-30 days' | '31-60 days' | '61-90 days' | '91-180 days' | '180+ days';
  lastMovementDate: string;
}

export interface MRPSuggestion {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  requiredDate: string;
  requiredQty: number;
  availableQty: number;
  incomingSupply: number;
  projectedShortage: number;
  suggestedOrderQty: number;
  uom: string;
  supplyType: 'Purchase' | 'Produce' | 'Transfer';
  preferredSupplier: string;
  leadTimeDays: number;
  moq: number;
  multipleOrderQty: number;
  estimatedCost: number;
  priority: 'Critical' | 'High' | 'Normal';
  status: 'Open' | 'Accepted' | 'Converted' | 'Ignored' | 'Pending Review' | 'Expired';
  exceptionAlerts?: string[];
  linkedWorkOrders?: string[];
  linkedSalesOrders?: string[];
}

export interface ReplenishmentItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  warehouseLocation: string;
  currentStock: number;
  availableStock: number;
  reorderLevel: number;
  safetyStock: number;
  minStock: number;
  maxStock: number;
  reorderQty: number;
  uom: string;
  preferredSupplier: string;
  leadTimeDays: number;
  nextExpectedReceipt: string;
  ruleType: 'Reorder Point' | 'Min/Max' | 'Demand-Driven' | 'MRP-Driven' | 'JIT Replenishment' | 'Kanban Floor Stock';
  status: 'Below Reorder' | 'Below Safety Stock' | 'Normal' | 'Over Max' | 'Critical Stockout';
  velocityPerDay: number;
}

export interface SupplierCollaborationPO {
  id: string;
  poNumber: string;
  supplierName: string;
  itemCode: string;
  itemName: string;
  orderQty: number;
  uom: string;
  requiredDate: string;
  promisedDate: string;
  dispatchDate?: string;
  asnNumber?: string;
  asnStatus: 'Pending' | 'Submitted' | 'Verified' | 'Discrepancy';
  documentStatus: 'All Uploaded (COA+MSDS)' | 'COA Missing' | 'Pending MSDS' | 'Under QC Review';
  deliveryStatus: 'On Schedule' | 'Delayed' | 'Dispatched' | 'In Transit' | 'Port Arrival' | 'Customs Hold' | 'Received';
  actionNeeded: string;
  scorecardGrade: 'A' | 'B' | 'C' | 'D';
}

export interface InboundShipment {
  shipmentId: string;
  supplierName: string;
  poNumber: string;
  asnNumber: string;
  carrier: string;
  modeOfTransport: 'Sea Freight' | 'Air Cargo' | 'Road Transport' | 'Rail Express' | 'Dedicated Courier';
  origin: string;
  portOfEntry?: string;
  expectedArrivalDate: string;
  revisedArrivalDate: string;
  status: 'Planned' | 'Dispatched' | 'In Transit' | 'Arrived at Port/Hub' | 'Customs Clearance' | 'Out for Delivery' | 'Received' | 'Delayed' | 'Cancelled';
  itemsCount: number;
  totalWeightKg: number;
  containerNumber?: string;
  documentsStatus: 'Complete (COA+BL+Invoice)' | 'Customs Pending' | 'Missing COA' | 'BL Verified';
  temperatureControlStatus?: 'Normal 22°C' | 'Warning' | 'N/A';
  currentMilestoneIndex: number;
  milestones: Array<{ name: string; date: string; status: 'completed' | 'current' | 'pending' | 'delayed' }>;
}

export interface OutboundShipment {
  deliveryNoteNumber: string;
  salesOrderNumber: string;
  customerName: string;
  shipToLocation: string;
  carrier: string;
  modeOfTransport: 'Dedicated Truck' | 'Part Truck Load (PTL)' | 'Air Express' | 'JIT Milk Run';
  dispatchDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  status: 'Planned' | 'Picking' | 'Packed' | 'Ready to Ship' | 'Dispatched' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Partially Delivered' | 'Delayed' | 'Returned';
  podStatus: 'Signed e-POD Verified' | 'Pending Gate Entry' | 'OTP Confirmed' | 'Missing POD';
  itemSummary: string;
  quantityMolded: number;
  uom: string;
  batchLots: string[];
  coaAttached: boolean;
  driverName?: string;
  vehicleNumber?: string;
}

export interface CarrierMaster {
  code: string;
  name: string;
  transportMode: 'Road' | 'Rail' | 'Sea' | 'Air' | 'Courier';
  serviceType: 'FTL' | 'PTL' | 'Container Drayage' | 'Express JIT' | 'Cold/Moisture Sealed';
  contactPerson: string;
  phone: string;
  email: string;
  ratePerKmOrTon: string;
  performanceRating: number; // e.g. 4.8 / 5.0
  activeStatus: 'Active' | 'Suspended' | 'Under Review';
  activeTrips: number;
}

export interface TrackTraceNode {
  timestamp: string;
  stage: string;
  module: string;
  recordRef: string;
  status: string;
  quantity: string;
  location: string;
  userOrSystem: string;
  parameters?: Record<string, string>;
}

export interface SupplierRiskProfile {
  supplierId: string;
  supplierName: string;
  category: 'Polymer Resin Producer' | 'Masterbatch Compounder' | 'Chemical Additives' | 'Packaging & Corrugated' | 'Tooling & Steel';
  country: string;
  onTimeDeliveryPct: number;
  qualityAcceptancePct: number;
  avgLeadTimeDays: number;
  priceVariancePct: number;
  overallGrade: 'A' | 'B' | 'C' | 'D';
  riskScore: number; // 0-100 (high is riskier)
  riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Severe Risk';
  riskCategories: {
    delivery: number;
    quality: number;
    financial: number;
    compliance: number;
    geopolitical: number;
    singleSource: boolean;
    esgRating: number;
    capacityRisk: number;
  };
  keyIssueDescription?: string;
  mitigationPlan?: string;
  owner: string;
  reviewDueDate: string;
  status: 'Preferred Partner' | 'Standard Active' | 'Probationary Audit' | 'Blocked';
}

export interface OrderToDeliveryTimelineItem {
  salesOrderNumber: string;
  customerName: string;
  itemName: string;
  orderedQty: number;
  deliveredQty: number;
  remainingQty: number;
  uom: string;
  requestedDate: string;
  promisedDate: string;
  estimatedCompletionDate: string;
  actualCompletionDate?: string;
  currentStageIndex: number;
  currentStageName: string;
  productionStatus: 'On Track' | 'Delayed (Mold Set)' | 'Running (IMM-04)' | 'Completed';
  materialStatus: '100% Staged' | 'Resin Shortage' | 'Masterbatch Lot QC' | 'Ready';
  qualityStatus: 'QC Passed' | 'In-Process Inspection' | 'COA Generated' | 'Hold';
  warehouseStatus: 'Staged in Bay-02' | 'Picking' | 'Palletized' | 'Loaded';
  deliveryStatus: 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Scheduled';
  invoiceStatus: 'Invoiced' | 'Draft' | 'Pending Dispatch';
  exceptionIndicator?: string;
}

export interface ESGSustainabilityMetric {
  recycledContentPct: number;
  regrindClosedLoopUsagePct: number;
  wasteGeneratedKg: number;
  scrapDiversionRatePct: number;
  energyKwhPerKgMolded: number;
  carbonFootprintEstimateTons: number;
  supplierAvgESGScore: number;
  iso14001Compliance: string;
  sustainableMaterialUsageKg: number;
}

// Aliases and additional interfaces
export type FreightCarrier = CarrierMaster;
export type OutboundDelivery = OutboundShipment;

export interface InventoryAgingRecord {
  itemCode: string;
  itemName: string;
  category: string;
  location: string;
  batchNumber: string;
  lotNumber?: string;
  quantity: number;
  uom: string;
  unitValue: number;
  totalValue: number;
  receiptDate: string;
  ageDays: number;
  ageBucket: '0-30 days' | '31-60 days' | '61-90 days' | '91-180 days' | '180+ days';
  status: 'Fresh' | 'Normal' | 'Slow-Moving' | 'Expiring Soon' | 'Expired / Quarantine';
  dispositionRecommendation?: 'Scrap & Regrind' | 'Return to Vendor' | 'Expedite Consumption' | 'Repackage & Resell' | 'Quality Recertification';
  shelfLifeExpiryDate?: string;
  moistureSensitive?: boolean;
}

export interface OrderTimelineItem {
  id: string;
  orderNumber: string;
  customerName: string;
  itemCode: string;
  itemName: string;
  orderQty: number;
  uom: string;
  currentStage: string;
  status: 'On Track' | 'Delayed' | 'Critical Alert' | 'Delivered';
  targetDeliveryDate: string;
  stages: Array<{
    name: string;
    status: 'Completed' | 'In Progress' | 'Pending' | 'Delayed';
    date: string;
    notes?: string;
  }>;
}

export interface ScmRolePermission {
  roleId: string;
  roleName: string;
  modules: Array<{
    moduleName: string;
    view: boolean;
    edit: boolean;
    approve: boolean;
    export: boolean;
  }>;
}

export interface SCMReportTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  lastGenerated: string;
  formats: string[];
}

export interface ScmSettingsConfig {
  mrpCalculationFrequency: string;
  planningHorizonDays: number;
  forecastConsumptionMode: string;
  autoGeneratePurchaseRequisitions: boolean;
  safetyStockDaysVirgin: number;
  safetyStockDaysMasterbatch: number;
  safetyStockDaysAdditives: number;
  leadTimeBufferImportDays: number;
  defaultIncoterms: string;
}

export interface TraceabilityRecord {
  id: string;
  trackingType: 'Finished Good Lot' | 'Raw Material Batch' | 'Work Order' | 'Mold Tooling ID';
  referenceId: string;
  itemDescription: string;
  customerOrSupplier: string;
  productionDate: string;
  machineId: string;
  moldId: string;
  polymerBatch: string;
  masterbatchBatch: string;
  regrindPercentage: number;
  qcStatus: string;
  genealogyNodes: Array<{
    stage: string;
    entity: string;
    timestamp: string;
    details: string;
  }>;
}
