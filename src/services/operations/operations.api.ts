import axios, { AxiosInstance } from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// TypeScript Interfaces for Module-4 Operations (36 Screens)
// ============================================================================

// Production
export interface JitSchedule {
  id: string;
  tenantId: string;
  scheduleNumber: string;
  workOrderId?: string;
  machineId: string;
  machineName?: string;
  scheduledStart: string;
  scheduledEnd: string;
  priority: number;
  status: string;
  isJit: boolean;
}

export interface WorkOrder {
  id: string;
  tenantId: string;
  woNumber: string;
  salesOrderId?: string;
  bomId: string;
  machineId?: string;
  machineName?: string;
  workCenterId?: string;
  targetQty: number;
  producedQty: number;
  rejectedQty: number;
  scrapQty: number;
  uom: string;
  status: string;
  priority: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  shiftId?: string;
  assignedToId?: string;
  version: string;
}

export interface ProductionEntry {
  id: string;
  tenantId: string;
  entryNumber: string;
  workOrderId: string;
  woNumber?: string;
  machineId: string;
  machineName?: string;
  shiftId: string;
  entryDate: string;
  operatorId: string;
  operatorName?: string;
  goodQty: number;
  rejectedQty: number;
  scrapQty: number;
  cycleTimeSec: number;
  downtimeMinutes: number;
  reasonCodeId?: string;
  notes?: string;
}

export interface WipOperation {
  id: string;
  tenantId: string;
  wipNumber: string;
  workOrderId: string;
  woNumber?: string;
  operationType: string;
  quantity: number;
  status: string;
  qcGatePassed: boolean;
  locationId?: string;
}

export interface DowntimeRecord {
  id: string;
  tenantId: string;
  recordNumber: string;
  workOrderId?: string;
  machineId: string;
  machineName?: string;
  downtimeType: string;
  reasonCodeId: string;
  reasonCode?: string;
  reasonDescription?: string;
  startTime: string;
  durationMinutes: number;
  impactOnOee: boolean;
  notes?: string;
}

export interface BatchRecord {
  id: string;
  tenantId: string;
  batchNumber: string;
  workOrderId: string;
  woNumber?: string;
  bomId: string;
  batchQty: number;
  status: string;
  startedAt: string;
  parentBatchId?: string;
}

export interface ChangeoverRecord {
  id: string;
  tenantId: string;
  recordNumber: string;
  machineId: string;
  machineName?: string;
  fromProductCode: string;
  toProductCode: string;
  plannedDuration: number;
  actualDuration: number;
  internalTime: number;
  externalTime: number;
  status: string;
}

export interface MaterialIssue {
  id: string;
  tenantId: string;
  issueNumber: string;
  workOrderId: string;
  issueType: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  batchNumber?: string;
}

export interface ShiftHandover {
  id: string;
  tenantId: string;
  fromShift: string;
  toShift: string;
  handoverDate: string;
  machineStatusSummary: string;
  productionTargetAchieved: boolean;
  openIssues?: string;
  safetyNotes?: string;
}

// Warehouse
export interface InventoryStock {
  id: string;
  tenantId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouseId: string;
  warehouseName?: string;
  locationId?: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  reorderPoint?: number;
  reorderQty?: number;
  maxStock?: number;
  version: string;
}

export interface GoodsReceipt {
  id: string;
  tenantId: string;
  grnNumber: string;
  poNumber?: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  status: string;
  totalQty: number;
  receiptDate: string;
  notes?: string;
}

export interface PutawayTask {
  id: string;
  tenantId: string;
  taskNumber: string;
  grnId?: string;
  itemId: string;
  itemCode: string;
  quantity: number;
  uom: string;
  fromLocation: string;
  toLocationId: string;
  status: string;
}

export interface PickingTask {
  id: string;
  tenantId: string;
  taskNumber: string;
  salesOrderId?: string;
  deliveryId?: string;
  itemId: string;
  itemCode: string;
  quantity: number;
  uom: string;
  fromLocationId: string;
  toLocation: string;
  status: string;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  movementNumber: string;
  movementType: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  movementDate: string;
  notes?: string;
}

export interface StockCount {
  id: string;
  tenantId: string;
  countNumber: string;
  warehouseId: string;
  countDate: string;
  status: string;
  totalItems: number;
}

// Quality
export interface QualityInspection {
  id: string;
  tenantId: string;
  inspectionNumber: string;
  inspectionType: string;
  workOrderId?: string;
  batchId?: string;
  itemId: string;
  itemCode: string;
  sampleSize: number;
  acceptedQty: number;
  rejectedQty: number;
  status: string;
  inspectorId: string;
  inspectionDate: string;
}

export interface NonConformanceReport {
  id: string;
  tenantId: string;
  ncrNumber: string;
  inspectionId?: string;
  workOrderId?: string;
  itemId: string;
  itemCode: string;
  defectType: string;
  severity: string;
  quantity: number;
  disposition: string;
  rootCause?: string;
  correctiveAction?: string;
}

export interface CorrectiveAction {
  id: string;
  tenantId: string;
  capaNumber: string;
  ncrId?: string;
  title: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  targetDate: string;
  status: string;
}

// Maintenance
export interface MaintenanceSchedule {
  id: string;
  tenantId: string;
  machineId: string;
  machineName?: string;
  maintenanceType: string;
  title: string;
  frequencyDays: number;
  nextDueDate: string;
  checklist: string[];
}

export interface MaintenanceWorkOrder {
  id: string;
  tenantId: string;
  mwoNumber: string;
  machineId: string;
  machineName?: string;
  maintenanceType: string;
  priority: string;
  status: string;
  description: string;
  assignedToId?: string;
  scheduledDate?: string;
}

export interface SparePart {
  id: string;
  tenantId: string;
  partCode: string;
  partName: string;
  machineModel: string;
  category: string;
  quantityOnHand: number;
  reorderPoint: number;
  unitCost: number;
  uom: string;
}

// ============================================================================
// Operations API Client (Singleton Pattern)
// ============================================================================
export class OperationsApi {
  private static instance: OperationsApi;
  private api: AxiosInstance;

  private constructor() {
    this.api = axios.create({
      baseURL: API_BASE,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const tenantId = this.getActiveTenantId();
      const csrfToken = this.getCsrfToken();
      if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
      if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
            return this.api(originalRequest);
          } catch (refreshErr) {
            console.warn('[OperationsApi] Session expired.');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): OperationsApi {
    if (!OperationsApi.instance) {
      OperationsApi.instance = new OperationsApi();
    }
    return OperationsApi.instance;
  }

  private getActiveTenantId(): string {
    return localStorage.getItem('reboot_tenant_id') || 'TENANT-ALPHA-IND';
  }

  private getCsrfToken(): string | null {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  // --------------------------------------------------------------------------
  // Observability
  // --------------------------------------------------------------------------
  public async getObservabilityMetrics(): Promise<any> {
    const res = await this.api.get('/observability/metrics');
    return res.data;
  }

  public async getObservabilityAlerts(): Promise<any> {
    const res = await this.api.get('/observability/alerts');
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Production
  // --------------------------------------------------------------------------
  public async getJitSchedules(): Promise<{ success: boolean; data: JitSchedule[] }> {
    const res = await this.api.get('/operations/production/jit-schedules');
    return res.data;
  }

  public async createJitSchedule(dto: Partial<JitSchedule>): Promise<{ success: boolean; data: JitSchedule }> {
    const res = await this.api.post('/operations/production/jit-schedules', dto);
    return res.data;
  }

  public async getWorkOrders(): Promise<{ success: boolean; data: WorkOrder[] }> {
    const res = await this.api.get('/operations/production/work-orders');
    return res.data;
  }

  public async createWorkOrder(dto: Partial<WorkOrder>): Promise<{ success: boolean; data: WorkOrder }> {
    const res = await this.api.post('/operations/production/work-orders', dto);
    return res.data;
  }

  public async updateWorkOrderStatus(id: string, status: string): Promise<any> {
    const res = await this.api.put(`/operations/production/work-orders/${id}/status`, { status });
    return res.data;
  }

  public async getProductionEntries(): Promise<{ success: boolean; data: ProductionEntry[] }> {
    const res = await this.api.get('/operations/production/entries');
    return res.data;
  }

  public async createProductionEntry(dto: Partial<ProductionEntry>): Promise<{ success: boolean; data: ProductionEntry }> {
    const res = await this.api.post('/operations/production/entries', dto);
    return res.data;
  }

  public async getWipOperations(): Promise<{ success: boolean; data: WipOperation[] }> {
    const res = await this.api.get('/operations/production/wip');
    return res.data;
  }

  public async createWipOperation(dto: Partial<WipOperation>): Promise<{ success: boolean; data: WipOperation }> {
    const res = await this.api.post('/operations/production/wip', dto);
    return res.data;
  }

  public async getShopFloorConsole(): Promise<any> {
    const res = await this.api.get('/operations/production/shop-floor');
    return res.data;
  }

  public async logTelemetry(dto: any): Promise<any> {
    const res = await this.api.post('/operations/production/telemetry', dto);
    return res.data;
  }

  public async getDowntimeRecords(): Promise<{ success: boolean; data: DowntimeRecord[] }> {
    const res = await this.api.get('/operations/production/downtime');
    return res.data;
  }

  public async createDowntimeRecord(dto: Partial<DowntimeRecord>): Promise<{ success: boolean; data: DowntimeRecord }> {
    const res = await this.api.post('/operations/production/downtime', dto);
    return res.data;
  }

  public async getBatchRecords(): Promise<{ success: boolean; data: BatchRecord[] }> {
    const res = await this.api.get('/operations/production/batches');
    return res.data;
  }

  public async createBatchRecord(dto: Partial<BatchRecord>): Promise<{ success: boolean; data: BatchRecord }> {
    const res = await this.api.post('/operations/production/batches', dto);
    return res.data;
  }

  public async verifyQrCode(qrCode: string, action: string = 'VERIFY'): Promise<any> {
    const res = await this.api.post('/operations/production/traceability/verify-qr', { qrCode, action });
    return res.data;
  }

  public async getChangeovers(): Promise<{ success: boolean; data: ChangeoverRecord[] }> {
    const res = await this.api.get('/operations/production/changeovers');
    return res.data;
  }

  public async createChangeover(dto: Partial<ChangeoverRecord>): Promise<{ success: boolean; data: ChangeoverRecord }> {
    const res = await this.api.post('/operations/production/changeovers', dto);
    return res.data;
  }

  public async getMaterialIssues(): Promise<{ success: boolean; data: MaterialIssue[] }> {
    const res = await this.api.get('/operations/production/material-issues');
    return res.data;
  }

  public async createMaterialIssue(dto: Partial<MaterialIssue>): Promise<{ success: boolean; data: MaterialIssue }> {
    const res = await this.api.post('/operations/production/material-issues', dto);
    return res.data;
  }

  public async getYieldReport(): Promise<any> {
    const res = await this.api.get('/operations/production/yield-report');
    return res.data;
  }

  public async getShiftHandovers(): Promise<{ success: boolean; data: ShiftHandover[] }> {
    const res = await this.api.get('/operations/production/shift-handovers');
    return res.data;
  }

  public async createShiftHandover(dto: Partial<ShiftHandover>): Promise<{ success: boolean; data: ShiftHandover }> {
    const res = await this.api.post('/operations/production/shift-handovers', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Warehouse
  // --------------------------------------------------------------------------
  public async getInventoryStock(): Promise<{ success: boolean; data: InventoryStock[] }> {
    const res = await this.api.get('/operations/warehouse/stocks');
    return res.data;
  }

  public async getGoodsReceipts(): Promise<{ success: boolean; data: GoodsReceipt[] }> {
    const res = await this.api.get('/operations/warehouse/goods-receipts');
    return res.data;
  }

  public async createGoodsReceipt(dto: Partial<GoodsReceipt>): Promise<{ success: boolean; data: GoodsReceipt }> {
    const res = await this.api.post('/operations/warehouse/goods-receipts', dto);
    return res.data;
  }

  public async getPutawayTasks(): Promise<{ success: boolean; data: PutawayTask[] }> {
    const res = await this.api.get('/operations/warehouse/putaways');
    return res.data;
  }

  public async createPutawayTask(dto: Partial<PutawayTask>): Promise<{ success: boolean; data: PutawayTask }> {
    const res = await this.api.post('/operations/warehouse/putaways', dto);
    return res.data;
  }

  public async getPickingTasks(): Promise<{ success: boolean; data: PickingTask[] }> {
    const res = await this.api.get('/operations/warehouse/pickings');
    return res.data;
  }

  public async createPickingTask(dto: Partial<PickingTask>): Promise<{ success: boolean; data: PickingTask }> {
    const res = await this.api.post('/operations/warehouse/pickings', dto);
    return res.data;
  }

  public async getStockMovements(): Promise<{ success: boolean; data: StockMovement[] }> {
    const res = await this.api.get('/operations/warehouse/movements');
    return res.data;
  }

  public async createStockMovement(dto: Partial<StockMovement>): Promise<{ success: boolean; data: StockMovement }> {
    const res = await this.api.post('/operations/warehouse/movements', dto);
    return res.data;
  }

  public async getStockCounts(): Promise<{ success: boolean; data: StockCount[] }> {
    const res = await this.api.get('/operations/warehouse/counts');
    return res.data;
  }

  public async createStockCount(dto: Partial<StockCount>): Promise<{ success: boolean; data: StockCount }> {
    const res = await this.api.post('/operations/warehouse/counts', dto);
    return res.data;
  }

  public async getWarehouseDashboard(): Promise<any> {
    const res = await this.api.get('/operations/warehouse/dashboard');
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Quality
  // --------------------------------------------------------------------------
  public async getQcDashboard(): Promise<any> {
    const res = await this.api.get('/operations/quality/dashboard');
    return res.data;
  }

  public async getInspections(): Promise<{ success: boolean; data: QualityInspection[] }> {
    const res = await this.api.get('/operations/quality/inspections');
    return res.data;
  }

  public async createInspection(dto: Partial<QualityInspection>): Promise<{ success: boolean; data: QualityInspection }> {
    const res = await this.api.post('/operations/quality/inspections', dto);
    return res.data;
  }

  public async getNcrs(): Promise<{ success: boolean; data: NonConformanceReport[] }> {
    const res = await this.api.get('/operations/quality/ncrs');
    return res.data;
  }

  public async createNcr(dto: Partial<NonConformanceReport>): Promise<{ success: boolean; data: NonConformanceReport }> {
    const res = await this.api.post('/operations/quality/ncrs', dto);
    return res.data;
  }

  public async getCapas(): Promise<{ success: boolean; data: CorrectiveAction[] }> {
    const res = await this.api.get('/operations/quality/capas');
    return res.data;
  }

  public async createCapa(dto: Partial<CorrectiveAction>): Promise<{ success: boolean; data: CorrectiveAction }> {
    const res = await this.api.post('/operations/quality/capas', dto);
    return res.data;
  }

  public async getSupplierQuality(): Promise<any> {
    const res = await this.api.get('/operations/quality/supplier-ratings');
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Maintenance
  // --------------------------------------------------------------------------
  public async getMaintenanceSchedules(): Promise<{ success: boolean; data: MaintenanceSchedule[] }> {
    const res = await this.api.get('/operations/maintenance/schedules');
    return res.data;
  }

  public async createMaintenanceSchedule(dto: Partial<MaintenanceSchedule>): Promise<{ success: boolean; data: MaintenanceSchedule }> {
    const res = await this.api.post('/operations/maintenance/schedules', dto);
    return res.data;
  }

  public async getMaintenanceWorkOrders(): Promise<{ success: boolean; data: MaintenanceWorkOrder[] }> {
    const res = await this.api.get('/operations/maintenance/work-orders');
    return res.data;
  }

  public async createMaintenanceWorkOrder(dto: Partial<MaintenanceWorkOrder>): Promise<{ success: boolean; data: MaintenanceWorkOrder }> {
    const res = await this.api.post('/operations/maintenance/work-orders', dto);
    return res.data;
  }

  public async getSpareParts(): Promise<{ success: boolean; data: SparePart[] }> {
    const res = await this.api.get('/operations/maintenance/spare-parts');
    return res.data;
  }

  public async createSparePart(dto: Partial<SparePart>): Promise<{ success: boolean; data: SparePart }> {
    const res = await this.api.post('/operations/maintenance/spare-parts', dto);
    return res.data;
  }
}

export const operationsApi = OperationsApi.getInstance();
