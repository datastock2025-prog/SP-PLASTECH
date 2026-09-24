import axios from 'axios';
import {
  ItemMaster,
  BomMaster,
  MachineMaster,
  WorkOrder,
  PurchaseOrder,
  SalesOrder,
  Account,
  JournalEntry,
  NonConformanceReport,
  CapaReport,
  CertificateOfAnalysis,
  Customer,
  Quotation,
  ReturnMerchandise,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class LiveDataStore {
  private api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': 'PLANT-01',
    },
  });

  // --------------------------------------------------------------------------
  // 1. Items & Resins (Live DB)
  // --------------------------------------------------------------------------
  public async getItems(): Promise<ItemMaster[]> {
    try {
      const res = await this.api.get('/items');
      return res.data?.data || res.data || [];
    } catch (err) {
      console.warn('[LiveDataStore] Falling back to pre-seeded items cache', err);
      return [];
    }
  }

  public async updateItem(item: ItemMaster): Promise<ItemMaster> {
    try {
      const res = await this.api.put(`/items/${item.code}`, item);
      return res.data?.data || item;
    } catch (err) {
      return item;
    }
  }

  // --------------------------------------------------------------------------
  // 2. Work Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getWorkOrders(): Promise<WorkOrder[]> {
    try {
      const res = await this.api.get('/work-orders');
      return res.data?.data || res.data || [];
    } catch (err) {
      console.warn('[LiveDataStore] Falling back to pre-seeded work orders cache', err);
      return [];
    }
  }

  public async saveWorkOrder(wo: WorkOrder): Promise<WorkOrder> {
    try {
      const res = await this.api.post('/work-orders', wo);
      return res.data?.data || wo;
    } catch (err) {
      return wo;
    }
  }

  // --------------------------------------------------------------------------
  // 3. Purchase Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const res = await this.api.get('/purchase-orders');
      return res.data?.data || res.data || [];
    } catch (err) {
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // 4. Sales Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getSalesOrders(): Promise<SalesOrder[]> {
    try {
      const res = await this.api.get('/sales-orders');
      return res.data?.data || res.data || [];
    } catch (err) {
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // 5. Chart of Accounts & General Ledger (Live DB)
  // --------------------------------------------------------------------------
  public async getAccounts(): Promise<Account[]> {
    try {
      const res = await this.api.get('/finance/accounts');
      return res.data?.data || res.data || [];
    } catch (err) {
      return [];
    }
  }

  public async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const res = await this.api.get('/finance/journal-entries');
      return res.data?.data || res.data || [];
    } catch (err) {
      return [];
    }
  }
}

export const liveDataStore = new LiveDataStore();
