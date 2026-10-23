import React, { useState } from 'react';
import {
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Database,
  Check,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { useDryRunImport, useCommitImport } from '../../features/identity/useIdentity';

export interface ImportWizardProps {
  onComplete?: () => void;
  showToast?: (msg: string) => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({
  onComplete,
  showToast = (_msg: string) => {},
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [entityType, setEntityType] = useState<'ITEM' | 'SUPPLIER' | 'CUSTOMER'>('ITEM');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [dryRunReport, setDryRunReport] = useState<any | null>(null);

  const dryRunMutation = useDryRunImport();
  const commitMutation = useCommitImport();

  const handleDownloadTemplate = () => {
    let csvHeader = '';
    let sampleRow = '';
    if (entityType === 'ITEM') {
      csvHeader = 'code,name,category,resin_type,stock,min_stock,cost\n';
      sampleRow = 'RM-PP-701,Polypropylene Impact Copolymer MFI 12,Raw Material,PP,5000,1000,98.50\n';
    } else if (entityType === 'SUPPLIER') {
      csvHeader = 'code,name,category,country\n';
      sampleRow = 'SUP-012,Reliance Petrochemicals Ltd,Polymer Producer,India\n';
    } else {
      csvHeader = 'code,name,customer_type,gstin\n';
      sampleRow = 'CUST-044,Tata Motors Auto Components,OEM Tier 1,27AAACT1234F1Z1\n';
    }

    const blob = new Blob([csvHeader + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${entityType.toLowerCase()}_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded official ${entityType} CSV template.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = String(evt.target?.result || '');
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        showToast('⚠️ CSV file contains no data rows.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || '';
        });
        rows.push(obj);
      }

      setParsedRows(rows);
      setStep(3);

      // Trigger automatic dry run
      try {
        const report = await dryRunMutation.mutateAsync({
          entityType,
          fileName: file.name,
          rows,
        });
        setDryRunReport(report);
        setStep(4);
      } catch (err: any) {
        showToast(`❌ Validation error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleCommit = async () => {
    if (!dryRunReport?.jobId) return;
    try {
      const res = await commitMutation.mutateAsync(dryRunReport.jobId);
      showToast(`✓ Successfully committed ${res.committedCount} rows into ERP database.`);
      onComplete?.();
    } catch (err: any) {
      showToast(`❌ Commit failed: ${err.message}`);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Step Indicators */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold">1</span>
          Select Entity
        </div>
        <ArrowRight className="h-3 w-3 text-slate-300" />
        <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold">2</span>
          Get Template
        </div>
        <ArrowRight className="h-3 w-3 text-slate-300" />
        <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold">3</span>
          Upload & Dry-Run
        </div>
        <ArrowRight className="h-3 w-3 text-slate-300" />
        <div className={`flex items-center gap-1.5 ${step >= 4 ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold">4</span>
          Atomic Commit
        </div>
      </div>

      {step <= 2 && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              1. Choose Destination Master Data Entity
            </label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {(['ITEM', 'SUPPLIER', 'CUSTOMER'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEntityType(t)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    entityType === t
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="text-sm font-bold">{t === 'ITEM' ? 'Raw Materials & Parts' : t === 'SUPPLIER' ? 'Vendor Master' : 'Customer Accounts'}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Table: public.{t.toLowerCase()}s</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Official Validation CSV Template
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Download pre-configured headers matching the PostgreSQL schema constraints.
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Download className="h-3.5 w-3.5" /> Download Template
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              2. Upload Prepared CSV
            </label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-8 dark:border-slate-700">
              <div className="text-center">
                <FileSpreadsheet className="mx-auto h-8 w-8 text-slate-400" />
                <div className="mt-3 flex text-xs leading-6 text-slate-600 dark:text-slate-400">
                  <label className="relative cursor-pointer rounded-md font-semibold text-indigo-600 focus-within:outline-none hover:text-indigo-500">
                    <span>Upload a CSV file</span>
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="sr-only" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-[11px] text-slate-500">Up to 2,000 rows per transaction batch</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="py-12 text-center text-xs text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3" />
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            Running Zod Dry-Run Validation on {parsedRows.length} rows...
          </div>
          <div>Checking unique code keys, data types, and required field integrity.</div>
        </div>
      )}

      {step === 4 && dryRunReport && (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Dry-Run Validation Complete
            </h4>
            <div className="mt-3 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-md bg-white p-3 shadow-xs dark:bg-slate-900">
                <div className="text-xs text-slate-500">Total Rows</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{dryRunReport.totalRows}</div>
              </div>
              <div className="rounded-md bg-emerald-50 p-3 shadow-xs dark:bg-emerald-950/40">
                <div className="text-xs text-emerald-700 dark:text-emerald-300">Valid Rows</div>
                <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">{dryRunReport.validCount}</div>
              </div>
              <div className="rounded-md bg-rose-50 p-3 shadow-xs dark:bg-rose-950/40">
                <div className="text-xs text-rose-700 dark:text-rose-300">Errors Found</div>
                <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">{dryRunReport.errorCount}</div>
              </div>
            </div>
          </div>

          {dryRunReport.sampleErrors && dryRunReport.sampleErrors.length > 0 && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-200">
              <div className="font-bold mb-1">Validation Errors (First {dryRunReport.sampleErrors.length} issues):</div>
              <ul className="list-disc pl-4 space-y-0.5">
                {dryRunReport.sampleErrors.map((err: any, idx: number) => (
                  <li key={idx}>
                    Row {err.rowNumber}: {err.errors.join('; ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setDryRunReport(null);
                setParsedRows([]);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Start Over
            </button>

            <button
              type="button"
              disabled={dryRunReport.validCount === 0 || commitMutation.isPending}
              onClick={handleCommit}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-none disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> Commit {dryRunReport.validCount} Valid Rows to Database
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
