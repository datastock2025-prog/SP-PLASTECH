import React from 'react';
import { ItemMaster, AuthUser } from '@/src/types';
import { CheckCircle2, Clock, FileText, AlertTriangle, Check, X } from 'lucide-react';

export interface ItemApprovalTabProps {
  item: ItemMaster;
  currentUser?: AuthUser | null;
  onApprove: (item: ItemMaster) => void;
  onReject: (item: ItemMaster) => void;
  onSubmitForApproval: (item: ItemMaster) => void;
  canApproveItem: boolean;
  isSuperAdmin: boolean;
}

export const ItemApprovalTab: React.FC<ItemApprovalTabProps> = ({
  item,
  currentUser,
  onApprove,
  onReject,
  onSubmitForApproval,
  canApproveItem,
  isSuperAdmin,
}) => {
  const isApproved = item.approval === 'approved';
  const isPending = item.approval === 'pending' || item.approval === 'under_review';
  const isRejected = item.approval === 'rejected';
  const isDraft = !item.approval || item.approval === 'draft';
  const canDecide = canApproveItem || isSuperAdmin;

  const map: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700', label: 'Draft' },
    pending: { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800', label: 'Pending Approval' },
    under_review: { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800', label: 'Under Review' },
    approved: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', label: 'Approved & Released' },
    released: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', label: 'Released' },
    rejected: { bg: 'bg-rose-100 border-rose-300', text: 'text-rose-800', label: 'Rejected' },
  };
  const badge = map[item.approval || 'draft'] || map.draft;

  return (
    <div className="panel p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
        <div>
          <h3 className="font-bold text-sm text-[#14213D]">Enterprise Governance &amp; Lifecycle Approval</h3>
          <p className="text-xs text-gray-500">
            Multi-stage quality and engineering authorization pipeline. SKU is locked against structural changes once approved.
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text}`}>
          {badge.label}
        </span>
      </div>

      {isApproved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>SKU Fully Approved &amp; Released:</strong> Available across live Work Orders, BOM recipes, Purchase Orders, and Sales Orders. Structural identifiers (Code, Name, Description) are permanently locked.
            </span>
          </div>
          <span className="font-mono text-[10px] bg-white border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded font-bold shrink-0">
            IMMUTABLE
          </span>
        </div>
      )}

      {isPending && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Awaiting QA &amp; Technical Authority Review:</strong> This SKU is quarantined from active manufacturing orders until an authorized manager approves it.
          </span>
        </div>
      )}

      {isDraft && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-800">
          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Draft Specification:</strong> This SKU is in draft stage. Complete all mandatory technical specifications, then submit for QA approval.
          </span>
        </div>
      )}

      {isRejected && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-900">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>SKU Rejected:</strong> This item has been quarantined and rejected during technical review. Update necessary parameters and resubmit.
          </span>
        </div>
      )}

      {/* 3-Stage Visual Pipeline */}
      <div className="space-y-4 pt-1">
        <div className="timeline-item">
          <div className="t-dot" style={{ background: 'var(--success)' }} />
          <div>
            <div className="t-text font-bold text-xs text-[#14213D]">
              Stage 1: SKU Definition &amp; Mold Tooling Specs &mdash; Completed
            </div>
            <div className="t-time text-[11px] text-gray-500">
              Registered by {currentUser?.name || 'Production Engineer'} &middot; {item.createdOn || 'Initial Creation'}
            </div>
          </div>
        </div>

        <div className="timeline-item">
          <div
            className="t-dot"
            style={{
              background: isApproved
                ? 'var(--success)'
                : isRejected
                ? 'var(--danger)'
                : isPending
                ? 'var(--warning)'
                : '#9CA3AF',
            }}
          />
          <div>
            <div className="t-text font-bold text-xs text-[#14213D]">
              Stage 2: Technical &amp; Quality Review &mdash;{' '}
              {isApproved
                ? `Approved by ${item.approvedBy || 'Admin Authority'}`
                : isRejected
                ? 'Rejected during review'
                : isPending
                ? 'Pending Review'
                : 'Awaiting Submission'}
            </div>
            <div className="t-time text-[11px] text-gray-500">
              {isApproved
                ? 'Technical specifications verified against PPAP and mold shrinkage standard.'
                : isPending
                ? 'QA and Master Data Authority review in progress.'
                : 'Submit this SKU when initial parameters are populated.'}
            </div>
          </div>
        </div>

        <div className="timeline-item">
          <div
            className="t-dot"
            style={{
              background: isApproved ? 'var(--success)' : '#D1D5DB',
            }}
          />
          <div>
            <div className="t-text font-bold text-xs text-[#14213D]">
              Stage 3: Catalog Release &amp; Shopfloor Allocation
            </div>
            <div className="t-time text-[11px] text-gray-500">
              {isApproved
                ? 'Operational & active across all production plants.'
                : 'Inactive until Stage 2 sign-off.'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#E4E0D6]">
        {isDraft && (
          <button
            type="button"
            className="btn btn-sm btn-primary flex items-center gap-1.5 cursor-pointer"
            onClick={() => onSubmitForApproval(item)}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Submit for Technical &amp; QA Approval
          </button>
        )}

        {isPending && canDecide && (
          <>
            <button
              type="button"
              className="btn btn-sm btn-primary bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer"
              onClick={() => onApprove(item)}
            >
              <Check className="w-3.5 h-3.5" /> Approve &amp; Release to Catalog
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost text-[#C4433A] border-[#C4433A]/30 hover:bg-[#FBE1DE] flex items-center gap-1.5 cursor-pointer"
              onClick={() => onReject(item)}
            >
              <X className="w-3.5 h-3.5" /> Reject SKU
            </button>
          </>
        )}

        {isRejected && (
          <button
            type="button"
            className="btn btn-sm btn-primary flex items-center gap-1.5 cursor-pointer"
            onClick={() => onSubmitForApproval(item)}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Resubmit for Approval
          </button>
        )}
      </div>
    </div>
  );
};
