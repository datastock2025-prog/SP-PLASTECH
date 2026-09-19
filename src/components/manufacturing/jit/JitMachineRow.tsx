import React, { useState } from 'react';
import {
  Cpu,
  Clock,
  Layers,
  Sparkles,
  RotateCcw,
  Copy,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  MoreVertical,
  Printer,
  Download,
  Barcode,
  Calendar,
  User,
  Building2,
  CalendarCheck,
} from 'lucide-react';
import { MachineMaster, ItemMaster, BomMaster } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';
import { PlannedMachineJob, JitShift } from './jitTypes';
import { JitItemAutocomplete } from './JitItemAutocomplete';
import { JitOperatorAutocomplete } from './JitOperatorAutocomplete';
import {
  calculatePcsFromHours,
  calculateHoursFromPcs,
  categorizeBomLine,
  calculateExpectedFinish,
  exportSingleJobToExcel,
  exportSingleJobToCsv,
} from './jitCalculations';

interface Props {
  job: PlannedMachineJob;
  index: number;
  machines: MachineMaster[];
  items: ItemMaster[];
  molds: MoldMaster[];
  boms: BomMaster[];
  onChange: (updated: PlannedMachineJob) => void;
  onDuplicate: (job: PlannedMachineJob) => void;
  onDelete: (id: string) => void;
  onViewRecipe: (job: PlannedMachineJob) => void;
  onOpenTraveler?: (job: PlannedMachineJob) => void;
  isOnlyOne: boolean;
}

export const JitMachineRow: React.FC<Props> = ({
  job,
  index,
  machines,
  items,
  molds,
  boms,
  onChange,
  onDuplicate,
  onDelete,
  onViewRecipe,
  onOpenTraveler,
  isOnlyOne,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const selectedMachine = machines.find((m) => m.id === job.machineId);
  const selectedItem = items.find((i) => i.code === job.itemCode);
  const matchingBoms = boms.filter((b) => b.parent === job.itemCode);
  const bom = matchingBoms.find((b) => b.id === job.bomId) || matchingBoms[0] || boms.find((b) => b.parent === job.itemCode);

  // Compatible molds for the selected item or all molds
  const availableMolds = molds.filter((m) =>
    job.itemCode ? m.compatibleProducts.includes(job.itemCode) || m.id === job.moldId : true
  );

  // Expected Finish calculation
  const expectedFinish = calculateExpectedFinish(job.planDate, job.plannedHours, job.shift);

  const handleMachineChange = (newMachineId: string) => {
    onChange({
      ...job,
      machineId: newMachineId,
    });
  };

  const handleBomChange = (newBomId: string) => {
    onChange({
      ...job,
      bomId: newBomId,
    });
  };

  const handleItemSelect = (newItem: ItemMaster, suggestedMold?: MoldMaster) => {
    const cycleTime = newItem.standardCycleTime || suggestedMold?.averageCycleTimeSec || 15.0;
    const moldId = suggestedMold?.id || (availableMolds[0]?.id || 'MLD-1001');
    const moldObj = molds.find((m) => m.id === moldId) || suggestedMold;
    const cavities = moldObj?.cavities || 2;
    const matchedBoms = boms.filter((b) => b.parent === newItem.code);

    let calcPcs = job.calculatedPcs;
    let runHours = job.plannedHours;

    if (job.calculationMode === 'hours_to_pcs') {
      calcPcs = calculatePcsFromHours(runHours, cycleTime, cavities, job.efficiencyPct);
    } else {
      runHours = calculateHoursFromPcs(job.targetPcs, cycleTime, cavities, job.efficiencyPct);
    }

    onChange({
      ...job,
      itemCode: newItem.code,
      itemName: newItem.name,
      moldId: moldObj ? moldObj.id : moldId,
      moldName: moldObj ? moldObj.name : 'Standard Mold',
      bomId: matchedBoms[0]?.id || 'BOM-1001',
      cavities,
      cycleTimeSec: cycleTime,
      isCustomCavity: false,
      isCustomCycleTime: false,
      plannedHours: runHours,
      calculatedPcs: calcPcs,
      targetPcs: calcPcs,
      expectedFinishDate: expectedFinish.expectedFinishDate,
      status: 'Draft',
    });
  };

  const handleMoldChange = (newMoldId: string) => {
    const mold = molds.find((m) => m.id === newMoldId);
    if (!mold) return;

    const cavities = mold.cavities || job.cavities || 1;
    const cycleTime = mold.averageCycleTimeSec || job.cycleTimeSec || 15.0;
    const calcPcs = calculatePcsFromHours(job.plannedHours, cycleTime, cavities, job.efficiencyPct);

    onChange({
      ...job,
      moldId: mold.id,
      moldName: mold.name,
      cavities,
      cycleTimeSec: cycleTime,
      isCustomCavity: false,
      isCustomCycleTime: false,
      calculatedPcs: calcPcs,
      targetPcs: calcPcs,
    });
  };

  const handleShiftChange = (shift: JitShift) => {
    let hours = job.plannedHours;
    if (shift === 'Shift A (06:00 - 14:00)' || shift === 'Shift B (14:00 - 22:00)' || shift === 'Shift C (22:00 - 06:00)') {
      hours = 8.0;
    } else if (shift === 'Full Day 24H') {
      hours = 24.0;
    }

    const calcPcs = calculatePcsFromHours(hours, job.cycleTimeSec, job.cavities, job.efficiencyPct);
    const finish = calculateExpectedFinish(job.planDate, hours, shift);

    onChange({
      ...job,
      shift,
      plannedHours: hours,
      calculatedPcs: calcPcs,
      targetPcs: calcPcs,
      expectedFinishDate: finish.expectedFinishDate,
      expectedFinishTime: finish.expectedFinishTime,
    });
  };

  const handleHoursChange = (hours: number) => {
    const safeHours = Math.max(0, Math.min(24, hours));
    const calcPcs = calculatePcsFromHours(safeHours, job.cycleTimeSec, job.cavities, job.efficiencyPct);
    const finish = calculateExpectedFinish(job.planDate, safeHours, job.shift);

    onChange({
      ...job,
      plannedHours: safeHours,
      calculatedPcs: calcPcs,
      targetPcs: calcPcs,
      calculationMode: 'hours_to_pcs',
      expectedFinishDate: finish.expectedFinishDate,
      expectedFinishTime: finish.expectedFinishTime,
    });
  };

  const handleTargetPcsChange = (pcs: number) => {
    const safePcs = Math.max(0, pcs);
    const requiredHours = calculateHoursFromPcs(safePcs, job.cycleTimeSec, job.cavities, job.efficiencyPct);

    onChange({
      ...job,
      targetPcs: safePcs,
      calculatedPcs: safePcs,
      plannedHours: requiredHours,
      calculationMode: 'pcs_to_hours',
    });
  };

  const handleCycleTimeChange = (sec: number) => {
    const safeSec = Math.max(1, sec);
    const calcPcs = calculatePcsFromHours(job.plannedHours, safeSec, job.cavities, job.efficiencyPct);

    onChange({
      ...job,
      cycleTimeSec: safeSec,
      isCustomCycleTime: true,
      isCustomOverride: true,
      calculatedPcs: calcPcs,
      targetPcs: calcPcs,
    });
  };

  const handleCavitiesChange = (cavs: number) => {
    const safeCavs = Math.max(1, cavs);
    const calcPcs = calculatePcsFromHours(job.plannedHours, job.cycleTimeSec, safeCavs, job.efficiencyPct);

    onChange({
      ...job,
      cavities: safeCavs,
      isCustomCavity: true,
      isCustomOverride: true,
      calculatedPcs: calcPcs,
      targetPcs: calcPcs,
    });
  };

  // Preview estimated recipe requirements for this machine's target output
  const lines = bom?.lines || [];
  let estRmKg = 0;
  let estMbKg = 0;
  let estInsertNos = 0;
  let estPckNos = 0;

  if (lines.length > 0) {
    for (const line of lines) {
      const matItem = items.find((i) => i.code === line.item);
      const cat = categorizeBomLine(line, matItem, job.plant).cat;
      const totalReq = (line.qty || 0) * (1 + (line.scrap || 0) / 100) * job.calculatedPcs;

      if (cat === 'RM') estRmKg += totalReq;
      else if (cat === 'MB') estMbKg += totalReq;
      else if (cat === 'INSERT') estInsertNos += totalReq;
      else if (cat === 'PCK') estPckNos += totalReq;
    }
  } else {
    // Fallback estimation based on average 500g part
    estRmKg = Number((job.calculatedPcs * 0.49).toFixed(1));
    estMbKg = Number((job.calculatedPcs * 0.012).toFixed(1));
    estPckNos = Math.ceil(job.calculatedPcs / 50);
  }

  // Hourly production speed (pcs/hr)
  const hourlyRate = job.cycleTimeSec > 0 ? Math.round((3600 / job.cycleTimeSec) * job.cavities * (job.efficiencyPct / 100)) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header bar of the machine row */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {index + 1}
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Injection Machine:</span>
            </div>
          </div>

          <select
            value={job.machineId}
            onChange={(e) => handleMachineChange(e.target.value)}
            className="font-bold text-slate-800 bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.name} ({m.tonnage || 'Standard'})
              </option>
            ))}
          </select>

          {selectedMachine && (
            <div className="hidden sm:flex items-center gap-2 text-slate-500">
              <span className="bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px]">
                {selectedMachine.tonnage}
              </span>
              <span className="text-[11px] text-slate-400">|</span>
              <span className="text-[11px]">{selectedMachine.line}</span>
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  selectedMachine.status === 'running'
                    ? 'bg-emerald-500'
                    : selectedMachine.status === 'idle'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                title={`Current Shopfloor Status: ${selectedMachine.status}`}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Feasibility Indicator */}
          {job.status === 'Material_Shortage' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Shortage Alert
            </span>
          ) : job.status === 'Feasible' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              100% Stock Feasible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              Draft Job
            </span>
          )}

          <button
            type="button"
            onClick={() => onViewRecipe(job)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 font-medium rounded-md transition-colors text-[11px] border border-indigo-200 cursor-pointer"
            title="View exact BOM recipe explosion"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recipe &amp; Stores</span>
          </button>

          {/* 3-Dot Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              title="More options (Traveler, Excel, CSV, Duplicate, Delete)"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs"
                onClick={() => setIsMenuOpen(false)}
              >
                {onOpenTraveler && (
                  <button
                    type="button"
                    onClick={() => onOpenTraveler(job)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center gap-2 font-medium"
                  >
                    <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Work Order Traveler</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => exportSingleJobToExcel(job, boms, items)}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2 font-medium"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export to Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportSingleJobToCsv(job, boms, items)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center gap-2 font-medium"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export to CSV (.csv)</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => onDuplicate(job)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center gap-2 font-medium"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Duplicate Job</span>
                </button>

                {!isOnlyOne && (
                  <button
                    type="button"
                    onClick={() => onDelete(job.id)}
                    className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Remove Machine</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main interactive grid for this machine */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start text-xs">
        {/* Column 1: Item Autocomplete & Details (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <label className="block text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
            1. Target Item / Part <span className="text-rose-500">*</span>
          </label>

          <JitItemAutocomplete
            items={items}
            molds={molds}
            selectedCode={job.itemCode}
            onSelectItem={handleItemSelect}
            placeholder="Type item code or name (e.g. FG-CTN-500)..."
          />

          {selectedItem && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Category:</span>
                <span className="text-slate-800 font-semibold">{selectedItem.cat || 'Injection Moulded'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Available FG Stock:</span>
                <span className="text-emerald-700 font-bold font-mono">{selectedItem.avail || selectedItem.stock}</span>
              </div>

              {/* Linked BOM Switcher */}
              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span className="font-medium">Linked BOM:</span>
                <select
                  value={job.bomId || bom?.id || 'BOM-1001'}
                  onChange={(e) => handleBomChange(e.target.value)}
                  className="bg-white border border-indigo-200 text-indigo-700 font-semibold text-[11px] rounded px-1.5 py-0.5"
                >
                  {matchingBoms.length > 0 ? (
                    matchingBoms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} ({b.version || 'v2.1'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="BOM-1001">BOM-1001 (v2.1)</option>
                      <option value="BOM-1001-ALT">BOM-1001-ALT (v1.0)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Tooling / Mold & Cavities (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
              2. Mold Tooling &amp; Cavities
            </label>
            <span className="text-[10px] text-indigo-600 font-medium">
              {job.isCustomOverride ? 'Custom Override' : 'Auto-matched'}
            </span>
          </div>

          <div className="space-y-2">
            <select
              value={job.moldId}
              onChange={(e) => handleMoldChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {availableMolds.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} — {m.name} ({m.cavities} Cav)
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">
                  Cavities (Nos)
                </label>
                <div className="relative flex items-center">
                  <Layers className="absolute left-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    max="64"
                    value={job.cavities}
                    onChange={(e) => handleCavitiesChange(Number(e.target.value))}
                    className="w-full pl-7 pr-2 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">
                  Cycle Time (sec)
                </label>
                <div className="relative flex items-center">
                  <Clock className="absolute left-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={job.cycleTimeSec}
                    onChange={(e) => handleCycleTimeChange(Number(e.target.value))}
                    className="w-full pl-7 pr-2 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 flex items-center justify-between px-1">
              <span>Production Velocity:</span>
              <strong className="text-slate-700 font-mono">{hourlyRate.toLocaleString()} PCS/HR</strong>
            </div>

            {/* Optional Operator & Priority */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 font-medium block mb-1">Operator:</span>
                <JitOperatorAutocomplete
                  value={job.operator || ''}
                  onChange={(op) => onChange({ ...job, operator: op })}
                  placeholder="Operator name"
                  allowCreate={true}
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium block mb-1">Priority:</span>
                <select
                  value={job.priority || 'Normal'}
                  onChange={(e) => onChange({ ...job, priority: e.target.value as any })}
                  className="w-full py-1.5 px-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Shift & Planned Run Hours & Expected Finish */}
        <div className="lg:col-span-2 space-y-2">
          <label className="block text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
            3. Shift &amp; Hours
          </label>

          <select
            value={job.shift}
            onChange={(e) => handleShiftChange(e.target.value as JitShift)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="Shift A (06:00 - 14:00)">Shift A (8.0h)</option>
            <option value="Shift B (14:00 - 22:00)">Shift B (8.0h)</option>
            <option value="Shift C (22:00 - 06:00)">Shift C (8.0h)</option>
            <option value="Full Day 24H">Full Day (24.0h)</option>
            <option value="Custom Hours">Custom Hours</option>
          </select>

          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
              <span>Planned Hours:</span>
              <span className="text-indigo-600 font-semibold">{job.plannedHours}h / 24h</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={job.plannedHours}
                onChange={(e) => handleHoursChange(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
              <span className="absolute right-2 text-xs text-slate-400 font-medium">hrs</span>
            </div>
          </div>

          {/* Expected Finish Date & Time (Editable Task 1) */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-2 text-[10px] space-y-1">
            <div className="font-bold flex items-center gap-1 text-indigo-900">
              <CalendarCheck className="w-3 h-3 text-indigo-600" />
              <span>Expected Finish:</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="date"
                value={job.expectedFinishDate || expectedFinish.expectedFinishDate}
                onChange={(e) => onChange({ ...job, expectedFinishDate: e.target.value })}
                className="w-full px-1 py-0.5 text-[10px] font-mono font-bold bg-white border border-indigo-200 rounded"
              />
              <input
                type="time"
                value={job.expectedFinishTime || expectedFinish.expectedFinishTime}
                onChange={(e) => onChange({ ...job, expectedFinishTime: e.target.value })}
                className="w-full px-1 py-0.5 text-[10px] font-mono font-bold bg-white border border-indigo-200 rounded"
              />
            </div>
          </div>
        </div>

        {/* Column 4: Output & Recipe requirements (3 cols) */}
        <div className="lg:col-span-3 bg-indigo-50/50 rounded-lg p-3 space-y-2 border border-indigo-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Calculated Output
            </span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">
              {job.efficiencyPct}% OEE
            </span>
          </div>

          <div className="bg-white border border-indigo-200 rounded-lg p-2.5 text-center shadow-xs">
            <div className="text-[10px] text-slate-500 font-medium uppercase">Target Production Qty</div>
            <div className="text-xl font-extrabold text-indigo-700 font-mono tracking-tight">
              {job.calculatedPcs.toLocaleString()}{' '}
              <span className="text-xs font-bold text-slate-500">PCS</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Based on {job.plannedHours}h × {job.cavities} Cav × {job.cycleTimeSec}s
            </div>
          </div>

          {/* Quick Recipe Consumption Breakdown */}
          <div className="space-y-1 text-[11px]">
            <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              Estimated Recipe Demands:
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-white/80 border border-slate-200 rounded px-2 py-1 flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">RM (Resin):</span>
                <strong className="text-slate-800 font-mono">{estRmKg.toLocaleString()} KG</strong>
              </div>
              <div className="bg-white/80 border border-slate-200 rounded px-2 py-1 flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">MB (Color):</span>
                <strong className="text-slate-800 font-mono">{estMbKg.toLocaleString()} KG</strong>
              </div>
              {estInsertNos > 0 && (
                <div className="bg-white/80 border border-slate-200 rounded px-2 py-1 flex items-center justify-between">
                  <span className="text-slate-500 text-[10px]">Inserts:</span>
                  <strong className="text-slate-800 font-mono">{estInsertNos.toLocaleString()} Nos</strong>
                </div>
              )}
              <div className="bg-white/80 border border-slate-200 rounded px-2 py-1 flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">PCK:</span>
                <strong className="text-slate-800 font-mono">{estPckNos.toLocaleString()} Boxes</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
