import React, { useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  ArrowRight,
  Plus,
  Filter,
  Search,
  User,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { PutawayTask } from '../../types/warehouse';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';

interface Props {
  tasks: PutawayTask[];
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  onUpdateTask?: (task: PutawayTask) => void;
}

export const PutawayManagementView: React.FC<Props> = ({
  tasks,
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
  onUpdateTask,
}) => {
  const [activeTasks, setActiveTasks] = useState<PutawayTask[]>(tasks);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredTasks = activeTasks.filter((t) =>
    filterStatus === 'ALL' ? true : t.status === filterStatus
  );

  const handleCompleteTask = (task: PutawayTask) => {
    const updated: PutawayTask = {
      ...task,
      status: 'completed',
      completedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actualBinPutaway: task.recommendedBin,
    };
    setActiveTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    if (onUpdateTask) onUpdateTask(updated);
    showToast(`Putaway Task ${task.taskNumber} completed & stock racked at ${task.recommendedBin}`);
  };

  const handleAssignOperator = (task: PutawayTask) => {
    let operator = task.assignedOperator || 'Manoj Kumar (Forklift 02)';
    let bin = task.recommendedBin;

    openDrawer(
      `Dispatch Putaway Task &mdash; ${task.taskNumber}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="font-bold text-slate-800 text-sm">{task.itemName}</div>
          <div className="text-slate-500 font-mono">
            Lot: {task.lotNumber} &bull; Qty: {task.quantity.toLocaleString()} {task.uom}
          </div>
          <div className="text-slate-500">Source Dock: <span className="font-bold">{task.sourceDock}</span></div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Assign Forklift Operator</label>
          <select
            defaultValue={operator}
            onChange={(e) => (operator = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          >
            <option value="Manoj Kumar (Forklift 02)">Manoj Kumar (Forklift 02)</option>
            <option value="Suresh V (Forklift 01)">Suresh V (Forklift 01)</option>
            <option value="Rajesh Pallet Mover">Rajesh Pallet Mover</option>
            <option value="Santosh Reach Truck">Santosh Reach Truck</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Target Storage Bin Location</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              defaultValue={bin}
              onChange={(e) => (bin = e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
            <span className="flex items-center gap-1 text-[11px] text-teal-600 bg-teal-50 px-2.5 py-2 rounded-lg font-medium border border-teal-200">
              <Sparkles className="w-3.5 h-3.5" /> AI Recommended
            </span>
          </div>
        </div>
      </div>,
      <div className="flex items-center justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const updated: PutawayTask = {
              ...task,
              assignedOperator: operator,
              recommendedBin: bin,
              status: 'in_progress',
            };
            setActiveTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
            if (onUpdateTask) onUpdateTask(updated);
            closeDrawer();
            showToast(`Assigned ${task.taskNumber} to ${operator}`);
          }}
          className="px-4 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold"
        >
          Dispatch to Operator RF Gun
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/30 uppercase tracking-wider">
              Inward Operations &middot; Smart Routing
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Putaway Task Management
          </h1>
          <p className="text-xs text-slate-500">
            Automated bin suggestions, forklift routing, and storage rack confirmation for inward polymer receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('binMap')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <MapPin className="w-3.5 h-3.5 text-[#0F8B8D]" /> Bin Map
          </button>
          <button
            onClick={() => onNavigate('scanner')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Archive className="w-3.5 h-3.5" /> RF Scanner Mode
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['ALL', 'pending', 'in_progress', 'completed'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
              filterStatus === st
                ? 'bg-[#14213D] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#14213D]">{task.taskNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.priority === 'Urgent'
                        ? 'bg-rose-100 text-rose-700'
                        : task.priority === 'High'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <WarehouseStatusBadge status={task.status} size="xs" />
              </div>

              {/* Item Info */}
              <div>
                <h3 className="font-bold text-xs text-[#14213D] leading-snug">{task.itemName}</h3>
                <div className="text-[11px] font-mono text-[#0F8B8D] mt-0.5">SKU: {task.itemSku}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Lot: {task.lotNumber} &bull; Qty: {task.quantity.toLocaleString()} {task.uom}
                </div>
              </div>

              {/* Source & Destination */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Source Dock:</span>
                  <span className="font-semibold text-slate-800">{task.sourceDock}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Recommended Bin:</span>
                  <span className="font-mono font-bold text-[#0F8B8D] px-1.5 py-0.5 bg-teal-50 rounded border border-teal-200">
                    {task.recommendedBin}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Assigned Operator:</span>
                  <span className="font-medium text-slate-700">{task.assignedOperator || 'Unassigned'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              {task.status !== 'completed' ? (
                <>
                  <button
                    onClick={() => handleAssignOperator(task)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
                  >
                    Assign / Edit
                  </button>
                  <button
                    onClick={() => handleCompleteTask(task)}
                    className="flex-1 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Putaway
                  </button>
                </>
              ) : (
                <div className="w-full text-center py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                  Completed on {task.completedDate || '2026-08-28'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
