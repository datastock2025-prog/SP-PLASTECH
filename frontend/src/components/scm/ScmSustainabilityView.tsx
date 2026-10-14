import React, { useState } from 'react';
import {
  Sparkles,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Award,
  Layers,
  Leaf,
  Zap,
  BarChart3,
  Download,
} from 'lucide-react';
import { mockSustainabilityMetrics } from '../../data/mockScmData';

interface ScmSustainabilityViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmSustainabilityView: React.FC<ScmSustainabilityViewProps> = ({ onNavigate, showToast }) => {
  const metrics = mockSustainabilityMetrics;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs font-semibold uppercase">
              Circular Economy &amp; ESG
            </span>
            <span className="text-xs text-slate-500">· Closed-Loop Regrind &amp; Carbon Accounting</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Plastic Manufacturing Sustainability &amp; ESG Intelligence
          </h1>
          <p className="text-slate-500 text-xs">
            Monitor recycled resin blend ratios, sprue/runner regrind granulator recovery, molding energy efficiency (kWh/kg), and supplier ESG audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Generated ISO 14001 & ESG Sustainability Audit Report (PDF)')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export ESG Report</span>
          </button>
        </div>
      </div>

      {/* ESG KPI Cards Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Recycled Polymer Content</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700">
            {metrics.recycledPolymerContentPct}%
          </div>
          <div className="text-[11px] text-slate-500">Target: 25% by Q4 2026</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Regrind Granulator Recovery</span>
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
            {metrics.regrindClosedLoopKg.toLocaleString()} <span className="text-xs font-normal">KG</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">100% Sprues Diverted</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Molding Energy Intensity</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
            {metrics.energyIntensityKwhPerKg} <span className="text-xs font-normal">kWh/KG</span>
          </div>
          <div className="text-[11px] text-slate-500">-8.5% vs Industry Average</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Carbon Offsets Achieved</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-purple-700">
            {metrics.carbonOffsetTons} <span className="text-xs font-normal">MT CO2e</span>
          </div>
          <div className="text-[11px] text-slate-500">Verified Green Credits</div>
        </div>
      </div>

      {/* Circular Regrind Flow & Supplier ESG Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk']">
            Closed-Loop Regrind Material Balance
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Virgin Polymer Consumption</span>
                <span className="font-mono">72,500 KG (84%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-[#14213D] h-2 rounded-full" style={{ width: '84%' }} />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl space-y-1">
              <div className="flex justify-between font-semibold text-emerald-950">
                <span>In-House Regrind Granules (Sprues/Runners)</span>
                <span className="font-mono text-emerald-700">12,400 KG (14.4%)</span>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '14.4%' }} />
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl space-y-1">
              <div className="flex justify-between font-semibold text-blue-950">
                <span>Bio-Based Additives &amp; PCR</span>
                <span className="font-mono text-blue-700">1,380 KG (1.6%)</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '1.6%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk']">
            Supplier ESG Compliance &amp; Scope 3 Footprint
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Sabic Petrochemicals (Antwerp)</div>
                <div className="text-[11px] text-slate-500">ISCC PLUS Certified Bio-Circular PP</div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold font-mono">
                94% ESG Score
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Reliance Industries (Hazira)</div>
                <div className="text-[11px] text-slate-500">Recycled PET &amp; Low-Carbon PE</div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold font-mono">
                88% ESG Score
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Clariant Chemicals Masterbatch</div>
                <div className="text-[11px] text-slate-500">Heavy-metal free FDA organic pigments</div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold font-mono">
                96% ESG Score
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
