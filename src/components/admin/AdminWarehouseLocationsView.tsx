import React, { useState } from 'react';
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
} from 'lucide-react';
import { WarehouseLocationConfig, mockWarehouseLocations } from '../../data/mockAdminExtendedData';

interface AdminWarehouseLocationsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminWarehouseLocationsView: React.FC<AdminWarehouseLocationsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [locations, setLocations] = useState<WarehouseLocationConfig[]>(mockWarehouseLocations);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      loc.zoneName.toLowerCase().includes(search.toLowerCase());
    const matchZone = selectedZone === 'ALL' || loc.zoneType === selectedZone;
    return matchSearch && matchZone;
  });

  const handleToggleLock = (id: string) => {
    setLocations((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const next = !l.isBlocked;
          showToast(`Location ${l.binCode} ${next ? 'BLOCKED for putaway' : 'RELEASED for active storage'}.`);
          return { ...l, isBlocked: next };
        }
        return l;
      })
    );
  };

  const handleAddBin = (e: React.FormEvent) => {
    e.preventDefault();
    const newLoc: WarehouseLocationConfig = {
      id: `LOC-0${locations.length + 1}`,
      warehouseCode: 'WH-PUN-01',
      warehouseName: 'Chakan Central Polymer & Goods Hub',
      plantId: 'PLANT-01',
      plantName: 'Pune / Chakan Hub',
      zoneCode: 'Z-NEW',
      zoneName: 'Auxiliary Storage Rack',
      zoneType: 'Finished Goods High-Bay',
      aisle: 'C3',
      rack: 'R08',
      shelf: '02',
      binCode: `BIN-NEW-${locations.length + 1}`,
      maxCapacityKg: 5000,
      currentOccupancyKg: 0,
      temperatureControlled: false,
      isBlocked: false,
      barcodeScannable: true,
    };
    setLocations([...locations, newLoc]);
    setIsModalOpen(false);
    showToast(`Registered new storage location: ${newLoc.binCode}.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Warehouse className="w-4 h-4 text-[#0F8B8D]" />
            <span>Inventory Logistics &amp; Storage Topography</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Warehouse &amp; Location Code Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure raw polymer outdoor silos, climate-controlled masterbatch rooms, high-bay finished component racks, and quarantine holding zones.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Location Bin
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search bins by code (e.g. SILO-PP-01, MB-BLK-04C)..."
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
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
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

      {/* Grid of Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((loc) => {
          const occupancyPct = Math.round((loc.currentOccupancyKg / loc.maxCapacityKg) * 100);
          return (
            <div
              key={loc.id}
              className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                loc.isBlocked ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {loc.binCode}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1">
                      {loc.warehouseCode} &middot; {loc.plantName}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleLock(loc.id)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      loc.isBlocked
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={loc.isBlocked ? 'Unlock Location' : 'Lock Location'}
                  >
                    {loc.isBlocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="mt-3">
                  <h4 className="font-bold text-xs text-slate-800">{loc.zoneName}</h4>
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
                      Temp: {loc.targetTempCelsius}°C &middot; Max Hum: {loc.humidityMaxPct}%
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add Location Bin Coordinate</h3>
            <p className="text-xs text-slate-500 mb-4">
              Provision a new bin code with barcode scanner registration and weight thresholds.
            </p>

            <form onSubmit={handleAddBin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Storage Zone Type</label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-300">
                  <option>Raw Polymer Silos</option>
                  <option>Masterbatch Temperature Controlled</option>
                  <option>Finished Goods High-Bay</option>
                  <option>Regrind / Scrap Staging</option>
                  <option>Tool &amp; Die Staging</option>
                  <option>Quarantine &amp; Hold</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Aisle</label>
                  <input type="text" defaultValue="A2" className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rack</label>
                  <input type="text" defaultValue="R04" className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shelf</label>
                  <input type="text" defaultValue="01" className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maximum Weight Rating (KG)</label>
                <input
                  type="number"
                  defaultValue={5000}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm"
                >
                  Save Bin Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
