import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Warehouse,
  QrCode,
  Thermometer,
  Lock,
  Unlock,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Trash2,
  Edit2,
  Layers,
  ShieldAlert,
  Info,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { WarehouseLocationConfig } from '../../data/adminExtendedData';
import { masterDataGovernanceService } from '../../services/masterDataGovernanceService';
import { SupabaseDataService } from '../../services/supabaseService';
import { adminEventBus } from '../../services/adminService';
import { isStoreInUse, isUserAdmin } from '../../utils/warehouseSync';
import { useAuthContext } from '../../shared/components/RequireAuth';
import { useAdminWarehouses, useSaveAdminWarehouse } from '../../hooks/useAdmin';

interface AdminWarehouseLocationsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminWarehouseLocationsView: React.FC<AdminWarehouseLocationsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const { currentUser } = useAuthContext();
  const isAdmin = isUserAdmin(currentUser);

  // TanStack React Query v5 dynamic data
  const { data: locations = [], isLoading } = useAdminWarehouses();
  const saveWarehouseMutation = useSaveAdminWarehouse();

  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<WarehouseLocationConfig | null>(null);

  // Dynamic live listener for instant store synchronization across front-end
  useEffect(() => {
    const handleCustomEvent = () => {
      // Event listener for external changes
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('warehouse_locations_updated', handleCustomEvent);
      window.addEventListener('warehouse_stock_updated', handleCustomEvent);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('warehouse_locations_updated', handleCustomEvent);
        window.removeEventListener('warehouse_stock_updated', handleCustomEvent);
      }
    };
  }, []);

  // Save locations using React Query mutation
  const saveLocations = (newLocs: WarehouseLocationConfig[]) => {
    if (newLocs.length > 0) {
      saveWarehouseMutation.mutate(newLocs[0]);
    }
  };

  // Form state for new Parent Warehouse
  const [parentForm, setParentForm] = useState({
    code: '',
    name: '',
    plantScope: 'Plant 01 — Pune Hub',
    storeType: 'Finished Goods (FG)',
    zone: 'Zone A - High Bay Central',
    capacityKg: 50000,
    temperatureControlled: false,
    targetTemp: 22,
    address: 'Building B, Industrial Bay 4',
    description: '',
  });

  // Available dynamic parent warehouses for Bin creation dropdown
  const availableParentWarehouses = masterDataGovernanceService.getWarehouses();

  // Form state for new Bin
  const [binForm, setBinForm] = useState({
    warehouseCode: availableParentWarehouses[0]?.code || 'WH-PUN-01',
    warehouseName: availableParentWarehouses[0]?.name || 'Chakan Central Polymer & Goods Hub',
    plantScope: 'Plant 01 — Pune Hub',
    zoneType: 'Raw Polymer Silos' as WarehouseLocationConfig['zoneType'],
    zoneName: 'Main Storage Silo Yard',
    aisle: 'A1',
    rack: 'R01',
    shelf: '01',
    maxCapacityKg: 10000,
    temperatureControlled: false,
    targetTemp: 22,
    barcodeScannable: true,
  });

  const zones = [
    'ALL',
    'Raw Polymer Silos',
    'Masterbatch Temperature Controlled',
    'Finished Goods High-Bay',
    'Regrind / Scrap Staging',
    'Tool & Die Staging',
    'Quarantine & Hold',
  ];

  const filteredLocations = locations.filter((loc) => {
    const matchSearch =
      loc.binCode.toLowerCase().includes(search.toLowerCase()) ||
      loc.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
      loc.zoneName.toLowerCase().includes(search.toLowerCase()) ||
      loc.warehouseCode.toLowerCase().includes(search.toLowerCase());
    const matchZone = selectedZone === 'ALL' || loc.zoneType === selectedZone;
    return matchSearch && matchZone;
  });

  const handleToggleLock = (id: string) => {
    if (!isAdmin) {
      showToast('⚠️ Only System Administrators can lock or release warehouse locations.');
      return;
    }

    const targetLoc = locations.find((l) => l.id === id);
    if (!targetLoc) return;

    const usageCheck = isStoreInUse(targetLoc.binCode);
    if (usageCheck.inUse && !targetLoc.isBlocked) {
      showToast(`⚠️ Location ${targetLoc.binCode} is actively used in inventory. Locking putaway.`);
    }

    const updated = locations.map((l) => {
      if (l.id === id) {
        const next = !l.isBlocked;
        showToast(`Location ${l.binCode} ${next ? 'BLOCKED for putaway' : 'RELEASED for active storage'}.`);
        return { ...l, isBlocked: next };
      }
      return l;
    });
    saveLocations(updated);
  };

  const handleAddBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('⚠️ Access Denied: Admin privileges required to provision new bins.');
      return;
    }

    const binCode = `${binForm.warehouseCode}-${binForm.aisle}-${binForm.rack}-${binForm.shelf}`.toUpperCase();

    const newLoc: WarehouseLocationConfig = {
      id: `LOC-${Date.now().toString().slice(-5)}`,
      warehouseCode: binForm.warehouseCode.toUpperCase(),
      warehouseName: binForm.warehouseName,
      plantId: 'PLANT-01',
      plantName: binForm.plantScope,
      zoneCode: `Z-${binForm.aisle}`,
      zoneName: binForm.zoneName || 'Storage Zone',
      zoneType: binForm.zoneType,
      aisle: binForm.aisle,
      rack: binForm.rack,
      shelf: binForm.shelf,
      binCode: binCode,
      maxCapacityKg: Number(binForm.maxCapacityKg) || 5000,
      currentOccupancyKg: 0,
      temperatureControlled: binForm.temperatureControlled,
      targetTempCelsius: binForm.temperatureControlled ? binForm.targetTemp : undefined,
      isBlocked: false,
      barcodeScannable: binForm.barcodeScannable,
    };

    const updated = [newLoc, ...locations];
    saveLocations(updated);

    // 1. Save to Master Data Governance
    masterDataGovernanceService.saveBin({
      code: binCode,
      warehouseCode: binForm.warehouseCode.toUpperCase(),
      zone: binForm.zoneName,
    });

    // 2. Persist to Supabase Database
    try {
      await SupabaseDataService.upsertLocationBin({
        id: newLoc.id,
        bin_code: binCode,
        warehouse_code: binForm.warehouseCode.toUpperCase(),
        zone_type: binForm.zoneType,
        aisle: binForm.aisle,
        rack: binForm.rack,
        shelf: binForm.shelf,
        max_capacity_kg: newLoc.maxCapacityKg,
        is_blocked: false,
      });
    } catch (err) {
      console.warn('Supabase bin save notice:', err);
    }

    // 3. Emit events for global ERP synchronization
    adminEventBus.emit('BIN_MASTER_SAVED', newLoc);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('warehouse_locations_updated', { detail: { locations: updated } }));
    }

    setIsModalOpen(false);
    showToast(`✓ Storage location "${binCode}" saved in DB & synced across ERP.`);
  };

  const handleCreateParentWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('⚠️ Access Denied: Admin privileges required to create Parent Warehouses.');
      return;
    }

    if (!parentForm.code.trim() || !parentForm.name.trim()) {
      showToast('Please enter Warehouse Code and Name.');
      return;
    }

    const whCode = parentForm.code.trim().toUpperCase();
    const whName = parentForm.name.trim();

    // 1. Save to master data governance service (stores in local storage & emits event)
    masterDataGovernanceService.saveWarehouse({
      code: whCode,
      name: whName,
      zone: parentForm.zone,
      plantScope: parentForm.plantScope,
    });

    // 2. Persist to Supabase Database
    try {
      await SupabaseDataService.upsertWarehouse({
        id: `WH-${whCode}`,
        code: whCode,
        name: whName,
        plant_scope: parentForm.plantScope,
        store_type: parentForm.storeType,
        zone: parentForm.zone,
        capacity_kg: parentForm.capacityKg,
        temperature_controlled: parentForm.temperatureControlled,
        target_temp: parentForm.targetTemp,
        address: parentForm.address,
        description: parentForm.description,
      });
    } catch (err) {
      console.warn('Could not sync warehouse to Supabase', err);
    }

    // 3. Add default location bin for the new Parent Warehouse
    const newDefaultBin: WarehouseLocationConfig = {
      id: `LOC-${Date.now().toString().slice(-4)}`,
      warehouseCode: whCode,
      warehouseName: whName,
      plantId: 'PLANT-01',
      plantName: parentForm.plantScope,
      zoneCode: 'Z-01',
      zoneName: parentForm.zone,
      zoneType: parentForm.storeType.includes('Raw')
        ? 'Raw Polymer Silos'
        : parentForm.storeType.includes('Masterbatch')
        ? 'Masterbatch Temperature Controlled'
        : 'Finished Goods High-Bay',
      aisle: 'A1',
      rack: 'R01',
      shelf: '01',
      binCode: `${whCode}-BAY-01`,
      maxCapacityKg: parentForm.capacityKg,
      currentOccupancyKg: 0,
      temperatureControlled: parentForm.temperatureControlled,
      targetTempCelsius: parentForm.temperatureControlled ? parentForm.targetTemp : undefined,
      isBlocked: false,
      barcodeScannable: true,
    };

    const updated = [newDefaultBin, ...locations];
    saveLocations(updated);

    // 4. Save Default Bin to Master Data & Database
    masterDataGovernanceService.saveBin({
      code: `${whCode}-BAY-01`,
      warehouseCode: whCode,
      zone: parentForm.zone,
    });

    // 5. Emit events for global ERP synchronization
    adminEventBus.emit('WAREHOUSE_MASTER_SAVED', { code: whCode, name: whName });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('warehouse_stock_updated', { detail: { warehouseCode: whCode } }));
      window.dispatchEvent(new CustomEvent('warehouse_locations_updated', { detail: { locations: updated } }));
    }

    setIsParentModalOpen(false);
    setParentForm({
      code: '',
      name: '',
      plantScope: 'Plant 01 — Pune Hub',
      storeType: 'Finished Goods (FG)',
      zone: 'Zone A - High Bay Central',
      capacityKg: 50000,
      temperatureControlled: false,
      targetTemp: 22,
      address: 'Building B, Industrial Bay 4',
      description: '',
    });

    showToast(`✓ Parent Warehouse "${whCode} - ${whName}" saved in DB & connected globally!`);
  };

  const handleInitiateEdit = (loc: WarehouseLocationConfig) => {
    if (!isAdmin) {
      showToast('⚠️ Only Administrators have permission to edit warehouse/store configuration.');
      return;
    }

    const usage = isStoreInUse(loc.binCode);
    const whUsage = isStoreInUse(loc.warehouseCode);

    if (usage.inUse || whUsage.inUse) {
      const reasonMsg = usage.reason || whUsage.reason || 'Active inventory stock or movement records exist.';
      showToast(`🔒 Cannot edit "${loc.binCode}": Store is actively in use in ERP operations. (${reasonMsg})`);
      return;
    }

    setEditingLoc({ ...loc });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoc) return;

    if (!isAdmin) {
      showToast('⚠️ Admin privileges required to update warehouse location.');
      return;
    }

    const usage = isStoreInUse(editingLoc.binCode);
    if (usage.inUse) {
      showToast(`🔒 Cannot update "${editingLoc.binCode}": Store is actively in use in inventory.`);
      setEditingLoc(null);
      return;
    }

    const updated = locations.map((l) => (l.id === editingLoc.id ? editingLoc : l));
    saveLocations(updated);

    masterDataGovernanceService.saveBin({
      code: editingLoc.binCode,
      warehouseCode: editingLoc.warehouseCode,
      zone: editingLoc.zoneName,
    });

    try {
      await SupabaseDataService.upsertLocationBin({
        id: editingLoc.id,
        bin_code: editingLoc.binCode,
        warehouse_code: editingLoc.warehouseCode,
        zone_type: editingLoc.zoneType,
        aisle: editingLoc.aisle,
        rack: editingLoc.rack,
        shelf: editingLoc.shelf,
        max_capacity_kg: editingLoc.maxCapacityKg,
      });
    } catch (err) {
      console.warn('Supabase update notice:', err);
    }

    adminEventBus.emit('BIN_MASTER_SAVED', editingLoc);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('warehouse_locations_updated', { detail: { locations: updated } }));
    }

    showToast(`✓ Store Location "${editingLoc.binCode}" updated successfully in DB.`);
    setEditingLoc(null);
  };

  const handleDeleteLocation = (loc: WarehouseLocationConfig) => {
    if (!isAdmin) {
      showToast('⚠️ Only Administrators can delete storage locations.');
      return;
    }

    const usage = isStoreInUse(loc.binCode);
    if (usage.inUse) {
      showToast(`🔒 Cannot delete "${loc.binCode}": Store has active inventory stock or ledger transactions.`);
      return;
    }

    const updated = locations.filter((l) => l.id !== loc.id);
    saveLocations(updated);
    showToast(`Deleted unused location: ${loc.binCode}.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Warehouse className="w-4 h-4 text-[#0F8B8D]" />
            <span>Inventory Logistics &amp; Storage Topography</span>
            {isAdmin ? (
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Admin Mode (Full Access)
              </span>
            ) : (
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Read-Only Mode
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Warehouse &amp; Location Code Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure raw polymer outdoor silos, climate-controlled masterbatch rooms, high-bay finished component racks, and quarantine holding zones.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {isAdmin ? (
            <>
              <button
                onClick={() => setIsParentModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Warehouse className="w-3.5 h-3.5 text-amber-400" />
                + Create Parent Warehouse
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Location Bin
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin Privileges Required for Creation</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search bins or stores by code (e.g. SILO-PP-01, WH-FG-01)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {zones.map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedZone === z
                  ? 'bg-[#0F8B8D] text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Locations and Warehouses (Task-3: Shows all newly created stores) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((loc) => {
          const occupancyPct = Math.round((loc.currentOccupancyKg / loc.maxCapacityKg) * 100);
          const usage = isStoreInUse(loc.binCode);
          const whUsage = isStoreInUse(loc.warehouseCode);
          const isUsedInActivity = usage.inUse || whUsage.inUse;

          return (
            <div
              key={loc.id}
              className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all relative ${
                loc.isBlocked
                  ? 'border-rose-200 bg-rose-50/10'
                  : isUsedInActivity
                  ? 'border-slate-200 hover:border-teal-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {loc.binCode}
                      </span>
                      {isUsedInActivity && (
                        <span
                          title={usage.reason || whUsage.reason || 'Store actively used in inventory transactions.'}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          Activity Locked
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1 font-semibold">
                      {loc.warehouseCode} &middot; {loc.plantName || 'Plant 01'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Task-1: Edit Button (Only Admin & Only if Unused) */}
                    <button
                      onClick={() => handleInitiateEdit(loc)}
                      disabled={!isAdmin || isUsedInActivity}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        !isAdmin || isUsedInActivity
                          ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-[#0F8B8D] hover:text-white cursor-pointer'
                      }`}
                      title={
                        !isAdmin
                          ? 'Only Administrator can edit store configuration'
                          : isUsedInActivity
                          ? `Locked: ${usage.reason || whUsage.reason || 'Store actively referenced in inventory transactions.'}`
                          : 'Edit store & bin location parameters'
                      }
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Lock/Unlock Putaway Toggle */}
                    <button
                      onClick={() => handleToggleLock(loc.id)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        loc.isBlocked
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={loc.isBlocked ? 'Unlock Location' : 'Lock Location'}
                    >
                      {loc.isBlocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete button (only if unused & admin) */}
                    {isAdmin && !isUsedInActivity && (
                      <button
                        onClick={() => handleDeleteLocation(loc)}
                        className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete unused storage location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="font-bold text-xs text-slate-800">{loc.warehouseName || loc.zoneName}</h4>
                  <span className="text-[11px] text-[#0F8B8D] font-medium">{loc.zoneType}</span>
                </div>

                {/* Coordinate hierarchy pills */}
                <div className="flex items-center gap-1.5 mt-2.5 text-[10px] font-mono font-semibold text-slate-600">
                  <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded">Aisle: {loc.aisle}</span>
                  <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded">Rack: {loc.rack}</span>
                  <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded">Shelf: {loc.shelf}</span>
                </div>

                {/* Climate Badge if controlled */}
                {loc.temperatureControlled && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg w-fit font-medium">
                    <Thermometer className="w-3 h-3" />
                    <span>
                      Temp: {loc.targetTempCelsius || 22}°C &middot; Climate Controlled
                    </span>
                  </div>
                )}
              </div>

              {/* Occupancy Weight Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-slate-400" />
                    Occupancy
                  </span>
                  <span className="font-bold font-mono text-slate-800">
                    {loc.currentOccupancyKg.toLocaleString()} / {loc.maxCapacityKg.toLocaleString()} KG ({occupancyPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      occupancyPct > 90
                        ? 'bg-rose-500'
                        : occupancyPct > 70
                        ? 'bg-amber-500'
                        : 'bg-[#0F8B8D]'
                    }`}
                    style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for adding bin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add Location Bin Coordinate</h3>
            <p className="text-xs text-slate-500 mb-4">
              Provision a new bin code with barcode scanner registration and weight thresholds (Saved to DB).
            </p>

            <form onSubmit={handleAddBin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Warehouse</label>
                <select
                  value={binForm.warehouseCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const whObj = availableParentWarehouses.find((w) => w.code === code);
                    setBinForm({
                      ...binForm,
                      warehouseCode: code,
                      warehouseName: whObj?.name || 'Warehouse Storage Store',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                >
                  {availableParentWarehouses.map((wh) => (
                    <option key={wh.code} value={wh.code}>
                      {wh.code} — {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Storage Zone Type</label>
                <select
                  value={binForm.zoneType}
                  onChange={(e) => setBinForm({ ...binForm, zoneType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                >
                  <option value="Raw Polymer Silos">Raw Polymer Silos</option>
                  <option value="Masterbatch Temperature Controlled">Masterbatch Temperature Controlled</option>
                  <option value="Finished Goods High-Bay">Finished Goods High-Bay</option>
                  <option value="Regrind / Scrap Staging">Regrind / Scrap Staging</option>
                  <option value="Tool & Die Staging">Tool &amp; Die Staging</option>
                  <option value="Quarantine & Hold">Quarantine &amp; Hold</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Zone Descriptive Name</label>
                <input
                  type="text"
                  value={binForm.zoneName}
                  onChange={(e) => setBinForm({ ...binForm, zoneName: e.target.value })}
                  placeholder="e.g. Auxiliary High-Bay Racks"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Aisle</label>
                  <input
                    type="text"
                    value={binForm.aisle}
                    onChange={(e) => setBinForm({ ...binForm, aisle: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rack</label>
                  <input
                    type="text"
                    value={binForm.rack}
                    onChange={(e) => setBinForm({ ...binForm, rack: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shelf</label>
                  <input
                    type="text"
                    value={binForm.shelf}
                    onChange={(e) => setBinForm({ ...binForm, shelf: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maximum Weight Rating (KG)</label>
                <input
                  type="number"
                  value={binForm.maxCapacityKg}
                  onChange={(e) => setBinForm({ ...binForm, maxCapacityKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                >
                  Save Bin Location to DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for creating Parent Warehouse */}
      {isParentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 mb-1 text-slate-900 font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
                <Warehouse className="w-4 h-4" />
              </div>
              <span>Create Parent Warehouse Store</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Register a new top-level parent warehouse and connect it across the entire ERP ecosystem (Item Master, GRN, Production, BOM, Routing).
            </p>

            <form onSubmit={handleCreateParentWarehouse} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Warehouse Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-FG-02, WH-WIP-02"
                    value={parentForm.code}
                    onChange={(e) => setParentForm({ ...parentForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Warehouse Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanand Finished Goods Hub"
                    value={parentForm.name}
                    onChange={(e) => setParentForm({ ...parentForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plant Association</label>
                  <select
                    value={parentForm.plantScope}
                    onChange={(e) => setParentForm({ ...parentForm, plantScope: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Plant 01 — Pune Hub">Plant 01 — Pune Hub</option>
                    <option value="Plant 02 — Sanand Precision">Plant 02 — Sanand Precision</option>
                    <option value="Plant 03 — Chennai Molding">Plant 03 — Chennai Molding</option>
                    <option value="All Plants">All Plants (Universal Enterprise)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store Category / Type</label>
                  <select
                    value={parentForm.storeType}
                    onChange={(e) => setParentForm({ ...parentForm, storeType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Finished Goods (FG)">Finished Goods (FG)</option>
                    <option value="Work In Progress (WIP)">Work In Progress (WIP)</option>
                    <option value="Raw Materials (RM)">Raw Materials (RM)</option>
                    <option value="Masterbatch & Additives (MB)">Masterbatch &amp; Additives (MB)</option>
                    <option value="Assembly Store (ASM)">Assembly Store (ASM)</option>
                    <option value="De-Flash Store (DFL)">De-Flash Store (DFL)</option>
                    <option value="Spare Parts & Tooling (SP)">Spare Parts &amp; Tooling (SP)</option>
                    <option value="Packaging Materials (PCK)">Packaging Materials (PCK)</option>
                    <option value="Consumables & Oils (CON)">Consumables &amp; Oils (CON)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Zone Title</label>
                  <input
                    type="text"
                    value={parentForm.zone}
                    onChange={(e) => setParentForm({ ...parentForm, zone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Capacity (KG / Units)</label>
                  <input
                    type="number"
                    value={parentForm.capacityKg}
                    onChange={(e) => setParentForm({ ...parentForm, capacityKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Building Location &amp; Address</label>
                <input
                  type="text"
                  value={parentForm.address}
                  onChange={(e) => setParentForm({ ...parentForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={parentForm.temperatureControlled}
                    onChange={(e) => setParentForm({ ...parentForm, temperatureControlled: e.target.checked })}
                    className="rounded text-[#0F8B8D]"
                  />
                  <span>Climate / Temperature Controlled Warehouse</span>
                </label>

                {parentForm.temperatureControlled && (
                  <div className="flex items-center gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Target Temp (°C)</label>
                      <input
                        type="number"
                        value={parentForm.targetTemp}
                        onChange={(e) => setParentForm({ ...parentForm, targetTemp: Number(e.target.value) })}
                        className="w-24 px-2 py-1 rounded border border-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsParentModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Warehouse className="w-3.5 h-3.5 text-amber-400" />
                  Save &amp; Connect Warehouse in DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Editing Unused Store / Bin (Task-1) */}
      {editingLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-base">Edit Location: {editingLoc.binCode}</h3>
              <button
                onClick={() => setEditingLoc(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Update capacity thresholds and spatial coordinates for this unused bin.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Zone Descriptive Title</label>
                <input
                  type="text"
                  value={editingLoc.zoneName}
                  onChange={(e) => setEditingLoc({ ...editingLoc, zoneName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Aisle</label>
                  <input
                    type="text"
                    value={editingLoc.aisle}
                    onChange={(e) => setEditingLoc({ ...editingLoc, aisle: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rack</label>
                  <input
                    type="text"
                    value={editingLoc.rack}
                    onChange={(e) => setEditingLoc({ ...editingLoc, rack: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shelf</label>
                  <input
                    type="text"
                    value={editingLoc.shelf}
                    onChange={(e) => setEditingLoc({ ...editingLoc, shelf: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Capacity (KG)</label>
                <input
                  type="number"
                  value={editingLoc.maxCapacityKg}
                  onChange={(e) => setEditingLoc({ ...editingLoc, maxCapacityKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingLoc.temperatureControlled}
                    onChange={(e) => setEditingLoc({ ...editingLoc, temperatureControlled: e.target.checked })}
                    className="rounded text-[#0F8B8D]"
                  />
                  <span>Climate / Temperature Controlled</span>
                </label>

                {editingLoc.temperatureControlled && (
                  <div className="flex items-center gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Target Temp (°C)</label>
                      <input
                        type="number"
                        value={editingLoc.targetTempCelsius || 22}
                        onChange={(e) => setEditingLoc({ ...editingLoc, targetTempCelsius: Number(e.target.value) })}
                        className="w-24 px-2 py-1 rounded border border-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingLoc(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Changes to DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
