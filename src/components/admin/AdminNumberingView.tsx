import React, { useState } from 'react';
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
} from 'lucide-react';
import { NumberingSequence } from '../../types/admin';
import { mockNumberingSequences } from '../../data/mockAdminData';

interface AdminNumberingViewProps {
  showToast?: (msg: string) => void;
}

export const AdminNumberingView: React.FC<AdminNumberingViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [sequences, setSequences] = useState<NumberingSequence[]>(mockNumberingSequences);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeq, setEditingSeq] = useState<NumberingSequence | null>(null);

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
      setSequences((prev) =>
        prev.map((s) =>
          s.id === editingSeq.id
            ? {
                ...s,
                ...(formData as NumberingSequence),
                samplePreview: preview,
              }
            : s
        )
      );
      showToast(`Numbering sequence for "${formData.documentType}" updated.`);
    } else {
      const newSeq: NumberingSequence = {
        id: `SEQ-${Date.now().toString().slice(-4)}`,
        ...(formData as NumberingSequence),
        samplePreview: preview,
        lastGeneratedOn: 'Not yet generated',
      };
      setSequences([...sequences, newSeq]);
      showToast(`New document series "${newSeq.documentType}" registered.`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Hash className="w-4 h-4 text-[#0F8B8D]" />
            <span>Document Control & Serialization</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Document Numbering Series &amp; Prefix Rules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated auto-increment serial numbers, statutory fiscal year codes, and padding standards for all ERP transactions.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Series
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <HelpCircle className="w-4 h-4 text-[#0F8B8D] mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold text-slate-800">Statutory Numbering Compliance:</span> Standard GST regulations mandate continuous, non-gap serial numbering for tax invoices and debit/credit notes within a financial year (April 1 to March 31). Manual overrides on invoices are strictly blocked by default.
        </div>
      </div>

      {/* Sequences Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Document Type &amp; Module</th>
                <th className="py-3 px-4">Prefix &amp; Suffix</th>
                <th className="py-3 px-4">Current Counter</th>
                <th className="py-3 px-4">Zero Padding</th>
                <th className="py-3 px-4">Reset Interval</th>
                <th className="py-3 px-4">Next Generated ID</th>
                <th className="py-3 px-4 text-center">Manual Override</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sequences.map((seq) => (
                <tr key={seq.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{seq.documentType}</div>
                    <div className="text-[11px] text-slate-400">{seq.module}</div>
                    {seq.notes && <div className="text-[10px] text-slate-500 mt-0.5 italic">{seq.notes}</div>}
                  </td>

                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {seq.prefix}
                    </span>
                    {seq.suffix && (
                      <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500">
                        {seq.suffix}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {seq.currentSequence}
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {seq.zeroPadding} digits
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {seq.resetFrequency}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-[#0F8B8D]">
                    <span className="px-2 py-0.5 bg-[#0F8B8D]/10 rounded border border-[#0F8B8D]/20">
                      {seq.samplePreview}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {seq.allowManualOverride ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        Allowed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        <Lock className="w-3 h-3 text-slate-400" /> Locked
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(seq)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                      title="Edit Numbering Rule"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit or Create Numbering Sequence */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {editingSeq ? `Configure ${editingSeq.documentType}` : 'Create New Document Series'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set prefix, zero padding length, sequence counter, and automatic annual reset rule.
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Transaction Type *</label>
                <input
                  type="text"
                  required
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  placeholder="e.g. Subcontract Delivery Challan"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prefix *</label>
                  <input
                    type="text"
                    required
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    placeholder="e.g. DC-2026-"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Suffix (Optional)</label>
                  <input
                    type="text"
                    value={formData.suffix || ''}
                    onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                    placeholder="e.g. -R0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Sequence Counter</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.currentSequence}
                    onChange={(e) => setFormData({ ...formData, currentSequence: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Zero Padding Digits</label>
                  <select
                    value={formData.zeroPadding}
                    onChange={(e) => setFormData({ ...formData, zeroPadding: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  <option value="Fiscal Year (Apr-Mar)">Fiscal Year (Apr 01 - Mar 31)</option>
                  <option value="Yearly (Jan-Dec)">Calendar Year (Jan 01 - Dec 31)</option>
                  <option value="Monthly">Monthly Reset</option>
                  <option value="Never">Never (Continuous Sequential)</option>
                </select>
              </div>

              {/* Sample Live Output */}
              <div className="p-3 bg-[#0F8B8D]/5 border border-[#0F8B8D]/20 rounded-lg">
                <span className="text-[11px] font-semibold text-slate-500 block">Calculated Next Sample Document ID:</span>
                <span className="text-base font-bold font-mono text-[#0F8B8D] mt-0.5 block">
                  {generatePreview(
                    formData.prefix || '',
                    formData.suffix,
                    formData.currentSequence || 0,
                    formData.zeroPadding || 4
                  )}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm"
                >
                  Save Sequence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
