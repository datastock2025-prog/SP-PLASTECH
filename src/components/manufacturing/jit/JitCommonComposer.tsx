import React, { useState } from 'react';
import {
  Cpu,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Calendar,
  Layers as LayersIcon,
  Building2,
  CalendarCheck,
  Fingerprint,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { MachineMaster, ItemMaster, BomMaster, AuthUser } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';
import { PlannedMachineJob, JitShift, StoreInventoryNode } from './jitTypes';
import { JitItemAutocomplete } from './JitItemAutocomplete';
import { JitOperatorAutocomplete } from './JitOperatorAutocomplete';
import { useAuthContext } from '../../../shared/components/RequireAuth';
import {
  calculatePcsFromHours,
  calculateHoursFromPcs,
  categorizeBomLine,
  parseStockNumber,
  calculateExpectedFinish,
  getFormulaRecipeId,
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
  currentUser?: AuthUser | null;
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
  selectedPlant: controlledPlant,
  currentUser: propUser,
  onChangePlant,
  onAddJob,
  onOpenRecipeModal,
}) => {
  const authContext = useAuthContext();
  const effectiveUser = propUser || authContext.currentUser;
  const userAssignedPlant = effectiveUser?.plantId || localStorage.getItem('sp_active_plant') || 'PLANT-01';

  // Task 1: Check admin permission based on user ID / role / roleType / permissions
  const isAdmin = Boolean(
    effectiveUser?.role?.toLowerCase().includes('admin') ||
    effectiveUser?.roleType?.toLowerCase().includes('admin') ||
    effectiveUser?.id?.toLowerCase().includes('admin') ||
    effectiveUser?.permissions?.includes('all') ||
    effectiveUser?.permissions?.includes('admin') ||
    effectiveUser?.permissions?.includes('change_plant') ||
    effectiveUser?.permissions?.includes('plant_override')
  );

  // Plant selection state: defaults to login plant
  const [internalPlant, setInternalPlant] = useState<string>(userAssignedPlant);
  const activePlant = controlledPlant || internalPlant;
  const handleSelectPlant = (newPlant: string) => {
    if (!isAdmin) return; // Only admin can change plant
    setInternalPlant(newPlant);
    if (onChangePlant) onChangePlant(newPlant);
  };

  // Task 1: Initially ALL form fields are empty!
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedItemCode, setSelectedItemCode] = useState<string>('');
  const [selectedMoldId, setSelectedMoldId] = useState<string>('');
  const [selectedBomId, setSelectedBomId] = useState<string>('');
  const [cavities, setCavities] = useState<number>(0);
  const [cycleTimeSec, setCycleTimeSec] = useState<number>(0);
  const [isCustomCavity, setIsCustomCavity] = useState<boolean>(false);
  const [isCustomCycleTime, setIsCustomCycleTime] = useState<boolean>(false);
  const [shift, setShift] = useState<JitShift>('Full Day 24H');
  const [plannedHours, setPlannedHours] = useState<number>(0);
  const [efficiencyPct, setEfficiencyPct] = useState<number>(95);
  const [operator, setOperator] = useState<string>('');
  const [priority, setPriority] = useState<'High' | 'Normal' | 'Urgent'>('Normal');
  const [calcMode, setCalcMode] = useState<'hours_to_pcs' | 'pcs_to_hours'>('hours_to_pcs');
  const [targetPcsInput, setTargetPcsInput] = useState<number>(0);

  // Editable Expected Finish Date & Time State
  const autoFinish = calculateExpectedFinish(planDate, plannedHours > 0 ? plannedHours : 8, shift);
  const [customFinishDate, setCustomFinishDate] = useState<string>('');
  const [customFinishTime, setCustomFinishTime] = useState<string>('');
  const [isCustomFinish, setIsCustomFinish] = useState<boolean>(false);

  const effectiveFinishDate = isCustomFinish && customFinishDate ? customFinishDate : autoFinish.expectedFinishDate;
  const effectiveFinishTime = isCustomFinish && customFinishTime ? customFinishTime : autoFinish.expectedFinishTime;

  // Entities
  const selectedMachine = machines.find((m) => m.id === selectedMachineId);
  const selectedItem = selectedItemCode ? items.find((i) => i.code === selectedItemCode) : undefined;
  
  // Compatible Approved/Released BOMs only for selected item
  const matchingBoms = selectedItemCode
    ? boms.filter((b) => b.parent === selectedItemCode && (b.status === 'approved' || b.status === 'released'))
    : [];
  const fallbackApprovedBom = selectedItemCode
    ? boms.find((b) => b.parent === selectedItemCode)
    : undefined;
  const bom = matchingBoms.find((b) => b.id === selectedBomId) || matchingBoms[0] || fallbackApprovedBom;

  // Linked Formula ID
  const activeFormulaId = selectedItemCode
    ? getFormulaRecipeId(
        selectedItemCode,
        selectedItem?.name,
        bom?.version || '2.1',
        bom?.formulaCode || bom?.recipeCode
      )
    : '—';

  // Compatible molds
  const compatibleMolds = selectedItemCode
    ? molds.filter((m) => m.compatibleProducts?.includes(selectedItemCode) || m.id === selectedMoldId)
    : molds;

  // Calculate output PCS based on parameters
  const calculatedPcs =
    !selectedItemCode || cavities <= 0 || cycleTimeSec <= 0 || plannedHours <= 0
      ? 0
      : calcMode === 'hours_to_pcs'
      ? calculatePcsFromHours(plannedHours, cycleTimeSec, cavities, efficiencyPct)
      : targetPcsInput;

  // Hourly velocity rate
  const velocityPcsHr =
    selectedItemCode && cycleTimeSec > 0 && cavities > 0
      ? Math.round((3600 / cycleTimeSec) * cavities * (efficiencyPct / 100))
      : 0;

  // Day load percentage (assuming 24h day)
  const dayLoadPct = Math.min(100, Math.round((plannedHours / 24) * 100));

  // Explode estimated recipe demands for preview with Plant-specific store
  const lines = bom?.lines || [];
  let estRmKg = 0;
  let estMbKg = 0;
  let estPckNos = 0;

  if (selectedItemCode && calculatedPcs > 0) {
    if (lines.length > 0) {
      for (const line of lines) {
        const matItem = items.find((i) => i.code === line.item);
        const cat = categorizeBomLine(line, matItem, activePlant).cat;
        const totalReq = (line.qty || 0) * (1 + (line.scrap || 0) / 100) * calculatedPcs;

        if (cat === 'RM') estRmKg += totalReq;
        else if (cat === 'MB') estMbKg += totalReq;
        else if (cat === 'PCK') estPckNos += totalReq;
      }
    } else {
      estRmKg = Number((calculatedPcs * 0.05).toFixed(3));
      estMbKg = Number((calculatedPcs * 0.0012).toFixed(3));
      estPckNos = Number((calculatedPcs / 200).toFixed(3));
    }
  }

  // Task 1: Handle Item Select from Autocomplete - Autofills BOM, Mold, Machine & Runtime
  const handleItemSelect = (newItem: ItemMaster, suggestedMold?: MoldMaster) => {
    setSelectedItemCode(newItem.code);

    // Auto-match approved BOM
    const matchedBoms = boms.filter((b) => b.parent === newItem.code && (b.status === 'approved' || b.status === 'released'));
    const defaultBom = matchedBoms[0] || boms.find((b) => b.parent === newItem.code);
    if (defaultBom) {
      setSelectedBomId(defaultBom.id);
    } else {
      setSelectedBomId('BOM-1001');
    }

    // Auto-match compatible mold
    const matchedMold =
      suggestedMold ||
      molds.find((m) => m.compatibleProducts?.includes(newItem.code)) ||
      molds.find((m) => m.name.toLowerCase().includes(newItem.name.toLowerCase().split(' ')[0])) ||
      molds[0];

    if (matchedMold) {
      setSelectedMoldId(matchedMold.id);
      setCavities(matchedMold.cavities || 4);
      setIsCustomCavity(false);
      const ct = newItem.standardCycleTime || matchedMold.averageCycleTimeSec || 12.0;
      setCycleTimeSec(ct);
      setIsCustomCycleTime(false);
    }

    // Auto-match suitable machine if not yet selected
    if (!selectedMachineId) {
      const suitableMachine = machines.find((m) =>
        (matchedMold?.tonnage ? (m.tonnage || 0) >= matchedMold.tonnage : true) &&
        m.status === 'running'
      ) || machines.find((m) => m.status === 'running') || machines[0];
      if (suitableMachine) {
        setSelectedMachineId(suitableMachine.id);
      }
    }

    // Default planned runtime if currently 0
    if (plannedHours === 0) {
      setPlannedHours(shift === 'Full Day 24H' ? 16.0 : 8.0);
    }
  };

  // Handle Mold Select
  const handleMoldChange = (moldId: string) => {
    setSelectedMoldId(moldId);
    const m = molds.find((x) => x.id === moldId);
    if (m) {
      setCavities(m.cavities || 2);
      setIsCustomCavity(false);
      if (m.averageCycleTimeSec) {
        setCycleTimeSec(m.averageCycleTimeSec);
        setIsCustomCycleTime(false);
      }
    }
  };

  // Handle Cavity edit with tracking
  const handleCavityChange = (newCav: number) => {
    setCavities(newCav);
    setIsCustomCavity(true);
  };

  // Handle Cycle time edit with tracking
  const handleCycleTimeChange = (newCt: number) => {
    setCycleTimeSec(newCt);
    setIsCustomCycleTime(true);
  };

  // Selected Plant details
  const selectedPlantObj = JIT_PLANT_OPTIONS.find((p) => p.code === activePlant) || JIT_PLANT_OPTIONS[0];

  // Build the job object
  const currentJobObject: PlannedMachineJob = {
    id: `job-${Date.now()}`,
    planDate: planDate,
    plant: activePlant,
    plantName: selectedPlantObj.name,
    machineId: selectedMachineId || (machines[0]?.id || 'IMM-250T-03'),
    itemCode: selectedItemCode,
    itemName: selectedItem?.name || 'Selected Part',
    moldId: selectedMoldId,
    moldName: molds.find((m) => m.id === selectedMoldId)?.name || 'Injection Mold',
    bomId: bom?.id || selectedBomId || 'BOM-1001',
    formulaId: activeFormulaId,
    cavities,
    cycleTimeSec,
    isCustomCavity,
    isCustomCycleTime,
    isCustomOverride: isCustomCavity || isCustomCycleTime,
    plannedHours,
    calculatedPcs,
    targetPcs: calculatedPcs,
    calculationMode: calcMode,
    shift,
    efficiencyPct,
    operator,
    priority,
    expectedFinishDate: effectiveFinishDate,
    expectedFinishTime: effectiveFinishTime,
    status: 'Draft',
    auditLog: isCustomCavity || isCustomCycleTime
      ? [
          {
            timestamp: new Date().toLocaleTimeString(),
            action: `Configured job with ${isCustomCavity ? `custom cavities (${cavities})` : ''} ${isCustomCycleTime ? `custom cycle time (${cycleTimeSec}s)` : ''}`,
            user: operator,
          },
        ]
      : undefined,
  };

  const canSubmit = Boolean(
    selectedItemCode &&
    selectedMachineId &&
    calculatedPcs > 0 &&
    plannedHours > 0 &&
    cavities > 0 &&
    cycleTimeSec > 0
  );

  // Submit Handler (Task 3: after add and add to production button are clicked all common fields are empty wait for next input)
  const handleSubmitAdd = () => {
    if (!canSubmit) return;
    onAddJob(currentJobObject);

    // Reset all common input fields to empty waiting for next input
    setSelectedMachineId('');
    setSelectedItemCode('');
    setSelectedMoldId('');
    setSelectedBomId('');
    setCavities(0);
    setCycleTimeSec(0);
    setIsCustomCavity(false);
    setIsCustomCycleTime(false);
    setShift('Full Day 24H');
    setPlannedHours(0);
    setEfficiencyPct(95);
    setOperator('');
    setPriority('Normal');
    setCalcMode('hours_to_pcs');
    setTargetPcsInput(0);
    setCustomFinishDate('');
    setCustomFinishTime('');
    setIsCustomFinish(false);
  };

  // Stock status check
  const availableFgStock = selectedItem ? parseStockNumber(selectedItem.avail || selectedItem.stock) : 0;
  const isShortage = calculatedPcs > 0 && estRmKg > 8000;

  return (
    <div className="bg-white border-2 border-indigo-200/90 rounded-2xl shadow-sm overflow-hidden">
      {/* Top Banner with Machine Selector, Plant, Plan Date, Feasibility, Recipe & Stores button, and ADD */}
      <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border-b border-indigo-100 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Machine Selector & Plant */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-[11px]">
              1
            </span>
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Injection Machine:</span>
          </div>

          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
          >
            <option value="">-- Select Injection Machine --</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.name} ({m.tonnage || 'Standard'})
              </option>
            ))}
          </select>

          {selectedMachine && (
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">
                {selectedMachine.tonnage}
              </span>
              <span>{selectedMachine.line}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedMachine.status === 'running'
                    ? 'bg-emerald-500'
                    : selectedMachine.status === 'idle'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                title={`Status: ${selectedMachine.status}`}
              />
            </div>
          )}

          {/* Plant Selector: Defaults to login user's plant, Admin gets privilege to change */}
          <div className="flex items-center gap-1 ml-1 sm:ml-2">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">Plant:</span>
            {isAdmin ? (
              <select
                value={activePlant}
                onChange={(e) => handleSelectPlant(e.target.value)}
                className="bg-white border border-indigo-200 text-slate-800 font-bold rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                title="Admin access: Click to change target manufacturing plant"
              >
                {JIT_PLANT_OPTIONS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} &mdash; {p.unit} ({p.location.split(',')[0]})
                  </option>
                ))}
              </select>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-md text-slate-700 font-bold text-xs"
                title={`Assigned to ${selectedPlantObj.name}. Admin access required to switch plants.`}
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>{selectedPlantObj.code} &mdash; {selectedPlantObj.unit}</span>
                <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded font-normal">Assigned</span>
              </div>
            )}
          </div>

          {/* Plan Date Picker */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">Plan Date:</span>
            <input
              type="date"
              value={planDate}
              onChange={(e) => e.target.value && onChangePlanDate(e.target.value)}
              className="bg-white border border-indigo-200 text-slate-800 font-bold rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Right: Feasibility + Recipe & Stores + ADD button */}
        <div className="flex items-center gap-2">
          {!selectedItemCode ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <span>Select item to check stock</span>
            </span>
          ) : isShortage ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Shortage Alert</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Stock Feasible</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => selectedItemCode && onOpenRecipeModal(currentJobObject)}
            disabled={!selectedItemCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title={selectedItemCode ? "Inspect BOM recipe explosion & connected plant stores" : "Select an item first to inspect recipe"}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Recipe &amp; Stores</span>
          </button>

          {/* ADD Button in header */}
          <button
            type="button"
            onClick={handleSubmitAdd}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-sm transition-all hover:scale-[1.02] text-xs cursor-pointer"
            title={canSubmit ? "Submit and add this machine job to the schedule grid below" : "Please select Item, Machine and runtime hours before adding"}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ ADD</span>
          </button>
        </div>
      </div>

      {/* Main Form Body - 3 columns + Output panel */}
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

          {/* Subcard with Category, Available FG Stock, Linked BOM SWITCHER */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-bold text-slate-800">{selectedItem?.cat || '—'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Available FG Stock:</span>
              <span className="font-black text-emerald-600 font-mono">
                {selectedItem ? `${availableFgStock.toLocaleString()} PCS` : '—'}
              </span>
            </div>

            {/* Task 1: Linked BOM Switch Option */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Linked BOM:</span>
              {selectedItem ? (
                <select
                  value={selectedBomId}
                  onChange={(e) => setSelectedBomId(e.target.value)}
                  className="bg-white border border-indigo-200 text-indigo-800 font-mono font-bold rounded px-2 py-0.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  title="Switch linked Bill of Materials (BOM) revision or alternate recipe"
                >
                  {matchingBoms.length > 0 ? (
                    matchingBoms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} ({b.version || 'v2.1'}) &mdash; {b.name || 'Active BOM'}
                      </option>
                    ))
                  ) : (
                    <option value="BOM-1001">BOM-1001 (v2.1) &mdash; Standard Injection</option>
                  )}
                </select>
              ) : (
                <span className="text-slate-400 font-mono text-[11px]">Select item first</span>
              )}
            </div>

            {/* Task 2: Linked Formula ID */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5 text-cyan-600" />
                <span>Formula ID:</span>
              </span>
              {selectedItemCode ? (
                <span
                  className="px-2 py-0.5 rounded font-mono font-black text-[11px] bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-2xs flex items-center gap-1"
                  title="Unique Recipe Formula Identification Number linked to active BOM Version"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  {activeFormulaId}
                </span>
              ) : (
                <span className="text-slate-400 font-mono text-[11px]">—</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Target Facility &amp; Default Store:</span>
              <span className="font-bold text-indigo-900 flex items-center gap-1 font-mono text-[11px]">
                <Building2 className="w-3 h-3 text-indigo-600" />
                {activePlant} &bull; {activePlant.includes('02') ? 'PRD-UNIT-2' : 'PRD-UNIT-1'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. MOLD TOOLING & CAVITIES (md:col-span-3) */}
        <div className="md:col-span-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
              2. MOLD TOOLING &amp; CAVITIES
            </label>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {isCustomCavity || isCustomCycleTime ? 'Custom Override' : 'Auto-matched'}
            </span>
          </div>

          {/* Mold dropdown */}
          <select
            value={selectedMoldId}
            onChange={(e) => handleMoldChange(e.target.value)}
            className="w-full font-medium text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none truncate"
          >
            <option value="">-- Select or Auto-matched Mold --</option>
            {compatibleMolds.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.name} ({m.cavities} Cav)
              </option>
            ))}
          </select>

          {/* Two inputs: Cavities (Nos) and Cycle Time (sec) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500 font-medium">Cavities (Nos)</span>
                {isCustomCavity && (
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded">Edited</span>
                )}
              </div>
              <div className="relative flex items-center">
                <LayersIcon className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  max="64"
                  placeholder="0"
                  value={cavities > 0 ? cavities : ''}
                  onChange={(e) => handleCavityChange(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full pl-8 pr-2 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500 font-medium">Cycle Time (sec)</span>
                {isCustomCycleTime && (
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded">Edited</span>
                )}
              </div>
              <div className="relative flex items-center">
                <Clock className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  placeholder="0"
                  value={cycleTimeSec > 0 ? cycleTimeSec : ''}
                  onChange={(e) => handleCycleTimeChange(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full pl-8 pr-2 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span>Production Velocity:</span>
            <span className="font-bold text-slate-800 font-mono">{velocityPcsHr.toLocaleString()} PCS/HR</span>
          </div>

          {/* Optional Fields: Operator Autocomplete & Priority */}
          <div className="pt-2 border-t border-slate-200/70 grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 font-medium block mb-1">Operator (Autocomplete)</span>
              <JitOperatorAutocomplete
                value={operator}
                onChange={setOperator}
                placeholder="Type or select operator..."
                allowCreate={true}
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-medium block mb-1">Priority (Optional)</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full py-1.5 px-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Rush)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. SHIFT & HOURS (md:col-span-2) */}
        <div className="md:col-span-2 space-y-2.5">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
            3. SHIFT &amp; HOURS
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
                min="0"
                max="24"
                step="0.5"
                placeholder="0"
                value={plannedHours > 0 ? plannedHours : ''}
                onChange={(e) => setPlannedHours(Math.min(24, Math.max(0, parseFloat(e.target.value) || 0)))}
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

          {/* Expected Finish Date & Time Editable Controls */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 text-[10px] text-indigo-900 space-y-1.5">
            <div className="font-bold flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1">
                <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Expected Finish</span>
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                {isCustomFinish ? 'Custom' : 'Auto'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <span className="text-[9px] text-slate-500 block">Finish Date</span>
                <input
                  type="date"
                  value={effectiveFinishDate}
                  onChange={(e) => {
                    setCustomFinishDate(e.target.value);
                    setIsCustomFinish(true);
                  }}
                  className="w-full px-1.5 py-1 text-[11px] font-bold font-mono bg-white border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-indigo-950"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Finish Time</span>
                <input
                  type="time"
                  value={effectiveFinishTime}
                  onChange={(e) => {
                    setCustomFinishTime(e.target.value);
                    setIsCustomFinish(true);
                  }}
                  className="w-full px-1.5 py-1 text-[11px] font-bold font-mono bg-white border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-indigo-950"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CALCULATED OUTPUT & RECIPE DEMANDS (md:col-span-3) */}
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
              {selectedItemCode && cavities > 0 && cycleTimeSec > 0 && plannedHours > 0
                ? `Based on ${plannedHours}h × ${cavities} Cav × ${cycleTimeSec}s`
                : 'Configure item and machine parameters'}
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

          {/* Primary Submit Button */}
          <button
            type="button"
            onClick={handleSubmitAdd}
            disabled={!canSubmit}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs hover:shadow cursor-pointer"
            title={canSubmit ? "Add configured machine job to production schedule" : "Please select Item, Machine and runtime hours to add"}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ADD TO PRODUCTION SCHEDULE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
