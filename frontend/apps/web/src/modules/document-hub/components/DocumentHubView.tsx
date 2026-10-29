import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Sparkles,
  Layers,
  Calendar,
  Settings,
} from 'lucide-react';
import {
  useReportCatalog,
  useOeePreview,
  useReportJobs,
  useEnqueueReportJob,
  downloadDocument,
} from '../api/useDocumentHub';
import type { OeeReportFilters, ReportOutputFormat } from '../types';

interface DocumentHubViewProps {
  onNavigate?: (view: string, params?: any) => void;
  showToast?: (message: string) => void;
}

export const DocumentHubView: React.FC<DocumentHubViewProps> = ({
  onNavigate: _onNavigate,
  showToast = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'jobs'>('preview');

  const today = new Date().toISOString().slice(0, 10);
  const [filters, setFilters] = useState<OeeReportFilters>({
    dateFrom: today,
    dateTo: today,
    plantId: '',
    machineId: '',
    shiftId: '',
    outputFormat: 'PDF',
  });

  // Queries & Mutations
  const { data: catalog = [], isLoading: catalogLoading } = useReportCatalog();
  const { data: previewData, isLoading: previewLoading, refetch: refetchPreview } = useOeePreview(filters);
  const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useReportJobs(20);
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const safeCatalog = Array.isArray(catalog) ? catalog : [];
  const enqueueMutation = useEnqueueReportJob();

  const handleGenerate = async (format: ReportOutputFormat) => {
    try {
      const res = await enqueueMutation.mutateAsync({
        reportType: 'OEE_PERFORMANCE',
        filters: { ...filters, outputFormat: format },
      });
      showToast(
        `Report queued successfully (Job: ${res.jobId.slice(0, 8)}...). Processing in background.`
      );
      setActiveTab('jobs');
    } catch (err: any) {
      showToast(`Failed to enqueue report: ${err?.message || 'Unknown error'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <RotateCw className="w-3 h-3 animate-spin" /> Processing
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Clock className="w-3 h-3" /> Queued
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const summary = previewData?.summary;

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Enterprise Document Hub
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Industrial Analytics & Report Exporter</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            ISO 22400 OEE engine, high-throughput asynchronous job workers, formula-injection defense, and sealed multi-format delivery.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'preview'
                ? 'bg-teal-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Generator & Preview
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'jobs'
                ? 'bg-teal-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Downloads Archive</span>
            {safeJobs.some((j) => j.status === 'PROCESSING' || j.status === 'QUEUED') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'preview' && (
        <div className="space-y-5">
          {/* Filter Configuration Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Settings className="w-4 h-4 text-teal-600" />
                <span>Report Parameters (Flagship: OEE Performance)</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">ISO 22400 Standards</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Plant / Facility
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  value={filters.plantId || ''}
                  onChange={(e) => setFilters({ ...filters, plantId: e.target.value || undefined })}
                >
                  <option value="">All Operating Plants</option>
                  <option value="PLANT-01">Plant 01 — Pune Hub</option>
                  <option value="PLANT-02">Plant 02 — Chakan Unit</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Machine Work Center
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  value={filters.machineId || ''}
                  onChange={(e) => setFilters({ ...filters, machineId: e.target.value || undefined })}
                >
                  <option value="">All Machines</option>
                  <option value="M-01">ENGEL-180T (Engel Victory 180)</option>
                  <option value="M-02">DEMAG-500T (Demag Systec 500)</option>
                </select>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => refetchPreview()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RotateCw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Live Preview</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 mr-1">Generate Full Asynchronous Export:</span>
                <button
                  type="button"
                  disabled={enqueueMutation.isPending}
                  onClick={() => handleGenerate('PDF')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>PDF Executive</span>
                </button>

                <button
                  type="button"
                  disabled={enqueueMutation.isPending}
                  onClick={() => handleGenerate('XLSX')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Excel Workbook</span>
                </button>

                <button
                  type="button"
                  disabled={enqueueMutation.isPending}
                  onClick={() => handleGenerate('CSV')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Raw CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Plant OEE</div>
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">
                {summary?.overallOeePct ?? 0}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Target: &gt;85% (World Class)</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Availability Rate</div>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">
                {summary?.averageAvailabilityPct ?? 0}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Target: &gt;90%</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Performance Rate</div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                {summary?.averagePerformancePct ?? 0}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Target: &gt;95%</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Quality Yield Rate</div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                {summary?.averageQualityPct ?? 0}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Target: &gt;99%</div>
            </div>
          </div>

          {/* Interactive Bounded Preview Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Live Shift Breakdown Preview
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bounded fast sample (up to 50 active records). Use export buttons above for complete multi-year reports.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {previewData?.rows?.length ?? 0} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Plant</th>
                    <th className="px-4 py-2.5">Machine Cell</th>
                    <th className="px-4 py-2.5">Shift</th>
                    <th className="px-4 py-2.5 text-right">Operating Min</th>
                    <th className="px-4 py-2.5 text-right">Downtime Min</th>
                    <th className="px-4 py-2.5 text-right">Good Qty</th>
                    <th className="px-4 py-2.5 text-right">Scrap Qty</th>
                    <th className="px-4 py-2.5 text-right">Avail %</th>
                    <th className="px-4 py-2.5 text-right">Perf %</th>
                    <th className="px-4 py-2.5 text-right">Quality %</th>
                    <th className="px-4 py-2.5 text-right font-bold text-teal-700 dark:text-teal-400">OEE %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewLoading ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                        <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                        Calculating OEE metrics...
                      </td>
                    </tr>
                  ) : (previewData?.rows || []).length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                        No production runs found for this date filter. Adjust parameters or select a different range.
                      </td>
                    </tr>
                  ) : (
                    previewData?.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 font-mono">{row.date}</td>
                        <td className="px-4 py-2.5">{row.plantName}</td>
                        <td className="px-4 py-2.5 font-medium">{row.machineName} ({row.machineCode})</td>
                        <td className="px-4 py-2.5">{row.shiftCode}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{row.operatingMinutes}m</td>
                        <td className="px-4 py-2.5 text-right font-mono text-rose-600">{row.downtimeMinutes}m</td>
                        <td className="px-4 py-2.5 text-right font-mono text-emerald-600">{row.goodQty.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-400">{row.rejectedQty.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{row.availabilityPct}%</td>
                        <td className="px-4 py-2.5 text-right font-mono">{row.performancePct}%</td>
                        <td className="px-4 py-2.5 text-right font-mono">{row.qualityPct}%</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-teal-700 dark:text-teal-400">
                          {row.oeePct}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Generated Document Archive & Download Center
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Background asynchronous export queue with cryptographic verification and private storage retention.
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetchJobs()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RotateCw className={`w-3.5 h-3.5 ${jobsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Job ID</th>
                  <th className="px-4 py-2.5">Report Type</th>
                  <th className="px-4 py-2.5">Format</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">File Details</th>
                  <th className="px-4 py-2.5">Processing Time</th>
                  <th className="px-4 py-2.5">Enqueued At</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobsLoading && safeJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                      Loading report archive...
                    </td>
                  </tr>
                ) : safeJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No report export jobs have been enqueued yet. Generate your first report from the generator tab.
                    </td>
                  </tr>
                ) : (
                  safeJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                        {job.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        {job.reportType}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {job.outputFormat}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{getStatusBadge(job.status)}</td>
                      <td className="px-4 py-2.5">
                        {job.fileName ? (
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                              {job.fileName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {((job.fileSizeBytes || 0) / 1024).toFixed(1)} KB • {job.rowCount || 0} rows
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending generation</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px]">
                        {job.durationMs ? `${job.durationMs}ms` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {job.status === 'COMPLETED' && job.docId ? (
                          <button
                            type="button"
                            onClick={() => downloadDocument(job.docId!, job.fileName)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        ) : job.status === 'FAILED' ? (
                          <span className="text-rose-500 text-[11px]" title={job.errorSummary}>
                            {job.errorSummary?.slice(0, 25) || 'Error'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] flex items-center justify-end gap-1">
                            <RotateCw className="w-3 h-3 animate-spin" /> In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentHubView;

