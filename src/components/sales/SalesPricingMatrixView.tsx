import React, { useState } from 'react';
import {
  Tag,
  Percent,
  Calculator,
  Search,
  CheckCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sparkles,
  Sliders,
  DollarSign,
} from 'lucide-react';
import {
  SALES_PRICE_LISTS,
  SALES_REBATES,
  PriceListEntry,
  RebateProgram,
} from '../../data/salesData';

interface Props {
  showToast: (msg: string) => void;
}

export const SalesPricingMatrixView: React.FC<Props> = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState<'Standard Price Lists' | 'Rebate Programs' | 'Margin Simulator'>('Standard Price Lists');
  const [search, setSearch] = useState<string>('');

  // Simulator State
  const [simBaseCost, setSimBaseCost] = useState<number>(7.2);
  const [simSellingPrice, setSimSellingPrice] = useState<number>(9.5);
  const [simVolume, setSimVolume] = useState<number>(25000);
  const [simDiscountPct, setSimDiscountPct] = useState<number>(4);
  const [simPaymentTerms, setSimPaymentTerms] = useState<number>(30); // days
  const [simFreightRate, setSimFreightRate] = useState<number>(0.35); // ₹/pc

  // Calculated simulator values
  const effectivePrice = simSellingPrice * (1 - simDiscountPct / 100);
  const totalCost = simBaseCost + simFreightRate + (simPaymentTerms > 30 ? (effectivePrice * 0.015) : 0);
  const netMarginRupees = effectivePrice - totalCost;
  const netMarginPct = (netMarginRupees / effectivePrice) * 100;
  const isFloorBreached = netMarginPct < 18.0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-[#0F8B8D]">
            <span>Commercial Policy &middot; Pricing Matrix &amp; Customer Rebates</span>
          </div>
          <h1 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-0.5">
            Pricing, Rebates &amp; Margin Simulator
          </h1>
          <p className="text-xs text-[#6B7280]">
            Tiered customer pricing matrices, volume rebate brackets, and real-time deal margin simulators.
          </p>
        </div>

        <button
          onClick={() => showToast('Price list revision exported to PDF')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0d7a7c] text-white text-xs font-semibold shadow-xs"
        >
          <DollarSign className="w-3.5 h-3.5" /> Export Catalog Price List
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E0D6]">
        {(['Standard Price Lists', 'Rebate Programs', 'Margin Simulator'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === t
                ? 'border-[#0F8B8D] text-[#0F8B8D]'
                : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab 1: Standard Price Lists */}
      {activeTab === 'Standard Price Lists' && (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#14213D]">Polymer Grade &amp; Finished Goods Price Schedules</h2>
            <div className="text-xs text-[#6B7280] font-mono">FY 2026-2027 Commercial Matrix</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
                  <th className="p-3">Price List ID</th>
                  <th className="p-3">Schedule Name</th>
                  <th className="p-3">Customer / Target Group</th>
                  <th className="p-3">Applicable Products</th>
                  <th className="p-3 text-right">Base Price (₹)</th>
                  <th className="p-3 text-right">Contract Price (₹)</th>
                  <th className="p-3 text-right">MOQ</th>
                  <th className="p-3 text-center">Tier</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {SALES_PRICE_LISTS.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-[#0F8B8D]">{p.id}</td>
                    <td className="p-3 font-medium text-[#14213D]">{p.name}</td>
                    <td className="p-3 font-bold text-[#14213D]">{p.customerOrGroup}</td>
                    <td className="p-3 text-[#6B7280]">{p.itemOrGroup}</td>
                    <td className="p-3 text-right font-mono text-[#6B7280]">
                      ₹{p.basePrice.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ₹{p.unitPrice.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono text-[#14213D]">
                      {p.moq.toLocaleString()} PCS
                    </td>
                    <td className="p-3 text-center">
                      <span className="badge teal">{p.priority}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="badge green">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Rebate Programs */}
      {activeTab === 'Rebate Programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SALES_REBATES.map((r) => {
            const pctAchieved = Math.min(100, Math.round((r.currentVolume / r.volumeTarget) * 100));
            return (
              <div key={r.id} className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#0F8B8D]">{r.id}</span>
                    <h2 className="text-base font-bold text-[#14213D]">{r.name}</h2>
                    <p className="text-xs text-[#6B7280]">Customer: {r.customer} &middot; {r.productGroup}</p>
                  </div>
                  <span className="badge green">{r.status}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#6B7280]">Volume Target:</span>
                    <span className="font-bold text-[#14213D]">{r.volumeTarget.toLocaleString()} PCS</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-[#6B7280]">Current Achieved:</span>
                    <span className="font-bold text-emerald-700">
                      {r.currentVolume.toLocaleString()} PCS ({pctAchieved}%)
                    </span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-[#6B7280]">Rebate Rate:</span>
                    <span className="font-bold text-[#E8622C]">{r.rebatePct}% Credit Memo</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-[#6B7280]">Accrued Credit:</span>
                    <span className="font-bold text-emerald-700">₹{r.accruedRebate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-[#6B7280]">Validity:</span>
                    <span>{r.validity}</span>
                  </div>

                  <div className="pt-2">
                    <div className="h-2 w-full bg-[#F6F4EF] rounded-full overflow-hidden">
                      <div className="h-full bg-[#0F8B8D] rounded-full" style={{ width: `${pctAchieved}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Margin Simulator */}
      {activeTab === 'Margin Simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#E4E0D6] shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#0F8B8D]" />
              <span>Commercial Deal Margin &amp; Price Discount Simulator</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="field">
                <label className="font-bold text-[#14213D]">Manufacture Base Cost (₹/pc)</label>
                <input
                  type="number"
                  step="0.1"
                  value={simBaseCost}
                  onChange={(e) => setSimBaseCost(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#F6F4EF] font-mono font-bold"
                />
              </div>

              <div className="field">
                <label className="font-bold text-[#14213D]">Quoted List Price (₹/pc)</label>
                <input
                  type="number"
                  step="0.1"
                  value={simSellingPrice}
                  onChange={(e) => setSimSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#F6F4EF] font-mono font-bold"
                />
              </div>

              <div className="field">
                <label className="font-bold text-[#14213D]">Customer Volume (PCS)</label>
                <input
                  type="number"
                  step="1000"
                  value={simVolume}
                  onChange={(e) => setSimVolume(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#F6F4EF] font-mono font-bold"
                />
              </div>

              <div className="field">
                <label className="font-bold text-[#14213D]">Proposed Discount %</label>
                <input
                  type="number"
                  step="0.5"
                  value={simDiscountPct}
                  onChange={(e) => setSimDiscountPct(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#F6F4EF] font-mono font-bold text-rose-600"
                />
              </div>

              <div className="field">
                <label className="font-bold text-[#14213D]">Payment Credit Terms (Days)</label>
                <select
                  value={simPaymentTerms}
                  onChange={(e) => setSimPaymentTerms(parseInt(e.target.value) || 30)}
                  className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#F6F4EF] font-mono font-bold"
                >
                  <option value={0}>Advance / Immediate (0% Finance Cost)</option>
                  <option value={15}>Net 15 Days</option>
                  <option value={30}>Net 30 Days (Standard)</option>
                  <option value={45}>Net 45 Days (+1.5% Carrying Cost)</option>
                  <option value={60}>Net 60 Days (+3.0% Carrying Cost)</option>
                </select>
              </div>

              <div className="field">
                <label className="font-bold text-[#14213D]">Freight / Logistic Rate (₹/pc)</label>
                <input
                  type="number"
                  step="0.05"
                  value={simFreightRate}
                  onChange={(e) => setSimFreightRate(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#F6F4EF] font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="bg-[#14213D] text-white p-6 rounded-xl shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#9AA5C4] font-mono">
                Deal Profitability Simulation
              </div>
              <div className="text-xl font-bold font-['Space_Grotesk'] mt-1">
                Net Margin: {netMarginPct.toFixed(1)}%
              </div>

              {isFloorBreached ? (
                <div className="mt-3 p-3 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Below 18% floor! Commercial Director approval required.</span>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Deal approved under standard pricing policy.</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs font-mono border-t border-white/10 pt-4">
              <div className="flex justify-between">
                <span className="text-[#9AA5C4]">Net Realized Price:</span>
                <b>₹{effectivePrice.toFixed(2)} / pc</b>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA5C4]">Total Landed Cost:</span>
                <b>₹{totalCost.toFixed(2)} / pc</b>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA5C4]">Net Contribution / Pc:</span>
                <b className="text-[#0F8B8D]">₹{netMarginRupees.toFixed(2)}</b>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                <span className="text-[#9AA5C4]">Total Gross Profit:</span>
                <b className="text-emerald-400">
                  ₹{(netMarginRupees * simVolume).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </b>
              </div>
            </div>

            <button
              onClick={() => showToast(`Quotation rate calculated at ₹${effectivePrice.toFixed(2)}/pc`)}
              className="w-full py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0d7a7c] text-white font-semibold text-xs transition-colors"
            >
              Apply to Active Quotation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
