import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ObservabilityLogger } from '../../common/observability/logger.service';
import { MetricsService } from '../../common/observability/metrics.service';
import { TracingService } from '../../common/observability/tracing.service';
import * as crypto from 'crypto';
import {
  CreateJitScheduleDto,
  CreateJitScheduleDtoSchema,
  CreateWorkOrderDto,
  CreateWorkOrderDtoSchema,
  UpdateWorkOrderDto,
  UpdateWorkOrderDtoSchema,
  CreateProductionEntryDto,
  CreateProductionEntryDtoSchema,
  CreateWipOperationDto,
  CreateWipOperationDtoSchema,
  LogMachineTelemetryDto,
  LogMachineTelemetryDtoSchema,
  CreateDowntimeRecordDto,
  CreateDowntimeRecordDtoSchema,
  CreateBatchRecordDto,
  CreateBatchRecordDtoSchema,
  QrScanDto,
  QrScanDtoSchema,
  CreateChangeoverDto,
  CreateChangeoverDtoSchema,
  CreateMaterialIssueDto,
  CreateMaterialIssueDtoSchema,
  CreateShiftHandoverDto,
  CreateShiftHandoverDtoSchema,
  UpdateStockDto,
  UpdateStockDtoSchema,
  CreateGrnDto,
  CreateGrnDtoSchema,
  CreatePutawayDto,
  CreatePutawayDtoSchema,
  CreatePickingDto,
  CreatePickingDtoSchema,
  CreateStockMovementDto,
  CreateStockMovementDtoSchema,
  CreateStockCountDto,
  CreateStockCountDtoSchema,
  CreateInspectionDto,
  CreateInspectionDtoSchema,
  CreateNcrDto,
  CreateNcrDtoSchema,
  CreateCapaDto,
  CreateCapaDtoSchema,
  CreateMaintenanceScheduleDto,
  CreateMaintenanceScheduleDtoSchema,
  CreateMaintenanceWorkOrderDto,
  CreateMaintenanceWorkOrderDtoSchema,
  CreateSparePartDto,
  CreateSparePartDtoSchema,
} from './operations.dto';

@Injectable()
export class OperationsService {
  private readonly logger = new Logger(OperationsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly obsLogger: ObservabilityLogger,
    private readonly metrics: MetricsService,
    private readonly tracing: TracingService
  ) {}

  // ============================================================================
  // PRODUCTION SUB-MODULE (Screens 1 – 16)
  // ============================================================================

  // Screen 1: JIT Scheduling Board
  public async getJitSchedules(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT s.*, m.machine_name, m.tonnage
       FROM jit_schedules s
       LEFT JOIN admin_machines m ON s.machine_id = m.id
       WHERE s.tenant_id = $1 AND s.deleted_at IS NULL ORDER BY s.scheduled_start ASC`,
      [tenantId]
    );
    return res.rows;
  }

  public async createJitSchedule(dto: CreateJitScheduleDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateJitScheduleDtoSchema.parse(dto);
    const schedId = parsed.id || `JIT-${Date.now().toString().slice(-6)}`;
    const schedNum = parsed.scheduleNumber || `JIT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO jit_schedules (
        id, tenant_id, schedule_number, work_order_id, machine_id,
        scheduled_start, scheduled_end, priority, status, is_jit,
        version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'v1.0', $11, $11
      ) RETURNING *`,
      [
        schedId,
        tenantId,
        schedNum,
        parsed.workOrderId || null,
        parsed.machineId,
        parsed.scheduledStart,
        parsed.scheduledEnd,
        parsed.priority || 10,
        parsed.status || 'SCHEDULED',
        parsed.isJit,
        userId,
      ]
    );
    return res.rows[0];
  }

  // Screen 2: Work Orders
  public async getWorkOrders(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT w.*, m.machine_name
       FROM work_orders w
       LEFT JOIN admin_machines m ON w.machine_id = m.id
       WHERE w.tenant_id = $1 AND w.deleted_at IS NULL ORDER BY w.created_at DESC`,
      [tenantId]
    );
    return res.rows;
  }

  public async getWorkOrderById(id: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(`SELECT * FROM work_orders WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
    if (res.rows.length === 0) throw new NotFoundException(`Work Order ${id} not found.`);
    return res.rows[0];
  }

  public async createWorkOrder(dto: CreateWorkOrderDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateWorkOrderDtoSchema.parse(dto);
    const woId = parsed.id || `WO-${Date.now().toString().slice(-6)}`;
    const woNum = parsed.woNumber || `WO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO work_orders (
        id, tenant_id, wo_number, sales_order_id, bom_id, machine_id,
        work_center_id, target_qty, produced_qty, rejected_qty, scrap_qty,
        uom, status, priority, planned_start, planned_end, shift_id,
        assigned_to_id, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, 0, 0, 0,
        $9, $10, $11, $12, $13, $14,
        $15, 'v1.0', $16, $16
      ) RETURNING *`,
      [
        woId,
        tenantId,
        woNum,
        parsed.salesOrderId || null,
        parsed.bomId,
        parsed.machineId || 'MCH-IMM-250T-01',
        parsed.workCenterId || 'WC-MOLDING-A',
        parsed.targetQty,
        parsed.uom || 'PCS',
        parsed.status || 'CREATED',
        parsed.priority || 'MEDIUM',
        parsed.plannedStart,
        parsed.plannedEnd,
        parsed.shiftId || 'SHIFT-A',
        parsed.assignedToId || null,
        userId,
      ]
    );

    this.metrics.incrementBusinessEvent('work_order_created', 'production');
    return res.rows[0];
  }

  public async updateWorkOrderStatus(id: string, status: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const res = await this.db.query(
      `UPDATE work_orders SET status = $1, updated_by_id = $2, updated_at = NOW(), version = version || '.1' WHERE id = $3 AND tenant_id = $4 RETURNING *`,
      [status, userId, id, tenantId]
    );
    return res.rows[0];
  }

  // Screen 3: Daily Production Entry
  public async getProductionEntries(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT p.*, w.wo_number, m.machine_name, u.full_name as operator_name
       FROM production_entries p
       LEFT JOIN work_orders w ON p.work_order_id = w.id
       LEFT JOIN admin_machines m ON p.machine_id = m.id
       LEFT JOIN auth_users u ON p.operator_id = u.id
       WHERE p.tenant_id = $1 ORDER BY p.entry_date DESC`,
      [tenantId]
    );
    return res.rows;
  }

  public async createProductionEntry(dto: CreateProductionEntryDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateProductionEntryDtoSchema.parse(dto);
    const entryId = parsed.id || `PROD-${Date.now().toString().slice(-6)}`;
    const entryNum = parsed.entryNumber || `PROD-${parsed.entryDate}-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO production_entries (
        id, tenant_id, entry_number, work_order_id, machine_id, shift_id,
        entry_date, operator_id, good_qty, rejected_qty, scrap_qty,
        cycle_time_sec, downtime_minutes, reason_code_id, notes,
        version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15,
        'v1.0', $16, $16
      ) RETURNING *`,
      [
        entryId,
        tenantId,
        entryNum,
        parsed.workOrderId,
        parsed.machineId,
        parsed.shiftId || 'SHIFT-A',
        parsed.entryDate,
        parsed.operatorId,
        parsed.goodQty,
        parsed.rejectedQty,
        parsed.scrapQty,
        parsed.cycleTimeSec || 14.8,
        parsed.downtimeMinutes || 0,
        parsed.reasonCodeId || null,
        parsed.notes || null,
        userId,
      ]
    );

    // Update Work Order cumulative produced & scrap
    await this.db.query(
      `UPDATE work_orders SET
        produced_qty = produced_qty + $1,
        rejected_qty = rejected_qty + $2,
        scrap_qty = scrap_qty + $3,
        updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5`,
      [Number(parsed.goodQty), Number(parsed.rejectedQty), Number(parsed.scrapQty), parsed.workOrderId, tenantId]
    );

    this.metrics.incrementBusinessEvent('production_logged', 'production');
    return res.rows[0];
  }

  // Screen 4: WIP Operations
  public async getWipOperations(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT w.*, wo.wo_number
       FROM wip_operations w
       LEFT JOIN work_orders wo ON w.work_order_id = wo.id
       WHERE w.tenant_id = $1 ORDER BY w.created_at DESC`,
      [tenantId]
    );
    return res.rows;
  }

  public async createWipOperation(dto: CreateWipOperationDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateWipOperationDtoSchema.parse(dto);
    const wipId = parsed.id || `WIP-${Date.now().toString().slice(-6)}`;
    const wipNum = parsed.wipNumber || `WIP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO wip_operations (
        id, tenant_id, wip_number, work_order_id, operation_type, quantity,
        status, qc_gate_passed, location_id, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, 'v1.0', $10, $10
      ) RETURNING *`,
      [
        wipId,
        tenantId,
        wipNum,
        parsed.workOrderId,
        parsed.operationType,
        parsed.quantity,
        parsed.status || 'PENDING',
        parsed.qcGatePassed || false,
        parsed.locationId || 'LOC-WIP-DEFLASH-01',
        userId,
      ]
    );
    return res.rows[0];
  }

  // Screen 5 & 6: Shop Floor & Machine Telemetry (IoT)
  public async getShopFloorConsole(tenantId: string = 'TENANT-ALPHA-IND') {
    const machinesRes = await this.db.query(
      `SELECT m.*, COUNT(wo.id) as active_wo_count
       FROM admin_machines m
       LEFT JOIN work_orders wo ON m.id = wo.machine_id AND wo.status = 'IN_PROGRESS'
       WHERE m.deleted_at IS NULL GROUP BY m.id ORDER BY m.machine_code ASC`
    );

    return {
      activeWorkCenters: 4,
      totalMachines: machinesRes.rows.length,
      runningMachines: machinesRes.rows.filter((m: any) => m.status === 'RUNNING').length,
      idleMachines: machinesRes.rows.filter((m: any) => m.status === 'AVAILABLE' || m.status === 'IDLE').length,
      downMachines: machinesRes.rows.filter((m: any) => m.status === 'BREAKDOWN' || m.status === 'MAINTENANCE').length,
      averageOeePct: 87.6,
      machines: machinesRes.rows,
    };
  }

  public async logTelemetry(dto: LogMachineTelemetryDto, tenantId: string = 'TENANT-ALPHA-IND') {
    const parsed = LogMachineTelemetryDtoSchema.parse(dto);
    const telemId = `TEL-${Date.now().toString().slice(-6)}`;

    const res = await this.db.query(
      `INSERT INTO machine_telemetries (
        id, tenant_id, machine_id, timestamp, temperature, pressure,
        cycle_count, energy_consumption, vibration, status, alarm_code
      ) VALUES (
        $1, $2, $3, NOW(), $4, $5,
        $6, $7, $8, $9, $10
      ) RETURNING *`,
      [
        telemId,
        tenantId,
        parsed.machineId,
        parsed.temperature || 235.4,
        parsed.pressure || 148.2,
        parsed.cycleCount || 120,
        parsed.energyConsumption || 38.5,
        parsed.vibration || 1.2,
        parsed.status || 'RUNNING',
        parsed.alarmCode || null,
      ]
    );

    return res.rows[0];
  }

  // Screen 7: Downtime & Scrap Analysis
  public async getDowntimeRecords(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT d.*, m.machine_name, r.reason_code, r.reason_description
       FROM downtime_records d
       LEFT JOIN admin_machines m ON d.machine_id = m.id
       LEFT JOIN admin_reason_codes r ON d.reason_code_id = r.id
       WHERE d.tenant_id = $1 ORDER BY d.start_time DESC`,
      [tenantId]
    );
    return res.rows;
  }

  public async createDowntimeRecord(dto: CreateDowntimeRecordDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateDowntimeRecordDtoSchema.parse(dto);
    const dtId = parsed.id || `DT-${Date.now().toString().slice(-6)}`;
    const dtNum = parsed.recordNumber || `DT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO downtime_records (
        id, tenant_id, record_number, work_order_id, machine_id,
        downtime_type, reason_code_id, start_time, duration_minutes,
        impact_on_oee, reported_by_id, notes, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'v1.0', $13, $13
      ) RETURNING *`,
      [
        dtId,
        tenantId,
        dtNum,
        parsed.workOrderId || null,
        parsed.machineId,
        parsed.downtimeType,
        parsed.reasonCodeId,
        parsed.startTime,
        parsed.durationMinutes || 15,
        parsed.impactOnOee,
        userId,
        parsed.notes || null,
        userId,
      ]
    );
    return res.rows[0];
  }

  // Screen 8 & 9: Batch Records, Genealogy & QR
  public async getBatchRecords(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT b.*, wo.wo_number
       FROM batch_records b
       LEFT JOIN work_orders wo ON b.work_order_id = wo.id
       WHERE b.tenant_id = $1 ORDER BY b.started_at DESC`,
      [tenantId]
    );
    return res.rows;
  }

  public async createBatchRecord(dto: CreateBatchRecordDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateBatchRecordDtoSchema.parse(dto);
    const batchId = parsed.id || `BATCH-${Date.now().toString().slice(-6)}`;
    const batchNum = parsed.batchNumber || `BATCH-2026-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO batch_records (
        id, tenant_id, batch_number, work_order_id, bom_id, batch_qty,
        status, started_at, parent_batch_id, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 'v1.0', $10, $10
      ) RETURNING *`,
      [
        batchId,
        tenantId,
        batchNum,
        parsed.workOrderId,
        parsed.bomId,
        parsed.batchQty,
        parsed.status || 'IN_PROGRESS',
        parsed.startedAt,
        parsed.parentBatchId || null,
        userId,
      ]
    );
    return res.rows[0];
  }

  public async verifyQrCode(dto: QrScanDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = QrScanDtoSchema.parse(dto);
    const scanId = `SCAN-${Date.now().toString().slice(-6)}`;
    return {
      scanId,
      qrCode: parsed.qrCode,
      action: parsed.action,
      location: parsed.location,
      verifiedStatus: 'AUTHENTIC_VERIFIED',
      entityInfo: {
        itemCode: 'PP-AUTO-BUMPER-01',
        itemName: 'Front Bumper Fascia - UV Stabilized',
        batchNumber: 'BATCH-2026-0819',
        manufacturedDate: '2026-09-20',
        qcPassed: true,
      },
      scannedAt: new Date().toISOString(),
      scannedBy: userId,
    };
  }

  // Screen 10 & 11: SMED Changeover & Material Issue
  public async getChangeovers(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT c.*, m.machine_name FROM changeover_records c LEFT JOIN admin_machines m ON c.machine_id = m.id WHERE c.tenant_id = $1 ORDER BY c.created_at DESC`,
      [tenantId]
    );
    return res.rows;
  }

  public async createChangeover(dto: CreateChangeoverDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateChangeoverDtoSchema.parse(dto);
    const coId = parsed.id || `CO-${Date.now().toString().slice(-6)}`;
    const coNum = `CO-2026-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO changeover_records (
        id, tenant_id, record_number, machine_id, from_product_code, to_product_code,
        planned_duration, actual_duration, internal_time, external_time, status,
        version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'v1.0', $12, $12
      ) RETURNING *`,
      [
        coId,
        tenantId,
        coNum,
        parsed.machineId,
        parsed.fromProductCode,
        parsed.toProductCode,
        parsed.plannedDuration || 45,
        parsed.actualDuration || 0,
        parsed.internalTime || 0,
        parsed.externalTime || 0,
        parsed.status || 'PLANNED',
        userId,
      ]
    );
    return res.rows[0];
  }

  public async getMaterialIssues(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(`SELECT * FROM material_issues WHERE tenant_id = $1 ORDER BY issue_date DESC`, [tenantId]);
    return res.rows;
  }

  public async createMaterialIssue(dto: CreateMaterialIssueDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateMaterialIssueDtoSchema.parse(dto);
    const issId = parsed.id || `ISS-${Date.now().toString().slice(-6)}`;
    const issNum = `ISSUE-2026-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO material_issues (
        id, tenant_id, issue_number, work_order_id, issue_type, item_id,
        item_code, item_name, quantity, uom, batch_number, issued_by_id,
        version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'v1.0', $12, $12
      ) RETURNING *`,
      [
        issId,
        tenantId,
        issNum,
        parsed.workOrderId,
        parsed.issueType,
        parsed.itemId,
        parsed.itemCode,
        parsed.itemName,
        parsed.quantity,
        parsed.uom || 'KG',
        parsed.batchNumber || null,
        userId,
      ]
    );
    return res.rows[0];
  }

  // Screen 15 & 16: Yield Report & Shift Handover
  public async getYieldReport(tenantId: string = 'TENANT-ALPHA-IND') {
    return {
      overallMaterialYieldPct: 94.8,
      totalResinIssuedKg: 42500,
      totalGoodFinishedKg: 40290,
      totalScrapRegrindKg: 2210,
      regrindUtilizationRatioPct: 88.5,
      scrapBreakdown: [
        { category: 'Purge / Startup Waste', weightKg: 850, sharePct: 38.5 },
        { category: 'Flash & Runner Trimmings', weightKg: 780, sharePct: 35.3 },
        { category: 'Dimensional Defects', weightKg: 580, sharePct: 26.2 },
      ],
    };
  }

  public async getShiftHandovers(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(`SELECT * FROM shift_handovers WHERE tenant_id = $1 ORDER BY handover_date DESC`, [tenantId]);
    return res.rows;
  }

  public async createShiftHandover(dto: CreateShiftHandoverDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateShiftHandoverDtoSchema.parse(dto);
    const hoId = parsed.id || `HO-${Date.now().toString().slice(-6)}`;

    const res = await this.db.query(
      `INSERT INTO shift_handovers (
        id, tenant_id, from_shift, to_shift, handover_date, machine_status_summary,
        production_target_achieved, open_issues, safety_notes, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 'v1.0', $10, $10
      ) RETURNING *`,
      [
        hoId,
        tenantId,
        parsed.fromShift,
        parsed.toShift,
        parsed.handoverDate,
        parsed.machineStatusSummary,
        parsed.productionTargetAchieved,
        parsed.openIssues || null,
        parsed.safetyNotes || null,
        userId,
      ]
    );
    return res.rows[0];
  }

  // ============================================================================
  // WAREHOUSE SUB-MODULE (Screens 17 – 28)
  // ============================================================================

  // Screen 17: Inventory Stock
  public async getInventoryStock(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT s.*, w.warehouse_name
       FROM inventory_stocks s
       LEFT JOIN admin_warehouses w ON s.warehouse_id = w.id
       WHERE s.tenant_id = $1 ORDER BY s.item_name ASC`,
      [tenantId]
    );
    return res.rows;
  }

  // Screen 18: Goods Receipts (GRN)
  public async getGoodsReceipts(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT g.*, w.warehouse_name FROM goods_receipts g LEFT JOIN admin_warehouses w ON g.warehouse_id = w.id WHERE g.tenant_id = $1 ORDER BY g.receipt_date DESC`,
      [tenantId]
    );
    return res.rows;
  }

  public async createGoodsReceipt(dto: CreateGrnDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateGrnDtoSchema.parse(dto);
    const grnId = parsed.id || `GRN-${Date.now().toString().slice(-6)}`;
    const grnNum = parsed.grnNumber || `GRN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const totalQty = parsed.lines.reduce((sum, l) => sum + Number(l.receivedQty), 0);

    const res = await this.db.query(
      `INSERT INTO goods_receipts (
        id, tenant_id, grn_number, po_number, supplier_id, supplier_name,
        warehouse_id, status, total_qty, received_by_id, notes,
        version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'v1.0', $10, $10
      ) RETURNING *`,
      [
        grnId,
        tenantId,
        grnNum,
        parsed.poNumber || null,
        parsed.supplierId || null,
        parsed.supplierName || null,
        parsed.warehouseId || 'WH-RM-01',
        parsed.status || 'PENDING_INSPECTION',
        totalQty,
        userId,
        parsed.notes || null,
      ]
    );

    this.metrics.incrementBusinessEvent('goods_receipt_created', 'warehouse');
    return res.rows[0];
  }

  // Screen 19 & 20: Putaway & Picking Tasks
  public async getPutawayTasks(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(`SELECT * FROM putaway_tasks WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]);
    return res.rows;
  }

  public async createPutawayTask(dto: CreatePutawayDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreatePutawayDtoSchema.parse(dto);
    const taskId = parsed.id || `PUT-${Date.now().toString().slice(-6)}`;
    const taskNum = `PUT-2026-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO putaway_tasks (
        id, tenant_id, task_number, grn_id, item_id, item_code, quantity,
        uom, from_location, to_location_id, status, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'v1.0', $12, $12
      ) RETURNING *`,
      [
        taskId,
        tenantId,
        taskNum,
        parsed.grnId || null,
        parsed.itemId,
        parsed.itemCode,
        parsed.quantity,
        parsed.uom || 'KG',
        parsed.fromLocation || 'Receiving Dock',
        parsed.toLocationId,
        parsed.status || 'PENDING',
        userId,
      ]
    );
    return res.rows[0];
  }

  public async getPickingTasks(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(`SELECT * FROM picking_tasks WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]);
    return res.rows;
  }

  public async createPickingTask(dto: CreatePickingDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreatePickingDtoSchema.parse(dto);
    const taskId = parsed.id || `PICK-${Date.now().toString().slice(-6)}`;
    const taskNum = `PICK-2026-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO picking_tasks (
        id, tenant_id, task_number, sales_order_id, delivery_id, item_id,
        item_code, quantity, uom, from_location_id, to_location, status,
        version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'v1.0', $13, $13
      ) RETURNING *`,
      [
        taskId,
        tenantId,
        taskNum,
        parsed.salesOrderId || null,
        parsed.deliveryId || null,
        parsed.itemId,
        parsed.itemCode,
        parsed.quantity,
        parsed.uom || 'PCS',
        parsed.fromLocationId,
        parsed.toLocation || 'Staging Area',
        parsed.status || 'PENDING',
        userId,
      ]
    );
    return res.rows[0];
  }

  // Screen 21 & 22: Stock Transfers & Physical Counts
  public async getStockMovements(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(`SELECT * FROM stock_movements WHERE tenant_id = $1 ORDER BY movement_date DESC`, [tenantId]);
    return res.rows;
  }

  public async createStockMovement(dto: CreateStockMovementDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateStockMovementDtoSchema.parse(dto);
    const movId = parsed.id || `MOV-${Date.now().toString().slice(-6)}`;
    const movNum = `MOV-2026-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO stock_movements (
        id, tenant_id, movement_number, movement_type, item_id, item_code,
        item_name, quantity, uom, from_warehouse_id, to_warehouse_id,
        moved_by_id, notes, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'v1.0', $12, $12
      ) RETURNING *`,
      [
        movId,
        tenantId,
        movNum,
        parsed.movementType,
        parsed.itemId,
        parsed.itemCode,
        parsed.itemName,
        parsed.quantity,
        parsed.uom || 'PCS',
        parsed.fromWarehouseId || null,
        parsed.toWarehouseId || null,
        userId,
        parsed.notes || null,
      ]
    );

    this.metrics.incrementBusinessEvent('stock_movement', 'warehouse');
    return res.rows[0];
  }

  public async getStockCounts(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(`SELECT * FROM stock_counts WHERE tenant_id = $1 ORDER BY count_date DESC`, [tenantId]);
    return res.rows;
  }

  public async createStockCount(dto: CreateStockCountDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateStockCountDtoSchema.parse(dto);
    const countId = parsed.id || `COUNT-${Date.now().toString().slice(-6)}`;
    const countNum = `COUNT-2026-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO stock_counts (
        id, tenant_id, count_number, warehouse_id, count_date, status,
        total_items, conducted_by_id, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 'v1.0', $8, $8
      ) RETURNING *`,
      [
        countId,
        tenantId,
        countNum,
        parsed.warehouseId,
        parsed.countDate,
        parsed.status || 'DRAFT',
        parsed.lines.length,
        userId,
      ]
    );
    return res.rows[0];
  }

  public async getWarehouseDashboard(tenantId: string = 'TENANT-ALPHA-IND') {
    return {
      totalStorageCapacityKg: 500000,
      occupiedStorageKg: 342100,
      spaceUtilizationPct: 68.4,
      dockToStockHours: 3.2,
      activePutaways: 4,
      activePickLists: 7,
      reorderAlertsCount: 3,
      deadStockValue: 142000,
    };
  }

  // ============================================================================
  // QUALITY MANAGEMENT SUB-MODULE (Screens 29 – 33)
  // ============================================================================

  // Screen 29 & 30: QC Dashboard & Inspections
  public async getQcDashboard(tenantId: string = 'TENANT-ALPHA-IND') {
    return {
      firstPassYieldPct: 97.2,
      customerPpm: 42,
      supplierRejectionPpm: 128,
      inspectionsCompletedToday: 34,
      openNcrs: 2,
      openCapas: 1,
      topDefectTypes: [
        { defect: 'Sink Marks / Warpage', count: 14, sharePct: 41.2 },
        { defect: 'Flash at Parting Line', count: 11, sharePct: 32.4 },
        { defect: 'Short Shots', count: 9, sharePct: 26.4 },
      ],
    };
  }

  public async getInspections(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(`SELECT * FROM quality_inspections WHERE tenant_id = $1 ORDER BY inspection_date DESC`, [tenantId]);
    return res.rows;
  }

  public async createInspection(dto: CreateInspectionDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateInspectionDtoSchema.parse(dto);
    const inspId = parsed.id || `QC-${Date.now().toString().slice(-6)}`;
    const inspNum = `QC-2026-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO quality_inspections (
        id, tenant_id, inspection_number, inspection_type, work_order_id,
        batch_id, item_id, item_code, sample_size, accepted_qty, rejected_qty,
        status, inspector_id, notes, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'v1.0', $13, $13
      ) RETURNING *`,
      [
        inspId,
        tenantId,
        inspNum,
        parsed.inspectionType,
        parsed.workOrderId || null,
        parsed.batchId || null,
        parsed.itemId,
        parsed.itemCode,
        parsed.sampleSize,
        parsed.acceptedQty,
        parsed.rejectedQty,
        parsed.status || 'PASSED',
        parsed.inspectorId,
        parsed.notes || null,
      ]
    );

    this.metrics.incrementBusinessEvent('qc_inspection_completed', 'quality');
    return res.rows[0];
  }

  // Screen 31 & 32: NCR & CAPA
  public async getNcrs(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(`SELECT * FROM non_conformance_reports WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]);
    return res.rows;
  }

  public async createNcr(dto: CreateNcrDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateNcrDtoSchema.parse(dto);
    const ncrId = parsed.id || `NCR-${Date.now().toString().slice(-6)}`;
    const ncrNum = `NCR-2026-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO non_conformance_reports (
        id, tenant_id, ncr_number, inspection_id, work_order_id, item_id,
        item_code, defect_type, severity, quantity, disposition, root_cause,
        reported_by_id, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'v1.0', $13, $13
      ) RETURNING *`,
      [
        ncrId,
        tenantId,
        ncrNum,
        parsed.inspectionId || null,
        parsed.workOrderId || null,
        parsed.itemId,
        parsed.itemCode,
        parsed.defectType,
        parsed.severity || 'MAJOR',
        parsed.quantity,
        parsed.disposition || 'PENDING',
        parsed.rootCause || null,
        userId,
      ]
    );
    return res.rows[0];
  }

  public async getCapas(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(`SELECT * FROM corrective_actions WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]);
    return res.rows;
  }

  public async createCapa(dto: CreateCapaDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateCapaDtoSchema.parse(dto);
    const capaId = parsed.id || `CAPA-${Date.now().toString().slice(-6)}`;
    const capaNum = `CAPA-2026-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO corrective_actions (
        id, tenant_id, capa_number, ncr_id, title, root_cause,
        corrective_action, preventive_action, target_date, status,
        version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'v1.0', $11, $11
      ) RETURNING *`,
      [
        capaId,
        tenantId,
        capaNum,
        parsed.ncrId || null,
        parsed.title,
        parsed.rootCause,
        parsed.correctiveAction,
        parsed.preventiveAction,
        parsed.targetDate,
        parsed.status || 'OPEN',
        userId,
      ]
    );
    return res.rows[0];
  }

  public async getSupplierQuality(tenantId: string = 'TENANT-ALPHA-IND') {
    return [
      { supplierId: 'SUP-01', supplierName: 'Reliance Polymers Ltd', lotAcceptanceRatePct: 99.4, rejectionPpm: 24, rating: 'CLASS_A' },
      { supplierId: 'SUP-02', supplierName: 'BASF Masterbatch India', lotAcceptanceRatePct: 98.1, rejectionPpm: 86, rating: 'CLASS_A' },
      { supplierId: 'SUP-03', supplierName: 'Shree Tooling Works', lotAcceptanceRatePct: 94.6, rejectionPpm: 240, rating: 'CLASS_B' },
    ];
  }

  // ============================================================================
  // MAINTENANCE SUB-MODULE (Screens 34 – 36)
  // ============================================================================

  // Screen 34: Maintenance Schedule
  public async getMaintenanceSchedules(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT s.*, m.machine_name FROM maintenance_schedules s LEFT JOIN admin_machines m ON s.machine_id = m.id WHERE s.tenant_id = $1 ORDER BY s.next_due_date ASC`,
      [tenantId]
    );
    return res.rows;
  }

  public async createMaintenanceSchedule(dto: CreateMaintenanceScheduleDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateMaintenanceScheduleDtoSchema.parse(dto);
    const schedId = parsed.id || `MSCH-${Date.now().toString().slice(-6)}`;

    const res = await this.db.query(
      `INSERT INTO maintenance_schedules (
        id, tenant_id, machine_id, maintenance_type, title, frequency_days,
        next_due_date, checklist, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 'v1.0', $9, $9
      ) RETURNING *`,
      [
        schedId,
        tenantId,
        parsed.machineId,
        parsed.maintenanceType || 'PREVENTIVE',
        parsed.title,
        parsed.frequencyDays || 30,
        parsed.nextDueDate,
        JSON.stringify(parsed.checklist || []),
        userId,
      ]
    );
    return res.rows[0];
  }

  // Screen 35: Maintenance Work Orders
  public async getMaintenanceWorkOrders(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT mwo.*, m.machine_name FROM maintenance_work_orders mwo LEFT JOIN admin_machines m ON mwo.machine_id = m.id WHERE mwo.tenant_id = $1 ORDER BY mwo.created_at DESC`,
      [tenantId]
    );
    return res.rows;
  }

  public async createMaintenanceWorkOrder(dto: CreateMaintenanceWorkOrderDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateMaintenanceWorkOrderDtoSchema.parse(dto);
    const mwoId = parsed.id || `MWO-${Date.now().toString().slice(-6)}`;
    const mwoNum = `MWO-2026-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query(
      `INSERT INTO maintenance_work_orders (
        id, tenant_id, mwo_number, machine_id, maintenance_type, priority,
        status, description, assigned_to_id, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 'v1.0', $10, $10
      ) RETURNING *`,
      [
        mwoId,
        tenantId,
        mwoNum,
        parsed.machineId,
        parsed.maintenanceType || 'BREAKDOWN',
        parsed.priority || 'HIGH',
        parsed.status || 'CREATED',
        parsed.description,
        parsed.assignedToId || null,
        userId,
      ]
    );
    return res.rows[0];
  }

  // Screen 36: Spare Parts Inventory
  public async getSpareParts(tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(`SELECT * FROM spare_parts_inventories WHERE tenant_id = $1 ORDER BY part_name ASC`, [tenantId]);
    return res.rows;
  }

  public async createSparePart(dto: CreateSparePartDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateSparePartDtoSchema.parse(dto);
    const spId = parsed.id || `SP-${Date.now().toString().slice(-6)}`;

    const res = await this.db.query(
      `INSERT INTO spare_parts_inventories (
        id, tenant_id, part_code, part_name, machine_model, category,
        quantity_on_hand, reorder_point, unit_cost, uom, version, created_by_id, updated_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'v1.0', $11, $11
      ) RETURNING *`,
      [
        spId,
        tenantId,
        parsed.partCode,
        parsed.partName,
        parsed.machineModel,
        parsed.category,
        parsed.quantityOnHand || 10,
        parsed.reorderPoint || 3,
        parsed.unitCost || 2400,
        parsed.uom || 'NOS',
        userId,
      ]
    );
    return res.rows[0];
  }
}
