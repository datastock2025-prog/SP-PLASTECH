import React, { useState } from 'react';
import {
  ArrowUpDown,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Plus,
  Search,
  FileText,
} from 'lucide-react';
import { DataExchangeJob, mockDataExchangeJobs } from '../../data/mockAdminExtendedData';

interface AdminDataImportExportViewProps {
  showToast?: (msg: string) => void;
}

export const AdminDataImportExportView: React.FC<AdminDataImportExportViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [jobs, setJobs] = useState<DataExchangeJob[]>(mockDataExchangeJobs);
  const [activeTab, setActiveTab] = useState<'JOB_HISTORY' | 'TEMPLATES'>('JOB_HISTORY');

  const templates = [
    {
      title: 'Polymer Resin Catalog & Specifications',
      entity: 'Item Master (Raw Material)',
      format: 'XLSX / CSV',
      description: 'Includes MFI, density, Izod impact, supplier grade, and flame retardancy columns.',
    },
    {
      title: 'Multi-Level BOM & Masterbatch Recipes',
      entity: 'BOM / Formulation',
      format: 'XLSX',
      description: 'Defines masterbatch percentage dosing (e.g. 2.0%), cycle times, and scrap allowances.',
    },
    {
      title: 'Injection Machine OEE & Downtime Logs',
      entity: 'Telemetry & Reason Codes',
      format: 'CSV',
      description: 'Hourly machine status, cavity reject counts, and operator maintenance reasons.',
    },
    {
      title: 'Monthly GSTR-1 Outward Supply Invoices',
      entity: 'Finance Tax Ledger',
      format: 'JSON / XLSX',
      description: 'Standard format compliant with Goods and Services Tax Network (GSTN) offline tool.',
    },
  ];

  const handleTriggerExport = (jobTitle: string) => {
    showToast(`Initiated background export task for: ${jobTitle}.`);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newJob: DataExchangeJob = {
        id: `JOB-IMP-${Date.now().toString().slice(-4)}`,
        jobName: `Manual Import: ${file.name}`,
        type: 'IMPORT',
        entity: 'User Staged File',
        fileFormat: file.name.endsWith('.xlsx') ? 'XLSX' : 'CSV',
        totalRecords: 284,
        successCount: 284,
        errorCount: 0,
        startedAt: 'Just now',
        durationSec: 3.2,
        triggeredBy: 'Current Administrator',
        status: 'Completed',
      };
      setJobs([newJob, ...jobs]);
      showToast(`Successfully parsed and imported ${file.name} (284 records).`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <ArrowUpDown className="w-4 h-4 text-[#0F8B8D]" />
            <span>Data Ingestion &amp; Batch Interchange Hub</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Data Import / Export Center Screen</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Execute batch migrations, import polymer recipe sheets, and export statutory GST tax ledgers and machine OEE history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Batch File</span>
            <input type="file" onChange={handleUploadFile} className="hidden" accept=".csv,.xlsx,.json" />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('JOB_HISTORY')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'JOB_HISTORY' ? 'bg-[#0F8B8D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Batch Job History ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'TEMPLATES' ? 'bg-[#0F8B8D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Standard Import Templates ({templates.length})
        </button>
      </div>

      {/* Job History Table */}
      {activeTab === 'JOB_HISTORY' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Job Title &amp; Entity</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Records Processed</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Result Artifact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        job.type === 'IMPORT' ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-[#0F8B8D]'
                      }`}
                    >
                      {job.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{job.jobName}</div>
                    <div className="text-[11px] text-slate-500">{job.entity}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 font-semibold">{job.fileFormat}</td>
                  <td className="py-3 px-4 font-mono">
                    <span className="text-emerald-700 font-bold">{job.successCount} ok</span>
                    {job.errorCount > 0 && <span className="text-rose-600 font-bold ml-1.5">({job.errorCount} err)</span>}
                    <span className="text-slate-400 text-[10px] ml-1">of {job.totalRecords}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{job.startedAt}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => showToast(`Downloaded data artifact for ${job.jobName}.`)}
                      className="flex items-center gap-1 text-xs font-semibold text-[#0F8B8D] hover:underline ml-auto"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Templates Grid */}
      {activeTab === 'TEMPLATES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.title}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-xs text-slate-900">{tpl.title}</h3>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {tpl.format}
                  </span>
                </div>
                <div className="text-[11px] text-[#0F8B8D] font-medium mt-1">{tpl.entity}</div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{tpl.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Header row validated</span>
                <button
                  onClick={() => showToast(`Downloaded standard import template: ${tpl.title}.`)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#0F8B8D] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
