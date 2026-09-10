import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Building,
  RefreshCw,
} from 'lucide-react';
import { SupplierMaster } from '../../types/procurement';

interface Props {
  suppliers: SupplierMaster[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const SupplierRiskComplianceView: React.FC<Props> = ({
  suppliers,
  onNavigate,
  showToast,
}) => {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Supplier Risk & Statutory Compliance Matrix
          </h1>
          <p className="text-xs text-slate-500">
            Monitor single-source resin dependencies, ISO/FDA certification renewal deadlines, and financial credit limits
          </p>
        </div>

        <button
          onClick={() => showToast('Compliance audit reminders sent to 3 suppliers with upcoming expiries')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Broadcast Renewal Notices
        </button>
      </div>

      {/* 3 Risk KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500 font-medium">Single-Source Material Risks</div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-amber-600">2 SKUs</div>
          <div className="text-[11px] text-slate-400">POM Delrin 500P & Medical PP</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500 font-medium">Upcoming Cert Expiries (&lt; 60d)</div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-red-600">1 Vendor</div>
          <div className="text-[11px] text-slate-400">Avient Masterbatch FDA 21 CFR</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500 font-medium">Average ESG Compliance Score</div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700">89.4 / 100</div>
          <div className="text-[11px] text-slate-400">Zero child-labor & zero RoHS non-compliance</div>
        </div>
      </div>

      {/* Compliance Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-sm text-[#14213D]">Statutory Certifications & Risk Heatmap</h3>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b">
            <tr>
              <th className="py-3 px-4 font-semibold">Supplier Name</th>
              <th className="py-3 px-4 font-semibold">Polymer Category</th>
              <th className="py-3 px-4 font-semibold">Active Certifications</th>
              <th className="py-3 px-4 font-semibold">Risk Rating</th>
              <th className="py-3 px-4 font-semibold text-right">Credit Limit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(suppliers || []).map((sup) => (
              <tr key={sup.id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <div className="font-bold text-[#14213D]">{sup.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{sup.code}</div>
                </td>
                <td className="py-3 px-4 text-slate-600">{sup.category}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {(sup.certifications || []).map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                        {c.name} (Exp: {c.expiryDate})
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    sup.riskScore === 'Low'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sup.riskScore === 'Medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {sup.riskScore || 'Low'} Risk
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                  ₹{((sup.creditLimit || 0) / 100000).toFixed(2)} Lakhs
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
