import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Hash,
  Plus,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Sliders,
  Calendar,
  Lock,
  Zap,
} from 'lucide-react';
import { NumberingSequence } from '../../types/admin';
import { adminService } from '../../services/adminService';
import { useAdminNumberingSeries, useSaveAdminNumberingSeries } from '../../hooks/useAdmin';

interface AdminNumberingViewProps {
  showToast?: (msg: string) => void;
}

export const AdminNumberingView: React.FC<AdminNumberingViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const { data: sequences = [], isLoading, refetch } = useAdminNumberingSeries();
  const saveSequenceMutation = useSaveAdminNumberingSeries();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeq, setEditingSeq] = useState<NumberingSequence | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; generatedCode: string } | null>(null);

  const [formData, setFormData] = useState<Partial<NumberingSequence>>({
    documentType: '',
    module: 'Manufacturing & MES',
    prefix: 'DOC-2026-',
    suffix: '',
    currentSequence: 100,
    zeroPadding: 4,
    resetFrequency: 'Fiscal Year (Apr-Mar)',
    allowManualOverride: false,
    notes: '',
  });

  const generatePreview = (
    prefix: string,
    suffix: string | undefined,
    seq: number,
    pad: number
  ) => {
    const padded = String(seq + 1).padStart(pad, '0');
    return `${prefix || ''}${padded}${suffix || ''}`;
  };

  const handleOpenEdit = (seq: NumberingSequence) => {
    setEditingSeq(seq);
    setFormData(seq);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingSeq(null);
    setFormData({
      documentType: '',
      module: 'Manufacturing & MES',
      prefix: 'DOC-2026-',
      suffix: '',
      currentSequence: 1,
      zeroPadding: 4,
      resetFrequency: 'Fiscal Year (Apr-Mar)',
      allowManualOverride: false,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.documentType || !formData.prefix) {
      showToast('Please specify document type and prefix.');
      return;
    }

    const preview = generatePreview(
      formData.prefix || '',
      formData.suffix,
      formData.currentSequence || 0,
      formData.zeroPadding || 4
    );

    if (editingSeq) {
      const updatedSeq: NumberingSequence = {
        ...editingSeq,
        ...(formData as NumberingSequence),
        samplePreview: preview,
      };
      saveSequenceMutation.mutate(updatedSeq);
      showToast(`Numbering sequence for "${formData.documentType}" updated in PostgreSQL.`);
    } else {
      const newSeq: NumberingSequence = {
        id: `SEQ-${Date.now().toString().slice(-4)}`,
        ...(formData as NumberingSequence),
        samplePreview: preview,
        lastGeneratedOn: 'Not yet generated',
      };
      saveSequenceMutation.mutate(newSeq);
      showToast(`New document series "${newSeq.documentType}" registered.`);
    }
    setIsModalOpen(false);
  };

  const handleTestGenerate = async (seq: NumberingSequence) => {
    const code = await adminService.generateNextNumber(seq.module, seq.documentType);
    setTestResult({ id: seq.id, generatedCode: code });
    showToast(`Dispatched document sequence #${code} from PostgreSQL generator engine.`);
    refetch();
  };

  return (
    <div className="min-w-0 space-y-4 pb-8">
      {/* Header */}
      <Card className="rounded-md border-slate-200 shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Hash className="w-4 h-4 text-[#0F8B8D]" />
            <span>Document Control & Serialization</span>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Document Numbering Series &amp; Prefix Rules</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Configure automated auto-increment serial numbers, statutory fiscal year codes, and padding standards for all ERP transactions.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="w-full shrink-0 bg-[#0F8B8D] text-white hover:bg-[#0c7274] sm:w-auto"
        >
          <Plus aria-hidden="true" />
          Create New Series
        </Button>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="rounded-md border-sky-200 bg-sky-50/70 shadow-none">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-slate-700">
          <HelpCircle className="mt-0.5 size-4 shrink-0 text-sky-700" aria-hidden="true" />
          <p className="min-w-0">
            <strong className="text-slate-900">Statutory numbering compliance:</strong> Standard GST regulations mandate continuous, non-gap serial numbering for tax invoices and debit/credit notes within a financial year (April 1 to March 31). Manual overrides on invoices are strictly blocked by default.
          </p>
        </CardContent>
      </Card>

      {/* Sequences Table */}
      <Card className="overflow-hidden rounded-md border-slate-200 shadow-none">
        <CardHeader className="flex-row items-center justify-between border-b border-slate-100 py-3">
          <CardTitle className="text-sm font-semibold text-slate-900">Registered document series</CardTitle>
          <Badge variant="outline">{sequences.length} series</Badge>
        </CardHeader>
        <CardContent className="p-0">
        <div className="space-y-3 p-3 md:hidden">
          {isLoading && <p className="py-6 text-center text-sm text-slate-500">Loading document series…</p>}
          {!isLoading && sequences.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No document series configured.</p>}
          {sequences.map((seq) => (
            <article key={seq.id} className="min-w-0 space-y-3 rounded-md border border-slate-200 bg-white p-3">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold text-slate-900">{seq.documentType}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{seq.module}</p>
                  {seq.notes && <p className="mt-1 text-xs text-slate-500">{seq.notes}</p>}
                </div>
                <Badge variant={seq.allowManualOverride ? 'secondary' : 'outline'} className="shrink-0">
                  {seq.allowManualOverride ? 'Override allowed' : 'Locked'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="min-w-0"><span className="block text-slate-400">Prefix / suffix</span><span className="break-all font-mono text-slate-700">{seq.prefix}{seq.suffix}</span></div>
                <div><span className="block text-slate-400">Counter / padding</span><span className="font-mono text-slate-700">{seq.currentSequence} · {seq.zeroPadding} digits</span></div>
                <div className="min-w-0"><span className="block text-slate-400">Reset interval</span><span className="text-slate-700">{seq.resetFrequency}</span></div>
                <div className="min-w-0"><span className="block text-slate-400">Next ID</span><Badge variant="outline" className="mt-1 max-w-full break-all font-mono text-[#0F8B8D]">{seq.samplePreview}</Badge></div>
              </div>
              {testResult?.id === seq.id && (
                <p role="status" className="break-all rounded-md bg-emerald-50 p-2 font-mono text-xs text-emerald-800">Generated: {testResult.generatedCode}</p>
              )}
              <div className="flex gap-2 border-t border-slate-100 pt-2">
                <Button type="button" size="sm" onClick={() => handleTestGenerate(seq)} className="min-w-0 flex-1 bg-teal-700 text-white hover:bg-teal-800" title="Simulate / Trigger Next Document Serial from PostgreSQL">
                  <Zap aria-hidden="true" /> Generate next
                </Button>
                <Button type="button" variant="outline" size="icon-sm" onClick={() => handleOpenEdit(seq)} title="Edit Numbering Rule" aria-label={`Edit ${seq.documentType}`}>
                  <Edit2 aria-hidden="true" />
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-[1050px] text-left text-xs">
            <TableHeader className="bg-slate-50 text-slate-600">
              <TableRow>
                <TableHead>Document Type &amp; Module</TableHead>
                <TableHead>Prefix &amp; Suffix</TableHead>
                <TableHead>Current Counter</TableHead>
                <TableHead>Zero Padding</TableHead>
                <TableHead>Reset Interval</TableHead>
                <TableHead>Next Generated ID</TableHead>
                <TableHead className="text-center">Manual Override</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sequences.map((seq) => (
                <TableRow key={seq.id} className="hover:bg-slate-50/70">
                  <TableCell>
                    <div className="font-bold text-slate-900">{seq.documentType}</div>
                    <div className="text-[11px] text-slate-400">{seq.module}</div>
                    {seq.notes && <div className="text-[10px] text-slate-500 mt-0.5 italic">{seq.notes}</div>}
                  </TableCell>

                  <TableCell className="font-mono font-semibold text-slate-800">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {seq.prefix}
                    </span>
                    {seq.suffix && (
                      <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500">
                        {seq.suffix}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="font-mono font-bold text-slate-900">
                    {seq.currentSequence}
                  </TableCell>

                  <TableCell className="font-mono text-slate-600">
                    {seq.zeroPadding} digits
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="gap-1 text-[11px]">
                      <Calendar aria-hidden="true" />
                      {seq.resetFrequency}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-mono font-bold text-[#0F8B8D]">
                    <Badge variant="outline" className="border-teal-200 bg-teal-50 font-mono text-teal-800">
                      {seq.samplePreview}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    {seq.allowManualOverride ? (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-800">Allowed</Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-slate-500"><Lock aria-hidden="true" /> Locked</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleTestGenerate(seq)}
                        className="h-7 bg-teal-50 text-xs text-teal-800 hover:bg-teal-100"
                        title="Simulate / Trigger Next Document Serial from PostgreSQL"
                      >
                        <Zap aria-hidden="true" /> Generate #
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(seq)}
                        title="Edit Numbering Rule"
                        aria-label={`Edit ${seq.documentType}`}
                      >
                        <Edit2 aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>

      {/* Modal: Edit or Create Numbering Sequence */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent showCloseButton={false} className="max-h-[90dvh] max-w-lg overflow-y-auto border-slate-200 bg-white p-4 text-slate-900 sm:p-6">
            <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900">
              {editingSeq ? `Configure ${editingSeq.documentType}` : 'Create New Document Series'}
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Set prefix, zero padding length, sequence counter, and automatic annual reset rule.
            </p>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Transaction Type *</label>
                <Input
                  type="text"
                  required
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  placeholder="e.g. Subcontract Delivery Challan"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prefix *</label>
                  <Input
                    type="text"
                    required
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    placeholder="e.g. DC-2026-"
                    className="h-10 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Suffix (Optional)</label>
                  <Input
                    type="text"
                    value={formData.suffix || ''}
                    onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                    placeholder="e.g. -R0"
                    className="h-10 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Sequence Counter</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.currentSequence}
                    onChange={(e) => setFormData({ ...formData, currentSequence: parseInt(e.target.value) || 0 })}
                    className="h-10 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Zero Padding Digits</label>
                  <select
                    value={formData.zeroPadding}
                    onChange={(e) => setFormData({ ...formData, zeroPadding: parseInt(e.target.value) })}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value={3}>3 Digits (001)</option>
                    <option value={4}>4 Digits (0001)</option>
                    <option value={5}>5 Digits (00001)</option>
                    <option value={6}>6 Digits (000001)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Auto-Reset Frequency</label>
                <select
                  value={formData.resetFrequency}
                  onChange={(e) => setFormData({ ...formData, resetFrequency: e.target.value as any })}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="Fiscal Year (Apr-Mar)">Fiscal Year (Apr 01 - Mar 31)</option>
                  <option value="Yearly (Jan-Dec)">Calendar Year (Jan 01 - Dec 31)</option>
                  <option value="Monthly">Monthly Reset</option>
                  <option value="Never">Never (Continuous Sequential)</option>
                </select>
              </div>

              {/* Sample Live Output */}
              <div className="rounded-md border border-teal-200 bg-teal-50 p-3">
                <span className="block text-xs font-medium text-slate-600">Calculated next sample document ID</span>
                <Badge variant="outline" className="mt-1 h-auto max-w-full break-all border-teal-300 bg-white font-mono text-sm font-semibold text-teal-800">
                  {generatePreview(
                    formData.prefix || '',
                    formData.suffix,
                    formData.currentSequence || 0,
                    formData.zeroPadding || 4
                  )}
                </Badge>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-700 text-white hover:bg-teal-800"
                >
                  <CheckCircle2 aria-hidden="true" />
                  Save Sequence
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
