import axios, { AxiosInstance } from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// TypeScript Interfaces for Module-5 Planning (19 Screens)
// ============================================================================

// Screen 1: Item Master
export interface ItemMaster {
  id: string;
  tenantId: string;
  itemCode: string;
  name: string;
  description?: string;
  itemType: 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'FINISHED_GOODS' | 'CONSUMABLE' | 'SERVICE' | 'ASSET';
  category?: string;
  uom: string;
  secondaryUom?: string;
  conversionFactor?: number;
  makeOrBuy: 'MAKE' | 'BUY' | 'TRANSFER';
  safetyStock: number;
  reorderPoint: number;
  minOrderQty: number;
  maxOrderQty?: number;
  orderMultiple?: number;
  leadTimeDays: number;
  procurementLeadTime?: number;
  manufacturingLeadTime?: number;
  inspectionLeadTime?: number;
  standardCost: number;
  lastPurchasePrice?: number;
  valuationMethod: 'FIFO' | 'LIFO' | 'WEIGHTED_AVG' | 'STANDARD';
  hsnSacCode?: string;
  taxRate?: number;
  isLotTracked: boolean;
  isSerialTracked: boolean;
  shelfLifeDays?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PHASE_OUT' | 'OBSOLETE';
  customAttributes?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// Screen 2 & 3: Bill of Materials (BOM) & Multi-level Explosion
export interface BomLine {
  id?: string;
  bomId?: string;
  componentItemId: string;
  componentCode?: string;
  componentName?: string;
  lineNumber: number;
  quantity: number;
  uom: string;
  scrapPercentage: number;
  operationSeq?: number;
  isCritical: boolean;
  isPhantom: boolean;
  alternateGroupId?: string;
  drawingRef?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface BomExplosionNode {
  bomId: string;
  parentItemId: string;
  componentItemId: string;
  componentCode: string;
  componentName: string;
  level: number;
  quantityPerParent: number;
  extendedQuantity: number;
  uom: string;
  scrapPct: number;
  grossQtyWithScrap: number;
  isPhantom: boolean;
  standardCost: number;
  extendedCost: number;
  children: BomExplosionNode[];
}

export interface BomHeader {
  id: string;
  tenantId: string;
  bomNumber: string;
  parentItemId: string;
  parentItemCode?: string;
  parentItemName?: string;
  version: string;
  revision: number;
  bomType: 'STANDARD' | 'CONFIGURABLE' | 'PHANTOM' | 'ENGINEERING' | 'REPAIR';
  baseQty: number;
  uom: string;
  yieldPct: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
  approvedById?: string;
  approvedAt?: string;
  lines: BomLine[];
  customAttributes?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface BomDiffResult {
  bom1: { id: string; version: string; revision: number };
  bom2: { id: string; version: string; revision: number };
  headerChanges: { field: string; old: any; new: any }[];
  additions: BomLine[];
  deletions: BomLine[];
  modifications: { componentItemId: string; oldQty: number; newQty: number }[];
}

// Screen 5: Engineering Change Order (ECO / ECR)
export interface EngineeringChangeOrder {
  id: string;
  tenantId: string;
  ecoNumber: string;
  title: string;
  description: string;
  changeType: 'BOM_CHANGE' | 'ROUTING_CHANGE' | 'ITEM_SPEC' | 'DRAWING_REVISION' | 'PROCESS_MOD' | 'OBSOLESCENCE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  reasonForChange: string;
  targetItemId?: string;
  targetBomId?: string;
  targetRoutingId?: string;
  proposedVersion?: string;
  dispositionAction: 'SCRAP' | 'REWORK' | 'USE_AS_IS' | 'RETURN_TO_VENDOR' | 'PHASE_OUT';
  scrapCostEstimate?: number;
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED' | 'CANCELLED';
  currentApprovalLevel: number;
  requestedById: string;
  requestedByName?: string;
  effectiveDate?: string;
  approvalHistory?: Array<{
    level: number;
    decision: 'APPROVED' | 'REJECTED';
    comments?: string;
    actionBy: string;
    actionAt: string;
  }>;
  customAttributes?: Record<string, any>;
  createdAt?: string;
}

// Screen 6: Routing & Operations
export interface RoutingOperation {
  id?: string;
  routingId?: string;
  operationSeq: number;
  operationCode: string;
  workCenterId: string;
  workCenterCode?: string;
  workCenterName?: string;
  description: string;
  setupTimeMins: number;
  runTimePerUnitMins: number;
  machineHoursPerUnit: number;
  laborHoursPerUnit: number;
  crewSize: number;
  costPerHourMachine: number;
  costPerHourLabor: number;
  overlapPct?: number;
  subcontractorId?: string;
  isMilestone: boolean;
}

export interface RoutingHeader {
  id: string;
  tenantId: string;
  routingNumber: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'OBSOLETE';
  isDefault: boolean;
  totalSetupMins?: number;
  totalRunMinsPerUnit?: number;
  operations: RoutingOperation[];
  createdAt?: string;
}

// Screen 7: Standard Cost Rollup
export interface StandardCostBreakdown {
  itemId: string;
  itemCode?: string;
  itemName?: string;
  directMaterialCost: number;
  directLaborCost: number;
  machineCost: number;
  overheadCost: number;
  totalStandardCost: number;
  lastRolledUpAt: string;
  rolledUpById: string;
  details: {
    materialLines: Array<{ componentId: string; qty: number; unitCost: number; extCost: number }>;
    operationLines: Array<{ opSeq: number; laborCost: number; machineCost: number }>;
  };
}

// Screens 8 & 9: MRP Engine & Planned Orders
export interface MrpRunResult {
  mrpRunId: string;
  runNumber: string;
  totalItemsProcessed: number;
  totalPlannedOrdersCreated: number;
  totalExceptions: number;
  durationMs: number;
  demandCount: number;
  supplyCount: number;
}

export interface PlannedOrder {
  id: string;
  tenantId: string;
  mrpRunId: string;
  orderNumber: string;
  orderType: 'PURCHASE_REQUISITION' | 'WORK_ORDER' | 'TRANSFER_ORDER';
  itemId: string;
  itemCode?: string;
  itemName?: string;
  quantity: number;
  uom: string;
  suggestedStartDate: string;
  suggestedDueDate: string;
  actionRequired: 'CREATE' | 'RESCHEDULE_IN' | 'RESCHEDULE_OUT' | 'CANCEL';
  status: 'PROPOSED' | 'APPROVED' | 'RELEASED' | 'CANCELLED';
  peggingInfo?: {
    demandType: string;
    demandId: string;
    requiredDate: string;
  };
}

// Screen 10: Master Production Schedule (MPS)
export interface MpsRecord {
  id: string;
  tenantId: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  planningBucket: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  bucketDate: string;
  forecastQty: number;
  salesOrderDemandQty: number;
  totalDemandQty: number;
  plannedProductionQty: number;
  projectedAvailableBalance: number;
  availableToPromise: number;
  status: 'DRAFT' | 'FIRM' | 'COMMITTED';
}

// Screen 11: Capacity Requirements Planning (CRP / RCCP)
export interface WorkCenterCapacityLoad {
  workCenterId: string;
  workCenterCode: string;
  workCenterName: string;
  bucketDate: string;
  availableHours: number;
  requiredSetupHours: number;
  requiredRunHours: number;
  totalRequiredHours: number;
  loadPercentage: number;
  isOverloaded: boolean;
  bottleneckSeverity: 'NONE' | 'LOW' | 'MODERATE' | 'CRITICAL';
}

// Screen 12: Production Scheduling & Dispatching
export interface ScheduledOperation {
  id: string;
  tenantId: string;
  workOrderId: string;
  woNumber?: string;
  operationSeq: number;
  workCenterId: string;
  workCenterCode?: string;
  scheduledStart: string;
  scheduledEnd: string;
  plannedDurationMins: number;
  priorityScore: number;
  dispatchStatus: 'SCHEDULED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'HELD';
  resourceConstraintId?: string;
}

// Screen 13: Work Center & Machine Master
export interface WorkCenterMaster {
  id: string;
  tenantId: string;
  workCenterCode: string;
  name: string;
  workCenterType: 'MACHINE' | 'ASSEMBLY' | 'LABOR' | 'SUBCONTRACT' | 'PACKAGING' | 'QC';
  department: string;
  location?: string;
  standardHourlyRate: number;
  overheadHourlyRate: number;
  dailyCapacityHours: number;
  shiftPattern: 'ONE_SHIFT' | 'TWO_SHIFTS' | 'THREE_SHIFTS' | 'CONTINUOUS_24_7';
  utilizationEfficiencyPct: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE' | 'INACTIVE';
}

// Screen 14: Shift Management & Calendars
export interface ShiftPattern {
  id: string;
  tenantId: string;
  shiftCode: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  unpaidBreakMins: number;
  effectiveWorkingHours: number;
  isNightShift: boolean;
  isActive: boolean;
}

export interface WorkCalendarHoliday {
  id: string;
  tenantId: string;
  calendarDate: string;
  holidayName: string;
  isWorkingDayOverride: boolean;
}

// Screen 15: Tooling & Die Management
export interface ToolDieMaster {
  id: string;
  tenantId: string;
  toolCode: string;
  name: string;
  toolType: 'INJECTION_MOLD' | 'STAMPING_DIE' | 'CUTTING_TOOL' | 'JIG_FIXTURE' | 'EXTRUSION_DIE';
  totalShotCapacity?: number;
  currentShotCount: number;
  maintenanceIntervalShots?: number;
  status: 'AVAILABLE' | 'MOUNTED_IN_MACHINE' | 'UNDER_MAINTENANCE' | 'REFURBISHING' | 'SCRAPPED';
  compatibleMachines: string[];
}

// Screen 16: Sales & Operations Planning (S&OP)
export interface SopCycle {
  id: string;
  tenantId: string;
  cycleName: string;
  planHorizonStart: string;
  planHorizonEnd: string;
  unconstrainedDemandRevenue: number;
  constrainedSupplyRevenue: number;
  consensusRevenue: number;
  projectedInventoryEndOfHorizon: number;
  status: 'IN_PREPARATION' | 'CONSENSUS_REVIEW' | 'EXECUTIVE_SIGNOFF' | 'FINALIZED';
  buckets: Array<{
    period: string;
    unconstrainedDemand: number;
    constrainedProduction: number;
    endingInventory: number;
    capacityDeficitHours: number;
  }>;
}

// Screen 17: Demand Forecasting Engine
export interface DemandForecastItem {
  itemId: string;
  itemCode?: string;
  period: string;
  forecastQty: number;
  confidenceLowerQty: number;
  confidenceUpperQty: number;
  forecastMethod: 'MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING' | 'HOLT_WINTERS' | 'REGRESSION' | 'AI_ENSEMBLE';
  historicalMae?: number;
}

// Screen 18: Available-to-Promise (ATP / CTP)
export interface AtpCalculationResult {
  itemId: string;
  requestQty: number;
  requestDate: string;
  isFulfillableOnDate: boolean;
  promisedDate: string;
  availableOnHand: number;
  projectedReceiptsBeforeDate: number;
  reservedQty: number;
  netAtpQuantity: number;
  capableToPromiseOptions?: Array<{
    possibleCompletionDate: string;
    bottleneckWorkCenterId?: string;
    materialLeadTimeConstrainedItem?: string;
  }>;
}

// Screen 19: Planning Executive Dashboard
export interface PlanningExecutiveKpi {
  activeBomsCount: number;
  pendingEcosCount: number;
  scheduledWorkOrdersCount: number;
  averageCapacityUtilizationPct: number;
  criticalBottlenecksCount: number;
  mrpLastRunAt?: string;
  mrpOpenActionExceptions: number;
  otifForecastPct: number;
  topOverloadedWorkCenters: Array<{
    workCenterCode: string;
    workCenterName: string;
    loadPct: number;
  }>;
}

// ============================================================================
// Frontend Planning API Client Class
// ============================================================================

class PlanningApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE}/planning`,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Auto-attach CSRF and Tenant headers
    this.client.interceptors.request.use((config) => {
      const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
      if (match) {
        config.headers['x-csrf-token'] = decodeURIComponent(match[2]);
      }
      const tenantId = localStorage.getItem('tenant_id') || 'TENANT-ALPHA-IND';
      config.headers['x-tenant-id'] = tenantId;
      return config;
    });
  }

  // --------------------------------------------------------------------------
  // Screen 1: Item Master
  // --------------------------------------------------------------------------
  public async getItems(filters: { search?: string; itemType?: string; category?: string; status?: string; page?: number; limit?: number } = {}) {
    const res = await this.client.get('/items', { params: filters });
    return res.data;
  }

  public async getItem(id: string) {
    const res = await this.client.get(`/items/${id}`);
    return res.data;
  }

  public async createItem(data: Partial<ItemMaster>) {
    const res = await this.client.post('/items', data);
    return res.data;
  }

  public async updateItem(id: string, data: Partial<ItemMaster>) {
    const res = await this.client.put(`/items/${id}`, data);
    return res.data;
  }

  public async deleteItem(id: string) {
    const res = await this.client.delete(`/items/${id}`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screens 2 & 3: Bill of Materials & Explosions
  // --------------------------------------------------------------------------
  public async getBoms(filters: { parentItemId?: string; status?: string; bomType?: string; page?: number; limit?: number } = {}) {
    const res = await this.client.get('/boms', { params: filters });
    return res.data;
  }

  public async getBom(id: string) {
    const res = await this.client.get(`/boms/${id}`);
    return res.data;
  }

  public async createBom(data: Partial<BomHeader>) {
    const res = await this.client.post('/boms', data);
    return res.data;
  }

  public async updateBom(id: string, data: Partial<BomHeader>) {
    const res = await this.client.put(`/boms/${id}`, data);
    return res.data;
  }

  public async explodeBom(id: string, params: { maxDepth?: number; requiredQty?: number } = {}) {
    const res = await this.client.get(`/boms/${id}/explosion`, { params });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 4: BOM Versioning & Diffing
  // --------------------------------------------------------------------------
  public async getBomVersions(parentItemId: string) {
    const res = await this.client.get(`/boms/versions/${parentItemId}`);
    return res.data;
  }

  public async diffBomVersions(bomId1: string, bomId2: string) {
    const res = await this.client.get('/boms/diff', { params: { bomId1, bomId2 } });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 5: ECO / ECR
  // --------------------------------------------------------------------------
  public async getEcrs(filters: { status?: string; priority?: string; page?: number; limit?: number } = {}) {
    const res = await this.client.get('/ecrs', { params: filters });
    return res.data;
  }

  public async getEcr(id: string) {
    const res = await this.client.get(`/ecrs/${id}`);
    return res.data;
  }

  public async createEcr(data: Partial<EngineeringChangeOrder>) {
    const res = await this.client.post('/ecrs', data);
    return res.data;
  }

  public async approveEcr(id: string, data: { decision: 'APPROVED' | 'REJECTED'; comments?: string; targetApprovalLevel?: number }) {
    const res = await this.client.post(`/ecrs/${id}/approve`, data);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 6: Routings & Operations
  // --------------------------------------------------------------------------
  public async getRoutings(filters: { itemId?: string; status?: string } = {}) {
    const res = await this.client.get('/routings', { params: filters });
    return res.data;
  }

  public async getRouting(id: string) {
    const res = await this.client.get(`/routings/${id}`);
    return res.data;
  }

  public async createRouting(data: Partial<RoutingHeader>) {
    const res = await this.client.post('/routings', data);
    return res.data;
  }

  public async updateRouting(id: string, data: Partial<RoutingHeader>) {
    const res = await this.client.put(`/routings/${id}`, data);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 7: Standard Cost Rollup
  // --------------------------------------------------------------------------
  public async getStandardCost(itemId: string) {
    const res = await this.client.get(`/costing/items/${itemId}`);
    return res.data;
  }

  public async performCostRollup(itemIds: string[]) {
    const res = await this.client.post('/costing/rollup', { itemIds });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screens 8 & 9: MRP Engine & Planned Orders
  // --------------------------------------------------------------------------
  public async runMrp(payload: {
    planningHorizonDays?: number;
    includeSafetyStock?: boolean;
    regenerative?: boolean;
    targetItemIds?: string[];
  }) {
    const res = await this.client.post('/mrp/run', payload);
    return res.data;
  }

  public async getMrpRuns(filters: { page?: number; limit?: number } = {}) {
    const res = await this.client.get('/mrp/runs', { params: filters });
    return res.data;
  }

  public async getPlannedOrders(filters: { mrpRunId?: string; orderType?: string; status?: string } = {}) {
    const res = await this.client.get('/mrp/planned-orders', { params: filters });
    return res.data;
  }

  public async releasePlannedOrders(plannedOrderIds: string[]) {
    const res = await this.client.post('/mrp/planned-orders/release', { plannedOrderIds });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 10: Master Production Schedule (MPS)
  // --------------------------------------------------------------------------
  public async getMpsMatrix(params: { itemId?: string; startDate: string; endDate: string; bucket?: string }) {
    const res = await this.client.get('/mps/matrix', { params });
    return res.data;
  }

  public async updateMpsRecord(id: string, data: { plannedProductionQty: number; status?: string }) {
    const res = await this.client.put(`/mps/records/${id}`, data);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 11: CRP / RCCP Capacity Planning
  // --------------------------------------------------------------------------
  public async getCapacityLoads(params: { startDate: string; endDate: string; workCenterId?: string }) {
    const res = await this.client.get('/capacity/loads', { params });
    return res.data;
  }

  public async resolveBottleneck(workCenterId: string, action: { addShift?: boolean; outsourceQty?: number; targetDate: string }) {
    const res = await this.client.post('/capacity/resolve-bottleneck', { workCenterId, ...action });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 12: Production Scheduling & Dispatching
  // --------------------------------------------------------------------------
  public async getSchedules(filters: { workCenterId?: string; status?: string; startDate?: string; endDate?: string } = {}) {
    const res = await this.client.get('/scheduling/operations', { params: filters });
    return res.data;
  }

  public async autoScheduleOperations(payload: { workOrderIds?: string[]; schedulingRule?: 'EDD' | 'SPT' | 'CR' | 'FIFO' }) {
    const res = await this.client.post('/scheduling/auto-schedule', payload);
    return res.data;
  }

  public async dispatchOperation(scheduleId: string) {
    const res = await this.client.post(`/scheduling/dispatch/${scheduleId}`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 13: Work Centers & Machines
  // --------------------------------------------------------------------------
  public async getWorkCenters(filters: { status?: string; department?: string } = {}) {
    const res = await this.client.get('/work-centers', { params: filters });
    return res.data;
  }

  public async createWorkCenter(data: Partial<WorkCenterMaster>) {
    const res = await this.client.post('/work-centers', data);
    return res.data;
  }

  public async updateWorkCenter(id: string, data: Partial<WorkCenterMaster>) {
    const res = await this.client.put(`/work-centers/${id}`, data);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 14: Shift Management & Calendars
  // --------------------------------------------------------------------------
  public async getShifts() {
    const res = await this.client.get('/shifts');
    return res.data;
  }

  public async createShift(data: Partial<ShiftPattern>) {
    const res = await this.client.post('/shifts', data);
    return res.data;
  }

  public async getHolidays(year?: number) {
    const res = await this.client.get('/calendar/holidays', { params: { year } });
    return res.data;
  }

  public async createHoliday(data: { calendarDate: string; holidayName: string; isWorkingDayOverride?: boolean }) {
    const res = await this.client.post('/calendar/holidays', data);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 15: Tooling & Die Management
  // --------------------------------------------------------------------------
  public async getTools(filters: { toolType?: string; status?: string } = {}) {
    const res = await this.client.get('/tools', { params: filters });
    return res.data;
  }

  public async createTool(data: Partial<ToolDieMaster>) {
    const res = await this.client.post('/tools', data);
    return res.data;
  }

  public async recordToolShots(toolId: string, shotsIncrement: number) {
    const res = await this.client.post(`/tools/${toolId}/record-shots`, { shotsIncrement });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 16: Sales & Operations Planning (S&OP)
  // --------------------------------------------------------------------------
  public async getSopCycles(filters: { status?: string } = {}) {
    const res = await this.client.get('/sop/cycles', { params: filters });
    return res.data;
  }

  public async createSopCycle(data: Partial<SopCycle>) {
    const res = await this.client.post('/sop/cycles', data);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 17: Demand Forecasting Engine
  // --------------------------------------------------------------------------
  public async generateForecast(payload: {
    itemIds?: string[];
    horizonPeriods?: number;
    method?: 'MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING' | 'HOLT_WINTERS' | 'AI_ENSEMBLE';
  }) {
    const res = await this.client.post('/demand/forecast', payload);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 18: Available-to-Promise (ATP / CTP)
  // --------------------------------------------------------------------------
  public async calculateAtp(payload: { itemId: string; requestedQty: number; requestedDate: string }) {
    const res = await this.client.post('/atp/calculate', payload);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 19: Executive Planning Dashboard
  // --------------------------------------------------------------------------
  public async getExecutiveDashboard() {
    const res = await this.client.get('/dashboard/executive');
    return res.data;
  }
}

export const planningApi = new PlanningApiClient();
