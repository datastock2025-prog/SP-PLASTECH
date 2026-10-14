import { describe, it, expect } from 'vitest';
import {
  SalesOrderSchema,
  SalesOrderLineSchema,
  CreateSalesOrderInputSchema,
  UpdateSalesOrderInputSchema,
  CustomerSchema,
  SalesQuotationSchema,
  DeliveryChallanSchema,
} from '@/packages/contracts/sales';

describe('Sales Module Contracts & Validation', () => {
  it('validates a valid SalesOrderLineSchema payload', () => {
    const rawLine = {
      item: 'FG-BOTTLE-500ML',
      name: '500ml HDPE Bottle Natural',
      qty: 10000,
      uom: 'PCS',
      price: 12.5,
      dispatched: 0,
    };

    const parsed = SalesOrderLineSchema.safeParse(rawLine);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.item).toBe('FG-BOTTLE-500ML');
      expect(parsed.data.qty).toBe(10000);
      expect(parsed.data.price).toBe(12.5);
    }
  });

  it('rejects a sales order line with non-positive quantity', () => {
    const invalid = {
      item: 'FG-BOTTLE-500ML',
      name: '500ml HDPE Bottle',
      qty: 0,
      price: 10,
    };

    const parsed = SalesOrderLineSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates a full SalesOrderSchema payload', () => {
    const rawSO = {
      id: 'SO-2026-0089',
      customer: 'Tata Motors Limited',
      customerPO: 'PO-TML-45012',
      priority: 'high' as const,
      orderDate: '2026-10-13',
      deliveryDate: '2026-10-25',
      approval: 'approved' as const,
      lines: [
        {
          item: 'FG-AUTO-BUMPER-01',
          name: 'Front Bumper Cladding',
          qty: 500,
          uom: 'PCS',
          price: 1450,
          dispatched: 0,
        },
      ],
      version: 1,
    };

    const parsed = SalesOrderSchema.safeParse(rawSO);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBe('SO-2026-0089');
      expect(parsed.data.customer).toBe('Tata Motors Limited');
      expect(parsed.data.lines).toHaveLength(1);
    }
  });

  it('validates an UpdateSalesOrderInputSchema with OCC version', () => {
    const update = {
      priority: 'high' as const,
      version: 3,
    };

    const parsed = UpdateSalesOrderInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(3);
    }
  });

  it('validates a CustomerSchema payload', () => {
    const rawCustomer = {
      id: 'cust-uuid-001',
      code: 'CUST-TATA-01',
      name: 'Tata Motors Ltd',
      segment: 'Automotive OEM',
      creditLimit: 5000000,
      contact: 'Rajesh Sharma',
      email: 'rajesh.sharma@tatamotors.com',
      phone: '+91-9876543210',
      status: 'active' as const,
      gstin: '27AAACG0943A1ZX',
      paymentTerms: 'Net 60',
    };

    const parsed = CustomerSchema.safeParse(rawCustomer);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe('CUST-TATA-01');
      expect(parsed.data.creditLimit).toBe(5000000);
    }
  });

  it('validates a DeliveryChallanSchema payload', () => {
    const rawChallan = {
      id: 'dc-uuid-001',
      challanNumber: 'DC-2026-0450',
      customer: 'Tata Motors Limited',
      deliveryDate: '2026-10-14',
      status: 'Challan Generated',
      transporter: 'VRL Logistics',
      eWayBillNo: '231089452301',
    };

    const parsed = DeliveryChallanSchema.safeParse(rawChallan);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.challanNumber).toBe('DC-2026-0450');
      expect(parsed.data.transporter).toBe('VRL Logistics');
    }
  });
});
