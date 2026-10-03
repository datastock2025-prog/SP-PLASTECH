import axios from 'axios';
import { db } from '../shared/db';
import { adminEventBus } from './adminService';
import { universalSyncManager } from './realtime/UniversalSyncManager';
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

import { getApiBaseUrl } from '../shared/config';

const API_BASE = getApiBaseUrl('/api/v1');

export interface ProductionEntryPayload {
  workOrderId: string;
  machineId: string;
  shift: string;
  operatorId: string;
  goodQty: number;
  scrapQty: number;
  downtimeMinutes: number;
  downtimeReason?: string;
  cavities: number;
  actualCycleTimeSec: number;
  lotNumber?: string;
  notes?: string;
}


export interface ProductionEntryResult {
  success: boolean;
  workOrder: WorkOrder;
  computedOee: {
    availabilityPct: number;
    performancePct: number;
    qualityPct: number;
    overallOeePct: number;
  };
  materialConsumedKg: number;
  hourlyOutputRate: number;
}

export interface BomCalculationPayload {
  itemId: string;
  shotWeightGrams: number;
  runnerWeightGrams: number;
  cavities: number;
  standardCycleTimeSec: number;
  scrapAllowancePct: number;
  components: Array<{
    itemCode: string;
    percentage: number;
    standardCost: number;
  }>;
  machineHourlyRate: number;
}

export interface BomCalculationResult {
  bomUnitCost: number;
  materialCostPerPart: number;
  machineCostPerPart: number;
  expectedPartsPerHour: number;
  grossShotWeightG: number;
}

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
  // 1. Production Mutation & Real-Time OEE Calculation Pipeline
  // --------------------------------------------------------------------------
  public async recordProductionEntry(payload: ProductionEntryPayload): Promise<ProductionEntryResult> {
    try {
      const res = await this.api.post('/operations/production-entry', payload);
      return res.data?.data || res.data;
    } catch (err) {
      // Local client-side calculation preview fallback
      const plannedMinutes = 480; // 8 hr shift
      const operatingMinutes = Math.max(0, plannedMinutes - payload.downtimeMinutes);
      const totalProduced = payload.goodQty + payload.scrapQty;
      
      const availabilityPct = Number(((operatingMinutes / plannedMinutes) * 100).toFixed(2));
      const idealOperatingSec = (totalProduced / payload.cavities) * payload.actualCycleTimeSec;
      const actualOperatingSec = operatingMinutes * 60;
      const performancePct = Number((actualOperatingSec > 0 ? Math.min(100, (idealOperatingSec / actualOperatingSec) * 100) : 0).toFixed(2));
      const qualityPct = Number((totalProduced > 0 ? (payload.goodQty / totalProduced) * 100 : 100).toFixed(2));
      const overallOeePct = Number(((availabilityPct * performancePct * qualityPct) / 10000).toFixed(2));
      const hourlyOutputRate = Number((payload.actualCycleTimeSec > 0 ? (3600 / payload.actualCycleTimeSec) * payload.cavities : 0).toFixed(0));

      const result: ProductionEntryResult = {
        success: true,
        workOrder: {
          id: payload.workOrderId,
          status: 'running',
          produced: payload.goodQty,
          scrap: payload.scrapQty,
        } as unknown as WorkOrder,

        computedOee: {
          availabilityPct,
          performancePct,
          qualityPct,
          overallOeePct,
        },
        materialConsumedKg: Number((totalProduced * 0.035).toFixed(2)),
        hourlyOutputRate,
      };

      adminEventBus.emit('PRODUCTION_LOGGED', result);
      universalSyncManager.broadcastMutation('WORK_ORDERS', 'UPDATE', result.workOrder);
      return result;
    }
  }

  // --------------------------------------------------------------------------
  // 2. Engineering BOM & Costing Rollup Calculation Pipeline
  // --------------------------------------------------------------------------
  public calculateBomRollup(payload: BomCalculationPayload): BomCalculationResult {
    const grossShotWeightG = payload.shotWeightGrams + payload.runnerWeightGrams;
    const partsPerHour = payload.standardCycleTimeSec > 0 ? (3600 / payload.standardCycleTimeSec) * payload.cavities : 0;
    const machineCostPerPart = partsPerHour > 0 ? payload.machineHourlyRate / partsPerHour : 0;
    
    // Component material cost sum
    const materialCostPerPart = payload.components.reduce((acc, c) => {
      const partResinKg = (grossShotWeightG / 1000 / payload.cavities) * (c.percentage / 100) * (1 + payload.scrapAllowancePct / 100);
      return acc + partResinKg * c.standardCost;
    }, 0);

    const bomUnitCost = Number((materialCostPerPart + machineCostPerPart).toFixed(4));

    return {
      bomUnitCost,
      materialCostPerPart: Number(materialCostPerPart.toFixed(4)),
      machineCostPerPart: Number(machineCostPerPart.toFixed(4)),
      expectedPartsPerHour: Math.round(partsPerHour),
      grossShotWeightG,
    };
  }

  // --------------------------------------------------------------------------
  // 3. Items & Resins (Live DB)
  // --------------------------------------------------------------------------
  public async getItems(): Promise<ItemMaster[]> {
    try {
      const res = await this.api.get('/items');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async updateItem(item: ItemMaster): Promise<ItemMaster> {
    try {
      const res = await this.api.put(`/items/${item.code}`, item);
      const updated = res.data?.data || item;
      adminEventBus.emit('ITEM_SAVED', updated);
      universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', updated);
      return updated;
    } catch {
      adminEventBus.emit('ITEM_SAVED', item);
      universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', item);
      return item;
    }
  }

  // --------------------------------------------------------------------------
  // 4. Work Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getWorkOrders(): Promise<WorkOrder[]> {
    try {
      const data = await db.findMany<WorkOrder>('work_orders', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}

    try {
      const res = await this.api.get('/work-orders');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async saveWorkOrder(wo: WorkOrder): Promise<WorkOrder> {
    try {
      await db.upsert('work_orders', {
        id: wo.id,
        item_code: wo.item || (wo as any).itemCode,
        machine_id: wo.machine || (wo as any).machineId,
        status: wo.status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    try {
      const res = await this.api.post('/work-orders', wo);
      const saved = res.data?.data || wo;
      adminEventBus.emit('WORK_ORDER_SAVED', saved);
      universalSyncManager.broadcastMutation('WORK_ORDERS', 'INSERT', saved);
      return saved;
    } catch {
      adminEventBus.emit('WORK_ORDER_SAVED', wo);
      universalSyncManager.broadcastMutation('WORK_ORDERS', 'INSERT', wo);
      return wo;
    }
  }

  // --------------------------------------------------------------------------
  // 5. Purchase Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const data = await db.findMany<PurchaseOrder>('purchase_orders', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}

    try {
      const res = await this.api.get('/purchase-orders');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async savePurchaseOrder(po: PurchaseOrder): Promise<PurchaseOrder> {
    try {
      await db.upsert('purchase_orders', {
        id: po.id,
        supplier_id: (po as any).supplierId || (po as any).supplier,
        status: (po as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('PURCHASE_ORDER_SAVED', po);
    universalSyncManager.broadcastMutation('PURCHASE_ORDERS', 'UPDATE', po);
    return po;
  }

  // --------------------------------------------------------------------------
  // 6. Sales Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getSalesOrders(): Promise<SalesOrder[]> {
    try {
      const data = await db.findMany<SalesOrder>('sales_orders', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}

    try {
      const res = await this.api.get('/sales-orders');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async saveSalesOrder(so: SalesOrder): Promise<SalesOrder> {
    try {
      await db.upsert('sales_orders', {
        id: so.id,
        so_number: (so as any).soNumber || so.id,
        customer_id: (so as any).customerId || (so as any).customer,
        customer_name: (so as any).customerName,
        status: (so as any).status,
        total_value: (so as any).totalValue || (so as any).totalAmount || 0,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('SALES_ORDER_SAVED', so);
    universalSyncManager.broadcastMutation('SALES_ORDERS', 'UPDATE', so);
    return so;
  }

  // --------------------------------------------------------------------------
  // 7. Customers Master (Live DB)
  // --------------------------------------------------------------------------
  public async getCustomers(): Promise<Customer[]> {
    try {
      const data = await db.findMany<Customer>('customers', {
        orderBy: { column: 'name', ascending: true },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}

    try {
      const res = await this.api.get('/customers');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async saveCustomer(customer: Customer): Promise<Customer> {
    try {
      await db.upsert('customers', {
        id: (customer as any).id || customer.code,
        code: customer.code,
        name: customer.name,
        email: (customer as any).email,
        phone: (customer as any).phone,
        status: (customer as any).status || 'Active',
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('CUSTOMER_SAVED', customer);
    universalSyncManager.broadcastMutation('CUSTOMERS', 'UPDATE', customer);
    return customer;
  }

  // --------------------------------------------------------------------------
  // 8. Quality NCR, CAPA, COA (Live DB)
  // --------------------------------------------------------------------------
  public async getNcrs(): Promise<NonConformanceReport[]> {
    try {
      const data = await db.findMany<NonConformanceReport>('quality_ncrs', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}
    return [];
  }

  public async saveNcr(ncr: NonConformanceReport): Promise<NonConformanceReport> {
    try {
      await db.upsert('quality_ncrs', {
        id: ncr.id,
        ncr_number: (ncr as any).ncrNumber || ncr.id,
        severity: (ncr as any).severity,
        status: (ncr as any).status,
        description: (ncr as any).description,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('NCR_SAVED', ncr);
    universalSyncManager.broadcastMutation('QUALITY_NCRS', 'UPDATE', ncr);
    return ncr;
  }

  public async getCapas(): Promise<CapaReport[]> {
    try {
      const data = await db.findMany<CapaReport>('quality_capas', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}
    return [];
  }

  public async saveCapa(capa: CapaReport): Promise<CapaReport> {
    try {
      await db.upsert('quality_capas', {
        id: capa.id,
        capa_number: (capa as any).capaNumber || capa.id,
        status: (capa as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('CAPA_SAVED', capa);
    universalSyncManager.broadcastMutation('QUALITY_CAPAS', 'UPDATE', capa);
    return capa;
  }

  public async getCoas(): Promise<CertificateOfAnalysis[]> {
    try {
      const data = await db.findMany<CertificateOfAnalysis>('quality_coas', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}
    return [];
  }

  public async saveCoa(coa: CertificateOfAnalysis): Promise<CertificateOfAnalysis> {
    try {
      await db.upsert('quality_coas', {
        id: coa.id,
        coa_number: (coa as any).coaNumber || coa.id,
        item_code: (coa as any).itemCode,
        lot_number: (coa as any).lotNumber,
        status: (coa as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('COA_SAVED', coa);
    universalSyncManager.broadcastMutation('QUALITY_COAS', 'UPDATE', coa);
    return coa;
  }

  // --------------------------------------------------------------------------
  // 9. Engineering BOMs & Machines (Live DB)
  // --------------------------------------------------------------------------
  public async getBoms(): Promise<BomMaster[]> {
    try {
      const data = await db.findMany<BomMaster>('boms', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}
    return [];
  }

  public async saveBom(bom: BomMaster): Promise<BomMaster> {
    try {
      await db.upsert('boms', {
        id: bom.id,
        item_code: bom.itemCode,
        version: bom.version,
        status: bom.status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('BOM_SAVED', bom);
    universalSyncManager.broadcastMutation('BOMS', 'UPDATE', bom);
    return bom;
  }

  public async getMachines(): Promise<MachineMaster[]> {
    try {
      const data = await db.findMany<MachineMaster>('machines', {
        orderBy: { column: 'machine_code', ascending: true },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}

    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('reboot_erp_machine_work_centers_v2') : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any) => ({
            id: m.id || m.code,
            code: m.code || m.id,
            name: m.name,
            type: m.category || 'Injection Molding Machine',
            line: m.bayNumber || 'IMM Bay 01',
            status: m.currentStatus?.toLowerCase() === 'running' ? 'running' : m.currentStatus?.toLowerCase() === 'idle' ? 'idle' : 'in_use',
            job: m.currentJob || '',
            lastPM: m.lastMaintenanceDate || '2026-08-01',
            nextPM: m.nextPmDate || '2026-11-01',
            tonnage: `${m.tonnageRating || 250}T`,
            approval: 'approved' as const,
            createdOn: m.commissioningDate || '2026-01-01',
            hourlyRate: m.hourlyCostRateInr || 2400,
            shotCount: m.totalLifetimeShots || 0,
            plantId: m.plantId || 'PLANT-01',
            plantName: m.plantName || 'Plant 01 — Pune / Chakan Hub',
          }));
        }
      }
    } catch {}

    return [];
  }

  public async saveMachine(machine: MachineMaster): Promise<MachineMaster> {
    try {
      await db.upsert('machines', {
        id: machine.id,
        machine_code: (machine as any).machineCode || (machine as any).code || machine.id,
        name: machine.name,
        tonnage: (machine as any).tonnage,
        status: machine.status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    // Update local admin store if present
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('reboot_erp_machine_work_centers_v2') : null;
      let list = stored ? JSON.parse(stored) : [];
      if (Array.isArray(list)) {
        const idx = list.findIndex((m: any) => m.id === machine.id || m.code === machine.id || m.code === machine.code);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...machine };
        } else {
          list.unshift(machine);
        }
        localStorage.setItem('reboot_erp_machine_work_centers_v2', JSON.stringify(list));
      }
    } catch {}

    adminEventBus.emit('MACHINE_SAVED', machine);
    adminEventBus.emit('MACHINES_SYNCED');
    universalSyncManager.broadcastMutation('MACHINES', 'UPDATE', machine);
    return machine;
  }

  public async deleteMachine(id: string): Promise<boolean> {
    try {
      await db.delete('machines', id);
    } catch {}

    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('reboot_erp_machine_work_centers_v2') : null;
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const filtered = list.filter((m: any) => m.id !== id && m.code !== id);
          localStorage.setItem('reboot_erp_machine_work_centers_v2', JSON.stringify(filtered));
        }
      }
    } catch {}

    adminEventBus.emit('MACHINE_DELETED', { id });
    adminEventBus.emit('MACHINES_SYNCED');
    universalSyncManager.broadcastMutation('MACHINES', 'DELETE', { id });
    return true;
  }

  // --------------------------------------------------------------------------
  // 10. Chart of Accounts & General Ledger (Live DB)
  // --------------------------------------------------------------------------
  public async getAccounts(): Promise<Account[]> {
    try {
      const data = await db.findMany<Account>('accounts', {
        orderBy: { column: 'code', ascending: true },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}

    try {
      const res = await this.api.get('/finance/accounts');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async saveAccount(acc: Account): Promise<Account> {
    try {
      await db.upsert('accounts', {
        id: (acc as any).id || acc.code,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('ACCOUNT_SAVED', acc);
    universalSyncManager.broadcastMutation('ACCOUNTS', 'UPDATE', acc);
    return acc;
  }

  public async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const data = await db.findMany<JournalEntry>('journal_entries', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}

    try {
      const res = await this.api.get('/finance/journal-entries');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async saveJournalEntry(je: JournalEntry): Promise<JournalEntry> {
    try {
      await db.upsert('journal_entries', {
        id: je.id,
        je_number: (je as any).jeNumber || je.id,
        date: je.date,
        status: (je as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('JOURNAL_ENTRY_SAVED', je);
    universalSyncManager.broadcastMutation('JOURNAL_ENTRIES', 'UPDATE', je);
    return je;
  }

  // --------------------------------------------------------------------------
  // 11. Quotations & RMAs (Live DB)
  // --------------------------------------------------------------------------
  public async getQuotations(): Promise<Quotation[]> {
    try {
      const data = await db.findMany<Quotation>('quotations', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}
    return [];
  }

  public async saveQuotation(quote: Quotation): Promise<Quotation> {
    try {
      await db.upsert('quotations', {
        id: quote.id,
        quote_number: (quote as any).quoteNumber || quote.id,
        customer_id: (quote as any).customerId || (quote as any).customer,
        status: (quote as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('QUOTATION_SAVED', quote);
    universalSyncManager.broadcastMutation('QUOTATIONS', 'UPDATE', quote);
    return quote;
  }

  public async getRmas(): Promise<ReturnMerchandise[]> {
    try {
      const data = await db.findMany<ReturnMerchandise>('rmas', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}
    return [];
  }

  public async saveRma(rma: ReturnMerchandise): Promise<ReturnMerchandise> {
    try {
      await db.upsert('rmas', {
        id: rma.id,
        rma_number: (rma as any).rmaNumber || rma.id,
        status: rma.status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('RMA_SAVED', rma);
    universalSyncManager.broadcastMutation('RMAS', 'UPDATE', rma);
    return rma;
  }
}

export const liveDataStore = new LiveDataStore();
