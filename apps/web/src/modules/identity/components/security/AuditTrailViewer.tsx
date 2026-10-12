import React, { useEffect, useState, useMemo } from 'react';
import { SecurityEventLogger } from '../logging/SecurityEventLogger';
import { SecurityEvent } from '../types';
import { secureExportData } from '../privacy/secureExport';
import { useAuth } from '../auth/AuthProvider';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  RefreshCw,
  AlertTriangle,
  Info,
  Flame,
  User,
  Clock,
} from 'lucide-react';

export const AuditTrailViewer: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'CRITICAL'>('ALL');

  useEffect(() => {
    // Initial fetch of in-memory logs
    setEvents(SecurityEventLogger.getRecentLogs(200));

    // Subscribe to live logs
    const unsubscribe = SecurityEventLogger.subscribe((newEvent) => {
      setEvents((prev) => [newEvent, ...prev.slice(0, 199)]);
    });

    return () => unsubscribe();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (severityFilter !== 'ALL' && e.severity !== severityFilter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchType = e.type.toLowerCase().includes(query);
        const matchActor = e.actorId.toLowerCase().includes(query);
        const matchDetails = JSON.stringify(e.details).toLowerCase().includes(query);
        return matchType || matchActor || matchDetails;
      }
      return true;
    });
  }, [events, searchQuery, severityFilter]);

  const handleExport = (format: 'csv' | 'xlsx') => {
    const exportRows = filteredEvents.map((e) => ({
      Timestamp: e.timestamp,
      Incident_ID: e.id,
      Severity: e.severity,
      Event_Type: e.type,
      Actor_ID: e.actorId,
      Tenant_ID: e.tenantId,
      IP_Address: e.ip,
      Details: JSON.stringify(e.details),
    }));

    secureExportData(exportRows, {
      filename: `security_audit_trail_${Date.now()}`,
      format,
      classification: 'CONFIDENTIAL',
      userName: user?.name || 'Security Admin',
      userId: user?.id || 'admin_user',
      maxRows: 5000,
    });
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">Security Audit Trail & Telemetry</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident client-side security event stream with forensic forensic logging.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 my-5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events, actors, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO Only</option>
            <option value="WARN">WARN Only</option>
            <option value="CRITICAL">CRITICAL Only</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Event Type</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No security events match the current criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {evt.severity === 'CRITICAL' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <Flame className="w-3 h-3" /> CRITICAL
                      </span>
                    )}
                    {evt.severity === 'WARN' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" /> WARN
                      </span>
                    )}
                    {evt.severity === 'INFO' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <Info className="w-3 h-3" /> INFO
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                    {evt.type}
                  </td>
                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      {evt.actorId}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                    {JSON.stringify(evt.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
