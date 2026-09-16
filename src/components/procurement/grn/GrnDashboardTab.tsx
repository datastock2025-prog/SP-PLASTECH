import React from 'react';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Printer,
  Settings,
  Scale,
  FileCheck,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { GoodsReceiptNoteExt, ConfirmedPoQueueItem, GrnPutawayTask } from '../../../types/grnTypes';

interface Props {
  grns: GoodsReceiptNoteExt[];
  poQueue: ConfirmedPoQueueItem[];
  putawayTasks: GrnPutawayTask[];
  onTabChange: (tab: string) => void;
  onOpenCreateModal: (poItem?: ConfirmedPoQueueItem) => void;
  onOpenMobileScan: () => void;
  onOpenSettings: () => void;
  onSelectGrn: (grn: GoodsReceiptNoteExt) => void;
}

export const GrnDashboardTab: React.FC<Props> = ({
  grns,
  poQueue,
  putawayTasks,
  onTabChange,
  onOpenCreateModal,
  onOpenMobileScan,
  onOpenSettings,
  onSelectGrn,
}) => {
  // Compute KPIs
  const totalGrns = grns.length;
  const pendingPoQueueCount = poQueue.length;
  const pendingQcCount = grns.filter((g) => g.status === 'pending_qc' || g.inspectionStatus === 'Pending').length;
  const pendingPutawayCount = putawayTasks.filter((p) => p.putawayStatus === 'Pending' || p.putawayStatus === 'In Progress').length;
  const overReceiptCount = grns.filter((g) => g.lines.some((l) => l.toleranceWarning.includes('over_tolerance'))).length;
  const totalVolumeReceivedKg = grns.reduce((sum, g) => {
    return sum + g.lines.reduce((lSum, l) => lSum + (l.uom === 'KG' ? l.currentReceivedQty : 0), 0);
  }, 0);

  const pendingVehiclesCount = poQueue.filter((p) => p.vehicleArrived).length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-linear-to-r from-[#14213D] via-[#1a2d52] to-[#0F8B8D] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <Truck className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[#5eead4] text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Gate Inward Dock & Material Inflow Engine
            </div>
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">
              Goods Receipt Note (GRN) Control Center
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Real-time gate arrivals, physical bag & weighbridge tally, lot/batch capture, configurable QC routing (before or after posting), automated tolerance enforcement, and FEFO putaway.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onTabChange('queue')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#14213D] hover:bg-slate-100 rounded-xl text-xs font-bold shadow-sm transition transform active:scale-95"
            >
              <Truck className="w-4 h-4 text-[#0F8B8D]" />
              Receive PO Queue ({pendingPoQueueCount})
            </button>
            <button
              onClick={onOpenMobileScan}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-xs border border-white/20 transition"
            >
              <Smartphone className="w-4 h-4 text-amber-300" />
              Mobile Dock Scanner
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition border border-white/15"
              title="GRN & QC Tolerance Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div
          onClick={() => onTabChange('queue')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">PO Receiving Queue</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-110 transition">
              <Truck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900">{pendingPoQueueCount}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-1">
            {pendingVehiclesCount} vehicle{pendingVehiclesCount === 1 ? '' : 's'} at dock
          </div>
        </div>

        <div
          onClick={() => onTabChange('allGrns')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">Total GRNs Logged</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition">
              <FileCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900">{totalGrns}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            {totalVolumeReceivedKg.toLocaleString()} KG total
          </div>
        </div>

        <div
          onClick={() => onTabChange('qc')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">Quarantine / QC Hold</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-110 transition">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-amber-600">{pendingQcCount}</div>
          <div className="text-[10px] text-amber-700 font-medium mt-1">
            Awaiting lab clearance
          </div>
        </div>

        <div
          onClick={() => onTabChange('putaway')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">Putaway Tasks</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:scale-110 transition">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-purple-700">{pendingPutawayCount}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-1">
            Dock to warehouse bins
          </div>
        </div>

        <div
          onClick={() => onTabChange('exceptions')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-rose-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">Tolerance & Exceptions</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:scale-110 transition">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-rose-600">{overReceiptCount}</div>
          <div className="text-[10px] text-rose-700 font-medium mt-1">
            Damaged or over-supply
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">Weighbridge Status</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Scale className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Scale #1 Online
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Tare calibration verified</div>
        </div>
      </div>

      {/* Two Column Section: Live Dock Queue & Recent Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Confirmed PO Receiving Queue Teaser */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">PO Inward Queue</span>
              <h3 className="font-bold text-sm text-slate-800">Confirmed Orders Awaiting Gate Receipt</h3>
            </div>
            <button
              onClick={() => onTabChange('queue')}
              className="text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1"
            >
              View Full Queue <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {poQueue.slice(0, 4).map((po) => (
              <div
                key={po.id}
                className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {po.poNumber}
                    </span>
                    <span className="font-semibold text-xs text-slate-900">{po.supplierName}</span>
                    {po.vehicleArrived && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Truck Arrived: {po.vehicleNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="font-medium text-slate-800">{po.itemName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-slate-500">{po.itemCode}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span>Expected: {po.expectedDate}</span>
                    <span>•</span>
                    <span>Dock: {po.receivingDock}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">Open Qty: {po.openPoQty.toLocaleString()} {po.uom}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onOpenCreateModal(po)}
                    className="px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Create GRN
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Quality Inspection & Putaway Quick Status */}
        <div className="space-y-4">
          {/* Quality Quarantine Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-xs text-slate-800">Quarantine & Quality Holds</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {pendingQcCount} Pending
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Materials requiring lab testing (MFI, density, ash %, moisture) before posting to available inventory.
            </p>

            {grns
              .filter((g) => g.status === 'pending_qc')
              .slice(0, 2)
              .map((g) => (
                <div
                  key={g.id}
                  onClick={() => onSelectGrn(g)}
                  className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs space-y-1 cursor-pointer hover:bg-amber-100/60 transition"
                >
                  <div className="flex items-center justify-between font-mono font-bold text-amber-900">
                    <span>{g.grnNumber}</span>
                    <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-amber-200/80">Pending QC</span>
                  </div>
                  <div className="text-[11px] text-slate-700 truncate">{g.lines[0]?.itemName}</div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Lot: {g.lines[0]?.lotBatchNumber}</span>
                    <span>{g.lines[0]?.currentReceivedQty} {g.lines[0]?.uom}</span>
                  </div>
                </div>
              ))}

            <button
              onClick={() => onTabChange('qc')}
              className="w-full py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition text-center"
            >
              Open QC Inspection Console
            </button>
          </div>

          {/* Putaway Quick Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <h4 className="font-bold text-xs text-slate-800">Putaway Movements</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                {pendingPutawayCount} Tasks
              </span>
            </div>

            <div className="text-[11px] text-slate-500">
              Allocated to resin silos, masterbatch racks, and bulk pallets according to FEFO expiry rules.
            </div>

            <button
              onClick={() => onTabChange('putaway')}
              className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold transition text-center"
            >
              View Putaway Bin Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
