import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Download,
  Sparkles,
  Clock,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { analyticsApi } from '../../services/analytics/analytics.api';
import { MaintenanceMetricItem } from '../../types/analyticsTypes';
import { FilterPanel } from './FilterPanel';
import { ExportModal } from './ExportModal';
import { ChatAssistantModal } from './ChatAssistantModal';

interface MaintenanceMtbfViewProps {
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const MaintenanceMtbfView: React.FC<MaintenanceMtbfViewProps> = ({
  onNavigate,
  showToast = (_m: string) => {},
}) => {
  const [data, setData] = useState<{
    meanTimeBetweenFailuresHours: number;
    meanTimeToRepairHours: number;
    preventiveMaintenanceAdherence: number;
    totalBreakdownCostYTD: number;
    pressFleetAvailability: number;
    metrics: MaintenanceMetricItem[];
  } | null>(null);

  const [filters, setFilters] = useState({ dateRange: 'last_30_days', plantId: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getMaintenanceMetrics(filters);
      setData(res);
    } catch {
      showToast('Failed to load maintenance metrics');
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
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Maintenance MTBF &amp; MTTR Asset Reliability
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mean Time Between Failures (MTBF), Mean Time To Repair (MTTR), and Preventive Maintenance (PM) compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F8B8D] text-white hover:bg-[#0D787A] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Predictive Health</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export MTBF Log</span>
          </button>
        </div>
      </div>

      <FilterPanel filters={filters} onFilterChange={setFilters} />

      {/* 4 Asset Reliability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-800 text-white rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">MTBF (Mean Time Between Failures)</div>
          <div className="text-3xl font-bold font-mono mt-1">{data?.meanTimeBetweenFailuresHours || 248.5} Hours</div>
          <div className="text-[11px] text-purple-200 mt-1">Target &ge; 240.0 Hours (+3.5%)</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MTTR (Mean Time To Repair)</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{data?.meanTimeToRepairHours || 2.14} Hours</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">-0.36 hrs vs SLA threshold</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PM Work Order Compliance</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{data?.preventiveMaintenanceAdherence || 96.2}%</div>
          <div className="text-[11px] text-slate-500 mt-1">142/147 Preventive Work Orders completed</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Breakdown Repair Cost (YTD)</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">₹{(Number(data?.totalBreakdownCostYTD || 345000) / 100000).toFixed(2)}L</div>
          <div className="text-[11px] text-slate-500 mt-1">Mechanical, Hydraulic &amp; Mold Spares</div>
        </div>
      </div>

      {/* Machine Reliability Records */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-purple-600" />
            <span>Machine Reliability Telemetry (MTBF / MTTR by Press)</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Plant 01 Fleet</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Press / Asset Ref</th>
                <th className="px-4 py-2.5 text-right">Operating Time (Hrs)</th>
                <th className="px-4 py-2.5 text-center">Failures</th>
                <th className="px-4 py-2.5 text-center">MTBF (Hrs)</th>
                <th className="px-4 py-2.5 text-center">MTTR (Hrs)</th>
                <th className="px-4 py-2.5 text-center">Availability</th>
                <th className="px-4 py-2.5 text-right">Maint. Cost (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.metrics?.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{m.machineId}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">{m.totalOperatingTime}h</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-amber-600">{m.numberOfFailures}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {m.mtbf}h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">{m.mttr}h</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600">{m.availability}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    ₹{m.maintenanceCost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} reportTitle="Maintenance MTBF & MTTR Audit" showToast={showToast} />
      <ChatAssistantModal isOpen={showChat} onClose={() => setShowChat(false)} showToast={showToast} />
    </div>
  );
};
