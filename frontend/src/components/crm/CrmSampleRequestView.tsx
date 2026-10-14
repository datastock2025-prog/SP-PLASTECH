import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Search,
  Filter,
  Plus,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Upload,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { SampleRequest, SampleApprovalStatus } from '../../types/crm';
import { mockSampleRequests, mockAccounts } from '../../data/mockCrmData';

interface CrmSampleRequestViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
  initialAccountId?: string;
  createFromOpp?: string;
}

export const CrmSampleRequestView: React.FC<CrmSampleRequestViewProps> = ({
  onNavigate,
  showToast,
  initialAccountId,
  createFromOpp,
}) => {
  const [samples, setSamples] = useState<SampleRequest[]>(mockSampleRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('All');
  const [selectedSample, setSelectedSample] = useState<SampleRequest | null>(samples[0]);
  const [showCreateModal, setShowCreateModal] = useState(Boolean(createFromOpp));

  const [newSample, setNewSample] = useState<Partial<SampleRequest>>({
    sampleNumber: `SMP-2026-0${samples.length + 90}`,
    accountId: initialAccountId || mockAccounts[0].id,
    accountName: mockAccounts[0].accountName,
    sampleType: 'Molded Test Plaque',
    itemDescription: 'Flame Retardant PP V0 Black Compounded Plaque',
    polymerGrade: 'PP-FR-V0-3000',
    quantity: 5,
    uom: 'KG',
    requestDate: '2026-09-01',
    requiredByDate: '2026-09-10',
    approvalStatus: 'Sent to Customer',
    courierName: 'BlueDart Express',
    trackingNumber: 'BD-88291039',
    customerFeedback: '',
    trialResult: '',
  });

  const filteredSamples = useMemo(() => {
    return samples.filter(s => {
      if (initialAccountId && s.accountId !== initialAccountId) return false;
      if (approvalFilter !== 'All' && s.approvalStatus !== approvalFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.sampleNumber.toLowerCase().includes(q) ||
          s.accountName.toLowerCase().includes(q) ||
          s.itemDescription.toLowerCase().includes(q) ||
          s.polymerGrade.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [samples, initialAccountId, approvalFilter, searchQuery]);

  const handleUpdateApproval = (sampleId: string, status: SampleApprovalStatus) => {
    setSamples(prev =>
      prev.map(s => (s.id === sampleId ? { ...s, approvalStatus: status } : s))
    );
    if (selectedSample?.id === sampleId) {
      setSelectedSample(prev => (prev ? { ...prev, approvalStatus: status } : null));
    }
    showToast(`Sample approval updated to ${status}`);
  };

  const handleCreateSample = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedAccount = mockAccounts.find(a => a.id === newSample.accountId);
    const created: SampleRequest = {
      id: `SMP-0${samples.length + 1}`,
      sampleNumber: newSample.sampleNumber || `SMP-2026-099`,
      accountId: newSample.accountId || mockAccounts[0].id,
      accountName: matchedAccount ? matchedAccount.accountName : 'Customer Account',
      opportunityId: createFromOpp,
      sampleType: newSample.sampleType as any || 'Molded Test Plaque',
      itemDescription: newSample.itemDescription || 'Custom Compounded Polymer Sample',
      polymerGrade: newSample.polymerGrade || 'PP Copolymer Prime',
      quantity: Number(newSample.quantity) || 5,
      uom: newSample.uom || 'KG',
      requestDate: newSample.requestDate || '2026-09-01',
      requiredByDate: newSample.requiredByDate || '2026-09-10',
      approvalStatus: 'Sent to Customer',
      dispatchDate: '2026-09-02',
      courierName: newSample.courierName || 'BlueDart Express',
      trackingNumber: newSample.trackingNumber || 'BD-10928374',
      customerFeedback: 'In transit to customer tooling lab',
      trialResult: 'Pending machine trial',
    };

    setSamples([created, ...samples]);
    setSelectedSample(created);
    setShowCreateModal(false);
    showToast(`Sample Request ${created.sampleNumber} submitted to R&D Lab & Pilot Dispatch!`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Technical R&D & Trials
            </span>
            <span className="text-xs text-slate-500">{filteredSamples.length} Samples in progress</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Sample Requests & Mold Trial Sign-Off</h1>
          <p className="text-sm text-slate-600">
            Coordinate test plaque preparation, pigment masterbatch matches, dispatch tracking, and customer QA lab trials.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Request New Sample
        </button>
      </div>

      {/* Two Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Sample List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search sample, customer, grade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Under Testing">Under Testing</option>
              <option value="Sent to Customer">Sent</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto">
            {filteredSamples.map(sample => (
              <div
                key={sample.id}
                onClick={() => setSelectedSample(sample)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  selectedSample?.id === sample.id
                    ? 'bg-blue-50/50 border-blue-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900 font-mono">
                    {sample.sampleNumber}
                  </div>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                    sample.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                    sample.approvalStatus === 'Under Testing' ? 'bg-amber-50 text-amber-700' :
                    sample.approvalStatus === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {sample.approvalStatus}
                  </span>
                </div>

                <div className="font-semibold text-xs text-slate-800">{sample.accountName}</div>
                <div className="text-xs text-slate-600 font-medium truncate">{sample.itemDescription}</div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Type: {sample.sampleType}</span>
                  <span>Qty: {sample.quantity} {sample.uom}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Sample Detail & Trial Result Form (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedSample ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-blue-900">
                      {selectedSample.sampleNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800">
                      {selectedSample.sampleType}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{selectedSample.accountName}</div>
                  <div className="text-xs text-slate-500">Requested: {selectedSample.requestDate} | Required: {selectedSample.requiredByDate}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`COA & Lab test cert generated for ${selectedSample.sampleNumber}`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download COA
                  </button>
                  <button
                    onClick={() => onNavigate('crmQuotationManagement', { createFromSample: selectedSample.id })}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Quote Deal
                  </button>
                </div>
              </div>

              {/* Sample Technical Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Polymer Formulation</span>
                  <span className="font-bold text-slate-800">{selectedSample.polymerGrade}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Sample Batch Size</span>
                  <span className="font-bold text-slate-800">{selectedSample.quantity} {selectedSample.uom}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Courier & AWB Tracking</span>
                  <span className="font-bold text-blue-700 font-mono">{selectedSample.courierName} ({selectedSample.trackingNumber})</span>
                </div>
              </div>

              {/* Customer Trial Feedback & Lab Analysis */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3 text-xs">
                <h3 className="font-bold text-blue-900 uppercase text-[11px]">Customer Trial Feedback & Machine Result</h3>
                <div className="space-y-2">
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                    <span className="font-bold text-slate-800 block mb-0.5">Trial Outcome Summary:</span>
                    <p className="text-slate-700">{selectedSample.trialResult || 'Trial in progress at customer plant.'}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                    <span className="font-bold text-slate-800 block mb-0.5">Customer QA Engineer Sign-Off:</span>
                    <p className="text-slate-700">{selectedSample.customerFeedback || 'No formal feedback recorded yet.'}</p>
                  </div>
                </div>
              </div>

              {/* Approval Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">Status: <strong>{selectedSample.approvalStatus}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateApproval(selectedSample.id, 'Approved')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Sample
                  </button>
                  <button
                    onClick={() => handleUpdateApproval(selectedSample.id, 'Rejected')}
                    className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold border border-rose-200"
                  >
                    Mark Rejected
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a sample record to review mold trial parameters and QA lab approvals.
            </div>
          )}
        </div>
      </div>

      {/* Create Sample Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Request Technical Sample</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSample} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Account *</label>
                  <select
                    value={newSample.accountId}
                    onChange={(e) => {
                      const acc = mockAccounts.find(a => a.id === e.target.value);
                      setNewSample({ ...newSample, accountId: e.target.value, accountName: acc?.accountName });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    {mockAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sample Type</label>
                  <select
                    value={newSample.sampleType}
                    onChange={(e) => setNewSample({ ...newSample, sampleType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Raw Polymer Granule">Raw Polymer Granule</option>
                    <option value="Color Masterbatch Chip">Color Masterbatch Chip</option>
                    <option value="Molded Test Plaque">Molded Test Plaque</option>
                    <option value="Pre-Series Pilot Part">Pre-Series Pilot Part</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Description & Spec</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UV Stabilized PP Homopolymer for Outdoor Louver"
                    value={newSample.itemDescription}
                    onChange={(e) => setNewSample({ ...newSample, itemDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newSample.quantity}
                    onChange={(e) => setNewSample({ ...newSample, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Required by Date</label>
                  <input
                    type="date"
                    value={newSample.requiredByDate}
                    onChange={(e) => setNewSample({ ...newSample, requiredByDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Dispatch to Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
