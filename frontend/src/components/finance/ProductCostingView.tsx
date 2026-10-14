import React, { useState, useMemo } from 'react';
import { ItemMaster } from '../../types';
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
  Boxes,
  Shield,
  Download,
  Printer,
  Sparkles,
  GitFork,
  ArrowUpRight,
  HelpCircle,
  BarChart3,
  SlidersHorizontal,
  Info,
  Scale,
  Gauge,
  Check,
} from 'lucide-react';

interface ProductCostingViewProps {
  items?: ItemMaster[] | any[];
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  onNavigate?: (view: string, param?: any) => void;
}

type CostTabMode = 'absorption' | 'scaling' | 'sensitivity';

export const ProductCostingView: React.FC<ProductCostingViewProps> = ({
  items = [],
  openDrawer,
  closeDrawer,
  showToast,
  onNavigate,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('FG-CTN-500');
  const [activeTab, setActiveTab] = useState<CostTabMode>('absorption');

  // Simulation Parameters for real-time cost calculation (strictly preserving original business logic)
  const [resinPricePerKg, setResinPricePerKg] = useState<number>(78.0);
  const [partWeightGrams, setPartWeightGrams] = useState<number>(45.0);
  const [cycleTimeSeconds, setCycleTimeSeconds] = useState<number>(16.0);
  const [moldCavities, setMoldCavities] = useState<number>(4);
  const [machineHourRate, setMachineHourRate] = useState<number>(450.0);
  const [sellingPrice, setSellingPrice] = useState<number>(9.5);
  const [moldCost, setMoldCost] = useState<number>(350000);
  const [moldLifeShots, setMoldLifeShots] = useState<number>(200000);

  // Additional configurable parameters with original defaults
  const [scrapPct, setScrapPct] = useState<number>(2.5);
  const [laborCostPerHour, setLaborCostPerHour] = useState<number>(135);
  const [standardBatchUnits, setStandardBatchUnits] = useState<number>(1000);

  // Exact Business Logic Calculations
  // 1. Material cost per unit (part weight in kg * resin price * (1 + scrap%))
  const scrapFactor = 1 + scrapPct / 100;
  const matCostPerUnit = (partWeightGrams / 1000) * resinPricePerKg * scrapFactor;

  // 2. Machine & Overhead cost per unit
  // Shots per hour = 3600 / cycleTime
  // Parts per hour = (3600 / cycleTime) * moldCavities
  const partsPerHour = (3600 / Math.max(cycleTimeSeconds, 0.1)) * moldCavities;
  const machineCostPerUnit = machineHourRate / Math.max(partsPerHour, 1);

  // 3. Direct Labor cost per unit
  const laborCostPerUnit = laborCostPerHour / Math.max(partsPerHour, 1);

  // 4. Tooling Amortization per unit (Mold cost / (mold life shots * cavities))
  const moldAmortizationPerUnit = moldCost / Math.max(moldLifeShots * moldCavities, 1);

  // Total Standard Unit Cost
  const totalCostPerUnit = matCostPerUnit + machineCostPerUnit + laborCostPerUnit + moldAmortizationPerUnit;
  const grossProfitPerUnit = sellingPrice - totalCostPerUnit;
  const marginPct = sellingPrice > 0 ? (grossProfitPerUnit / sellingPrice) * 100 : 0;

  // Product Switcher
  const handleProductSelect = (code: string) => {
    setSelectedProduct(code);
    if (code === 'FG-CTN-500') {
      setResinPricePerKg(78.0);
      setPartWeightGrams(45.0);
      setCycleTimeSeconds(16.0);
      setMoldCavities(4);
      setSellingPrice(9.5);
      setMoldCost(350000);
      setMoldLifeShots(200000);
      setScrapPct(2.5);
    } else if (code === 'FG-BKT-010') {
      setResinPricePerKg(82.0);
      setPartWeightGrams(380.0);
      setCycleTimeSeconds(28.0);
      setMoldCavities(1);
      setSellingPrice(48.0);
      setMoldCost(550000);
      setMoldLifeShots(150000);
      setScrapPct(2.0);
    } else if (code === 'FG-PET-030') {
      setResinPricePerKg(92.0);
      setPartWeightGrams(18.5);
      setCycleTimeSeconds(9.5);
      setMoldCavities(16);
      setSellingPrice(2.6);
      setMoldCost(1200000);
      setMoldLifeShots(500000);
      setScrapPct(1.5);
    } else if (code === 'FG-CAP-028') {
      setResinPricePerKg(84.0);
      setPartWeightGrams(3.2);
      setCycleTimeSeconds(7.0);
      setMoldCavities(24);
      setSellingPrice(1.2);
      setMoldCost(850000);
      setMoldLifeShots(400000);
      setScrapPct(1.8);
    }
    showToast(`Loaded standard parameters for ${code}`);
  };

  // Preset resin benchmarks
  const handleApplyResinBenchmark = (price: number, name: string) => {
    setResinPricePerKg(price);
    showToast(`Applied polymer index benchmark: ${name} (₹${price}/kg)`);
  };

  // Save standard cost toast (preserving exact toast message & logic)
  const handleSaveStandardCost = () => {
    showToast(`Standard Cost for ${selectedProduct} updated to ₹${totalCostPerUnit.toFixed(3)}/unit in General Ledger & BOM.`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Cost Element', 'Formula / Basis', 'Consumption', 'Unit Cost (INR)', 'Batch Cost (1,000 units)', 'Share of Total %'];
    const rows = [
      ['Direct Polymer Material', `${partWeightGrams}g @ ₹${resinPricePerKg}/kg + ${scrapPct}% scrap`, `${(partWeightGrams / 1000).toFixed(4)} kg/pc`, matCostPerUnit.toFixed(4), (matCostPerUnit * 1000).toFixed(2), ((matCostPerUnit / totalCostPerUnit) * 100).toFixed(1)],
      ['Machine Overhead & Energy', `₹${machineHourRate}/hr ÷ ${Math.round(partsPerHour)} pcs/hr`, `${(1 / partsPerHour).toFixed(4)} hr/pc`, machineCostPerUnit.toFixed(4), (machineCostPerUnit * 1000).toFixed(2), ((machineCostPerUnit / totalCostPerUnit) * 100).toFixed(1)],
      ['Direct Labor', `₹${laborCostPerHour}/hr ÷ ${Math.round(partsPerHour)} pcs/hr`, `${(1 / partsPerHour).toFixed(4)} man-hr/pc`, laborCostPerUnit.toFixed(4), (laborCostPerUnit * 1000).toFixed(2), ((laborCostPerUnit / totalCostPerUnit) * 100).toFixed(1)],
      ['Tooling Amortization', `₹${(moldCost / 100000).toFixed(1)}L mold ÷ ${moldLifeShots.toLocaleString()} shots (${moldCavities} cav)`, 'Per shot cavity factor', moldAmortizationPerUnit.toFixed(4), (moldAmortizationPerUnit * 1000).toFixed(2), ((moldAmortizationPerUnit / totalCostPerUnit) * 100).toFixed(1)],
      ['TOTAL STANDARD COST', 'Absorption sum', 'Per finished part', totalCostPerUnit.toFixed(4), (totalCostPerUnit * 1000).toFixed(2), '100.0%'],
      ['TARGET SELLING PRICE', 'Customer contracted price', 'Per finished part', sellingPrice.toFixed(4), (sellingPrice * 1000).toFixed(2), '-'],
      ['GROSS PROFIT MARGIN', `${marginPct.toFixed(1)}% margin`, 'Per finished part', grossProfitPerUnit.toFixed(4), (grossProfitPerUnit * 1000).toFixed(2), '-'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.map((x) => `"${x}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Standard_Cost_Rollup_${selectedProduct}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported Standard Cost Sheet for ${selectedProduct} to CSV`);
  };

  const productList = [
    { code: 'FG-CTN-500', name: 'Plastic Container 500ml', type: 'PP Homopolymer Injection', defaultPrice: 9.5 },
    { code: 'FG-BKT-010', name: 'Household Bucket 10L', type: 'HDPE Heavy Wall Injection', defaultPrice: 48.0 },
    { code: 'FG-PET-030', name: 'PET Bottle Preform 28mm', type: 'PET High-Speed Injection', defaultPrice: 2.6 },
    { code: 'FG-CAP-028', name: 'Flip-top Cap 28mm', type: 'PP Multi-Cavity Closure', defaultPrice: 1.2 },
  ];

  return (
    <div className="space-y-5" id="standard-cost-rollup-screen">
      {/* 1. Header Bar with Actions & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E4E0D6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#0F8B8D] font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
              <Calculator className="w-3 h-3" /> Standard Cost Rollup Engine
            </span>
            <span className="text-[11px] text-gray-400">&bull;</span>
            <span className="text-[11px] text-gray-500 font-mono">BOM Multi-Element Absorption &amp; Margins</span>
          </div>
          <h1 className="text-xl font-bold text-[#14213D] flex items-center gap-2">
            <span>Product Standard Costing &amp; Profitability Rollup</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {selectedProduct}
            </span>
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Real Navigation Link to Process Routing & BOM */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('routingList', { selectedId: selectedProduct })}
              className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Inspect Process Routing for this item"
              id="btn-nav-routing-ops"
            >
              <GitFork className="w-3.5 h-3.5 text-teal-600" />
              <span>Process Routing</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="btn btn-sm btn-ghost border border-[#E4E0D6] text-xs py-1.5 flex items-center gap-1.5 shadow-2xs"
            title="Export Standard Cost Sheet as CSV"
            id="btn-export-cost-sheet"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleSaveStandardCost}
            className="btn btn-sm btn-primary text-xs py-1.5 flex items-center gap-1.5 shadow-xs"
            id="btn-save-standard-cost"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Save Standard Cost</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Reactive KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Unit Standard Cost */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Std Unit Cost</span>
            <Calculator className="w-3.5 h-3.5 text-[#0F8B8D]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#0F8B8D]">
            ₹{totalCostPerUnit.toFixed(3)}
          </div>
          <div className="text-[10px] text-gray-400">Total absorption / unit</div>
        </div>

        {/* Gross Margin % */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Gross Margin</span>
            <Percent className={`w-3.5 h-3.5 ${marginPct >= 25 ? 'text-emerald-600' : 'text-[#E8622C]'}`} />
          </div>
          <div className={`text-xl font-bold font-mono ${marginPct >= 25 ? 'text-emerald-700' : 'text-[#E8622C]'}`}>
            {marginPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-gray-500 font-mono">
            ₹{grossProfitPerUnit.toFixed(2)} / unit
          </div>
        </div>

        {/* Selling Price */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Selling Price</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-[#14213D]">
            ₹{sellingPrice.toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-400">Contracted target</div>
        </div>

        {/* Hourly Throughput */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Throughput</span>
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-xl font-bold font-mono text-[#14213D]">
            {Math.round(partsPerHour).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 font-mono">
            {Math.round(3600 / Math.max(cycleTimeSeconds, 0.1))} shots/hr
          </div>
        </div>

        {/* Material Share */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Polymer Material</span>
            <Package className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-800">
            ₹{matCostPerUnit.toFixed(3)}
          </div>
          <div className="text-[10px] text-gray-400 font-mono">
            {((matCostPerUnit / totalCostPerUnit) * 100).toFixed(0)}% of total COGS
          </div>
        </div>

        {/* Machine & Labor Share */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Machine &amp; Labor</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700">
            ₹{(machineCostPerUnit + laborCostPerUnit).toFixed(3)}
          </div>
          <div className="text-[10px] text-gray-400 font-mono">
            {(((machineCostPerUnit + laborCostPerUnit) / totalCostPerUnit) * 100).toFixed(0)}% of total COGS
          </div>
        </div>
      </div>

      {/* 3. Product Selection Cards with Instant Parameter Loading */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center justify-between">
          <span>Active Finished Goods SKU Target</span>
          <span className="font-mono text-gray-500">4 Manufactured SKUs Available</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {productList.map((prod) => {
            const isSelected = selectedProduct === prod.code;
            return (
              <button
                key={prod.code}
                onClick={() => handleProductSelect(prod.code)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-white border-[#0F8B8D] ring-2 ring-[#0F8B8D]/20 shadow-md'
                    : 'bg-white border-[#E4E0D6] hover:border-gray-400 shadow-2xs'
                }`}
                id={`btn-select-product-${prod.code}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-[#0F8B8D] flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-teal-500' : 'bg-gray-300'}`} />
                    <span>{prod.code}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-[#14213D] mt-1 truncate">{prod.name}</div>
                <div className="text-[10px] text-gray-500 truncate mt-0.5">{prod.type}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Mode Bar: Cost Absorption, Batch Scaler, Sensitivity */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E4E0D6] shadow-2xs w-fit">
        <button
          onClick={() => setActiveTab('absorption')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'absorption' ? 'bg-[#14213D] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
          id="tab-absorption"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Interactive Cost Rollup Workbench</span>
        </button>
        <button
          onClick={() => setActiveTab('scaling')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'scaling' ? 'bg-[#14213D] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
          id="tab-scaling"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Batch Volume Scaling</span>
        </button>
        <button
          onClick={() => setActiveTab('sensitivity')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'sensitivity' ? 'bg-[#14213D] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
          id="tab-sensitivity"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Sensitivity Matrix</span>
        </button>
      </div>

      {/* 5. Main Content by Tab */}
      {activeTab === 'absorption' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Costing Engine Parameter Controls (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E4E0D6] shadow-2xs p-5 space-y-5">
            <div className="border-b border-[#E4E0D6] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#0F8B8D]" /> Costing Parameters
                </h2>
                <p className="text-[11px] text-gray-500">
                  Real-time variables controlling polymer, machine, labor &amp; tooling rates.
                </p>
              </div>
              <button
                onClick={() => handleProductSelect(selectedProduct)}
                className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-1 border border-gray-200 px-2 py-1 rounded"
                title="Reset to factory engineering baseline"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Section 1: Polymer Resin & Raw Material */}
              <div className="space-y-2 p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6]">
                <div className="font-bold text-[11px] uppercase tracking-wider text-[#0F8B8D] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Polymer Resin Raw Material
                  </span>
                  <span className="font-mono text-emerald-800">₹{resinPricePerKg.toFixed(1)} / KG</span>
                </div>

                <div>
                  <div className="flex justify-between text-gray-600 mb-1">
                    <span>Virgin Polymer Price:</span>
                    <span className="font-mono font-bold text-[#14213D]">₹{resinPricePerKg.toFixed(1)}/kg</span>
                  </div>
                  <input
                    type="range"
                    min="55"
                    max="150"
                    step="0.5"
                    value={resinPricePerKg}
                    onChange={(e) => setResinPricePerKg(parseFloat(e.target.value))}
                    className="w-full accent-[#0F8B8D] cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                    <span>Benchmark Presets:</span>
                    <div className="flex items-center gap-1 font-mono">
                      <button
                        onClick={() => handleApplyResinBenchmark(76.5, 'PP Homo')}
                        className="px-1.5 py-0.5 bg-white border border-gray-200 rounded hover:bg-teal-50 hover:text-teal-800"
                      >
                        PP ₹76.5
                      </button>
                      <button
                        onClick={() => handleApplyResinBenchmark(82.0, 'HDPE Blow')}
                        className="px-1.5 py-0.5 bg-white border border-gray-200 rounded hover:bg-teal-50 hover:text-teal-800"
                      >
                        HDPE ₹82
                      </button>
                      <button
                        onClick={() => handleApplyResinBenchmark(92.5, 'PET Bottle')}
                        className="px-1.5 py-0.5 bg-white border border-gray-200 rounded hover:bg-teal-50 hover:text-teal-800"
                      >
                        PET ₹92.5
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Part Shot Weight (g)</label>
                    <input
                      type="number"
                      value={partWeightGrams}
                      onChange={(e) => setPartWeightGrams(parseFloat(e.target.value) || 0.1)}
                      className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-white text-[#14213D]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Scrap / Purge Allowance (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={scrapPct}
                      onChange={(e) => setScrapPct(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-white text-[#14213D]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Injection Machine & Kinetics */}
              <div className="space-y-2 p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6]">
                <div className="font-bold text-[11px] uppercase tracking-wider text-amber-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Machine Kinetics &amp; Overhead
                  </span>
                  <span className="font-mono text-gray-600">{Math.round(partsPerHour)} pcs/hr</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Cycle Time (sec)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={cycleTimeSeconds}
                      onChange={(e) => setCycleTimeSeconds(parseFloat(e.target.value) || 1)}
                      className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-white text-[#14213D]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Active Mold Cavities</label>
                    <input
                      type="number"
                      value={moldCavities}
                      onChange={(e) => setMoldCavities(parseInt(e.target.value) || 1)}
                      className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-white text-[#14213D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 font-semibold mb-1">
                    Machine Hourly Overhead Rate (₹ / Hour)
                  </label>
                  <input
                    type="number"
                    value={machineHourRate}
                    onChange={(e) => setMachineHourRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-white text-[#14213D]"
                  />
                  <span className="text-[10px] text-gray-400">Includes electricity kWh, chiller &amp; machine depreciation</span>
                </div>
              </div>

              {/* Section 3: Direct Labor & Tooling Amortization */}
              <div className="space-y-2 p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6]">
                <div className="font-bold text-[11px] uppercase tracking-wider text-purple-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> Labor &amp; Mold Tooling Life
                  </span>
                  <span className="font-mono text-gray-600">{moldCavities} Cavity Mold</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Labor Rate (₹ / Hr)</label>
                    <input
                      type="number"
                      value={laborCostPerHour}
                      onChange={(e) => setLaborCostPerHour(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-white text-[#14213D]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Mold Life (Shots)</label>
                    <input
                      type="number"
                      value={moldLifeShots}
                      onChange={(e) => setMoldLifeShots(parseInt(e.target.value) || 1)}
                      className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-white text-[#14213D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Mold Capital Tooling Cost (₹)</label>
                  <input
                    type="number"
                    value={moldCost}
                    onChange={(e) => setMoldCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-white text-[#14213D]"
                  />
                  <span className="text-[10px] text-gray-400 font-mono">
                    Amortization: ₹{moldAmortizationPerUnit.toFixed(4)} / piece
                  </span>
                </div>
              </div>

              {/* Section 4: Target Commercial Selling Price */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1.5">
                <label className="block text-emerald-900 font-bold mb-1">
                  Target Customer Selling Price (₹ / Unit)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-mono font-bold text-emerald-700">₹</span>
                  <input
                    type="number"
                    step="0.1"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 border border-emerald-300 rounded-lg font-mono font-bold text-base bg-white text-emerald-900 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-emerald-800 font-semibold pt-1">
                  <span>Gross Margin:</span>
                  <span className="font-mono font-bold">{marginPct.toFixed(1)}% (₹{grossProfitPerUnit.toFixed(2)}/unit)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Standard Cost Sheet & Absorption Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Visual Absorption Distribution Bar */}
            <div className="p-5 bg-white rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D]">
                    Cost Component Absorption Allocation
                  </h3>
                  <p className="text-xs text-gray-500">
                    Proportional cost breakdown for {selectedProduct} (₹{totalCostPerUnit.toFixed(3)} / unit total)
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-gray-400">Gross Margin:</span>{' '}
                  <strong className={`text-sm ${marginPct >= 25 ? 'text-emerald-600' : 'text-[#E8622C]'}`}>
                    {marginPct.toFixed(1)}%
                  </strong>
                </div>
              </div>

              {/* Progress Segmented Bar */}
              <div className="h-4 w-full bg-[#FAF9F5] rounded-full overflow-hidden flex border border-[#E4E0D6]">
                <div
                  style={{ width: `${(matCostPerUnit / totalCostPerUnit) * 100}%` }}
                  className="bg-[#0F8B8D] h-full transition-all"
                  title={`Polymer Material: ₹${matCostPerUnit.toFixed(3)} (${((matCostPerUnit / totalCostPerUnit) * 100).toFixed(1)}%)`}
                />
                <div
                  style={{ width: `${(machineCostPerUnit / totalCostPerUnit) * 100}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`Machine & Overhead: ₹${machineCostPerUnit.toFixed(3)} (${((machineCostPerUnit / totalCostPerUnit) * 100).toFixed(1)}%)`}
                />
                <div
                  style={{ width: `${(laborCostPerUnit / totalCostPerUnit) * 100}%` }}
                  className="bg-blue-500 h-full transition-all"
                  title={`Direct Labor: ₹${laborCostPerUnit.toFixed(3)} (${((laborCostPerUnit / totalCostPerUnit) * 100).toFixed(1)}%)`}
                />
                <div
                  style={{ width: `${(moldAmortizationPerUnit / totalCostPerUnit) * 100}%` }}
                  className="bg-purple-500 h-full transition-all"
                  title={`Tooling Amortization: ₹${moldAmortizationPerUnit.toFixed(3)} (${((moldAmortizationPerUnit / totalCostPerUnit) * 100).toFixed(1)}%)`}
                />
              </div>

              {/* Legend with explicit percentages */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F8B8D] shrink-0" />
                  <span className="text-gray-600 truncate">Polymer ({((matCostPerUnit / totalCostPerUnit) * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-gray-600 truncate">Machine ({((machineCostPerUnit / totalCostPerUnit) * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-gray-600 truncate">Labor ({((laborCostPerUnit / totalCostPerUnit) * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-gray-600 truncate">Tooling ({((moldAmortizationPerUnit / totalCostPerUnit) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            </div>

            {/* Elements Breakdown Standard Cost Table */}
            <div className="panel bg-white rounded-2xl border border-[#E4E0D6] shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-[#E4E0D6] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0F8B8D]" /> Standard Cost Rollup Sheet
                  </h3>
                  <p className="text-xs text-gray-500">
                    Detailed mathematical element buildup per unit and standard batch of {standardBatchUnits.toLocaleString()} units.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-gray-500 bg-[#FAF9F5] px-2.5 py-1 rounded-lg border border-[#E4E0D6]">
                  Active: {selectedProduct}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-gray-600 uppercase text-[10px] font-bold tracking-wider">
                      <th className="p-3">Cost Element</th>
                      <th className="p-3">Mathematical Basis / Consumption</th>
                      <th className="p-3 text-right">Unit Cost (₹)</th>
                      <th className="p-3 text-right">Batch Cost (₹)</th>
                      <th className="p-3 text-right">% of COGS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E0D6]">
                    {/* Direct Polymer Material */}
                    <tr className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="p-3 font-semibold text-[#14213D] flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#0F8B8D]" /> Direct Polymer Material
                      </td>
                      <td className="p-3 text-gray-600">
                        {partWeightGrams}g @ ₹{resinPricePerKg}/kg + {scrapPct}% scrap
                      </td>
                      <td className="p-3 font-mono font-bold text-right text-[#14213D]">
                        ₹{matCostPerUnit.toFixed(3)}
                      </td>
                      <td className="p-3 font-mono text-right text-gray-700">
                        ₹{(matCostPerUnit * standardBatchUnits).toFixed(2)}
                      </td>
                      <td className="p-3 font-mono text-right text-gray-600">
                        {((matCostPerUnit / totalCostPerUnit) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Machine Overhead & Energy */}
                    <tr className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="p-3 font-semibold text-[#14213D] flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" /> Machine Overhead &amp; Energy
                      </td>
                      <td className="p-3 text-gray-600">
                        ₹{machineHourRate}/hr &divide; {Math.round(partsPerHour)} pcs/hr
                      </td>
                      <td className="p-3 font-mono font-bold text-right text-[#14213D]">
                        ₹{machineCostPerUnit.toFixed(3)}
                      </td>
                      <td className="p-3 font-mono text-right text-gray-700">
                        ₹{(machineCostPerUnit * standardBatchUnits).toFixed(2)}
                      </td>
                      <td className="p-3 font-mono text-right text-gray-600">
                        {((machineCostPerUnit / totalCostPerUnit) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Direct Labor */}
                    <tr className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="p-3 font-semibold text-[#14213D] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" /> Direct Labor
                      </td>
                      <td className="p-3 text-gray-600">
                        ₹{laborCostPerHour}/hr &divide; {Math.round(partsPerHour)} pcs/hr
                      </td>
                      <td className="p-3 font-mono font-bold text-right text-[#14213D]">
                        ₹{laborCostPerUnit.toFixed(3)}
                      </td>
                      <td className="p-3 font-mono text-right text-gray-700">
                        ₹{(laborCostPerUnit * standardBatchUnits).toFixed(2)}
                      </td>
                      <td className="p-3 font-mono text-right text-gray-600">
                        {((laborCostPerUnit / totalCostPerUnit) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Mold Tooling Amortization */}
                    <tr className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="p-3 font-semibold text-[#14213D] flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-500" /> Mold Tooling Amortization
                      </td>
                      <td className="p-3 text-gray-600">
                        ₹{(moldCost / 100000).toFixed(1)}L mold &divide; {moldLifeShots.toLocaleString()} shots ({moldCavities} cav)
                      </td>
                      <td className="p-3 font-mono font-bold text-right text-[#14213D]">
                        ₹{moldAmortizationPerUnit.toFixed(3)}
                      </td>
                      <td className="p-3 font-mono text-right text-gray-700">
                        ₹{(moldAmortizationPerUnit * standardBatchUnits).toFixed(2)}
                      </td>
                      <td className="p-3 font-mono text-right text-gray-600">
                        {((moldAmortizationPerUnit / totalCostPerUnit) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>

                  <tfoot className="bg-[#FAF9F5] font-mono font-bold border-t-2 border-[#E4E0D6]">
                    <tr>
                      <td colSpan={2} className="p-3 text-right text-[#14213D]">Total Standard Unit Cost:</td>
                      <td className="p-3 text-right text-sm text-[#0F8B8D]">
                        ₹{totalCostPerUnit.toFixed(3)}
                      </td>
                      <td className="p-3 text-right text-sm text-gray-800">
                        ₹{(totalCostPerUnit * standardBatchUnits).toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-gray-800">100.0%</td>
                    </tr>
                    <tr className="bg-emerald-50/50 border-t border-emerald-200">
                      <td colSpan={2} className="p-3 text-right text-emerald-900 font-sans">
                        Contracted Target Selling Price:
                      </td>
                      <td className="p-3 text-right text-sm text-emerald-900">
                        ₹{sellingPrice.toFixed(3)}
                      </td>
                      <td className="p-3 text-right text-sm text-emerald-900">
                        ₹{(sellingPrice * standardBatchUnits).toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-emerald-800 font-sans">
                        Margin: {marginPct.toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Profitability Executive Summary Card */}
            <div className="p-4 bg-white rounded-2xl border border-[#E4E0D6] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Target Commercial Viability
                </span>
                <div className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <span>Gross Profit: ₹{grossProfitPerUnit.toFixed(3)} / unit</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                    marginPct >= 30 ? 'bg-emerald-100 text-emerald-800' : marginPct >= 15 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {marginPct >= 30 ? 'Outstanding Margin' : marginPct >= 15 ? 'Healthy Margin' : 'Sub-Optimal Margin'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  At standard batch of {standardBatchUnits.toLocaleString()} units, expected gross profit is ₹{(grossProfitPerUnit * standardBatchUnits).toFixed(2)}.
                </p>
              </div>

              <button
                onClick={handleSaveStandardCost}
                className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shrink-0"
              >
                <Check className="w-3.5 h-3.5" /> Commit to General Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Batch Volume Scaling Simulation Tab */}
      {activeTab === 'scaling' && (
        <div className="panel bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-4">
          <div className="border-b border-[#E4E0D6] pb-3">
            <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0F8B8D]" /> Production Volume Scaling &amp; Fixed Tooling Dilution
            </h3>
            <p className="text-xs text-gray-500">
              Analyze how fixed machine changeover setups and mold tooling amortization affect unit profitability across varied batch quantities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {[500, 1000, 5000, 20000].map((vol) => {
              // Simulated setup time amortized over batch
              const setupHours = 1.0; // 60 min setup
              const setupCost = (setupHours * machineHourRate) / vol;
              const unitCostAtVol = totalCostPerUnit + setupCost;
              const profitAtVol = sellingPrice - unitCostAtVol;
              const marginAtVol = (profitAtVol / sellingPrice) * 100;

              return (
                <div key={vol} className="p-4 rounded-xl border border-[#E4E0D6] bg-[#FAF9F5] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#14213D]">
                      {vol.toLocaleString()} Units
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      {vol === 1000 ? 'Standard Batch' : 'Simulated'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] text-gray-500">Unit Standard Cost:</div>
                    <div className="text-lg font-bold font-mono text-[#0F8B8D]">
                      ₹{unitCostAtVol.toFixed(3)}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Total Batch Cost:</span>
                      <strong className="font-mono text-gray-800">₹{(unitCostAtVol * vol).toFixed(0)}</strong>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Gross Profit:</span>
                      <strong className={`font-mono ${profitAtVol > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        ₹{(profitAtVol * vol).toFixed(0)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Gross Margin:</span>
                      <strong className={`font-mono ${marginAtVol >= 25 ? 'text-emerald-700' : 'text-orange-600'}`}>
                        {marginAtVol.toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Sensitivity Matrix Tab */}
      {activeTab === 'sensitivity' && (
        <div className="panel bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-4">
          <div className="border-b border-[#E4E0D6] pb-3">
            <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0F8B8D]" /> Polymer Price &amp; Cycle Time Sensitivity Matrix
            </h3>
            <p className="text-xs text-gray-500">
              Impact of raw polymer price market shifts (±15%) and cycle time deviations on final unit margins.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-gray-600 uppercase text-[10px] font-bold">
                  <th className="p-3">Scenario Description</th>
                  <th className="p-3">Polymer Rate (₹/kg)</th>
                  <th className="p-3">Cycle Time (s)</th>
                  <th className="p-3 text-right">Unit Material (₹)</th>
                  <th className="p-3 text-right">Total Unit Cost (₹)</th>
                  <th className="p-3 text-right">Gross Margin %</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {[
                  { desc: 'Raw Material Drop (-10%)', resin: resinPricePerKg * 0.9, cycle: cycleTimeSeconds, tag: 'Favorable' },
                  { desc: 'Baseline Engineering Standard', resin: resinPricePerKg, cycle: cycleTimeSeconds, tag: 'Standard' },
                  { desc: 'Raw Material Surge (+10%)', resin: resinPricePerKg * 1.1, cycle: cycleTimeSeconds, tag: 'Inflationary' },
                  { desc: 'Cycle Time Extension (+2.0s)', resin: resinPricePerKg, cycle: cycleTimeSeconds + 2.0, tag: 'Machine Slow' },
                  { desc: 'Worst Case: Resin +15% & Cycle +2s', resin: resinPricePerKg * 1.15, cycle: cycleTimeSeconds + 2.0, tag: 'Stress Test' },
                ].map((sc, i) => {
                  const sMat = (partWeightGrams / 1000) * sc.resin * scrapFactor;
                  const sParts = (3600 / sc.cycle) * moldCavities;
                  const sMac = machineHourRate / sParts;
                  const sLab = laborCostPerHour / sParts;
                  const sTot = sMat + sMac + sLab + moldAmortizationPerUnit;
                  const sMargin = ((sellingPrice - sTot) / sellingPrice) * 100;

                  return (
                    <tr key={i} className={`hover:bg-[#FAF9F5] ${i === 1 ? 'bg-teal-50/30 font-semibold' : ''}`}>
                      <td className="p-3 text-[#14213D]">{sc.desc}</td>
                      <td className="p-3 font-mono">₹{sc.resin.toFixed(1)}</td>
                      <td className="p-3 font-mono">{sc.cycle.toFixed(1)}s</td>
                      <td className="p-3 font-mono text-right">₹{sMat.toFixed(3)}</td>
                      <td className="p-3 font-mono font-bold text-right text-[#0F8B8D]">₹{sTot.toFixed(3)}</td>
                      <td className={`p-3 font-mono font-bold text-right ${sMargin >= 25 ? 'text-emerald-700' : 'text-[#E8622C]'}`}>
                        {sMargin.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                          {sc.tag}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
