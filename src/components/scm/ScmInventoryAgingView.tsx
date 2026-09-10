import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingDown,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { mockInventoryAging } from '../../data/mockScmData';
import { InventoryAgingRecord } from '../../types/scm';

interface ScmInventoryAgingViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmInventoryAgingView: React.FC<ScmInventoryAgingViewProps> = ({ onNavigate, showToast }) => {
  const [records, setRecords] = useState<InventoryAgingRecord[]>(mockInventoryAging);
  const [bucketFilter, setBucketFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lotNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBucket = bucketFilter === 'All' || r.agingBucket === bucketFilter;
    return matchesSearch && matchesBucket;
  });

  const totalDeadStockValue = records
    .filter((r) => r.dispositionRecommendation === 'Scrap & Regrind' || r.dispositionRecommendation === 'Return to Vendor')
    .reduce((acc, curr) => acc + curr.totalValue, 0);

  const handleAction = (record: InventoryAgingRecord, action: string) => {
    showToast(`Executed action "${action}" for ${record.itemCode} (Lot: ${record.lotNumber || record.batchNumber})`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono text-xs font-semibold uppercase">
              FEFO &amp; Dead Stock Control
            </span>
            <span className="text-xs text-slate-500">· Aging Buckets &amp; Chemical Expiration</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Inventory Aging &amp; Shelf-Life Disposition Workbench
          </h1>
          <p className="text-slate-500 text-xs">
            Track shelf-life degradation for chemical blowing agents, flame retardants, and dead tooling spare stock across 0-30 to 180+ day aging brackets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Generated FEFO Disposition Schedule for Warehouse Team')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>Execute FEFO Picking Run</span>
          </button>
        </div>
      </div>

      {/* Aging Summary Buckets Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">0 - 30 Days (Fresh)</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-600 mt-1">
            ₹48.2 Lakh
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">High velocity active lots</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">31 - 60 Days (Normal)</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-slate-900 mt-1">
            ₹24.5 Lakh
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Standard safety stocks</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">61 - 90 Days (Slow)</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-amber-600 mt-1">
            ₹12.1 Lakh
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Priority consumption</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">91 - 180 Days (Stagnant)</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-rose-600 mt-1">
            ₹6.4 Lakh
          </div>
          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">Re-testing required</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">180+ Days (Dead Stock)</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-rose-700 mt-1">
            ₹{totalDeadStockValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-700 font-bold mt-0.5">Scrap / Write-off</div>
        </div>
      </div>

      {/* Aging Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {['All', '0-30 Days', '31-60 Days', '61-90 Days', '91-180 Days', '180+ Days'].map((b) => (
              <button
                key={b}
                onClick={() => setBucketFilter(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  bucketFilter === b ? 'bg-[#14213D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Lot, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Item / Description</th>
                <th className="p-3">Lot Number</th>
                <th className="p-3">Bin Location</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Days in Stock</th>
                <th className="p-3">Aging Bucket</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3 text-right">Value</th>
                <th className="p-3">Recommended Disposition</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{rec.itemCode}</div>
                    <div className="text-[11px] text-slate-500">{rec.itemName}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800">{rec.lotNumber}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-600">{rec.warehouseLocation}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {rec.quantity.toLocaleString()} {rec.uom}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-rose-600">{rec.daysInStock} d</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200">
                      {rec.agingBucket}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-700">
                    {rec.expiryDate ? (
                      <span className="text-amber-700 font-bold">{rec.expiryDate}</span>
                    ) : (
                      <span className="text-slate-400">Non-expiring</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    ₹{rec.totalValue.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.dispositionRecommendation === 'Scrap & Regrind'
                          ? 'bg-rose-100 text-rose-800'
                          : rec.dispositionRecommendation === 'Reprocess'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {rec.dispositionRecommendation}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleAction(rec, rec.dispositionRecommendation)}
                      className="px-2.5 py-1 bg-[#14213D] hover:bg-[#1C2B4D] text-white rounded text-[11px] font-bold transition cursor-pointer"
                    >
                      Process
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
