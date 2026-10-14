import React, { useState, useMemo } from 'react';
import {
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  Search,
  Download,
  RotateCcw,
  CheckSquare,
  Square,
  Building2,
  Send,
  ArrowRight,
  PackageCheck,
  X,
} from 'lucide-react';
import { GrnPutawayTask } from '../../../types/grnTypes';
import { PaginationBar } from '../../common/PaginationBar';
import { useEnterpriseDataGrid } from '../../../hooks/useEnterpriseDataGrid';

interface Props {
  tasks: GrnPutawayTask[];
  onCompleteTask: (taskId: string, actualLocation: string, binCode: string) => void;
  onBulkSendToWarehouse?: (selectedTasks: GrnPutawayTask[], customBins?: Record<string, string>) => void;
  showToast: (msg: string) => void;
}

export const PutawayInventoryPostingTab: React.FC<Props> = ({
  tasks,
  onCompleteTask,
  onBulkSendToWarehouse,
  showToast,
}) => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState<GrnPutawayTask | null>(null);
  const [actualBinInput, setActualBinInput] = useState('');

  // Multi-select state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkBinAssignments, setBulkBinAssignments] = useState<Record<string, string>>({});
  const [bulkForkliftDriver, setBulkForkliftDriver] = useState('Dharmesh Solanki (Forklift Bay #2)');

  // Filter tasks with status dropdown
  const filteredTasksData = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'All' && t.putawayStatus !== statusFilter) return false;
      return true;
    });
  }, [tasks, statusFilter]);

  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizeOptions,
    totalPages,
    totalItems,
    paginatedData: paginatedTasks,
    exportChunkedCSV,
    resetFilters,
  } = useEnterpriseDataGrid<GrnPutawayTask>({
    data: filteredTasksData,
    searchFields: [
      (t) => t.id,
      (t) => t.grnNumber,
      (t) => t.itemCode,
      (t) => t.itemName,
      (t) => t.lotNumber,
      (t) => t.palletContainerId || '',
      (t) => t.currentLocation,
      (t) => t.recommendedLocation,
      (t) => t.recommendedZone,
    ],
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250, 500],
  });

  // Eligible tasks for selection (Pending / In Progress)
  const selectableTasksOnPage = useMemo(() => {
    return paginatedTasks.filter((t) => t.putawayStatus !== 'Completed');
  }, [paginatedTasks]);

  const isAllSelected = useMemo(() => {
    if (selectableTasksOnPage.length === 0) return false;
    return selectableTasksOnPage.every((t) => selectedTaskIds.includes(t.id));
  }, [selectableTasksOnPage, selectedTaskIds]);

  const isSomeSelected = useMemo(() => {
    return (
      selectableTasksOnPage.some((t) => selectedTaskIds.includes(t.id)) && !isAllSelected
    );
  }, [selectableTasksOnPage, selectedTaskIds, isAllSelected]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all on current page
      const pageIds = new Set(selectableTasksOnPage.map((t) => t.id));
      setSelectedTaskIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      // Select all on current page
      const newIds = new Set([...selectedTaskIds, ...selectableTasksOnPage.map((t) => t.id)]);
      setSelectedTaskIds(Array.from(newIds));
    }
  };

  const handleToggleRowSelect = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleOpenSingleComplete = (task: GrnPutawayTask) => {
    setSelectedTask(task);
    setActualBinInput(task.recommendedLocation);
  };

  const handleConfirmSinglePutaway = () => {
    if (!selectedTask) return;
    onCompleteTask(selectedTask.id, actualBinInput, actualBinInput.split('-').pop() || 'BIN-01');
    showToast(`Putaway completed for ${selectedTask.itemCode} to ${actualBinInput}`);
    setSelectedTask(null);
  };

  // Open Bulk Send to Warehouse Modal
  const handleOpenBulkModal = () => {
    if (selectedTaskIds.length === 0) {
      showToast('Please select at least one putaway task.');
      return;
    }

    const selectedTasks = tasks.filter((t) => selectedTaskIds.includes(t.id));
    const initialBins: Record<string, string> = {};
    selectedTasks.forEach((t) => {
      initialBins[t.id] = t.recommendedLocation;
    });
    setBulkBinAssignments(initialBins);
    setIsBulkModalOpen(true);
  };

  const handleConfirmBulkSend = () => {
    const selectedTasks = tasks.filter((t) => selectedTaskIds.includes(t.id));
    if (selectedTasks.length === 0) return;

    if (onBulkSendToWarehouse) {
      onBulkSendToWarehouse(selectedTasks, bulkBinAssignments);
    } else {
      // Fallback: complete each task individually
      selectedTasks.forEach((t) => {
        const bin = bulkBinAssignments[t.id] || t.recommendedLocation;
        onCompleteTask(t.id, bin, bin.split('-').pop() || 'BIN-01');
      });
    }

    const totalKg = selectedTasks.reduce((sum, t) => sum + t.quantity, 0);
    showToast(
      `✓ Successfully sent ${selectedTasks.length} items (${totalKg.toLocaleString()} KG) to Warehouse Bins and posted to Stock Overview & Lot Ledger!`
    );

    setSelectedTaskIds([]);
    setIsBulkModalOpen(false);
  };

  const handleResetAll = () => {
    setStatusFilter('All');
    setSelectedTaskIds([]);
    resetFilters();
  };

  const handleExport = () => {
    exportChunkedCSV(
      'Warehouse_Putaway_Movement_Tasks',
      () => [
        'Task ID',
        'GRN Number',
        'Item Code',
        'Item Name',
        'Lot Number',
        'Pallet ID',
        'Quantity',
        'UOM',
        'Current Staging Location',
        'Recommended Zone',
        'Recommended Location',
        'FEFO Priority',
        'Putaway Status',
      ],
      (t) => [
        t.id,
        t.grnNumber,
        t.itemCode,
        t.itemName,
        t.lotNumber,
        t.palletContainerId || '',
        t.quantity,
        t.uom,
        t.currentLocation,
        t.recommendedZone,
        t.recommendedLocation,
        t.fefoPriority,
        t.putawayStatus,
      ]
    );
    showToast(`Exported ${totalItems.toLocaleString()} Putaway tasks to CSV`);
  };

  const selectedTasksList = useMemo(() => {
    return tasks.filter((t) => selectedTaskIds.includes(t.id));
  }, [tasks, selectedTaskIds]);

  const totalSelectedKg = useMemo(() => {
    return selectedTasksList.reduce((sum, t) => sum + t.quantity, 0);
  }, [selectedTasksList]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D] flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            Putaway & Final Warehouse Bin Allocation
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
              {totalItems.toLocaleString()} tasks
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Transfer approved materials from Dock / Quarantine Staging into final warehouse racks, silos, and floor bins using FEFO batch rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            {tasks.filter((t) => t.putawayStatus !== 'Completed').length} Pending Movements
          </span>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export ({totalItems.toLocaleString()})
          </button>
        </div>
      </div>

      {/* Multi-Select Floating / Sticky Bulk Action Banner */}
      {selectedTaskIds.length > 0 && (
        <div className="bg-gradient-to-r from-purple-900 to-[#14213D] text-white p-3.5 rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-2">
                <span>{selectedTaskIds.length} Task(s) Selected</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-200 text-[10px] font-mono">
                  {totalSelectedKg.toLocaleString()} KG Total Volume
                </span>
              </div>
              <p className="text-[11px] text-purple-200/80">
                Ready to confirm bin placement and post directly to Warehouse Stock Overview & Lot Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedTaskIds([])}
              className="px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-xs font-medium transition cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              onClick={handleOpenBulkModal}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" /> Send to Warehouse ({selectedTaskIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search across tasks (GRN #, item, lot, pallet, location, bin)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="All">All Putaway Statuses</option>
              <option value="Pending">Pending Assignment</option>
              <option value="In Progress">In Progress (Forklift Active)</option>
              <option value="Completed">Putaway Completed</option>
            </select>

            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition px-2 py-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Table - Slider-Free with Multi-Select Checkboxes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="w-full">
          <table className="w-full text-xs text-left table-fixed">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[11%]" />
              <col className="w-[17%]" />
              <col className="w-[12%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[14%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-2 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    disabled={selectableTasksOnPage.length === 0}
                    className="rounded text-purple-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    title="Select All Pending on Page"
                  />
                </th>
                <th className="py-2.5 px-2 font-semibold">Task ID & GRN</th>
                <th className="py-2.5 px-2 font-semibold">Material / Resin</th>
                <th className="py-2.5 px-2 font-semibold">Batch / Lot #</th>
                <th className="py-2.5 px-2 font-semibold text-right">Quantity</th>
                <th className="py-2.5 px-2 font-semibold">Staging Dock</th>
                <th className="py-2.5 px-2 font-semibold">Zone & Bin</th>
                <th className="py-2.5 px-1.5 font-semibold text-center">FEFO</th>
                <th className="py-2.5 px-1.5 font-semibold text-center">Status</th>
                <th className="py-2.5 px-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <p className="font-semibold text-slate-600">No putaway tasks found.</p>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((t) => {
                  const isChecked = selectedTaskIds.includes(t.id);
                  const isCompleted = t.putawayStatus === 'Completed';

                  return (
                    <tr
                      key={t.id}
                      className={`transition ${
                        isChecked
                          ? 'bg-purple-50/70 hover:bg-purple-50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="py-2.5 px-2 text-center align-top">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isCompleted}
                          onChange={() => handleToggleRowSelect(t.id)}
                          className={`rounded text-purple-600 focus:ring-0 w-3.5 h-3.5 ${
                            isCompleted ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        />
                      </td>

                      {/* Task ID & GRN */}
                      <td className="py-2.5 px-2 align-top">
                        <div className="font-mono font-bold text-slate-900 text-xs">{t.id}</div>
                        <div className="text-[10px] font-mono text-blue-700">{t.grnNumber}</div>
                      </td>

                      {/* Material / Resin */}
                      <td className="py-2.5 px-2 align-top">
                        <div className="font-bold text-slate-900 truncate text-xs" title={t.itemName}>
                          {t.itemName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">{t.itemCode}</div>
                      </td>

                      {/* Batch / Lot # */}
                      <td className="py-2.5 px-2 align-top">
                        <span className="font-mono font-bold text-purple-700 text-xs truncate block">
                          {t.lotNumber}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          Pallet: {t.palletContainerId}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-2.5 px-2 text-right font-bold text-slate-900 text-xs align-top whitespace-nowrap">
                        {t.quantity.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{t.uom}</span>
                      </td>

                      {/* Current Staging Dock */}
                      <td className="py-2.5 px-2 text-slate-600 align-top">
                        <div className="flex items-center gap-1 text-xs truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate" title={t.currentLocation}>
                            {t.currentLocation}
                          </span>
                        </div>
                      </td>

                      {/* Recommended Zone & Bin */}
                      <td className="py-2.5 px-2 align-top">
                        <div className="font-semibold text-purple-900 flex items-center gap-1 text-xs truncate">
                          <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                          <span className="truncate" title={t.recommendedLocation}>
                            {t.recommendedLocation}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{t.recommendedZone}</div>
                      </td>

                      {/* FEFO Priority */}
                      <td className="py-2.5 px-1.5 text-center align-top">
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                            t.fefoPriority === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.fefoPriority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-1.5 text-center align-top">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold whitespace-nowrap">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Done
                          </span>
                        ) : t.putawayStatus === 'In Progress' ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold whitespace-nowrap">
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium whitespace-nowrap">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-right align-top">
                        {!isCompleted ? (
                          <button
                            onClick={() => handleOpenSingleComplete(t)}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-semibold shadow-2xs transition flex items-center gap-1 ml-auto cursor-pointer whitespace-nowrap"
                          >
                            Putaway
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Bin: {t.binCode || t.actualLocation || 'Allocated'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemName="putaway movement tasks"
        />
      </div>

      {/* SINGLE Putaway Confirmation Modal */}
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
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500 font-medium">Material Item</div>
                <div className="font-bold text-slate-900 text-sm">{selectedTask.itemName}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Lot: {selectedTask.lotNumber} | Qty: {selectedTask.quantity} {selectedTask.uom}
                </div>
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
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSinglePutaway}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" /> Send to Warehouse Stock & Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK Putaway Confirmation & "Send to Warehouse" Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#14213D] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-['Space_Grotesk']">
                    Bulk Putaway: Send to Warehouse
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedTasksList.length} items ({totalSelectedKg.toLocaleString()} KG) will be added to Warehouse Stock Overview & Lot Ledger
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-purple-50/70 rounded-xl border border-purple-200 text-purple-900">
                <div>
                  <span className="text-[10px] text-purple-600 font-bold uppercase block">Selected Tasks Count</span>
                  <strong className="text-sm">{selectedTasksList.length} Movement Tasks</strong>
                </div>
                <div>
                  <span className="text-[10px] text-purple-600 font-bold uppercase block">Total Quantity to Post</span>
                  <strong className="text-sm font-mono">{totalSelectedKg.toLocaleString()} KG</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Forklift Driver & Bay</label>
                <input
                  type="text"
                  value={bulkForkliftDriver}
                  onChange={(e) => setBulkForkliftDriver(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                />
              </div>

              {/* Items & Bins Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 flex items-center justify-between">
                  <span>Selected Materials & Target Storage Bins</span>
                  <span className="text-[10px] text-slate-500 font-normal">Auto-assigned via FEFO batch location rules</span>
                </div>

                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Item & GRN</th>
                      <th className="py-2 px-3">Lot #</th>
                      <th className="py-2 px-3 text-right">Quantity</th>
                      <th className="py-2 px-3">Current Dock</th>
                      <th className="py-2 px-3">Target Storage Bin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTasksList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{t.itemName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{t.itemCode} | {t.grnNumber}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-700">
                          {t.lotNumber}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {t.quantity.toLocaleString()} {t.uom}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {t.currentLocation}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={bulkBinAssignments[t.id] || t.recommendedLocation}
                            onChange={(e) =>
                              setBulkBinAssignments((prev) => ({
                                ...prev,
                                [t.id]: e.target.value,
                              }))
                            }
                            className="w-full px-2 py-1 border border-slate-300 rounded font-mono font-bold text-purple-900 text-xs bg-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Action will post to <strong>Warehouse Stock Overview</strong> & <strong>Lot Ledger</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBulkSend}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Confirm & Send to Warehouse ({selectedTasksList.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
