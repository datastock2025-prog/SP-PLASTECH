import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Building,
  Users,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  PhoneCall,
  Mail,
} from 'lucide-react';
import { LicenseSubscriptionDetails, mockLicenseDetails } from '../../data/mockAdminExtendedData';

interface AdminLicenseSubscriptionViewProps {
  showToast?: (msg: string) => void;
}

export const AdminLicenseSubscriptionView: React.FC<AdminLicenseSubscriptionViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [license, setLicense] = useState<LicenseSubscriptionDetails>(mockLicenseDetails);

  const handleCopyKey = () => {
    navigator.clipboard?.writeText(license.licenseKey);
    showToast('Enterprise License Key copied to clipboard.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <KeyRound className="w-4 h-4 text-[#0F8B8D]" />
            <span>Commercial Entitlements &amp; Software Contracts</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">License &amp; Subscription Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View active enterprise plastics suite tiers, multi-plant quotas, user seat allocation meters, and modular feature entitlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Dispatched license entitlement sync with Reboot ERP Cloud Licensing Server.')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Validate License
          </button>
        </div>
      </div>

      {/* Main License Key Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#0F8B8D]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F8B8D]/30 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                {license.tier}
              </span>
              <span className="text-xs text-slate-300">&middot; Valid Contract</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5">{license.organization}</h2>
            <div className="text-xs text-slate-400 font-mono mt-0.5">Corporate CIN: {license.customerCin}</div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Contract Expiry</span>
            <div className="text-lg font-bold text-white font-mono">{license.contractRenewal}</div>
            <span className="text-xs text-teal-300 font-semibold">{license.daysRemaining} days remaining</span>
          </div>
        </div>

        {/* License Key Box */}
        <div className="mt-6 p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-xs text-slate-200 tracking-wider font-semibold select-all">
              {license.licenseKey}
            </span>
          </div>
          <button
            onClick={handleCopyKey}
            className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Key
          </button>
        </div>
      </div>

      {/* Usage Quota Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Plants Quota */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-[#0F8B8D]" />
              Multi-Plant Entitlement
            </span>
            <span className="font-mono font-bold text-xs text-slate-900">
              {license.activePlants} / {license.maxPlantsAllowed} Plants
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#0F8B8D] h-full rounded-full"
              style={{ width: `${(license.activePlants / license.maxPlantsAllowed) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block">
            {license.maxPlantsAllowed - license.activePlants} plant licenses available for expansion
          </span>
        </div>

        {/* User Seats */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              Named User Seats
            </span>
            <span className="font-mono font-bold text-xs text-slate-900">
              {license.activeUserSeats} / {license.totalSeatsLicensed} Seats
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${(license.activeUserSeats / license.totalSeatsLicensed) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block">
            {license.concurrentLogins} active concurrent sessions today
          </span>
        </div>

        {/* Support SLA Tier */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Support SLA Tier
            </span>
            <span className="font-bold text-xs text-emerald-700">Mission Critical</span>
          </div>
          <p className="text-xs text-slate-600 font-medium">{license.supportSlaTier}</p>
          <div className="text-[11px] text-slate-500 pt-1">
            TAM: <strong className="text-slate-700">{license.dedicatedAccountManager}</strong>
          </div>
        </div>
      </div>

      {/* Licensed Modules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Licensed Industry Modules &amp; Subscribed Add-ons
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {license.licensedModules.map((mod) => (
            <div key={mod.name} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/80">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-slate-900">{mod.name}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[11px] text-slate-500 font-mono">Licensed through {mod.expiry}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    mod.status === 'Active'
                      ? 'bg-teal-50 text-[#0F8B8D] border border-teal-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {mod.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
