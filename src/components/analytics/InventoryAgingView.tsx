import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Download,
  Sparkles,
  Layers,
  AlertOctagon,
  Clock,
  Package,
  TrendingDown,
  Percent,
} from 'lucide-react';
import { analyticsApi } from '../../services/analytics/analytics.api';
import { InventoryAgingItem } from '../../types/analyticsTypes';
import { FilterPanel } from './FilterPanel';
import { ExportModal } from './ExportModal';
import { ChatAssistantModal } from './ChatAssistantModal';

interface InventoryAgingViewProps {
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const InventoryAgingView: React.FC<InventoryAgingViewProps> = ({
  onNavigate,
  showToast = (_m: string) => {},
}) => {
  const [data, setData] = useState<{
    totalInventoryValue: number;
    slowMovingValue: number;
    slowMovingPercentage: number;
    bucketSummary: Record<string, number>;
    itemsCount: number;
    items: InventoryAgingItem[];
  } | null>(null);

  const [filters, setFilters] = useState({ dateRange: 'last_30_days', plantId: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getInventoryAging(filters);
      setData(res);
    } catch {
      showToast('Failed to load inventory aging');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <PieChart className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Inventory Aging &amp; Stock Velocity Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Raw polymer resin silos, masterbatches, and finished goods aging buckets (0-30, 31-60, 61-90, 91-180, &gt;180 days).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F8B8D] text-white hover:bg-[#0D787A] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI SLOB Analysis</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Valuation</span>
          </button>
        </div>
      </div>

      <FilterPanel filters={filters} onFilterChange={setFilters} />

      {/* 4 Aging Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-[#14213D] text-white rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Total Stock Valuation</div>
          <div className="text-3xl font-bold font-mono mt-1">₹{(Number(data?.totalInventoryValue || 6330850) / 100000).toFixed(2)}L</div>
          <div className="text-[11px] text-teal-300 mt-1">{data?.itemsCount || 4} Tracked SKUs across silos</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Stock (0-60 Days)</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            ₹{(((data?.bucketSummary?.days_0_30 || 0) + (data?.bucketSummary?.days_31_60 || 0)) / 100000).toFixed(2)}L
          </div>
          <div className="text-[11px] text-slate-500 mt-1">High-velocity resin turnover</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Slow-Moving (91-180 Days)</div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            ₹{((data?.bucketSummary?.days_91_180 || 992000) / 100000).toFixed(2)}L
          </div>
          <div className="text-[11px] text-amber-600 font-bold mt-1">Requires discount/utilization</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Obsolete Stock (&gt;180 Days)</div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            ₹{((data?.bucketSummary?.days_180_plus || 153000) / 100000).toFixed(2)}L
          </div>
          <div className="text-[11px] text-rose-600 font-bold mt-1">SLOB Write-off candidate</div>
        </div>
      </div>

      {/* Aging Distribution Breakdown Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Aging Bucket Valuation Breakdown
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { label: '0 - 30 Days', val: data?.bucketSummary?.days_0_30 || 2903250, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
            { label: '31 - 60 Days', val: data?.bucketSummary?.days_31_60 || 2281600, color: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-700' },
            { label: '61 - 90 Days', val: data?.bucketSummary?.days_61_90 || 0, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
            { label: '91 - 180 Days', val: data?.bucketSummary?.days_91_180 || 992000, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
            { label: '180+ Days', val: data?.bucketSummary?.days_180_plus || 153000, color: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700' },
          ].map((b, idx) => (
            <div key={idx} className={`p-4 rounded-xl border border-slate-200/80 ${b.bg} flex flex-col justify-between gap-1`}>
              <span className="text-[11px] font-bold text-slate-600">{b.label}</span>
              <span className={`text-base font-bold font-mono ${b.text}`}>₹{(b.val / 100000).toFixed(2)}L</span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${b.color}`}
                  style={{ width: `${((b.val / (data?.totalInventoryValue || 1)) * 100).toFixed(0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Item-wise Aging Details Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-amber-600" />
            <span>Detailed Material Aging &amp; Batch Traceability</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">{data?.items?.length || 0} Lots</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Material SKU / Resin Grade</th>
                <th className="px-4 py-2.5">Warehouse Location</th>
                <th className="px-4 py-2.5">Batch / Lot No</th>
                <th className="px-4 py-2.5 text-right">Quantity (KG)</th>
                <th className="px-4 py-2.5 text-center">Age (Days)</th>
                <th className="px-4 py-2.5 text-center">Aging Bucket</th>
                <th className="px-4 py-2.5 text-right">Total Valuation (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{item.itemId}</td>
                  <td className="px-4 py-3 text-slate-600">{item.warehouseId}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{item.batchNumber}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">{item.quantity.toLocaleString()} KG</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">{item.ageDays}d</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.agingBucket === 'DAYS_0_30' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      item.agingBucket === 'DAYS_31_60' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                      item.agingBucket === 'DAYS_91_180' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {item.agingBucket.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    ₹{item.totalValue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} reportTitle="Inventory Aging & Valuation Report" showToast={showToast} />
      <ChatAssistantModal isOpen={showChat} onClose={() => setShowChat(false)} showToast={showToast} />
    </div>
  );
};
