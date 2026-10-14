import { describe, it, expect } from 'vitest';
import {
  PurchaseOrderSchema,
  PurchaseOrderLineSchema,
  CreatePurchaseOrderInputSchema,
  UpdatePurchaseOrderInputSchema,
  PurchaseRequisitionSchema,
  SupplierMasterSchema,
  GoodsReceiptNoteSchema,
} from '@/packages/contracts/procurement';

describe('Procurement Module Contracts & Validation', () => {
  it('validates a valid PurchaseOrderLineSchema payload', () => {
    const rawLine = {
      item: 'RM-PP-001',
      name: 'Polypropylene Natural',
      qty: 500,
      uom: 'KG',
      price: 95.5,
      received: 0,
    };

    const parsed = PurchaseOrderLineSchema.safeParse(rawLine);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.item).toBe('RM-PP-001');
      expect(parsed.data.qty).toBe(500);
    }
  });

  it('rejects a purchase order line with non-positive quantity', () => {
    const invalid = {
      item: 'RM-PP-001',
      name: 'Polypropylene',
      qty: -50,
      price: 100,
    };

    const parsed = PurchaseOrderLineSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates a full PurchaseOrderSchema payload', () => {
    const rawPO = {
      id: 'PO-2026-0891',
      supplier: 'SUP-RELIANCE-01',
      orderDate: '2026-10-13',
      expectedDate: '2026-10-20',
      approval: 'approved' as const,
      status: 'issued' as const,
      lines: [
        {
          item: 'RM-PP-001',
          name: 'Polypropylene Homopolymer',
          qty: 2000,
          uom: 'KG',
          price: 98.0,
        },
      ],
      version: 1,
    };

    const parsed = PurchaseOrderSchema.safeParse(rawPO);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBe('PO-2026-0891');
      expect(parsed.data.lines).toHaveLength(1);
    }
  });

  it('validates an UpdatePurchaseOrderInputSchema with version check', () => {
    const update = {
      status: 'closed' as const,
      version: 2,
    };

    const parsed = UpdatePurchaseOrderInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(2);
    }
  });

  it('validates a SupplierMasterSchema payload', () => {
    const rawSupplier = {
      id: 'sup-uuid-001',
      code: 'SUP-IOCL-01',
      name: 'Indian Oil Polymers',
      type: 'Manufacturer',
      category: 'Virgin Resin',
      status: 'active' as const,
      paymentTerms: 'Net 45',
    };

    const parsed = SupplierMasterSchema.safeParse(rawSupplier);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe('SUP-IOCL-01');
      expect(parsed.data.paymentTerms).toBe('Net 45');
    }
  });

  it('validates a GoodsReceiptNoteSchema payload', () => {
    const rawGrn = {
      id: 'grn-uuid-001',
      grnNumber: 'GRN-2026-0124',
      poNumber: 'PO-2026-0891',
      supplierCode: 'SUP-IOCL-01',
      receivedDate: '2026-10-13',
      status: 'posted' as const,
    };

    const parsed = GoodsReceiptNoteSchema.safeParse(rawGrn);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.grnNumber).toBe('GRN-2026-0124');
    }
  });
});
