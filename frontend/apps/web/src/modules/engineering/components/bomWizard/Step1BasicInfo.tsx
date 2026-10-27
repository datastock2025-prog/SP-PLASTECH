import React, { useState, useEffect } from 'react';
import { ManufacturingBomWizardState } from './types';
import { ItemMaster } from '@/src/types';
import { ItemAutocompleteInput } from './ItemAutocompleteInput';
import { masterDataGovernanceService } from '@/src/services/masterDataGovernanceService';
import { adminEventBus } from '@/src/services/adminService';
import { ModernDatePicker } from '@/src/components/common/ModernDatePicker';
import {
  User,
  Package,
  Plus,
  GitBranch,
  X,
  Check,
  Building,
  Layers,
} from 'lucide-react';

interface Step1Props {
  state: ManufacturingBomWizardState;
  items?: ItemMaster[];
  onChange: (patch: Partial<ManufacturingBomWizardState>) => void;
  errors: Record<string, string>;
  showToast?: (msg: string) => void;
}

export const Step1BasicInfo: React.FC<Step1Props> = ({
  state,
  items = [],
  onChange,
  errors,
  showToast = () => {},
}) => {
  const { parentItem } = state;

  // Modals state
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [isNewBomClassModalOpen, setIsNewBomClassModalOpen] = useState(false);
  const [isNewPlantModalOpen, setIsNewPlantModalOpen] = useState(false);
  const [isNewOwnerModalOpen, setIsNewOwnerModalOpen] = useState(false);

  // Dynamic Master lists from Governance Service (synced with Admin & DB `/api/v1/master-data/options`)
  const [versionList, setVersionList] = useState(() => masterDataGovernanceService.getBomVersions(parentItem?.code));
  const [bomClassList, setBomClassList] = useState(() => masterDataGovernanceService.getBomClasses());
  const [plantList, setPlantList] = useState(() => masterDataGovernanceService.getPlants());
  const [ownerList, setOwnerList] = useState(() => masterDataGovernanceService.getOwners());

  // Form states for quick creation
  const [newVersionForm, setNewVersionForm] = useState({
    version: '',
    title: '',
    status: 'future' as 'current' | 'future' | 'archived',
    effectiveFrom: new Date().toISOString().split('T')[0],
    changeReason: '',
  });

  const [newBomClassName, setNewBomClassName] = useState('');

  const [newPlantForm, setNewPlantForm] = useState({
    code: '',
    name: '',
    location: '',
    type: 'Injection & Extrusion',
  });

  const [newOwnerForm, setNewOwnerForm] = useState({
    name: '',
    department: 'Engineering & Tooling',
    role: 'BOM Design Authority',
  });

  // Sync from Admin API on mount & listen to Admin events for dynamic updates
  useEffect(() => {
    masterDataGovernanceService.syncFromApi().then(() => {
      setVersionList(masterDataGovernanceService.getBomVersions(parentItem?.code));
      setBomClassList(masterDataGovernanceService.getBomClasses());
      setPlantList(masterDataGovernanceService.getPlants());
      setOwnerList(masterDataGovernanceService.getOwners());
    });

    const unsubVer = adminEventBus.on('BOM_VERSION_SAVED', () => {
      setVersionList(masterDataGovernanceService.getBomVersions(parentItem?.code));
    });
    const unsubClass = adminEventBus.on('BOM_CLASS_SAVED', () => {
      setBomClassList(masterDataGovernanceService.getBomClasses());
    });
    const unsubPlant = adminEventBus.on('PLANT_MASTER_SAVED', () => {
      setPlantList(masterDataGovernanceService.getPlants());
    });
    const unsubOwner = adminEventBus.on('OWNER_MASTER_SAVED', () => {
      setOwnerList(masterDataGovernanceService.getOwners());
    });
    const unsubOpts = adminEventBus.on('MASTER_OPTIONS_UPDATED', () => {
      setVersionList(masterDataGovernanceService.getBomVersions(parentItem?.code));
      setBomClassList(masterDataGovernanceService.getBomClasses());
      setPlantList(masterDataGovernanceService.getPlants());
      setOwnerList(masterDataGovernanceService.getOwners());
    });
    return () => {
      unsubVer?.();
      unsubClass?.();
      unsubPlant?.();
      unsubOwner?.();
      unsubOpts?.();
    };
  }, [parentItem?.code]);

  // Task 1: Strictly allow only Approved Finished Good (FG) items
  const fgOnlyItems = React.useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter((item) => {
      if (!item || !item.code) return false;

      // Strictly show only Approved items
      const approval = String(item.approval || '').toLowerCase();
      if (approval !== 'approved' && approval !== 'released') {
        return false;
      }
      if (item.status === 'rejected' || item.status === 'blocked' || item.status === 'inactive') {
        return false;
      }

      const code = (item.code || '').toUpperCase();
      const type = (item.type || '').toLowerCase();
      const cat = (item.cat || '').toLowerCase();

      // Disallow raw materials, masterbatch, regrind, spare parts, additives by type, category, or SKU prefix
      if (
        code.startsWith('RM-') ||
        code.startsWith('MB-') ||
        code.startsWith('RG-') ||
        code.startsWith('AD-') ||
        code.startsWith('CON-') ||
        code.startsWith('BOP-') ||
        type.includes('raw') ||
        type.includes('resin') ||
        type.includes('masterbatch') ||
        type.includes('regrind') ||
        type.includes('spare') ||
        type.includes('colorant') ||
        type.includes('additive') ||
        type.includes('packaging material') ||
        cat.includes('raw') ||
        cat.includes('resin') ||
        cat.includes('masterbatch') ||
        cat.includes('regrind') ||
        cat.includes('spare') ||
        cat.includes('consumable') ||
        cat.includes('additive')
      ) {
        return false;
      }

      return (
        type.includes('finished') ||
        type.includes('fg') ||
        type.includes('assembly') ||
        type.includes('molded') ||
        cat.includes('finished') ||
        cat.includes('automotive') ||
        cat.includes('consumer') ||
        cat.includes('medical') ||
        type === ''
      );
    });
  }, [items]);

  // Task 1 & 2: When an approved FG item is selected, auto-complete all remaining fields from Item Master DB record
  const handleSelectParentItem = (item: ItemMaster) => {
    if (!item) return;
    const cleanBomCode = item.code || '';
    const newCycleTime = Number(item.standardCycleTime ?? item.cycleTime ?? 0);
    const newCavities = Number(item.cavityCount ?? 1) || 1;
    const netWeight = Number((item as any).partWeightGrams ?? (item as any).netWeightGrams ?? (item.weight ? item.weight * 1000 : 0));
    const runnerWeight = Number((item as any).runnerWeightGrams ?? 0);
    const totalShotWeight = Number((item as any).shotWeightGrams ?? ((netWeight * newCavities) + runnerWeight)) || Number(((netWeight * newCavities) + runnerWeight).toFixed(2));
    const estHours = newCycleTime > 0 ? Number(((newCycleTime * (state.batchSize || 1000)) / 3600).toFixed(2)) : 0;

    // Match item's plant to Operating Plant list (or add it dynamically if custom)
    let matchedPlantId = state.plantId;
    if (item.plant) {
      const existingPlant = plantList.find(
        (p) =>
          p.code.toLowerCase() === item.plant!.toLowerCase() ||
          p.name.toLowerCase() === item.plant!.toLowerCase() ||
          p.name.toLowerCase().includes(item.plant!.toLowerCase()) ||
          item.plant!.toLowerCase().includes(p.code.toLowerCase())
      );
      if (existingPlant) {
        matchedPlantId = existingPlant.code;
      } else {
        matchedPlantId = item.plant;
      }
    }

    onChange({
      parentItem: item,
      bomCode: cleanBomCode,
      bomName: item.name || '',
      plantId: matchedPlantId,
      description: item.desc || `Manufacturing Bill of Materials for ${item.name || item.code} (${item.cat || 'Finished Good'}).`,
      remarks:
        (item as any).creationNotes ||
        `Tooling: ${item.moldToolId || 'MOLD-001'} (${newCavities} Cav) • Resin: ${item.resinType || 'Standard Grade'} • Default WH: ${item.wh || 'FG-WH-01'}`,
      batchUOM: item.baseUOM || 'PCS',
      standardCycleTimeSec: newCycleTime,
      moldCavities: newCavities,
      itemNetWeightGrams: netWeight,
      runnerWeightGrams: runnerWeight,
      totalShotWeightGrams: totalShotWeight,
      estimatedProductionTimeHours: estHours,
      defaultFgLocation: item.wh || 'FG-WH-01',
      moldId: item.moldToolId || state.moldId,
      machineGroup: item.machineCompat || state.machineGroup,
    });

    showToast(`✓ Selected Approved FG "${item.code} — ${item.name}". All BOM & molding fields auto-completed from Item Master!`);
  };

  // Save New Version (Persisted to Admin & DB)
  const handleSaveNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionForm.version.trim()) {
      showToast('Please enter version number (e.g. 1.1 or 2.0)');
      return;
    }
    const saved = masterDataGovernanceService.saveBomVersion({
      itemCode: parentItem.code,
      version: newVersionForm.version.trim(),
      title: newVersionForm.title || `v${newVersionForm.version} (${newVersionForm.status === 'future' ? 'Future Release' : 'Active Revision'})`,
      status: newVersionForm.status,
      effectiveFrom: newVersionForm.effectiveFrom,
      changeReason: newVersionForm.changeReason,
    });
    masterDataGovernanceService.persistOptionToApi('bomVersions', JSON.stringify(saved));
    setVersionList(masterDataGovernanceService.getBomVersions(parentItem.code));
    onChange({ bomVersion: saved.version });
    setIsNewVersionModalOpen(false);
    showToast(`✓ Registered BOM Version "${saved.version}" in Admin & Database!`);
  };

  // Save New BOM Class (Persisted to Admin & DB)
  const handleSaveNewBomClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBomClassName.trim()) {
      showToast('Please enter BOM Class name');
      return;
    }
    const clean = newBomClassName.trim();
    const updated = masterDataGovernanceService.saveBomClass(clean);
    setBomClassList(updated);
    onChange({ bomType: clean as any });
    setNewBomClassName('');
    setIsNewBomClassModalOpen(false);
    showToast(`✓ Registered BOM Class "${clean}" in Admin & Database!`);
  };

  // Save New Plant (Persisted to Admin & DB)
  const handleSaveNewPlant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantForm.name.trim()) {
      showToast('Please enter plant name');
      return;
    }
    const autoCode = newPlantForm.code.trim() || `PLANT-${Date.now().toString().slice(-2)}`;
    const saved = masterDataGovernanceService.savePlant({
      code: autoCode,
      name: `${autoCode} - ${newPlantForm.name.trim()}`,
      location: newPlantForm.location,
    });
    masterDataGovernanceService.persistOptionToApi('bomPlants', JSON.stringify(saved));
    setPlantList(masterDataGovernanceService.getPlants());
    onChange({ plantId: saved.code });
    setIsNewPlantModalOpen(false);
    setNewPlantForm({ code: '', name: '', location: '', type: 'Injection & Extrusion' });
    showToast(`✓ Registered Operating Plant "${saved.name}" in Admin & Database!`);
  };

  // Save New Owner (Persisted to Admin & DB)
  const handleSaveNewOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerForm.name.trim()) {
      showToast('Please enter owner / department name');
      return;
    }
    const saved = masterDataGovernanceService.saveOwner({
      name: newOwnerForm.name.trim(),
      department: newOwnerForm.department,
      role: newOwnerForm.role,
    });
    masterDataGovernanceService.persistOptionToApi('bomOwners', JSON.stringify(saved));
    setOwnerList(masterDataGovernanceService.getOwners());
    onChange({ owner: saved.name });
    setIsNewOwnerModalOpen(false);
    setNewOwnerForm({ name: '', department: 'Engineering & Tooling', role: 'BOM Design Authority' });
    showToast(`✓ Registered Department / Process Owner "${saved.name}" in Admin & Database!`);
  };

  // Ensure current state.plantId is always visible in dropdown even if auto-completed from Item Master
  const effectivePlantList = React.useMemo(() => {
    if (!state.plantId) return plantList;
    const exists = plantList.some((p) => p.code === state.plantId || p.name === state.plantId);
    if (exists) return plantList;
    return [
      { id: state.plantId, code: state.plantId, name: state.plantId, location: 'Item Master Default', type: 'Manufacturing' },
      ...plantList,
    ];
  }, [plantList, state.plantId]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Search and Select Parent Item with Dual Autocomplete */}
      <div className="bg-gradient-to-r from-blue-50/70 to-teal-50/70 border border-blue-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0066CC] text-white flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#14213D]">
                Finished Good (FG) Parent Item Selection <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-1">{fgOnlyItems.length} Approved FG Items</span>
              </h2>
              <p className="text-xs text-gray-500">
                Only Approved Finished Goods from Item Master are listed. Selecting an item auto-completes all BOM &amp; molding attributes.
              </p>
            </div>
          </div>
        </div>

        {/* Dual Autocomplete Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <ItemAutocompleteInput
              items={fgOnlyItems}
              value={parentItem.code}
              displayMode="code"
              label="Search / Select by Item Number (FG Only)"
              placeholder="Search Approved FG Item Code (e.g. BODYLATCH-001)..."
              onSelect={handleSelectParentItem}
              error={errors.parentItem}
            />
          </div>

          <div>
            <ItemAutocompleteInput
              items={fgOnlyItems}
              value={parentItem.name}
              displayMode="name"
              label="Search / Select by Item Name (FG Only)"
              placeholder="Search Approved FG Item Name..."
              onSelect={handleSelectParentItem}
            />
          </div>
        </div>

        {/* Selected Parent Item Summary Card */}
        {parentItem.code ? (
          <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-3 shadow-xs animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  ✓
                </span>
                <div>
                  <div className="font-bold text-sm text-[#14213D] flex items-center gap-2">
                    <span>{parentItem.code}</span>
                    <span className="text-gray-400">&bull;</span>
                    <span>{parentItem.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                      {parentItem.type || 'Finished Good'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{parentItem.desc || parentItem.cat}</div>
                </div>
              </div>
            </div>

            {/* Quick parameter readout pills from Item Master */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-xs">
              <div className="bg-gray-50 p-2 rounded-lg">
                <span className="text-[10px] text-gray-500 block uppercase font-semibold">Standard Cycle</span>
                <span className="font-mono font-bold text-gray-900">
                  {state.standardCycleTimeSec > 0 ? `${state.standardCycleTimeSec}s` : '—'}
                </span>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <span className="text-[10px] text-gray-500 block uppercase font-semibold">Mold Cavities</span>
                <span className="font-mono font-bold text-gray-900">{state.moldCavities} Cavities</span>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <span className="text-[10px] text-gray-500 block uppercase font-semibold">Net Part Weight</span>
                <span className="font-mono font-bold text-gray-900">
                  {state.itemNetWeightGrams > 0 ? `${state.itemNetWeightGrams}g` : '—'}
                </span>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <span className="text-[10px] text-gray-500 block uppercase font-semibold">Default FG Warehouse</span>
                <span className="font-mono font-bold text-gray-900">{parentItem.wh || '—'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 bg-white/60 rounded-xl border border-dashed border-blue-200 text-xs text-gray-500">
            No Finished Good item selected yet. Please select an Approved Finished Good from the search boxes above.
          </div>
        )}
      </div>

      {/* Primary Editable Form Grid */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-5">
        <div className="border-b border-[#E4E0D6] pb-2">
          <h3 className="text-sm font-bold text-[#14213D]">BOM Identity, Version &amp; Plant Scope</h3>
          <p className="text-xs text-gray-500">Configure matching BOM number, admin-governed version, BOM class, and operating plant.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BOM Code (Strictly Matches Item Code) */}
          <div className="field mb-0">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#14213D]">
                BOM Number / Code <span className="text-rose-600">*</span>
              </label>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                Locked to Item Number
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={state.bomCode}
                disabled
                placeholder="Auto-synced with Item Code"
                className={`w-full font-mono font-bold text-xs py-2 px-3 border rounded-lg bg-gray-50 text-gray-800 ${
                  errors.bomCode ? 'border-rose-500 bg-rose-50/50' : 'border-[#E4E0D6]'
                }`}
              />
            </div>
            {errors.bomCode && <p className="text-[11px] text-rose-600 mt-1">{errors.bomCode}</p>}
          </div>

          {/* BOM Name (Matches Item Name) */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              BOM Name / Description <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={state.bomName}
              onChange={(e) => onChange({ bomName: e.target.value })}
              placeholder="Auto-filled from selected FG Item Name..."
              className={`w-full text-xs py-2 px-3 border rounded-lg ${
                errors.bomName ? 'border-rose-500 bg-rose-50/50' : 'border-[#E4E0D6]'
              }`}
            />
            {errors.bomName && <p className="text-[11px] text-rose-600 mt-1">{errors.bomName}</p>}
          </div>

          {/* BOM Version Tag * (Admin-governed + Create Version Option) */}
          <div className="field mb-0">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#14213D]">
                BOM Version Tag <span className="text-rose-600">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setNewVersionForm({
                    version: '',
                    title: '',
                    status: 'future',
                    effectiveFrom: new Date().toISOString().split('T')[0],
                    changeReason: '',
                  });
                  setIsNewVersionModalOpen(true);
                }}
                className="text-[11px] font-semibold text-[#0F8B8D] hover:text-[#0c7274] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                + Create Version
              </button>
            </div>
            <select
              value={state.bomVersion}
              onChange={(e) => {
                if (e.target.value === '__CREATE_NEW__') {
                  setIsNewVersionModalOpen(true);
                } else {
                  onChange({ bomVersion: e.target.value });
                }
              }}
              className="w-full font-mono text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white"
            >
              {versionList.map((ver) => (
                <option key={ver.id} value={ver.version}>
                  {ver.title} — Effective: {ver.effectiveFrom}
                </option>
              ))}
              <option value="__CREATE_NEW__" className="text-[#0F8B8D] font-bold">
                + Create New Version Number in Admin...
              </option>
            </select>
            {errors.bomVersion && <p className="text-[11px] text-rose-600 mt-1">{errors.bomVersion}</p>}
          </div>

          {/* BOM Class (Dynamic Admin-Governed + Create BOM Class Option) */}
          <div className="field mb-0">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#14213D]">BOM Class</label>
              <button
                type="button"
                onClick={() => {
                  setNewBomClassName('');
                  setIsNewBomClassModalOpen(true);
                }}
                className="text-[11px] font-semibold text-[#0F8B8D] hover:text-[#0c7274] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                + Create Class
              </button>
            </div>
            <select
              value={state.bomType}
              onChange={(e) => {
                if (e.target.value === '__CREATE_NEW__') {
                  setIsNewBomClassModalOpen(true);
                } else {
                  onChange({ bomType: e.target.value as any });
                }
              }}
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white font-medium"
            >
              {bomClassList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
              <option value="__CREATE_NEW__" className="text-[#0F8B8D] font-bold">
                + Create New BOM Class in Admin...
              </option>
            </select>
          </div>

          {/* Operating Plant * (Connected to Admin Plants + Auto-completed from Item Master) */}
          <div className="field mb-0">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#14213D]">
                Operating Plant <span className="text-rose-600">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setNewPlantForm({
                    code: `PLANT-${(plantList.length + 1).toString().padStart(2, '0')}`,
                    name: '',
                    location: '',
                    type: 'Injection & Extrusion',
                  });
                  setIsNewPlantModalOpen(true);
                }}
                className="text-[11px] font-semibold text-[#0F8B8D] hover:text-[#0c7274] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                + Create Plant
              </button>
            </div>
            <select
              value={state.plantId}
              onChange={(e) => {
                if (e.target.value === '__CREATE_NEW__') {
                  setIsNewPlantModalOpen(true);
                } else {
                  onChange({ plantId: e.target.value });
                }
              }}
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white font-medium"
            >
              {effectivePlantList.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.name} {p.location ? `(${p.location})` : ''}
                </option>
              ))}
              <option value="__CREATE_NEW__" className="text-[#0F8B8D] font-bold">
                + Create New Plant in Master Data...
              </option>
            </select>
          </div>

          {/* Department / Process Owner (Connected to Admin Owners + Create Owner Option) */}
          <div className="field mb-0">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#14213D]">Department / Process Owner</label>
              <button
                type="button"
                onClick={() => {
                  setNewOwnerForm({
                    name: '',
                    department: 'Engineering & Tooling',
                    role: 'BOM Design Authority',
                  });
                  setIsNewOwnerModalOpen(true);
                }}
                className="text-[11px] font-semibold text-[#0F8B8D] hover:text-[#0c7274] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                + Create Owner
              </button>
            </div>
            <select
              value={state.owner}
              onChange={(e) => {
                if (e.target.value === '__CREATE_NEW__') {
                  setIsNewOwnerModalOpen(true);
                } else {
                  onChange({ owner: e.target.value });
                }
              }}
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white font-medium"
            >
              {ownerList.map((o) => (
                <option key={o.id} value={o.name}>
                  {o.name} &bull; {o.department} ({o.role})
                </option>
              ))}
              <option value="__CREATE_NEW__" className="text-[#0F8B8D] font-bold">
                + Create New Owner / Department in Master Data...
              </option>
            </select>
          </div>

          {/* Task 3: Modern Advanced UI Date Picker for Effective From Date */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              Effective From Date <span className="text-rose-600">*</span>
            </label>
            <ModernDatePicker
              value={state.effectiveFrom}
              onChange={(val) => onChange({ effectiveFrom: val })}
              placeholder="Select effective start date..."
              hasError={Boolean(errors.effectiveFrom)}
            />
            {errors.effectiveFrom && <p className="text-[11px] text-rose-600 mt-1">{errors.effectiveFrom}</p>}
          </div>

          {/* Task 3: Modern Advanced UI Date Picker for Effective To Date */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              Effective To Date <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <ModernDatePicker
              value={state.effectiveTo}
              onChange={(val) => onChange({ effectiveTo: val })}
              placeholder="Select optional sunset date..."
              minDate={state.effectiveFrom}
            />
          </div>
        </div>

        {/* Technical Description & Engineering Remarks / Notes (Persisted to DB) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Technical Description</label>
            <textarea
              rows={2}
              value={state.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Brief manufacturing and material description (stored in DB)..."
              className="w-full text-xs p-2.5 border border-[#E4E0D6] rounded-lg resize-none"
            />
          </div>
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Engineering Remarks / Notes</label>
            <textarea
              rows={2}
              value={state.remarks}
              onChange={(e) => onChange({ remarks: e.target.value })}
              placeholder="Special customer packaging instructions or mold setup notes (stored in DB)..."
              className="w-full text-xs p-2.5 border border-[#E4E0D6] rounded-lg resize-none"
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUBMODALS: Create Version, BOM Class, Plant, Owner        */}
      {/* ========================================================= */}

      {/* 1. Create BOM Version Modal */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50 via-white to-teal-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F8B8D] text-white flex items-center justify-center shadow-xs">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Create BOM Version Number in Admin</h3>
                  <p className="text-[11px] text-slate-500">Configures current or future engineering revision</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewVersion} className="p-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Version Number / Tag *</label>
                  <input
                    type="text"
                    required
                    value={newVersionForm.version}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, version: e.target.value })}
                    placeholder="e.g. 1.1 or 2.0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Version Title / Release Label</label>
                  <input
                    type="text"
                    value={newVersionForm.title}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, title: e.target.value })}
                    placeholder="e.g. v1.1 (Next Revision - Cycle Optimized)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Version Status</label>
                    <select
                      value={newVersionForm.status}
                      onChange={(e) => setNewVersionForm({ ...newVersionForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="future">Future Version (Planned)</option>
                      <option value="current">Current Active Baseline</option>
                      <option value="archived">Archived Revision</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Effective Date</label>
                    <ModernDatePicker
                      value={newVersionForm.effectiveFrom}
                      onChange={(val) => setNewVersionForm({ ...newVersionForm, effectiveFrom: val })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Change Reason / ECR Note</label>
                  <input
                    type="text"
                    value={newVersionForm.changeReason}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, changeReason: e.target.value })}
                    placeholder="e.g. ECR-842 Cooling channel adjustment"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Persists to Admin BOM Version Master</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewVersionModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save &amp; Select Version
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Create BOM Class Modal */}
      {isNewBomClassModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50 via-white to-teal-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F8B8D] text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Register BOM Class in Admin</h3>
                  <p className="text-[11px] text-slate-500">Adds global BOM classification option</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBomClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewBomClass} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">BOM Class Name *</label>
                <input
                  type="text"
                  required
                  value={newBomClassName}
                  onChange={(e) => setNewBomClassName(e.target.value)}
                  placeholder="e.g. Tooling Trial BOM or Export Assembly BOM"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Persists to Admin Master Governance</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewBomClassModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save &amp; Select Class
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Create Plant Modal */}
      {isNewPlantModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50 via-white to-teal-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F8B8D] text-white flex items-center justify-center shadow-xs">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Register Operating Plant in Admin</h3>
                  <p className="text-[11px] text-slate-500">Adds production facility to central governance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPlantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPlant} className="p-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plant Code *</label>
                  <input
                    type="text"
                    required
                    value={newPlantForm.code}
                    onChange={(e) => setNewPlantForm({ ...newPlantForm, code: e.target.value.toUpperCase() })}
                    placeholder="PLANT-05"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plant Name *</label>
                  <input
                    type="text"
                    required
                    value={newPlantForm.name}
                    onChange={(e) => setNewPlantForm({ ...newPlantForm, name: e.target.value })}
                    placeholder="e.g. Plant 5 — Southern Automotive Injection Unit"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Geographic Location</label>
                  <input
                    type="text"
                    value={newPlantForm.location}
                    onChange={(e) => setNewPlantForm({ ...newPlantForm, location: e.target.value })}
                    placeholder="e.g. Sriperumbudur, Tamil Nadu"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Persists to Admin Plant Directory</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewPlantModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save &amp; Select Plant
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Create Owner / Department Modal */}
      {isNewOwnerModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50 via-white to-teal-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F8B8D] text-white flex items-center justify-center shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Register Process Owner / Department</h3>
                  <p className="text-[11px] text-slate-500">Assigns engineering and BOM sign-off authority</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOwnerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewOwner} className="p-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Process Owner / Department Name *</label>
                  <input
                    type="text"
                    required
                    value={newOwnerForm.name}
                    onChange={(e) => setNewOwnerForm({ ...newOwnerForm, name: e.target.value })}
                    placeholder="e.g. Advanced Tooling &amp; Mold Design Group"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newOwnerForm.department}
                    onChange={(e) => setNewOwnerForm({ ...newOwnerForm, department: e.target.value })}
                    placeholder="e.g. Tool Room / Engineering"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Governance Role</label>
                  <input
                    type="text"
                    value={newOwnerForm.role}
                    onChange={(e) => setNewOwnerForm({ ...newOwnerForm, role: e.target.value })}
                    placeholder="e.g. BOM Design Authority / Process Lead"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Persists to Admin Master Governance</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewOwnerModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save &amp; Select Owner
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
