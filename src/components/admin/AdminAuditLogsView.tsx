import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { AuditLogEntry } from '../../types/admin';
import { mockAuditLogs } from '../../data/mockAdminData';

interface AdminAuditLogsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminAuditLogsView: React.FC<AdminAuditLogsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [viewingDiffLog, setViewingDiffLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.resourceName.toLowerCase().includes(search.toLowerCase()) ||
      log.ipAddress.includes(search);

    const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

    return matchesSearch && matchesModule && matchesAction;
  });

  const handleExportCsv = () => {
    showToast('Immutable audit trail report generated in compliance with ISO 27001 / SOC 2.');
  };

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'APPROVE':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'REJECT':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOGIN':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PERMISSION_CHANGE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-[#0F8B8D]" />
            <span>Immutable Regulatory Audit Trail</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">System Audit Logs &amp; Forensics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Non-repudiation audit trail recording every state modification, financial sign-off, permission shift, and security event.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Audit Trail (CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by user, entity, IP..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Modules</option>
            <option value="Finance & Invoicing">Finance &amp; Invoicing</option>
            <option value="Admin & System Config">Admin &amp; System Config</option>
            <option value="Identity & Authentication">Identity &amp; Auth</option>
            <option value="Manufacturing & MES">Manufacturing &amp; MES</option>
            <option value="Procurement & Sourcing">Procurement &amp; Sourcing</option>
            <option value="Quality & Metrology">Quality &amp; Metrology</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="PERMISSION_CHANGE">PERMISSION_CHANGE</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Origin IP</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.userRole}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getActionBadge(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800 text-[11px]">{log.resourceName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {log.resourceType} &middot; {log.resourceId}
                    </div>
                  </td>

                  <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                    {log.description}
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {log.ipAddress}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {log.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center text-emerald-700 font-semibold gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-rose-700 font-semibold gap-1 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {log.changes && log.changes.length > 0 ? (
                      <button
                        onClick={() => setViewingDiffLog(log)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Diff ({log.changes.length})
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Displaying {filteredLogs.length} immutable events</span>
          <span>Retention Window: 7 Years &middot; Cryptographic Hash: SHA-256</span>
        </div>
      </div>

      {/* Modal: Diff Inspection */}
      {viewingDiffLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">State Modification Field Diff</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{viewingDiffLog.resourceName}</p>
              </div>
              <button
                onClick={() => setViewingDiffLog(null)}
                className="text-slate-400 hover:text-slate-600 text-base"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
                <span className="font-semibold text-slate-800">Executed by:</span> {viewingDiffLog.userName} ({viewingDiffLog.userRole}) at {viewingDiffLog.timestamp} from {viewingDiffLog.ipAddress}
              </div>

              <div className="space-y-2">
                {viewingDiffLog.changes?.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="font-bold font-mono text-[11px] text-slate-700 mb-1.5">{c.field}</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800">
                        <span className="block font-bold text-[9px] uppercase text-rose-600">Before</span>
                        <span className="font-mono">{String(c.oldValue ?? 'null')}</span>
                      </div>
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                        <span className="block font-bold text-[9px] uppercase text-emerald-600">After</span>
                        <span className="font-mono">{String(c.newValue ?? 'null')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
              <button
                onClick={() => setViewingDiffLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-semibold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
