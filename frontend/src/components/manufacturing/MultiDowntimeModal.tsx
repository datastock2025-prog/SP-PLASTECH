import React, { useState } from 'react';
import { WorkOrder, DowntimeIntervalItem } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Clock,
  AlertOctagon,
  Sparkles,
  Check,
  Zap,
  Wrench,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface MultiDowntimeModalProps {
  workOrder: WorkOrder;
  isOpen: boolean;
  onClose: () => void;
  onSave: (woId: string, intervals: DowntimeIntervalItem[], totalDowntimeMin: number) => void;
  showToast?: (msg: string) => void;
}

export const STANDARD_DOWNTIME_REASONS = [
  { reason: 'Mold Changeover & Tool Clamping (SMED)', category: 'Setup / Tooling', code: 'DWN-01', defaultMin: 45 },
  { reason: 'Barrel Purging & Color Cleanout', category: 'Process / Material', code: 'DWN-02', defaultMin: 20 },
  { reason: 'Resin Hopper Empty / Material Starvation', category: 'Material', code: 'DWN-03', defaultMin: 15 },
  { reason: 'Take-out Robot Arm Vacuum Alarm', category: 'Automation / Electrical', code: 'DWN-04', defaultMin: 15 },
  { reason: 'Heater Band / Thermocouple Failure', category: 'Electrical', code: 'DWN-05', defaultMin: 30 },
  { reason: 'Mold Chiller / Water Flow Temperature Trip', category: 'Utility / Mechanical', code: 'DWN-06', defaultMin: 25 },
  { reason: 'Hydraulic System Low Pressure / Pump Trip', category: 'Mechanical', code: 'DWN-07', defaultMin: 40 },
  { reason: 'Core Pull Cylinder / Ejector Pin Jam', category: 'Tooling', code: 'DWN-08', defaultMin: 35 },
  { reason: 'Nozzle Freeze-off / Sprue Runner Clog', category: 'Process', code: 'DWN-09', defaultMin: 15 },
  { reason: 'First-Off QC Inspection & CMM Verification', category: 'Quality Hold', code: 'DWN-10', defaultMin: 20 },
  { reason: 'Scheduled Operator Meal / Shift Handover', category: 'Planned Break', code: 'DWN-11', defaultMin: 30 },
  { reason: 'Unscheduled Electrical Power Fluctuation', category: 'Utility', code: 'DWN-12', defaultMin: 20 },
];

export const calculateMinutesBetween = (fromTime: string, toTime: string): number => {
  if (!fromTime || !toTime) return 0;
  const [h1, m1] = fromTime.split(':').map(Number);
  const [h2, m2] = toTime.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;

  const totalMin1 = h1 * 60 + m1;
  const totalMin2 = h2 * 60 + m2;

  if (totalMin2 >= totalMin1) {
    return totalMin2 - totalMin1;
  }
  // Crossed midnight
  return 1440 - totalMin1 + totalMin2;
};

export const MultiDowntimeModal: React.FC<MultiDowntimeModalProps> = ({
  workOrder,
  isOpen,
  onClose,
  onSave,
  showToast,
}) => {
  if (!isOpen) return null;

  // Initialize intervals from workOrder.downtimeIntervals or workOrder.downtimeLogs or downtimeMin
  const [intervals, setIntervals] = useState<DowntimeIntervalItem[]>(() => {
    if (workOrder.downtimeIntervals && workOrder.downtimeIntervals.length > 0) {
      return JSON.parse(JSON.stringify(workOrder.downtimeIntervals));
    }
    if (workOrder.downtimeLogs && workOrder.downtimeLogs.length > 0) {
      return workOrder.downtimeLogs.map((log, idx) => ({
        id: `dwn-${Date.now()}-${idx}`,
        fromTime: '08:00',
        toTime: '08:30',
        min: log.min || 30,
        reason: log.reason || STANDARD_DOWNTIME_REASONS[0].reason,
        category: 'Mechanical',
        by: log.by || workOrder.operator,
        notes: '',
      }));
    }
    if (workOrder.downtimeMin > 0) {
      return [
        {
          id: `dwn-${Date.now()}-1`,
          fromTime: '09:00',
          toTime: '09:30',
          min: workOrder.downtimeMin,
          reason: STANDARD_DOWNTIME_REASONS[0].reason,
          category: 'Setup / Tooling',
          by: workOrder.operator || 'Lead Tech',
          notes: 'Shift recorded downtime',
        },
      ];
    }
    return [
      {
        id: `dwn-${Date.now()}-1`,
        fromTime: '08:15',
        toTime: '08:45',
        min: 30,
        reason: 'Mold Changeover & Tool Clamping (SMED)',
        category: 'Setup / Tooling',
        by: workOrder.operator || 'Lead Tech',
        notes: '',
      },
    ];
  });

  const totalDowntimeMin = intervals.reduce((sum, item) => sum + (Number(item.min) || 0), 0);
  const totalHours = (totalDowntimeMin / 60).toFixed(1);

  const handleAddInterval = (preset?: { reason: string; category: string; defaultMin: number }) => {
    const defaultReason = preset?.reason || STANDARD_DOWNTIME_REASONS[0].reason;
    const defaultCat = preset?.category || STANDARD_DOWNTIME_REASONS[0].category;
    const duration = preset?.defaultMin || 30;

    // Suggest sequential time based on last interval
    let nextFrom = '10:00';
    let nextTo = '10:30';
    if (intervals.length > 0) {
      const last = intervals[intervals.length - 1];
      if (last.toTime) {
        nextFrom = last.toTime;
        const [h, m] = nextFrom.split(':').map(Number);
        const endTotal = h * 60 + m + duration;
        const endH = Math.floor(endTotal / 60) % 24;
        const endM = endTotal % 60;
        nextTo = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }
    }

    const newInterval: DowntimeIntervalItem = {
      id: `dwn-${Date.now()}-${intervals.length + 1}`,
      fromTime: nextFrom,
      toTime: nextTo,
      min: duration,
      reason: defaultReason,
      category: defaultCat,
      by: workOrder.operator || 'Plant Tech',
      notes: '',
    };
    setIntervals((prev) => [...prev, newInterval]);
  };

  const handleUpdateInterval = (id: string | undefined, index: number, field: keyof DowntimeIntervalItem, value: any) => {
    setIntervals((prev) =>
      prev.map((item, i) => {
        if ((item.id && item.id === id) || (!item.id && i === index)) {
          const updated = { ...item, [field]: value };
          // Auto recalculate duration if fromTime or toTime changed
          if (field === 'fromTime' || field === 'toTime') {
            const calculatedMin = calculateMinutesBetween(
              field === 'fromTime' ? value : updated.fromTime,
              field === 'toTime' ? value : updated.toTime
            );
            if (calculatedMin > 0) {
              updated.min = calculatedMin;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveInterval = (index: number) => {
    setIntervals((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    onSave(workOrder.id, intervals, totalDowntimeMin);
    if (showToast) {
      showToast(
        `Updated ${intervals.length} downtime intervals for WO #${workOrder.id} (Total: ${totalDowntimeMin} min / ${totalHours} hrs)`
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FAF9F5] rounded-2xl border border-[#E4E0D6] max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E4E0D6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#14213D]">Multi-Interval Downtime Tracking</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {workOrder.id}
                </span>
                {workOrder.machine && (
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[#F6F4EF] text-[#6B7280]">
                    Bay: {workOrder.machine}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280]">
                Record specific From &amp; To stoppage times and multi-reason root causes during shift
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#14213D] hover:bg-[#F6F4EF] border border-transparent hover:border-[#E4E0D6] transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Downtime Metrics Strip */}
        <div className="p-3 sm:p-4 bg-white border-b border-[#E4E0D6] grid grid-cols-3 gap-3">
          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E0D6]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">Total Lost Time</div>
            <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
              {totalDowntimeMin} <span className="text-xs text-[#6B7280] font-sans">min</span>{' '}
              <span className="text-xs font-normal text-[#6B7280]">({totalHours} hrs)</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E0D6]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">Stoppage Occurrences</div>
            <div className="text-lg font-bold font-mono text-[#0F8B8D] mt-0.5">
              {intervals.length} <span className="text-xs text-[#6B7280] font-sans">intervals</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E0D6]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">Shift Availability Impact</div>
            <div className="text-lg font-bold font-mono text-[#14213D] mt-0.5">
              {totalDowntimeMin > 0 ? `${((totalDowntimeMin / 480) * 100).toFixed(1)}% of 8h shift` : '0.0%'}
            </div>
          </div>
        </div>

        {/* Quick Add Presets Bar */}
        <div className="px-4 py-2.5 bg-[#F6F4EF] border-b border-[#E4E0D6] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-[#6B7280] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Quick Add:
          </span>
          {[
            { label: '+ Mold Setup (45m)', reason: 'Mold Changeover & Tool Clamping (SMED)', category: 'Setup / Tooling', defaultMin: 45 },
            { label: '+ Barrel Purge (20m)', reason: 'Barrel Purging & Color Cleanout', category: 'Process / Material', defaultMin: 20 },
            { label: '+ Material Starvation (15m)', reason: 'Resin Hopper Empty / Material Starvation', category: 'Material', defaultMin: 15 },
            { label: '+ Robot Alarm (15m)', reason: 'Take-out Robot Arm Vacuum Alarm', category: 'Automation / Electrical', defaultMin: 15 },
            { label: '+ QC Inspection (20m)', reason: 'First-Off QC Inspection & CMM Verification', category: 'Quality Hold', defaultMin: 20 },
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddInterval(preset)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 border border-[#E4E0D6] hover:border-amber-300 text-[#14213D] text-[11px] font-semibold whitespace-nowrap transition-all shadow-2xs"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Intervals List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {intervals.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#CBD5E1] space-y-2">
              <Clock className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="text-sm font-bold text-[#14213D]">Zero Downtime Recorded</div>
              <p className="text-xs text-[#6B7280]">
                Continuous operation with no stoppages logged. Click below to add an event if needed.
              </p>
              <button
                type="button"
                onClick={() => handleAddInterval()}
                className="mt-2 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Log First Stoppage
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {intervals.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 bg-white rounded-xl border border-[#E4E0D6] hover:border-amber-200 transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* From Time */}
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-0.5">
                        From Time
                      </label>
                      <input
                        type="time"
                        value={item.fromTime}
                        onChange={(e) => handleUpdateInterval(item.id, idx, 'fromTime', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E4E0D6] bg-white font-mono font-bold text-xs text-[#14213D] focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* To Time */}
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-0.5">
                        To Time
                      </label>
                      <input
                        type="time"
                        value={item.toTime}
                        onChange={(e) => handleUpdateInterval(item.id, idx, 'toTime', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E4E0D6] bg-white font-mono font-bold text-xs text-[#14213D] focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Duration Minutes */}
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-0.5">
                        Duration (Min)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={item.min}
                          onChange={(e) =>
                            handleUpdateInterval(item.id, idx, 'min', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E4E0D6] bg-[#FAF9F5] font-mono font-bold text-xs text-amber-800 text-right pr-7 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#9CA3AF]">
                          m
                        </span>
                      </div>
                    </div>

                    {/* Reason Selector */}
                    <div className="md:col-span-5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-0.5">
                        Downtime Reason #{idx + 1}
                      </label>
                      <select
                        value={item.reason}
                        onChange={(e) => {
                          const matched = STANDARD_DOWNTIME_REASONS.find((r) => r.reason === e.target.value);
                          handleUpdateInterval(item.id, idx, 'reason', e.target.value);
                          if (matched) {
                            handleUpdateInterval(item.id, idx, 'category', matched.category);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E4E0D6] bg-[#FAF9F5] text-xs font-bold text-[#14213D] focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      >
                        {STANDARD_DOWNTIME_REASONS.map((r) => (
                          <option key={r.code} value={r.reason}>
                            [{r.code}] {r.reason} ({r.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Delete Action */}
                    <div className="md:col-span-1 flex justify-end pb-0.5">
                      <button
                        type="button"
                        onClick={() => handleRemoveInterval(idx)}
                        className="p-1.5 text-[#9CA3AF] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Interval"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Secondary Details: Category, Logged By, and Action Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1 border-t border-[#F6F4EF]">
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        placeholder="Category (e.g. Mechanical)"
                        value={item.category || ''}
                        onChange={(e) => handleUpdateInterval(item.id, idx, 'category', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-md border border-[#E4E0D6] bg-white text-[11px] font-medium text-[#4B5563]"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        placeholder="Technician / By (e.g. R. Sharma)"
                        value={item.by || ''}
                        onChange={(e) => handleUpdateInterval(item.id, idx, 'by', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-md border border-[#E4E0D6] bg-white text-[11px] font-medium text-[#4B5563]"
                      />
                    </div>
                    <div className="md:col-span-6">
                      <input
                        type="text"
                        placeholder="Corrective action taken / root cause observation..."
                        value={item.notes || ''}
                        onChange={(e) => handleUpdateInterval(item.id, idx, 'notes', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-md border border-[#E4E0D6] bg-white text-[11px] text-[#4B5563] placeholder:text-[#9CA3AF]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleAddInterval()}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#E4E0D6] hover:border-amber-300 hover:bg-amber-50/50 text-[#14213D] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-amber-600" />
            Add Another Downtime Interval
          </button>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#E4E0D6] flex items-center justify-between">
          <div className="text-xs text-[#6B7280]">
            Syncs with Work Order Downtime: <b className="text-amber-800 font-mono">{totalDowntimeMin} min</b>{' '}
            <span className="text-[#9CA3AF]">({totalHours} hrs)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-xs font-bold text-[#14213D] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Apply Downtime ({totalDowntimeMin} min)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
