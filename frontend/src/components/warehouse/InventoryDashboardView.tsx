import React from 'react';
import {
  Package,
  Layers,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Truck,
  RotateCw,
  Archive,
  ShoppingBag,
  ShieldAlert,
  Search,
  Plus,
  ArrowRight,
  Printer,
  Barcode,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react';
import {
  InventoryStockItem,
  WarehouseLocation,
  PutawayTask,
  PickPackTask,
  QuarantineLotRecord,
} from '../../types/warehouse';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';

interface Props {
  stockItems: InventoryStockItem[];
  locations: WarehouseLocation[];
  putawayTasks: PutawayTask[];
  pickTasks: PickPackTask[];
  quarantineLots: QuarantineLotRecord[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const InventoryDashboardView: React.FC<Props> = ({
  stockItems,
  locations,
  putawayTasks,
  pickTasks,
  quarantineLots,
  onNavigate,
  showToast,
}) => {
  const totalValuation = stockItems.reduce((sum, item) => sum + item.totalValuationInr, 0);
  const lowStockItems = stockItems.filter((i) => i.status === 'low_stock' || i.totalOnHand <= i.reorderPointKg);
  const pendingPutawayCount = putawayTasks.filter((t) => t.status !== 'completed').length;
  const activePickCount = pickTasks.filter((t) => t.status !== 'shipped').length;
  const totalQuarantineKg = quarantineLots.filter((q) => q.dispositionStatus === 'pending_disposition').reduce((a, b) => a + b.quantityKg, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/30 uppercase tracking-wider">
              Plant 01 &middot; Warehouse Command Center
            </span>
          </div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Inventory &amp; Stock Operations
          </h1>
          <p className="text-xs text-slate-500">
            Real-time silo balances, multi-zone bin tracking, pick-and-pack queues, and closed-loop regrind recycling
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('putaway')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Archive className="w-3.5 h-3.5 text-[#0F8B8D]" /> Putaway ({pendingPutawayCount})
          </button>
          <button
            onClick={() => onNavigate('picking')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#E8622C]" /> Pick &amp; Pack ({activePickCount})
          </button>
          <button
            onClick={() => onNavigate('scanner')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Barcode className="w-3.5 h-3.5 text-slate-700" /> Scanner Terminal
          </button>
          <button
            onClick={() => onNavigate('labelPrint')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print Barcodes
          </button>
        </div>
      </div>

      {/* 5 Core Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Valuation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Inventory Value</span>
            <Package className="w-4 h-4 text-[#0F8B8D]" />
          </div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            ₹{(totalValuation / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +1.4% valuation parity
          </div>
        </div>

        {/* Active SKUs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Managed SKUs</span>
            <Layers className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            {stockItems.length} SKUs
          </div>
          <div className="text-[10px] text-slate-400">6 Polymer Families</div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Below Reorder Level</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-amber-600">
            {lowStockItems.length} SKUs
          </div>
          <div className="text-[10px] text-amber-700 font-medium">Reorder triggered via MRP</div>
        </div>

        {/* Quarantine Holds */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Quarantine QC Hold</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-purple-700">
            {totalQuarantineKg.toLocaleString()} KG
          </div>
          <div className="text-[10px] text-slate-400">2 Lots in MRB review</div>
        </div>

        {/* Closed-Loop Regrind Savings */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Regrind Stock Balance</span>
            <RotateCw className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700">
            5,800 KG
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold">14.2% avg blend ratio</div>
        </div>
      </div>

      {/* Visual Warehouse Zones Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold font-['Space_Grotesk'] text-[#14213D]">
              Plant 01 Storage Zones &amp; Capacity Utilization
            </h2>
            <p className="text-xs text-slate-500">Live occupancy sensors across Silos, Vaults, Pallet Racks, and Regrind Silos</p>
          </div>
          <button
            onClick={() => onNavigate('binMap')}
            className="text-xs text-[#0F8B8D] font-semibold hover:underline flex items-center gap-1"
          >
            Open 2D Warehouse Bin Map <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {locations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => onNavigate('binMap', { zone: loc.code })}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-[#0F8B8D] transition cursor-pointer space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500">
                  <span>{loc.code}</span>
                  {loc.temperatureControlled && (
                    <span className="text-[9px] px-1 bg-sky-100 text-sky-800 rounded">22°C</span>
                  )}
                </div>
                <div className="font-bold text-xs text-[#14213D] mt-1 leading-tight">{loc.name}</div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Capacity: {(loc.capacityKg / 1000).toFixed(0)}T</span>
                  <span className="font-bold text-[#14213D]">{loc.occupancyPct}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      loc.occupancyPct > 80
                        ? 'bg-amber-500'
                        : loc.occupancyPct > 60
                        ? 'bg-[#0F8B8D]'
                        : 'bg-teal-500'
                    }`}
                    style={{ width: `${loc.occupancyPct}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1.5">
                  Occupied: {(loc.currentOccupiedKg / 1000).toFixed(1)} Tons
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Dispatch Queues (Putaway vs Picking) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pending Inward Putaway Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F8B8D] flex items-center justify-center font-bold">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#14213D]">Inward Dock Putaway Tasks</h3>
                <p className="text-xs text-slate-500">Unloaded goods awaiting transport to storage bins</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('putaway')}
              className="text-xs text-[#0F8B8D] font-semibold hover:underline"
            >
              View All ({putawayTasks.length})
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {putawayTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#14213D]">{task.taskNumber}</span>
                    <WarehouseStatusBadge status={task.status} size="xs" />
                  </div>
                  <div className="text-slate-700 font-medium">{task.itemName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {task.quantity.toLocaleString()} {task.uom} &rarr; Target: <span className="font-bold text-[#0F8B8D]">{task.recommendedBin}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    showToast(`Putaway Task ${task.taskNumber} assigned to forklift terminal`);
                    onNavigate('putaway');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                >
                  Execute
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Picking & Production Staging */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#E8622C] flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#14213D]">Production &amp; Dispatch Picking Lists</h3>
                <p className="text-xs text-slate-500">Material staging for Injection Molding Bays &amp; Sales Deliveries</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('picking')}
              className="text-xs text-[#E8622C] font-semibold hover:underline"
            >
              View All ({pickTasks.length})
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {pickTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#14213D]">{task.pickListNumber}</span>
                    <WarehouseStatusBadge status={task.status} size="xs" />
                  </div>
                  <div className="text-slate-700 font-medium">Target: {task.destinationLocation}</div>
                  <div className="text-[11px] text-slate-400">
                    Lines: {task.pickedLines}/{task.totalLines} Picked &bull; Ref: <span className="font-mono">{task.referenceNumber}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('picking')}
                  className="px-3 py-1.5 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold transition"
                >
                  Pick Sheet
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
