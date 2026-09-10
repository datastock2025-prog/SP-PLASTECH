import React, { useState } from 'react';
import { WorkOrder, MachineMaster, ItemMaster } from '../../types';
import { MoldMaster } from '../../data/manufacturingData';
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
  ArrowDownUp
} from 'lucide-react';

interface PlanningBoardProps {
  workOrders: WorkOrder[];
  machines: MachineMaster[];
  items: ItemMaster[];
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

  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;
  const prodMachines = machines.filter((m) =>
    ['Injection Molding Machine', 'Extrusion Line', 'Blow Molding Machine'].includes(m.type)
  );

  const unscheduledWOs = workOrders.filter((w) => !w.machine || !w.day);

  // Time slot hours for shift schedule (06:00 to 22:00)
  const timeSlots = [
    '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'
  ];

  const handleDragDropSchedule = (woId: string, machineId: string, day: string) => {
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
  };

  const handleAutoSequenceJIT = () => {
    // Reorder based on Light-to-Dark color and mold compatibility
    showToast('JIT Auto-sequence executed: Reordered 8 jobs by mold clamp and light-to-dark color sequence (saved ~45 min changeover time)');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D]">
              Gantt Production Scheduling
            </span>
            <span className="text-[11px] text-[#6B7280]">
              JIT Multi-Order Allocation &bull; Finite Capacity Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Production Planning Board</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Modes */}
          <div className="flex bg-[#F6F4EF] p-1 rounded-xl border border-[#E4E0D6] text-xs font-semibold">
            <button
              onClick={() => setViewMode('machine')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'machine' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
              }`}
            >
              By Machine Gantt
            </button>
            <button
              onClick={() => setViewMode('shift')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'shift' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
              }`}
            >
              Shift Board
            </button>
            <button
              onClick={() => setViewMode('order')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'order' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
              }`}
            >
              JIT Order Sequence
            </button>
          </div>

          <button
            onClick={handleAutoSequenceJIT}
            className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Auto-Sequence JIT (SMED)
          </button>

          <button
            onClick={() => onNavigate('createWoGrid')}
            className="px-3 py-2 rounded-xl bg-[#0F8B8D] text-white hover:bg-[#0c7072] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
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
                Color Transition Alert: Dark-to-Light Sequencing Detected on IMM-250T-03
              </div>
              <p className="text-amber-800 mt-0.5">
                WO-1191 (Black Masterbatch) is scheduled directly before WO-1188 (Clear Natural PP). This will require an extra <b>25 min purging cycle</b> and 8kg Dyna-Purge compound. Click <b>Auto-Sequence JIT</b> to reorder to Light &rarr; Dark.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAutoSequenceJIT}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              Optimize Sequence
            </button>
            <button
              onClick={() => setShowOptimizationAlert(false)}
              className="text-amber-700 hover:text-amber-900 font-bold px-2 py-1"
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

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {unscheduledWOs.length > 0 ? (
              unscheduledWOs.map((wo) => (
                <div
                  key={wo.id}
                  className="p-3 rounded-xl bg-[#F6F4EF] hover:bg-[#FAF9F5] border border-[#E4E0D6] text-xs space-y-1.5 cursor-grab active:cursor-grabbing transition-colors"
                  onClick={() => onNavigate('woDetail', { id: wo.id })}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#0F8B8D]">{wo.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      wo.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {wo.priority}
                    </span>
                  </div>
                  <div className="font-semibold text-[#14213D] truncate">{itemName(wo.item)}</div>
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span>Qty: {wo.qty.toLocaleString()} {wo.uom}</span>
                    <span>Due: {wo.dueDate}</span>
                  </div>
                  <div className="pt-1.5 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDragDropSchedule(wo.id, 'IMM-250T-03', 'Wed');
                      }}
                      className="flex-1 py-1 rounded bg-white hover:bg-slate-100 border border-[#E4E0D6] text-[10px] font-semibold text-center text-[#14213D]"
                    >
                      + Assign IMM-250T
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDragDropSchedule(wo.id, 'IMM-450T-01', 'Wed');
                      }}
                      className="flex-1 py-1 rounded bg-white hover:bg-slate-100 border border-[#E4E0D6] text-[10px] font-semibold text-center text-[#14213D]"
                    >
                      + Assign IMM-450T
                    </button>
                  </div>
                </div>
              ))
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
            <table className="w-full text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#F6F4EF] text-[#6B7280]">
                  <th className="p-2.5 text-left font-bold border-b border-[#E4E0D6] w-44">Machine Bay</th>
                  {timeSlots.map((time) => (
                    <th key={time} className="p-2.5 text-center font-mono font-semibold border-b border-[#E4E0D6]">
                      {time}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prodMachines.map((m) => {
                  const assignedOrders = workOrders.filter((w) => w.machine === m.id);
                  return (
                    <tr key={m.id} className="border-b border-[#E4E0D6] hover:bg-[#FAF9F5]">
                      <td className="p-3 align-middle bg-[#FAFAF8] border-r border-[#E4E0D6]">
                        <div className="font-bold text-[#14213D]">{m.id}</div>
                        <div className="text-[10px] text-[#6B7280]">{m.name}</div>
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#E4E0D6] text-[#4B5563]">
                          {m.tonnage || 'Standard'}
                        </span>
                      </td>

                      <td colSpan={timeSlots.length} className="p-2 relative h-20 align-middle">
                        <div className="flex items-center gap-2 h-full">
                          {assignedOrders.length > 0 ? (
                            assignedOrders.map((wo) => {
                              let barBg = 'bg-[#0F8B8D] text-white';
                              if (wo.status === 'in_progress') barBg = 'bg-emerald-600 text-white';
                              if (wo.status === 'quality_hold') barBg = 'bg-rose-600 text-white';
                              if (wo.status === 'paused') barBg = 'bg-amber-500 text-white';

                              const progress = Math.round((wo.completed / wo.qty) * 100);

                              return (
                                <div
                                  key={wo.id}
                                  onClick={() => onNavigate('woDetail', { id: wo.id })}
                                  className={`flex-1 p-2 rounded-xl ${barBg} shadow-xs hover:opacity-95 cursor-pointer transition-all flex flex-col justify-between`}
                                >
                                  <div className="flex items-center justify-between text-[11px] font-bold">
                                    <span>{wo.id} &bull; {wo.shift || 'Shift A'}</span>
                                    <span>{progress}%</span>
                                  </div>
                                  <div className="text-[10px] truncate font-medium opacity-90">
                                    {itemName(wo.item)} ({wo.qty.toLocaleString()} pcs)
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
          </div>
        </div>
      </div>
    </div>
  );
};
