import React, { useState, useMemo, useCallback } from 'react';
import { WorkOrder, MachineMaster, ItemMaster, BomMaster } from '../../types';
import { MoldMaster } from '../../data/manufacturingData';
import { PaginationBar } from '../common/PaginationBar';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Calendar,
  Layers,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
  ArrowRight,
  Plus,
  RefreshCw,
  Zap,
  Sliders,
  MoveHorizontal,
  Lock,
  Flame,
  ArrowDownUp,
  FileSpreadsheet,
  Boxes,
  ExternalLink,
  Cpu,
  Eye,
  Check,
  Package,
} from 'lucide-react';

interface PlanningBoardProps {
  workOrders: WorkOrder[];
  machines: MachineMaster[];
  items: ItemMaster[];
  boms?: BomMaster[];
  molds: MoldMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateWO: (wo: WorkOrder) => void;
  onCreateWO: (wo: WorkOrder) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const MfgPlanningBoard: React.FC<PlanningBoardProps> = ({
  workOrders,
  machines,
  items,
  boms = [],
  molds,
  onNavigate,
  onUpdateWO,
  onCreateWO,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'machine' | 'product' | 'order' | 'shift'>('machine');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-28');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showOptimizationAlert, setShowOptimizationAlert] = useState<boolean>(true);

  // Debounce search input
  const debouncedSearch = useDebounce(searchTerm, 300);

  const itemMap = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((i) => map.set(i.code, i.name));
    return map;
  }, [items]);

  const itemName = useCallback((code: string) => itemMap.get(code) || code, [itemMap]);

  // Helper to find linked BOM for a Work Order
  const getLinkedBom = useCallback(
    (itemCode: string, bomId?: string): BomMaster | undefined => {
      if (bomId) {
        const directMatch = boms.find((b) => b.id === bomId);
        if (directMatch) return directMatch;
      }
      return boms.find((b) => b.parent === itemCode);
    },
    [boms]
  );

  const prodMachines = useMemo(() => {
    return machines.filter((m) => {
      const isProdType = ['Injection Molding Machine', 'Extrusion Line', 'Blow Molding Machine'].includes(m.type);
      const matchesSearch =
        debouncedSearch === '' ||
        m.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        m.code.toLowerCase().includes(debouncedSearch.toLowerCase());
      return isProdType && matchesSearch;
    });
  }, [machines, debouncedSearch]);

  const { paginatedData: paginatedMachines, paginationProps: machinePaginationProps } = usePagination(prodMachines, {
    initialPageSize: 5,
    pageSizeOptions: [5, 10, 20],
  });

  const unscheduledWOs = useMemo(() => {
    return workOrders.filter((w) => !w.machine || !w.day);
  }, [workOrders]);

  // Time slot hours for shift schedule (06:00 to 22:00)
  const timeSlots = [
    '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'
  ];

  const handleDragDropSchedule = useCallback((woId: string, machineId: string, day: string) => {
    const wo = workOrders.find((w) => w.id === woId);
    if (!wo) return;
    onUpdateWO({
      ...wo,
      machine: machineId,
      day: day,
      status: wo.status === 'planned' ? 'released' : wo.status,
      history: [{ event: `Rescheduled to ${machineId} (${day})`, time: 'Just now' }, ...(wo.history || [])]
    });
    showToast(`${wo.id} allocated to ${machineId} on ${day}`);
  }, [workOrders, onUpdateWO, showToast]);

  const handleAutoSequenceJIT = () => {
    showToast('JIT Auto-sequence executed: Reordered 8 jobs by mold clamp and light-to-dark color sequence (saved ~45 min changeover time)');
  };

  // -------------------------------------------------------------
  // INTERACTIVE BOM RECIPE & MACHINE SCHEDULING DRAWER
  // -------------------------------------------------------------
  const handleOpenBomInspector = (wo: WorkOrder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const linkedBom = getLinkedBom(wo.item, wo.bomId);
    const item = items.find((i) => i.code === wo.item);

    const cavities = linkedBom?.cavities || 4;
    const cycleTimeSec = linkedBom?.cycleTimeSec || 15.0;
    const totalShots = Math.ceil(wo.qty / cavities);
    const totalRunHours = ((totalShots * cycleTimeSec) / 3600).toFixed(1);

    const content = (
      <div className="space-y-6 text-xs text-slate-800">
        {/* WO & Scheduled Machine Summary Header */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-amber-400 text-sm">{wo.id}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-400/30 text-[10px]">
              {wo.status.toUpperCase()}
            </span>
          </div>

          <div>
            <div className="text-base font-bold">{itemName(wo.item)}</div>
            <div className="text-[11px] text-slate-400 font-mono">Code: {wo.item} &bull; Target: {wo.qty.toLocaleString()} {wo.uom}</div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div>
              <div className="text-slate-400">Assigned Bay</div>
              <div className="font-bold text-white font-mono">{wo.machine || 'Unallocated'}</div>
            </div>
            <div>
              <div className="text-slate-400">Scheduled Day</div>
              <div className="font-bold text-white">{wo.day || 'Unscheduled'} ({wo.shift || 'Shift A'})</div>
            </div>
            <div>
              <div className="text-slate-400">Estimated Run Time</div>
              <div className="font-bold text-amber-300 font-mono">{totalRunHours} Hours</div>
            </div>
          </div>
        </div>

        {/* Linked BOM Master Details */}
        {linkedBom ? (
          <div className="space-y-4">
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-amber-900 text-sm">
                    Connected BOM: {linkedBom.id} ({linkedBom.version} {linkedBom.revision})
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                  {linkedBom.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 pt-2 border-t border-amber-200/60">
                <div>
                  <div className="text-slate-500 text-[10px]">Mold Tooling</div>
                  <div className="font-mono font-bold text-slate-900">{linkedBom.moldId || 'MOLD-INJ-084'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Active Cavities</div>
                  <div className="font-mono font-bold text-slate-900">{cavities} Cavities</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Cycle Time</div>
                  <div className="font-mono font-bold text-slate-900">{cycleTimeSec}s / shot</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Scrap Factor</div>
                  <div className="font-mono font-bold text-slate-900">{linkedBom.scrapPct || 1.5}%</div>
                </div>
              </div>
            </div>

            {/* Exploded Recipe for this Work Order Run */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  <span>Raw Material Recipe Required for {wo.qty.toLocaleString()} PCS Batch:</span>
                </h4>
                <span className="text-[10px] text-slate-500">Auto-calculated via BOM lines</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Component Material</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Per Unit Qty</th>
                      <th className="p-2.5 text-right font-bold text-slate-900">Total Run Req</th>
                      <th className="p-2.5 text-center">Store Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {linkedBom.lines && linkedBom.lines.length > 0 ? (
                      linkedBom.lines.map((line) => {
                        const totalReq = (wo.qty * line.qty * (1 + (line.scrap || 0) / 100)).toFixed(2);
                        return (
                          <tr key={line.id} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{line.item}</div>
                              <div className="text-[10px] text-slate-500">{line.name}</div>
                            </td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-semibold">
                                {line.category}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-600">
                              {line.qty} {line.uom}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-[#0F8B8D]">
                              {parseFloat(totalReq).toLocaleString()} {line.uom}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[9px]">
                                <Check className="w-3 h-3" /> Available in WH
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          Standard BOM lines will be backflushed automatically upon stage completion.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
            <div className="font-bold text-amber-900 text-sm">No Active BOM Linked to {wo.item}</div>
            <p className="text-amber-800 text-xs">
              Please create or release a valid Engineering BOM for this finished good in the BOM Master screen.
            </p>
            <button
              onClick={() => {
                closeDrawer();
                onNavigate('engineeringBoms');
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Engineering BOM
            </button>
          </div>
        )}
      </div>
    );

    const footer = (
      <div className="flex items-center justify-between w-full">
        <button
          onClick={closeDrawer}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
        >
          Close
        </button>

        <div className="flex items-center gap-2">
          {linkedBom && (
            <button
              onClick={() => {
                closeDrawer();
                onNavigate('engineeringBoms', { id: linkedBom.id });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open BOM in Engineering</span>
            </button>
          )}

          <button
            onClick={() => {
              closeDrawer();
              onNavigate('woDetail', { id: wo.id });
            }}
            className="px-4 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7072] text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            View Full Work Order &rarr;
          </button>
        </div>
      </div>
    );

    openDrawer(`BOM Recipe & Scheduling Inspector — ${wo.id}`, content, footer);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Top Controls & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/20">
              Gantt Production Scheduling
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Connected BOM Recipes &bull; Finite Capacity Bay Allocation
            </span>
          </div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">Production Planning Board</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Modes */}
          <div className="flex bg-[#F6F4EF] p-1 rounded-xl border border-[#E4E0D6] text-xs font-semibold">
            <button
              onClick={() => setViewMode('machine')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'machine' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
              }`}
            >
              By Machine Gantt
            </button>
            <button
              onClick={() => setViewMode('shift')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'shift' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
              }`}
            >
              Shift Board
            </button>
            <button
              onClick={() => setViewMode('order')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'order' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
              }`}
            >
              JIT Order Sequence
            </button>
          </div>

          <button
            onClick={handleAutoSequenceJIT}
            className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Auto-Sequence JIT (SMED)
          </button>

          <button
            onClick={() => onNavigate('createWoGrid')}
            className="px-3 py-2 rounded-xl bg-[#0F8B8D] text-white hover:bg-[#0c7072] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Bulk 100+ WO Wizard
          </button>
        </div>
      </div>

      {/* AI Sequence Optimization Banner */}
      {showOptimizationAlert && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <Flame className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900 text-sm">
                BOM Material &amp; Color Transition Alert on IMM-250T-03
              </div>
              <p className="text-amber-800 mt-0.5">
                WO-1191 (Black Masterbatch ABS) is scheduled directly before WO-1188 (Clear Natural PP). Connected BOM recipe requires an extra <b>25 min barrel purge cycle</b>. Click <b>Auto-Sequence JIT</b> to reorder to Light &rarr; Dark.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAutoSequenceJIT}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
            >
              Optimize Sequence
            </button>
            <button
              onClick={() => setShowOptimizationAlert(false)}
              className="text-amber-700 hover:text-amber-900 font-bold px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Board Layout: Left Unscheduled Queue + Main Gantt Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Unscheduled Queue Side Panel */}
        <div className="xl:col-span-1 bg-white rounded-2xl border border-[#E4E0D6] p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E4E0D6]">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Unscheduled Backlog</h3>
              <div className="text-[11px] text-[#6B7280]">Drag orders onto line schedule</div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
              {unscheduledWOs.length} Orders
            </span>
          </div>

          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {unscheduledWOs.length > 0 ? (
              unscheduledWOs.map((wo) => {
                const linkedBom = getLinkedBom(wo.item, wo.bomId);
                return (
                  <div
                    key={wo.id}
                    className="p-3 rounded-xl bg-[#F6F4EF] hover:bg-[#FAF9F5] border border-[#E4E0D6] text-xs space-y-1.5 cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#0F8B8D]">{wo.id}</span>
                      <div className="flex items-center gap-1">
                        {linkedBom && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono text-[9px] font-bold border border-amber-200">
                            {linkedBom.id}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          wo.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {wo.priority}
                        </span>
                      </div>
                    </div>
                    <div className="font-semibold text-[#14213D] truncate">{itemName(wo.item)}</div>
                    <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                      <span>Qty: {wo.qty.toLocaleString()} {wo.uom}</span>
                      <span>Due: {wo.dueDate}</span>
                    </div>

                    <div className="pt-1 flex gap-1">
                      <button
                        onClick={() => handleOpenBomInspector(wo)}
                        className="py-1 px-2 rounded bg-white hover:bg-slate-100 border border-[#E4E0D6] text-[10px] font-semibold text-[#0F8B8D] flex items-center gap-1 cursor-pointer"
                        title="Inspect BOM recipe"
                      >
                        <Layers className="w-3 h-3" /> BOM Recipe
                      </button>
                      <button
                        onClick={() => handleDragDropSchedule(wo.id, 'IMM-250T-03', 'Wed')}
                        className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold text-center cursor-pointer"
                      >
                        + IMM-250T
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-[#9CA3AF]">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                All released work orders have been scheduled into production bays.
              </div>
            )}
          </div>
        </div>

        {/* Main Gantt Timeline Grid */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E4E0D6]">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-sm text-[#14213D]">Production Bay Gantt Schedule</h3>
              <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> In Progress
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0F8B8D] ml-2" /> Released
                <span className="w-2.5 h-2.5 rounded-xs bg-purple-500 ml-2" /> Changeover / SMED
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 ml-2" /> Quality Hold
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-[#E4E0D6] font-semibold text-[#14213D]"
              />
            </div>
          </div>

          {/* Timeline Grid Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-[#F6F4EF] text-[#6B7280]">
                  <th className="p-2.5 text-left font-bold border-b border-[#E4E0D6] w-48">Machine Bay</th>
                  {timeSlots.map((time) => (
                    <th key={time} className="p-2.5 text-center font-mono font-semibold border-b border-[#E4E0D6]">
                      {time}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedMachines.map((m) => {
                  const assignedOrders = workOrders.filter((w) => w.machine === m.id);
                  return (
                    <tr key={m.id} className="border-b border-[#E4E0D6] hover:bg-[#FAF9F5]">
                      <td className="p-3 align-middle bg-[#FAFAF8] border-r border-[#E4E0D6]">
                        <div className="font-bold text-[#14213D]">{m.id}</div>
                        <div className="text-[10px] text-[#6B7280]">{m.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#E4E0D6] text-[#4B5563]">
                            {m.tonnage || 'Standard'}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-50 text-teal-700">
                            {assignedOrders.length} Jobs
                          </span>
                        </div>
                      </td>

                      <td colSpan={timeSlots.length} className="p-2 relative h-24 align-middle">
                        <div className="flex items-center gap-2 h-full">
                          {assignedOrders.length > 0 ? (
                            assignedOrders.map((wo) => {
                              let barBg = 'bg-[#0F8B8D] text-white';
                              if (wo.status === 'in_progress') barBg = 'bg-emerald-600 text-white';
                              if (wo.status === 'quality_hold') barBg = 'bg-rose-600 text-white';
                              if (wo.status === 'paused') barBg = 'bg-amber-500 text-white';

                              const progress = Math.round((wo.completed / wo.qty) * 100);
                              const linkedBom = getLinkedBom(wo.item, wo.bomId);

                              return (
                                <div
                                  key={wo.id}
                                  onClick={(e) => handleOpenBomInspector(wo, e)}
                                  className={`flex-1 p-2.5 rounded-xl ${barBg} shadow-xs hover:opacity-95 cursor-pointer transition-all flex flex-col justify-between group relative`}
                                  title="Click to inspect connected BOM Recipe & Material Allocation"
                                >
                                  <div className="flex items-center justify-between text-[11px] font-bold">
                                    <span className="flex items-center gap-1.5">
                                      <span>{wo.id}</span>
                                      <span className="opacity-80">&bull; {wo.shift || 'Shift A'}</span>
                                    </span>
                                    <span className="font-mono">{progress}%</span>
                                  </div>

                                  <div className="text-[10px] truncate font-medium opacity-95">
                                    {itemName(wo.item)} ({wo.qty.toLocaleString()} pcs)
                                  </div>

                                  {/* Connected BOM Badge on Card */}
                                  <div className="flex items-center justify-between pt-0.5 text-[9px]">
                                    {linkedBom ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-black/25 font-mono font-bold text-amber-200">
                                        <Layers className="w-2.5 h-2.5" />
                                        <span>{linkedBom.id}</span>
                                        <span className="opacity-75">({linkedBom.cycleTimeSec}s CT)</span>
                                      </span>
                                    ) : (
                                      <span className="opacity-75">No BOM</span>
                                    )}

                                    <span className="underline opacity-90 group-hover:opacity-100 flex items-center gap-0.5">
                                      Inspect Recipe &rarr;
                                    </span>
                                  </div>

                                  <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div className="bg-white h-full rounded-full" style={{ width: `${progress}%` }} />
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="w-full h-full border-2 border-dashed border-[#E4E0D6] rounded-xl flex items-center justify-center text-[11px] text-[#9CA3AF] bg-[#FAF9F5]">
                              Available Capacity Slot &middot; Click to schedule
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <PaginationBar
              {...machinePaginationProps}
              itemName="machines"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
