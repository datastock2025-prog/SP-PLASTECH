import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
  Plus,
  CheckCircle2,
  Calendar,
  Filter,
  Search,
} from 'lucide-react';
import { MrpPurchaseSuggestion } from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';

interface Props {
  mrpSuggestions: MrpPurchaseSuggestion[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ProcurementPlanningMrpView: React.FC<Props> = ({
  mrpSuggestions,
  onNavigate,
  showToast,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mrpSuggestions.filter((m) =>
    m.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.preferredSupplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkConvertPR = () => {
    if (selectedIds.length === 0) {
      showToast('Select at least 1 MRP shortage line to generate PR');
      return;
    }
    showToast(`Consolidated ${selectedIds.length} raw material shortages into Draft Purchase Requisition`);
    onNavigate('prList');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8622C]/10 text-[#E8622C] border border-[#E8622C]/30 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> MRP Sourcing Engine
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            MRP Shortage Suggestions & Procurement Planning
          </h1>
          <p className="text-xs text-slate-500">
            Real-time material requirements computed from Production Work Orders, Active BOM explosions, and Safety Stock buffers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkConvertPR}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> Consolidate Selected to PR ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search shortages by material SKU, description, vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setSelectedIds(filtered.map((m) => m.id))}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium text-slate-700"
          >
            Select All ({filtered.length})
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium text-slate-700"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* MRP Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b">
            <tr>
              <th className="py-3 px-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filtered.length && filtered.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(filtered.map((m) => m.id));
                    else setSelectedIds([]);
                  }}
                  className="rounded text-[#0F8B8D]"
                />
              </th>
              <th className="py-3 px-3 font-semibold">Material Description</th>
              <th className="py-3 px-3 font-semibold text-right">On Hand</th>
              <th className="py-3 px-3 font-semibold text-right">WO Demand</th>
              <th className="py-3 px-3 font-semibold text-right">Net Shortage</th>
              <th className="py-3 px-3 font-semibold text-right">Suggested PO Qty</th>
              <th className="py-3 px-3 font-semibold">Preferred Supplier</th>
              <th className="py-3 px-3 font-semibold text-center">Urgency</th>
              <th className="py-3 px-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-slate-50 transition cursor-pointer ${
                  selectedIds.includes(item.id) ? 'bg-[#0F8B8D]/5' : ''
                }`}
                onClick={() => toggleSelect(item.id)}
              >
                <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="rounded text-[#0F8B8D]"
                  />
                </td>

                <td className="py-3 px-3">
                  <div className="font-bold text-[#14213D]">{item.itemName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {item.itemCode} • Category: {item.category}
                  </div>
                </td>

                <td className="py-3 px-3 text-right font-medium text-slate-600">
                  {(item.currentStock || 0).toLocaleString()} {item.uom}
                </td>

                <td className="py-3 px-3 text-right font-semibold text-red-600">
                  {(item.allocatedStock || 0).toLocaleString()} {item.uom}
                </td>

                <td className="py-3 px-3 text-right font-bold text-red-700 font-['Space_Grotesk'] text-sm">
                  {(item.shortageQty || 0).toLocaleString()} {item.uom}
                </td>

                <td className="py-3 px-3 text-right font-bold text-[#0F8B8D]">
                  {(item.suggestedOrderQty || 0).toLocaleString()} {item.uom}
                </td>

                <td className="py-3 px-3">
                  <div className="font-medium text-[#14213D]">{item.preferredSupplierName}</div>
                  <div className="text-[10px] text-slate-500">{item.leadTimeDays}d Lead • ₹{item.unitPrice}/kg</div>
                </td>

                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.priority.includes('Critical')
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.priority}
                  </span>
                </td>

                <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      showToast(`Generated Direct PO for ${item.suggestedOrderQty} ${item.uom} from ${item.preferredSupplierName}`);
                      onNavigate('poList');
                    }}
                    className="px-2.5 py-1 bg-[#14213D] hover:bg-[#1f325c] text-white rounded text-[11px] font-semibold transition"
                  >
                    1-Click PO
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
