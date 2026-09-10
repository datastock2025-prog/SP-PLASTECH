import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Cloud,
  ShieldCheck,
  Clock,
  CheckCircle2,
  HardDrive,
  Lock,
  Edit2,
  Trash2,
  FileCheck,
} from 'lucide-react';
import { DocumentSettingPolicy, mockDocumentPolicies } from '../../data/mockAdminExtendedData';

interface AdminDocumentSettingsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminDocumentSettingsView: React.FC<AdminDocumentSettingsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [policies, setPolicies] = useState<DocumentSettingPolicy[]>(mockDocumentPolicies);
  const [search, setSearch] = useState('');

  const filtered = policies.filter(
    (p) =>
      p.categoryName.toLowerCase().includes(search.toLowerCase()) ||
      p.codePrefix.toLowerCase().includes(search.toLowerCase()) ||
      p.cloudStorageBucket.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <FileText className="w-4 h-4 text-[#0F8B8D]" />
            <span>Digital Vault &amp; Regulatory Document Policies</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Document Management Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure secure cloud storage buckets, mandatory watermarking, retention periods, and approved formats for MSDS, PPAP L3, and CMM scans.
          </p>
        </div>

        <button
          onClick={() => showToast('Opened new Document Vault category wizard.')}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Document Policy
        </button>
      </div>

      {/* Grid of Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((pol) => (
          <div
            key={pol.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Prefix: {pol.codePrefix}
                  </span>
                  <h3 className="font-bold text-xs text-slate-900 mt-1.5">{pol.categoryName}</h3>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F8B8D] border border-teal-200">
                  {pol.retentionYears} Years Retention
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{pol.description}</p>

              {/* Security & Watermarking Specs */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mandatory Watermark:</span>
                  <span className="font-mono font-bold text-rose-700">{pol.mandatoryWatermark}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allowed File Extensions:</span>
                  <span className="font-mono text-slate-700">{pol.allowedExtensions.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Upload Size:</span>
                  <span className="font-mono font-semibold text-slate-800">{pol.maxFileSizeMb} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Storage Target:</span>
                  <span className="font-mono text-[11px] text-indigo-600">{pol.cloudStorageBucket}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Expiry Alert: {pol.autoExpireAlertDays} days in advance</span>
              <button
                onClick={() => showToast(`Configuring policy rules for ${pol.codePrefix}`)}
                className="font-semibold text-[#0F8B8D] hover:underline"
              >
                Configure Policy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
