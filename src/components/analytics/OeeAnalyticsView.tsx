import React, { useState, useEffect } from 'react';
import {
  Activity,
  Download,
  RefreshCw,
  Sparkles,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { analyticsApi } from '../../services/analytics/analytics.api';
import { OeeRecordItem, OeeLossParetoItem } from '../../types/analyticsTypes';
import { FilterPanel } from './FilterPanel';
import { ExportModal } from './ExportModal';
import { ChatAssistantModal } from './ChatAssistantModal';

interface OeeAnalyticsViewProps {
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const OeeAnalyticsView: React.FC<OeeAnalyticsViewProps> = ({
  onNavigate,
  showToast = (_m: string) => {},
}) => {
  const [data, setData] = useState<{
    overallOee: number;
    availability: number;
    performance: number;
    quality: number;
    totalProduction: number;
    goodParts: number;
    scrapCount: number;
    records: OeeRecordItem[];
  } | null>(null);

  const [paretoData, setParetoData] = useState<OeeLossParetoItem[]>([]);
  const [filters, setFilters] = useState({ dateRange: 'last_30_days', plantId: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, paretoRes] = await Promise.all([
        analyticsApi.getOeeMetrics(filters),
        analyticsApi.getLossPareto(filters),
      ]);
      setData(res);
      setParetoData(paretoRes.paretoData);
    } catch {
      showToast('Failed to load OEE records');
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
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              OEE Analytics &amp; 6 Big Losses Pareto
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Overall Equipment Effectiveness breakdown (Availability &times; Performance &times; Quality) across injection molding fleet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F8B8D] text-white hover:bg-[#0D787A] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Loss Insights</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export OEE</span>
          </button>
        </div>
      </div>

      <FilterPanel filters={filters} onFilterChange={setFilters} />

      {/* OEE 4 Formula Factors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-teal-500 to-[#0F8B8D] text-white rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-bold text-teal-100 uppercase tracking-wider">Overall Plant OEE</div>
          <div className="text-3xl font-bold font-mono mt-1">{data?.overallOee || 84.6}%</div>
          <div className="text-[11px] text-teal-100 mt-1">World Class Standard: &ge;85.0%</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">1. Availability Rate</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{data?.availability || 91.2}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Operating: 437.7m &bull; Downtime: 42.3m</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">2. Performance Efficiency</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{data?.performance || 94.2}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Ideal Cycle: 18.5s &bull; Actual: 19.6s</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">3. Quality Yield</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{data?.quality || 98.4}%</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">{data?.goodParts || 4139} Good / {data?.scrapCount || 71} Rejects</div>
        </div>
      </div>

      {/* 6 Big Losses Pareto Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>6 Big Losses Pareto Ranking (80/20 Stoppage Hours)</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Prioritized root causes for unplanned press unavailability.</p>
          </div>
          <span className="text-xs font-bold text-slate-700 font-mono">Total Loss: 111.3 Hours</span>
        </div>

        <div className="space-y-3">
          {paretoData.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span>{item.category}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    item.lossType === 'AVAILABILITY' ? 'bg-amber-100 text-amber-800' : item.lossType === 'PERFORMANCE' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {item.lossType}
                  </span>
                </span>
                <span className="font-mono text-slate-600 font-bold">{item.lossHours} hrs ({item.percentage}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.lossType === 'AVAILABILITY' ? 'bg-[#E8622C]' : item.lossType === 'PERFORMANCE' ? 'bg-[#0F8B8D]' : 'bg-rose-500'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Machine Telemetry List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#0F8B8D]" />
            <span>Machine Fleet Real-time OEE Telemetry</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">{data?.records?.length || 0} Presses Monitored</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Press / Machine ID</th>
                <th className="px-4 py-2.5">Shift</th>
                <th className="px-4 py-2.5 text-center">Availability</th>
                <th className="px-4 py-2.5 text-center">Performance</th>
                <th className="px-4 py-2.5 text-center">Quality</th>
                <th className="px-4 py-2.5 text-center">Calculated OEE</th>
                <th className="px-4 py-2.5 text-right">Good Parts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.records?.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{rec.machineId}</td>
                  <td className="px-4 py-3 text-slate-600">{rec.shift}</td>
                  <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">{rec.availability}%</td>
                  <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">{rec.performance}%</td>
                  <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">{rec.quality}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F8B8D] border border-teal-200">
                      {rec.oee}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700 font-bold">
                    {rec.goodCount.toLocaleString()} / {rec.totalCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} reportTitle="OEE & Loss Pareto Report" showToast={showToast} />
      <ChatAssistantModal isOpen={showChat} onClose={() => setShowChat(false)} showToast={showToast} />
    </div>
  );
};
