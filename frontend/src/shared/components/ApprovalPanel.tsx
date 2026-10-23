import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  AlertCircle,
  Send,
  MessageSquare,
  UserCheck,
  Check,
  X,
} from 'lucide-react';
import { useApprovalRequests, useDecideApprovalRequest, useMe } from '../../features/identity/useIdentity';

export interface ApprovalPanelProps {
  entityType: string;
  entityId: string;
  amount?: number;
  onDecisionComplete?: () => void;
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({
  entityType,
  entityId,
  amount,
  onDecisionComplete,
}) => {
  const { data: me } = useMe();
  const { data: requests = [], isLoading } = useApprovalRequests({ entityType });
  const decideMutation = useDecideApprovalRequest();

  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Find approval request for this entity
  const activeRequest = requests.find((r: any) => r.entity_id === entityId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-xs text-slate-500 animate-pulse">
        <Clock className="h-4 w-4 text-slate-400" /> Loading approval workflow status...
      </div>
    );
  }

  if (!activeRequest) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          No Pending Authorizations Required
        </div>
        <p className="mt-1">
          This record ({entityType}) is either pre-approved or below the statutory monetary threshold.
        </p>
      </div>
    );
  }

  const isPending = activeRequest.status === 'PENDING';
  const isSubmitter = me?.id === activeRequest.requested_by;
  const isSuperadmin = me?.roleCode === 'admin' || me?.roleCode === 'director';
  const isSelfApprovalBlocked = isSubmitter && !isSuperadmin;

  const handleDecision = async (action: 'APPROVE' | 'REJECT') => {
    setErrorMsg(null);
    if (action === 'REJECT' && !comment.trim()) {
      setErrorMsg('A rejection reason or note is required for the audit trail.');
      return;
    }

    try {
      await decideMutation.mutateAsync({
        id: activeRequest.id,
        action,
        comments: comment.trim() || undefined,
      });
      setComment('');
      onDecisionComplete?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit decision.');
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Authorization Governance
          </span>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {activeRequest.workflow_name || 'Standard Tiered Approval'}
          </h4>
        </div>
        <div>
          {activeRequest.status === 'APPROVED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> Fully Approved
            </span>
          )}
          {activeRequest.status === 'REJECTED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
              <XCircle className="h-3 w-3" /> Rejected
            </span>
          )}
          {activeRequest.status === 'PENDING' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <Clock className="h-3 w-3" /> Awaiting Step {activeRequest.current_step_number} Sign-off
            </span>
          )}
        </div>
      </div>

      {isPending && isSelfApprovalBlocked && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-semibold">Segregation of Duties (SoD) Active:</span> You submitted this request.
            Enterprise governance policy prohibits self-approval of transactions. A distinct authorized manager must sign off.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isPending && !isSelfApprovalBlocked && (
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Decision Comments / Reviewer Remarks
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Verified vendor quote and mold maintenance inspection passed..."
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={decideMutation.isPending}
              onClick={() => handleDecision('REJECT')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <X className="h-3.5 w-3.5" /> Reject Request
            </button>
            <button
              type="button"
              disabled={decideMutation.isPending}
              onClick={() => handleDecision('APPROVE')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Check className="h-3.5 w-3.5" /> Authorize & Sign
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
