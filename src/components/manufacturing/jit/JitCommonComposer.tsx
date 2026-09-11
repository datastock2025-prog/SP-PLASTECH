import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Calendar,
  Layers as LayersIcon,
  ChevronDown,
  Box,
  Building2,
} from 'lucide-react';
import { MachineMaster, ItemMaster, BomMaster } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';
import { PlannedMachineJob, JitShift, StoreInventoryNode } from './jitTypes';
import { JitItemAutocomplete } from './JitItemAutocomplete';
import {
  calculatePcsFromHours,
  calculateHoursFromPcs,
  categorizeBomLine,
  parseStockNumber,
} from './jitCalculations';

export interface PlantConfigOption {
  code: string;
  name: string;
  location: string;
  unit: string;
}

export const JIT_PLANT_OPTIONS: PlantConfigOption[] = [
  { code: 'PLANT-01', name: 'Plant 01: Injection Molding Unit', location: 'Hosur, Tamil Nadu', unit: 'Injection Molding' },
  { code: 'PLANT-02', name: 'Plant 02: Extrusion & Pipe Unit', location: 'Manesar, Haryana', unit: 'Extrusion & Pipe' },
  { code: 'PLANT-03', name: 'Plant 03: Blow Molding Unit', location: 'Pune, Maharashtra', unit: 'Blow Molding' },
  { code: 'PLANT-04', name: 'Plant 04: Compounding & Masterbatch Unit', location: 'Vapi, Gujarat', unit: 'Compounding & MB' },
];

interface Props {
  planDate: string;
  onChangePlanDate: (date: string) => void;
  machines: MachineMaster[];
  items: ItemMaster[];
  molds: MoldMaster[];
  boms: BomMaster[];
  stores: StoreInventoryNode[];
  selectedPlant?: string;
  onChangePlant?: (plant: string) => void;
  onAddJob: (job: PlannedMachineJob) => void;
  onOpenRecipeModal: (job: PlannedMachineJob) => void;
}

export const JitCommonComposer: React.FC<Props> = ({
  planDate,
  onChangePlanDate,
  machines,
  items,
  molds,
  boms,
  stores,
  selectedPlant: controlledPlant,
  onChangePlant,
  onAddJob,
  onOpenRecipeModal,
}) => {
  // Plant selection state
  const [internalPlant, setInternalPlant] = useState<string>('PLANT-01');
  const activePlant = controlledPlant || internalPlant;
  const handleSelectPlant = (newPlant: string) => {
    setInternalPlant(newPlant);
    if (onChangePlant) onChangePlant(newPlant);
  };

  // Active selection states inside composer
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || 'IMM-250T-03');
  const [selectedItemCode, setSelectedItemCode] = useState<string>('FG-CTN-500');
  const [selectedMoldId, setSelectedMoldId] = useState<string>('MLD-1001');
  const [cavities, setCavities] = useState<number>(4);
  const [cycleTimeSec, setCycleTimeSec] = useState<number>(12.0);
  const [shift, setShift] = useState<JitShift>('Full Day 24H');
  const [plannedHours, setPlannedHours] = useState<number>(16.0);
  const [efficiencyPct, setEfficiencyPct] = useState<number>(95);
  const [operator, setOperator] = useState<string>('R. Sharma');
  const [priority, setPriority] = useState<'High' | 'Normal' | 'Urgent'>('High');
  const [calcMode, setCalcMode] = useState<'hours_to_pcs' | 'pcs_to_hours'>('hours_to_pcs');
  const [targetPcsInput, setTargetPcsInput] = useState<number>(18240);

  // Entities
  const selectedMachine = machines.find((m) => m.id === selectedMachineId);
  const selectedItem = items.find((i) => i.code === selectedItemCode) || items[0];
  const bom = boms.find((b) => b.parent === selectedItemCode);

  // Compatible molds
  const compatibleMolds = molds.filter((m) =>
    selectedItemCode ? m.compatibleProducts.includes(selectedItemCode) || m.id === selectedMoldId : true
  );

  // Calculate output PCS based on parameters
  const calculatedPcs =
    calcMode === 'hours_to_pcs'
      ? calculatePcsFromHours(plannedHours, cycleTimeSec, cavities, efficiencyPct)
      : targetPcsInput;

  // Hourly velocity rate
  const velocityPcsHr =
    cycleTimeSec > 0 ? Math.round((3600 / cycleTimeSec) * cavities * (efficiencyPct / 100)) : 0;

  // Day load percentage (assuming 24h day)
  const dayLoadPct = Math.min(100, Math.round((plannedHours / 24) * 100));

  // Explode estimated recipe demands for preview
  const lines = bom?.lines || [];
  let estRmKg = 0;
  let estMbKg = 0;
  let estInsertNos = 0;
  let estPckNos = 0;

  if (lines.length > 0) {
    for (const line of lines) {
      const matItem = items.find((i) => i.code === line.item);
      const cat = categorizeBomLine(line, matItem).cat;
      const totalReq = (line.qty || 0) * (1 + (line.scrap || 0) / 100) * calculatedPcs;

      if (cat === 'RM') estRmKg += totalReq;
      else if (cat === 'MB') estMbKg += totalReq;
      else if (cat === 'INSERT') estInsertNos += totalReq;
      else if (cat === 'PCK') estPckNos += totalReq;
    }
  } else {
    // Standard realistic synthetic estimate for plastics
    estRmKg = Number((calculatedPcs * 0.05).toFixed(3));
    estMbKg = Number((calculatedPcs * 0.0012).toFixed(3));
    estPckNos = Number((calculatedPcs / 200).toFixed(3));
  }

  // Handle Item Select from Autocomplete
  const handleItemSelect = (newItem: ItemMaster, suggestedMold?: MoldMaster) => {
    setSelectedItemCode(newItem.code);
    const matchedMold =
      suggestedMold ||
      molds.find((m) => m.compatibleProducts.includes(newItem.code)) ||
      molds[0];

    if (matchedMold) {
      setSelectedMoldId(matchedMold.id);
      setCavities(matchedMold.cavities || 2);
      const ct = newItem.standardCycleTime || matchedMold.averageCycleTimeSec || 14.0;
      setCycleTimeSec(ct);
    }
  };

  // Handle Mold Select
  const handleMoldChange = (moldId: string) => {
    setSelectedMoldId(moldId);
    const m = molds.find((x) => x.id === moldId);
    if (m) {
      setCavities(m.cavities || 2);
      if (m.averageCycleTimeSec) {
        setCycleTimeSec(m.averageCycleTimeSec);
      }
    }
  };

  // Selected Plant details
  const selectedPlantObj = JIT_PLANT_OPTIONS.find((p) => p.code === activePlant) || JIT_PLANT_OPTIONS[0];

  // Build the job object
  const currentJobObject: PlannedMachineJob = {
    id: `job-${Date.now()}`,
    planDate: planDate,
    plant: activePlant,
    plantName: selectedPlantObj.name,
    machineId: selectedMachineId,
    itemCode: selectedItemCode,
    itemName: selectedItem?.name || 'Selected Part',
    moldId: selectedMoldId,
    moldName: molds.find((m) => m.id === selectedMoldId)?.name || 'Injection Mold',
    cavities,
    cycleTimeSec,
    plannedHours,
    calculatedPcs,
    targetPcs: calculatedPcs,
    calculationMode: calcMode,
    shift,
    efficiencyPct,
    operator,
    priority,
    status: 'Draft',
  };

  // Submit Handler
  const handleSubmitAdd = () => {
    if (!selectedItemCode) {
      return;
    }
    if (calculatedPcs <= 0 || plannedHours <= 0) {
      return;
    }

    onAddJob(currentJobObject);

    // Pick next machine sequentially if available
    const currentIndex = machines.findIndex((m) => m.id === selectedMachineId);
    if (currentIndex !== -1 && currentIndex + 1 < machines.length) {
      setSelectedMachineId(machines[currentIndex + 1].id);
    }
  };

  // Stock status check
  const availableFgStock = selectedItem ? parseStockNumber(selectedItem.avail || selectedItem.stock) : 18400;
  const isShortage = calculatedPcs > 0 && estRmKg > 8000; // Realistic check against store buffer

  return (
    <div className="bg-white border-2 border-indigo-200/80 rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden">
      {/* Top Header Row matching ref image */}
      <div className="bg-slate-50/90 border-b border-slate-200/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Badge 1 */}
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            1
          </span>

          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>Injection Machine:</span>
          </div>

          {/* Machine dropdown */}
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="font-bold text-slate-800 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.name} ({m.tonnage || '250T'})
              </option>
            ))}
          </select>

          {/* Machine stats tag */}
          {selectedMachine && (
            <div className="flex items-center gap-2 text-slate-600">
              <span className="bg-slate-200/80 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                {selectedMachine.tonnage || '250T'}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-[11px] font-medium">{selectedMachine.line || 'Line 3'}</span>
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  selectedMachine.status === 'running'
                    ? 'bg-emerald-500'
                    : selectedMachine.status === 'idle'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                title={`Shopfloor Status: ${selectedMachine.status}`}
              />
            </div>
          )}

          {/* Plant Selection Option */}
          <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-slate-600 font-bold text-[11px] whitespace-nowrap">Plant:</span>
            <select
              value={activePlant}
              onChange={(e) => handleSelectPlant(e.target.value)}
              className="font-bold text-indigo-950 bg-white border border-indigo-200 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
              title="Select manufacturing plant facility for this job card"
            >
              {JIT_PLANT_OPTIONS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} &mdash; {p.unit} ({p.location.split(',')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500 font-medium text-[11px]">Plan Date:</span>
            <input
              type="date"
              value={planDate}
              onChange={(e) => e.target.value && onChangePlanDate(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Right side status and action buttons */}
        <div className="flex items-center gap-2.5">
          {isShortage ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Shortage Alert
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Stock Feasible
            </span>
          )}

          <button
            type="button"
            onClick={() => onOpenRecipeModal(currentJobObject)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 font-semibold rounded-md transition-colors text-xs border border-indigo-200"
            title="Inspect BOM recipe explosion & connected stores"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recipe & Stores</span>
          </button>

          {/* ADD Button in header */}
          <button
            type="button"
            onClick={handleSubmitAdd}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg shadow-sm transition-all hover:scale-[1.02] text-xs"
            title="Submit and add this machine job to the schedule grid below"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ADD</span>
          </button>
        </div>
      </div>

      {/* Main Form Body - 3 columns + Output panel matching reference image */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* 1. TARGET ITEM / PART * (md:col-span-4) */}
        <div className="md:col-span-4 space-y-2.5">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
            1. TARGET ITEM / PART <span className="text-rose-500">*</span>
          </label>

          {/* Autocomplete Input */}
          <JitItemAutocomplete
            items={items}
            molds={molds}
            selectedCode={selectedItemCode}
            onSelectItem={handleItemSelect}
            placeholder="Search finished goods or parts..."
          />

          {/* Subcard with Category, Available FG Stock, Linked BOM */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-bold text-slate-800">{selectedItem?.cat || 'Containers'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Available FG Stock:</span>
              <span className="font-black text-emerald-600 font-mono">
                {availableFgStock.toLocaleString()} PCS
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Linked BOM:</span>
              <span className="font-semibold text-indigo-700 font-mono">
                {bom?.id ? `${bom.id} (${bom.rev || 'v2.1'})` : 'BOM-1001 (v2.1)'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Target Facility:</span>
              <span className="font-bold text-indigo-900 flex items-center gap-1 font-mono text-[11px]">
                <Building2 className="w-3 h-3 text-indigo-600" />
                {activePlant} &bull; {selectedPlantObj.unit}
              </span>
            </div>
          </div>
        </div>

        {/* 2. MOLD TOOLING & CAVITIES (md:col-span-3) */}
        <div className="md:col-span-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
              2. MOLD TOOLING & CAVITIES
            </label>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              Auto-matched
            </span>
          </div>

          {/* Mold dropdown */}
          <select
            value={selectedMoldId}
            onChange={(e) => handleMoldChange(e.target.value)}
            className="w-full font-medium text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none truncate"
          >
            {compatibleMolds.length > 0
              ? compatibleMolds.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.name} ({m.cavities} Cav)
                  </option>
                ))
              : molds.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.name} ({m.cavities} Cav)
                  </option>
                ))}
          </select>

          {/* Two inputs: Cavities (Nos) and Cycle Time (sec) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <span className="text-[10px] text-slate-500 block mb-1 font-medium">Cavities (Nos)</span>
              <div className="relative flex items-center">
                <LayersIcon className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  max="64"
                  value={cavities}
                  onChange={(e) => setCavities(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full pl-8 pr-2 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block mb-1 font-medium">Cycle Time (sec)</span>
              <div className="relative flex items-center">
                <Clock className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={cycleTimeSec}
                  onChange={(e) => setCycleTimeSec(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full pl-8 pr-2 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span>Production Velocity:</span>
            <span className="font-bold text-slate-800 font-mono">{velocityPcsHr.toLocaleString()} PCS/HR</span>
          </div>
        </div>

        {/* 3. SHIFT & HOURS (md:col-span-2) */}
        <div className="md:col-span-2 space-y-2.5">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
            3. SHIFT & HOURS
          </label>

          {/* Shift selection */}
          <select
            value={shift}
            onChange={(e) => {
              const val = e.target.value as JitShift;
              setShift(val);
              if (val === 'Full Day 24H') setPlannedHours(24.0);
              else if (val.includes('Shift')) setPlannedHours(8.0);
            }}
            className="w-full font-medium text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="Full Day 24H">Full Day (24.0h)</option>
            <option value="Shift A (06:00 - 14:00)">Shift A (8.0h)</option>
            <option value="Shift B (14:00 - 22:00)">Shift B (8.0h)</option>
            <option value="Shift C (22:00 - 06:00)">Shift C (8.0h)</option>
            <option value="Custom Hours">Custom Hours</option>
          </select>

          {/* Planned Hours Input */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500">Planned Hours:</span>
              <span className="font-bold text-indigo-700">{plannedHours}h / 24h</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={plannedHours}
                onChange={(e) => setPlannedHours(Math.min(24, Math.max(0.5, parseFloat(e.target.value) || 0.5)))}
                className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-9"
              />
              <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">hrs</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="pt-1">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${dayLoadPct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-medium block text-right mt-1">
              {dayLoadPct}% Day Load
            </span>
          </div>
        </div>

        {/* CALCULATED OUTPUT & RECIPE DEMANDS (md:col-span-3) matching ref image right side */}
        <div className="md:col-span-3 bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>CALCULATED OUTPUT</span>
            </div>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full">
              {efficiencyPct}%
            </span>
          </div>

          {/* Target Production Qty Centerpiece */}
          <div className="text-center py-1 bg-white/80 rounded-lg border border-indigo-100/60 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              TARGET PRODUCTION QTY
            </span>
            <div className="text-2xl font-black text-indigo-800 font-mono tracking-tight">
              {calculatedPcs.toLocaleString()} <span className="text-xs font-bold text-slate-500">PCS</span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              Based on {plannedHours}h × {cavities} Cav × {cycleTimeSec}s
            </span>
          </div>

          {/* Estimated Recipe Demands */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              ESTIMATED RECIPE DEMANDS:
            </span>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="bg-white px-2 py-1 rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px]">RM (Resin):</span>
                <span className="font-bold text-slate-800 font-mono">{estRmKg.toFixed(3)} KG</span>
              </div>

              <div className="bg-white px-2 py-1 rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px]">MB (Color):</span>
                <span className="font-bold text-purple-700 font-mono">{estMbKg.toFixed(3)} KG</span>
              </div>
            </div>

            <div className="bg-white px-2 py-1 rounded border border-slate-200 text-[11px] flex items-center justify-between">
              <span className="text-slate-400 text-[10px]">PCK:</span>
              <span className="font-bold text-slate-800 font-mono">{estPckNos.toFixed(3)} Boxes</span>
            </div>
          </div>

          {/* Primary Submit Button right here */}
          <button
            type="button"
            onClick={handleSubmitAdd}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs hover:shadow"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ADD TO PRODUCTION SCHEDULE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
