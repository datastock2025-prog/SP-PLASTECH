import { MasterDataRecord, masterDataRecords } from '../../../../../../src/data/adminExtendedData';
import { adminEventBus } from '@/src/services/adminEventBus';

import { api } from '../../../../../../src/lib/api-client';

// In-memory transient store replacing client cache per Enterprise Rule #3 & Ponytail
const memStore = new Map<string, string>();
const memGet = (k: string): string | null => memStore.get(k) ?? null;
const memSet = (k: string, v: string): void => { memStore.set(k, v); };
const memDel = (k: string): void => { memStore.delete(k); };

const STORAGE_KEY = 'reboot_erp_master_data_governance';

function loadMasterRecords(): MasterDataRecord[] {
  try {
    const raw = memGet(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade legacy cached records with manufacturing attributes if missing
        const upgraded = parsed.map((r: MasterDataRecord) => {
          const defaultRef = masterDataRecords.find((m) => m.code === r.code);
          return {
            ...r,
            itemGroup:
              r.itemGroup ||
              defaultRef?.itemGroup ||
              (r.entityType === 'Polymer Resin Item'
                ? 'Polymer Feedstock'
                : r.entityType === 'Color Masterbatch'
                ? 'Colorants & Additives'
                : r.entityType === 'Finished Molded Component'
                ? 'Automotive Assemblies'
                : r.entityType === 'Tooling & Mold Asset'
                ? 'Tooling & Mold Spares'
                : 'General Catalog'),
            resinType: r.resinType || defaultRef?.resinType || (r.entityType === 'Polymer Resin Item' ? 'Polypropylene (PP)' : r.entityType === 'Finished Molded Component' ? 'PP Impact Copolymer' : ''),
            color: r.color || defaultRef?.color || (r.entityType === 'Color Masterbatch' ? 'Carbon Black' : 'Natural / Milky White'),
            polymerGrade: r.polymerGrade || defaultRef?.polymerGrade || '',
            mfi: r.mfi || defaultRef?.mfi || '',
            density: r.density || defaultRef?.density || '',
          };
        });
        saveMasterRecords(upgraded);
        return upgraded;
      }
    }
  } catch (err) {
    console.warn('Failed to load master data records from in-memory storage', err);
  }

  // Database-first zero fallback: strictly return empty array if no records
  return [];
}

function saveMasterRecords(records: MasterDataRecord[]) {
  try {
    memSet(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Failed to save master data records to in-memory storage', err);
  }
}

class MasterDataGovernanceService {
  private cache: MasterDataRecord[] = loadMasterRecords();

  public getAllRecords(): MasterDataRecord[] {
    return [...this.cache];
  }

  public getRecordsByEntityTypes(entityTypes: string[]): MasterDataRecord[] {
    if (!entityTypes || entityTypes.length === 0 || entityTypes.includes('ALL')) {
      return [...this.cache];
    }
    return this.cache.filter((r) => entityTypes.includes(r.entityType));
  }

  public getRecordByCode(code: string): MasterDataRecord | undefined {
    if (!code) return undefined;
    const clean = String(code).trim().toLowerCase();
    return this.cache.find((r) => String(r?.code || '').trim().toLowerCase() === clean);
  }

  public searchRecords(query: string, entityTypes?: string[]): MasterDataRecord[] {
    let list = this.cache;
    if (entityTypes && entityTypes.length > 0 && !entityTypes.includes('ALL')) {
      list = list.filter((r) => entityTypes.includes(r.entityType));
    }
    if (!query || typeof query !== 'string' || !query.trim()) return list;
    const q = String(query).trim().toLowerCase();
    return list.filter(
      (r) =>
        String(r.code || '').toLowerCase().includes(q) ||
        String(r.name || '').toLowerCase().includes(q) ||
        String(r.category || '').toLowerCase().includes(q) ||
        (r.itemGroup && String(r.itemGroup).toLowerCase().includes(q)) ||
        (r.resinType && String(r.resinType).toLowerCase().includes(q)) ||
        (r.color && String(r.color).toLowerCase().includes(q))
    );
  }

  public saveRecord(record: Partial<MasterDataRecord> & { code: string; name: string }): MasterDataRecord {
    const existingIdx = this.cache.findIndex(
      (r) => String(r?.code || '').trim().toLowerCase() === String(record?.code || '').trim().toLowerCase() || (record.id && r.id === record.id)
    );

    const fullRecord: MasterDataRecord = {
      id: record.id || `MDR-${Date.now().toString().slice(-5)}`,
      entityType: record.entityType || 'Polymer Resin Item',
      code: String(record.code || '').trim().toUpperCase(),
      name: String(record.name || '').trim(),
      primaryUom: record.primaryUom || 'Kilograms (KG)',
      category: record.category || 'Virgin Raw Polymer',
      itemGroup:
        record.itemGroup ||
        (record.entityType === 'Polymer Resin Item'
          ? 'Polymer Feedstock'
          : record.entityType === 'Color Masterbatch'
          ? 'Colorants & Additives'
          : record.entityType === 'Finished Molded Component'
          ? 'Automotive Assemblies'
          : record.entityType === 'Tooling & Mold Asset'
          ? 'Tooling & Mold Spares'
          : 'General Catalog'),
      plantScope: record.plantScope || 'All Plants (Global)',
      lastUpdated: new Date().toISOString().split('T')[0],
      updatedBy: record.updatedBy || 'Admin Master Data Governance',
      complianceCert: record.complianceCert || 'RoHS, REACH, UL-94 HB',
      status: (record.status as any) || 'Approved',
      description: record.description || '',
      resinType: record.resinType || (record.entityType === 'Polymer Resin Item' ? 'Polypropylene (PP)' : record.entityType === 'Finished Molded Component' ? 'PP Impact Copolymer' : ''),
      color: record.color || (record.entityType === 'Color Masterbatch' ? 'Carbon Black' : 'Natural / Milky White'),
      polymerGrade: record.polymerGrade || '',
      mfi: record.mfi || '',
      density: record.density || '',
    };

    if (existingIdx >= 0) {
      this.cache[existingIdx] = fullRecord;
    } else {
      this.cache.unshift(fullRecord);
    }

    saveMasterRecords(this.cache);
    adminEventBus.emit('MASTER_RECORD_SAVED', fullRecord);
    return fullRecord;
  }

  public deleteRecord(idOrCode: string): boolean {
    const prevLen = this.cache.length;
    this.cache = this.cache.filter((r) => r.id !== idOrCode && r.code !== idOrCode);
    if (this.cache.length !== prevLen) {
      saveMasterRecords(this.cache);
      adminEventBus.emit('MASTER_RECORD_DELETED', { idOrCode });
      return true;
    }
    return false;
  }

  public resetToDefaults(): void {
    memDel(STORAGE_KEY);
    memDel('reboot_erp_master_suppliers');
    memDel('reboot_erp_master_warehouses');
    memDel('reboot_erp_master_bins');
    this.cache = loadMasterRecords();
    adminEventBus.emit('MASTER_RECORD_SAVED', null);
  }

  // ==========================================
  // Dynamic Suppliers Governance
  // ==========================================
  public getSuppliers(): Array<{ id: string; code: string; name: string; category: string; hsnCode: string; tariffCode: string; moq: number; leadTimeDays: number; paymentTerms: string }> {
    try {
      const raw = memGet('reboot_erp_master_suppliers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load master suppliers', e);
    }
    return [];
  }

  public saveSupplier(sup: { code: string; name: string; category?: string; hsnCode?: string; tariffCode?: string; moq?: number; leadTimeDays?: number; paymentTerms?: string }) {
    const list = this.getSuppliers();
    const newRecord = {
      id: `SUP-${Date.now().toString().slice(-4)}`,
      code: sup.code.trim().toUpperCase(),
      name: sup.name.trim(),
      category: sup.category || 'Virgin Resin',
      hsnCode: sup.hsnCode?.trim() || '39021000',
      tariffCode: sup.tariffCode?.trim() || '3902.10.00',
      moq: Number(sup.moq) || 1000,
      leadTimeDays: Number(sup.leadTimeDays) || 7,
      paymentTerms: sup.paymentTerms || 'Net 30 Days',
    };

    const idx = list.findIndex(s => s.code.toLowerCase() === newRecord.code.toLowerCase() || s.name.toLowerCase() === newRecord.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...newRecord };
    } else {
      list.unshift(newRecord);
    }

    try {
      memSet('reboot_erp_master_suppliers', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master supplier', e);
    }

    adminEventBus.emit('SUPPLIER_MASTER_SAVED', newRecord);
    return newRecord;
  }

  // ==========================================
  // Dynamic Warehouses Governance
  // ==========================================
  public getWarehouses(): Array<{ code: string; name: string; zone: string; plantScope: string }> {
    const defaultWarehouses = [
      { code: 'RM-WH-01', name: 'Raw Material Polymer Silos & Bags', zone: 'Zone A - Bulk Silos', plantScope: 'All Plants' },
      { code: 'RM-WH-02', name: 'Additives & Chemical Vault', zone: 'Zone B - Additives', plantScope: 'All Plants' },
      { code: 'MB-STORE-01', name: 'Masterbatch Temperature Controlled Vault', zone: 'Zone B - Climate Control', plantScope: 'All Plants' },
      { code: 'RG-WH-01', name: 'Regrind & Granulator Recycling Bay', zone: 'Zone D - Regrind', plantScope: 'All Plants' },
      { code: 'FG-WH-01', name: 'Finished Goods Pallet High-Bay Store', zone: 'Zone C - High-Bay Racks', plantScope: 'All Plants' },
      { code: 'SP-WH-01', name: 'Machine Spares & Mold Tooling Crib', zone: 'Zone T - Tool Crib', plantScope: 'Pune / Chakan' },
      { code: 'ASSEMBLY-STORE', name: 'Assembly Staging & Insert Store', zone: 'Zone AS - Assembly Cell', plantScope: 'All Plants' },
      { code: 'DEFLASH-STORE', name: 'Deflash & Flame Polishing Staging Bay', zone: 'Zone DF - Finishing Bay', plantScope: 'All Plants' },
    ];
    try {
      const raw = memGet('reboot_erp_master_warehouses');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const codes = new Set(parsed.map(p => p.code.toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultWarehouses) {
            if (!codes.has(d.code.toLowerCase())) combined.push(d);
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load master warehouses', e);
    }
    return defaultWarehouses;
  }

  public saveWarehouse(wh: { code: string; name: string; zone?: string; plantScope?: string }) {
    const list = this.getWarehouses();
    const newRecord = {
      code: wh.code.trim().toUpperCase(),
      name: wh.name.trim(),
      zone: wh.zone || 'General Zone',
      plantScope: wh.plantScope || 'All Plants',
    };

    const idx = list.findIndex(w => w.code.toLowerCase() === newRecord.code.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      memSet('reboot_erp_master_warehouses', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master warehouse', e);
    }

    adminEventBus.emit('WAREHOUSE_MASTER_SAVED', newRecord);
    return newRecord;
  }

  // ==========================================
  // Dynamic Bins Governance
  // ==========================================
  public getBins(warehouseCode?: string): Array<{ code: string; warehouseCode: string; zone: string }> {
    const defaultBins = [
      { code: 'SILO-A1', warehouseCode: 'RM-WH-01', zone: 'Zone A - Bulk Silos' },
      { code: 'SILO-A2', warehouseCode: 'RM-WH-01', zone: 'Zone A - Bulk Silos' },
      { code: 'SILO-A3', warehouseCode: 'RM-WH-01', zone: 'Zone A - Bulk Silos' },
      { code: 'BAG-RACK-01', warehouseCode: 'RM-WH-01', zone: 'Zone A - Bulk Bags' },
      { code: 'MB-RACK-01', warehouseCode: 'MB-STORE-01', zone: 'Zone B - Additives Vault' },
      { code: 'MB-RACK-02', warehouseCode: 'MB-STORE-01', zone: 'Zone B - Additives Vault' },
      { code: 'FG-BAY-A1', warehouseCode: 'FG-WH-01', zone: 'Zone C - Automated High-Bay' },
      { code: 'FG-BAY-A2', warehouseCode: 'FG-WH-01', zone: 'Zone C - Automated High-Bay' },
      { code: 'FG-PALLET-01', warehouseCode: 'FG-WH-01', zone: 'Zone C - High-Bay Racks' },
      { code: 'A-01-01', warehouseCode: 'RM-WH-01', zone: 'Aisle 1' },
      { code: 'A-01-02', warehouseCode: 'RM-WH-01', zone: 'Aisle 1' },
      { code: 'A-01-03', warehouseCode: 'RM-WH-01', zone: 'Aisle 1' },
      { code: 'B-02-01', warehouseCode: 'RM-WH-02', zone: 'Aisle 2' },
      { code: 'B-02-02', warehouseCode: 'RM-WH-02', zone: 'Aisle 2' },
      { code: 'C-03-01', warehouseCode: 'FG-WH-01', zone: 'Aisle 3' },
      { code: 'RG-BIN-01', warehouseCode: 'RG-WH-01', zone: 'Zone D - Regrind' },
      { code: 'TOOL-DIE-T01', warehouseCode: 'SP-WH-01', zone: 'Zone T - Tool Crib' },
      { code: 'TOOL-DIE-T02', warehouseCode: 'SP-WH-01', zone: 'Zone T - Tool Crib' },
      { code: 'QRN-LOT-99', warehouseCode: 'RM-WH-01', zone: 'Quarantine' },
    ];
    try {
      const raw = memGet('reboot_erp_master_bins');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const codes = new Set(parsed.map(p => p.code.toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultBins) {
            if (!codes.has(d.code.toLowerCase())) combined.push(d);
          }
          if (warehouseCode) {
            return combined.filter(b => !b.warehouseCode || b.warehouseCode.toLowerCase() === warehouseCode.toLowerCase());
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load master bins', e);
    }
    if (warehouseCode) {
      return defaultBins.filter(b => !b.warehouseCode || b.warehouseCode.toLowerCase() === warehouseCode.toLowerCase());
    }
    return defaultBins;
  }

  public saveBin(bin: { code: string; warehouseCode?: string; zone?: string }) {
    const list = this.getBins();
    const newRecord = {
      code: bin.code.trim().toUpperCase(),
      warehouseCode: bin.warehouseCode?.trim().toUpperCase() || 'RM-WH-01',
      zone: bin.zone || 'Storage Zone',
    };

    const idx = list.findIndex(b => b.code.toLowerCase() === newRecord.code.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      memSet('reboot_erp_master_bins', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master bin', e);
    }

    adminEventBus.emit('BIN_MASTER_SAVED', newRecord);
    return newRecord;
  }

  // ==========================================
  // Task 3: BOM Versions Governance
  // ==========================================
  public getBomVersions(itemCode?: string): Array<{
    id: string;
    itemCode?: string;
    version: string;
    title: string;
    status: 'current' | 'future' | 'archived';
    effectiveFrom: string;
    changeReason?: string;
  }> {
    const defaultVersions = [
      { id: 'VER-1.0', itemCode: '', version: '1.0', title: 'v1.0 (Current Active Baseline)', status: 'current' as const, effectiveFrom: '2026-01-01', changeReason: 'Initial production release' },
      { id: 'VER-1.1', itemCode: '', version: '1.1', title: 'v1.1 (Next Minor Revision - Cycle Optimized)', status: 'future' as const, effectiveFrom: '2026-10-01', changeReason: 'ECR-842 Cooling channel adjustment' },
      { id: 'VER-1.2', itemCode: '', version: '1.2', title: 'v1.2 (Future - Multi-Cavity Tooling)', status: 'future' as const, effectiveFrom: '2026-12-01', changeReason: 'Dual runner gate tooling' },
      { id: 'VER-2.0', itemCode: '', version: '2.0', title: 'v2.0 (Major - Lightweighting & Regrind)', status: 'future' as const, effectiveFrom: '2027-01-01', changeReason: 'ECO-901 Wall thickness optimization' },
    ];
    try {
      const raw = memGet('reboot_erp_bom_versions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map(p => p.id));
          const combined = [...parsed];
          for (const d of defaultVersions) {
            if (!ids.has(d.id)) combined.push(d);
          }
          if (itemCode) {
            return combined.filter(v => !v.itemCode || v.itemCode.toLowerCase() === itemCode.toLowerCase() || v.itemCode === '');
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load BOM versions', e);
    }
    return defaultVersions;
  }

  public saveBomVersion(versionData: {
    itemCode?: string;
    version: string;
    title?: string;
    status?: 'current' | 'future' | 'archived';
    effectiveFrom?: string;
    changeReason?: string;
  }) {
    const list = this.getBomVersions();
    const cleanVer = versionData.version.trim();
    const newRecord = {
      id: `VER-${cleanVer}`,
      itemCode: versionData.itemCode?.trim() || '',
      version: cleanVer,
      title: versionData.title || `v${cleanVer} (${versionData.status === 'future' ? 'Future Release' : 'Active Engineering Revision'})`,
      status: versionData.status || 'future',
      effectiveFrom: versionData.effectiveFrom || new Date().toISOString().split('T')[0],
      changeReason: versionData.changeReason || 'Engineering change authorization',
    };

    const idx = list.findIndex(v => v.version.toLowerCase() === cleanVer.toLowerCase() && (!v.itemCode || v.itemCode === newRecord.itemCode));
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      memSet('reboot_erp_bom_versions', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save BOM version', e);
    }

    adminEventBus.emit('BOM_VERSION_SAVED', newRecord);
    return newRecord;
  }

  // ==========================================
  // Task 4: Operating Plants Governance
  // ==========================================
  public getPlants(): Array<{ id: string; code: string; name: string; location: string; type: string }> {
    const defaultPlants = [
      { id: 'PLANT-01', code: 'PLANT-01', name: 'Plant 1 — Main Injection & Extrusion Center', location: 'Hosur, Tamil Nadu', type: 'Injection & Extrusion' },
      { id: 'PLANT-02', code: 'PLANT-02', name: 'Plant 2 — High-Speed Blow Molding Facility', location: 'Manesar, Haryana', type: 'Blow Molding' },
      { id: 'PLANT-03', code: 'PLANT-03', name: 'Plant 3 — Compounding & Recycling Hub', location: 'Pune, Maharashtra', type: 'Compounding & Masterbatch' },
      { id: 'PLANT-04', code: 'PLANT-04', name: 'Plant 4 — Precision Tooling & Mold Bay', location: 'Vapi, Gujarat', type: 'Tooling & R&D' },
    ];
    try {
      const raw = memGet('reboot_erp_master_plants');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const codes = new Set(parsed.map(p => p.code.toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultPlants) {
            if (!codes.has(d.code.toLowerCase())) combined.push(d);
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load master plants', e);
    }
    return defaultPlants;
  }

  public savePlant(plant: { code: string; name: string; location?: string; type?: string }) {
    const list = this.getPlants();
    const newRecord = {
      id: plant.code.trim().toUpperCase(),
      code: plant.code.trim().toUpperCase(),
      name: plant.name.trim(),
      location: plant.location || 'Industrial Estate',
      type: plant.type || 'Manufacturing Plant',
    };

    const idx = list.findIndex(p => p.code.toLowerCase() === newRecord.code.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      memSet('reboot_erp_master_plants', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master plant', e);
    }

    adminEventBus.emit('PLANT_MASTER_SAVED', newRecord);
    return newRecord;
  }

  // ==========================================
  // Task 4: Departments & Owners Governance
  // ==========================================
  public getOwners(): Array<{ id: string; name: string; department: string; role: string }> {
    const defaultOwners = [
      { id: 'OWN-01', name: 'Engineering & Tooling', department: 'Engineering', role: 'BOM Design Authority' },
      { id: 'OWN-02', name: 'Priya Rao (Plant Operations Director)', department: 'Operations', role: 'Plant Operations Lead' },
      { id: 'OWN-03', name: 'Rajesh Kumar (Senior Mold Designer)', department: 'Tool Room', role: 'Lead Tooling Engineer' },
      { id: 'OWN-04', name: 'Dr. Evelyn Reed (Quality Assurance Lead)', department: 'Quality', role: 'Quality & Process Spec' },
      { id: 'OWN-05', name: 'Anil Sharma (Production Planner)', department: 'Planning', role: 'PPC & Routing Controller' },
      { id: 'OWN-06', name: 'R&D Product Development', department: 'R&D', role: 'New Product Introduction' },
    ];
    try {
      const raw = memGet('reboot_erp_master_owners');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = new Set(parsed.map(p => p.name.toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultOwners) {
            if (!names.has(d.name.toLowerCase())) combined.push(d);
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load master owners', e);
    }
    return defaultOwners;
  }

  public saveOwner(owner: { name: string; department?: string; role?: string }) {
    const list = this.getOwners();
    const newRecord = {
      id: `OWN-${Date.now().toString().slice(-4)}`,
      name: owner.name.trim(),
      department: owner.department || 'Engineering',
      role: owner.role || 'Process Owner',
    };

    const idx = list.findIndex(o => o.name.toLowerCase() === newRecord.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      memSet('reboot_erp_master_owners', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master owner', e);
    }

    adminEventBus.emit('OWNER_MASTER_SAVED', newRecord);
    return newRecord;
  }

  // ==========================================
  // Task 5: Routing Operations, Work Centers, Machines & Molds
  // ==========================================
  public getOperations(): Array<{ id: string; name: string; type: string; category?: string; defaultWorkCenter?: string; defaultSetupMin?: number; defaultCycleSec?: number }> {
    const defaultOps = [
      { id: 'OP-01', name: 'High-Speed Injection Molding & Degating', type: 'Primary Molding', category: 'Primary Molding', defaultWorkCenter: 'WC-INJ-01', defaultSetupMin: 45, defaultCycleSec: 25 },
      { id: 'OP-02', name: 'Laser Part Marking & 2D Barcoding', type: 'Decoration / Marking', category: 'Decoration / Marking', defaultWorkCenter: 'WC-LASER-01', defaultSetupMin: 15, defaultCycleSec: 5 },
      { id: 'OP-03', name: 'Automated Robotic Degating & Trimming', type: 'Post-Molding', category: 'Post-Molding', defaultWorkCenter: 'WC-TRIM-01', defaultSetupMin: 20, defaultCycleSec: 8 },
      { id: 'OP-04', name: 'Ultrasonic Horn Welding & Fastening', type: 'Assembly', category: 'Assembly', defaultWorkCenter: 'WC-ASSY-01', defaultSetupMin: 20, defaultCycleSec: 12 },
      { id: 'OP-05', name: 'Hot Foil Stamping & Pad Printing', type: 'Printing & Decoration', category: 'Printing & Decoration', defaultWorkCenter: 'WC-PRINT-01', defaultSetupMin: 30, defaultCycleSec: 6 },
      { id: 'OP-06', name: 'In-Line Vision Inspection & Defect Check', type: 'Quality Gate', category: 'Quality Gate', defaultWorkCenter: 'WC-QC-01', defaultSetupMin: 5, defaultCycleSec: 3 },
      { id: 'OP-07', name: 'Corrugated Case Packout & Palletizing', type: 'Final Packaging', category: 'Final Packaging', defaultWorkCenter: 'WC-PACK-01', defaultSetupMin: 10, defaultCycleSec: 5 },
    ];
    try {
      const raw = memGet('reboot_erp_master_operations');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = new Set(parsed.map(p => p.name.toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultOps) {
            if (!names.has(d.name.toLowerCase())) combined.push(d);
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load master operations', e);
    }
    return defaultOps;
  }

  public saveOperation(op: { name: string; type?: string; category?: string; defaultWorkCenter?: string; defaultSetupMin?: number; defaultCycleSec?: number }) {
    const list = this.getOperations();
    const newRecord = {
      id: `OP-${Date.now().toString().slice(-4)}`,
      name: op.name.trim(),
      type: op.type || op.category || 'Secondary Operation',
      category: op.category || op.type || 'Secondary Operation',
      defaultWorkCenter: op.defaultWorkCenter || 'WC-INJ-01',
      defaultSetupMin: op.defaultSetupMin ?? 30,
      defaultCycleSec: op.defaultCycleSec ?? 15,
    };

    const idx = list.findIndex(o => o.name.toLowerCase() === newRecord.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      memSet('reboot_erp_master_operations', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master operation', e);
    }

    adminEventBus.emit('OPERATION_MASTER_SAVED', newRecord);
    return newRecord;
  }

  public getWorkCenters(): Array<{ id: string; code: string; name: string; bay: string; plantId: string; plant?: string; ratePerHour?: number }> {
    const defaultWorkCenters = [
      { id: 'WC-INJ-01', code: 'WC-INJ-01', name: 'WC-INJ-01 - 250T Injection Bay', bay: 'Bay 1 (Presses 1-6)', plantId: 'PLANT-01', plant: 'PLANT-01', ratePerHour: 65 },
      { id: 'WC-INJ-02', code: 'WC-INJ-02', name: 'WC-INJ-02 - 450T Heavy Tonnage Bay', bay: 'Bay 2 (Presses 7-12)', plantId: 'PLANT-01', plant: 'PLANT-01', ratePerHour: 85 },
      { id: 'WC-EXT-01', code: 'WC-EXT-01', name: 'WC-EXT-01 - Pipe & Profile Extrusion Line', bay: 'Extrusion Hall A', plantId: 'PLANT-02', plant: 'PLANT-02', ratePerHour: 75 },
      { id: 'WC-BLOW-01', code: 'WC-BLOW-01', name: 'WC-BLOW-01 - Continuous Extrusion Blow Bay', bay: 'Blow Molding Hall', plantId: 'PLANT-02', plant: 'PLANT-02', ratePerHour: 70 },
      { id: 'WC-ASSY-01', code: 'WC-ASSY-01', name: 'WC-ASSY-01 - Cleanroom Ultrasonic Cell', bay: 'Class 100k Cleanroom', plantId: 'PLANT-01', plant: 'PLANT-01', ratePerHour: 55 },
      { id: 'WC-PACK-01', code: 'WC-PACK-01', name: 'WC-PACK-01 - Automated Case Packing Line', bay: 'End-of-Line Packaging', plantId: 'PLANT-01', plant: 'PLANT-01', ratePerHour: 45 },
    ];
    try {
      const raw = memGet('reboot_erp_master_workcenters');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const codes = new Set(parsed.map(p => p.code.toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultWorkCenters) {
            if (!codes.has(d.code.toLowerCase())) combined.push(d);
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load master workcenters', e);
    }
    return defaultWorkCenters;
  }

  public saveWorkCenter(wc: { code: string; name: string; bay?: string; plant?: string; plantId?: string; ratePerHour?: number }) {
    const list = this.getWorkCenters();
    const resolvedPlant = wc.plantId || wc.plant || 'PLANT-01';
    const newRecord = {
      id: wc.code.trim().toUpperCase(),
      code: wc.code.trim().toUpperCase(),
      name: wc.name.trim(),
      bay: wc.bay || 'Production Bay',
      plantId: resolvedPlant,
      plant: resolvedPlant,
      ratePerHour: wc.ratePerHour ?? 65,
    };

    const idx = list.findIndex(w => w.code.toLowerCase() === newRecord.code.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      memSet('reboot_erp_master_workcenters', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master workcenter', e);
    }

    adminEventBus.emit('WORKCENTER_MASTER_SAVED', newRecord);
    adminEventBus.emit('WORK_CENTER_MASTER_SAVED', newRecord);
    return newRecord;
  }

  public getMachines(): Array<{ id: string; code: string; name: string; brand: string; tonnage: number }> {
    const defaultMachines = [
      { id: 'MCH-ENGEL-250', code: 'IMM-250-01', name: 'IMM 250T - Line 1 (Engel Duo)', brand: 'Engel', tonnage: 250 },
      { id: 'MCH-KM-450', code: 'IMM-450-02', name: 'IMM 450T - Line 2 (KraussMaffei CX)', brand: 'KraussMaffei', tonnage: 450 },
      { id: 'MCH-TOSH-120', code: 'IMM-120-03', name: 'IMM 120T - Line 3 (Toshiba All-Electric)', brand: 'Toshiba', tonnage: 120 },
      { id: 'MCH-SUMI-180', code: 'IMM-180-04', name: 'IMM 180T - Line 4 (Sumitomo Demag)', brand: 'Sumitomo', tonnage: 180 },
      { id: 'MCH-ARBURG-320', code: 'IMM-320-05', name: 'IMM 320T - Line 5 (Arburg Allrounder)', brand: 'Arburg', tonnage: 320 },
      { id: 'MCH-HAITIAN-650', code: 'IMM-650-06', name: 'IMM 650T - Line 6 (Haitian Mars Series)', brand: 'Haitian', tonnage: 650 },
    ];
    try {
      const raw = memGet('reboot_erp_master_machines');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const codes = new Set(parsed.map(p => p.code.toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultMachines) {
            if (!codes.has(d.code.toLowerCase())) combined.push(d);
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load master machines', e);
    }
    return defaultMachines;
  }

  public saveMachine(machine: { code: string; name: string; brand?: string; tonnage?: number }) {
    const list = this.getMachines();
    const newRecord = {
      id: machine.code.trim().toUpperCase(),
      code: machine.code.trim().toUpperCase(),
      name: machine.name.trim(),
      brand: machine.brand || 'Engel',
      tonnage: machine.tonnage || 250,
    };

    const idx = list.findIndex(m => m.code.toLowerCase() === newRecord.code.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      memSet('reboot_erp_master_machines', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master machine', e);
    }

    adminEventBus.emit('MACHINE_MASTER_SAVED', newRecord);
    return newRecord;
  }

  public getMolds(): Array<{ id: string; code: string; name: string; cavities: number; runnerType: string }> {
    const defaultMolds = [
      { id: 'MOLD-084', code: 'MOLD-INJ-084', name: 'MOLD-INJ-084 (4-Cavity Hot Runner Bumper)', cavities: 4, runnerType: 'Hot Runner (Valve Gated)' },
      { id: 'MOLD-102', code: 'MOLD-INJ-102', name: 'MOLD-INJ-102 (8-Cavity Cosmetic Jar Cap)', cavities: 8, runnerType: 'Hot Runner' },
      { id: 'MOLD-055', code: 'MOLD-INJ-055', name: 'MOLD-INJ-055 (2-Cavity Automotive Grille)', cavities: 2, runnerType: 'Cold Runner (3-Plate)' },
      { id: 'MOLD-019', code: 'MOLD-INJ-019', name: 'MOLD-INJ-019 (16-Cavity Medical Luer Lock)', cavities: 16, runnerType: 'Hot Half System' },
      { id: 'MOLD-140', code: 'MOLD-INJ-140', name: 'MOLD-INJ-140 (1-Cavity Instrument Panel Housing)', cavities: 1, runnerType: 'Sequential Valve Gated' },
    ];
    try {
      const raw = memGet('reboot_erp_master_molds');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const codes = new Set(parsed.map(p => p.code.toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultMolds) {
            if (!codes.has(d.code.toLowerCase())) combined.push(d);
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load master molds', e);
    }
    return defaultMolds;
  }

  public saveMold(mold: { code: string; name: string; cavities?: number; runnerType?: string }) {
    const list = this.getMolds();
    const newRecord = {
      id: mold.code.trim().toUpperCase(),
      code: mold.code.trim().toUpperCase(),
      name: mold.name.trim(),
      cavities: mold.cavities || 4,
      runnerType: mold.runnerType || 'Hot Runner',
    };

    const idx = list.findIndex(m => m.code.toLowerCase() === newRecord.code.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      memSet('reboot_erp_master_molds', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master mold', e);
    }

    adminEventBus.emit('MOLD_MASTER_SAVED', newRecord);
    return newRecord;
  }

  // ==========================================
  // Task 6: Runner Scrap & Purge Lumps Categories Governance
  // ==========================================
  public getRunnerScrapCategories(): Array<{ id: string; name: string; description: string; recoveryPct: number }> {
    const defaultScrap = [
      { id: 'SCRAP-01', name: 'Runner Scrap - Granulated (Grade A Virgin Regrind)', description: 'Clean virgin cold runner reground immediately at press', recoveryPct: 15 },
      { id: 'SCRAP-02', name: 'Hot Runner Sprues & Drops (Pre-Sorted)', description: 'High-purity hot runner drops for direct closed-loop hopper feed', recoveryPct: 20 },
      { id: 'SCRAP-03', name: 'Mixed Color Runner Regrind (Grade B Industrial)', description: 'Blended color regrind suitable for black/opaque secondary utility parts', recoveryPct: 10 },
      { id: 'SCRAP-04', name: 'Degated Automotive PP Parting Runner Scrap', description: 'Impact-modified polyolefin runners with UV stabilizers', recoveryPct: 12 },
    ];
    try {
      const raw = memGet('reboot_erp_runner_scrap_categories');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = new Set(parsed.map(p => p.name.toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultScrap) {
            if (!names.has(d.name.toLowerCase())) combined.push(d);
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load runner scrap categories', e);
    }
    return defaultScrap;
  }

  public saveRunnerScrapCategory(cat: { name: string; description?: string; recoveryPct?: number }) {
    const list = this.getRunnerScrapCategories();
    const newRecord = {
      id: `SCRAP-${Date.now().toString().slice(-4)}`,
      name: cat.name.trim(),
      description: cat.description || 'Plastic regrind recovery category',
      recoveryPct: cat.recoveryPct ?? 15,
    };

    const idx = list.findIndex(c => c.name.toLowerCase() === newRecord.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      memSet('reboot_erp_runner_scrap_categories', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save runner scrap category', e);
    }

    adminEventBus.emit('RUNNER_SCRAP_SAVED', newRecord);
    return newRecord;
  }

  public getPurgeLumpsCategories(): Array<{ id: string; name: string; description: string; polymerType: string }> {
    const defaultPurge = [
      { id: 'PURGE-01', name: 'Purge Lumps - Re-shredded (Heavy Shredder Feed)', description: 'Barrel purge chunks ground through heavy granulator', polymerType: 'Polypropylene (PP)' },
      { id: 'PURGE-02', name: 'Color Changeover Purge Waste (Extruder Purge Compound)', description: 'Chemical purging compound purge patties', polymerType: 'HDPE / CleanPurge' },
      { id: 'PURGE-03', name: 'Startup Thermal Transition Purge (Degraded Melt)', description: 'Initial thermal start-up resin blocks', polymerType: 'Engineering Resin (ABS / PA66)' },
      { id: 'PURGE-04', name: 'High-MFI Clear Purge Cake (Recycle Granulation)', description: 'Clear optical polymer purge for reprocessing', polymerType: 'Polycarbonate / PMMA' },
    ];
    try {
      const raw = memGet('reboot_erp_purge_lumps_categories');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = new Set(parsed.map(p => p.name.toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultPurge) {
            if (!names.has(d.name.toLowerCase())) combined.push(d);
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load purge lumps categories', e);
    }
    return defaultPurge;
  }

  public savePurgeLumpsCategory(cat: { name: string; description?: string; polymerType?: string }) {
    const list = this.getPurgeLumpsCategories();
    const newRecord = {
      id: `PURGE-${Date.now().toString().slice(-4)}`,
      name: cat.name.trim(),
      description: cat.description || 'Barrel purging lump scrap category',
      polymerType: cat.polymerType || 'Polypropylene (PP)',
    };

    const idx = list.findIndex(c => c.name.toLowerCase() === newRecord.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      memSet('reboot_erp_purge_lumps_categories', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save purge lumps category', e);
    }

    adminEventBus.emit('PURGE_LUMPS_SAVED', newRecord);
    return newRecord;
  }

  // ==========================================
  // Task 4: Warehouse Stock Adjustment Reasons Governance
  // ==========================================
  public getAdjustmentReasons(includeInactive: boolean = false): Array<{
    id: string;
    code: string;
    title: string;
    description: string;
    department: string;
    subCategory: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    isActive: boolean;
    defaultAction: string;
  }> {
    const defaultReasons: Array<{
      id: string;
      code: string;
      title: string;
      description: string;
      department: string;
      subCategory: string;
      severity: 'Low' | 'Medium' | 'High' | 'Critical';
      isActive: boolean;
      defaultAction: string;
    }> = [
      {
        id: 'RSN-ADJ-01',
        code: 'ADJ-CYCLE-VAR',
        title: 'Physical Count Cycle Variance',
        description: 'Routine monthly physical cycle count variance reconciliation',
        department: 'Warehouse',
        subCategory: 'Stock Adjustment',
        severity: 'Medium',
        isActive: true,
        defaultAction: 'Post Ledger Variance',
      },
      {
        id: 'RSN-ADJ-02',
        code: 'ADJ-SPILLAGE',
        title: 'Hopper / Conveying Spillage Write-off',
        description: 'Pneumatic conveying line leak or vacuum receiver overflow',
        department: 'Production',
        subCategory: 'Stock Adjustment',
        severity: 'Low',
        isActive: true,
        defaultAction: 'Write-off to Regrind Bay',
      },
      {
        id: 'RSN-ADJ-03',
        code: 'ADJ-LAB-SAMPLE',
        title: 'Lab Moisture & MFI Sample Consumption',
        description: 'Polymer QA lab testing and Karl Fischer moisture titration',
        department: 'Quality',
        subCategory: 'Stock Adjustment',
        severity: 'Low',
        isActive: true,
        defaultAction: 'Charge to Quality Testing Expense',
      },
      {
        id: 'RSN-ADJ-04',
        code: 'ADJ-GRN-CORR',
        title: 'Manual GRN Correction',
        description: 'Receiving dock scale tare weight adjustment or invoice mismatch',
        department: 'Warehouse',
        subCategory: 'Stock Adjustment',
        severity: 'Medium',
        isActive: true,
        defaultAction: 'Correct Dock Inward Ledger',
      },
      {
        id: 'RSN-ADJ-05',
        code: 'ADJ-SCRAP-CONV',
        title: 'Purge Cake Shredder Conversion',
        description: 'Heavy purge patties transferred to heavy regrind granulator',
        department: 'Production',
        subCategory: 'Stock Adjustment',
        severity: 'Low',
        isActive: true,
        defaultAction: 'Credit Regrind Stock',
      },
      {
        id: 'RSN-ADJ-06',
        code: 'ADJ-DAMAGED-BAG',
        title: 'Forklift Puncture / Damaged Bag Disposal',
        description: 'Damaged resin pallet bag during high-bay warehouse movement',
        department: 'Warehouse',
        subCategory: 'Stock Adjustment',
        severity: 'High',
        isActive: true,
        defaultAction: 'Quarantine & Salvage',
      },
    ];

    try {
      const raw = memGet('reboot_erp_master_reason_codes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with defaults
          const existingCodes = new Set(parsed.map((p: any) => (p.title || p.code || '').toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultReasons) {
            if (!existingCodes.has(d.title.toLowerCase()) && !existingCodes.has(d.code.toLowerCase())) {
              combined.push(d);
            }
          }
          if (includeInactive) return combined;
          return combined.filter((r: any) => r.isActive !== false);
        }
      }
    } catch (e) {
      console.warn('Failed to load adjustment reason codes', e);
    }

    if (includeInactive) return defaultReasons;
    return defaultReasons.filter((r) => r.isActive !== false);
  }

  public saveAdjustmentReason(reason: {
    id?: string;
    code?: string;
    title: string;
    description?: string;
    department?: string;
    subCategory?: string;
    severity?: 'Low' | 'Medium' | 'High' | 'Critical';
    isActive?: boolean;
    defaultAction?: string;
  }) {
    const list = this.getAdjustmentReasons(true);
    const cleanTitle = reason.title.trim();
    const cleanCode = reason.code?.trim().toUpperCase() || `ADJ-${cleanTitle.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 12)}`;
    
    const newRecord = {
      id: reason.id || `RSN-${Date.now().toString().slice(-5)}`,
      code: cleanCode,
      title: cleanTitle,
      description: reason.description || 'Warehouse inventory adjustment reason code',
      department: reason.department || 'Warehouse',
      subCategory: reason.subCategory || 'Stock Adjustment',
      severity: reason.severity || 'Medium',
      isActive: reason.isActive ?? true,
      defaultAction: reason.defaultAction || 'Post Ledger Adjustment',
    };

    const idx = list.findIndex(
      (r) => r.id === newRecord.id || r.code.toLowerCase() === newRecord.code.toLowerCase() || r.title.toLowerCase() === newRecord.title.toLowerCase()
    );

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...newRecord };
    } else {
      list.unshift(newRecord);
    }

    try {
      memSet('reboot_erp_master_reason_codes', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save adjustment reason code', e);
    }

    adminEventBus.emit('REASON_CODES_UPDATED', list);
    return newRecord;
  }

  public toggleAdjustmentReasonActive(id: string, isActive: boolean) {
    const list = this.getAdjustmentReasons(true);
    const idx = list.findIndex((r) => r.id === id || r.code === id);
    if (idx >= 0) {
      list[idx].isActive = isActive;
      try {
        memSet('reboot_erp_master_reason_codes', JSON.stringify(list));
      } catch (e) {
        console.warn('Failed to save toggled reason code', e);
      }
      adminEventBus.emit('REASON_CODES_UPDATED', list);
      return list[idx];
    }
    return null;
  }

  // ==========================================
  // Task 1: Autocomplete & Admin Master Catalog Options
  // ==========================================
  private getStoredList(key: string, defaults: string[]): string[] {
    try {
      const raw = memGet(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const set = new Set([...parsed, ...defaults]);
          return Array.from(set);
        }
      }
    } catch (e) {
      console.warn(`Failed to load stored list for ${key}`, e);
    }
    return defaults;
  }

  private saveStoredList(key: string, item: string, defaults: string[]): string[] {
    const clean = item.trim();
    if (!clean) return this.getStoredList(key, defaults);
    const list = this.getStoredList(key, defaults);
    if (!list.some(x => x.toLowerCase() === clean.toLowerCase())) {
      list.unshift(clean);
      try {
        memSet(key, JSON.stringify(list));
      } catch (e) {
        console.warn(`Failed to save item to ${key}`, e);
      }
      const storageToApiKey: Record<string, string> = {
        reboot_erp_catalog_categories: 'categories',
        reboot_erp_catalog_item_groups: 'itemGroups',
        reboot_erp_catalog_uoms: 'uoms',
        reboot_erp_catalog_plant_scopes: 'plantScopes',
        reboot_erp_catalog_resin_types: 'resinTypes',
        reboot_erp_catalog_colors: 'colors',
        reboot_erp_catalog_compliance_mandates: 'complianceMandates',
        reboot_erp_catalog_testing_labs: 'testingLabs',
        reboot_erp_catalog_packing_standards: 'packingStandards',
        reboot_erp_catalog_processing_methods: 'processingMethods',
        reboot_erp_catalog_sampling_plans: 'samplingPlans',
        reboot_erp_catalog_pricing_tiers: 'pricingTiers',
        reboot_erp_catalog_workflow_routes: 'workflowRoutes',
      };
      if (storageToApiKey[key]) {
        this.persistOptionToApi(storageToApiKey[key], clean);
      }
      adminEventBus.emit('MASTER_OPTIONS_UPDATED', { key, item: clean });
    }
    return list;
  }

  public getCategories(): string[] {
    return this.getStoredList('reboot_erp_catalog_categories', [
      'Automotive Exterior',
      'Automotive Interior Trim',
      'Under-the-Hood Technical Components',
      'Virgin Raw Polymer',
      'Polypropylene Copolymer',
      'HDPE Blow Grade',
      'Color Masterbatch',
      'Additives & Pigments',
      'Black Masterbatch',
      'Regrind PP Reprocessed',
      'Molded Automotive Parts',
      'Packaging Materials',
      'Mold & Machine Spares',
      'Injection Mold Dies',
      'OEM Tier-1 Customer Component',
      'Pharma Cleanroom Packaging',
    ]);
  }

  public saveCategory(category: string): string[] {
    return this.saveStoredList('reboot_erp_catalog_categories', category, this.getCategories());
  }

  public getItemGroups(): string[] {
    return this.getStoredList('reboot_erp_catalog_item_groups', [
      'Automotive Assemblies',
      'Polymer Feedstock',
      'Colorants & Additives',
      'Precision Moldings',
      'Fluid Management Parts',
      'Extrusion Profiles',
      'Blow Molded Bottles & Containers',
      'Pharma Closures & Caps',
      'Tooling & Mold Spares',
      'Corrugated & Returnable Packaging',
      'General Catalog',
    ]);
  }

  public saveItemGroup(group: string): string[] {
    return this.saveStoredList('reboot_erp_catalog_item_groups', group, this.getItemGroups());
  }

  public getUoms(): string[] {
    return this.getStoredList('reboot_erp_catalog_uoms', [
      'Numbers (PCS)',
      'Kilograms (KG)',
      'Sets (SET)',
      'Meters (MTR)',
      'Liters (LTR)',
      'Boxes (BOX)',
      'Metric Ton (MT)',
      'Grams (GMS)',
      'Shots (SHOT)',
    ]);
  }

  public saveUom(uom: string): string[] {
    return this.saveStoredList('reboot_erp_catalog_uoms', uom, this.getUoms());
  }

  public getPlantScopes(): string[] {
    return this.getStoredList('reboot_erp_catalog_plant_scopes', [
      'All Plants (Global)',
      'Plant 01 — Pune / Chakan Hub',
      'Plant 02 — Sanand Precision Polymers',
      'Plant 03 — Chennai Auto Component Unit',
      'Plant 04 — Baddi Pharma Cleanroom Unit',
      'Pune & Sanand Units',
      'Chennai Molding Only',
      'Baddi Cleanroom Only',
    ]);
  }

  public savePlantScope(scope: string): string[] {
    return this.saveStoredList('reboot_erp_catalog_plant_scopes', scope, this.getPlantScopes());
  }

  public getResinTypes(): string[] {
    return this.getStoredList('reboot_erp_catalog_resin_types', [
      'Impact Copolymer PP + 15% EPDM',
      'Polypropylene Homopolymer (PP-H)',
      'Polypropylene Random Copolymer (PP-R)',
      'ABS High-Impact Terpolymer',
      'Polyamide 66 + 30% Glass Filled (PA66-GF30)',
      'High-Density Polyethylene (HDPE Blow Grade)',
      'Polycarbonate (PC Optical Grade)',
      'Polycarbonate / ABS Alloy (PC+ABS)',
      'Polyoxymethylene / Acetal (POM Delrin)',
      'Thermoplastic Elastomer (TPE / TPO)',
      'PET Bottle & Preform Resin',
    ]);
  }

  public saveResinType(resin: string): string[] {
    return this.saveStoredList('reboot_erp_catalog_resin_types', resin, this.getResinTypes());
  }

  public getColors(): string[] {
    return this.getStoredList('reboot_erp_catalog_colors', [
      'Midnight Black / Painted Gloss',
      'Natural / Translucent Milky',
      'Carbon Black (Jet Black RAL 9005)',
      'Signal Red (RAL 3001)',
      'Traffic White (RAL 9016)',
      'Silver Metallic Gloss',
      'Anthracite Grey (RAL 7016)',
      'Cobalt Blue (RAL 5013)',
      'Medical Clear High-Transparency',
      'Custom OEM Matched Shade',
    ]);
  }

  public saveColor(color: string): string[] {
    return this.saveStoredList('reboot_erp_catalog_colors', color, this.getColors());
  }

  public getComplianceMandates(): string[] {
    return this.getStoredList('reboot_erp_catalog_compliance_mandates', [
      'RoHS, REACH, UL-94 HB, PPAP Level-3',
      'RoHS 3 (EU 2015/863) & REACH SVHC Compliant',
      'UL-94 V0 Flame Retardant Certified',
      'FDA 21 CFR 177.1520 Food Contact Safe',
      'ISO 10993 Medical Biocompatibility Class VI',
      'IATF 16949 Automotive OEM Specific Mandate',
      'IMDS (International Material Data System) Registered',
      'Bisphenol-A (BPA) & Phthalate Free Declaration',
    ]);
  }

  public saveComplianceMandate(mandate: string): string[] {
    return this.saveStoredList('reboot_erp_catalog_compliance_mandates', mandate, this.getComplianceMandates());
  }

  public getTestingLabs(): string[] {
    return this.getStoredList('reboot_erp_catalog_testing_labs', [
      'In-House Spectrophotometer & MFI Lab',
      'CIPET Central Institute of Petrochemicals Testing',
      'TUV Rheinland Polymer & Plastics Testing Center',
      'SGS India Automotive Materials Laboratory',
      'Intertek Polymeric Physical & Thermal Testing',
      'UL India Flame & Electrical Safety Testing Lab',
      'ARAI Automotive Research Association of India',
    ]);
  }

  public saveTestingLab(lab: string): string[] {
    return this.saveStoredList('reboot_erp_catalog_testing_labs', lab, this.getTestingLabs());
  }

  public getPackingStandards(): string[] {
    return this.getStoredList('reboot_erp_catalog_packing_standards', [
      '25 KG Moisture Barrier Paper Bags with PE Liner',
      'Returnable PP Corrugated Totes with Honeycomb Divider Cells',
      'Export Heavy Duty Pallet Box with VCI Anti-Corrosion Liner',
      'Corrugated Master Carton (50 Pcs / Box) with Bubble Wrap',
      'Cleanroom Sealed Double PE Bags in Anti-Static Cartons',
      'Octabin Bulk Polymer Gaylord Container (1,000 KG)',
      'Individual Thermoformed Blister Pack on 4-Way Wooden Pallet',
    ]);
  }

  public savePackingStandard(pkg: string): string[] {
    return this.saveStoredList('reboot_erp_catalog_packing_standards', pkg, this.getPackingStandards());
  }

    public getProcessingMethods(): string[] {
    return this.getStoredList('reboot_erp_catalog_processing_methods', [
      'Injection Molding',
      'Extrusion Blow Molding',
      'Sheet Extrusion',
      'Thermoforming',
      'Compression Molding',
      'Rotational Molding',
      'Insert Molding',
      'Two-Shot / Overmolding',
    ]);
  }

  public saveProcessingMethod(method: string): string[] {
    this.persistOptionToApi('processingMethods', method);
    return this.saveStoredList('reboot_erp_catalog_processing_methods', method, this.getProcessingMethods());
  }

  public getSamplingPlans(): string[] {
    return this.getStoredList('reboot_erp_catalog_sampling_plans', [
      'ISO 2859-1 Level II Normal',
      '100% Critical Inspection',
      'Skip-Lot Certified Vendor',
      'ISO 2859-1 Level III Tightened (AQL 0.65)',
      'Zero-Defect C=0 Sampling Plan',
    ]);
  }

  public saveSamplingPlan(plan: string): string[] {
    this.persistOptionToApi('samplingPlans', plan);
    return this.saveStoredList('reboot_erp_catalog_sampling_plans', plan, this.getSamplingPlans());
  }

  public getPricingTiers(): string[] {
    return this.getStoredList('reboot_erp_catalog_pricing_tiers', [
      'Tier 1 OEM Standard',
      'Tier 2 Volume Discount',
      'Distributor Bracket',
      'Export FOB Contract Matrix',
      'Spot Market Resin Index Linked',
    ]);
  }

  public savePricingTier(tier: string): string[] {
    this.persistOptionToApi('pricingTiers', tier);
    return this.saveStoredList('reboot_erp_catalog_pricing_tiers', tier, this.getPricingTiers());
  }

  public getWorkflowRoutes(): string[] {
    return this.getStoredList('reboot_erp_catalog_workflow_routes', [
      'Multi-Tier: Engineering Author -> QA Lead -> Plant Operations Manager',
      'Direct Release: QA Director Immediate Approval',
      'Standard Procurement: Sourcing Lead -> Finance Controller',
      'Automotive PPAP Gate: Tooling Lead -> IQC Head -> Plant Director',
    ]);
  }

  public saveWorkflowRoute(route: string): string[] {
    this.persistOptionToApi('workflowRoutes', route);
    return this.saveStoredList('reboot_erp_catalog_workflow_routes', route, this.getWorkflowRoutes());
  }

  public getBomClasses(): string[] {
    return this.getStoredList('reboot_erp_catalog_bom_classes', [
      'Manufacturing BOM',
      'Engineering BOM',
      'Packaging BOM',
      'Pilot/Prototype BOM',
    ]);
  }

  public saveBomClass(bomClass: string): string[] {
    this.persistOptionToApi('bomClasses', bomClass);
    const updated = this.saveStoredList('reboot_erp_catalog_bom_classes', bomClass, this.getBomClasses());
    adminEventBus.emit('BOM_CLASS_SAVED', bomClass);
    return updated;
  }

  public persistOptionToApi(apiKey: string, value: string): void {
    const clean = (value || '').trim();
    if (!clean) return;
    api.post('/master-data/options', { key: apiKey, value: clean }).catch(() => {});
  }

  public async syncFromApi(): Promise<void> {
    try {
      const res: any = await api.get('/master-data/options');
      const data = res?.data || res;
      if (!data || typeof data !== 'object') return;
      const keyMap: Record<string, string> = {
        categories: 'reboot_erp_catalog_categories',
        itemGroups: 'reboot_erp_catalog_item_groups',
        uoms: 'reboot_erp_catalog_uoms',
        plantScopes: 'reboot_erp_catalog_plant_scopes',
        resinTypes: 'reboot_erp_catalog_resin_types',
        colors: 'reboot_erp_catalog_colors',
        complianceMandates: 'reboot_erp_catalog_compliance_mandates',
        testingLabs: 'reboot_erp_catalog_testing_labs',
        packingStandards: 'reboot_erp_catalog_packing_standards',
        processingMethods: 'reboot_erp_catalog_processing_methods',
        samplingPlans: 'reboot_erp_catalog_sampling_plans',
        pricingTiers: 'reboot_erp_catalog_pricing_tiers',
        workflowRoutes: 'reboot_erp_catalog_workflow_routes',
        bomClasses: 'reboot_erp_catalog_bom_classes',
      };
      let changed = false;
      for (const [apiKey, storageKey] of Object.entries(keyMap)) {
        const arr = data[apiKey];
        if (Array.isArray(arr) && arr.length > 0) {
          const existingRaw = memGet(storageKey);
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          const merged = Array.from(new Set([...arr, ...(Array.isArray(existing) ? existing : [])]));
          memSet(storageKey, JSON.stringify(merged));
          changed = true;
        }
      }
      const jsonObjMap: Record<string, { storageKey: string; idField: string; eventName: string }> = {
        bomVersions: { storageKey: 'reboot_erp_bom_versions', idField: 'id', eventName: 'BOM_VERSION_SAVED' },
        bomPlants: { storageKey: 'reboot_erp_master_plants', idField: 'code', eventName: 'PLANT_MASTER_SAVED' },
        bomOwners: { storageKey: 'reboot_erp_master_owners', idField: 'name', eventName: 'OWNER_MASTER_SAVED' },
      };
      for (const [apiKey, cfg] of Object.entries(jsonObjMap)) {
        const rawArr = data[apiKey];
        if (Array.isArray(rawArr) && rawArr.length > 0) {
          const existingRaw = memGet(cfg.storageKey);
          const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
          const byId = new Map<string, any>();
          existing.forEach((item) => {
            if (item && item[cfg.idField]) byId.set(String(item[cfg.idField]).toLowerCase(), item);
          });
          rawArr.forEach((strOrObj: any) => {
            try {
              const parsed = typeof strOrObj === 'string' ? JSON.parse(strOrObj) : strOrObj;
              if (parsed && parsed[cfg.idField]) {
                byId.set(String(parsed[cfg.idField]).toLowerCase(), parsed);
              }
            } catch {}
          });
          memSet(cfg.storageKey, JSON.stringify(Array.from(byId.values())));
          adminEventBus.emit(cfg.eventName, {});
          changed = true;
        }
      }
      if (changed) {
        adminEventBus.emit('MASTER_OPTIONS_UPDATED', data);
      }
    } catch (_) {}
  }

// ==========================================
  // Task 3: BOM Recipe Unique Identification Number Linked with Version Code
  // Algorithm: Last 4 digits from item code + Description first letter & middle word first letter + version
  // ==========================================
  public generateFormulaRecipeId(
    itemCode: string = '',
    itemName: string = '',
    version: string = '1.0'
  ): string {
    // 1. Last 4 digits from item code
    const digitsOnly = (itemCode || '').replace(/\D/g, '');
    let last4Digits = digitsOnly.length >= 4 ? digitsOnly.slice(-4) : '';
    if (!last4Digits) {
      const alphanumeric = (itemCode || '').replace(/[^A-Za-z0-9]/g, '');
      last4Digits = alphanumeric.slice(-4).padStart(4, '0').toUpperCase();
    } else if (last4Digits.length < 4) {
      last4Digits = last4Digits.padStart(4, '0');
    }

    // 2. First letter + Middle word first letter from description/name
    const cleanName = (itemName || itemCode || 'Product').trim();
    const words = cleanName.split(/[\s\-_/]+/).filter(Boolean);
    const firstLetter = words[0]?.[0]?.toUpperCase() || 'F';
    const midWordIndex = Math.floor(words.length / 2);
    const midLetter = (words.length > 1 ? words[midWordIndex]?.[0] : (words[0]?.[1] || 'R')).toUpperCase();
    const descAbbr = `${firstLetter}${midLetter}`;

    // 3. Clean version string (e.g. 1.0 or 2.1)
    const cleanVersion = (version || '1.0').trim().replace(/^[vV]+/, '');

    return `FRM-${descAbbr}${last4Digits}-v${cleanVersion}`;
  }

  public generateLinkedRecipeCode(
    version: string,
    components: Array<{ item?: string; name?: string; percentage?: number; dosageRate?: string; qty?: number }> = []
  ): {
    recipeUid: string;
    version: string;
    totalPercentage: number;
    isBalanced: boolean;
    formulaSummary: string;
    materialCodes: string[];
  } {
    const cleanVer = (version || '1.0').trim().replace(/^[vV]/, '');
    
    // Calculate total material formulation percentage
    let totalPercentage = 0;
    const materialTokens: string[] = [];

    components.forEach((c) => {
      const pct = c.percentage !== undefined 
        ? Number(c.percentage) 
        : c.dosageRate 
        ? parseFloat(c.dosageRate) 
        : (Number(c.qty) || 0);
      
      totalPercentage += pct;
      const cleanName = (c.item || c.name || 'MAT').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
      materialTokens.push(`${Math.round(pct)}${cleanName}`);
    });

    const isBalanced = Math.abs(totalPercentage - 100) < 0.05;
    const roundedSum = Math.round(totalPercentage);

    // Simple deterministic checksum hash based on materials + version + sum
    const hashInput = `${cleanVer}:${roundedSum}:${materialTokens.join('-')}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
        hash = ((hash << 5) - hash) + hashInput.charCodeAt(i);
      hash |= 0;
    }
    const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(-4);

    const recipeUid = `RCP-SUM${roundedSum}-v${cleanVer}-${hexHash}`;
    const formulaSummary = components.length > 0
      ? components.map(c => {
          const val = c.percentage !== undefined ? c.percentage : c.dosageRate ? parseFloat(c.dosageRate) : c.qty;
          return `${val}% ${(c.item || c.name || 'Material').split(' ')[0]}`;
        }).join(' + ') + ` = ${totalPercentage.toFixed(1)}%`
      : `0% Material Sum (Pending formulation)`;

    return {
      recipeUid,
      version: `v${cleanVer}`,
      totalPercentage: Number(totalPercentage.toFixed(2)),
      isBalanced,
      formulaSummary,
      materialCodes: materialTokens,
    };
  }
  public getGovernancePermissions(): MasterDataGovernancePermissions {
    const defaultPerms: MasterDataGovernancePermissions = {
      canCreateItemRoles: ['admin', 'super_admin', 'engineering_manager', 'plant_operations_director'],
      canEditItemRoles: ['admin', 'super_admin', 'engineering_manager'],
      canApproveItemRoles: ['admin', 'super_admin', 'quality_director', 'qa_lead'],
      canDeleteItemRoles: ['admin', 'super_admin'],
      canCreateBomRoles: ['admin', 'super_admin', 'tooling_lead', 'engineering_manager'],
      canEditBomRoles: ['admin', 'super_admin', 'tooling_lead', 'engineering_manager'],
      canApproveBomRoles: ['admin', 'super_admin', 'plant_operations_director'],
      canDeleteBomRoles: ['admin', 'super_admin'],
    };

    try {
      const raw = memGet('reboot_erp_master_governance_permissions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return { ...defaultPerms, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to load governance permissions', e);
    }
    return defaultPerms;
  }

  public saveGovernancePermissions(
    perms: Partial<MasterDataGovernancePermissions>
  ): MasterDataGovernancePermissions {
    const current = this.getGovernancePermissions();
    const updated = { ...current, ...perms };
    try {
      memSet('reboot_erp_master_governance_permissions', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save governance permissions', e);
    }
    adminEventBus.emit('GOVERNANCE_PERMISSIONS_SAVED', updated);
    return updated;
  }

  public canUserPerformAction(
    action: 'create_item' | 'edit_item' | 'approve_item' | 'delete_item' | 'create_bom' | 'edit_bom' | 'approve_bom' | 'delete_bom',
    userRole?: string
  ): boolean {
    const roleKey = (userRole || 'admin').toLowerCase().trim().replace(/[\s-]+/g, '_');
    // Super Admin and Admin have complete unrestricted authority
    if (
      roleKey.includes('admin') ||
      roleKey.includes('super_admin') ||
      roleKey.includes('director') ||
      roleKey === 'root'
    ) {
      return true;
    }

    const perms = this.getGovernancePermissions();
    let allowedList: string[] = [];

    switch (action) {
      case 'create_item':
        allowedList = perms.canCreateItemRoles;
        break;
      case 'edit_item':
        allowedList = perms.canEditItemRoles;
        break;
      case 'approve_item':
        allowedList = perms.canApproveItemRoles;
        break;
      case 'delete_item':
        allowedList = perms.canDeleteItemRoles;
        break;
      case 'create_bom':
        allowedList = perms.canCreateBomRoles;
        break;
      case 'edit_bom':
        allowedList = perms.canEditBomRoles;
        break;
      case 'approve_bom':
        allowedList = perms.canApproveBomRoles;
        break;
      case 'delete_bom':
        allowedList = perms.canDeleteBomRoles || ['admin', 'super_admin'];
        break;
    }

    return allowedList.some((allowed) => {
      const cleanAllowed = allowed.toLowerCase().trim().replace(/[\s-]+/g, '_');
      return roleKey.includes(cleanAllowed) || cleanAllowed.includes(roleKey);
    });
  }

  // ==========================================
  // Task 2: Master Data CRUD Change Requests & Admin Approval Gate
  // ==========================================
  public getChangeRequests(status?: 'pending' | 'approved' | 'rejected'): MasterDataChangeRequest[] {
    try {
      const raw = memGet('reboot_erp_master_data_change_requests');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          if (status) {
            return parsed.filter((r) => r.status === status);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load change requests', e);
    }
    return [];
  }

  public submitChangeRequest(req: {
    requestType: 'CREATE' | 'UPDATE' | 'DELETE';
    entityType?: 'ITEM_MASTER' | 'BOM_MASTER' | 'MACHINE_MASTER';
    itemCode: string;
    itemName: string;
    requestedBy: string;
    userRole: string;
    reason: string;
    payload?: any;
    currentSnapshot?: any;
  }): MasterDataChangeRequest {
    const list = this.getChangeRequests();
    const newRequest: MasterDataChangeRequest = {
      id: `CRQ-${Date.now().toString().slice(-6)}`,
      requestType: req.requestType,
      entityType: req.entityType || 'ITEM_MASTER',
      itemCode: req.itemCode.trim().toUpperCase(),
      itemName: req.itemName.trim(),
      requestedBy: req.requestedBy || 'Shopfloor User',
      userRole: req.userRole || 'operator',
      requestedAt: new Date().toISOString(),
      status: 'pending',
      reason: req.reason || 'User requested master data modification',
      payload: req.payload,
      currentSnapshot: req.currentSnapshot,
    };

    list.unshift(newRequest);
    try {
      memSet('reboot_erp_master_data_change_requests', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save change request', e);
    }

    this.recordAudit({
      entityType: req.entityType || 'ITEM_MASTER',
      entityCode: req.itemCode,
      entityName: req.itemName,
      action: req.requestType === 'CREATE' ? 'CREATE' : req.requestType === 'UPDATE' ? 'UPDATE' : 'DELETE',
      changedBy: req.requestedBy,
      userRole: req.userRole,
      changeSummary: `Submitted ${req.requestType} change request for ${req.itemCode} (Pending Admin Approval). Reason: ${req.reason}`,
    });

    adminEventBus.emit('CHANGE_REQUEST_SUBMITTED', newRequest);
    return newRequest;
  }

  public approveChangeRequest(
    requestId: string,
    reviewerName: string = 'Admin',
    comment: string = 'Approved by Admin'
  ): { success: boolean; request?: MasterDataChangeRequest } {
    const list = this.getChangeRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx < 0) return { success: false };

    const target = list[idx];
    target.status = 'approved';
    target.reviewedBy = reviewerName;
    target.reviewedAt = new Date().toISOString();
    target.reviewComment = comment;

    try {
      memSet('reboot_erp_master_data_change_requests', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save approved change request', e);
    }

    this.recordAudit({
      entityType: target.entityType || 'ITEM_MASTER',
      entityCode: target.itemCode,
      entityName: target.itemName,
      action: 'APPROVE',
      changedBy: reviewerName,
      userRole: 'admin',
      changeSummary: `Admin approved ${target.requestType} request for ${target.itemCode}. ${comment}`,
    });

    adminEventBus.emit('CHANGE_REQUEST_APPROVED', target);
    return { success: true, request: target };
  }

  public rejectChangeRequest(
    requestId: string,
    reviewerName: string = 'Admin',
    comment: string = 'Rejected by Admin'
  ): { success: boolean; request?: MasterDataChangeRequest } {
    const list = this.getChangeRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx < 0) return { success: false };

    const target = list[idx];
    target.status = 'rejected';
    target.reviewedBy = reviewerName;
    target.reviewedAt = new Date().toISOString();
    target.reviewComment = comment;

    try {
      memSet('reboot_erp_master_data_change_requests', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save rejected change request', e);
    }

    this.recordAudit({
      entityType: target.entityType || 'ITEM_MASTER',
      entityCode: target.itemCode,
      entityName: target.itemName,
      action: 'REJECT',
      changedBy: reviewerName,
      userRole: 'admin',
      changeSummary: `Admin rejected ${target.requestType} request for ${target.itemCode}. Reason: ${comment}`,
    });

    adminEventBus.emit('CHANGE_REQUEST_REJECTED', target);
    return { success: true, request: target };
  }

  // ==========================================
  // Task 3: Comprehensive Audit Trail & Change Ledger
  // ==========================================
  public getAuditHistory(targetFilter?: { type?: string; code?: string }): MasterDataChangeRecord[] {
    try {
      const raw = memGet('reboot_erp_master_data_audit_records');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (targetFilter?.code) {
            const c = targetFilter.code.toLowerCase().trim();
            return parsed.filter((r) => (r.entityCode || '').toLowerCase().trim() === c);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load audit history', e);
    }
    const initial = this.getInitialAuditLogs();
    if (targetFilter?.code) {
      const c = targetFilter.code.toLowerCase().trim();
      return initial.filter((r) => (r.entityCode || '').toLowerCase().trim() === c);
    }
    return initial;
  }

  public recordAudit(record: {
    entityType: 'ITEM_MASTER' | 'BOM_MASTER' | 'PLANT' | 'ROUTING' | 'MACHINE_MASTER' | string;
    entityCode: string;
    entityName?: string;
    action: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'DELETE' | 'VERSION_RELEASE';
    changedBy: string;
    userRole?: string;
    changeSummary: string;
    raisedBy?: string;
    approvedBy?: string;
    diff?: Record<string, { before: any; after: any }>;
  }): MasterDataChangeRecord {
    const list = this.getAuditHistory();
    const newRecord: MasterDataChangeRecord = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      entityType: record.entityType,
      entityCode: record.entityCode,
      entityName: record.entityName,
      action: record.action,
      timestamp: new Date().toISOString(),
      changedBy: record.changedBy || 'System User',
      userRole: record.userRole || 'admin',
      changeSummary: record.changeSummary,
      raisedBy: record.raisedBy || record.changedBy,
      approvedBy: record.approvedBy || (record.action === 'APPROVE' ? record.changedBy : undefined),
      diff: record.diff,
    };

    list.unshift(newRecord);
    try {
      memSet('reboot_erp_master_data_audit_records', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save audit record', e);
    }

    adminEventBus.emit('AUDIT_RECORD_SAVED', newRecord);
    return newRecord;
  }

  private getInitialAuditLogs(): MasterDataChangeRecord[] {
    const now = new Date();
    const isoDate = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60000).toISOString();

    return [
      {
        id: 'AUD-991042',
        entityType: 'ITEM_MASTER',
        entityCode: '702088018012',
        entityName: 'PLASTIC INSERT - 50MM A/R PAD (HFRL) old',
        action: 'APPROVE',
        timestamp: isoDate(15),
        changedBy: 'Priya Rao (Admin Lead)',
        userRole: 'admin',
        changeSummary: 'Approved and released SKU 702088018012 with tooling MOLD-001 (1 Cavity) to live shopfloor.',
        raisedBy: 'Manoj Verma (Tooling Eng)',
        approvedBy: 'Priya Rao (Admin Lead)',
        diff: {
          approval: { before: 'pending', after: 'approved' },
          status: { before: 'pending', after: 'active' },
        },
      },
      {
        id: 'AUD-991041',
        entityType: 'ITEM_MASTER',
        entityCode: '702088018012',
        entityName: 'PLASTIC INSERT - 50MM A/R PAD (HFRL) old',
        action: 'UPDATE',
        timestamp: isoDate(45),
        changedBy: 'Manoj Verma (Tooling Eng)',
        userRole: 'engineer',
        changeSummary: 'Modified standard cycle time to 30.0s and part weight to 25.0g (Submitted for Approval Gate).',
        raisedBy: 'Manoj Verma (Tooling Eng)',
        diff: {
          cycleTime: { before: 28.0, after: 30.0 },
          shotWeightGrams: { before: 23.5, after: 25.0 },
        },
      },
      {
        id: 'AUD-991038',
        entityType: 'ITEM_MASTER',
        entityCode: '708027010001',
        entityName: 'ARMPAD INSERT - 50MM(HFRL)',
        action: 'APPROVE',
        timestamp: isoDate(120),
        changedBy: 'Priya Rao (Admin Lead)',
        userRole: 'admin',
        changeSummary: 'Approved new Finished Good SKU 708027010001 under UNO MINDA P-II routing.',
        raisedBy: 'Sunil Joshi (Production Planner)',
        approvedBy: 'Priya Rao (Admin Lead)',
        diff: {
          approval: { before: 'pending', after: 'approved' },
        },
      },
      {
        id: 'AUD-991035',
        entityType: 'ITEM_MASTER',
        entityCode: 'BOP-0018',
        entityName: 'XDCR,RECTILINEAR 150MM - 10378S15',
        action: 'CREATE',
        timestamp: isoDate(360),
        changedBy: 'Vikram Mehta (Plant Asset Lead)',
        userRole: 'maintenance',
        changeSummary: 'Registered plant asset spare part BOP-0018 with 7-day lead time.',
        raisedBy: 'Vikram Mehta (Plant Asset Lead)',
        approvedBy: 'Priya Rao (Admin Lead)',
      },
      {
        id: 'AUD-991029',
        entityType: 'ITEM_MASTER',
        entityCode: 'CON-125',
        entityName: '50mmx 25mm 1ups Avery Chromo Avery',
        action: 'APPROVE',
        timestamp: isoDate(720),
        changedBy: 'Priya Rao (Admin Lead)',
        userRole: 'admin',
        changeSummary: 'Approved consumable labeling item CON-125 for production packaging.',
        raisedBy: 'Ramesh Patel (Stores Manager)',
        approvedBy: 'Priya Rao (Admin Lead)',
      },
    ];
  }
}

export interface MasterDataChangeRequest {
  id: string;
  requestType: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'ITEM_MASTER' | 'BOM_MASTER' | 'MACHINE_MASTER';
  itemCode: string;
  itemName: string;
  requestedBy: string;
  userRole: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  payload?: any;
  currentSnapshot?: any;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface MasterDataChangeRecord {
  id: string;
  entityType: 'ITEM_MASTER' | 'BOM_MASTER' | 'PLANT' | 'ROUTING' | 'MACHINE_MASTER' | string;
  entityCode: string;
  entityName?: string;
  action: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'DELETE' | 'VERSION_RELEASE';
  timestamp: string;
  changedBy: string;
  userRole: string;
  changeSummary: string;
  raisedBy?: string;
  approvedBy?: string;
  diff?: Record<string, { before: any; after: any }>;
}

export interface MasterDataGovernancePermissions {
  canCreateItemRoles: string[];
  canEditItemRoles: string[];
  canApproveItemRoles: string[];
  canDeleteItemRoles: string[];
  canCreateBomRoles: string[];
  canEditBomRoles: string[];
  canApproveBomRoles: string[];
  canDeleteBomRoles?: string[];
}

export const masterDataGovernanceService = new MasterDataGovernanceService();


