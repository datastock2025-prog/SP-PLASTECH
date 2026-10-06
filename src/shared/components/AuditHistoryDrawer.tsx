import React, { useState, useMemo } from 'react';
import {
  History,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlusCircle,
  FileEdit,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';
import { EntityDrawer } from './EntityDrawer';

export interface AuditRecord {
  id?: string;
  timestamp?: string | number;
  entityType: string;
  entityCode: string;
  entityName?: string;
  action: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'DELETE' | string;
  changedBy: string;
  approvedBy?: string;
  userRole?: string;
  changeSummary: string;
  diff?: Record<string, { before: any; after: any }>;
}

export interface AuditHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: string;
  entityCode?: string;
  entityName?: string;
  records: AuditRecord[];
  isLoading?: boolean;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; badgeClass: string; borderClass: string }
> = {
  CREATE: {
    label: 'Created',
    icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    borderClass: 'border-emerald-500',
  },
  UPDATE: {
    label: 'Updated',
    icon: <FileEdit className="w-3.5 h-3.5 text-indigo-600" />,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
    borderClass: 'border-indigo-500',
  },
  APPROVE: {
    label: 'Approved',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
    borderClass: 'border-teal-500',
  },
  REJECT: {
    label: 'Rejected',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    borderClass: 'border-rose-500',
  },
  DELETE: {
    label: 'Deleted',
    icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
    badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
    borderClass: 'border-red-500',
  },
};

export const AuditHistoryDrawer: React.FC<AuditHistoryDrawerProps> = ({
  isOpen,
  onClose,
  entityType,
  entityCode,
  entityName,
  records = [],
  isLoading = false,
}) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRecords = useMemo(() => {
    let list = [...records];
    if (filterAction !== 'ALL') {
      list = list.filter((r) => r.action.toUpperCase() === filterAction);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.changeSummary?.toLowerCase().includes(q) ||
          r.changedBy?.toLowerCase().includes(q) ||
          r.entityCode?.toLowerCase().includes(q) ||
          r.action?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, filterAction, searchQuery]);

  return (
    <EntityDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Trail & Change History"
      subtitle={
        entityCode
          ? `Immutable enterprise governance ledger for ${entityName ? `${entityName} (${entityCode})` : entityCode}`
          : 'Immutable enterprise governance ledger'
      }
      entityCode={entityCode}
      statusBadge={{
        label: `${records.length} Events`,
        variant: 'info',
      }}
      width="xl"
    >
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within audit log..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Created</option>
            <option value="UPDATE">Updated</option>
            <option value="APPROVE">Approved</option>
            <option value="REJECT">Rejected</option>
            <option value="DELETE">Deleted</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      {isLoading ? (
        <div className="space-y-4 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No audit records found</p>
          <p className="text-xs text-slate-400 mt-1">Changes made to this entity will be recorded here automatically</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {filteredRecords.map((rec, idx) => {
            const actionKey = (rec.action || 'UPDATE').toUpperCase();
            const config = ACTION_CONFIG[actionKey] || ACTION_CONFIG.UPDATE;
            const recordTime = rec.timestamp
              ? new Date(rec.timestamp).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Recent';

            return (
              <div key={rec.id || idx} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  {config.icon}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                  {/* Top line: Action badge + Actor + Timestamp */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
                        {config.label}
                      </span>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {rec.changedBy}
                      </span>
                      {rec.userRole && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-400 uppercase font-mono">
                          {rec.userRole}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {recordTime}
                    </span>
                  </div>

                  {/* Summary */}
                  <p
                    className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: rec.changeSummary }}
                  />

                  {/* Approval note if any */}
                  {rec.approvedBy && (
                    <div className="text-[11px] text-teal-600 dark:text-teal-400 flex items-center gap-1.5 pt-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Approved by <strong>{rec.approvedBy}</strong></span>
                    </div>
                  )}

                  {/* Diff Inspector */}
                  {rec.diff && Object.keys(rec.diff).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/80">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Field-Level Changes
                      </p>
                      <div className="space-y-1 bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
                        {Object.entries(rec.diff).map(([field, delta]: [string, any]) => (
                          <div key={field} className="grid grid-cols-3 gap-2 py-0.5 items-center">
                            <span className="text-slate-500 font-sans font-medium">{field}:</span>
                            <span className="text-rose-600 dark:text-rose-400 line-through truncate">
                              {String(delta?.before ?? 'none')}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                              → {String(delta?.after ?? 'none')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </EntityDrawer>
  );
};
