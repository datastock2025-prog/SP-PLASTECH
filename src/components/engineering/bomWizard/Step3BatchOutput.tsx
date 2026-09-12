import React from 'react';
import { ManufacturingBomWizardState } from './types';
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
} from 'lucide-react';

interface Step3Props {
  state: ManufacturingBomWizardState;
  onChange: (patch: Partial<ManufacturingBomWizardState>) => void;
  errors: Record<string, string>;
}

export const Step3BatchOutput: React.FC<Step3Props> = ({ state, onChange, errors }) => {
  const isFormulaMode = state.mfgCategory === 'Formula / Recipe BOM';

  // Handler for batch size update with auto-calculation of finished & scrap
  const handleBatchSizeChange = (val: number) => {
    const safeVal = isNaN(val) || val < 0 ? 0 : val;
    const scrapQty = Math.round((safeVal * state.scrapPct) / 100);
    const finishedQty = Math.max(0, safeVal - scrapQty);
    const hours = Number(((safeVal * state.standardCycleTimeSec) / 3600).toFixed(2));
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="border-b border-[#E4E0D6] pb-2">
        <h3 className="text-sm font-bold text-[#14213D]">Batch Size, Yield &amp; Cycle Time Reference</h3>
        <p className="text-xs text-gray-500">
          Define the standard batch size and expected output. This helps production planning and costing.
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
              <span className="font-bold text-rose-600">Scrap: {state.scrapPct}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="0.1"
              value={state.yieldPct}
              onChange={(e) => handleYieldChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span>Standard Yield Target</span>
              <span>Scrap Allowance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Time Reference */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-2">
          <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-amber-600" />
            Cycle Time Reference &amp; Capacity Impact
          </h4>
          <span className="text-xs text-gray-500">Auto-calculates required production run hours</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Cycle Time Source</label>
            <select
              value={state.cycleTimeSource}
              onChange={(e) => onChange({ cycleTimeSource: e.target.value as any })}
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white"
            >
              <option value="Item Master">Item Master Study (Prefilled standard)</option>
              <option value="Machine/Mold Specific">Machine/Mold Specific Profile</option>
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
                value={state.standardCycleTimeSec}
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

      {/* Part Weight & Shot Metrics */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-2">
          <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-[#0F8B8D]" />
            Item Weight &amp; Tooling Shot Analysis
          </h4>
          <span className="text-xs text-gray-500">Links part net weight with runner system and polymer consumption</span>
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
                  const runner = state.runnerWeightGrams || 8.5;
                  const shot = Number((net * cav + runner).toFixed(1));
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
                const runner = state.runnerWeightGrams || 8.5;
                const shot = Number((net * cav + runner).toFixed(1));
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
                value={state.runnerWeightGrams || 8.5}
                onChange={(e) => {
                  const runner = parseFloat(e.target.value) || 0;
                  const net = state.itemNetWeightGrams || 45.2;
                  const cav = state.moldCavities || 4;
                  const shot = Number((net * cav + runner).toFixed(1));
                  onChange({
                    runnerWeightGrams: runner,
                    totalShotWeightGrams: shot,
                  });
                }}
                className="w-full font-mono font-bold text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
              />
              <span className="absolute right-3 top-2 text-[10px] text-gray-400 font-bold">g/shot</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">Recyclable regrind runner per cycle</span>
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Total Shot Weight</label>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-base font-mono font-bold text-emerald-900">
                  {(state.totalShotWeightGrams || ((state.itemNetWeightGrams || 45.2) * (state.moldCavities || 4) + (state.runnerWeightGrams || 8.5))).toFixed(1)}
                </span>
                <span className="text-[10px] text-emerald-700 ml-1 font-bold">g/shot</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded font-medium">
                {state.moldCavities || 4} Parts + Runner
              </span>
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">Barrel plasticizing dosage per cycle</span>
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

      {/* Warehouse Default Staging Locations */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-4">
        <div className="border-b border-[#E4E0D6] pb-2">
          <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#E8622C]" />
            Default Warehouse Staging Location Codes
          </h4>
          <p className="text-xs text-gray-500">
            Designate storage bins for material consumption, WIP buffer, and finished goods receipt.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Input Raw Material Bin</label>
            <input
              type="text"
              value={state.defaultInputLocation}
              onChange={(e) => onChange({ defaultInputLocation: e.target.value })}
              placeholder="e.g. RM-SILO-01"
              className="w-full font-mono text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Default WIP Buffer Bin</label>
            <input
              type="text"
              value={state.defaultWipLocation}
              onChange={(e) => onChange({ defaultWipLocation: e.target.value })}
              placeholder="e.g. WIP-STAGE-01"
              className="w-full font-mono text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Finished Goods Putaway</label>
            <input
              type="text"
              value={state.defaultFgLocation}
              onChange={(e) => onChange({ defaultFgLocation: e.target.value })}
              placeholder="e.g. FG-WH1-B02"
              className="w-full font-mono text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Secondary Operation Bin</label>
            <input
              type="text"
              value={state.defaultSecondaryLocation}
              onChange={(e) => onChange({ defaultSecondaryLocation: e.target.value })}
              placeholder="e.g. SEC-AREA-01"
              className="w-full font-mono text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>
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
                  className="w-full font-mono font-bold text-xs py-2 px-3 border border-purple-300 rounded-lg bg-white"
                />
                <select
                  value={state.batchWeightUOM}
                  onChange={(e) => onChange({ batchWeightUOM: e.target.value })}
                  className="w-20 text-xs py-2 px-2 border border-purple-300 rounded-lg bg-white font-bold"
                >
                  <option value="KG">KG</option>
                  <option value="LBS">LBS</option>
                  <option value="TON">TON</option>
                </select>
              </div>
            </div>

            <div className="field mb-0 sm:col-span-2">
              <label className="text-xs font-bold text-purple-950 block mb-1">
                Base Resin Auto-Balance
              </label>
              <div className="p-2.5 bg-white border border-purple-200 rounded-lg flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Automatically adjust primary virgin polymer percentage to guarantee 100% recipe balance.
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ autoBalanceResin: !state.autoBalanceResin })}
                  className={`text-xs px-3 py-1 rounded font-bold transition-colors ${
                    state.autoBalanceResin
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {state.autoBalanceResin ? 'Auto-Balance ON' : 'Manual'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
