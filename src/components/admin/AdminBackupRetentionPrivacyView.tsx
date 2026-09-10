import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
  Lock,
  Clock,
  HardDrive,
  RefreshCw,
  Download,
  AlertTriangle,
  FileText,
  UserX,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { DataRetentionPolicy, mockRetentionPolicies } from '../../data/mockAdminExtendedData';

interface AdminBackupRetentionPrivacyViewProps {
  showToast?: (msg: string) => void;
}

export const AdminBackupRetentionPrivacyView: React.FC<AdminBackupRetentionPrivacyViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [policies, setPolicies] = useState<DataRetentionPolicy[]>(mockRetentionPolicies);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleTriggerBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      showToast('Disaster Recovery Snapshot (PostgreSQL WAL + S3 Vault) completed successfully.');
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
            <span>Business Continuity &amp; Statutory Compliance</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Backup, Retention, and Data Privacy Screen</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage WORM immutable backups for GST invoices, automated cold storage retention, and Digital Personal Data Protection (DPDP) Act anonymization rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Dispatched automated retention purge audit run.')}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Run Retention Audit
          </button>
          <button
            onClick={handleTriggerBackup}
            disabled={isBackingUp}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
            {isBackingUp ? 'Snapshotting...' : 'Create Instant BCP Snapshot'}
          </button>
        </div>
      </div>

      {/* Snapshot Health Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Latest Full Snapshot</span>
          <span className="font-mono text-sm font-bold text-slate-900 mt-1 block">2026-09-05 02:00 AM IST</span>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> Point-in-Time Recovery Active
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Backup Target Location</span>
          <span className="font-mono text-sm font-bold text-slate-900 mt-1 block">AWS S3 Mumbai + Hyderabad</span>
          <span className="text-[11px] text-indigo-600 font-medium mt-1 block">Geo-Redundant Multi-AZ</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">WORM Immutability</span>
          <span className="font-mono text-sm font-bold text-slate-900 mt-1 block">Enabled (Object Lock)</span>
          <span className="text-[11px] text-teal-600 font-medium mt-1 block">Sec 36 GST Compliance</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">DPDP Privacy Mode</span>
          <span className="font-mono text-sm font-bold text-slate-900 mt-1 block">PII Pseudonymized</span>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Auto-masking upon exit</span>
        </div>
      </div>

      {/* Retention Policies Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Statutory Data Lifecycle &amp; Retention Policies
          </h2>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="py-3 px-4">Data Domain</th>
              <th className="py-3 px-4">Statutory Basis</th>
              <th className="py-3 px-4">Retention Window</th>
              <th className="py-3 px-4">Storage Tier</th>
              <th className="py-3 px-4">Auto-Purge</th>
              <th className="py-3 px-4">PII Anonymize</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {policies.map((pol) => (
              <tr key={pol.id} className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-bold text-slate-900">{pol.dataDomain}</td>
                <td className="py-3 px-4 text-slate-600">{pol.legalBasis}</td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">{pol.retentionPeriod}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{pol.backupTarget}</td>
                <td className="py-3 px-4">
                  {pol.autoPurgeEnabled ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Auto-Purge On
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      Permanent WORM
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {pol.anonymizePii ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <UserX className="w-3 h-3" /> Yes (DPDP)
                    </span>
                  ) : (
                    <span className="text-slate-400">N/A</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => showToast(`Configuring retention parameters for ${pol.dataDomain}.`)}
                    className="text-xs font-semibold text-[#0F8B8D] hover:underline"
                  >
                    Edit Policy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
