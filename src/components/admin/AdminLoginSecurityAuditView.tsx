import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Laptop,
  Clock,
  Key,
  Ban,
  Download,
  RefreshCw,
} from 'lucide-react';
import { SecurityLoginAuditRecord, mockLoginAuditRecords } from '../../data/mockAdminExtendedData';

interface AdminLoginSecurityAuditViewProps {
  showToast?: (msg: string) => void;
}

export const AdminLoginSecurityAuditView: React.FC<AdminLoginSecurityAuditViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [records, setRecords] = useState<SecurityLoginAuditRecord[]>(mockLoginAuditRecords);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filtered = records.filter((r) => {
    const matchSearch =
      r.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.ipAddress.includes(search) ||
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'ALL' || r.riskScore === riskFilter;
    return matchSearch && matchRisk;
  });

  const handleBlockIp = (ip: string) => {
    showToast(`IP ${ip} added to perimeter firewall blocklist.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Cybersecurity Telemetry &amp; Access Forensics</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Login &amp; Security Audit Screen</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time login sessions, MFA verification challenges, failed password attempts, and anomalous brute-force attacks across shopfloor kiosks and administrative consoles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Exported security access forensic logs (CSV).')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Trail
          </button>
          <button
            onClick={() => showToast('Refreshed real-time login audit stream.')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Live Refresh
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by IP, email, username, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Risk Filter:</span>
          {['ALL', 'Low', 'Medium', 'High'].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                riskFilter === r
                  ? 'bg-[#0F8B8D] text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Security Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Identity / Email</th>
              <th className="py-3 px-4">IP Address &amp; Location</th>
              <th className="py-3 px-4">Auth Method</th>
              <th className="py-3 px-4">Event Outcome</th>
              <th className="py-3 px-4">Risk</th>
              <th className="py-3 px-4 text-right">Defense Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{rec.timestamp}</td>
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{rec.fullName}</div>
                  <div className="text-[11px] text-slate-500">{rec.userEmail}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-mono text-slate-800 font-semibold">{rec.ipAddress}</div>
                  <div className="text-[10px] text-slate-400">{rec.geoLocation}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 text-[10px]">
                    {rec.authMethod}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.status === 'Successful Login'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : rec.status === 'MFA Challenge Failed'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-100 text-rose-700 border border-rose-200 font-mono'
                    }`}
                  >
                    {rec.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      rec.riskScore === 'High'
                        ? 'bg-rose-500 text-white'
                        : rec.riskScore === 'Medium'
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rec.riskScore}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {rec.riskScore === 'High' ? (
                    <button
                      onClick={() => handleBlockIp(rec.ipAddress)}
                      className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded border border-rose-200 ml-auto"
                    >
                      <Ban className="w-3 h-3" /> Block IP
                    </button>
                  ) : (
                    <button
                      onClick={() => showToast(`Session verified for ${rec.userEmail}.`)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Inspect
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
