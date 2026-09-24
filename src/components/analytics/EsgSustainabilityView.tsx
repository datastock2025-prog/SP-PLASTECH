import React, { useState, useEffect } from 'react';
import {
  Layers,
  Download,
  Sparkles,
  Zap,
  TrendingDown,
  Percent,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { analyticsApi } from '../../services/analytics/analytics.api';
import { EsgMetricItem } from '../../types/analyticsTypes';
import { FilterPanel } from './FilterPanel';
import { ExportModal } from './ExportModal';
import { ChatAssistantModal } from './ChatAssistantModal';

interface EsgSustainabilityViewProps {
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const EsgSustainabilityView: React.FC<EsgSustainabilityViewProps> = ({
  onNavigate,
  showToast = (_m: string) => {},
}) => {
  const [data, setData] = useState<{
    totalCarbonFootprintTonnes: number;
    energyIntensityKwhPerKg: number;
    recycledPcrResinPercent: number;
    waterRecycledPercent: number;
    scope1Emissions: number;
    scope2Emissions: number;
    scope3Emissions: number;
    metrics: EsgMetricItem[];
  } | null>(null);

  const [filters, setFilters] = useState({ dateRange: 'last_30_days', plantId: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getEsgMetrics(filters);
      setData(res);
    } catch {
      showToast('Failed to load ESG sustainability metrics');
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
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              ESG &amp; Carbon Footprint Sustainability Suite
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scope 1, 2, 3 carbon intensity (kg CO₂e/kg molded plastic), kWh/kg energy index, and Post-Consumer Recycled (PCR) resin ratio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F8B8D] text-white hover:bg-[#0D787A] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Carbon Roadmap</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export ESG Report</span>
          </button>
        </div>
      </div>

      <FilterPanel filters={filters} onFilterChange={setFilters} />

      {/* 4 ESG Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Carbon Intensity per KG</div>
          <div className="text-3xl font-bold font-mono mt-1">{data?.energyIntensityKwhPerKg || 1.14} kg CO₂e/kg</div>
          <div className="text-[11px] text-emerald-200 mt-1">Target: &le; 1.25 (-8.8% Reduction)</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PCR Recycled Resin %</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{data?.recycledPcrResinPercent || 18.5}%</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">+3.5% vs Q2 Circular Economy Target</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Energy Intensity (kWh/Ton)</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">640 kWh/Ton</div>
          <div className="text-[11px] text-slate-500 mt-1">Servo-hydraulic press efficiency</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Carbon Emissions (YTD)</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{data?.totalCarbonFootprintTonnes || 1420.5} T</div>
          <div className="text-[11px] text-slate-500 mt-1">Scope 1 (180T) &bull; Scope 2 (920T)</div>
        </div>
      </div>

      {/* Scope 1, 2, 3 Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          GHG Protocol Scope 1, 2, 3 Emissions Breakdown
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
            <span className="text-xs font-bold text-emerald-900">Scope 1: Direct Combustion</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{data?.scope1Emissions || 180.2} Tonnes</div>
            <p className="text-[11px] text-emerald-800/80 mt-1">Natural gas dryers &amp; plant logistics diesel.</p>
          </div>

          <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/50">
            <span className="text-xs font-bold text-teal-900">Scope 2: Purchased Electricity</span>
            <div className="text-2xl font-bold font-mono text-teal-700 mt-1">{data?.scope2Emissions || 920.3} Tonnes</div>
            <p className="text-[11px] text-teal-800/80 mt-1">Grid power for 32 injection molding presses &amp; chillers.</p>
          </div>

          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
            <span className="text-xs font-bold text-blue-900">Scope 3: Upstream Polymer Resins</span>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-1">{data?.scope3Emissions || 320.0} Tonnes</div>
            <p className="text-[11px] text-blue-800/80 mt-1">Virgin PP/ABS freight and supply chain footprint.</p>
          </div>
        </div>
      </div>

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} reportTitle="ESG & Carbon Footprint Audit" showToast={showToast} />
      <ChatAssistantModal isOpen={showChat} onClose={() => setShowChat(false)} showToast={showToast} />
    </div>
  );
};
