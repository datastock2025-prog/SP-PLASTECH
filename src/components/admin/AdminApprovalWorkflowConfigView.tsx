import React, { useState } from 'react';
import {
  GitFork,
  Plus,
  ArrowRight,
  Clock,
  Mail,
  Smartphone,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Settings2,
  ChevronDown,
  Trash2,
  Save,
  MessageSquare,
} from 'lucide-react';
import { WorkflowRuleConfig, mockWorkflowConfigs } from '../../data/mockAdminExtendedData';

interface AdminApprovalWorkflowConfigViewProps {
  showToast?: (msg: string) => void;
}

export const AdminApprovalWorkflowConfigView: React.FC<AdminApprovalWorkflowConfigViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [workflows, setWorkflows] = useState<WorkflowRuleConfig[]>(mockWorkflowConfigs);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);

  const selectedWf = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];

  const handleToggleActive = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const next = !w.isActive;
          showToast(`Workflow "${w.name}" is now ${next ? 'Active' : 'Draft/Disabled'}.`);
          return { ...w, isActive: next };
        }
        return w;
      })
    );
  };

  const handleAddStage = () => {
    if (!selectedWf) return;
    const nextStageNum = selectedWf.stages.length + 1;
    const newStage = {
      stageNumber: nextStageNum,
      stageName: `Stage ${nextStageNum}: Executive Sign-off`,
      approverType: 'Role' as const,
      approverValue: 'VP of Operations',
      escalateAfterHours: 24,
      escalateTo: 'Managing Director',
      requireComment: true,
      notifyVia: ['Email' as const, 'InApp' as const],
    };

    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === selectedWf.id) {
          return { ...w, stages: [...w.stages, newStage] };
        }
        return w;
      })
    );
    showToast(`Added Stage ${nextStageNum} to ${selectedWf.name}.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <GitFork className="w-4 h-4 text-[#0F8B8D]" />
            <span>Governance &amp; Authorization Matrices</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Approval Workflow Configuration Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-tier hierarchical approvals, auto-escalation SLAs, and threshold conditions for high-cost resin POs, mold trials, and scrap write-offs.
          </p>
        </div>

        <button
          onClick={() => showToast('Workflow rule configuration saved and deployed across ERP services.')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          Deploy All Workflows
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workflow Directory (Left Column) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
            <span>Configured Workflows ({workflows.length})</span>
            <button
              onClick={() => showToast('Opened custom workflow wizard.')}
              className="text-[#0F8B8D] hover:underline flex items-center gap-1 normal-case font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          </div>

          {workflows.map((wf) => {
            const isSelected = wf.id === selectedWorkflowId;
            return (
              <div
                key={wf.id}
                onClick={() => setSelectedWorkflowId(wf.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F8B8D]/5 border-[#0F8B8D] shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                    {wf.module}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      wf.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {wf.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <h3 className="font-bold text-xs text-slate-900 mt-2">{wf.name}</h3>
                <div className="text-[11px] text-slate-500 mt-0.5">Doc: {wf.documentType}</div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>{wf.stages.length} Approval Stages</span>
                  <span className="font-mono text-slate-700 font-semibold">{wf.slaHoursTotal}h Total SLA</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Workflow Canvas & Inspector (Right Column) */}
        {selectedWf && (
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Document: {selectedWf.documentType} &middot; Module: {selectedWf.module}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedWf.name}</h2>
                <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">{selectedWf.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(selectedWf.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    selectedWf.isActive
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      : 'bg-emerald-600 text-white border-transparent'
                  }`}
                >
                  {selectedWf.isActive ? 'Disable Rule' : 'Activate Rule'}
                </button>
              </div>
            </div>

            {/* Trigger Conditions Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  Trigger Evaluation Formula
                </span>
                {selectedWf.minAmount && (
                  <span className="text-xs font-semibold text-emerald-700 font-mono">
                    Financial Gate: &gt;= ₹{selectedWf.minAmount.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-xs shadow-inner">
                {selectedWf.conditionFormula}
              </div>
              <p className="text-[11px] text-slate-500">
                Any transaction matching this condition will be intercepted and routed into this sequential queue.
              </p>
            </div>

            {/* Sequential Stage Pipeline */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Sequential Approval Stages ({selectedWf.stages.length})
                </h3>
                <button
                  onClick={handleAddStage}
                  className="flex items-center gap-1 text-xs font-semibold text-[#0F8B8D] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Append Stage
                </button>
              </div>

              <div className="space-y-4 relative before:content-[''] before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                {selectedWf.stages.map((stg, idx) => (
                  <div
                    key={stg.stageNumber}
                    className="relative pl-12 bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all"
                  >
                    {/* Badge circle */}
                    <div className="absolute left-2.5 top-4.5 w-6 h-6 rounded-full bg-[#0F8B8D] text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                      {stg.stageNumber}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{stg.stageName}</h4>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="text-indigo-600 font-semibold">
                            {stg.approverType}: {stg.approverValue}
                          </span>
                          <span>&middot;</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400" /> Max SLA: {stg.escalateAfterHours} Hours
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {stg.notifyVia.map((ch) => (
                          <span
                            key={ch}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Auto-Escalation Target
                        </span>
                        <span className="text-slate-800 font-medium">{stg.escalateTo}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mandatory Notes</span>
                        <span className="text-slate-800 font-medium">
                          {stg.requireComment ? 'Reviewer justification required' : 'Optional comments'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
