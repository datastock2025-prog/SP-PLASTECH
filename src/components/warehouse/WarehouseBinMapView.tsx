import React, { useState } from 'react';
import {
  Layers,
  MapPin,
  Thermometer,
  ShieldAlert,
  Package,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
} from 'lucide-react';
import { WarehouseLocation, InventoryStockItem } from '../../types/warehouse';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';

interface Props {
  locations: WarehouseLocation[];
  stockItems: InventoryStockItem[];
  selectedZoneCode?: string;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

interface VisualBin {
  code: string;
  name: string;
  type: string;
  capacityKg: number;
  currentKg: number;
  occupancyPct: number;
  itemSku?: string;
  itemName?: string;
  lotNumber?: string;
  tempControlled?: boolean;
}

export const WarehouseBinMapView: React.FC<Props> = ({
  locations,
  stockItems,
  selectedZoneCode,
  onNavigate,
  showToast,
}) => {
  const [activeZone, setActiveZone] = useState<string>(selectedZoneCode || locations[0]?.code || 'SILO-ZONE-A');
  const [selectedBin, setSelectedBin] = useState<VisualBin | null>(null);

  // Generate bins for each zone
  const generateZoneBins = (zoneCode: string): VisualBin[] => {
    switch (zoneCode) {
      case 'SILO-ZONE-A':
        return [
          { code: 'SILO-01-A', name: 'Bulk Silo #1', type: 'Silo', capacityKg: 25000, currentKg: 14500, occupancyPct: 58, itemSku: 'RM-PP-NAT-001', itemName: 'PP Natural Homopolymer Granules', lotNumber: 'LOT-2026-PP-881' },
          { code: 'SILO-01-B', name: 'Bulk Silo #2', type: 'Silo', capacityKg: 25000, currentKg: 20000, occupancyPct: 80, itemSku: 'RM-PP-NAT-001', itemName: 'PP Natural Homopolymer Granules', lotNumber: 'LOT-2026-PP-902' },
          { code: 'BAY-A-03-RACK', name: 'Raw Material Rack A3', type: 'Pallet Rack', capacityKg: 20000, currentKg: 14200, occupancyPct: 71, itemSku: 'RM-HDPE-INJ-002', itemName: 'HDPE Injection Grade M26500', lotNumber: 'LOT-2026-HD-410' },
          { code: 'BAY-A-04-RACK', name: 'Raw Material Rack A4', type: 'Pallet Rack', capacityKg: 20000, currentKg: 18000, occupancyPct: 90, itemSku: 'RM-PP-COPOLY-01', itemName: 'PP Impact Copolymer', lotNumber: 'LOT-2026-CP-110' },
          { code: 'BAY-A-09-RACK', name: 'Raw Material Rack A9', type: 'Pallet Rack', capacityKg: 10000, currentKg: 1800, occupancyPct: 18, itemSku: 'RM-NYLON-66-GF30', itemName: 'PA66 Glass Filled 30% Natural', lotNumber: 'LOT-NY-301' },
          { code: 'BAY-A-10-RACK', name: 'Raw Material Rack A10', type: 'Pallet Rack', capacityKg: 15000, currentKg: 0, occupancyPct: 0, itemName: 'Empty Available Bin' },
        ];

      case 'MB-RACK-ZONE-B':
        return [
          { code: 'VAULT-B-01-RACK', name: 'Color Vault Bin B1', type: 'Climate Rack', capacityKg: 3000, currentKg: 2400, occupancyPct: 80, itemSku: 'MB-BLK-001', itemName: 'Carbon Black Masterbatch 40%', lotNumber: 'LOT-2026-MB-108', tempControlled: true },
          { code: 'VAULT-B-02-RACK', name: 'Color Vault Bin B2', type: 'Climate Rack', capacityKg: 3000, currentKg: 1850, occupancyPct: 62, itemSku: 'MB-WHT-002', itemName: 'Titanium White Masterbatch 60%', lotNumber: 'LOT-2026-MB-W88', tempControlled: true },
          { code: 'VAULT-B-03-RACK', name: 'Color Vault Bin B3', type: 'Climate Rack', capacityKg: 3000, currentKg: 950, occupancyPct: 32, itemSku: 'MB-BLU-003', itemName: 'Phthalo Blue Masterbatch', lotNumber: 'LOT-MB-BLU-19', tempControlled: true },
          { code: 'VAULT-B-04-RACK', name: 'Additive Vault Bin B4', type: 'Climate Rack', capacityKg: 2000, currentKg: 1600, occupancyPct: 80, itemSku: 'ADD-UV-STAB-01', itemName: 'Hindered Amine Light Stabilizer (HALS)', lotNumber: 'LOT-UV-401', tempControlled: true },
        ];

      case 'FG-PALLET-ZONE-C':
        return [
          { code: 'BAY-C-01-RACK', name: 'High-Bay Level 1', type: 'Euro Pallet', capacityKg: 10000, currentKg: 8500, occupancyPct: 85, itemSku: 'FG-AUTO-BEZEL-01', itemName: 'Automotive HVAC Control Bezel', lotNumber: 'LOT-FG-8891' },
          { code: 'BAY-C-02-RACK', name: 'High-Bay Level 2', type: 'Euro Pallet', capacityKg: 10000, currentKg: 9200, occupancyPct: 92, itemSku: 'FG-MED-VIAL-02', itemName: 'Medical Diagnostic Vial 15ml', lotNumber: 'LOT-FG-9902' },
          { code: 'BAY-C-03-RACK', name: 'High-Bay Level 3', type: 'Euro Pallet', capacityKg: 10000, currentKg: 4000, occupancyPct: 40, itemSku: 'FG-ELEC-ENCLOSURE', itemName: 'DIN Rail Electrical Junction Box', lotNumber: 'LOT-FG-3012' },
          { code: 'BAY-C-04-RACK', name: 'High-Bay Level 4', type: 'Euro Pallet', capacityKg: 10000, currentKg: 0, occupancyPct: 0, itemName: 'Empty Available Pallet Slot' },
        ];

      case 'REGRIND-ZONE-D':
        return [
          { code: 'REGRIND-SILO-01', name: 'PP Regrind Silo #1', type: 'Recycle Silo', capacityKg: 20000, currentKg: 5800, occupancyPct: 29, itemSku: 'RG-PP-NAT-001', itemName: 'PP Regrind Flakes (4mm)', lotNumber: 'LOT-RG-2026-044' },
          { code: 'REGRIND-SILO-02', name: 'HDPE Regrind Silo #2', type: 'Recycle Silo', capacityKg: 20000, currentKg: 3200, occupancyPct: 16, itemSku: 'RG-HDPE-INJ-002', itemName: 'HDPE Reground Flakes', lotNumber: 'LOT-RG-2026-045' },
        ];

      case 'QUARANTINE-HOLD-01':
        return [
          { code: 'HOLD-CAGE-01', name: 'Quarantine Cage Bay 1', type: 'Hold Cage', capacityKg: 10000, currentKg: 3500, occupancyPct: 35, itemSku: 'RM-PP-NAT-001', itemName: 'PP Homopolymer (MFI Out of Spec)', lotNumber: 'LOT-2026-PP-879' },
          { code: 'HOLD-CAGE-02', name: 'Quarantine Cage Bay 2', type: 'Hold Cage', capacityKg: 10000, currentKg: 300, occupancyPct: 3, itemSku: 'MB-RED-002', itemName: 'Flame Red Masterbatch 30%', lotNumber: 'LOT-MB-RED-44' },
        ];

      default:
        return [
          { code: 'CRIB-TOOL-01', name: 'Mold Die Rack Level 1', type: 'Heavy Tool Rack', capacityKg: 50000, currentKg: 42000, occupancyPct: 84, itemName: '16-Cavity Vial Mold Die #M104' },
          { code: 'CRIB-TOOL-02', name: 'Mold Die Rack Level 2', type: 'Heavy Tool Rack', capacityKg: 50000, currentKg: 38000, occupancyPct: 76, itemName: '4-Cavity HVAC Bezel Mold Die #M142' },
        ];
    }
  };

  const currentZoneData = locations.find((l) => l.code === activeZone) || locations[0];
  const bins = generateZoneBins(activeZone);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/30 uppercase tracking-wider">
              Warehouse 2D Layout &middot; Bin Topology
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Plant 01 Warehouse Bin Map &amp; Spatial Occupancy
          </h1>
          <p className="text-xs text-slate-500">
            Interactive visual layout across Silos, Cold Vaults, High-Bay Pallet Racks, and Regrind Silos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('stockList')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Package className="w-3.5 h-3.5" /> Stock Ledger
          </button>
          <button
            onClick={() => onNavigate('putaway')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <MapPin className="w-3.5 h-3.5" /> Smart Putaway
          </button>
        </div>
      </div>

      {/* Zone Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {locations.map((loc) => (
          <button
            key={loc.code}
            onClick={() => {
              setActiveZone(loc.code);
              setSelectedBin(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              activeZone === loc.code
                ? 'bg-[#14213D] text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{loc.name.split('&')[0]}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                activeZone === loc.code ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {loc.occupancyPct}%
            </span>
          </button>
        ))}
      </div>

      {/* Zone Overview Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#0F8B8D]">{currentZoneData.code}</span>
            <h2 className="text-sm font-bold text-[#14213D]">{currentZoneData.name}</h2>
            {currentZoneData.temperatureControlled && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full border border-sky-200">
                <Thermometer className="w-3 h-3" /> Dehumidified 22°C Vault
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{currentZoneData.description}</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <div className="text-slate-400 text-[10px]">Total Capacity</div>
            <div className="font-bold text-[#14213D]">{(currentZoneData.capacityKg / 1000).toFixed(0)} Tons</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px]">Occupied Stock</div>
            <div className="font-bold text-[#0F8B8D]">{(currentZoneData.currentOccupiedKg / 1000).toFixed(1)} Tons</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px]">Occupancy Level</div>
            <div className="font-bold text-amber-600">{currentZoneData.occupancyPct}%</div>
          </div>
        </div>
      </div>

      {/* 2D Visual Bin Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bins.map((bin) => {
          const isOccupied = bin.occupancyPct > 0;
          return (
            <div
              key={bin.code}
              onClick={() => setSelectedBin(bin)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedBin?.code === bin.code
                  ? 'border-[#0F8B8D] bg-teal-50/40 shadow-md ring-2 ring-[#0F8B8D]/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Bin Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      bin.occupancyPct > 80
                        ? 'bg-rose-500'
                        : bin.occupancyPct > 50
                        ? 'bg-amber-500'
                        : bin.occupancyPct > 0
                        ? 'bg-emerald-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  <span className="font-mono font-bold text-xs text-[#14213D]">{bin.code}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                  {bin.type}
                </span>
              </div>

              {/* Stored Content */}
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {bin.itemName || 'Available Empty Bin Slot'}
                </div>
                {bin.itemSku && (
                  <div className="text-[11px] font-mono text-[#0F8B8D] mt-0.5">
                    SKU: {bin.itemSku}
                  </div>
                )}
                {bin.lotNumber && (
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Lot: {bin.lotNumber}
                  </div>
                )}
              </div>

              {/* Progress Bar & Weight */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1 font-mono">
                  <span>{bin.currentKg.toLocaleString()} / {bin.capacityKg.toLocaleString()} KG</span>
                  <span className="font-bold text-[#14213D]">{bin.occupancyPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      bin.occupancyPct > 80
                        ? 'bg-rose-500'
                        : bin.occupancyPct > 50
                        ? 'bg-amber-500'
                        : bin.occupancyPct > 0
                        ? 'bg-emerald-500'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${bin.occupancyPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Bin Inspector Drawer / Banner */}
      {selectedBin && (
        <div className="bg-[#14213D] text-white p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#E8622C]">{selectedBin.code}</span>
              <span className="text-xs text-slate-300 font-semibold">{selectedBin.name}</span>
            </div>
            <div className="text-sm font-bold">{selectedBin.itemName}</div>
            <div className="text-xs text-slate-400 font-mono">
              Weight: {selectedBin.currentKg.toLocaleString()} KG &bull; Lot: {selectedBin.lotNumber || 'N/A'} &bull; Max Capacity: {selectedBin.capacityKg.toLocaleString()} KG
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                showToast(`Relocation task dispatched for Bin ${selectedBin.code}`);
              }}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition"
            >
              Relocate Stock
            </button>
            <button
              onClick={() => onNavigate('labelPrint')}
              className="px-3.5 py-2 bg-[#E8622C] hover:bg-[#d4531f] text-white rounded-lg text-xs font-semibold transition"
            >
              Print Bin Tag Barcode
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
