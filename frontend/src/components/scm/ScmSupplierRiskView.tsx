import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Building,
  Filter,
  Search,
  ExternalLink,
  Plus,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { mockSupplierRisks } from '../../data/mockScmData';
import { SupplierRiskProfile } from '../../types/scm';

interface ScmSupplierRiskViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmSupplierRiskView: React.FC<ScmSupplierRiskViewProps> = ({ onNavigate, showToast }) => {
  const [profiles, setProfiles] = useState<SupplierRiskProfile[]>(mockSupplierRisks);
  const [selectedProfile, setSelectedProfile] = useState<SupplierRiskProfile | null>(mockSupplierRisks[0]);

  const handleAddMitigation = (supplierId: string) => {
    showToast(`Logged Mitigation Action Plan for ${supplierId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono text-xs font-semibold uppercase">
              Supplier Risk Intelligence
            </span>
            <span className="text-xs text-slate-500">· 10-Dimension Vulnerability Matrix</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Supplier Risk Profiling &amp; Dual-Sourcing Mitigation
          </h1>
          <p className="text-slate-500 text-xs">
            Evaluate resin manufacturers and masterbatch vendors across geopolitical, financial solvency, single-source dependency, and logistics vulnerability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Generated Comprehensive Supplier Risk Audit (PDF)')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#14213D] hover:bg-[#1C2B4D] text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <span>Export Risk Audit Report</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Risk Cards & Mitigation Action Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Profiles List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map((p) => (
              <div
                key={p.supplierId}
                onClick={() => setSelectedProfile(p)}
                className={`p-5 bg-white rounded-2xl border transition cursor-pointer space-y-3 ${
                  selectedProfile?.supplierId === p.supplierId
                    ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/20 shadow-md'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk']">{p.supplierName}</h3>
                    <div className="text-xs text-slate-500">{p.materialCategory}</div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      p.riskLevel === 'High Risk'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : p.riskLevel === 'Medium Risk'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {p.riskLevel}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <div className="text-[10px] text-slate-400">Risk Score</div>
                    <div className="font-bold text-slate-900">{p.compositeRiskScore} / 100</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <div className="text-[10px] text-slate-400">Sole Source?</div>
                    <div className="font-bold text-rose-600">{p.singleSourceDependency ? 'YES' : 'NO'}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <div className="text-[10px] text-slate-400">Financial</div>
                    <div className="font-bold text-emerald-700">{p.financialHealthGrade}</div>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Geopolitical Stability:</span>
                    <strong className="text-slate-800">{p.geopoliticalRisk}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Alternate Supplier:</span>
                    <strong className="text-[#0F8B8D]">{p.alternateSupplierAvailable ? 'Qualified Available' : 'NONE'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Supplier Risk Breakdown & Mitigation (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-mono text-rose-600 font-bold uppercase">
              Mitigation Command Plan
            </span>
            <h3 className="font-bold text-base text-[#14213D] font-['Space_Grotesk'] mt-0.5">
              {selectedProfile?.supplierName}
            </h3>
            <p className="text-xs text-slate-500">{selectedProfile?.materialCategory}</p>
          </div>

          {selectedProfile && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 text-rose-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Primary Risk Factors</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {selectedProfile.singleSourceDependency
                    ? 'Single-source dependency with 28-day ocean transit lead time through Red Sea shipping corridor.'
                    : 'Multiple local distributors available, but vulnerable to petrochemical feedstock price swings.'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800 font-['Space_Grotesk'] uppercase text-[11px]">
                  Active Mitigation Action Plan
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 leading-relaxed">
                  {selectedProfile.mitigationPlan}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>ESG Compliance Score:</span>
                  <strong className="text-emerald-700 font-mono">{selectedProfile.esgCompliancePct}%</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Audit Frequency:</span>
                  <strong className="text-slate-800">Bi-Annual (On-Site)</strong>
                </div>
              </div>

              <button
                onClick={() => handleAddMitigation(selectedProfile.supplierId)}
                className="w-full py-2.5 bg-[#E8622C] hover:bg-[#d45422] text-white rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Update Dual-Sourcing Action</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
