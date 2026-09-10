import React, { useState } from 'react';
import { ManufacturingBomWizardState } from './types';
import {
  DollarSign,
  TrendingDown,
  RefreshCw,
  Zap,
  Cpu,
  Users,
  Package,
  Wrench,
  Sparkles,
  Info,
  CheckCircle2,
  Sliders,
  Calculator,
  PieChart,
} from 'lucide-react';

interface Step7Props {
  state: ManufacturingBomWizardState;
  onChange: (patch: Partial<ManufacturingBomWizardState>) => void;
  showToast: (msg: string) => void;
}

export const Step7ScrapCost: React.FC<Step7Props> = ({ state, onChange, showToast }) => {
  const { scrapConfig, costRollup, components, secondaryOperations, routingResources, batchSize } = state;
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Recalculate cost rollup engine
  const handleRunCostPreview = () => {
    setIsCalculating(true);

    setTimeout(() => {
      // 1. Material cost
      const rawMatCost = components
        .filter((c) => c.category !== 'Packaging')
        .reduce((sum, c) => sum + (c.cost || 32.5) * c.qty * (1 + (c.scrap || 1.5) / 100), 0);

      // 2. Packaging cost
      const packCost = components
        .filter((c) => c.category === 'Packaging')
        .reduce((sum, c) => sum + (c.cost || 5.0) * c.qty, 0);

      // 3. Secondary Op cost
      const secCost = secondaryOperations.reduce(
        (sum, op) => sum + (op.standardTimeMin / 60) * state.laborRatePerHour,
        0
      );

      // 4. Labor cost from routing
      const totalLaborHours = routingResources.reduce(
        (sum, r) => sum + (r.cycleTimeSec / 3600) * r.crewSize,
        0
      );
      const laborCost = totalLaborHours * state.laborRatePerHour;

      // 5. Machine overhead from routing
      const totalMachineHours = routingResources.reduce((sum, r) => sum + r.cycleTimeSec / 3600, 0);
      const machineCost = totalMachineHours * state.machineRatePerHour;

      // 6. Mold amortization ($1.25 standard)
      const moldAmort = 1.25;

      // 7. Energy cost (approx $1.80 per unit for plastic cooling/heating)
      const energyCost = 1.8;

      // 8. Scrap cost
      const scrapCost = rawMatCost * (state.scrapPct / 100);

      // 9. Regrind credit (savings if regrind allowed)
      const regrindSavings = scrapConfig.regridRecoveryAllowed
        ? -(rawMatCost * (scrapConfig.maxRegrindPct / 100) * 0.4)
        : 0;

      // Total unit cost
      const totalCostPerUnit = Number(
        (
          rawMatCost +
          packCost +
          secCost +
          laborCost +
          machineCost +
          moldAmort +
          energyCost +
          scrapCost +
          regrindSavings
        ).toFixed(2)
      );

      const totalBatchCost = Number((totalCostPerUnit * batchSize).toFixed(2));
      const costPerKg = Number((totalCostPerUnit / 0.05).toFixed(2)); // assuming standard 50g weight

      onChange({
        costPreviewRan: true,
        costRollup: {
          materialCost: Number(rawMatCost.toFixed(2)),
          packagingCost: Number(packCost.toFixed(2)),
          secondaryOpCost: Number(secCost.toFixed(2)),
          laborCost: Number(laborCost.toFixed(2)),
          machineCost: Number(machineCost.toFixed(2)),
          moldAmortization: moldAmort,
          energyCost: energyCost,
          scrapCost: Number(scrapCost.toFixed(2)),
          regrindCredit: Number(regrindSavings.toFixed(2)),
          totalCost: totalBatchCost,
          costPerUnit: totalCostPerUnit,
          costPerBatch: totalBatchCost,
          costPerKg: costPerKg,
        },
      });

      setIsCalculating(false);
      showToast('Live cost rollup recalculated successfully');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="border-b border-[#E4E0D6] pb-2">
        <h3 className="text-sm font-bold text-[#14213D]">Scrap, Regrind Recovery &amp; Cost Rollup</h3>
        <p className="text-xs text-gray-500">
          Configure start-up purge waste, runner regrind recovery credits, and run a live cost simulation.
        </p>
      </div>

      {/* Section 1: Scrap & Regrind Recovery Configuration */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-2">
          <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            Scrap Categories &amp; Regrind Recovery Parameters
          </h4>
          <span className="text-xs text-gray-500">Plastic Closed-Loop Material Cycle</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Start-up Scrap (KG / Run)</label>
            <input
              type="number"
              value={scrapConfig.startupScrapKg}
              onChange={(e) =>
                onChange({
                  scrapConfig: { ...scrapConfig, startupScrapKg: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full text-xs font-mono font-bold py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Purge Material (KG / Changeover)</label>
            <input
              type="number"
              value={scrapConfig.purgingMaterialKg}
              onChange={(e) =>
                onChange({
                  scrapConfig: { ...scrapConfig, purgingMaterialKg: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full text-xs font-mono font-bold py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Runner Scrap Category</label>
            <input
              type="text"
              value={scrapConfig.runnerScrapCategory}
              onChange={(e) =>
                onChange({
                  scrapConfig: { ...scrapConfig, runnerScrapCategory: e.target.value },
                })
              }
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>

          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Purge Lumps Category</label>
            <input
              type="text"
              value={scrapConfig.lumbesScrapCategory}
              onChange={(e) =>
                onChange({
                  scrapConfig: { ...scrapConfig, lumbesScrapCategory: e.target.value },
                })
              }
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>
        </div>

        {/* Regrind Slider & Permissions */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={scrapConfig.regridRecoveryAllowed}
                onChange={(e) =>
                  onChange({
                    scrapConfig: { ...scrapConfig, regridRecoveryAllowed: e.target.checked },
                  })
                }
                className="rounded text-emerald-600"
              />
              <span className="font-bold text-emerald-950">
                Allow Closed-Loop Regrind Material Recovery &amp; Cost Credit
              </span>
            </label>

            {scrapConfig.regridRecoveryAllowed && (
              <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                Max Allowed: {scrapConfig.maxRegrindPct}%
              </span>
            )}
          </div>

          {scrapConfig.regridRecoveryAllowed && (
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={scrapConfig.maxRegrindPct}
                onChange={(e) =>
                  onChange({
                    scrapConfig: { ...scrapConfig, maxRegrindPct: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-emerald-800">
                <span>0% Virgin Only</span>
                <span>FDA / IATF Food Grade Recommended Cap: 15%</span>
                <span>30% Heavy Industrial Max</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Full-width Interactive Cost Preview Card */}
      <div className="bg-[#14213D] text-white rounded-2xl p-6 shadow-xl border border-[#26365C] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E8622C] flex items-center justify-center text-white">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base font-bold tracking-tight text-white font-['Space_Grotesk']">
                  BOM Cost Simulation &amp; Rollup Preview
                </h4>
                <p className="text-xs text-slate-300">
                  Calculates unit, batch, and KG standard manufacturing cost using active resin pricing &amp; machine rates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={state.materialPriceSource}
              onChange={(e) => onChange({ materialPriceSource: e.target.value as any })}
              className="bg-white/10 text-white border border-white/20 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value="Standard price" className="text-gray-900">Standard Cost Base</option>
              <option value="Latest purchase price" className="text-gray-900">Latest Purchase PO Price</option>
              <option value="Average price" className="text-gray-900">Weighted Average Inventory</option>
              <option value="Supplier price list" className="text-gray-900">Supplier Contract Price</option>
            </select>

            <button
              type="button"
              onClick={handleRunCostPreview}
              disabled={isCalculating}
              className="btn btn-sm bg-[#E8622C] hover:bg-[#d45320] text-white border-none text-xs flex items-center gap-1.5 shadow-md"
            >
              <Calculator className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
              {isCalculating ? 'Calculating...' : 'Run Cost Preview'}
            </button>
          </div>
        </div>

        {/* Big 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
              Estimated Cost Per Unit
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">
              ${costRollup.costPerUnit.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-400 mt-1 block">
              Includes resin, machine overhead, mold &amp; scrap
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
              Total Standard Batch Cost
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300 mt-1">
              ${costRollup.costPerBatch.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-300 mt-1 block">
              Per {batchSize.toLocaleString()} {state.batchUOM} batch size
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
              Net Regrind Recovery Saving
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 mt-1">
              {costRollup.regrindCredit < 0 ? `-$${Math.abs(costRollup.regrindCredit).toFixed(2)}` : '$0.00'}
            </div>
            <span className="text-[11px] text-slate-300 mt-1 block">
              Deducted per unit via closed-loop runner reuse
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Raw Resin</span>
            <span className="font-mono font-bold text-white">${costRollup.materialCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Packaging</span>
            <span className="font-mono font-bold text-white">${costRollup.packagingCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Secondary Op</span>
            <span className="font-mono font-bold text-white">${costRollup.secondaryOpCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Direct Labor</span>
            <span className="font-mono font-bold text-white">${costRollup.laborCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Machine Rate</span>
            <span className="font-mono font-bold text-white">${costRollup.machineCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Mold Amort</span>
            <span className="font-mono font-bold text-white">${costRollup.moldAmortization}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Power / Energy</span>
            <span className="font-mono font-bold text-white">${costRollup.energyCost}</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
            <span className="text-slate-400 text-[10px] block">Scrap Loss</span>
            <span className="font-mono font-bold text-rose-300">${costRollup.scrapCost}</span>
          </div>
        </div>

        {/* Cost Disclaimer */}
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Cost Disclaimer:</strong> Estimated cost is for preview. Final standard cost may require finance approval during month-end rollup.
          </span>
        </div>
      </div>
    </div>
  );
};
