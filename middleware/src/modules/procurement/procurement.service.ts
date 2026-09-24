import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ObservabilityLogger } from '../../common/observability/logger.service';
import { MetricsService } from '../../common/observability/metrics.service';
import { TracingService } from '../../common/observability/tracing.service';
import {
  CreateSupplierDto,
  CreateSupplierDtoSchema,
  UpdateSupplierDto,
  CreatePrDto,
  CreatePrDtoSchema,
  UpdatePrDto,
  CreateRfqDto,
  CreateRfqDtoSchema,
  SubmitBidDto,
  SubmitBidDtoSchema,
  CreatePoDto,
  CreatePoDtoSchema,
  UpdatePoDto,
  PoApprovalActionDto,
  CreateGrnDto,
  CreateGrnDtoSchema,
  InspectGrnDto,
  InspectGrnDtoSchema,
  CreateReturnDto,
  CreateReturnDtoSchema,
  CalculatePerformanceDto,
  CalculatePerformanceDtoSchema,
  CreateRiskAssessmentDto,
  CreateRiskAssessmentDtoSchema,
  CreateContractDto,
  CreateContractDtoSchema,
  CreateBlanketPoDto,
  CreateBlanketPoDtoSchema,
  CreatePriceListDto,
  CreatePriceListDtoSchema,
} from './procurement.dto';

@Injectable()
export class ProcurementService {
  private readonly fallbackLogger = new Logger(ProcurementService.name);

  // In-memory persistent stores with multi-tenancy support
  private supplierStore = new Map<string, any>();
  private prStore = new Map<string, any>();
  private rfqStore = new Map<string, any>();
  private rfqBidStore = new Map<string, any>();
  private poStore = new Map<string, any>();
  private poApprovalStore = new Map<string, any>();
  private grnStore = new Map<string, any>();
  private returnStore = new Map<string, any>();
  private performanceStore = new Map<string, any>();
  private riskStore = new Map<string, any>();
  private contractStore = new Map<string, any>();
  private priceListStore = new Map<string, any>();

  constructor(
    private readonly db: DatabaseService,
    private readonly obsLogger: ObservabilityLogger,
    private readonly metrics: MetricsService,
    private readonly tracing: TracingService,
  ) {
    this.seedDefaultProcurementData();
  }

  // ============================================================================
  // SCREEN 1: SUPPLIER DIRECTORY (VENDOR MASTER 360°)
  // ============================================================================

  public async getSuppliers(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.tracing.traceOperation('ProcurementService.getSuppliers', async () => {
      let suppliers = Array.from(this.supplierStore.values()).filter((s) => s.tenantId === tenantId);
      if (filters.status) suppliers = suppliers.filter((s) => s.status === filters.status);
      if (filters.category) suppliers = suppliers.filter((s) => s.category === filters.category);
      if (filters.supplierType) suppliers = suppliers.filter((s) => s.supplierType === filters.supplierType);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        suppliers = suppliers.filter((s) => s.supplierCode.toLowerCase().includes(q) || s.supplierName.toLowerCase().includes(q));
      }
      return suppliers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, { tenantId, filters: JSON.stringify(filters) });
  }

  public async getSupplier(id: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const supplier = this.supplierStore.get(id);
    if (!supplier || supplier.tenantId !== tenantId) {
      throw new NotFoundException(`Supplier not found: ${id}`);
    }
    return supplier;
  }

  public async createSupplier(dto: CreateSupplierDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    return this.tracing.traceOperation('ProcurementService.createSupplier', async () => {
      const parsed = CreateSupplierDtoSchema.parse(dto);
      const id = `SUP-${parsed.supplierCode.replace(/[^A-Za-z0-9]/g, '')}`;

      const record = {
        id,
        tenantId,
        ...parsed,
        rating: 4.5,
        totalOrders: 0,
        totalValue: 0,
        onTimeDeliveryPct: 98.0,
        qualityScore: 99.0,
        status: 'ACTIVE',
        complianceStatus: 'COMPLIANT',
        version: 'v1.0',
        createdById: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.supplierStore.set(id, record);
      this.obsLogger.logAudit({
        actorId: userId,
        action: 'CREATE',
        entity: 'Supplier',
        entityId: id,
        details: { supplierCode: record.supplierCode, supplierName: record.supplierName },
      });
      this.metrics.incrementBusinessEvent('supplier_created', 'Procurement');

      return record;
    }, { tenantId, userId });
  }

  public async updateSupplier(id: string, dto: UpdateSupplierDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const existing = await this.getSupplier(id, tenantId);
    const updated = {
      ...existing,
      ...dto,
      version: this.incrementVersion(existing.version),
      updatedById: userId,
      updatedAt: new Date().toISOString(),
    };
    this.supplierStore.set(id, updated);
    return updated;
  }

  public async approveSupplier(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const s = await this.getSupplier(id, tenantId);
    s.status = 'APPROVED';
    s.approvedById = userId;
    s.approvedAt = new Date().toISOString();
    this.supplierStore.set(id, s);
    return { success: true, message: `Supplier ${s.supplierName} approved`, supplier: s };
  }

  public async getSupplier360(id: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const supplier = await this.getSupplier(id, tenantId);
    const pos = Array.from(this.poStore.values()).filter((p) => p.tenantId === tenantId && p.supplierId === id);
    const grns = Array.from(this.grnStore.values()).filter((g) => g.tenantId === tenantId && g.supplierId === id);
    const performance = Array.from(this.performanceStore.values()).filter((p) => p.tenantId === tenantId && p.supplierId === id);
    const contracts = Array.from(this.contractStore.values()).filter((c) => c.tenantId === tenantId && c.supplierId === id);
    const priceLists = Array.from(this.priceListStore.values()).filter((pl) => pl.tenantId === tenantId && pl.supplierId === id);

    return {
      ...supplier,
      recentPurchaseOrders: pos.slice(0, 5),
      recentGoodsReceipts: grns.slice(0, 5),
      performanceHistory: performance,
      activeContracts: contracts.filter((c) => c.status === 'ACTIVE'),
      priceLists,
    };
  }

  // ============================================================================
  // SCREEN 2: PURCHASE REQUISITIONS (PR)
  // ============================================================================

  public async getPurchaseRequisitions(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    let prs = Array.from(this.prStore.values()).filter((p) => p.tenantId === tenantId);
    if (filters.status) prs = prs.filter((p) => p.status === filters.status);
    if (filters.priority) prs = prs.filter((p) => p.priority === filters.priority);
    return prs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async createPurchaseRequisition(dto: CreatePrDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreatePrDtoSchema.parse(dto);
    const id = parsed.prNumber || `PR-2026-${Date.now().toString().slice(-6)}`;
    
    let total = 0;
    const lines = parsed.lines.map((l, idx) => {
      const lineAmt = this.round(l.quantity * (l.estimatedPrice || 0));
      total += lineAmt;
      return { id: `PRL-${id}-${idx + 1}`, prId: id, lineNo: idx + 1, ...l, totalAmount: lineAmt };
    });

    const record = {
      id,
      tenantId,
      prNumber: id,
      ...parsed,
      totalAmount: this.round(total),
      status: 'DRAFT',
      lines,
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.prStore.set(id, record);
    return record;
  }

  public async updatePurchaseRequisition(id: string, dto: UpdatePrDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const pr = this.prStore.get(id);
    if (!pr || pr.tenantId !== tenantId) throw new NotFoundException(`PR not found: ${id}`);
    const updated = { ...pr, ...dto, updatedAt: new Date().toISOString() };
    this.prStore.set(id, updated);
    return updated;
  }

  public async approvePurchaseRequisition(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const pr = this.prStore.get(id);
    if (!pr || pr.tenantId !== tenantId) throw new NotFoundException(`PR not found: ${id}`);
    pr.status = 'APPROVED';
    pr.approvedById = userId;
    pr.approvedAt = new Date().toISOString();
    this.prStore.set(id, pr);
    return { success: true, message: `PR ${pr.prNumber} approved`, pr };
  }

  public async convertPrToPo(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const pr = this.prStore.get(id);
    if (!pr || pr.tenantId !== tenantId) throw new NotFoundException(`PR not found: ${id}`);
    if (pr.status !== 'APPROVED') throw new BadRequestException('PR must be approved before conversion to PO');

    const poLines = pr.lines.map((l: any, idx: number) => ({
      lineNo: idx + 1,
      itemId: l.itemId,
      itemCode: l.itemCode,
      itemName: l.itemName,
      description: l.description,
      quantity: l.quantity,
      uom: l.uom,
      unitPrice: l.estimatedPrice || 100,
      taxPct: 18,
    }));

    const po = await this.createPurchaseOrder({
      supplierId: 'SUP-VEND001',
      prId: id,
      priority: pr.priority,
      deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      lines: poLines,
    }, tenantId, userId);

    pr.status = 'CONVERTED_TO_PO';
    pr.convertedToPoId = po.id;
    pr.convertedAt = new Date().toISOString();
    this.prStore.set(id, pr);

    return { success: true, message: `PR ${pr.prNumber} converted to PO ${po.poNumber}`, po };
  }

  // ============================================================================
  // SCREEN 3: REQUESTS FOR QUOTATION (RFQ)
  // ============================================================================

  public async getRfqs(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.rfqStore.values()).filter((r) => r.tenantId === tenantId);
  }

  public async createRfq(dto: CreateRfqDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateRfqDtoSchema.parse(dto);
    const id = parsed.rfqNumber || `RFQ-2026-${Date.now().toString().slice(-6)}`;
    const lines = parsed.lines.map((l, idx) => ({ id: `RFQL-${id}-${idx + 1}`, rfqId: id, lineNo: idx + 1, ...l }));

    const record = {
      id,
      tenantId,
      rfqNumber: id,
      ...parsed,
      status: 'DRAFT',
      totalBids: 0,
      lines,
      invitedSuppliers: parsed.invitedSupplierIds || [],
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.rfqStore.set(id, record);
    return record;
  }

  public async publishRfq(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const rfq = this.rfqStore.get(id);
    if (!rfq || rfq.tenantId !== tenantId) throw new NotFoundException(`RFQ not found: ${id}`);
    rfq.status = 'PUBLISHED';
    rfq.updatedAt = new Date().toISOString();
    this.rfqStore.set(id, rfq);
    return { success: true, message: `RFQ ${rfq.rfqNumber} published to suppliers`, rfq };
  }

  public async inviteSuppliers(id: string, supplierIds: string[], tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const rfq = this.rfqStore.get(id);
    if (!rfq || rfq.tenantId !== tenantId) throw new NotFoundException(`RFQ not found: ${id}`);
    rfq.invitedSuppliers = Array.from(new Set([...(rfq.invitedSuppliers || []), ...supplierIds]));
    this.rfqStore.set(id, rfq);
    return { success: true, message: `Invited ${supplierIds.length} suppliers to RFQ ${rfq.rfqNumber}`, rfq };
  }

  // ============================================================================
  // SCREEN 4: RFQ BID COMPARISON MATRIX & AWARD
  // ============================================================================

  public async submitBid(dto: SubmitBidDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = SubmitBidDtoSchema.parse(dto);
    const id = `BID-${parsed.rfqId}-${parsed.supplierId}`;
    const supplier = await this.getSupplier(parsed.supplierId, tenantId);

    let totalAmount = 0;
    const lines = parsed.lines.map((l, idx) => {
      const lineAmt = this.round(l.quantity * l.unitPrice);
      totalAmount += lineAmt;
      return { id: `BIDL-${id}-${idx + 1}`, bidId: id, ...l, totalAmount: lineAmt };
    });

    const bid = {
      id,
      tenantId,
      rfqId: parsed.rfqId,
      supplierId: parsed.supplierId,
      supplierName: supplier.supplierName,
      totalAmount: this.round(totalAmount),
      validityDays: parsed.validityDays,
      deliveryDays: parsed.deliveryDays,
      paymentTerms: parsed.paymentTerms,
      notes: parsed.notes,
      isAwarded: false,
      status: 'SUBMITTED',
      lines,
      createdAt: new Date().toISOString(),
    };

    this.rfqBidStore.set(id, bid);

    // Update RFQ bid count
    const rfq = this.rfqStore.get(parsed.rfqId);
    if (rfq) {
      rfq.totalBids = Array.from(this.rfqBidStore.values()).filter((b) => b.rfqId === parsed.rfqId).length;
      rfq.status = 'BIDS_RECEIVED';
      this.rfqStore.set(parsed.rfqId, rfq);
    }

    return bid;
  }

  public async getBidComparisonMatrix(rfqId: string, tenantId: string = 'TENANT-ALPHA-IND') {
    return this.tracing.traceOperation('ProcurementService.getBidComparisonMatrix', async () => {
      const rfq = this.rfqStore.get(rfqId);
      if (!rfq || rfq.tenantId !== tenantId) throw new NotFoundException(`RFQ not found: ${rfqId}`);

      const bids = Array.from(this.rfqBidStore.values()).filter((b) => b.rfqId === rfqId && b.tenantId === tenantId);

      // Line comparison with lowest price identification
      const lineComparison = rfq.lines.map((rfqLine: any) => {
        const bidOptions = bids.map((bid) => {
          const matchedLine = bid.lines.find((bl: any) => bl.itemId === rfqLine.itemId || bl.itemCode === rfqLine.itemCode);
          return {
            supplierId: bid.supplierId,
            supplierName: bid.supplierName,
            unitPrice: matchedLine?.unitPrice || 0,
            totalAmount: matchedLine?.totalAmount || 0,
            deliveryDays: matchedLine?.deliveryDays || bid.deliveryDays,
          };
        }).filter((b) => b.unitPrice > 0);

        const lowestPrice = bidOptions.length > 0 ? Math.min(...bidOptions.map((o) => o.unitPrice)) : 0;
        const recommendedSupplier = bidOptions.find((o) => o.unitPrice === lowestPrice)?.supplierId;

        return {
          rfqLineId: rfqLine.id,
          itemCode: rfqLine.itemCode,
          itemName: rfqLine.itemName,
          quantity: rfqLine.quantity,
          uom: rfqLine.uom,
          bids: bidOptions,
          lowestPrice,
          recommendedSupplier,
        };
      });

      const totalBidAmounts = bids.map((b) => b.totalAmount);
      const lowestBid = totalBidAmounts.length > 0 ? Math.min(...totalBidAmounts) : 0;
      const highestBid = totalBidAmounts.length > 0 ? Math.max(...totalBidAmounts) : 0;
      const averageBid = totalBidAmounts.length > 0 ? this.round(totalBidAmounts.reduce((s, a) => s + a, 0) / totalBidAmounts.length) : 0;

      return {
        rfq: {
          number: rfq.rfqNumber,
          title: rfq.title,
          deadline: rfq.quotationDeadline,
          totalBids: bids.length,
        },
        suppliers: bids.map((b) => ({
          supplierId: b.supplierId,
          supplierName: b.supplierName,
          totalAmount: b.totalAmount,
          deliveryDays: b.deliveryDays,
          paymentTerms: b.paymentTerms,
          status: b.status,
          isAwarded: b.isAwarded,
        })),
        lineComparison,
        summary: {
          lowestBid,
          highestBid,
          averageBid,
        },
      };
    }, { rfqId, tenantId });
  }

  public async awardBid(rfqId: string, bidId: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    return this.tracing.traceOperation('ProcurementService.awardBid', async () => {
      const bid = this.rfqBidStore.get(bidId);
      if (!bid || bid.tenantId !== tenantId) throw new NotFoundException(`Bid not found: ${bidId}`);

      const rfq = this.rfqStore.get(rfqId);
      if (!rfq || rfq.tenantId !== tenantId) throw new NotFoundException(`RFQ not found: ${rfqId}`);

      // Mark winning bid
      bid.isAwarded = true;
      bid.status = 'ACCEPTED';
      this.rfqBidStore.set(bidId, bid);

      // Reject all other bids for this RFQ
      Array.from(this.rfqBidStore.values())
        .filter((b) => b.rfqId === rfqId && b.id !== bidId)
        .forEach((other) => {
          other.status = 'REJECTED';
          this.rfqBidStore.set(other.id, other);
        });

      rfq.status = 'AWARDED';
      rfq.awardedToId = bid.supplierId;
      rfq.awardedAt = new Date().toISOString();
      this.rfqStore.set(rfqId, rfq);

      this.metrics.incrementBusinessEvent('rfq_bid_awarded', 'Procurement');
      this.obsLogger.logAudit({
        actorId: userId,
        action: 'RFQ_BID_AWARDED',
        entity: 'RfqBid',
        entityId: bidId,
        details: { rfqId, supplierId: bid.supplierId, totalAmount: bid.totalAmount },
      });

      return { success: true, message: `RFQ ${rfq.rfqNumber} awarded to ${bid.supplierName}`, bid };
    }, { rfqId, bidId, tenantId, userId });
  }

  public async convertRfqToPo(rfqId: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const rfq = this.rfqStore.get(rfqId);
    if (!rfq || rfq.tenantId !== tenantId) throw new NotFoundException(`RFQ not found: ${rfqId}`);
    if (rfq.status !== 'AWARDED' || !rfq.awardedToId) {
      throw new BadRequestException('RFQ must be awarded to a supplier before converting to PO');
    }

    const winningBid = Array.from(this.rfqBidStore.values()).find((b) => b.rfqId === rfqId && b.isAwarded);
    if (!winningBid) throw new NotFoundException('Winning bid record not found');

    const poLines = winningBid.lines.map((l: any, idx: number) => ({
      lineNo: idx + 1,
      itemId: l.itemId,
      itemCode: l.itemCode,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxPct: 18,
    }));

    const po = await this.createPurchaseOrder({
      supplierId: winningBid.supplierId,
      rfqId,
      deliveryDate: new Date(Date.now() + (winningBid.deliveryDays || 10) * 86400000).toISOString().split('T')[0],
      paymentTerms: winningBid.paymentTerms || 'Net 30',
      lines: poLines,
    }, tenantId, userId);

    rfq.status = 'CONVERTED_TO_PO';
    rfq.convertedToPoId = po.id;
    this.rfqStore.set(rfqId, rfq);

    return { success: true, message: `RFQ ${rfq.rfqNumber} converted to PO ${po.poNumber}`, po };
  }

  // ============================================================================
  // SCREEN 5: PURCHASE ORDERS (PO)
  // ============================================================================

  public async getPurchaseOrders(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    let pos = Array.from(this.poStore.values()).filter((p) => p.tenantId === tenantId);
    if (filters.status) pos = pos.filter((p) => p.status === filters.status);
    if (filters.supplierId) pos = pos.filter((p) => p.supplierId === filters.supplierId);
    return pos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getPurchaseOrder(id: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const po = this.poStore.get(id);
    if (!po || po.tenantId !== tenantId) throw new NotFoundException(`PO not found: ${id}`);
    return po;
  }

  public async createPurchaseOrder(dto: CreatePoDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    return this.tracing.traceOperation('ProcurementService.createPurchaseOrder', async () => {
      const parsed = CreatePoDtoSchema.parse(dto);
      const id = parsed.poNumber || `PO-2026-${Date.now().toString().slice(-6)}`;
      const supplier = await this.getSupplier(parsed.supplierId, tenantId);

      let subtotal = 0;
      let tax = 0;
      const lines = parsed.lines.map((l, idx) => {
        const lineSubtotal = this.round(l.quantity * l.unitPrice);
        const lineTax = this.round((lineSubtotal * (l.taxPct || 18)) / 100);
        const lineTotal = lineSubtotal + lineTax;
        subtotal += lineSubtotal;
        tax += lineTax;
        return {
          id: `POL-${id}-${idx + 1}`,
          poId: id,
          lineNo: idx + 1,
          ...l,
          taxAmount: lineTax,
          totalAmount: lineTotal,
          receivedQty: 0,
          pendingQty: l.quantity,
          rejectedQty: 0,
        };
      });

      const grandTotal = this.round(subtotal + tax);

      const record = {
        id,
        tenantId,
        poNumber: id,
        ...parsed,
        supplierName: supplier.supplierName,
        subtotal: this.round(subtotal),
        totalAmount: this.round(subtotal),
        taxAmount: this.round(tax),
        grandTotal,
        status: 'DRAFT',
        lines,
        version: 'v1.0',
        createdById: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.poStore.set(id, record);

      this.metrics.incrementBusinessEvent('po_created', 'Procurement');
      this.obsLogger.logAudit({
        actorId: userId,
        action: 'CREATE',
        entity: 'PurchaseOrder',
        entityId: id,
        details: { poNumber: record.poNumber, supplierName: record.supplierName, grandTotal },
      });

      return record;
    }, { tenantId, userId });
  }

  public async updatePurchaseOrder(id: string, dto: UpdatePoDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const existing = await this.getPurchaseOrder(id, tenantId);
    if (existing.status !== 'DRAFT' && existing.status !== 'ON_HOLD') {
      throw new BadRequestException('Only DRAFT or ON_HOLD POs can be modified');
    }
    const updated = {
      ...existing,
      ...dto,
      version: this.incrementVersion(existing.version),
      updatedById: userId,
      updatedAt: new Date().toISOString(),
    };
    this.poStore.set(id, updated);
    return updated;
  }

  public async submitPoForApproval(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    return this.tracing.traceOperation('ProcurementService.submitPoForApproval', async () => {
      const po = await this.getPurchaseOrder(id, tenantId);
      if (po.status !== 'DRAFT') throw new BadRequestException('Only DRAFT POs can be submitted for approval');

      // Determine approval tiers based on threshold
      const amount = po.grandTotal;
      const stages: any[] = [];

      if (amount <= 50000) {
        stages.push({ stageNumber: 1, approverRole: 'DEPARTMENT_MANAGER', approverId: 'USR-DEPT-MGR', status: 'PENDING' });
      } else if (amount <= 200000) {
        stages.push({ stageNumber: 1, approverRole: 'DEPARTMENT_MANAGER', approverId: 'USR-DEPT-MGR', status: 'PENDING' });
        stages.push({ stageNumber: 2, approverRole: 'PROCUREMENT_MANAGER', approverId: 'USR-PROC-MGR', status: 'PENDING' });
      } else if (amount <= 1000000) {
        stages.push({ stageNumber: 1, approverRole: 'DEPARTMENT_MANAGER', approverId: 'USR-DEPT-MGR', status: 'PENDING' });
        stages.push({ stageNumber: 2, approverRole: 'PROCUREMENT_MANAGER', approverId: 'USR-PROC-MGR', status: 'PENDING' });
        stages.push({ stageNumber: 3, approverRole: 'FINANCE_HEAD', approverId: 'USR-FIN-HEAD', status: 'PENDING' });
      } else {
        stages.push({ stageNumber: 1, approverRole: 'DEPARTMENT_MANAGER', approverId: 'USR-DEPT-MGR', status: 'PENDING' });
        stages.push({ stageNumber: 2, approverRole: 'PROCUREMENT_MANAGER', approverId: 'USR-PROC-MGR', status: 'PENDING' });
        stages.push({ stageNumber: 3, approverRole: 'FINANCE_HEAD', approverId: 'USR-FIN-HEAD', status: 'PENDING' });
        stages.push({ stageNumber: 4, approverRole: 'CEO', approverId: 'USR-CEO-01', status: 'PENDING' });
      }

      stages.forEach((s) => {
        const approvalId = `APPR-${id}-${s.stageNumber}`;
        this.poApprovalStore.set(approvalId, { id: approvalId, tenantId, poId: id, ...s, createdAt: new Date().toISOString() });
      });

      po.status = 'PENDING_APPROVAL';
      po.updatedAt = new Date().toISOString();
      this.poStore.set(id, po);

      this.metrics.incrementBusinessEvent('po_submitted_for_approval', 'Procurement');
      return { success: true, message: `PO ${po.poNumber} submitted with ${stages.length} approval stages`, approvalStages: stages };
    }, { poId: id, tenantId, userId });
  }

  public async sendPoToSupplier(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const po = await this.getPurchaseOrder(id, tenantId);
    if (po.status !== 'APPROVED') throw new BadRequestException('PO must be approved before sending to supplier');
    po.status = 'SENT_TO_SUPPLIER';
    po.updatedAt = new Date().toISOString();
    this.poStore.set(id, po);
    return { success: true, message: `PO ${po.poNumber} dispatched to supplier`, po };
  }

  public async getPoHistory(id: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const po = await this.getPurchaseOrder(id, tenantId);
    const approvals = Array.from(this.poApprovalStore.values()).filter((a) => a.poId === id);
    const grns = Array.from(this.grnStore.values()).filter((g) => g.poId === id);
    return { po, approvals, grns };
  }

  // ============================================================================
  // SCREEN 6: MULTI-TIER PO APPROVALS
  // ============================================================================

  public async getPendingApprovals(tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    return Array.from(this.poApprovalStore.values()).filter((a) => a.tenantId === tenantId && a.status === 'PENDING');
  }

  public async approvePo(id: string, stageNumber: number, tenantId: string = 'TENANT-ALPHA-IND', approverId: string = 'USR-ADMIN-01', comments?: string) {
    return this.tracing.traceOperation('ProcurementService.approvePo', async () => {
      const approvalId = `APPR-${id}-${stageNumber}`;
      const approval = this.poApprovalStore.get(approvalId);
      if (!approval) throw new NotFoundException(`Approval stage ${stageNumber} not found for PO ${id}`);

      approval.status = 'APPROVED';
      approval.comments = comments;
      approval.actedAt = new Date().toISOString();
      this.poApprovalStore.set(approvalId, approval);

      // Check if all stages for this PO are approved
      const allStages = Array.from(this.poApprovalStore.values()).filter((a) => a.poId === id);
      const allApproved = allStages.every((s) => s.status === 'APPROVED');

      const po = this.poStore.get(id);
      if (po && allApproved) {
        po.status = 'APPROVED';
        po.approvedAt = new Date().toISOString();
        po.approvedById = approverId;
        this.poStore.set(id, po);
      }

      this.metrics.incrementBusinessEvent('po_approved', 'Procurement');
      this.obsLogger.logAudit({
        actorId: approverId,
        action: 'PO_APPROVED',
        entity: 'PurchaseOrder',
        entityId: id,
        details: { stageNumber, allApproved, comments },
      });

      return { success: true, message: `PO stage ${stageNumber} approved`, allApproved, po };
    }, { poId: id, stageNumber, tenantId, approverId });
  }

  public async rejectPo(id: string, stageNumber: number, tenantId: string = 'TENANT-ALPHA-IND', approverId: string = 'USR-ADMIN-01', reason: string = 'Price variance / budget exceeded') {
    const approvalId = `APPR-${id}-${stageNumber}`;
    const approval = this.poApprovalStore.get(approvalId);
    if (!approval) throw new NotFoundException(`Approval stage not found`);

    approval.status = 'REJECTED';
    approval.reason = reason;
    approval.actedAt = new Date().toISOString();
    this.poApprovalStore.set(approvalId, approval);

    const po = this.poStore.get(id);
    if (po) {
      po.status = 'CANCELLED';
      this.poStore.set(id, po);
    }

    return { success: true, message: `PO rejected at stage ${stageNumber}`, po };
  }

  public async delegateApproval(id: string, stageNumber: number, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01', delegateToId: string = 'USR-DELEGATE-01') {
    const approvalId = `APPR-${id}-${stageNumber}`;
    const approval = this.poApprovalStore.get(approvalId);
    if (!approval) throw new NotFoundException(`Approval stage not found`);

    approval.status = 'DELEGATED';
    approval.delegationToId = delegateToId;
    this.poApprovalStore.set(approvalId, approval);

    return { success: true, message: `Approval delegated to ${delegateToId}`, approval };
  }

  // ============================================================================
  // SCREEN 7: GOODS RECEIPTS (GRN) & QA INSPECTION
  // ============================================================================

  public async getGoodsReceipts(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.grnStore.values()).filter((g) => g.tenantId === tenantId);
  }

  public async createGoodsReceipt(dto: CreateGrnDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    return this.tracing.traceOperation('ProcurementService.createGoodsReceipt', async () => {
      const parsed = CreateGrnDtoSchema.parse(dto);
      const id = parsed.grnNumber || `GRN-2026-${Date.now().toString().slice(-6)}`;
      const po = await this.getPurchaseOrder(parsed.poId, tenantId);

      let totalQty = 0;
      const lines = parsed.lines.map((l, idx) => {
        totalQty += l.receivedQty;
        return {
          id: `GRNL-${id}-${idx + 1}`,
          grnId: id,
          lineNo: idx + 1,
          ...l,
          acceptedQty: l.acceptedQty !== undefined ? l.acceptedQty : l.receivedQty,
          rejectedQty: l.rejectedQty || 0,
        };
      });

      const record = {
        id,
        tenantId,
        grnNumber: id,
        ...parsed,
        poNumber: po.poNumber,
        totalQty,
        acceptedQty: totalQty,
        rejectedQty: 0,
        status: 'PENDING_INSPECTION',
        inspectionStatus: 'PENDING',
        lines,
        version: 'v1.0',
        createdById: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.grnStore.set(id, record);
      return record;
    }, { tenantId, userId });
  }

  public async inspectGoodsReceipt(id: string, dto: InspectGrnDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = InspectGrnDtoSchema.parse(dto);
    const grn = this.grnStore.get(id);
    if (!grn || grn.tenantId !== tenantId) throw new NotFoundException(`GRN not found: ${id}`);

    let totalAccepted = 0;
    let totalRejected = 0;

    parsed.inspectedLines.forEach((insp) => {
      const line = grn.lines.find((l: any) => l.lineNo === insp.lineNo);
      if (line) {
        line.acceptedQty = insp.acceptedQty;
        line.rejectedQty = insp.rejectedQty;
        line.rejectionReason = insp.rejectionReason;
        totalAccepted += insp.acceptedQty;
        totalRejected += insp.rejectedQty;
      }
    });

    grn.acceptedQty = totalAccepted;
    grn.rejectedQty = totalRejected;
    grn.inspectionStatus = parsed.inspectionStatus;
    grn.status = parsed.inspectionStatus === 'PASSED' ? 'ACCEPTED' : (parsed.inspectionStatus === 'FAILED' ? 'REJECTED' : 'PARTIALLY_ACCEPTED');
    grn.inspectedById = userId;
    grn.inspectedAt = new Date().toISOString();
    grn.updatedAt = new Date().toISOString();
    this.grnStore.set(id, grn);

    // Auto-create purchase return for rejected items
    if (totalRejected > 0) {
      const returnLines = grn.lines.filter((l: any) => l.rejectedQty > 0).map((l: any) => ({
        grnLineId: l.id,
        itemId: l.itemId,
        itemCode: l.itemCode,
        quantity: l.rejectedQty,
        unitPrice: 100,
        reason: l.rejectionReason || 'Quality inspection failed',
      }));

      await this.createPurchaseReturn({
        poId: grn.poId,
        grnId: id,
        supplierId: grn.supplierId,
        returnReason: 'QUALITY_ISSUE',
        lines: returnLines,
      }, tenantId, userId);
    }

    return { success: true, message: `GRN ${grn.grnNumber} inspection completed`, grn };
  }

  public async postGrnToInventory(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const grn = this.grnStore.get(id);
    if (!grn || grn.tenantId !== tenantId) throw new NotFoundException(`GRN not found: ${id}`);
    if (grn.status !== 'ACCEPTED' && grn.status !== 'PARTIALLY_ACCEPTED') {
      throw new BadRequestException('GRN must pass inspection before inventory posting');
    }
    grn.status = 'POSTED_TO_INVENTORY';
    grn.updatedAt = new Date().toISOString();
    this.grnStore.set(id, grn);

    return { success: true, message: `GRN ${grn.grnNumber} accepted quantities posted to stock inventory`, grn };
  }

  // ============================================================================
  // SCREEN 8: VENDOR DEBIT NOTES & RETURNS
  // ============================================================================

  public async getPurchaseReturns(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.returnStore.values()).filter((r) => r.tenantId === tenantId);
  }

  public async createPurchaseReturn(dto: CreateReturnDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateReturnDtoSchema.parse(dto);
    const id = parsed.returnNumber || `RET-2026-${Date.now().toString().slice(-6)}`;

    let totalAmount = 0;
    const lines = parsed.lines.map((l, idx) => {
      const lineAmt = this.round(l.quantity * l.unitPrice);
      totalAmount += lineAmt;
      return { id: `RETL-${id}-${idx + 1}`, returnId: id, ...l, totalAmount: lineAmt };
    });

    const record = {
      id,
      tenantId,
      returnNumber: id,
      ...parsed,
      totalAmount: this.round(totalAmount),
      status: 'PENDING',
      refundStatus: 'PENDING',
      lines,
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.returnStore.set(id, record);
    return record;
  }

  public async approvePurchaseReturn(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const ret = this.returnStore.get(id);
    if (!ret || ret.tenantId !== tenantId) throw new NotFoundException(`Return not found: ${id}`);
    ret.status = 'APPROVED';
    ret.updatedAt = new Date().toISOString();
    this.returnStore.set(id, ret);
    return { success: true, message: `Return ${ret.returnNumber} approved`, return: ret };
  }

  public async generateDebitNote(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const ret = this.returnStore.get(id);
    if (!ret || ret.tenantId !== tenantId) throw new NotFoundException(`Return not found: ${id}`);
    ret.debitNoteNumber = `DN-2026-${Date.now().toString().slice(-6)}`;
    ret.debitNoteDate = new Date().toISOString();
    ret.refundStatus = 'CREDITED';
    this.returnStore.set(id, ret);
    return { success: true, message: `Debit note ${ret.debitNoteNumber} generated for ₹${ret.totalAmount}`, return: ret };
  }

  // ============================================================================
  // SCREEN 9: SUPPLIER PERFORMANCE SCORECARDS
  // ============================================================================

  public async getSupplierPerformance(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.performanceStore.values()).filter((p) => p.tenantId === tenantId);
  }

  public async calculateSupplierPerformance(dto: CalculatePerformanceDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CalculatePerformanceDtoSchema.parse(dto);
    const id = `PERF-${parsed.supplierId}-${parsed.period}`;

    // Compute standard weighted score: 40% OTD + 35% Quality + 15% Responsiveness + 10% Compliance
    const onTimeDelivery = 98.2;
    const qualityScore = 99.4;
    const responsiveness = 95.0;
    const complianceScore = 100.0;

    const overallScore = this.round(0.4 * onTimeDelivery + 0.35 * qualityScore + 0.15 * responsiveness + 0.1 * complianceScore);
    const rating = this.round((overallScore / 100) * 5);

    const record = {
      id,
      tenantId,
      supplierId: parsed.supplierId,
      period: parsed.period,
      year: parsed.year,
      month: parsed.month,
      quarter: parsed.quarter,
      onTimeDelivery,
      qualityScore,
      responsiveness,
      complianceScore,
      overallScore,
      rating,
      rank: 1,
      totalOrders: 28,
      totalValue: 4200000,
      totalRejections: 1,
      totalReturns: 1,
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
    };

    this.performanceStore.set(id, record);
    return record;
  }

  public async getSupplierScorecard(supplierId: string, tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const supplier = await this.getSupplier(supplierId, tenantId);
    const performance = Array.from(this.performanceStore.values()).find((p) => p.supplierId === supplierId && p.tenantId === tenantId);

    return {
      supplierId,
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      category: supplier.category,
      overallRating: performance?.rating || 4.8,
      overallScore: performance?.overallScore || 98.1,
      kpis: {
        onTimeDeliveryPct: performance?.onTimeDelivery || 98.2,
        qualityAcceptancePct: performance?.qualityScore || 99.4,
        responsivenessPct: performance?.responsiveness || 95.0,
        complianceScorePct: performance?.complianceScore || 100.0,
      },
      auditCompliance: supplier.complianceStatus,
    };
  }

  // ============================================================================
  // SCREEN 10: SUPPLIER RISK & COMPLIANCE
  // ============================================================================

  public async getRiskAssessments(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.riskStore.values()).filter((r) => r.tenantId === tenantId);
  }

  public async createRiskAssessment(dto: CreateRiskAssessmentDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateRiskAssessmentDtoSchema.parse(dto);
    const id = `RISK-${parsed.supplierId}-${Date.now().toString().slice(-6)}`;
    const avgScore = this.round((parsed.financialRisk + parsed.operationalRisk + parsed.complianceRisk + parsed.qualityRisk + parsed.deliveryRisk) / 5);

    const record = {
      id,
      tenantId,
      ...parsed,
      riskScore: avgScore,
      status: 'COMPLETED',
      assessedById: userId,
      version: 'v1.0',
      createdAt: new Date().toISOString(),
    };

    this.riskStore.set(id, record);
    return record;
  }

  public async getSupplierRiskHistory(supplierId: string, tenantId: string = 'TENANT-ALPHA-IND') {
    return Array.from(this.riskStore.values()).filter((r) => r.supplierId === supplierId && r.tenantId === tenantId);
  }

  // ============================================================================
  // SCREEN 11: SUPPLIER CONTRACTS & BLANKET POS
  // ============================================================================

  public async getSupplierContracts(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.contractStore.values()).filter((c) => c.tenantId === tenantId);
  }

  public async createSupplierContract(dto: CreateContractDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateContractDtoSchema.parse(dto);
    const id = parsed.contractNumber || `CONTRACT-2026-${Date.now().toString().slice(-6)}`;
    const record = {
      id,
      tenantId,
      contractNumber: id,
      ...parsed,
      status: 'DRAFT',
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.contractStore.set(id, record);
    return record;
  }

  public async approveContract(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const c = this.contractStore.get(id);
    if (!c || c.tenantId !== tenantId) throw new NotFoundException(`Contract not found: ${id}`);
    c.status = 'ACTIVE';
    c.approvedById = userId;
    c.approvedAt = new Date().toISOString();
    this.contractStore.set(id, c);
    return { success: true, message: `Contract ${c.contractNumber} activated`, contract: c };
  }

  public async createBlanketPo(contractId: string, dto: CreateBlanketPoDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateBlanketPoDtoSchema.parse(dto);
    const contract = this.contractStore.get(contractId);
    if (!contract || contract.tenantId !== tenantId) throw new NotFoundException(`Contract not found: ${contractId}`);

    const po = await this.createPurchaseOrder({
      supplierId: contract.supplierId,
      contractId,
      deliveryDate: parsed.deliveryDate,
      deliveryAddress: parsed.deliveryAddress,
      lines: [
        { itemId: parsed.itemId, quantity: parsed.releaseQuantity, unitPrice: 120, taxPct: 18 }
      ],
    }, tenantId, userId);

    return { success: true, message: `Blanket PO release created under contract ${contract.contractNumber}`, po };
  }

  // ============================================================================
  // SCREEN 12: SUPPLIER PRICE LISTS
  // ============================================================================

  public async getSupplierPriceLists(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.priceListStore.values()).filter((p) => p.tenantId === tenantId);
  }

  public async createSupplierPriceList(dto: CreatePriceListDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreatePriceListDtoSchema.parse(dto);
    const id = parsed.priceListCode || `SPL-2026-${Date.now().toString().slice(-6)}`;
    const record = {
      id,
      tenantId,
      priceListCode: id,
      ...parsed,
      status: 'DRAFT',
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.priceListStore.set(id, record);
    return record;
  }

  public async approvePriceList(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const pl = this.priceListStore.get(id);
    if (!pl || pl.tenantId !== tenantId) throw new NotFoundException(`Price list not found: ${id}`);
    pl.status = 'ACTIVE';
    pl.approvedById = userId;
    pl.approvedAt = new Date().toISOString();
    this.priceListStore.set(id, pl);
    return { success: true, message: `Price list ${pl.priceListCode} approved and active`, priceList: pl };
  }

  public async getActivePriceList(supplierId: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const active = Array.from(this.priceListStore.values()).find((p) => p.supplierId === supplierId && p.tenantId === tenantId && p.status === 'ACTIVE');
    return active || {
      priceListCode: 'SPL-DEFAULT',
      supplierId,
      items: [
        { itemCode: 'PP-HOMO-01', itemName: 'PP Homopolymer', unitPrice: 135.0, minQty: 1000, discountPct: 2 },
        { itemCode: 'MB-BLK-02', itemName: 'Black Masterbatch', unitPrice: 220.0, minQty: 100, discountPct: 5 },
      ],
    };
  }

  // ============================================================================
  // HELPERS & SEED DATA
  // ============================================================================

  private round(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  private incrementVersion(version: string = 'v1.0'): string {
    const match = version.match(/v(\d+)\.(\d+)/);
    if (!match) return 'v1.1';
    return `v${match[1]}.${parseInt(match[2]) + 1}`;
  }

  private seedDefaultProcurementData() {
    const tenantId = 'TENANT-ALPHA-IND';
    const userId = 'USR-ADMIN-01';

    // Seed Suppliers
    const defaultSuppliers = [
      {
        id: 'SUP-VEND001',
        supplierCode: 'SUP-2026-001',
        supplierName: 'Reliance Polymers Limited',
        category: 'Raw Materials',
        supplierType: 'MANUFACTURER',
        gstin: '24AAACR5055K1ZX',
        pan: 'AAACR5055K',
        contactEmail: 'orders@reliancepolymers.com',
        contactPhone: '+91 22 4477 0000',
        city: 'Mumbai',
        state: 'Maharashtra',
        isoCertified: true,
        msmeRegistered: false,
        status: 'ACTIVE',
      },
      {
        id: 'SUP-VEND002',
        supplierCode: 'SUP-2026-002',
        supplierName: 'Hubergroup Masterbatch India',
        category: 'Additives & Colors',
        supplierType: 'MANUFACTURER',
        gstin: '27AABCH1234F1Z5',
        pan: 'AABCH1234F',
        contactEmail: 'sales@hubergroup.in',
        contactPhone: '+91 20 6688 1122',
        city: 'Pune',
        state: 'Maharashtra',
        isoCertified: true,
        msmeRegistered: true,
        status: 'ACTIVE',
      },
    ];

    defaultSuppliers.forEach((s) => {
      this.supplierStore.set(s.id, {
        tenantId,
        ...s,
        rating: 4.8,
        totalOrders: 42,
        totalValue: 8400000,
        onTimeDeliveryPct: 98.4,
        qualityScore: 99.2,
        complianceStatus: 'COMPLIANT',
        version: 'v1.0',
        createdById: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Seed Purchase Order
    this.poStore.set('PO-2026-001', {
      id: 'PO-2026-001',
      tenantId,
      poNumber: 'PO-2026-001',
      poDate: '2026-09-18',
      supplierId: 'SUP-VEND001',
      supplierName: 'Reliance Polymers Limited',
      status: 'APPROVED',
      priority: 'HIGH',
      subtotal: 145000,
      taxAmount: 26100,
      grandTotal: 171100,
      paymentTerms: 'Net 30',
      deliveryTerms: 'Ex-Works',
      deliveryDate: '2026-10-02',
      lines: [
        { id: 'POL-01', lineNo: 1, itemId: 'ITM-PP-HOMO', itemCode: 'PP-H030', itemName: 'PP Homopolymer Granules', quantity: 1000, unitPrice: 145, taxPct: 18, taxAmount: 26100, totalAmount: 171100, receivedQty: 0, pendingQty: 1000, uom: 'KG' }
      ],
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
