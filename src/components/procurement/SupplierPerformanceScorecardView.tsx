import React, { useState } from 'react';
import {
  Award,
  Star,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Scale,
  Search,
  Filter,
  BarChart3,
  Sliders,
} from 'lucide-react';
import { SupplierMaster } from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';

interface Props {
  suppliers?: SupplierMaster[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const SupplierPerformanceScorecardView: React.FC<Props> = ({
  suppliers = [],
  onNavigate,
  showToast,
}) => {
  const safeSuppliers = suppliers || [];
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(safeSuppliers[0]?.id || 'SUP-001');

  const selectedSupplier = safeSuppliers.find((s) => s.id === selectedSupplierId) || safeSuppliers[0] || {
    id: 'SUP-001',
    code: 'VEND-001',
    name: 'Reliance Polymers Limited',
    category: 'Virgin Polymer Resin',
    status: 'active',
    riskScore: 'Low',
    rating: 4.8,
    paymentTerms: 'Net 30 Days',
    leadTimeDays: 7,
    creditLimit: 2500000,
    certifications: [],
    scorecard: {
      overallGrade: 'A+',
      overallScore: 96,
      evaluationPeriod: 'Q2 FY26-27',
      onTimeDeliveryPct: 98.2,
      qualityAcceptancePct: 99.4,
      priceCompetitivenessPct: 94.0,
      complaintResolutionDays: 2.1,
      metrics: [],
    },
  };

  const sc = selectedSupplier.scorecard || {
    overallGrade: 'A',
    overallScore: 92,
    evaluationPeriod: 'Q2 FY26-27',
    onTimeDeliveryPct: 95.0,
    qualityAcceptancePct: 98.0,
    priceCompetitivenessPct: 92.0,
    complaintResolutionDays: 3.0,
    metrics: [],
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Supplier Performance Scorecard & Evaluations
          </h1>
          <p className="text-xs text-slate-500">
            Multi-dimensional vendor evaluation: On-Time Delivery (OTD), Quality Lot Acceptance, Price Competitiveness, and ESG Compliance
          </p>
        </div>

        <button
          onClick={() => showToast('Quarterly vendor evaluation audit cycle initiated')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Award className="w-3.5 h-3.5" /> Run Audit Cycle
        </button>
      </div>

      {/* Supplier Selection Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {safeSuppliers.slice(0, 4).map((sup) => (
          <div
            key={sup.id}
            onClick={() => setSelectedSupplierId(sup.id)}
            className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
              selectedSupplier.id === sup.id
                ? 'border-[#0F8B8D] bg-white ring-2 ring-[#0F8B8D]/20 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#14213D] truncate">{sup.name}</span>
                <span className="w-6 h-6 rounded-lg bg-[#14213D] text-white text-[10px] font-bold flex items-center justify-center font-['Space_Grotesk']">
                  {sup.scorecard?.overallGrade || 'A'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{sup.category}</div>
            </div>

            <div className="flex items-center justify-between text-[11px] mt-3 pt-2 border-t border-slate-100">
              <span className="text-slate-500">Score: {sup.scorecard?.overallScore || 90}/100</span>
              <span className="font-semibold text-emerald-700">{sup.scorecard?.onTimeDeliveryPct || 95}% OTD</span>
            </div>
          </div>
        ))}
      </div>

      {/* Deep-Dive Scorecard of Selected Vendor */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D]">
                {selectedSupplier.name} ({selectedSupplier.code})
              </h2>
              <ProcurementStatusBadge status={selectedSupplier.status} />
              <span className="text-xs text-slate-500">Period: {sc.evaluationPeriod}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Category: <span className="font-semibold text-[#14213D]">{selectedSupplier.category}</span> • Payment: <span className="font-semibold">{selectedSupplier.paymentTerms}</span> • Lead Time: <span className="font-semibold">{selectedSupplier.leadTimeDays} Days</span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 self-start md:self-auto text-xs">
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Overall Grade</div>
              <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">
                Grade {sc.overallGrade}
              </div>
            </div>
            <div className="w-[1px] h-8 bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Score</div>
              <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700">
                {sc.overallScore} / 100
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars of Performance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-slate-500 flex items-center justify-between">
              <span>On-Time Delivery (OTD)</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700">
              {sc.onTimeDeliveryPct}%
            </div>
            <div className="text-[10px] text-slate-400">Target SLA: 95.0%</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-slate-500 flex items-center justify-between">
              <span>Quality Acceptance Rate</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700">
              {sc.qualityAcceptancePct}%
            </div>
            <div className="text-[10px] text-slate-400">Target SLA: 98.0%</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-slate-500 flex items-center justify-between">
              <span>Price Competitiveness</span>
              <Scale className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700">
              {sc.priceCompetitivenessPct}%
            </div>
            <div className="text-[10px] text-slate-400">Platts Benchmark Parity</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-slate-500 flex items-center justify-between">
              <span>Complaint Resolution</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">
              {sc.complaintResolutionDays} Days
            </div>
            <div className="text-[10px] text-slate-400">Avg RCA Closure Speed</div>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div>
          <h3 className="font-bold text-sm text-[#14213D] mb-3">Evaluation Dimension Weights & Measured Results</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b">
                <tr>
                  <th className="py-2.5 px-3">Evaluation Parameter</th>
                  <th className="py-2.5 px-3">Dimension</th>
                  <th className="py-2.5 px-3 text-right">Target</th>
                  <th className="py-2.5 px-3 text-right">Actual Measured</th>
                  <th className="py-2.5 px-3 text-right">Weight</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(sc.metrics || []).map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-[#14213D]">{m.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{m.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{m.target}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#14213D]">{m.actual}</td>
                    <td className="py-2.5 px-3 text-right">{m.weight}%</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {m.score} / 100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
