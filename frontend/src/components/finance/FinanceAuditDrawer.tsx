import React from 'react';
import { AuditRecord } from '../../types/financeEnterprise';
import {
  ShieldCheck,
  Clock,
  User,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface FinanceAuditDrawerProps {
  title: string;
  documentNumber: string;
  auditTrail: AuditRecord[];
  onClose: () => void;
  onExportCsv?: () => void;
}

export const FinanceAuditDrawer: React.FC<FinanceAuditDrawerProps> = ({
  title,
  documentNumber,
  auditTrail,
  onClose,
  onExportCsv,
}) => {
  const handleExport = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    const headers = 'ID,Timestamp,Action,Actor,Role,Field,OldValue,NewValue,Notes\n';
    const rows = auditTrail
      .map(
        (a) =>
          `"${a.id}","${a.timestamp}","${a.action}","${a.actor}","${a.role}","${a.field || ''}","${
            a.oldValue || ''
          }","${a.newValue || ''}","${(a.notes || '').replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Trail_${documentNumber}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header Info */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Immutable Audit Trail & Regulatory Compliance
          </div>
          <div className="font-mono text-sm font-bold text-slate-900 mt-0.5">{documentNumber}</div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-xs shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export Audit CSV
        </button>
      </div>

      {/* Compliance Stamp */}
      <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Segregation of Duties Enforced:</strong> Action timestamps, role clearance limits, and parameter
            diffs are recorded in audit logs.
          </span>
        </div>
        <span className="font-mono text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-900 font-bold">
          SOX / IATF Compliant
        </span>
      </div>

      {/* Audit List */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {auditTrail.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No audit events recorded yet for this record.</div>
        ) : (
          auditTrail.map((record, index) => (
            <div key={record.id || index} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 relative shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-[10px]">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{record.action}</span>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {record.timestamp}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <strong>{record.actor}</strong> ({record.role})
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                  {record.id}
                </span>
              </div>

              {/* Old vs New Value Comparison if available */}
              {(record.oldValue !== undefined || record.newValue !== undefined) && (
                <div className="mt-2 p-2 bg-amber-50/70 rounded border border-amber-200/80 text-[11px] grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Previous Value</span>
                    <span className="text-rose-700 font-mono font-medium line-through">{record.oldValue || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Modified Value</span>
                    <span className="text-emerald-700 font-mono font-medium flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-emerald-600 inline" />
                      {record.newValue || '—'}
                    </span>
                  </div>
                </div>
              )}

              {record.notes && (
                <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                  <strong className="text-slate-500 text-[10px] uppercase block mb-0.5">Notes / Rationale:</strong>
                  {record.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 font-medium text-xs transition"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
};
