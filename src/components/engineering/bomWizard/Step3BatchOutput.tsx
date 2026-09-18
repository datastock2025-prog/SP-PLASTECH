import React, { useState, useEffect, useRef } from 'react';
import { ManufacturingBomWizardState } from './types';
import { masterDataGovernanceService } from '../../../services/masterDataGovernanceService';
import { adminEventBus } from '../../../services/adminService';
import {
  Boxes,
  Gauge,
  MapPin,
  Clock,
  FlaskConical,
  Percent,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Scale,
  Zap,
  Plus,
  Search,
  ChevronDown,
  Building2,
  X,
  Check,
} from 'lucide-react';

interface Step3Props {
  state: ManufacturingBomWizardState;
  onChange: (patch: Partial<ManufacturingBomWizardState>) => void;
  errors: Record<string, string>;
}

export const Step3BatchOutput: React.FC<Step3Props> = ({ state, onChange, errors }) => {
  const isFormulaMode = state.mfgCategory === 'Formula / Recipe BOM';

  // Master Data Warehouse & Bin integration
  const [warehouseList, setWarehouseList] = useState(() => masterDataGovernanceService.getWarehouses());
  const [binList, setBinList] = useState(() => masterDataGovernanceService.getBins());

  // Active Dropdowns
  const [openDropdown, setOpenDropdown] = useState<'input' | 'wip' | 'fg' | 'secondary' | null>(null);

  // New Location Creation Modal
  const [isNewLocationModalOpen, setIsNewLocationModalOpen] = useState<boolean>(false);
  const [locationTypeToCreate, setLocationTypeToCreate] = useState<'input' | 'wip' | 'fg' | 'secondary'>('input');
  const [newLocationCode, setNewLocationCode] = useState<string>('');
  const [newLocationWh, setNewLocationWh] = useState<string>('RM-WH-01');

  useEffect(() => {
    const unsub = adminEventBus.on('WAREHOUSE_MASTER_SAVED', () => {
      setWarehouseList(masterDataGovernanceService.getWarehouses());
    });
    const unsubBin = adminEventBus.on('BIN_MASTER_SAVED', () => {
      setBinList(masterDataGovernanceService.getBins());
    });
    return () => {
      unsub();
      unsubBin();
    };
  }, []);

  // Handler for batch size update with auto-calculation of finished & scrap
  const handleBatchSizeChange = (val: number) => {
    const safeVal = isNaN(val) || val < 0 ? 0 : val;
    const scrapQty = Math.round((safeVal * state.scrapPct) / 100);
    const finishedQty = Math.max(0, safeVal - scrapQty);
    const hours = Number(((safeVal * (state.standardCycleTimeSec || 14.5)) / 3600).toFixed(2));
    onChange({
      batchSize: safeVal,
      outputQty: safeVal,
      expectedFinishedQty: finishedQty,
      expectedScrapQty: scrapQty,
      estimatedProductionTimeHours: hours,
    });
  };

  const handleYieldChange = (yieldVal: number) => {
    const safeYield = Math.min(100, Math.max(0, yieldVal));
    const safeScrap = Number((100 - safeYield).toFixed(2));
    const scrapQty = Math.round((state.batchSize * safeScrap) / 100);
    const finishedQty = Math.max(0, state.batchSize - scrapQty);
    onChange({
      yieldPct: safeYield,
      scrapPct: safeScrap,
      expectedFinishedQty: finishedQty,
      expectedScrapQty: scrapQty,
    });
  };

  const handleScrapChange = (scrapVal: number) => {
    const safeScrap = Math.min(100, Math.max(0, scrapVal));
    const safeYield = Number((100 - safeScrap).toFixed(2));
    const scrapQty = Math.round((state.batchSize * safeScrap) / 100);
    const finishedQty = Math.max(0, state.batchSize - scrapQty);
    onChange({
      scrapPct: safeScrap,
      yieldPct: safeYield,
      expectedFinishedQty: finishedQty,
      expectedScrapQty: scrapQty,
    });
  };

  const handleCycleTimeChange = (sec: number) => {
    const safeSec = Math.max(0, sec);
    const hours = Number(((state.batchSize * safeSec) / 3600).toFixed(2));
    onChange({
      standardCycleTimeSec: safeSec,
      estimatedProductionTimeHours: hours,
    });
  };

  const handleCreateNewLocation = (target: 'input' | 'wip' | 'fg' | 'secondary', prefillCode?: string) => {
    setLocationTypeToCreate(target);
    setNewLocationCode((prefillCode || '').trim().toUpperCase());
    setNewLocationWh(
      target === 'input'
        ? 'RM-WH-01'
        : target === 'wip'
        ? 'WIP-WH-01'
        : target === 'secondary'
        ? 'SEC-WH-01'
        : 'FG-WH-01'
    );
    setOpenDropdown(null);
    setIsNewLocationModalOpen(true);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationCode.trim()) return;

    const saved = masterDataGovernanceService.saveBin({
      code: newLocationCode.trim().toUpperCase(),
      warehouseCode: newLocationWh,
      zone:
        locationTypeToCreate === 'input'
          ? 'Raw Material Silo Zone'
          : locationTypeToCreate === 'wip'
          ? 'WIP Intermediate Buffer'
          : locationTypeToCreate === 'secondary'
          ? 'Secondary Staging Cell'
          : 'Finished Goods Racks',
    });

    if (locationTypeToCreate === 'input') onChange({ defaultInputLocation: saved.code });
    if (locationTypeToCreate === 'wip') onChange({ defaultWipLocation: saved.code });
    if (locationTypeToCreate === 'fg') onChange({ defaultFgLocation: saved.code });
    if (locationTypeToCreate === 'secondary') onChange({ defaultSecondaryLocation: saved.code });

    setBinList(masterDataGovernanceService.getBins());
    setIsNewLocationModalOpen(false);
  };

  // Autocomplete helper component
  const renderLocationPicker = (
    label: string,
    value: string,
    fieldKey: 'defaultInputLocation' | 'defaultWipLocation' | 'defaultFgLocation' | 'defaultSecondaryLocation',
    targetType: 'input' | 'wip' | 'fg' | 'secondary',
    placeholder: string
  ) => {
    const isOpen = openDropdown === targetType;
    const filteredBins = binList.filter(
      (b) =>
        !value ||
        (b.code || '').toLowerCase().includes(value.toLowerCase()) ||
        (b.warehouseCode || '').toLowerCase().includes(value.toLowerCase())
    );

    return (
      <div className="field mb-0 relative">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-[#14213D]">{label}</label>
          <button
            type="button"
            onClick={() => handleCreateNewLocation(targetType, value)}
            className="text-[10px] text-[#0F8B8D] hover:underline font-semibold flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" /> + New
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange({ [fieldKey]: e.target.value.toUpperCase() });
              setOpenDropdown(targetType);
            }}
            onFocus={() => setOpenDropdown(targetType)}
            placeholder={placeholder}
            className="w-full font-mono text-xs py-2 pl-3 pr-8 border border-[#E4E0D6] rounded-lg focus:border-[#0F8B8D] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setOpenDropdown(isOpen ? null : targetType)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden max-h-56 flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0F8B8D]" /> Master Storage Bins
              </span>
              <span>{filteredBins.length} locations</span>
            </div>

            <div className="overflow-y-auto divide-y divide-gray-100 max-h-36">
              {filteredBins.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onChange({ [fieldKey]: b.code });
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-teal-50/50 flex items-center justify-between group transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-xs text-gray-900 group-hover:text-[#0F8B8D]">
                      {b.code}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-2">
                      WH: {b.warehouseCode} ({b.zone})
                    </span>
                  </div>
                  <span className="text-[10px] text-[#0F8B8D] opacity-0 group-hover:opacity-100 font-bold">
                    Select &rarr;
                  </span>
                </button>
              ))}
            </div>

            <div className="p-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleCreateNewLocation(targetType, value)}
                className="text-[11px] text-[#0F8B8D] hover:underline font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {value ? `Register "${value}" to Master DB` : 'Create New Bin'}
              </button>
              <button
                type="button"
                onClick={() => setOpenDropdown(null)}
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="border-b border-[#E4E0D6] pb-2">
        <h3 className="text-sm font-bold text-[#14213D]">Batch Size, Tooling &amp; Cycle Time Reference</h3>
        <p className="text-xs text-gray-500">
          Define standard batch size, tooling shot weight balancing, and default staging warehouses.
        </p>
      </div>

      {/* Standard Batch Size & Yield Card */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-[#0F8B8D]" />
            Batch Size &amp; Yield Metrics
          </h4>
          <span className="text-[11px] font-mono text-[#0F8B8D] font-bold bg-[#DCF0EF] px-2 py-0.5 rounded">
            Target Batch: {state.batchSize.toLocaleString()} {state.batchUOM}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Batch Size Quantity */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              Batch Size Quantity <span className="text-rose-600">*</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                value={state.batchSize}
                onChange={(e) => handleBatchSizeChange(parseFloat(e.target.value) || 0)}
                className={`w-full font-mono font-bold text-xs py-2 px-3 border rounded-lg ${
                  errors.batchSize ? 'border-rose-500 bg-rose-50' : 'border-[#E4E0D6]'
                }`}
              />
              <select
                value={state.batchUOM}
                onChange={(e) => onChange({ batchUOM: e.target.value })}
                className="w-20 text-xs py-2 px-2 border border-[#E4E0D6] rounded-lg bg-gray-50 font-bold"
              >
                <option value="PCS">PCS</option>
                <option value="KG">KG</option>
                <option value="BOX">BOX</option>
                <option value="SET">SET</option>
                <option value="MTR">MTR</option>
              </select>
            </div>
            {errors.batchSize && <p className="text-[11px] text-rose-600 mt-1">{errors.batchSize}</p>}
          </div>

          {/* Expected Finished Quantity */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-emerald-800 block mb-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Expected Finished Good
            </label>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-base font-mono font-bold text-emerald-800">
                {state.expectedFinishedQty.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 ml-1 font-semibold">{state.batchUOM}</span>
            </div>
          </div>

          {/* Expected Scrap Quantity */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-rose-800 block mb-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              Expected Scrap Loss
            </label>
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
              <span className="text-base font-mono font-bold text-rose-800">
                {state.expectedScrapQty.toLocaleString()}
              </span>
              <span className="text-[10px] text-rose-600 ml-1 font-semibold">{state.batchUOM}</span>
            </div>
          </div>

          {/* Yield % / Scrap % Sliders */}
          <div className="field mb-0 space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-[#14213D]">Yield: {state.yieldPct}%</span>
              <span className="text-rose-600 font-bold">Scrap: {state.scrapPct}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="0.1"
              value={state.yieldPct}
              onChange={(e) => handleYieldChange(parseFloat(e.target.value) || 0)}
              className="w-full accent-[#0F8B8D] cursor-pointer"
            />
          </div>
        </div>

        {/* Cycle Time Selection & Estimated Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100 text-xs">
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Cycle Time Source</label>
            <select
              value={state.cycleTimeSource}
              onChange={(e) => onChange({ cycleTimeSource: e.target.value as any })}
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white"
            >
              <option value="Item Master">Item Master Standard ({state.parentItem?.code || 'Parent'})</option>
              <option value="Routing">Engineering Routing Step Average</option>
              <option value="Manual">Manual Override (Special Job Run)</option>
            </select>
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              Standard Cycle Time (Sec / Shot)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={state.standardCycleTimeSec || 14.5}
                onChange={(e) => handleCycleTimeChange(parseFloat(e.target.value) || 0)}
                className="w-full font-mono font-bold text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
              />
              <span className="absolute right-3 top-2 text-[10px] text-gray-400 font-bold">seconds</span>
            </div>
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              Estimated Batch Production Time
            </label>
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-900 font-mono font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-600" />
                {state.estimatedProductionTimeHours} hrs
              </div>
              <span className="text-[10px] text-amber-700">
                (~{(state.estimatedProductionTimeHours * 60).toFixed(0)} mins)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TASK 2: PART WEIGHT, MOLD CAVITIES, RUNNER WEIGHT & AUTO-CALCULATIONS     */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-2">
          <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-[#0F8B8D]" />
            Item Weight &amp; Tooling Shot Analysis (Auto-filled from Item Master)
          </h4>
          <span className="text-xs text-gray-500">Links part net weight with runner system and plastic consumption</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              Item Net Weight (Grams / Pc) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={state.itemNetWeightGrams || 45.2}
                onChange={(e) => {
                  const net = parseFloat(e.target.value) || 0;
                  const cav = state.moldCavities || 4;
                  const runner = state.runnerWeightGrams || 0;
                  const shot = Number(((net * cav) + runner).toFixed(2));
                  onChange({
                    itemNetWeightGrams: net,
                    totalShotWeightGrams: shot,
                    batchWeightKg: Number(((net * state.batchSize) / 1000).toFixed(2)),
                  });
                }}
                className="w-full font-mono font-bold text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
              />
              <span className="absolute right-3 top-2 text-[10px] text-gray-400 font-bold">grams</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">Finished molded part weight without gate</span>
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Mold Cavities Count</label>
            <input
              type="number"
              min="1"
              max="64"
              value={state.moldCavities || 4}
              onChange={(e) => {
                const cav = parseInt(e.target.value) || 1;
                const net = state.itemNetWeightGrams || 45.2;
                const runner = state.runnerWeightGrams || 0;
                const shot = Number(((net * cav) + runner).toFixed(2));
                onChange({
                  moldCavities: cav,
                  totalShotWeightGrams: shot,
                });
              }}
              className="w-full font-mono font-bold text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">Number of live active impressions</span>
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Cold Runner &amp; Sprue (Grams)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={state.runnerWeightGrams ?? 0}
                onChange={(e) => {
                  const runner = parseFloat(e.target.value) || 0;
                  const net = state.itemNetWeightGrams || 45.2;
                  const cav = state.moldCavities || 4;
                  const shot = Number(((net * cav) + runner).toFixed(2));
                  onChange({
                    runnerWeightGrams: runner,
                    totalShotWeightGrams: shot,
                  });
                }}
                className="w-full font-mono font-bold text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
              />
              <span className="absolute right-3 top-2 text-[10px] text-gray-400 font-bold">g/shot</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">Runner weight per shot cycle</span>
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Total Mold Shot Weight</label>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-base font-mono font-bold text-emerald-900">
                  {state.totalShotWeightGrams || Number((((state.itemNetWeightGrams || 45.2) * (state.moldCavities || 4)) + (state.runnerWeightGrams || 0)).toFixed(2))}
                </span>
                <span className="text-[10px] text-emerald-700 ml-1 font-bold">g/shot</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded font-medium">
                {state.moldCavities || 4} Parts + Runner
              </span>
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">Formula: (Part Wt &times; Cavities) + Runner</span>
          </div>
        </div>

        {/* Live Calculation KPI bar */}
        <div className="bg-[#FAF9F5] border border-[#E4E0D6] rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Hourly Shot Rate</span>
            <span className="font-mono font-bold text-[#14213D]">
              {state.standardCycleTimeSec > 0 ? (3600 / state.standardCycleTimeSec).toFixed(0) : 0} shots/hr
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Hourly Piece Output</span>
            <span className="font-mono font-bold text-emerald-700">
              {state.standardCycleTimeSec > 0 ? ((3600 / state.standardCycleTimeSec) * (state.moldCavities || 4)).toFixed(0) : 0} pcs/hr
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Plastic Throughput Rate</span>
            <span className="font-mono font-bold text-[#0F8B8D]">
              {state.standardCycleTimeSec > 0
                ? (((state.totalShotWeightGrams || 53.7) * (3600 / state.standardCycleTimeSec)) / 1000).toFixed(2)
                : 0}{' '}
              kg/hr
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Total Batch Net Resin</span>
            <span className="font-mono font-bold text-indigo-700">
              {(((state.itemNetWeightGrams || 45.2) * state.batchSize) / 1000).toFixed(2)} kg
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TASK 1: DEFAULT WAREHOUSES & BINS AUTOCOMPLETE + CREATE IN DB            */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-4">
        <div className="border-b border-[#E4E0D6] pb-2">
          <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#E8622C]" />
            Default Warehouse Staging Location Codes (Master Data Autocomplete)
          </h4>
          <p className="text-xs text-gray-500">
            Designate storage bins for raw material consumption, WIP buffer, finished goods receipt, and secondary staging.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {renderLocationPicker(
            'Input Raw Material Bin',
            state.defaultInputLocation,
            'defaultInputLocation',
            'input',
            'e.g. RM-SILO-01'
          )}

          {renderLocationPicker(
            'Default WIP Buffer Bin',
            state.defaultWipLocation,
            'defaultWipLocation',
            'wip',
            'e.g. WIP-STAGE-01'
          )}

          {renderLocationPicker(
            'Finished Goods Putaway',
            state.defaultFgLocation,
            'defaultFgLocation',
            'fg',
            'e.g. FG-WH1-B02'
          )}

          {renderLocationPicker(
            'Secondary Operation Bin',
            state.defaultSecondaryLocation,
            'defaultSecondaryLocation',
            'secondary',
            'e.g. SEC-AREA-01'
          )}
        </div>
      </div>

      {/* Formula Mode Fields (When Recipe BOM is active) */}
      {isFormulaMode && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-purple-200 pb-2">
            <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-purple-700" />
              Formula Recipe Balancing Controls
            </h4>
            <span className="text-xs text-purple-700 font-semibold">Active for Compounding / Recipes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="field mb-0">
              <label className="text-xs font-bold text-purple-950 block mb-1">Formula Batch Weight</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={state.batchWeightKg}
                  onChange={(e) => onChange({ batchWeightKg: parseFloat(e.target.value) || 0 })}
                  className="w-full font-mono font-bold text-xs py-2 px-3 border border-purple-200 rounded-lg bg-white"
                />
                <span className="font-bold text-purple-800 px-2">KG</span>
              </div>
            </div>

            <div className="field mb-0">
              <label className="text-xs font-bold text-purple-950 block mb-1">Total Formulation %</label>
              <div className="p-2 bg-white border border-purple-200 rounded-lg font-mono font-bold text-purple-900">
                {state.totalFormulaPct}%
              </div>
            </div>

            <div className="field mb-0 flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-950">
                <input
                  type="checkbox"
                  checked={state.autoBalanceResin}
                  onChange={(e) => onChange({ autoBalanceResin: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span>Auto-balance base polymer to 100%</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Task 1 Quick Creation Modal for New Warehouse / Bin */}
      {isNewLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0F8B8D]" />
                <h3 className="text-sm font-bold text-slate-800">
                  Register New Storage Location in Master DB
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Location Code *</label>
                <input
                  type="text"
                  required
                  value={newLocationCode}
                  onChange={(e) => setNewLocationCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RM-SILO-02 or WIP-BAY-03"
                  className="w-full font-mono text-xs px-3 py-2 border rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Warehouse *</label>
                <select
                  value={newLocationWh}
                  onChange={(e) => setNewLocationWh(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
                >
                  {warehouseList.map((wh) => (
                    <option key={wh.code} value={wh.code}>
                      {wh.code} &mdash; {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewLocationModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0D7779] text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Save to Master Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
