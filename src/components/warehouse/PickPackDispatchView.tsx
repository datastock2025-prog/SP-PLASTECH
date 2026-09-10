import React, { useState } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Printer,
  Barcode,
  PackageCheck,
  Truck,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PickPackTask, PickPackLine } from '../../types/warehouse';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';

interface Props {
  tasks: PickPackTask[];
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  onUpdateTask?: (task: PickPackTask) => void;
}

export const PickPackDispatchView: React.FC<Props> = ({
  tasks,
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
  onUpdateTask,
}) => {
  const [pickList, setPickList] = useState<PickPackTask[]>(tasks);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(tasks[0]?.id || null);

  const toggleLinePicked = (taskId: string, lineId: string) => {
    setPickList((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const updatedLines = task.lines.map((l) => {
          if (l.id === lineId) {
            const nextState = !l.isPicked;
            return {
              ...l,
              isPicked: nextState,
              pickedQty: nextState ? l.requiredQty : 0,
            };
          }
          return l;
        });
        const pickedCount = updatedLines.filter((l) => l.isPicked).length;
        const newStatus =
          pickedCount === updatedLines.length
            ? 'staged'
            : pickedCount > 0
            ? 'picking'
            : 'assigned';

        const updatedTask: PickPackTask = {
          ...task,
          lines: updatedLines,
          pickedLines: pickedCount,
          status: newStatus,
        };
        if (onUpdateTask) onUpdateTask(updatedTask);
        return updatedTask;
      })
    );
  };

  const handleStageComplete = (task: PickPackTask) => {
    const updated: PickPackTask = {
      ...task,
      status: 'staged',
      palletBarcode: task.palletBarcode || `PALLET-${task.referenceNumber}-A`,
    };
    setPickList((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    if (onUpdateTask) onUpdateTask(updated);
    showToast(`Pick list ${task.pickListNumber} staged at ${task.destinationLocation}`);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8622C]/10 text-[#E8622C] border border-[#E8622C]/30 uppercase tracking-wider">
              Outward &middot; Material Staging
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Pick &amp; Pack Fulfillment Operations
          </h1>
          <p className="text-xs text-slate-500">
            Batch picking for injection molding work orders and final carton packing for customer dispatches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('labelPrint')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" /> Pallet Tags
          </button>
          <button
            onClick={() => onNavigate('scanner')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Barcode className="w-3.5 h-3.5" /> Barcode Scan Pick
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-4">
        {pickList.map((task) => {
          const isExpanded = expandedTaskId === task.id;
          const isAllPicked = task.pickedLines === task.totalLines;

          return (
            <div
              key={task.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition"
            >
              {/* Task Header Bar */}
              <div
                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      task.orderType === 'Work_Order_Staging'
                        ? 'bg-teal-50 text-[#0F8B8D]'
                        : 'bg-orange-50 text-[#E8622C]'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#14213D]">
                        {task.pickListNumber}
                      </span>
                      <WarehouseStatusBadge status={task.status} size="xs" />
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                        {task.orderType === 'Work_Order_Staging' ? 'Production Staging' : 'Sales Dispatch'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Target: <span className="font-semibold text-slate-800">{task.destinationLocation}</span> &bull; Ref: <span className="font-mono font-bold text-[#0F8B8D]">{task.referenceNumber}</span> &bull; Picker: {task.assignedPicker}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <div className="text-slate-400 text-[11px]">Pick Progress</div>
                    <div className="font-bold text-slate-800 font-mono">
                      {task.pickedLines} / {task.totalLines} Lines Picked
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Line Items Table */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-4 animate-fade-in">
                  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">Done</th>
                          <th className="py-2.5 px-3">Item SKU &amp; Name</th>
                          <th className="py-2.5 px-3">Lot Number</th>
                          <th className="py-2.5 px-3">Source Bin</th>
                          <th className="py-2.5 px-3 text-right">Required Qty</th>
                          <th className="py-2.5 px-3 text-right">Picked Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {task.lines.map((line) => (
                          <tr
                            key={line.id}
                            className={`hover:bg-slate-50 transition cursor-pointer ${
                              line.isPicked ? 'bg-emerald-50/30' : ''
                            }`}
                            onClick={() => toggleLinePicked(task.id, line.id)}
                          >
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={line.isPicked}
                                onChange={() => toggleLinePicked(task.id, line.id)}
                                className="w-4 h-4 text-[#0F8B8D] rounded focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-[#14213D]">{line.itemName}</div>
                              <div className="font-mono text-[10px] text-[#0F8B8D]">{line.itemSku}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{line.lotNumber}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold text-xs text-[#0F8B8D] px-1.5 py-0.5 bg-teal-50 rounded border border-teal-200">
                                {line.sourceBin}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {line.requiredQty.toLocaleString()} {line.uom}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                              {line.pickedQty.toLocaleString()} {line.uom}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-500 font-mono">
                      Pallet Tag: <span className="font-bold text-[#14213D]">{task.palletBarcode || 'Unassigned'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('labelPrint')}
                        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
                      >
                        Print Packing Slip
                      </button>
                      <button
                        disabled={!isAllPicked || task.status === 'staged'}
                        onClick={() => handleStageComplete(task)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                          isAllPicked && task.status !== 'staged'
                            ? 'bg-[#0F8B8D] hover:bg-[#0c7072] text-white shadow-sm'
                            : task.status === 'staged'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {task.status === 'staged' ? 'Material Staged & Verified' : 'Complete Staging'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
