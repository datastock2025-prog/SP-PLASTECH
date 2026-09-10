import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Scale,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SupplierPriceListEntry } from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { INITIAL_SUPPLIER_PRICE_LISTS } from '../../data/procurementData';

interface Props {
  priceLists?: SupplierPriceListEntry[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const SupplierPriceListView: React.FC<Props> = ({
  priceLists = INITIAL_SUPPLIER_PRICE_LISTS,
  onNavigate,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = priceLists.filter((pl) =>
    pl.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pl.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pl.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Indexed Raw Material Price Schedules (Platts / ICIS)
          </h1>
          <p className="text-xs text-slate-500">
            Formula-based contract pricing tied to benchmark commodity indices (Platts CFR South Asia PP & HDPE)
          </p>
        </div>

        <button
          onClick={() => showToast('Price schedule formula creator opened')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Add Price Formula
        </button>
      </div>

      {/* Grid of Price Schedules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {filtered.map((pl) => (
          <div
            key={pl.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-[#0F8B8D] transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#14213D]">{pl.itemCode}</span>
                  <ProcurementStatusBadge status={pl.status} size="xs" />
                </div>
                <h3 className="font-bold text-sm text-[#14213D] mt-1">{pl.itemName}</h3>
                <div className="text-slate-500 text-[11px]">{pl.supplierName} • Currency: {pl.currency}</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Contract Rate</div>
                <div className="text-lg font-bold font-['Space_Grotesk'] text-emerald-700">
                  ₹{pl.unitPrice.toFixed(2)} / {pl.uom}
                </div>
              </div>
            </div>

            {/* Formula Block */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
              <div className="text-amber-900 font-bold flex items-center gap-1.5 text-[11px]">
                <Scale className="w-3.5 h-3.5 text-amber-700" /> Commodity Benchmark Index
              </div>
              <div className="text-slate-700 text-[11px]">
                <strong>Index:</strong> {pl.indexReference}<br />
                <strong>Base Index Value:</strong> ₹{pl.baseIndexValue.toFixed(2)}/kg<br />
                <strong>Pricing Formula:</strong> <span className="font-mono text-amber-900 font-bold">{pl.adjustmentFormula}</span>
              </div>
            </div>

            {/* Quantity Breaks & Validity */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>Effective Period: <strong>{pl.effectiveFrom} to {pl.effectiveTo}</strong></div>
              <div>MOQ Break: <strong>{pl.moq.toLocaleString()} {pl.uom}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
