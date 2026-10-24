import { api } from '@/src/lib/api-client';
import { PurchaseOrder } from '@/src/types';
import { CreatePurchaseOrderFormValues } from '../model/procurementSchemas';

export interface ProcurementSummaryDto {
  totalPos: number;
  openPos: number;
  completedPos: number;
  totalSpend: number;
  totalPrs: number;
  pendingPrs: number;
  totalGrns: number;
  totalSuppliers: number;
}

export const normalizePurchaseOrder = (row: any): PurchaseOrder => ({
  ...row,
  id: String(row.id || ''),
  supplier: String(row.supplier_name || row.supplier || ''),
  vendorName: row.vendor_name || row.vendorName,
  buyerName: row.buyer_name || row.buyerName,
  orderDate: String(row.order_date || row.orderDate || ''),
  expectedDate: String(row.expected_delivery_date || row.expectedDate || ''),
  status: row.status || 'OPEN',
  approval: (row.approval || 'approved') as any,
  rejectReason: row.reject_reason || row.rejectReason,
  totalAmount: Number(row.total_amount ?? row.totalAmount ?? 0),
  lines: Array.isArray(row.lines) ? row.lines : [],
  receiptLogs: Array.isArray(row.receipt_logs) ? row.receipt_logs : [],
  history: Array.isArray(row.history) ? row.history : [],
});

export const procurementApi = {
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    try {
      const res = await api.get<any>('/purchase-orders', {
        params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) {
        return rows.map((row) => normalizePurchaseOrder(row));
      }
    } catch (e) {
      console.debug('[procurementApi.getPurchaseOrders] REST query notice:', e);
    }
    return [];
  },

  getProcurementSummary: async (): Promise<ProcurementSummaryDto> => {
    try {
      const res = await api.get<any>('/procurement/summary');
      const stats = res?.data?.data || res?.data;
      if (stats && typeof stats === 'object') {
        return {
          totalPos: stats.totalPos || 0,
          openPos: stats.openPos || 0,
          completedPos: stats.completedPos || 0,
          totalSpend: Number(stats.totalSpend || 0),
          totalPrs: stats.totalPrs || 0,
          pendingPrs: stats.pendingPrs || 0,
          totalGrns: stats.totalGrns || 0,
          totalSuppliers: stats.totalSuppliers || 0,
        };
      }
    } catch (e) {
      console.debug('[procurementApi.getProcurementSummary] REST notice:', e);
    }
    return {
      totalPos: 0,
      openPos: 0,
      completedPos: 0,
      totalSpend: 0,
      totalPrs: 0,
      pendingPrs: 0,
      totalGrns: 0,
      totalSuppliers: 0,
    };
  },

  createPurchaseOrder: async (data: CreatePurchaseOrderFormValues): Promise<PurchaseOrder> => {
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const lineTotal = (data.qty || 0) * (data.unitPrice || 0);

    const payload = {
      id: poNumber,
      po_number: poNumber,
      supplier_id: data.supplierName || 'SUP-001',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: data.deliveryDate,
      status: 'open',
      total_amount: String(lineTotal),
      items: [
        {
          item_code: data.itemCode,
          name: data.itemName,
          qty: data.qty,
          uom: 'KG',
          price: data.unitPrice,
          received: 0,
        },
      ],
    };

    try {
      const res = await api.post<any>('/purchase-orders', payload);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object') {
        return mapDbRowToPurchaseOrder(row);
      }
    } catch (e) {
      console.debug('[procurementApi.createPurchaseOrder] REST notice:', e);
    }

    return mapDbRowToPurchaseOrder(payload);
  },
};
