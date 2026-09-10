import React, { useState } from 'react';
import { Item, CostRollup } from '../../types';
import {
  Sliders,
  Calculator,
  Layers,
  TrendingUp,
  Percent,
  RefreshCw,
  Zap,
  Cpu,
  Package,
  Clock,
  ArrowRight,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

interface Props {
  items?: Item[];
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const ProductCostingView: React.FC<Props> = ({
  items = [],
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('FG-CTN-500');

  // Simulation Parameters for real-time cost calculation
  const [resinPricePerKg, setResinPricePerKg] = useState<number>(78.0);
  const [partWeightGrams, setPartWeightGrams] = useState<number>(45.0);
  const [cycleTimeSeconds, setCycleTimeSeconds] = useState<number>(16.0);
  const [moldCavities, setMoldCavities] = useState<number>(4);
  const [machineHourRate, setMachineHourRate] = useState<number>(450.0);
  const [sellingPrice, setSellingPrice] = useState<number>(9.5);
  const [moldCost, setMoldCost] = useState<number>(350000);
  const [moldLifeShots, setMoldLifeShots] = useState<number>(200000);

  // Calculations
  // 1. Material cost per unit (part weight in kg * resin price * (1 + 2.5% scrap))
  const scrapFactor = 1.025;
  const matCostPerUnit = (partWeightGrams / 1000) * resinPricePerKg * scrapFactor;

  // 2. Machine & Overhead cost per unit
  // Shots per hour = 3600 / cycleTime
  // Parts per hour = (3600 / cycleTime) * moldCavities
  const partsPerHour = (3600 / cycleTimeSeconds) * moldCavities;
  const machineCostPerUnit = machineHourRate / partsPerHour;

  // 3. Direct Labor cost per unit (assuming ₹120/hr operator cost)
  const laborCostPerHour = 135;
  const laborCostPerUnit = laborCostPerHour / partsPerHour;

  // 4. Tooling Amortization per unit (Mold cost / (mold life shots * cavities))
  const moldAmortizationPerUnit = moldCost / (moldLifeShots * moldCavities);

  // Total Standard Unit Cost
  const totalCostPerUnit = matCostPerUnit + machineCostPerUnit + laborCostPerUnit + moldAmortizationPerUnit;
  const grossProfitPerUnit = sellingPrice - totalCostPerUnit;
  const marginPct = (grossProfitPerUnit / sellingPrice) * 100;

  const handleProductSelect = (code: string) => {
    setSelectedProduct(code);
    if (code === 'FG-CTN-500') {
      setResinPricePerKg(78.0);
      setPartWeightGrams(45.0);
      setCycleTimeSeconds(16.0);
      setMoldCavities(4);
      setSellingPrice(9.5);
    } else if (code === 'FG-BKT-010') {
      setResinPricePerKg(82.0);
      setPartWeightGrams(380.0);
      setCycleTimeSeconds(28.0);
      setMoldCavities(1);
      setSellingPrice(48.0);
    } else if (code === 'FG-PET-030') {
      setResinPricePerKg(92.0);
      setPartWeightGrams(18.5);
      setCycleTimeSeconds(9.5);
      setMoldCavities(16);
      setSellingPrice(2.6);
    } else if (code === 'FG-CAP-028') {
      setResinPricePerKg(84.0);
      setPartWeightGrams(3.2);
      setCycleTimeSeconds(7.0);
      setMoldCavities(24);
      setSellingPrice(1.2);
    }
  };

  const handleSaveStandardCost = () => {
    showToast(`Standard Cost for ${selectedProduct} updated to ₹${totalCostPerUnit.toFixed(3)}/unit in General Ledger & BOM.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Finance &middot; Standard Costing &amp; BOM Rollup
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Product Costing &amp; Profitability Engine
          </h1>
          <p className="text-xs text-[#6B7280]">
            Multi-element BOM cost absorption: polymer resin scrap allowance, cycle time machine rates, and mold amortization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveStandardCost}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C] flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Save Standard Cost Sheet
          </button>
        </div>
      </div>

      {/* Product Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { code: 'FG-CTN-500', name: 'Plastic Container 500ml', type: 'PP Injection' },
          { code: 'FG-BKT-010', name: 'Household Bucket 10L', type: 'HDPE Injection' },
          { code: 'FG-PET-030', name: 'PET Bottle Preform', type: 'PET Injection' },
          { code: 'FG-CAP-028', name: 'Flip-top Cap 28mm', type: 'PP Closure' },
        ].map((prod) => (
          <button
            key={prod.code}
            onClick={() => handleProductSelect(prod.code)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedProduct === prod.code
                ? 'bg-white border-[#0F8B8D] ring-2 ring-[#0F8B8D]/20 shadow-sm'
                : 'bg-white border-[#E4E0D6] hover:border-[#0F8B8D]/50'
            }`}
          >
            <div className="font-mono text-[11px] font-bold text-[#0F8B8D]">{prod.code}</div>
            <div className="text-xs font-bold text-[#14213D] mt-0.5">{prod.name}</div>
            <div className="text-[10px] text-[#6B7280]">{prod.type}</div>
          </button>
        ))}
      </div>

      {/* Main Grid: Parameters & Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Costing Engine Parameters */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-4 space-y-4">
          <div className="border-b border-[#E4E0D6] pb-3">
            <h2 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk'] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0F8B8D]" /> Costing Parameters
            </h2>
            <p className="text-[11px] text-[#6B7280]">Adjust variables to simulate cost &amp; gross margin impact.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-[#14213D] mb-1">
                <span>Polymer Resin Price:</span>
                <span className="font-mono text-[#0F8B8D]">₹{resinPricePerKg.toFixed(1)} / KG</span>
              </div>
              <input
                type="range"
                min="60"
                max="140"
                step="0.5"
                value={resinPricePerKg}
                onChange={(e) => setResinPricePerKg(parseFloat(e.target.value))}
                className="w-full accent-[#0F8B8D]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-[#14213D] mb-1">
                <span>Shot Weight (per part):</span>
                <span className="font-mono">{partWeightGrams} grams</span>
              </div>
              <input
                type="number"
                value={partWeightGrams}
                onChange={(e) => setPartWeightGrams(parseFloat(e.target.value) || 1)}
                className="w-full p-1.5 border border-[#E4E0D6] rounded font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#6B7280] font-semibold mb-1">Cycle Time (sec)</label>
                <input
                  type="number"
                  value={cycleTimeSeconds}
                  onChange={(e) => setCycleTimeSeconds(parseFloat(e.target.value) || 1)}
                  className="w-full p-1.5 border border-[#E4E0D6] rounded font-mono"
                />
              </div>
              <div>
                <label className="block text-[#6B7280] font-semibold mb-1">Mold Cavities</label>
                <input
                  type="number"
                  value={moldCavities}
                  onChange={(e) => setMoldCavities(parseInt(e.target.value) || 1)}
                  className="w-full p-1.5 border border-[#E4E0D6] rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#6B7280] font-semibold mb-1">Machine Rate (₹ / Hour)</label>
              <input
                type="number"
                value={machineHourRate}
                onChange={(e) => setMachineHourRate(parseFloat(e.target.value) || 0)}
                className="w-full p-1.5 border border-[#E4E0D6] rounded font-mono"
              />
            </div>

            <div>
              <label className="block text-[#6B7280] font-semibold mb-1">Target Selling Price (₹ / Unit)</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full p-1.5 border border-[#E4E0D6] rounded font-mono font-bold text-emerald-700"
              />
            </div>
          </div>
        </div>

        {/* Cost Rollup Breakdown Table & Margin */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E0D6] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk']">
                BOM Cost Rollup: {selectedProduct}
              </h2>
              <p className="text-[11px] text-[#6B7280]">
                Output Throughput: <b>{Math.round(partsPerHour)} parts/hr</b> ({Math.round(3600 / cycleTimeSeconds)} shots/hr)
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#6B7280]">Gross Margin</div>
              <div className={`text-xl font-bold font-mono ${marginPct >= 25 ? 'text-emerald-600' : 'text-[#E8622C]'}`}>
                {marginPct.toFixed(1)}% (₹{grossProfitPerUnit.toFixed(2)}/unit)
              </div>
            </div>
          </div>

          {/* Elements Breakdown Table */}
          <div className="border border-[#E4E0D6] rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F6F4EF] text-[10px] uppercase text-[#6B7280]">
                <tr>
                  <th className="p-2.5">Cost Element</th>
                  <th className="p-2.5">Basis / Consumption</th>
                  <th className="p-2.5 text-right">Unit Cost (₹)</th>
                  <th className="p-2.5 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                <tr>
                  <td className="p-2.5 font-semibold text-[#14213D] flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-[#0F8B8D]" /> Direct Polymer Material
                  </td>
                  <td className="p-2.5 text-[#6B7280]">
                    {partWeightGrams}g @ ₹{resinPricePerKg}/kg + 2.5% scrap
                  </td>
                  <td className="p-2.5 font-mono font-bold text-right text-[#14213D]">
                    ₹{matCostPerUnit.toFixed(3)}
                  </td>
                  <td className="p-2.5 font-mono text-right text-[#6B7280]">
                    {((matCostPerUnit / totalCostPerUnit) * 100).toFixed(1)}%
                  </td>
                </tr>

                <tr>
                  <td className="p-2.5 font-semibold text-[#14213D] flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Machine Overhead &amp; Energy
                  </td>
                  <td className="p-2.5 text-[#6B7280]">
                    ₹{machineHourRate}/hr &divide; {Math.round(partsPerHour)} pcs/hr
                  </td>
                  <td className="p-2.5 font-mono font-bold text-right text-[#14213D]">
                    ₹{machineCostPerUnit.toFixed(3)}
                  </td>
                  <td className="p-2.5 font-mono text-right text-[#6B7280]">
                    {((machineCostPerUnit / totalCostPerUnit) * 100).toFixed(1)}%
                  </td>
                </tr>

                <tr>
                  <td className="p-2.5 font-semibold text-[#14213D] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> Direct Labor
                  </td>
                  <td className="p-2.5 text-[#6B7280]">
                    ₹{laborCostPerHour}/hr &divide; {Math.round(partsPerHour)} pcs/hr
                  </td>
                  <td className="p-2.5 font-mono font-bold text-right text-[#14213D]">
                    ₹{laborCostPerUnit.toFixed(3)}
                  </td>
                  <td className="p-2.5 font-mono text-right text-[#6B7280]">
                    {((laborCostPerUnit / totalCostPerUnit) * 100).toFixed(1)}%
                  </td>
                </tr>

                <tr>
                  <td className="p-2.5 font-semibold text-[#14213D] flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-purple-500" /> Mold Tooling Amortization
                  </td>
                  <td className="p-2.5 text-[#6B7280]">
                    ₹{(moldCost / 100000).toFixed(1)}L mold &divide; {moldLifeShots.toLocaleString()} shots ({moldCavities} cav)
                  </td>
                  <td className="p-2.5 font-mono font-bold text-right text-[#14213D]">
                    ₹{moldAmortizationPerUnit.toFixed(3)}
                  </td>
                  <td className="p-2.5 font-mono text-right text-[#6B7280]">
                    {((moldAmortizationPerUnit / totalCostPerUnit) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-[#F6F4EF] font-mono font-bold border-t border-[#E4E0D6]">
                <tr>
                  <td colSpan={2} className="p-2.5 text-right text-[#14213D]">Total Standard Unit Cost:</td>
                  <td className="p-2.5 font-mono text-right text-base text-[#0F8B8D]">
                    ₹{totalCostPerUnit.toFixed(3)}
                  </td>
                  <td className="p-2.5 text-right">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Visual Breakdown Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-[#6B7280]">
              <span>Cost Component Allocation:</span>
              <span className="font-mono">Materials ({((matCostPerUnit / totalCostPerUnit) * 100).toFixed(0)}%) &middot; Machine ({((machineCostPerUnit / totalCostPerUnit) * 100).toFixed(0)}%) &middot; Labor ({((laborCostPerUnit / totalCostPerUnit) * 100).toFixed(0)}%) &middot; Tooling ({((moldAmortizationPerUnit / totalCostPerUnit) * 100).toFixed(0)}%)</span>
            </div>
            <div className="h-3 w-full bg-[#E4E0D6] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(matCostPerUnit / totalCostPerUnit) * 100}%` }}
                className="bg-[#0F8B8D] h-full"
                title="Material"
              />
              <div
                style={{ width: `${(machineCostPerUnit / totalCostPerUnit) * 100}%` }}
                className="bg-amber-500 h-full"
                title="Machine"
              />
              <div
                style={{ width: `${(laborCostPerUnit / totalCostPerUnit) * 100}%` }}
                className="bg-blue-500 h-full"
                title="Labor"
              />
              <div
                style={{ width: `${(moldAmortizationPerUnit / totalCostPerUnit) * 100}%` }}
                className="bg-purple-500 h-full"
                title="Mold Amortization"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
