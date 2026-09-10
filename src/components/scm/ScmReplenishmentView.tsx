import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { mockReplenishmentItems } from '../../data/mockScmData';
import { ReplenishmentItem } from '../../types/scm';

interface ScmReplenishmentViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmReplenishmentView: React.FC<ScmReplenishmentViewProps> = ({ onNavigate, showToast }) => {
  const [items, setItems] = useState<ReplenishmentItem[]>(mockReplenishmentItems);
  const [ruleFilter, setRuleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((i) => {
    const matchesSearch =
      i.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.preferredSupplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRule = ruleFilter === 'All' || i.ruleType === ruleFilter;
    return matchesSearch && matchesRule;
  });

  const handleTriggerReorder = (item: ReplenishmentItem) => {
    showToast(`Triggered automated purchase order suggestion for ${item.itemCode} (${item.reorderQty} ${item.uom})`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs font-semibold uppercase">
              Automated Replenishment
            </span>
            <span className="text-xs text-slate-500">· Min/Max &amp; Dynamic Reorder Points</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Replenishment Planning &amp; Kanban Floor Stock
          </h1>
          <p className="text-slate-500 text-xs">
            Manage reorder thresholds, safety stock bands, and automatic order generation for bulk resins, color masterbatch, mold release agents, and spare parts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Recalculated dynamic reorder points based on 90-day consumption velocity')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recalculate Reorder Points</span>
          </button>
        </div>
      </div>

      {/* Rules Selection & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Reorder Point', 'Min/Max', 'Demand-Driven', 'Kanban Floor Stock'].map((rule) => (
            <button
              key={rule}
              onClick={() => setRuleFilter(rule)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                ruleFilter === rule ? 'bg-[#14213D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {rule}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU or Supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Replenishment Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Item / Description</th>
                <th className="p-3">Location</th>
                <th className="p-3 text-right">Current Stock</th>
                <th className="p-3 text-right">Reorder Level</th>
                <th className="p-3 text-right">Safety Stock</th>
                <th className="p-3 text-right">Min / Max</th>
                <th className="p-3 text-right">Order Qty</th>
                <th className="p-3">Rule Type</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{item.itemCode}</div>
                    <div className="text-[11px] text-slate-500">{item.itemName}</div>
                    <div className="text-[10px] text-slate-400">{item.preferredSupplier}</div>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-600">{item.warehouseLocation}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {item.currentStock.toLocaleString()} {item.uom}
                  </td>
                  <td className="p-3 text-right font-mono text-amber-700 font-semibold">
                    {item.reorderLevel.toLocaleString()} {item.uom}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    {item.safetyStock.toLocaleString()} {item.uom}
                  </td>
                  <td className="p-3 text-right font-mono text-[11px] text-slate-500">
                    {item.minStock.toLocaleString()} / {item.maxStock.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">
                    {item.reorderQty.toLocaleString()} {item.uom}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200">
                      {item.ruleType}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'Below Safety Stock'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : item.status === 'Below Reorder'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleTriggerReorder(item)}
                      className="px-2.5 py-1 bg-[#E8622C] hover:bg-[#d45422] text-white rounded text-[11px] font-bold transition cursor-pointer"
                    >
                      Reorder Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
