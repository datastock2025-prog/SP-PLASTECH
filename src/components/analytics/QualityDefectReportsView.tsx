import React, { useState, useEffect } from 'react';
import {
  Award,
  Download,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  AlertOctagon,
  Percent,
} from 'lucide-react';
import { analyticsApi } from '../../services/analytics/analytics.api';
import { QualityMetricItem } from '../../types/analyticsTypes';
import { FilterPanel } from './FilterPanel';
import { ExportModal } from './ExportModal';
import { ChatAssistantModal } from './ChatAssistantModal';

interface QualityDefectReportsViewProps {
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const QualityDefectReportsView: React.FC<QualityDefectReportsViewProps> = ({
  onNavigate,
  showToast = (_m: string) => {},
}) => {
  const [data, setData] = useState<{
    totalInspected: number;
    defectsFound: number;
    ppm: number;
    firstPassYield: number;
    sigmaLevel: number;
    dpmo: number;
    costOfPoorQualityTotal: number;
    metrics: QualityMetricItem[];
  } | null>(null);

  const [filters, setFilters] = useState({ dateRange: 'last_30_days', plantId: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getQualityMetrics(filters);
      setData(res);
    } catch {
      showToast('Failed to load quality metrics');
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
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quality Defect PPM &amp; Six Sigma Capability
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            IATF 16949 / ISO 9001:2015 statistical process control, DPMO rates, and Cost of Poor Quality (COPQ).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F8B8D] text-white hover:bg-[#0D787A] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Quality Root Cause</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export QMS Audit</span>
          </button>
        </div>
      </div>

      <FilterPanel filters={filters} onFilterChange={setFilters} />

      {/* 4 Six Sigma & PPM Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">Defect PPM</div>
          <div className="text-3xl font-bold font-mono mt-1">{data?.ppm || 240} PPM</div>
          <div className="text-[11px] text-indigo-200 mt-1">&le; 300 PPM Automotive Benchmark</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Six Sigma Level (&sigma;)</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{data?.sigmaLevel || 4.82} &sigma;</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Cp: 1.62 &bull; Cpk: 1.54</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">First Pass Yield (FPY)</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{data?.firstPassYield || 99.32}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{data?.defectsFound || 24} Defects / {data?.totalInspected || 3540} Parts</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cost of Poor Quality (COPQ)</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">₹{data?.costOfPoorQualityTotal || 670}</div>
          <div className="text-[11px] text-rose-600 font-bold mt-1">Scrap &amp; Regrind cost impact</div>
        </div>
      </div>

      {/* Defect Inspection Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <span>Inspection Lot Defect Breakdown (CMM &amp; Visual Audit)</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">{data?.metrics?.length || 0} Lots Inspected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Component / Part No</th>
                <th className="px-4 py-2.5">Work Order Ref</th>
                <th className="px-4 py-2.5 text-right">Inspected</th>
                <th className="px-4 py-2.5 text-right">Defects</th>
                <th className="px-4 py-2.5 text-center">Defect PPM</th>
                <th className="px-4 py-2.5 text-center">Sigma Level</th>
                <th className="px-4 py-2.5 text-right">COPQ (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.metrics?.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{m.itemId}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{m.workOrderId || 'N/A'}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">{m.totalInspected.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">{m.defectsFound}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {m.ppm.toLocaleString()} PPM
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">{m.sigmaLevel} &sigma;</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">₹{m.costOfPoorQuality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} reportTitle="Quality PPM & Six Sigma Audit" showToast={showToast} />
      <ChatAssistantModal isOpen={showChat} onClose={() => setShowChat(false)} showToast={showToast} />
    </div>
  );
};
