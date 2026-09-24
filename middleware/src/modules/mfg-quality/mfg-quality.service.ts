import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ApprovalWorkflowService } from '../approval-workflow/approval-workflow.service';
import {
  CreateBomRevisionDto,
  CreateBomRevisionDtoSchema,
  CreateWorkOrderDto,
  CreateWorkOrderDtoSchema,
  MachineTelemetryDto,
  MachineTelemetryDtoSchema,
  SpcDataEntryDto,
  SpcDataEntryDtoSchema,
  CreateMrbDispositionDto,
  CreateMrbDispositionDtoSchema,
} from './mfg-quality.dto';

@Injectable()
export class MfgQualityService {
  private readonly logger = new Logger(MfgQualityService.name);

  // In-memory aggregates
  private boms = new Map<string, any>();
  private workOrders = new Map<string, any>();
  private machineMetrics = new Map<string, any>();
  private spcDatapoints = new Map<string, any[]>();
  private mrbDispositions = new Map<string, any>();

  constructor(
    private readonly db: DatabaseService,
    private readonly workflowService: ApprovalWorkflowService
  ) {
    this.initSampleData();
  }

  // ============================================================================
  // 1. MULTILEVEL BOM EXPLOSION & ECO VERSIONING
  // ============================================================================
  public async createBomRevision(dto: CreateBomRevisionDto) {
    const parsed = CreateBomRevisionDtoSchema.parse(dto);
    const bomKey = `${parsed.productCode}_${parsed.revision}`;

    const bomRecord = {
      id: parsed.bomCode,
      productCode: parsed.productCode,
      productName: parsed.productName,
      revision: parsed.revision,
      moldCode: parsed.moldCode,
      cavityCount: parsed.cavityCount,
      targetCycleTimeSec: parsed.targetCycleTimeSec,
      items: parsed.items,
      ecoReference: parsed.ecoReference || null,
      status: 'PENDING_ENGINEERING_APPROVAL',
      authorUserId: parsed.authorUserId,
      createdAt: new Date().toISOString(),
    };

    this.boms.set(bomKey, bomRecord);

    // Route to Approval Workflow Engine if ECO is attached
    let approvalInstance = null;
    if (parsed.ecoReference) {
      approvalInstance = await this.workflowService.submitDocumentForApproval({
        tenantId: parsed.tenantId,
        documentRef: parsed.ecoReference,
        domain: 'Engineering',
        documentType: 'Engineering Change Order (ECO)',
        totalAmount: 0,
        initiatorUserId: parsed.authorUserId,
        payloadSnapshot: bomRecord,
      });
    }

    return {
      success: true,
      bomCode: parsed.bomCode,
      revision: parsed.revision,
      status: 'PENDING_ENGINEERING_APPROVAL',
      approvalInstance,
      message: `BOM revision ${parsed.revision} for ${parsed.productCode} registered.`,
    };
  }

  public async getBomExplosion(productCode: string, revision: string = 'Rev-A') {
    const bomKey = `${productCode}_${revision}`;
    const bom = this.boms.get(bomKey);
    if (!bom) {
      throw new NotFoundException(`BOM not found for product "${productCode}" revision "${revision}".`);
    }

    // Explode multilevel tree
    const explode = (items: any[], level: number = 1): any[] => {
      return items.map((itm) => ({
        level,
        partId: itm.partId,
        partName: itm.partName,
        itemType: itm.itemType,
        grossQuantity: (itm.quantityPerUnit * (1 + itm.scrapAllowancePct / 100)).toFixed(4),
        uom: itm.uom,
        scrapAllowancePct: itm.scrapAllowancePct,
        children: itm.childItems && itm.childItems.length > 0 ? explode(itm.childItems, level + 1) : [],
      }));
    };

    return {
      productCode: bom.productCode,
      productName: bom.productName,
      revision: bom.revision,
      moldCode: bom.moldCode,
      cavityCount: bom.cavityCount,
      targetCycleTimeSec: bom.targetCycleTimeSec,
      explodedTree: explode(bom.items),
    };
  }

  // ============================================================================
  // 2. WORK ORDER DISPATCH & CAPACITY SCHEDULING
  // ============================================================================
  public async createWorkOrder(dto: CreateWorkOrderDto) {
    const parsed = CreateWorkOrderDtoSchema.parse(dto);
    const woNumber = parsed.workOrderNumber || `WO-2026-${Date.now().toString().slice(-5)}`;

    const woRecord = {
      id: woNumber,
      tenantId: parsed.tenantId,
      productCode: parsed.productCode,
      productName: parsed.productName,
      bomRevision: parsed.bomRevision,
      targetQuantity: parsed.targetQuantity,
      completedQuantity: 0,
      scrapQuantity: 0,
      assignedMachineId: parsed.assignedMachineId,
      assignedMoldId: parsed.assignedMoldId,
      plannedStartDate: parsed.plannedStartDate,
      shift: parsed.shift,
      priority: parsed.priority,
      status: 'SCHEDULED', // 'SCHEDULED', 'IN_PROGRESS', 'QUALITY_HOLD', 'COMPLETED'
      operatorUserId: parsed.operatorUserId,
      createdAt: new Date().toISOString(),
    };

    this.workOrders.set(woNumber, woRecord);
    this.logger.log(`Work Order ${woNumber} scheduled on Bay ${parsed.assignedMachineId}.`);

    return {
      success: true,
      workOrderNumber: woNumber,
      status: 'SCHEDULED',
      assignedMachine: parsed.assignedMachineId,
      message: `Work Order ${woNumber} scheduled on production line.`,
    };
  }

  public async getWorkOrders(tenantId: string = 'TENANT-ALPHA-IND') {
    return Array.from(this.workOrders.values()).filter((wo) => wo.tenantId === tenantId);
  }

  // ============================================================================
  // 3. REAL-TIME OEE CALCULATION ENGINE
  // ============================================================================
  public async calculateOee(dto: MachineTelemetryDto) {
    const parsed = MachineTelemetryDtoSchema.parse(dto);

    // 1. Availability = (Operating Time - Unplanned Downtime) / Operating Time
    const netOperatingMinutes = parsed.operatingMinutes - parsed.plannedDowntimeMinutes;
    const actualRunningMinutes = Math.max(0, netOperatingMinutes - parsed.unplannedDowntimeMinutes);
    const availabilityPct = netOperatingMinutes > 0 ? (actualRunningMinutes / netOperatingMinutes) * 100 : 0;

    // 2. Performance = (Ideal Cycle Time * Total Parts Produced) / (Operating Time in Sec)
    const runningTimeSec = actualRunningMinutes * 60;
    const totalParts = parsed.totalShotsProduced;
    const performancePct = runningTimeSec > 0 ? ((parsed.idealCycleTimeSec * totalParts) / runningTimeSec) * 100 : 0;

    // 3. Quality = Good Parts / Total Parts
    const qualityPct = totalParts > 0 ? (parsed.goodPartsCount / totalParts) * 100 : 0;

    // Overall OEE
    const oeePct = (availabilityPct / 100) * (Math.min(100, performancePct) / 100) * (qualityPct / 100) * 100;

    const oeeResult = {
      machineId: parsed.machineId,
      availabilityPct: Number(availabilityPct.toFixed(2)),
      performancePct: Number(Math.min(100, performancePct).toFixed(2)),
      qualityPct: Number(qualityPct.toFixed(2)),
      oeePct: Number(oeePct.toFixed(2)),
      worldClassBenchmarkPct: 85.0,
      classification: oeePct >= 85 ? 'WORLD_CLASS' : oeePct >= 70 ? 'TYPICAL' : 'NEEDS_OPTIMIZATION',
      calculatedAt: new Date().toISOString(),
    };

    this.machineMetrics.set(parsed.machineId, oeeResult);
    return oeeResult;
  }

  // ============================================================================
  // 4. STATISTICAL PROCESS CONTROL (SPC) MATH ENGINE
  // ============================================================================
  public async recordSpcSubgroup(dto: SpcDataEntryDto) {
    const parsed = SpcDataEntryDtoSchema.parse(dto);
    const samples = parsed.subgroupSamples;
    const n = samples.length;

    // Calculate Subgroup Mean (X-Bar)
    const mean = samples.reduce((s, v) => s + v, 0) / n;

    // Calculate Sample Range (R)
    const minVal = Math.min(...samples);
    const maxVal = Math.max(...samples);
    const range = maxVal - minVal;

    // Calculate Sample Standard Deviation (sigma)
    const variance = samples.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);

    // Process Capability Index (Cp and Cpk)
    const cp = (parsed.usl - parsed.lsl) / (6 * stdDev);
    const cpu = (parsed.usl - mean) / (3 * stdDev);
    const cpl = (mean - parsed.lsl) / (3 * stdDev);
    const cpk = Math.min(cpu, cpl);

    // Nelson Rule 1: Point Beyond 3-Sigma Limits Check
    const isOutOfControl = mean > parsed.usl || mean < parsed.lsl || cpk < 1.33;

    const spcEntry = {
      id: `SPC-${Date.now().toString().slice(-6)}`,
      characteristicName: parsed.characteristicName,
      nominalValue: parsed.nominalValue,
      usl: parsed.usl,
      lsl: parsed.lsl,
      subgroupMean: Number(mean.toFixed(4)),
      subgroupRange: Number(range.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      cp: Number(cp.toFixed(2)),
      cpk: Number(cpk.toFixed(2)),
      isCapable: cpk >= 1.33,
      isOutOfControl,
      sampleBatchRef: parsed.sampleBatchRef,
      timestamp: new Date().toISOString(),
    };

    const history = this.spcDatapoints.get(parsed.characteristicName) || [];
    history.push(spcEntry);
    this.spcDatapoints.set(parsed.characteristicName, history);

    return {
      success: true,
      spcResult: spcEntry,
      message: spcEntry.isCapable
        ? `Process capability verified (Cpk: ${spcEntry.cpk} >= 1.33).`
        : `Quality Alert: Process Capability Cpk (${spcEntry.cpk}) is below IATF target threshold of 1.33!`,
    };
  }

  // ============================================================================
  // 5. MATERIAL REVIEW BOARD (MRB) QUARANTINE DISPOSITION
  // ============================================================================
  public async createMrbDisposition(dto: CreateMrbDispositionDto) {
    const parsed = CreateMrbDispositionDtoSchema.parse(dto);
    const ncrNumber = parsed.ncrNumber || `NCR-2026-${Date.now().toString().slice(-5)}`;

    const mrbRecord = {
      id: ncrNumber,
      tenantId: parsed.tenantId,
      lotNumber: parsed.lotNumber,
      productCode: parsed.productCode,
      defectDescription: parsed.defectDescription,
      defectCategory: parsed.defectCategory,
      quarantinedQuantityKg: parsed.quarantinedQuantityKg,
      proposedDisposition: parsed.proposedDisposition,
      regrindBlendRatioPct: parsed.regrindBlendRatioPct,
      status: 'PENDING_QA_DIRECTOR_SIGN_OFF',
      initiatedByUserId: parsed.initiatedByUserId,
      createdAt: new Date().toISOString(),
    };

    this.mrbDispositions.set(ncrNumber, mrbRecord);

    // Route to Approval Engine
    const workflowResult = await this.workflowService.submitDocumentForApproval({
      tenantId: parsed.tenantId,
      documentRef: ncrNumber,
      domain: 'Quality',
      documentType: 'Material Review Board (MRB)',
      totalAmount: parsed.quarantinedQuantityKg * 140, // Estimated standard material cost ₹140/kg
      initiatorUserId: parsed.initiatedByUserId,
      payloadSnapshot: mrbRecord,
    });

    return {
      success: true,
      ncrNumber,
      status: 'PENDING_QA_DIRECTOR_SIGN_OFF',
      workflow: workflowResult,
      message: `MRB Quarantine NCR ${ncrNumber} logged and submitted for disposition sign-off.`,
    };
  }

  public async getMrbDispositions(tenantId: string = 'TENANT-ALPHA-IND') {
    return Array.from(this.mrbDispositions.values()).filter((mrb) => mrb.tenantId === tenantId);
  }

  private initSampleData() {
    this.boms.set('FG-BMP-NEXON-F_Rev-A', {
      id: 'BOM-2026-0041',
      productCode: 'FG-BMP-NEXON-F',
      productName: 'Tata Nexon Front Bumper Assembly',
      revision: 'Rev-A',
      moldCode: 'M-004-BUMPER',
      cavityCount: 1,
      targetCycleTimeSec: 46.0,
      items: [
        { partId: 'RESIN-PP-VIRGIN', partName: 'Virgin Polypropylene Copolymer', itemType: 'RAW_MATERIAL', quantityPerUnit: 3.45, uom: 'KG', scrapAllowancePct: 2.0 },
        { partId: 'MB-BLACK-AUTO', partName: 'Automotive Black Masterbatch (1% Addition)', itemType: 'MASTERBATCH', quantityPerUnit: 0.035, uom: 'KG', scrapAllowancePct: 0.5 },
        { partId: 'TALC-FILLER-15', partName: 'Micronized Talc Reinforcement', itemType: 'RAW_MATERIAL', quantityPerUnit: 0.52, uom: 'KG', scrapAllowancePct: 1.0 },
      ],
    });
  }
}
