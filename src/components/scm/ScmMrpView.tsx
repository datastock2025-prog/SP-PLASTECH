import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  Sliders,
  Search,
  ExternalLink,
} from 'lucide-react';
import { mockMrpSuggestions } from '../../data/mockScmData';
import { MRPSuggestion } from '../../types/scm';

interface ScmMrpViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmMrpView: React.FC<ScmMrpViewProps> = ({ onNavigate, showToast }) => {
  const [suggestions, setSuggestions] = useState<MRPSuggestion[]>(mockMrpSuggestions);
  const [isCalculating, setIsCalculating] = useState(false);
  const [supplyTypeFilter, setSupplyTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters configuration state
  const [filters, setFilters] = useState({
    plant: 'Plant 01 (Hosūr)',
    horizonDays: '30 Days',
    includeSafetyStock: true,
    includeForecasts: true,
    includeOpenSOs: true,
    includeOpenWOs: true,
  });

  const handleRunMRP = () => {
    setIsCalculating(true);
    showToast('Running multi-echelon MRP calculation with BOM explosion & MOQ rules...');
    setTimeout(() => {
      setIsCalculating(false);
      showToast('MRP Engine calculation complete: 4 Purchase & Produce suggestions active.');
    }, 1200);
  };

  const handleConvertSuggestion = (id: string, type: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Converted' } : s))
    );
    showToast(`Converted ${id} into formal ${type === 'Purchase' ? 'Purchase Requisition (PR)' : 'Work Order (WO)'}`);
  };

  const handleIgnoreSuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Ignored' } : s))
    );
    showToast(`Ignored MRP recommendation ${id}`);
  };

  const filteredSuggestions = suggestions.filter((s) => {
    const matchesSearch =
      s.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.preferredSupplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = supplyTypeFilter === 'All' || s.supplyType === supplyTypeFilter;
    const matchesPriority = priorityFilter === 'All' || s.priority === priorityFilter;
    return matchesSearch && matchesType && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* MRP Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-xs font-semibold uppercase">
              Material Requirements Engine
            </span>
            <span className="text-xs text-slate-500">· Multi-Echelon BOM Explosion</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Material Requirements Planning (MRP) Workbench
          </h1>
          <p className="text-slate-500 text-xs">
            Calculate net material shortages across virgin polymers, color masterbatches, and packaging based on confirmed SOs, BOM scrap factors, and supplier MOQs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunMRP}
            disabled={isCalculating}
            className="flex items-center gap-2 px-4 py-2 bg-[#E8622C] hover:bg-[#d45422] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isCalculating ? 'Computing BOM Explosion...' : 'Execute MRP Engine'}</span>
          </button>
        </div>
      </div>

      {/* MRP Calculation Parameters & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-700">Calculation Horizon:</span>
            <select
              value={filters.horizonDays}
              onChange={(e) => setFilters({ ...filters, horizonDays: e.target.value })}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800"
            >
              <option value="14 Days">14 Days (Immediate JIT)</option>
              <option value="30 Days">30 Days (1 Month Rolling)</option>
              <option value="60 Days">60 Days (2 Months Quarter)</option>
              <option value="90 Days">90 Days (Quarterly Horizon)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeSafetyStock}
                onChange={(e) => setFilters({ ...filters, includeSafetyStock: e.target.checked })}
                className="rounded text-[#0F8B8D]"
              />
              <span>Include Safety Stock</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeForecasts}
                onChange={(e) => setFilters({ ...filters, includeForecasts: e.target.checked })}
                className="rounded text-[#0F8B8D]"
              />
              <span>Include Approved Forecasts</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeOpenWOs}
                onChange={(e) => setFilters({ ...filters, includeOpenWOs: e.target.checked })}
                className="rounded text-[#0F8B8D]"
              />
              <span>Deduct Running WOs</span>
            </label>
          </div>
        </div>

        {/* Suggestion Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Item, Resin, Supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <select
              value={supplyTypeFilter}
              onChange={(e) => setSupplyTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="All">All Supply Types</option>
              <option value="Purchase">Purchase (PO/PR)</option>
              <option value="Produce">Produce (Regrind/WIP)</option>
              <option value="Transfer">Transfer</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            Showing <strong>{filteredSuggestions.length}</strong> calculated material shortage actions
          </div>
        </div>
      </div>

      {/* MRP Suggestions Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Item Code &amp; Description</th>
                <th className="p-3">Required Date</th>
                <th className="p-3 text-right">Shortage Qty</th>
                <th className="p-3 text-right">Suggested Qty (MOQ)</th>
                <th className="p-3">Supply Type</th>
                <th className="p-3">Supplier / Resource</th>
                <th className="p-3 text-right">Est. Cost</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSuggestions.map((sug) => (
                <tr key={sug.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{sug.itemCode}</div>
                    <div className="text-[11px] text-slate-500">{sug.itemName}</div>
                    {sug.exceptionAlerts && sug.exceptionAlerts.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-rose-600 font-semibold mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{sug.exceptionAlerts[0]}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">{sug.requiredDate}</td>
                  <td className="p-3 text-right font-mono font-bold text-rose-600">
                    {sug.projectedShortage.toLocaleString()} {sug.uom}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {sug.suggestedOrderQty.toLocaleString()} {sug.uom}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      MOQ: {sug.moq.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sug.supplyType === 'Purchase'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {sug.supplyType}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-800 font-medium">{sug.preferredSupplier}</div>
                    <div className="text-[10px] text-slate-400">Lead Time: {sug.leadTimeDays} Days</div>
                  </td>
                  <td className="p-3 text-right font-mono text-slate-900 font-bold">
                    ₹{sug.estimatedCost.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sug.priority === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : sug.priority === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {sug.priority}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sug.status === 'Converted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sug.status === 'Ignored'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {sug.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    {sug.status !== 'Converted' && sug.status !== 'Ignored' ? (
                      <>
                        <button
                          onClick={() => handleConvertSuggestion(sug.id, sug.supplyType)}
                          className="px-2.5 py-1 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded text-[11px] font-bold transition cursor-pointer"
                        >
                          Convert
                        </button>
                        <button
                          onClick={() => handleIgnoreSuggestion(sug.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-semibold transition cursor-pointer"
                        >
                          Ignore
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">Completed</span>
                    )}
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
