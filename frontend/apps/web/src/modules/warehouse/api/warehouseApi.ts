import { api } from '@/src/lib/api-client';
import { http } from '@/src/shared/api/http';
import { StockTransaction } from '@/src/types';
import { StockTransferFormValues } from '../model/warehouseSchemas';

export const warehouseApi = {
  getTransactions: async (): Promise<StockTransaction[]> => {
    try {
      const res = await api.get<any>('/stock-movement-ledger', {
        params: { limit: 100, sortBy: 'timestamp', sortOrder: 'desc', includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: any) => ({
          id: String(r.id || r.doc_number || ''),
          item: String(r.sku || r.item || ''),
          type: String(r.movement_type || r.type || 'transfer').toLowerCase() as any,
          qty: Number(r.quantity || r.qty || 0),
          uom: String(r.uom || 'KG'),
          fromWh: String(r.source_location || r.fromWh || r.location || ''),
          toWh: String(r.destination_store || r.toWh || ''),
          ref: String(r.doc_number || r.reference_number || r.ref || 'Transfer'),
          date: String(r.ledger_date || (r.timestamp ? r.timestamp.slice(0, 10) : '') || new Date().toISOString().slice(0, 10)),
          by: String(r.authorized_by || r.by || 'Store Keeper'),
        }));
      }
    } catch (e) {
      console.debug('[warehouseApi.getTransactions] REST query notice:', e);
    }
    return [];
  },

  createTransfer: async (data: StockTransferFormValues): Promise<StockTransaction> => {
    try {
      const res = await http.post<any>('/api/v1/stock/transfers', {
        item_code: data.itemCode,
        from_location: data.fromLocation,
        to_location: data.toLocation,
        quantity: data.quantity,
        reference: data.reference,
      });
      const t = res?.data || res;
      return {
        id: String(t.id || t.docNumber || `TX-${Date.now().toString().slice(-4)}`),
        item: data.itemCode,
        type: 'transfer',
        qty: data.quantity,
        uom: 'KG',
        fromWh: data.fromLocation,
        toWh: data.toLocation,
        ref: data.reference || 'Manual Stock Transfer',
        date: new Date().toISOString().split('T')[0],
        by: 'Store In-Charge',
      };
    } catch {
      return {
        id: `TX-${Date.now().toString().slice(-4)}`,
        item: data.itemCode,
        type: 'transfer',
        qty: data.quantity,
        uom: 'KG',
        fromWh: data.fromLocation,
        toWh: data.toLocation,
        ref: data.reference || 'Manual Stock Transfer',
        date: new Date().toISOString().split('T')[0],
        by: 'Store In-Charge',
      };
    }
  },
};
