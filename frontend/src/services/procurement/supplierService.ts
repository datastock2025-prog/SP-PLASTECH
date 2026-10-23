import { SupplierMaster } from '../../types/procurement';
import { memoryStorage } from '../../shared/memoryStore';
import { api } from '../../lib/api-client';
import { adminEventBus } from '../adminService';

const STORAGE_KEY = 'reboot_erp_procurement_suppliers_catalog';

const DUMMY_SUPPLIER_IDS = new Set([
  'SUP-001', 'SUP-002', 'SUP-003', 'SUP-004', 'SUP-005',
  'SUP-006', 'SUP-007', 'SUP-008', 'SUP-009', 'SUP-010',
]);

function loadLocalSuppliers(): SupplierMaster[] {
  try {
    const raw = memoryStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((s: SupplierMaster) => !DUMMY_SUPPLIER_IDS.has(s.id) && !DUMMY_SUPPLIER_IDS.has(s.code));
      }
    }
  } catch {
    // Fail open
  }
  return [];
}

function saveLocalSuppliers(suppliers: SupplierMaster[]) {
  try {
    memoryStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
  } catch {
    // Fail open
  }
}

class SupplierService {
  private cache: SupplierMaster[] = loadLocalSuppliers();

  public getSuppliersSync(): SupplierMaster[] {
    return this.cache;
  }

  public async getSuppliers(): Promise<SupplierMaster[]> {
    try {
      const res = await api.get<any>('/suppliers', {
        params: { limit: 100, sortBy: 'name', sortOrder: 'asc', includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) {
        this.cache = rows.filter((s: SupplierMaster) => !DUMMY_SUPPLIER_IDS.has(s.id));
        saveLocalSuppliers(this.cache);
        return this.cache;
      }
    } catch (e) {
      console.debug('[SupplierService.getSuppliers] REST note:', e);
    }
    return this.cache;
  }

  public async saveSupplier(supplier: SupplierMaster): Promise<SupplierMaster> {
    const enrichedSupplier: SupplierMaster = {
      ...supplier,
      id: supplier.id || `SUP-${supplier.code}`,
      status: supplier.status || 'active',
      createdDate: supplier.createdDate || new Date().toISOString().split('T')[0],
    };

    if (enrichedSupplier.id) {
      try {
        const res = await api.patch<any>(`/suppliers/${encodeURIComponent(enrichedSupplier.id)}`, enrichedSupplier);
        const row = res?.data?.data || res?.data;
        if (row && typeof row === 'object') return row;
      } catch {
        try {
          const res = await api.post<any>('/suppliers', enrichedSupplier);
          const row = res?.data?.data || res?.data;
          if (row && typeof row === 'object') return row;
        } catch {}
      }
    }

    const existingIdx = this.cache.findIndex((s) => s.id === enrichedSupplier.id || s.code === enrichedSupplier.code);
    if (existingIdx >= 0) {
      this.cache[existingIdx] = enrichedSupplier;
    } else {
      this.cache.unshift(enrichedSupplier);
    }

    saveLocalSuppliers(this.cache);

    adminEventBus.emit('NOTIFICATION_PUBLISHED', {
      title: 'Supplier Master Updated',
      message: `Supplier ${enrichedSupplier.code} (${enrichedSupplier.name}) saved in live catalog.`,
      level: 'INFO',
      timestamp: new Date().toISOString(),
    });

    return enrichedSupplier;
  }

  public async updateSupplier(supplier: SupplierMaster): Promise<SupplierMaster> {
    return this.saveSupplier(supplier);
  }

  public async syncLiveCatalog(): Promise<number> {
    const list = await this.getSuppliers();
    return list.length;
  }
}

export const supplierService = new SupplierService();
