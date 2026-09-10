import React, { useState } from 'react';
import {
  GitFork,
  Plus,
  Edit2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Sliders,
  DollarSign,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { ApprovalWorkflow, ApprovalTier } from '../../types/admin';
import { mockApprovalWorkflows, mockAdminRoles } from '../../data/mockAdminData';

interface AdminWorkflowsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminWorkflowsView: React.FC<AdminWorkflowsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(mockApprovalWorkflows);
  const [selectedWfId, setSelectedWfId] = useState<string>(workflows[0]?.id || '');
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [newTierData, setNewTierData] = useState<Partial<ApprovalTier>>({
    tierLevel: 4,
    tierName: '',
    approverRoleId: 'ROLE-SUPER-ADMIN',
    conditionDescription: '',
    thresholdAmount: 1000000,
    slaHours: 24,
    autoEscalateAfterSla: true,
    escalationTargetRole: 'Super Administrator',
  });

  const selectedWf = workflows.find((w) => w.id === selectedWfId) || workflows[0];

  const handleToggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const nextState = !w.isActive;
          showToast(`Workflow "${w.workflowName}" is now ${nextState ? 'Active' : 'Paused'}.`);
          return { ...w, isActive: nextState };
        }
        return w;
      })
    );
  };

  const handleAddTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTierData.tierName) {
      showToast('Please specify tier name.');
      return;
    }

    const approverRole = mockAdminRoles.find((r) => r.id === newTierData.approverRoleId);

    const newTier: ApprovalTier = {
      tierLevel: selectedWf.tiers.length + 1,
      tierName: newTierData.tierName,
      approverRoleId: newTierData.approverRoleId || 'ROLE-SUPER-ADMIN',
      approverRoleName: approverRole?.name || 'Authorized Approver',
      conditionDescription: newTierData.conditionDescription || 'Standard threshold review',
      thresholdAmount: newTierData.thresholdAmount,
      slaHours: newTierData.slaHours || 24,
      autoEscalateAfterSla: newTierData.autoEscalateAfterSla || false,
      escalationTargetRole: newTierData.escalationTargetRole,
    };

    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === selectedWfId ? { ...w, tiers: [...w.tiers, newTier] } : w
      )
    );
    setIsTierModalOpen(false);
    showToast(`Added approval tier "${newTier.tierName}" to workflow.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <GitFork className="w-4 h-4 text-[#0F8B8D]" />
            <span>Multi-Tier Enterprise Authorization</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Approval Workflow &amp; Escalation Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define multi-level sign-off rules, monetary authorization limits, SLA deadlines, and auto-escalation pathways for key transactions.
          </p>
        </div>

        <button
          onClick={() => setIsTierModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Approval Stage
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflows Navigation List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
            Configured Approval Matrices
          </div>

          <div className="space-y-2">
            {workflows.map((wf) => {
              const isSelected = wf.id === selectedWfId;
              return (
                <div
                  key={wf.id}
                  onClick={() => setSelectedWfId(wf.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0F8B8D]/10 border-[#0F8B8D] shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {wf.module}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWorkflow(wf.id);
                      }}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                        wf.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {wf.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 mt-2">{wf.workflowName}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{wf.description}</p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span>{wf.tiers.length} Approval Stages</span>
                    <span>Document: {wf.documentType}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Workflow Detail & Visual Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-slate-900">{selectedWf.workflowName}</h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      selectedWf.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {selectedWf.isActive ? 'Policy Enforced' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedWf.description}</p>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Trigger: <span className="text-slate-700 font-semibold">{selectedWf.triggerCondition}</span>
              </div>
            </div>

            {/* Visual Step Pipeline */}
            <div className="mt-6 space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sequential Authorization Flow
              </div>

              <div className="space-y-3">
                {selectedWf.tiers.map((tier, idx) => (
                  <div
                    key={tier.tierLevel}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Step indicator */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0F8B8D] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {tier.tierLevel}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{tier.tierName}</div>
                        <div className="text-xs text-[#0F8B8D] font-semibold mt-0.5 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Designated Approver: {tier.approverRoleName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Condition: {tier.conditionDescription}
                        </div>
                      </div>
                    </div>

                    {/* Right side metrics: SLA and escalation */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>SLA Target: <strong>{tier.slaHours} hours</strong></span>
                      </div>
                      {tier.autoEscalateAfterSla && (
                        <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          Auto-escalates to: {tier.escalationTargetRole || 'Super Admin'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Upon Tier {selectedWf.tiers.length} sign-off, system automatically releases the transaction for production/purchase execution.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Approval Tier */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add Authorization Stage</h3>
            <p className="text-xs text-slate-500 mb-4">
              Attach an additional review step to {selectedWf.workflowName}.
            </p>

            <form onSubmit={handleAddTier} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stage Title *</label>
                <input
                  type="text"
                  required
                  value={newTierData.tierName}
                  onChange={(e) => setNewTierData({ ...newTierData, tierName: e.target.value })}
                  placeholder="e.g. Tier 4 — Managing Director Authorization"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approver RBAC Role *</label>
                <select
                  value={newTierData.approverRoleId}
                  onChange={(e) => setNewTierData({ ...newTierData, approverRoleId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  {mockAdminRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trigger Condition / Description</label>
                <input
                  type="text"
                  value={newTierData.conditionDescription}
                  onChange={(e) => setNewTierData({ ...newTierData, conditionDescription: e.target.value })}
                  placeholder="e.g. Transaction value exceeds ₹50,00,000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SLA Target (Hours)</label>
                  <input
                    type="number"
                    value={newTierData.slaHours}
                    onChange={(e) => setNewTierData({ ...newTierData, slaHours: parseInt(e.target.value) || 24 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Threshold Amount (₹)</label>
                  <input
                    type="number"
                    value={newTierData.thresholdAmount}
                    onChange={(e) => setNewTierData({ ...newTierData, thresholdAmount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTierData.autoEscalateAfterSla}
                    onChange={(e) => setNewTierData({ ...newTierData, autoEscalateAfterSla: e.target.checked })}
                    className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                  />
                  <span className="font-semibold text-slate-700">Auto-escalate if SLA breached</span>
                </label>

                {newTierData.autoEscalateAfterSla && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Escalate To Role</label>
                    <input
                      type="text"
                      value={newTierData.escalationTargetRole || ''}
                      onChange={(e) => setNewTierData({ ...newTierData, escalationTargetRole: e.target.value })}
                      placeholder="e.g. Plant Operations Manager"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTierModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm"
                >
                  Append Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
