import { SupplierMaster } from '../../types/procurement';
import { DOCUMENT_LIVE_SUPPLIERS_CATALOG } from '../../data/liveSuppliersCatalog';
import { apiClient } from '../../shared/api/client';
import { adminEventBus } from '../adminService';

const STORAGE_KEY = 'reboot_erp_procurement_suppliers_catalog';

// Stale dummy supplier IDs to remove if previously cached in localStorage
const DUMMY_SUPPLIER_IDS = new Set([
  'SUP-001',
  'SUP-002',
  'SUP-003',
  'SUP-004',
  'SUP-005',
  'SUP-006',
  'SUP-007',
  'SUP-008',
  'SUP-009',
  'SUP-010',
]);

function loadLocalSuppliers(): SupplierMaster[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 20) {
        // Filter out legacy dummy suppliers
        const cleanSuppliers = parsed.filter((s: SupplierMaster) => !DUMMY_SUPPLIER_IDS.has(s.id) && !DUMMY_SUPPLIER_IDS.has(s.code));
        if (cleanSuppliers.length >= 20) {
          return cleanSuppliers;
        }
      }
    }
  } catch (err) {
    console.warn('Could not read suppliers from localStorage', err);
  }

  // Seed with live Document Suppliers Catalog (411 records)
  const initial = DOCUMENT_LIVE_SUPPLIERS_CATALOG.map((s) => ({
    ...s,
    status: s.status || 'active',
  }));
  saveLocalSuppliers(initial);
  return initial;
}

function saveLocalSuppliers(suppliers: SupplierMaster[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
  } catch (err) {
    console.warn('Could not save suppliers to localStorage', err);
  }
}

class SupplierService {
  private cache: SupplierMaster[] = loadLocalSuppliers();

  public getSuppliersSync(): SupplierMaster[] {
    if (!this.cache || this.cache.length === 0) {
      this.cache = loadLocalSuppliers();
    }
    return this.cache;
  }

  public async getSuppliers(): Promise<SupplierMaster[]> {
    try {
      const res = await apiClient.get<any>('/api/procurement/suppliers');
      if (res && res.data && Array.isArray(res.data.suppliers) && res.data.suppliers.length > 0) {
        this.cache = res.data.suppliers.filter((s: SupplierMaster) => !DUMMY_SUPPLIER_IDS.has(s.id));
        saveLocalSuppliers(this.cache);
        return this.cache;
      }
    } catch {
      // Fallback to local cache
    }
    if (!this.cache || this.cache.length === 0) {
      this.cache = loadLocalSuppliers();
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

    // Try backend API sync
    try {
      await apiClient.post('/api/procurement/suppliers', enrichedSupplier);
    } catch {
      // Offline fallback
    }

    const existingIdx = this.cache.findIndex((s) => s.id === enrichedSupplier.id || s.code === enrichedSupplier.code);
    if (existingIdx >= 0) {
      this.cache[existingIdx] = enrichedSupplier;
    } else {
      this.cache.unshift(enrichedSupplier);
    }

    saveLocalSuppliers(this.cache);

    adminEventBus.emit({
      type: 'NOTIFICATION_PUBLISHED',
      payload: {
        title: 'Supplier Master Updated',
        message: `Supplier ${enrichedSupplier.code} (${enrichedSupplier.name}) saved in live catalog.`,
        level: 'INFO',
        timestamp: new Date().toISOString(),
      },
    });

    return enrichedSupplier;
  }

  public async updateSupplier(supplier: SupplierMaster): Promise<SupplierMaster> {
    return this.saveSupplier(supplier);
  }

  public async syncLiveCatalog(): Promise<number> {
    this.cache = DOCUMENT_LIVE_SUPPLIERS_CATALOG.map((s) => ({ ...s }));
    saveLocalSuppliers(this.cache);

    try {
      await apiClient.post('/api/procurement/suppliers/bulk-sync', { suppliers: this.cache });
    } catch {
      // Offline sync successful locally
    }

    return this.cache.length;
  }
}

export const supplierService = new SupplierService();
