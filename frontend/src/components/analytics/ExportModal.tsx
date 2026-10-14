import React, { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, FileCode, CheckCircle2, ShieldCheck } from 'lucide-react';
import { analyticsApi } from '../../services/analytics/analytics.api';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle?: string;
  templateId?: string;
  filters?: any;
  showToast?: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  reportTitle = 'Executive Analytics Report',
  templateId = 'TMPL-OEE-001',
  filters = {},
  showToast = (_m: string) => {},
}) => {
  const [format, setFormat] = useState<'PDF' | 'EXCEL' | 'CSV' | 'JSON'>('PDF');
  const [includeAuditSummary, setIncludeAuditSummary] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen) return null;

  const handleExecuteExport = async () => {
    setIsExporting(true);
    try {
      await analyticsApi.exportDocument(templateId, {
        format,
        filters,
        customizations: { includeAuditSummary },
      });
      setExportComplete(true);
      showToast(`Exported ${reportTitle} as ${format} successfully`);
      setTimeout(() => {
        setIsExporting(false);
        setExportComplete(false);
        onClose();
      }, 1200);
    } catch {
      setIsExporting(false);
      showToast('Export failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-[#0F8B8D]" />
              <span>Export Report &amp; Data Artifact</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px]">
              {reportTitle}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Select Export Format</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'PDF', label: 'PDF Document', desc: 'Formatted Executive Brief', icon: FileText, color: 'text-rose-600 bg-rose-50 border-rose-200' },
                { id: 'EXCEL', label: 'Excel (.xlsx)', desc: 'Full Multi-Sheet Workbook', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                { id: 'CSV', label: 'Raw CSV', desc: 'Normalized Flat Rows', icon: FileSpreadsheet, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                { id: 'JSON', label: 'Raw JSON', desc: 'Structured API Payload', icon: FileCode, color: 'text-purple-600 bg-purple-50 border-purple-200' },
              ].map((f) => {
                const Icon = f.icon;
                const isSelected = format === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id as any)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-[#0F8B8D] bg-teal-50/50 shadow-xs ring-1 ring-[#0F8B8D]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${f.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{f.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{f.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAuditSummary}
                onChange={(e) => setIncludeAuditSummary(e.target.checked)}
                className="rounded border-slate-300 text-[#0F8B8D] focus:ring-[#0F8B8D]"
              />
              <span className="font-medium">Attach cryptographic audit trail &amp; digital signature</span>
            </label>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Compliant with IATF 16949 &amp; ISO 9001:2015 traceability requirements.</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteExport}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E8622C] text-white hover:bg-[#d45422] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {exportComplete ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Exported!</span>
                </>
              ) : isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Generating Artifact...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Generate &amp; Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
