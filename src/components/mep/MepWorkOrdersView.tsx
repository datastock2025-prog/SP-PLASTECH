import React, { useState } from 'react';
import {
  Wrench,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  UserCheck,
  FileText,
  Lock,
  ChevronRight,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { MepWorkOrder, MepEquipment } from '../../types';

interface MepWorkOrdersViewProps {
  workOrders: MepWorkOrder[];
  equipment: MepEquipment[];
  selectedWoId?: string;
  onUpdateWorkOrder: (wo: MepWorkOrder) => void;
  onCreateWorkOrderModal: () => void;
  showToast: (msg: string) => void;
}

export const MepWorkOrdersView: React.FC<MepWorkOrdersViewProps> = ({
  workOrders,
  equipment,
  selectedWoId,
  onUpdateWorkOrder,
  onCreateWorkOrderModal,
  showToast,
}) => {
  const [selectedWo, setSelectedWo] = useState<MepWorkOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  React.useEffect(() => {
    if (selectedWoId) {
      const found = workOrders.find((w) => w.id === selectedWoId);
      if (found) {
        setSelectedWo(found);
      }
    }
  }, [selectedWoId, workOrders]);

  const filtered = workOrders.filter((wo) => {
    if (statusFilter !== 'all' && wo.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        wo.id.toLowerCase().includes(q) ||
        wo.title.toLowerCase().includes(q) ||
        wo.equipmentName.toLowerCase().includes(q) ||
        wo.assignedTo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleTask = (wo: MepWorkOrder, taskId: number) => {
    const updatedTasks = wo.tasks.map((t) =>
      t.id === taskId ? { ...t, done: !t.done, checkedBy: !t.done ? 'Current User' : undefined } : t
    );
    const allDone = updatedTasks.every((t) => t.done);
    const updatedWo: MepWorkOrder = {
      ...wo,
      tasks: updatedTasks,
      status: allDone ? 'Completed' : 'In Progress',
    };
    onUpdateWorkOrder(updatedWo);
    setSelectedWo(updatedWo);
    showToast(`Task step #${taskId} updated.`);
  };

  const handleSignOff = (wo: MepWorkOrder) => {
    const updated: MepWorkOrder = {
      ...wo,
      status: 'Signed Off',
      closedBy: 'Priya Rao (Plant Eng Manager)',
      completionNotes: wo.completionNotes || 'All preventive checks executed according to OEM specifications. Equipment cleared for production run.',
    };
    onUpdateWorkOrder(updated);
    setSelectedWo(updated);
    showToast(`Work Order ${wo.id} successfully closed and digitally signed off.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Plant Utility Maintenance
            </span>
            <span className="text-xs text-slate-500 font-mono">ISO 55001 / IATF 16949 Compliant</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            MEP Maintenance &amp; PM Work Orders
          </h1>
          <p className="text-sm text-slate-600">
            Preventative maintenance cycles, emergency breakdowns, LOTO safety permits &amp; parts consumption.
          </p>
        </div>

        <button
          onClick={onCreateWorkOrderModal}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white transition flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create MEP Work Order
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Total Work Orders</span>
          <span className="text-2xl font-black text-slate-900 font-mono block mt-1">{workOrders.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">In Progress</span>
          <span className="text-2xl font-black text-amber-600 font-mono block mt-1">
            {workOrders.filter((w) => w.status === 'In Progress').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Assigned / Scheduled</span>
          <span className="text-2xl font-black text-blue-600 font-mono block mt-1">
            {workOrders.filter((w) => w.status === 'Assigned').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Completed / Signed Off</span>
          <span className="text-2xl font-black text-emerald-600 font-mono block mt-1">
            {workOrders.filter((w) => w.status === 'Completed' || w.status === 'Signed Off').length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'Assigned', 'In Progress', 'Completed', 'Signed Off'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Orders' : st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search work orders or equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] focus:bg-white"
          />
        </div>
      </div>

      {/* Work Orders List & Active Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Orders Table / Cards */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((wo) => {
            const isSelected = selectedWo?.id === wo.id;
            const completedTasks = wo.tasks.filter((t) => t.done).length;
            const totalTasks = wo.tasks.length;
            const progressPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return (
              <div
                key={wo.id}
                onClick={() => setSelectedWo(wo)}
                className={`p-4 rounded-xl border transition cursor-pointer bg-white hover:border-slate-300 ${
                  isSelected ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/20 shadow-sm' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">{wo.id}</span>
                      <span className="text-slate-300">&middot;</span>
                      <span className="text-xs font-semibold text-slate-600">{wo.category}</span>
                      {wo.permitRequired && (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {wo.permitType || 'Safety Permit'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{wo.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target Equipment: <strong>{wo.equipmentName}</strong> ({wo.equipmentId})
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        wo.status === 'Completed' || wo.status === 'Signed Off'
                          ? 'bg-emerald-100 text-emerald-800'
                          : wo.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {wo.status}
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-1 font-mono">Due: {wo.dueDate}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Task Checklist ({completedTasks}/{totalTasks} Done)</span>
                    <span className="font-mono font-bold">{progressPct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F8B8D] rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Assigned: <strong className="text-slate-700">{wo.assignedTo}</strong></span>
                  <span className="text-[#0F8B8D] font-bold flex items-center gap-0.5">
                    View Tasks &amp; Sign-off <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Col: Selected Work Order Inspection / Execution Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-fit sticky top-4">
          {selectedWo ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">{selectedWo.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      selectedWo.status === 'Completed' || selectedWo.status === 'Signed Off'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedWo.status}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 mt-1">{selectedWo.title}</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Equipment: <strong>{selectedWo.equipmentName}</strong>
                </p>
              </div>

              {/* Safety Permit Badge if applicable */}
              {selectedWo.permitRequired && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Safety Isolation Required:</strong> {selectedWo.permitType}. Verified before servicing.
                  </span>
                </div>
              )}

              {/* Checklist Execution */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Standard PM Procedure Checklist
                </h4>
                <div className="space-y-2">
                  {selectedWo.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(selectedWo, task.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                        task.done
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                          task.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {task.done && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex-1">
                        <p className={task.done ? 'line-through text-slate-500' : ''}>{task.desc}</p>
                        {task.checkedBy && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Verified by: {task.checkedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spare Parts Required */}
              {selectedWo.partsRequired.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Spare Parts Consumed
                  </h4>
                  <div className="space-y-1.5">
                    {selectedWo.partsRequired.map((part) => (
                      <div
                        key={part.partCode}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 block">{part.partName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{part.partCode}</span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono">
                          {part.qty} {part.uom}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sign-off Action */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {selectedWo.status !== 'Signed Off' ? (
                  <button
                    onClick={() => handleSignOff(selectedWo)}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Manager Sign-off &amp; Complete WO
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                    <span className="font-bold block flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Sign-off Verified
                    </span>
                    <span className="text-slate-600 mt-1 block">
                      Closed by: <strong>{selectedWo.closedBy}</strong>
                    </span>
                    {selectedWo.completionNotes && (
                      <p className="text-slate-700 mt-1 text-[11.5px] italic">
                        "{selectedWo.completionNotes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Select a work order from the list to view tasks &amp; sign-off</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
