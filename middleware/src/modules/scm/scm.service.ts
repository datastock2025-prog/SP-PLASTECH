import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ApprovalWorkflowService } from '../approval-workflow/approval-workflow.service';
import {
  CreatePurchaseRequisitionDto,
  CreatePurchaseRequisitionDtoSchema,
  CreatePurchaseOrderDto,
  CreatePurchaseOrderDtoSchema,
  CreateGoodsReceiptNoteDto,
  CreateGoodsReceiptNoteDtoSchema,
  ThreeWayMatchEvaluationDto,
  ThreeWayMatchEvaluationDtoSchema,
  InventoryStockMovementDto,
  InventoryStockMovementDtoSchema,
  AtomicStockReservationDto,
  AtomicStockReservationDtoSchema,
} from './scm.dto';

@Injectable()
export class ScmService {
  private readonly logger = new Logger(ScmService.name);

  // In-memory runtime cache for SCM aggregates
  private requisitions = new Map<string, any>();
  private purchaseOrders = new Map<string, any>();
  private goodsReceiptNotes = new Map<string, any>();
  private inventoryLedger: any[] = [];
  private stockBalances = new Map<string, { totalStock: number; reservedStock: number; uom: string; lotBatches: any[] }>();

  constructor(
    private readonly db: DatabaseService,
    private readonly workflowService: ApprovalWorkflowService
  ) {
    this.initSampleStock();
  }

  // ============================================================================
  // 1. PURCHASE REQUISITIONS (PR)
  // ============================================================================
  public async createPurchaseRequisition(dto: CreatePurchaseRequisitionDto) {
    const parsed = CreatePurchaseRequisitionDtoSchema.parse(dto);
    const prNumber = parsed.requisitionNumber || `PR-2026-${Date.now().toString().slice(-5)}`;

    const subtotal = parsed.items.reduce((sum, itm) => sum + itm.quantity * itm.unitPrice, 0);
    const taxTotal = parsed.items.reduce((sum, itm) => sum + itm.quantity * itm.unitPrice * (itm.taxRatePct / 100), 0);
    const grandTotal = subtotal + taxTotal;

    const prRecord = {
      id: prNumber,
      tenantId: parsed.tenantId,
      department: parsed.department,
      initiatorUserId: parsed.initiatorUserId,
      initiatorName: parsed.initiatorName,
      requiredDate: parsed.requiredDate,
      priority: parsed.priority,
      subtotal,
      taxTotal,
      grandTotal,
      items: parsed.items,
      justification: parsed.justification,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
    };

    this.requisitions.set(prNumber, prRecord);

    // Trigger universal approval workflow if exceeding PR threshold (e.g. ₹50,000)
    let workflowInstance = null;
    try {
      workflowInstance = await this.workflowService.submitDocumentForApproval({
        tenantId: parsed.tenantId,
        documentRef: prNumber,
        domain: 'Procurement',
        documentType: 'Purchase Requisition (PR)',
        totalAmount: grandTotal,
        initiatorUserId: parsed.initiatorUserId,
        payloadSnapshot: prRecord,
      });
    } catch (err: any) {
      this.logger.warn(`Approval workflow dispatch note for ${prNumber}: ${err.message}`);
    }

    return {
      success: true,
      prNumber,
      grandTotal,
      status: 'PENDING_APPROVAL',
      workflowInstance,
      message: `Purchase Requisition ${prNumber} created and dispatched to approval matrix.`,
    };
  }

  public async getPurchaseRequisitions(tenantId: string = 'TENANT-ALPHA-IND') {
    return Array.from(this.requisitions.values()).filter((pr) => pr.tenantId === tenantId);
  }

  // ============================================================================
  // 2. PURCHASE ORDERS (PO)
  // ============================================================================
  public async createPurchaseOrder(dto: CreatePurchaseOrderDto) {
    const parsed = CreatePurchaseOrderDtoSchema.parse(dto);
    const poNumber = parsed.poNumber || `PO-2026-${Date.now().toString().slice(-5)}`;

    // Compute Tax Breakdown (CGST 9% + SGST 9% or IGST 18%)
    const subtotal = parsed.items.reduce((sum, itm) => sum + itm.quantity * itm.unitPrice, 0);
    const isInterstate = !parsed.vendorGstin?.startsWith('33'); // 33 = Tamil Nadu
    const taxRate = parsed.items[0]?.taxRatePct || 18;
    const totalTax = subtotal * (taxRate / 100);

    const cgst = isInterstate ? 0 : totalTax / 2;
    const sgst = isInterstate ? 0 : totalTax / 2;
    const igst = isInterstate ? totalTax : 0;
    const grandTotal = subtotal + totalTax;

    const poRecord = {
      id: poNumber,
      tenantId: parsed.tenantId,
      vendorId: parsed.vendorId,
      vendorName: parsed.vendorName,
      vendorGstin: parsed.vendorGstin,
      currency: parsed.currency,
      prReference: parsed.prReference || null,
      paymentTerms: parsed.paymentTerms,
      shippingAddress: parsed.shippingAddress,
      subtotal,
      cgst,
      sgst,
      igst,
      totalTax,
      grandTotal,
      items: parsed.items,
      status: 'PENDING_APPROVAL',
      buyerUserId: parsed.initiatorUserId,
      createdAt: new Date().toISOString(),
    };

    this.purchaseOrders.set(poNumber, poRecord);

    // Submit to Universal Approval Engine
    const workflowResult = await this.workflowService.submitDocumentForApproval({
      tenantId: parsed.tenantId,
      documentRef: poNumber,
      domain: 'Procurement',
      documentType: 'Purchase Order (PO)',
      totalAmount: grandTotal,
      initiatorUserId: parsed.initiatorUserId,
      payloadSnapshot: poRecord,
    });

    return {
      success: true,
      poNumber,
      grandTotal,
      taxSummary: { cgst, sgst, igst, totalTax },
      status: 'PENDING_APPROVAL',
      workflow: workflowResult,
      message: `Purchase Order ${poNumber} submitted for authorization.`,
    };
  }

  public async getPurchaseOrders(tenantId: string = 'TENANT-ALPHA-IND') {
    return Array.from(this.purchaseOrders.values()).filter((po) => po.tenantId === tenantId);
  }

  // ============================================================================
  // 3. GOODS RECEIPT NOTE (GRN) & 3-WAY MATCH
  // ============================================================================
  public async createGoodsReceiptNote(dto: CreateGoodsReceiptNoteDto) {
    const parsed = CreateGoodsReceiptNoteDtoSchema.parse(dto);
    const grnNumber = parsed.grnNumber || `GRN-2026-${Date.now().toString().slice(-5)}`;

    const po = this.purchaseOrders.get(parsed.poNumber);
    if (!po) {
      throw new NotFoundException(`Associated Purchase Order "${parsed.poNumber}" not found.`);
    }

    const grnRecord = {
      id: grnNumber,
      tenantId: parsed.tenantId,
      poNumber: parsed.poNumber,
      vendorName: po.vendorName,
      vendorInvoiceNumber: parsed.vendorInvoiceNumber,
      vehicleNumber: parsed.vehicleNumber,
      receivedDate: parsed.receivedDate,
      receivedByUserId: parsed.receivedByUserId,
      destinationWarehouse: parsed.destinationWarehouse,
      items: parsed.items,
      totalDeliveredQty: parsed.items.reduce((s, i) => s + i.deliveredQty, 0),
      totalAcceptedQty: parsed.items.reduce((s, i) => s + i.acceptedQty, 0),
      totalRejectedQty: parsed.items.reduce((s, i) => s + (i.rejectedQty || 0), 0),
      status: 'ACCEPTED_POSTED',
      createdAt: new Date().toISOString(),
    };

    this.goodsReceiptNotes.set(grnNumber, grnRecord);

    // Automatically execute Double-Entry Stock Movement into Silo/Warehouse
    for (const item of parsed.items) {
      if (item.acceptedQty > 0) {
        await this.recordStockMovement({
          tenantId: parsed.tenantId,
          sku: item.itemCode,
          sourceWarehouse: 'VENDOR-EXTERNAL',
          sourceBin: 'INBOUND-DOCK',
          targetWarehouse: parsed.destinationWarehouse,
          targetBin: 'SILO-BAY-01',
          batchLotNumber: item.batchLotNumber,
          quantity: item.acceptedQty,
          uom: 'KG',
          movementType: 'PURCHASE_RECEIPT',
          referenceDoc: grnNumber,
          userId: parsed.receivedByUserId,
        });
      }
    }

    return {
      success: true,
      grnNumber,
      totalAcceptedQty: grnRecord.totalAcceptedQty,
      status: 'ACCEPTED_POSTED',
      message: `GRN ${grnNumber} generated. Accepted stock credited to warehouse ${parsed.destinationWarehouse}.`,
    };
  }

  public async evaluateThreeWayMatch(dto: ThreeWayMatchEvaluationDto) {
    const parsed = ThreeWayMatchEvaluationDtoSchema.parse(dto);

    const po = this.purchaseOrders.get(parsed.poNumber);
    if (!po) throw new NotFoundException(`PO ${parsed.poNumber} not found.`);

    const grn = this.goodsReceiptNotes.get(parsed.grnNumber);
    if (!grn) throw new NotFoundException(`GRN ${parsed.grnNumber} not found.`);

    const poTotal = po.grandTotal;
    const billedTotal = parsed.billedTotalAmount;
    const priceVariance = billedTotal - poTotal;
    const priceVariancePct = (priceVariance / poTotal) * 100;

    const poQty = po.items.reduce((s: number, i: any) => s + i.quantity, 0);
    const grnAcceptedQty = grn.totalAcceptedQty;
    const qtyVariance = grnAcceptedQty - poQty;
    const qtyVariancePct = (qtyVariance / poQty) * 100;

    const isPriceMatch = Math.abs(priceVariancePct) <= parsed.priceTolerancePct;
    const isQtyMatch = Math.abs(qtyVariancePct) <= parsed.qtyTolerancePct;
    const isMatchSuccess = isPriceMatch && isQtyMatch;

    return {
      success: true,
      isMatchSuccess,
      evaluation: {
        poReference: { number: po.id, expectedAmount: poTotal, expectedQty: poQty },
        grnReference: { number: grn.id, receivedAcceptedQty: grnAcceptedQty, qtyVariancePct: qtyVariancePct.toFixed(2) + '%' },
        invoiceReference: { number: parsed.vendorInvoiceNumber, billedAmount: billedTotal, priceVariancePct: priceVariancePct.toFixed(2) + '%' },
        matchStatus: isMatchSuccess ? 'PERFECT_3_WAY_MATCH' : 'VARIANCE_RECONCILIATION_REQUIRED',
        recommendedAction: isMatchSuccess
          ? 'AUTO_APPROVE_AP_VOUCHER_FOR_PAYMENT'
          : priceVariance > 0
          ? 'GENERATE_VENDOR_DEBIT_NOTE'
          : 'REQUEST_INVOICE_AMENDMENT',
      },
    };
  }

  // ============================================================================
  // 4. ATOMIC INVENTORY ENGINE & DOUBLE-ENTRY BIN LEDGER
  // ============================================================================
  public async recordStockMovement(dto: InventoryStockMovementDto) {
    const parsed = InventoryStockMovementDtoSchema.parse(dto);

    return this.db.withAdvisoryLock(`stock_sku_${parsed.sku}`, async () => {
      const entryId = `LEDG-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const ledgerEntry = {
        id: entryId,
        tenantId: parsed.tenantId,
        sku: parsed.sku,
        sourceWarehouse: parsed.sourceWarehouse,
        sourceBin: parsed.sourceBin,
        targetWarehouse: parsed.targetWarehouse,
        targetBin: parsed.targetBin,
        batchLotNumber: parsed.batchLotNumber,
        quantity: parsed.quantity,
        uom: parsed.uom,
        movementType: parsed.movementType,
        referenceDoc: parsed.referenceDoc,
        userId: parsed.userId,
        timestamp,
      };

      this.inventoryLedger.push(ledgerEntry);

      // Update in-memory aggregate balance
      const balance = this.stockBalances.get(parsed.sku) || {
        totalStock: 0,
        reservedStock: 0,
        uom: parsed.uom,
        lotBatches: [],
      };

      if (parsed.movementType === 'PURCHASE_RECEIPT' || parsed.movementType === 'TRANSFER') {
        balance.totalStock += parsed.quantity;
        balance.lotBatches.push({
          lotNumber: parsed.batchLotNumber,
          quantity: parsed.quantity,
          warehouse: parsed.targetWarehouse,
          bin: parsed.targetBin,
          receivedAt: timestamp,
        });
      } else if (parsed.movementType === 'SHOPFLOOR_ISSUE' || parsed.movementType === 'SCRAP') {
        balance.totalStock = Math.max(0, balance.totalStock - parsed.quantity);
      }

      this.stockBalances.set(parsed.sku, balance);
      this.logger.log(`Stock movement recorded for ${parsed.sku} (+${parsed.quantity} ${parsed.uom}). Net Balance: ${balance.totalStock}`);

      return {
        success: true,
        ledgerEntryId: entryId,
        sku: parsed.sku,
        newAvailableStock: balance.totalStock - balance.reservedStock,
      };
    });
  }

  public async reserveAtomicStock(dto: AtomicStockReservationDto) {
    const parsed = AtomicStockReservationDtoSchema.parse(dto);

    return this.db.withAdvisoryLock(`stock_sku_${parsed.sku}`, async () => {
      const balance = this.stockBalances.get(parsed.sku);
      if (!balance) {
        throw new NotFoundException(`Item with SKU "${parsed.sku}" not found in inventory catalog.`);
      }

      const availableStock = balance.totalStock - balance.reservedStock;
      if (availableStock < parsed.requiredQuantity) {
        throw new BadRequestException(
          `Insufficient stock for SKU ${parsed.sku}. Required: ${parsed.requiredQuantity}, Available: ${availableStock} ${balance.uom}`
        );
      }

      // Atomically allocate reservation
      balance.reservedStock += parsed.requiredQuantity;
      this.stockBalances.set(parsed.sku, balance);

      const reservationId = `RES-${Date.now().toString().slice(-5)}`;
      this.logger.log(`Atomic reservation ${reservationId} placed for Work Order ${parsed.workOrderRef} (${parsed.requiredQuantity} ${balance.uom}).`);

      return {
        success: true,
        reservationId,
        sku: parsed.sku,
        reservedQuantity: parsed.requiredQuantity,
        remainingAvailableStock: balance.totalStock - balance.reservedStock,
        workOrderRef: parsed.workOrderRef,
        message: 'Stock successfully reserved with atomic consistency.',
      };
    });
  }

  public async getInventoryBalances(tenantId: string = 'TENANT-ALPHA-IND') {
    const result: any[] = [];
    this.stockBalances.forEach((val, sku) => {
      result.push({
        sku,
        totalStock: val.totalStock,
        reservedStock: val.reservedStock,
        availableStock: val.totalStock - val.reservedStock,
        uom: val.uom,
        lotCount: val.lotBatches.length,
      });
    });
    return result;
  }

  private initSampleStock() {
    this.stockBalances.set('RESIN-PP-VIRGIN', {
      totalStock: 45000,
      reservedStock: 12000,
      uom: 'KG',
      lotBatches: [
        { lotNumber: 'LOT-2026-PP-09', quantity: 25000, warehouse: 'RAW-POLYMER-SILO-01', bin: 'SILO-01' },
        { lotNumber: 'LOT-2026-PP-10', quantity: 20000, warehouse: 'RAW-POLYMER-SILO-01', bin: 'SILO-02' },
      ],
    });
    this.stockBalances.set('MB-BLACK-AUTO', {
      totalStock: 3500,
      reservedStock: 500,
      uom: 'KG',
      lotBatches: [{ lotNumber: 'LOT-2026-MB-001', quantity: 3500, warehouse: 'MB-TEMP-STORE', bin: 'RACK-01' }],
    });
  }
}
