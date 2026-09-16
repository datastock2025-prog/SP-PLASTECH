import React, { useState } from 'react';
import {
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowRight,
  QrCode,
  Truck,
  Forklift,
  Split,
  Printer,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { GrnPutawayTask } from '../../../types/grnTypes';

interface Props {
  tasks: GrnPutawayTask[];
  onCompleteTask: (taskId: string, actualLocation: string, binCode: string) => void;
  showToast: (msg: string) => void;
}

export const PutawayInventoryPostingTab: React.FC<Props> = ({
  tasks,
  onCompleteTask,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState<GrnPutawayTask | null>(null);
  const [actualBinInput, setActualBinInput] = useState('');

  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.recommendedLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'All' || t.putawayStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenComplete = (task: GrnPutawayTask) => {
    setSelectedTask(task);
    setActualBinInput(task.recommendedLocation);
  };

  const handleConfirmPutaway = () => {
    if (!selectedTask) return;
    onCompleteTask(selectedTask.id, actualBinInput, actualBinInput.split('-').pop() || 'BIN-01');
    showToast(`Putaway completed for ${selectedTask.itemCode} to ${actualBinInput}`);
    setSelectedTask(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D] flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            Putaway & Final Warehouse Bin Allocation
          </h2>
          <p className="text-xs text-slate-500">
            Transfer approved materials from Dock / Quarantine Staging into final warehouse racks, silos, and floor bins using FEFO batch rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            {tasks.filter((t) => t.putawayStatus !== 'Completed').length} Pending Movements
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by GRN #, item, lot, location, bin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="All">All Putaway Statuses</option>
            <option value="Pending">Pending Assignment</option>
            <option value="In Progress">In Progress (Forklift Active)</option>
            <option value="Completed">Putaway Completed</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-semibold">Task ID & GRN</th>
                <th className="py-3 px-3 font-semibold">Material / Resin</th>
                <th className="py-3 px-3 font-semibold">Batch / Lot #</th>
                <th className="py-3 px-3 font-semibold text-right">Quantity</th>
                <th className="py-3 px-3 font-semibold">Current Staging Dock</th>
                <th className="py-3 px-3 font-semibold">Recommended Zone & Bin</th>
                <th className="py-3 px-3 font-semibold text-center">FEFO Priority</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <p className="font-semibold text-slate-600">No putaway tasks found.</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-900">{t.id}</div>
                      <div className="text-[10px] font-mono text-blue-700">{t.grnNumber}</div>
                    </td>

                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="font-bold text-slate-900 truncate">{t.itemName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{t.itemCode}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-purple-700">{t.lotNumber}</span>
                      <div className="text-[10px] text-slate-400 font-mono">Pallet: {t.palletContainerId}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {t.quantity.toLocaleString()} {t.uom}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{t.currentLocation}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-purple-900 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" />
                        {t.recommendedLocation}
                      </div>
                      <div className="text-[10px] text-slate-500">{t.recommendedZone}</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.fefoPriority === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.fefoPriority}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {t.putawayStatus === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : t.putawayStatus === 'In Progress' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {t.putawayStatus !== 'Completed' ? (
                        <button
                          onClick={() => handleOpenComplete(t)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1 ml-auto"
                        >
                          Confirm Putaway
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Bin: {t.binCode}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Putaway Confirmation Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#14213D] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm font-['Space_Grotesk'] flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Confirm Warehouse Bin Putaway
              </h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500 font-medium">Material Item</div>
                <div className="font-bold text-slate-900 text-sm">{selectedTask.itemName}</div>
                <div className="text-[11px] text-slate-500 font-mono">Lot: {selectedTask.lotNumber} | Qty: {selectedTask.quantity} {selectedTask.uom}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Storage Bin / Rack Code *</label>
                <input
                  type="text"
                  value={actualBinInput}
                  onChange={(e) => setActualBinInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-[#14213D]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Recommended: {selectedTask.recommendedLocation}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Forklift Driver</label>
                <input
                  type="text"
                  defaultValue="Dharmesh Solanki (Forklift Bay #2)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPutaway}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                Complete Putaway Movement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
