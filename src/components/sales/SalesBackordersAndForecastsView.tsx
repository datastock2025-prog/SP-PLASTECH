import React, { useState } from 'react';
import {
  Clock,
  TrendingUp,
  Search,
  CheckCircle,
  AlertTriangle,
  Layers,
  BarChart3,
  Sparkles,
  Calendar,
} from 'lucide-react';
import {
  SALES_BACKORDERS,
  SALES_FORECAST_DATA,
  BackorderRecord,
  SalesForecastRecord,
} from '../../data/salesData';
import { SalesStatusBadge } from './SalesStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  showToast: (msg: string) => void;
}

export const SalesBackordersAndForecastsView: React.FC<Props> = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState<'Backorders' | '12-Month Forecasts'>('Backorders');
  const [backorders, setBackorders] = useState<BackorderRecord[]>(SALES_BACKORDERS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.ceil(backorders.length / pageSize) || 1;
  const pagedBackorders = backorders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-[#E8622C]">
            <span>Supply Chain &middot; Demand Planning</span>
          </div>
          <h1 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-0.5">
            Backorders &amp; 12-Month Sales Forecasts
          </h1>
          <p className="text-xs text-[#6B7280]">
            Resin inventory shortages, linked replenishment work orders, demand forecasts, and capacity allocation.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E0D6]">
        {(['Backorders', '12-Month Forecasts'] as const).map((t) => (
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

      {/* Tab 1: Backorders */}
      {activeTab === 'Backorders' && (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#14213D]">Open Backorders &amp; Replenishment Staging</h2>
            <button
              onClick={() => showToast('Allocated available buffer inventory')}
              className="px-3 py-1 rounded bg-[#0F8B8D] text-white text-xs font-semibold shadow-xs"
            >
              Auto-Allocate Buffer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
                  <th className="p-3">Backorder ID</th>
                  <th className="p-3">SO &amp; Customer</th>
                  <th className="p-3">Item / Resin</th>
                  <th className="p-3 text-right">Shortage Qty</th>
                  <th className="p-3">Supply Source</th>
                  <th className="p-3">Feasible Date</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {pagedBackorders.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-[#0F8B8D]">{b.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-[#14213D]">{b.customer}</div>
                      <div className="text-[10px] font-mono text-[#6B7280]">SO: {b.soId}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-[#14213D]">{b.itemName}</div>
                      <div className="text-[10px] font-mono text-[#6B7280]">{b.item}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600">
                      {b.shortageQty.toLocaleString()} {b.uom}
                    </td>
                    <td className="p-3 font-mono text-[#14213D]">
                      {b.supplySource.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 font-mono font-semibold text-emerald-700">{b.feasibleDate}</td>
                    <td className="p-3 text-center">
                      <SalesStatusBadge status={b.status} size="xs" />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setBackorders((prev) =>
                            prev.map((item) =>
                              item.id === b.id ? { ...item, status: 'fully_allocated' } : item
                            )
                          );
                          showToast(`Shortage ${b.id} allocated from new stock`);
                        }}
                        className="px-2.5 py-1 rounded bg-[#F6F4EF] hover:bg-[#E4E0D6] text-[#14213D] font-semibold text-[11px] border border-[#E4E0D6]"
                      >
                        Allocate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            totalItems={backorders.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="backorders"
          />
        </div>
      )}

      {/* Tab 2: 12-Month Forecasts */}
      {activeTab === '12-Month Forecasts' && (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#14213D]">
              Customer &amp; Product 12-Month Demand Forecast Projections
            </h2>
            <div className="text-xs text-[#6B7280] font-mono">FY 2026-2027 Planning Cycle</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
                  <th className="p-3">Customer</th>
                  <th className="p-3">Product Item</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Forecast Month</th>
                  <th className="p-3 text-right">Forecast Qty</th>
                  <th className="p-3 text-right">Actual Ordered</th>
                  <th className="p-3 text-right">Accuracy</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {SALES_FORECAST_DATA.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-[#14213D]">{f.customer}</td>
                    <td className="p-3 font-mono text-[#14213D]">{f.item}</td>
                    <td className="p-3 text-[#6B7280]">{f.category}</td>
                    <td className="p-3 font-mono text-[#6B7280]">{f.forecastMonth}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                      {f.forecastQty.toLocaleString()} {f.uom}
                    </td>
                    <td className="p-3 text-right font-mono text-[#0F8B8D] font-semibold">
                      {f.actualOrderQty > 0 ? `${f.actualOrderQty.toLocaleString()} ${f.uom}` : '—'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      {f.accuracyPct}%
                    </td>
                    <td className="p-3 text-center">
                      <span className="badge teal">{f.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
