import React, { useState, useEffect } from 'react';
import {
  Truck,
  Download,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Building2,
  Clock,
  DollarSign,
  Award,
} from 'lucide-react';
import { analyticsApi } from '../../services/analytics/analytics.api';
import { ScmKpiItem } from '../../types/analyticsTypes';
import { FilterPanel } from './FilterPanel';
import { ExportModal } from './ExportModal';
import { ChatAssistantModal } from './ChatAssistantModal';

interface ScmPerformanceViewProps {
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const ScmPerformanceView: React.FC<ScmPerformanceViewProps> = ({
  onNavigate,
  showToast = (_m: string) => {},
}) => {
  const [data, setData] = useState<{
    supplierOTIF: number;
    orderFulfillmentRate: number;
    averageLeadTimeDays: number;
    purchasePriceVariance: number;
    topVendors: Array<{ name: string; otif: number; qualityRating: number; spendYTD: number }>;
    kpis: ScmKpiItem[];
  } | null>(null);

  const [filters, setFilters] = useState({ dateRange: 'last_30_days', plantId: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getScmPerformance(filters);
      setData(res);
    } catch {
      showToast('Failed to load supply chain metrics');
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
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Supply Chain Performance &amp; Vendor OTIF
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supplier On-Time In-Full (OTIF), Purchase Price Variance (PPV), and polymer resin delivery lead times.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F8B8D] text-white hover:bg-[#0D787A] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI SCM Forecast</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SCM Report</span>
          </button>
        </div>
      </div>

      <FilterPanel filters={filters} onFilterChange={setFilters} />

      {/* 4 Supply Chain Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Overall Supplier OTIF</div>
          <div className="text-3xl font-bold font-mono mt-1">{data?.supplierOTIF || 96.4}%</div>
          <div className="text-[11px] text-blue-200 mt-1">Target 95.0% (+1.4% Variance)</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Order Fulfillment Rate</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{data?.orderFulfillmentRate || 98.1}%</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Customer SLA &ge; 98.0%</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Inbound Lead Time</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{data?.averageLeadTimeDays || 14.2} Days</div>
          <div className="text-[11px] text-slate-500 mt-1">-0.8 days vs standard SLA</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Purchase Price Variance (PPV)</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{data?.purchasePriceVariance || -1.4}%</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Favorable cost procurement</div>
        </div>
      </div>

      {/* Top Strategic Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Strategic Polymer Suppliers Scorecard (OTIF &amp; Quality Rating)</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Approved Vendor List (AVL)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Supplier Name</th>
                <th className="px-4 py-2.5 text-center">OTIF Delivery %</th>
                <th className="px-4 py-2.5 text-center">Quality Rating</th>
                <th className="px-4 py-2.5 text-right">Spend YTD (₹)</th>
                <th className="px-4 py-2.5 text-center">Vendor Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.topVendors?.map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{v.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {v.otif}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600">{v.qualityRating}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    ₹{(v.spendYTD / 100000).toFixed(2)}L
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F8B8D] border border-teal-200">
                      Tier 1 Strategic
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} reportTitle="Supply Chain Performance Report" showToast={showToast} />
      <ChatAssistantModal isOpen={showChat} onClose={() => setShowChat(false)} showToast={showToast} />
    </div>
  );
};
