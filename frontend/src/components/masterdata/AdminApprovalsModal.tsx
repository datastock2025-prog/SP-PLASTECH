import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  X,
  Check,
  AlertTriangle,
  FileText,
  UserCheck,
  ArrowRight,
  Filter,
  Trash2,
  Edit,
  Plus,
  Boxes,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  masterDataGovernanceService,
  MasterDataChangeRequest,
} from '../../services/masterDataGovernanceService';
import { adminEventBus } from '../../services/adminService';
import { ItemMaster } from '../../types';

interface AdminApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyApproval: (request: MasterDataChangeRequest) => void;
  onApplyRejection: (request: MasterDataChangeRequest) => void;
  showToast: (msg: string) => void;
}

export const AdminApprovalsModal: React.FC<AdminApprovalsModalProps> = ({
  isOpen,
  onClose,
  onApplyApproval,
  onApplyRejection,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQ, setSearchQ] = useState<string>('');
  const [requests, setRequests] = useState<MasterDataChangeRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<MasterDataChangeRequest | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const loadRequests = () => {
    setRequests(masterDataGovernanceService.getChangeRequests());
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub1 = adminEventBus.on('CHANGE_REQUEST_SUBMITTED', loadRequests);
    const unsub2 = adminEventBus.on('CHANGE_REQUEST_APPROVED', loadRequests);
    const unsub3 = adminEventBus.on('CHANGE_REQUEST_REJECTED', loadRequests);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  if (!isOpen) return null;

  const filteredRequests = requests.filter((r) => {
    if (activeTab !== r.status) return false;
    if (typeFilter !== 'ALL' && r.requestType !== typeFilter) return false;
    if (!searchQ.trim()) return true;
    const q = searchQ.trim().toLowerCase();
    return (
      (r.itemCode || '').toLowerCase().includes(q) ||
      (r.itemName || '').toLowerCase().includes(q) ||
      (r.requestedBy || '').toLowerCase().includes(q) ||
      (r.reason || '').toLowerCase().includes(q)
    );
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const handleApprove = (req: MasterDataChangeRequest) => {
    setIsProcessing(true);
    const res = masterDataGovernanceService.approveChangeRequest(
      req.id,
      'Admin Master Data Authority',
      reviewNote || 'Approved and verified for shopfloor / catalog deployment.'
    );
    if (res.success && res.request) {
      onApplyApproval(res.request);
      showToast(`✓ Approved ${req.requestType} request for SKU ${req.itemCode}`);
      setReviewNote('');
      setSelectedReq(null);
      loadRequests();
    } else {
      showToast('Failed to approve request');
    }
    setIsProcessing(false);
  };

  const handleReject = (req: MasterDataChangeRequest) => {
    setIsProcessing(true);
    const res = masterDataGovernanceService.rejectChangeRequest(
      req.id,
      'Admin Master Data Authority',
      reviewNote || 'Rejected by Admin. Please verify specifications and retry.'
    );
    if (res.success && res.request) {
      onApplyRejection(res.request);
      showToast(`Rejected ${req.requestType} request for SKU ${req.itemCode}`);
      setReviewNote('');
      setSelectedReq(null);
      loadRequests();
    } else {
      showToast('Failed to reject request');
    }
    setIsProcessing(false);
  };

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Plus className="w-3 h-3" /> CREATE REQUEST
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <Edit className="w-3 h-3" /> EDIT REQUEST
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Trash2 className="w-3 h-3" /> DELETION REQUEST
          </span>
        );
      default:
        return <span className="badge gray">{type}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full my-auto overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50/70 via-white to-orange-50/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#14213D]">
                  Master Data CRUD Governance &amp; Admin Approval Center
                </h2>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    {pendingCount} Pending Action
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                All Create, Update, and Delete operations for approved &amp; shopfloor items require verified Admin authorization.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Filter Bar */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('pending');
                setSelectedReq(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending Review ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('approved');
                setSelectedReq(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'approved'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approved History ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('rejected');
                setSelectedReq(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'rejected'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Rejected ({rejectedCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search SKU, user, reason..."
                className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs w-48 focus:w-60 transition-all outline-none focus:border-amber-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Operations</option>
              <option value="CREATE">Create Requests</option>
              <option value="UPDATE">Edit Requests</option>
              <option value="DELETE">Delete Requests</option>
            </select>
          </div>
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Left: Request List */}
          <div className="md:col-span-6 border-r border-slate-200 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => {
                const isSelected = selectedReq?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-amber-500 shadow-md ring-1 ring-amber-400'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {renderTypeBadge(req.requestType)}
                        <span className="font-mono font-bold text-xs text-[#14213D]">{req.itemCode}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-slate-800 mt-1 line-clamp-1">
                      {req.itemName}
                    </div>

                    <div className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-200 line-clamp-2">
                      <strong>Reason:</strong> {req.reason}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                      <span>
                        Raised by: <strong className="text-slate-700">{req.requestedBy}</strong> ({req.userRole})
                      </span>
                      <span className="font-mono text-slate-400">{req.id}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 px-4 text-slate-400 space-y-2">
                <CheckCircle className="w-8 h-8 mx-auto text-slate-300" />
                <div className="text-xs font-semibold">No {activeTab} change requests found.</div>
                <div className="text-[11px]">All shopfloor &amp; master data operations are up to date.</div>
              </div>
            )}
          </div>

          {/* Right: Request Details & Action Panel */}
          <div className="md:col-span-6 overflow-y-auto p-6 bg-white flex flex-col justify-between">
            {selectedReq ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    {renderTypeBadge(selectedReq.requestType)}
                    <span className="font-mono font-bold text-sm text-[#0F8B8D]">{selectedReq.itemCode}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#14213D] mt-1">{selectedReq.itemName}</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Requested on {new Date(selectedReq.requestedAt).toLocaleString()} by{' '}
                    <strong className="text-slate-700">{selectedReq.requestedBy}</strong> ({selectedReq.userRole})
                  </div>
                </div>

                {/* Justification Box */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Requester Justification &amp; Purpose
                  </div>
                  <p className="text-xs text-amber-950 font-medium">{selectedReq.reason}</p>
                </div>

                {/* Proposed Data Payload / Snapshot */}
                {selectedReq.payload && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-[#0F8B8D]" /> Proposed Master Item Specifications
                    </h4>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Type:</span>
                        <strong className="text-slate-800">{selectedReq.payload.type}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Category:</span>
                        <strong className="text-slate-800">{selectedReq.payload.cat || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Resin / Material:</span>
                        <strong className="text-slate-800">{selectedReq.payload.resinType || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Base UOM:</span>
                        <strong className="text-slate-800">{selectedReq.payload.baseUOM || 'PCS'}</strong>
                      </div>
                      {selectedReq.payload.cycleTime && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">Cycle Time:</span>
                          <strong className="text-slate-800">{selectedReq.payload.cycleTime}s</strong>
                        </div>
                      )}
                      {selectedReq.payload.partWeightGrams && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">Part Weight:</span>
                          <strong className="text-slate-800">{selectedReq.payload.partWeightGrams}g</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* If Deletion Request */}
                {selectedReq.requestType === 'DELETE' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> High Risk Deletion Notice
                    </div>
                    <p className="text-xs text-rose-900">
                      Approving this request will permanently unregister SKU <strong>{selectedReq.itemCode}</strong> from the active master catalog and quarantine any associated shopfloor references.
                    </p>
                  </div>
                )}

                {/* Review Notes (if active is pending) */}
                {selectedReq.status === 'pending' && (
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Admin Decision Notes / Verification Comments
                    </label>
                    <textarea
                      rows={2}
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Add compliance notes or reason for approval / rejection..."
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {/* If already reviewed */}
                {selectedReq.status !== 'pending' && (
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-700">
                      Review Decision: {selectedReq.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Reviewed by <strong>{selectedReq.reviewedBy}</strong> on{' '}
                      {selectedReq.reviewedAt ? new Date(selectedReq.reviewedAt).toLocaleString() : '—'}
                    </div>
                    {selectedReq.reviewComment && (
                      <div className="text-[11px] text-slate-600 italic">
                        &ldquo;{selectedReq.reviewComment}&rdquo;
                      </div>
                    )}
                  </div>
                )}

                {/* Actions Footer */}
                {selectedReq.status === 'pending' && (
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleReject(selectedReq)}
                      className="btn btn-sm btn-ghost border text-rose-700 border-rose-200 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject Request
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApprove(selectedReq)}
                      className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve &amp; Execute Live
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-24 text-slate-400 space-y-2 my-auto">
                <FileText className="w-10 h-10 mx-auto text-slate-300" />
                <div className="text-xs font-semibold">Select a change request from the left list to review</div>
                <div className="text-[11px] text-slate-400">
                  You can inspect specifications, review justification, and approve or reject with 1 click.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Admin approval commits changes directly to live PostgreSQL database and item catalog.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
          >
            Close Center
          </button>
        </div>
      </div>
    </div>
  );
};
