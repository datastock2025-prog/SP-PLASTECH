import { MasterDataRecord, mockMasterDataRecords } from '../data/mockAdminExtendedData';
import { adminEventBus } from './adminService';

const STORAGE_KEY = 'reboot_erp_master_data_governance';

function loadMasterRecords(): MasterDataRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade legacy cached records with manufacturing attributes if missing
        const upgraded = parsed.map((r: MasterDataRecord) => {
          const defaultMock = mockMasterDataRecords.find((m) => m.code === r.code);
          return {
            ...r,
            itemGroup:
              r.itemGroup ||
              defaultMock?.itemGroup ||
              (r.entityType === 'Polymer Resin Item'
                ? 'Polymer Feedstock'
                : r.entityType === 'Color Masterbatch'
                ? 'Colorants & Additives'
                : r.entityType === 'Finished Molded Component'
                ? 'Automotive Assemblies'
                : r.entityType === 'Tooling & Mold Asset'
                ? 'Tooling & Mold Spares'
                : 'General Catalog'),
            resinType: r.resinType || defaultMock?.resinType || (r.entityType === 'Polymer Resin Item' ? 'Polypropylene (PP)' : r.entityType === 'Finished Molded Component' ? 'PP Impact Copolymer' : ''),
            color: r.color || defaultMock?.color || (r.entityType === 'Color Masterbatch' ? 'Carbon Black' : 'Natural / Milky White'),
            polymerGrade: r.polymerGrade || defaultMock?.polymerGrade || '',
            mfi: r.mfi || defaultMock?.mfi || '',
            density: r.density || defaultMock?.density || '',
          };
        });
        saveMasterRecords(upgraded);
        return upgraded;
      }
    }
  } catch (err) {
    console.warn('Failed to load master data records from localStorage', err);
  }

  // Fallback to mock records with default itemGroup if missing
  const initial = mockMasterDataRecords.map((r) => ({
    ...r,
    itemGroup:
      r.itemGroup ||
      (r.entityType === 'Polymer Resin Item'
        ? 'Polymer Feedstock'
        : r.entityType === 'Color Masterbatch'
        ? 'Colorants & Additives'
        : r.entityType === 'Finished Molded Component'
        ? 'Automotive Assemblies'
        : r.entityType === 'Tooling & Mold Asset'
        ? 'Tooling & Mold Spares'
        : 'General Catalog'),
    resinType: r.resinType || (r.entityType === 'Polymer Resin Item' ? 'Polypropylene (PP)' : r.entityType === 'Finished Molded Component' ? 'PP Impact Copolymer' : ''),
    color: r.color || (r.entityType === 'Color Masterbatch' ? 'Carbon Black' : 'Natural / Milky White'),
    polymerGrade: r.polymerGrade || '',
    mfi: r.mfi || '',
    density: r.density || '',
  }));
  saveMasterRecords(initial);
  return initial;
}

function saveMasterRecords(records: MasterDataRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Failed to save master data records to localStorage', err);
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
    const clean = code.trim().toLowerCase();
    return this.cache.find((r) => r.code.trim().toLowerCase() === clean);
  }

  public searchRecords(query: string, entityTypes?: string[]): MasterDataRecord[] {
    let list = this.cache;
    if (entityTypes && entityTypes.length > 0 && !entityTypes.includes('ALL')) {
      list = list.filter((r) => entityTypes.includes(r.entityType));
    }
    if (!query || !query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.itemGroup && r.itemGroup.toLowerCase().includes(q)) ||
        (r.resinType && r.resinType.toLowerCase().includes(q)) ||
        (r.color && r.color.toLowerCase().includes(q))
    );
  }

  public saveRecord(record: Partial<MasterDataRecord> & { code: string; name: string }): MasterDataRecord {
    const existingIdx = this.cache.findIndex(
      (r) => r.code.trim().toLowerCase() === record.code.trim().toLowerCase() || (record.id && r.id === record.id)
    );

    const fullRecord: MasterDataRecord = {
      id: record.id || `MDR-${Date.now().toString().slice(-5)}`,
      entityType: record.entityType || 'Polymer Resin Item',
      code: record.code.trim().toUpperCase(),
      name: record.name.trim(),
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
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('reboot_erp_master_suppliers');
    localStorage.removeItem('reboot_erp_master_warehouses');
    localStorage.removeItem('reboot_erp_master_bins');
    this.cache = loadMasterRecords();
    adminEventBus.emit('MASTER_RECORD_SAVED', null);
  }

  // ==========================================
  // Dynamic Suppliers Governance
  // ==========================================
  public getSuppliers(): Array<{ id: string; code: string; name: string; category: string; hsnCode: string; tariffCode: string; moq: number; leadTimeDays: number; paymentTerms: string }> {
    const defaultSuppliers = [
      { id: 'SUP-001', code: 'SUP-REL-01', name: 'Reliance Polymers Ltd', category: 'Virgin Resin', hsnCode: '39021000', tariffCode: '3902.10.00', moq: 5000, leadTimeDays: 7, paymentTerms: 'Net 30 Days' },
      { id: 'SUP-002', code: 'SUP-SUP-02', name: 'Supreme Petrochem Ltd', category: 'Virgin Resin', hsnCode: '39031100', tariffCode: '3903.11.00', moq: 2000, leadTimeDays: 5, paymentTerms: 'Net 30 Days' },
      { id: 'SUP-003', code: 'SUP-CLA-03', name: 'Clariant Masterbatches Ltd', category: 'Masterbatch & Colorants', hsnCode: '32061110', tariffCode: '3206.11.10', moq: 500, leadTimeDays: 10, paymentTerms: 'Net 45 Days' },
      { id: 'SUP-004', code: 'SUP-BASF-04', name: 'BASF Performance Polymers', category: 'Additives & Fillers', hsnCode: '38123990', tariffCode: '3812.39.90', moq: 1000, leadTimeDays: 14, paymentTerms: 'Net 60 Days' },
      { id: 'SUP-005', code: 'SUP-SABIC-05', name: 'SABIC Innovative Plastics', category: 'Virgin Resin', hsnCode: '39023000', tariffCode: '3902.30.00', moq: 3000, leadTimeDays: 12, paymentTerms: 'Net 30 Days' },
      { id: 'SUP-006', code: 'SUP-MOLD-06', name: 'Godrej Precision Tooling & Dies', category: 'Molds & Tooling', hsnCode: '84807100', tariffCode: '8480.71.00', moq: 1, leadTimeDays: 45, paymentTerms: '30% Adv, 70% Net' },
    ];
    try {
      const raw = localStorage.getItem('reboot_erp_master_suppliers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge custom with defaults avoiding duplicate codes
          const existingCodes = new Set(parsed.map(p => p.code.toLowerCase()));
          const combined = [...parsed];
          for (const d of defaultSuppliers) {
            if (!existingCodes.has(d.code.toLowerCase())) {
              combined.push(d);
            }
          }
          return combined;
        }
      }
    } catch (e) {
      console.warn('Failed to load master suppliers', e);
    }
    return defaultSuppliers;
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
      localStorage.setItem('reboot_erp_master_suppliers', JSON.stringify(list));
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
      const raw = localStorage.getItem('reboot_erp_master_warehouses');
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
      localStorage.setItem('reboot_erp_master_warehouses', JSON.stringify(list));
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
      const raw = localStorage.getItem('reboot_erp_master_bins');
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
      localStorage.setItem('reboot_erp_master_bins', JSON.stringify(list));
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
      const raw = localStorage.getItem('reboot_erp_bom_versions');
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
      localStorage.setItem('reboot_erp_bom_versions', JSON.stringify(list));
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
      const raw = localStorage.getItem('reboot_erp_master_plants');
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
      localStorage.setItem('reboot_erp_master_plants', JSON.stringify(list));
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
      const raw = localStorage.getItem('reboot_erp_master_owners');
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
      localStorage.setItem('reboot_erp_master_owners', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master owner', e);
    }

    adminEventBus.emit('OWNER_MASTER_SAVED', newRecord);
    return newRecord;
  }

  // ==========================================
  // Task 5: Routing Operations, Work Centers, Machines & Molds
  // ==========================================
  public getOperations(): Array<{ id: string; name: string; type: string; defaultWorkCenter?: string }> {
    const defaultOps = [
      { id: 'OP-01', name: 'High-Speed Injection Molding & Degating', type: 'Primary Molding', defaultWorkCenter: 'WC-INJ-01' },
      { id: 'OP-02', name: 'Laser Part Marking & 2D Barcoding', type: 'Decoration / Marking', defaultWorkCenter: 'WC-LASER-01' },
      { id: 'OP-03', name: 'Automated Robotic Degating & Trimming', type: 'Post-Molding', defaultWorkCenter: 'WC-TRIM-01' },
      { id: 'OP-04', name: 'Ultrasonic Horn Welding & Fastening', type: 'Assembly', defaultWorkCenter: 'WC-ASSY-01' },
      { id: 'OP-05', name: 'Hot Foil Stamping & Pad Printing', type: 'Printing & Decoration', defaultWorkCenter: 'WC-PRINT-01' },
      { id: 'OP-06', name: 'In-Line Vision Inspection & Defect Check', type: 'Quality Gate', defaultWorkCenter: 'WC-QC-01' },
      { id: 'OP-07', name: 'Corrugated Case Packout & Palletizing', type: 'Final Packaging', defaultWorkCenter: 'WC-PACK-01' },
    ];
    try {
      const raw = localStorage.getItem('reboot_erp_master_operations');
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

  public saveOperation(op: { name: string; type?: string; defaultWorkCenter?: string }) {
    const list = this.getOperations();
    const newRecord = {
      id: `OP-${Date.now().toString().slice(-4)}`,
      name: op.name.trim(),
      type: op.type || 'Secondary Operation',
      defaultWorkCenter: op.defaultWorkCenter || 'WC-INJ-01',
    };

    const idx = list.findIndex(o => o.name.toLowerCase() === newRecord.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      localStorage.setItem('reboot_erp_master_operations', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master operation', e);
    }

    adminEventBus.emit('OPERATION_MASTER_SAVED', newRecord);
    return newRecord;
  }

  public getWorkCenters(): Array<{ id: string; code: string; name: string; bay: string; plantId: string }> {
    const defaultWorkCenters = [
      { id: 'WC-INJ-01', code: 'WC-INJ-01', name: 'WC-INJ-01 - 250T Injection Bay', bay: 'Bay 1 (Presses 1-6)', plantId: 'PLANT-01' },
      { id: 'WC-INJ-02', code: 'WC-INJ-02', name: 'WC-INJ-02 - 450T Heavy Tonnage Bay', bay: 'Bay 2 (Presses 7-12)', plantId: 'PLANT-01' },
      { id: 'WC-EXT-01', code: 'WC-EXT-01', name: 'WC-EXT-01 - Pipe & Profile Extrusion Line', bay: 'Extrusion Hall A', plantId: 'PLANT-02' },
      { id: 'WC-BLOW-01', code: 'WC-BLOW-01', name: 'WC-BLOW-01 - Continuous Extrusion Blow Bay', bay: 'Blow Molding Hall', plantId: 'PLANT-02' },
      { id: 'WC-ASSY-01', code: 'WC-ASSY-01', name: 'WC-ASSY-01 - Cleanroom Ultrasonic Cell', bay: 'Class 100k Cleanroom', plantId: 'PLANT-01' },
      { id: 'WC-PACK-01', code: 'WC-PACK-01', name: 'WC-PACK-01 - Automated Case Packing Line', bay: 'End-of-Line Packaging', plantId: 'PLANT-01' },
    ];
    try {
      const raw = localStorage.getItem('reboot_erp_master_workcenters');
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

  public saveWorkCenter(wc: { code: string; name: string; bay?: string; plantId?: string }) {
    const list = this.getWorkCenters();
    const newRecord = {
      id: wc.code.trim().toUpperCase(),
      code: wc.code.trim().toUpperCase(),
      name: wc.name.trim(),
      bay: wc.bay || 'Production Bay',
      plantId: wc.plantId || 'PLANT-01',
    };

    const idx = list.findIndex(w => w.code.toLowerCase() === newRecord.code.toLowerCase());
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.push(newRecord);
    }

    try {
      localStorage.setItem('reboot_erp_master_workcenters', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save master workcenter', e);
    }

    adminEventBus.emit('WORKCENTER_MASTER_SAVED', newRecord);
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
      const raw = localStorage.getItem('reboot_erp_master_machines');
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
      localStorage.setItem('reboot_erp_master_machines', JSON.stringify(list));
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
      const raw = localStorage.getItem('reboot_erp_master_molds');
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
      localStorage.setItem('reboot_erp_master_molds', JSON.stringify(list));
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
      const raw = localStorage.getItem('reboot_erp_runner_scrap_categories');
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
      localStorage.setItem('reboot_erp_runner_scrap_categories', JSON.stringify(list));
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
      const raw = localStorage.getItem('reboot_erp_purge_lumps_categories');
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
      localStorage.setItem('reboot_erp_purge_lumps_categories', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save purge lumps category', e);
    }

    adminEventBus.emit('PURGE_LUMPS_SAVED', newRecord);
    return newRecord;
  }

  // ==========================================
  // Task 3: Secure Change History & Audit Logs
  // ==========================================
  public getAuditHistory(entityType?: string, entityCode?: string): MasterDataChangeRecord[] {
    const defaultLogs: MasterDataChangeRecord[] = [
      {
        id: 'AUD-001',
        entityType: 'ITEM_MASTER',
        entityCode: 'FG-BMP-NEXON-F',
        entityName: 'Front Bumper Cladding - Nexon EV (High Gloss Black)',
        action: 'APPROVE',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        changedBy: 'Priya Rao (Super Admin)',
        userRole: 'super_admin',
        changeSummary: 'Final QA approval granted for high-speed automated robotic take-out cycle.',
        diff: {
          approval: { before: 'pending', after: 'approved' },
          status: { before: 'inactive', after: 'active' },
        },
      },
      {
        id: 'AUD-002',
        entityType: 'BOM_MASTER',
        entityCode: 'BOM-FG-BMP-NEXON-F-V1.0',
        entityName: 'BOM v1.0 - Front Bumper Cladding',
        action: 'CREATE',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        changedBy: 'Arun Kumar (Engineering Lead)',
        userRole: 'engineering_lead',
        changeSummary: 'Initial engineering bill of materials release with 4-cavity tooling.',
      },
    ];

    try {
      const raw = localStorage.getItem('reboot_erp_master_audit_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          let list = parsed;
          if (entityType) {
            list = list.filter((l) => l.entityType === entityType);
          }
          if (entityCode) {
            list = list.filter((l) => l.entityCode === entityCode);
          }
          return list;
        }
      }
    } catch (e) {
      console.warn('Failed to load audit history', e);
    }

    let list = defaultLogs;
    if (entityType) list = list.filter((l) => l.entityType === entityType);
    if (entityCode) list = list.filter((l) => l.entityCode === entityCode);
    return list;
  }

  public recordAudit(entry: {
    entityType: 'ITEM_MASTER' | 'BOM_MASTER' | 'PLANT' | 'ROUTING';
    entityCode: string;
    entityName?: string;
    action: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'DELETE' | 'VERSION_RELEASE';
    changedBy?: string;
    userRole?: string;
    changeSummary: string;
    diff?: Record<string, { before: any; after: any }>;
  }): MasterDataChangeRecord {
    const history = this.getAuditHistory();
    const record: MasterDataChangeRecord = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      changedBy: entry.changedBy || 'Admin User',
      userRole: entry.userRole || 'admin',
      ...entry,
    };

    history.unshift(record);
    try {
      localStorage.setItem('reboot_erp_master_audit_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save audit history', e);
    }

    adminEventBus.emit('AUDIT_RECORD_SAVED', record);
    return record;
  }

  // ==========================================
  // Task 1: Autocomplete & Admin Master Catalog Options
  // ==========================================
  private getStoredList(key: string, defaults: string[]): string[] {
    try {
      const raw = localStorage.getItem(key);
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
        localStorage.setItem(key, JSON.stringify(list));
      } catch (e) {
        console.warn(`Failed to save item to ${key}`, e);
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

  // ==========================================
  // Task 3: BOM Recipe Unique Identification Number Linked with Version Code
  // ==========================================
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
    const seed = `${cleanVer}:${roundedSum}:${materialTokens.join('-')}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
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
    };

    try {
      const raw = localStorage.getItem('reboot_erp_master_governance_permissions');
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
      localStorage.setItem('reboot_erp_master_governance_permissions', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save governance permissions', e);
    }
    adminEventBus.emit('GOVERNANCE_PERMISSIONS_SAVED', updated);
    return updated;
  }

  public canUserPerformAction(
    action: 'create_item' | 'edit_item' | 'approve_item' | 'delete_item' | 'create_bom' | 'edit_bom' | 'approve_bom',
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
    }

    return allowedList.some((allowed) => {
      const cleanAllowed = allowed.toLowerCase().trim().replace(/[\s-]+/g, '_');
      return roleKey.includes(cleanAllowed) || cleanAllowed.includes(roleKey);
    });
  }
}

export interface MasterDataChangeRecord {
  id: string;
  entityType: 'ITEM_MASTER' | 'BOM_MASTER' | 'PLANT' | 'ROUTING';
  entityCode: string;
  entityName?: string;
  action: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'DELETE' | 'VERSION_RELEASE';
  timestamp: string;
  changedBy: string;
  userRole: string;
  changeSummary: string;
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
}

export const masterDataGovernanceService = new MasterDataGovernanceService();
