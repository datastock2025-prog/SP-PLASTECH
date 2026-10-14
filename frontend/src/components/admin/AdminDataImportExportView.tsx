import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowUpDown,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import { DataExchangeJob, dataExchangeJobs } from '../../data/adminExtendedData';

interface AdminDataImportExportViewProps {
  showToast?: (msg: string) => void;
}

export const AdminDataImportExportView: React.FC<AdminDataImportExportViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [jobs, setJobs] = useState<DataExchangeJob[]>(dataExchangeJobs);
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

  const handleUploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
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

  const handleDownloadJob = (jobName: string) => {
    showToast(`Downloaded data artifact for ${jobName}.`);
  };

  return (
    <div className="min-w-0 space-y-4 pb-8">
      <Card className="rounded-md border-slate-200 shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ArrowUpDown className="size-4 text-teal-700" aria-hidden="true" />
              Data Ingestion &amp; Batch Interchange Hub
            </div>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Data Import / Export Center</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Execute batch migrations, import polymer recipe sheets, and export statutory GST tax ledgers and machine OEE history.
            </p>
          </div>
          <Button asChild className="w-full shrink-0 bg-teal-700 text-white hover:bg-teal-800 sm:w-auto">
            <label className="cursor-pointer">
              <Upload aria-hidden="true" />
              Upload Batch File
              <input type="file" onChange={handleUploadFile} className="sr-only" accept=".csv,.xlsx,.json" />
            </label>
          </Button>
        </CardContent>
      </Card>

      <div className="min-w-0 overflow-x-auto border-b border-slate-200 pb-2">
        <div className="flex min-w-max items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'JOB_HISTORY' ? 'secondary' : 'ghost'}
            aria-pressed={activeTab === 'JOB_HISTORY'}
            onClick={() => setActiveTab('JOB_HISTORY')}
            className={activeTab === 'JOB_HISTORY' ? 'bg-teal-50 text-teal-800 hover:bg-teal-50' : 'text-slate-600'}
          >
            Batch Job History <Badge variant="outline">{jobs.length}</Badge>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'TEMPLATES' ? 'secondary' : 'ghost'}
            aria-pressed={activeTab === 'TEMPLATES'}
            onClick={() => setActiveTab('TEMPLATES')}
            className={activeTab === 'TEMPLATES' ? 'bg-teal-50 text-teal-800 hover:bg-teal-50' : 'text-slate-600'}
          >
            Standard Import Templates <Badge variant="outline">{templates.length}</Badge>
          </Button>
        </div>
      </div>

      {activeTab === 'JOB_HISTORY' && (
        <Card className="overflow-hidden rounded-md border-slate-200 shadow-none">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Batch jobs</h3>
            <Badge variant="outline">{jobs.length} jobs</Badge>
          </div>
          <CardContent className="p-0">
            <div className="space-y-3 p-3 md:hidden">
              {jobs.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No import/export jobs recorded.</p>}
              {jobs.map((job) => (
                <article key={job.id} className="min-w-0 space-y-3 rounded-md border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="break-words text-sm font-semibold text-slate-900">{job.jobName}</h4>
                      <p className="mt-0.5 text-xs text-slate-500">{job.entity}</p>
                    </div>
                    <Badge variant={job.type === 'IMPORT' ? 'secondary' : 'outline'} className={job.type === 'IMPORT' ? 'shrink-0 bg-indigo-50 text-indigo-800' : 'shrink-0 border-teal-200 bg-teal-50 text-teal-800'}>{job.type}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                    <div><span className="block text-slate-400">Format</span><span className="font-mono text-slate-700">{job.fileFormat}</span></div>
                    <div><span className="block text-slate-400">Started</span><span className="text-slate-700">{job.startedAt}</span></div>
                    <div className="col-span-2"><span className="block text-slate-400">Records processed</span><span className="font-mono"><strong className="text-emerald-700">{job.successCount} ok</strong>{job.errorCount > 0 && <strong className="ml-1.5 text-rose-700">({job.errorCount} err)</strong>}<span className="ml-1 text-slate-400">of {job.totalRecords}</span></span></div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">{job.status}</Badge>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDownloadJob(job.jobName)} className="text-teal-800">
                      <Download aria-hidden="true" /> Download
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table className="min-w-[900px] text-left text-xs">
                <TableHeader className="bg-slate-50 text-slate-500">
                  <TableRow>
                    <TableHead>Operation</TableHead>
                    <TableHead>Job Title &amp; Entity</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Records Processed</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Result Artifact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-slate-500">No import/export jobs recorded.</TableCell></TableRow>}
                  {jobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-slate-50/80">
                      <TableCell><Badge variant={job.type === 'IMPORT' ? 'secondary' : 'outline'} className={job.type === 'IMPORT' ? 'bg-indigo-50 text-indigo-800' : 'border-teal-200 bg-teal-50 text-teal-800'}>{job.type}</Badge></TableCell>
                      <TableCell><div className="font-semibold text-slate-900">{job.jobName}</div><div className="text-xs text-slate-500">{job.entity}</div></TableCell>
                      <TableCell className="font-mono font-medium text-slate-700">{job.fileFormat}</TableCell>
                      <TableCell className="font-mono"><strong className="text-emerald-700">{job.successCount} ok</strong>{job.errorCount > 0 && <strong className="ml-1.5 text-rose-700">({job.errorCount} err)</strong>}<span className="ml-1 text-slate-400">of {job.totalRecords}</span></TableCell>
                      <TableCell className="text-slate-600">{job.startedAt}</TableCell>
                      <TableCell><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">{job.status}</Badge></TableCell>
                      <TableCell className="text-right"><Button type="button" variant="ghost" size="sm" onClick={() => handleDownloadJob(job.jobName)} className="text-teal-800"><Download aria-hidden="true" /> Download</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <div className="flex flex-col gap-1 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>{jobs.length} import/export jobs</span>
            <span>Supported import formats: CSV, XLSX, JSON</span>
          </div>
        </Card>
      )}

      {activeTab === 'TEMPLATES' && (
        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.title} className="min-w-0 rounded-md border-slate-200 shadow-none transition-shadow duration-150 hover:shadow-sm motion-reduce:transition-none">
              <CardContent className="flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
                <div>
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
                      <h3 className="break-words text-sm font-semibold text-slate-900">{template.title}</h3>
                    </div>
                    <Badge variant="outline" className="shrink-0 font-mono text-[10px]">{template.format}</Badge>
                  </div>
                  <p className="mt-2 text-xs font-medium text-teal-800">{template.entity}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{template.description}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <Badge variant="outline" className="gap-1 text-slate-500"><CheckCircle2 aria-hidden="true" /> Header validated</Badge>
                  <Button type="button" size="sm" variant="ghost" onClick={() => showToast(`Downloaded standard import template: ${template.title}.`)} className="text-teal-800">
                    <Download aria-hidden="true" /> Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};