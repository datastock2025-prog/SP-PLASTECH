import React, { useState } from 'react';
import {
  Calculator,
  Layers,
  DollarSign,
  TrendingUp,
  FileText,
  Plus,
  RefreshCw,
  Download,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { mockAccounts } from '../../data/mockCrmData';

interface CrmInquiryCostingViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
}

export const CrmInquiryCostingView: React.FC<CrmInquiryCostingViewProps> = ({
  onNavigate,
  showToast,
}) => {
  // Costing Parameters
  const [selectedAccountId, setSelectedAccountId] = useState(mockAccounts[0].id);
  const [partName, setPartName] = useState('Automotive Door Trim Clip (PA66-GF30)');
  const [partWeightGrams, setPartWeightGrams] = useState<number>(45);
  const [runnerWeightGrams, setRunnerWeightGrams] = useState<number>(10);
  const [cavityCount, setCavityCount] = useState<number>(4);
  const [cycleTimeSec, setCycleTimeSec] = useState<number>(24);
  const [machineTonnage, setMachineTonnage] = useState<number>(250);
  const [machineHourlyRate, setMachineHourlyRate] = useState<number>(850); // ₹/hr
  const [resinCostPerKg, setResinCostPerKg] = useState<number>(240); // ₹/kg
  const [masterbatchDosagePct, setMasterbatchDosagePct] = useState<number>(2.5); // %
  const [masterbatchCostPerKg, setMasterbatchCostPerKg] = useState<number>(450); // ₹/kg
  const [regrindUsagePct, setRegrindUsagePct] = useState<number>(10); // %
  const [scrapAllowancePct, setScrapAllowancePct] = useState<number>(3.5); // %
  const [moldToolingCost, setMoldToolingCost] = useState<number>(1200000); // ₹
  const [plannedBatchQty, setPlannedBatchQty] = useState<number>(100000); // units
  const [packagingCostPerUnit, setPackagingCostPerUnit] = useState<number>(1.2); // ₹
  const [freightCostPerUnit, setFreightCostPerUnit] = useState<number>(0.8); // ₹
  const [targetMarkupPct, setTargetMarkupPct] = useState<number>(25); // %

  // Calculations
  const shotWeightGrams = partWeightGrams * cavityCount + runnerWeightGrams;
  const effectivePartWeightWithRunner = (partWeightGrams + runnerWeightGrams / cavityCount) * (1 + scrapAllowancePct / 100);
  
  // Material Cost per unit
  const virginWeightKg = (effectivePartWeightWithRunner * (100 - regrindUsagePct) / 100) / 1000;
  const masterbatchWeightKg = (effectivePartWeightWithRunner * (masterbatchDosagePct / 100)) / 1000;
  const rawMaterialCost = (virginWeightKg * resinCostPerKg) + (masterbatchWeightKg * masterbatchCostPerKg);

  // Machine Conversion Cost per unit
  const shotsPerHour = 3600 / cycleTimeSec;
  const partsPerHour = shotsPerHour * cavityCount;
  const conversionCostPerUnit = machineHourlyRate / partsPerHour;

  // Tooling Amortization
  const toolingAmortizationPerUnit = plannedBatchQty > 0 ? moldToolingCost / plannedBatchQty : 0;

  // Total Direct Manufacturing Cost
  const totalMfgCost = rawMaterialCost + conversionCostPerUnit + toolingAmortizationPerUnit + packagingCostPerUnit + freightCostPerUnit;

  // Final Price & Margin
  const quotedPricePerUnit = totalMfgCost / (1 - targetMarkupPct / 100);
  const profitMarginPerUnit = quotedPricePerUnit - totalMfgCost;
  const totalOrderValue = quotedPricePerUnit * plannedBatchQty;

  const handleGenerateQuote = () => {
    showToast(`Quotation draft generated for ${partName} at ₹${quotedPricePerUnit.toFixed(2)} / unit`);
    onNavigate('crmQuotationManagement');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Technical Cost Engineering
            </span>
            <span className="text-xs text-slate-500">Injection & Extrusion Estimation Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Inquiry Costing & Margin Modeler</h1>
          <p className="text-sm text-slate-600">
            Calculate precise part pricing considering polymer formulation, mold cavitation, machine tonnage rate, and scrap allowance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => showToast('Exported detailed costing sheet PDF')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            <Download className="w-4 h-4" />
            Export Sheet
          </button>
          <button
            onClick={handleGenerateQuote}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <FileText className="w-4 h-4" />
            Generate Quotation
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Cost Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Customer & Part Identification */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              1. Customer & Component Specs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Customer</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  {mockAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plastic Part Name / Drawing No</label>
                <input
                  type="text"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Net Part Weight (grams)</label>
                <input
                  type="number"
                  value={partWeightGrams}
                  onChange={(e) => setPartWeightGrams(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cold Runner Weight (grams)</label>
                <input
                  type="number"
                  value={runnerWeightGrams}
                  onChange={(e) => setRunnerWeightGrams(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Material & Compounding Formulation */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              2. Polymer & Additive Formulation
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Base Resin Price (₹/kg)</label>
                <input
                  type="number"
                  value={resinCostPerKg}
                  onChange={(e) => setResinCostPerKg(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Masterbatch Dosage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={masterbatchDosagePct}
                  onChange={(e) => setMasterbatchDosagePct(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Masterbatch Cost (₹/kg)</label>
                <input
                  type="number"
                  value={masterbatchCostPerKg}
                  onChange={(e) => setMasterbatchCostPerKg(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Regrind Re-use (%)</label>
                <input
                  type="number"
                  value={regrindUsagePct}
                  onChange={(e) => setRegrindUsagePct(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scrap & Purge Allowance (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={scrapAllowancePct}
                  onChange={(e) => setScrapAllowancePct(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Machine & Tooling Parameters */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-teal-600" />
              3. Tooling, Machine & Amortization
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mold Cavity Count</label>
                <input
                  type="number"
                  value={cavityCount}
                  onChange={(e) => setCavityCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Injection Cycle Time (sec)</label>
                <input
                  type="number"
                  value={cycleTimeSec}
                  onChange={(e) => setCycleTimeSec(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Machine Rate (₹/hour)</label>
                <input
                  type="number"
                  value={machineHourlyRate}
                  onChange={(e) => setMachineHourlyRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mold Tooling Cost (₹)</label>
                <input
                  type="number"
                  value={moldToolingCost}
                  onChange={(e) => setMoldToolingCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Planned Production (units)</label>
                <input
                  type="number"
                  value={plannedBatchQty}
                  onChange={(e) => setPlannedBatchQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Profit Markup (%)</label>
                <input
                  type="number"
                  value={targetMarkupPct}
                  onChange={(e) => setTargetMarkupPct(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Cost Breakdown & Pricing Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-xl border border-teal-200 shadow-sm space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Unit Cost Output</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-black text-slate-900">₹{quotedPricePerUnit.toFixed(2)}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {targetMarkupPct}% Gross Margin
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Total Order: <strong>₹{(totalOrderValue / 100000).toFixed(2)} Lakhs</strong> for {plannedBatchQty.toLocaleString()} units
              </div>
            </div>

            {/* Cost Component Breakdown */}
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 uppercase text-[11px] text-slate-500">Component Unit Breakdown</h3>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-800">Raw Material & Polymer Cost</div>
                  <div className="text-[10px] text-slate-500">
                    {(effectivePartWeightWithRunner).toFixed(1)}g @ ₹{resinCostPerKg}/kg
                  </div>
                </div>
                <span className="font-bold text-slate-900">₹{rawMaterialCost.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-800">Machine Conversion Cost</div>
                  <div className="text-[10px] text-slate-500">
                    {partsPerHour.toFixed(0)} parts/hr @ ₹{machineHourlyRate}/hr
                  </div>
                </div>
                <span className="font-bold text-slate-900">₹{conversionCostPerUnit.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-800">Mold Tooling Amortization</div>
                  <div className="text-[10px] text-slate-500">
                    ₹{(moldToolingCost / 100000).toFixed(1)}L over {plannedBatchQty.toLocaleString()} units
                  </div>
                </div>
                <span className="font-bold text-slate-900">₹{toolingAmortizationPerUnit.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-800">Packaging & Logistics</div>
                  <div className="text-[10px] text-slate-500">Corrugated boxes + pallet wrap + local freight</div>
                </div>
                <span className="font-bold text-slate-900">₹{(packagingCostPerUnit + freightCostPerUnit).toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-700">
                <span className="font-bold">Total Unit Mfg Cost:</span>
                <span className="font-bold text-slate-900">₹{totalMfgCost.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-emerald-700 font-bold bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                <span>Profit Margin / Unit:</span>
                <span>+ ₹{profitMarginPerUnit.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleGenerateQuote}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Transfer to Quotation Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
