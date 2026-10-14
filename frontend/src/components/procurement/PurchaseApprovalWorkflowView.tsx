import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  User,
  Building,
  ArrowRight,
  Filter,
  Layers,
} from 'lucide-react';
import {
  PurchaseRequisition,
  ExtendedPurchaseOrder,
  SupplierMaster,
} from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';

interface Props {
  prs: PurchaseRequisition[];
  pos: ExtendedPurchaseOrder[];
  suppliers: SupplierMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdatePR: (pr: PurchaseRequisition) => void;
  onUpdatePO: (po: ExtendedPurchaseOrder) => void;
  showToast: (msg: string) => void;
}

export const PurchaseApprovalWorkflowView: React.FC<Props> = ({
  prs,
  pos,
  suppliers,
  onNavigate,
  onUpdatePR,
  onUpdatePO,
  showToast,
}) => {
  const [activeType, setActiveType] = useState<'All' | 'PR' | 'PO' | 'Supplier'>('All');

  const pendingPrs = prs.filter((p) => p.status === 'pending_approval');
  const pendingPos = pos.filter((p) => p.approvalStatus === 'pending');
  const pendingSuppliers = suppliers.filter((s) => s.status === 'pending_approval');

  const totalPendingCount = pendingPrs.length + pendingPos.length + pendingSuppliers.length;

  const handleApprovePR = (pr: PurchaseRequisition) => {
    const updated: PurchaseRequisition = {
      ...pr,
      status: 'approved',
      approvalStatus: 'approved',
      approvalHistory: [
        ...(pr.approvalHistory || []),
        {
          step: 2,
          role: 'Procurement VP',
          user: 'You (VP Supply Chain)',
          action: 'Approved',
          date: new Date().toISOString().slice(0, 10),
          comment: 'Approved for purchase order release',
        }
      ]
    };
    onUpdatePR(updated);
    showToast(`Approved PR ${pr.prNumber} (₹${(pr.estimatedTotal / 100000).toFixed(2)}L)`);
  };

  const handleRejectPR = (pr: PurchaseRequisition) => {
    const updated: PurchaseRequisition = {
      ...pr,
      status: 'rejected',
      approvalStatus: 'rejected',
    };
    onUpdatePR(updated);
    showToast(`Rejected PR ${pr.prNumber}`);
  };

  const handleApprovePO = (po: ExtendedPurchaseOrder) => {
    const updated: ExtendedPurchaseOrder = {
      ...po,
      status: 'approved',
      approvalStatus: 'approved',
    };
    onUpdatePO(updated);
    showToast(`Approved Purchase Order ${po.poNumber}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Procurement Approval Workflow Hub
          </h1>
          <p className="text-xs text-slate-500">
            Multi-tier executive sign-offs for purchase requisitions, high-value purchase orders, and new vendor onboarding
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-700" /> {totalPendingCount} Items Awaiting Sign-off
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveType('All')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            activeType === 'All' ? 'bg-[#14213D] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Pending ({totalPendingCount})
        </button>
        <button
          onClick={() => setActiveType('PR')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            activeType === 'PR' ? 'bg-[#14213D] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Requisitions ({pendingPrs.length})
        </button>
        <button
          onClick={() => setActiveType('PO')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            activeType === 'PO' ? 'bg-[#14213D] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Purchase Orders ({pendingPos.length})
        </button>
        <button
          onClick={() => setActiveType('Supplier')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            activeType === 'Supplier' ? 'bg-[#14213D] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Vendor Onboarding ({pendingSuppliers.length})
        </button>
      </div>

      {/* Approval List */}
      <div className="space-y-4">
        {/* Pending PRs */}
        {(activeType === 'All' || activeType === 'PR') &&
          pendingPrs.map((pr) => (
            <div
              key={pr.id}
              className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#14213D]">{pr.prNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                    Requisition ({pr.source})
                  </span>
                  <span className="text-xs text-slate-500">Dept: {pr.department} • Requester: {pr.requestedBy}</span>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Estimated Value</div>
                  <div className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D]">
                    ₹{(pr.estimatedTotal / 100000).toFixed(2)} Lakhs
                  </div>
                </div>
              </div>

              {/* Material Detail */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px] uppercase">Requested Materials</div>
                  <div className="font-bold text-[#14213D] mt-0.5">{pr.lines[0]?.itemName}</div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    {pr.lines[0]?.quantity.toLocaleString()} {pr.lines[0]?.uom} @ ₹{pr.lines[0]?.estimatedUnitPrice}/kg
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px] uppercase">Business Need & Urgency</div>
                  <div className="font-bold text-[#14213D] mt-0.5">Priority: {pr.priority}</div>
                  <div className="text-slate-500 text-[11px]">Required by {pr.requiredDate} at {pr.plantWarehouse}</div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-emerald-800 text-[10px] uppercase font-semibold">Budget Validation</div>
                  <div className="font-bold text-emerald-800 mt-0.5">Within Monthly Spending Cap</div>
                  <div className="text-emerald-700 text-[11px]">₹15L Allocated • ₹7.15L Remaining</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => onNavigate('prDetail', { id: pr.id })}
                  className="text-xs text-[#0F8B8D] font-semibold hover:underline"
                >
                  View Full PR Details
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRejectPR(pr)}
                    className="px-3.5 py-1.5 border border-red-300 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprovePR(pr)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    Approve PR
                  </button>
                </div>
              </div>
            </div>
          ))}

        {/* Pending POs */}
        {(activeType === 'All' || activeType === 'PO') &&
          pendingPos.map((po) => (
            <div
              key={po.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#14213D]">{po.poNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                    Purchase Order Release
                  </span>
                  <span className="text-xs text-slate-500">Supplier: {po.supplierName}</span>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">PO Commitment Value</div>
                  <div className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D]">
                    ₹{(po.totalAmount / 100000).toFixed(2)} Lakhs
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => onNavigate('poDetail', { id: po.id })}
                  className="text-xs text-[#0F8B8D] font-semibold hover:underline"
                >
                  Inspect PO Lines
                </button>

                <button
                  onClick={() => handleApprovePO(po)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Release PO
                </button>
              </div>
            </div>
          ))}

        {totalPendingCount === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-700">All Approvals Cleared</div>
            <div className="text-xs text-slate-500 mt-1">There are no purchase requisitions or orders pending executive review.</div>
          </div>
        )}
      </div>
    </div>
  );
};
