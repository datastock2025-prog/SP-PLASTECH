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
  X,
  Check,
  Radio,
  FileText,
  Send,
  Zap,
  Download,
  AlertCircle,
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
  
  // Modals state
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [isAppendStageModalOpen, setIsAppendStageModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);

  // New Rule Form
  const [ruleForm, setRuleForm] = useState({
    name: '',
    documentType: 'Purchase Order (PO)',
    module: 'Procurement',
    description: '',
    minAmount: 200000,
    conditionFormula: 'PO.Category == "Polymer Resin" && PO.TotalAmount >= 200000',
    initialStageName: 'Commercial & Budget Verification',
    initialApproverType: 'Role' as 'Role' | 'Department Head' | 'Specific User',
    initialApproverValue: 'SCM Purchase Manager',
    initialSlaHours: 24,
    initialEscalateTo: 'VP of Supply Chain',
  });

  // Append Stage Form
  const [stageForm, setStageForm] = useState({
    stageName: '',
    approverType: 'Role' as 'Role' | 'Department Head' | 'Specific User',
    approverValue: 'Financial Controller',
    escalateAfterHours: 24,
    escalateTo: 'Chief Financial Officer (CFO)',
    requireComment: true,
    notifyVia: ['Email', 'InApp'] as ('Email' | 'InApp' | 'WhatsApp' | 'SMS')[],
  });

  const selectedWf = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];

  // Toggle Rule Status
  const handleToggleActive = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const next = !w.isActive;
          showToast(`Workflow "${w.name}" is now ${next ? 'Active' : 'Draft / Disabled'}.`);
          return { ...w, isActive: next };
        }
        return w;
      })
    );
  };

  // Open Add Rule Modal
  const handleOpenAddRule = () => {
    setRuleForm({
      name: '',
      documentType: 'Purchase Order (PO)',
      module: 'Procurement',
      description: '',
      minAmount: 250000,
      conditionFormula: 'PO.TotalAmount >= 250000 && PO.Status == "Draft"',
      initialStageName: 'Technical & Commercial Verification',
      initialApproverType: 'Role',
      initialApproverValue: 'SCM Purchase Manager',
      initialSlaHours: 24,
      initialEscalateTo: 'VP of Supply Chain',
    });
    setIsAddRuleModalOpen(true);
  };

  // Save New Workflow Rule
  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.name) {
      showToast('Please specify a rule name.');
      return;
    }

    const newId = `WF-CUSTOM-${Date.now().toString().slice(-4)}`;
    const newWorkflow: WorkflowRuleConfig = {
      id: newId,
      name: ruleForm.name,
      documentType: ruleForm.documentType,
      module: ruleForm.module,
      description: ruleForm.description || 'Custom multi-tier authorization matrix.',
      isActive: true,
      minAmount: ruleForm.minAmount,
      conditionFormula: ruleForm.conditionFormula,
      slaHoursTotal: ruleForm.initialSlaHours,
      stages: [
        {
          stageNumber: 1,
          stageName: ruleForm.initialStageName || 'Stage 1 Sign-off',
          approverType: ruleForm.initialApproverType,
          approverValue: ruleForm.initialApproverValue,
          escalateAfterHours: ruleForm.initialSlaHours,
          escalateTo: ruleForm.initialEscalateTo || 'Plant Operations Head',
          requireComment: true,
          notifyVia: ['Email', 'InApp'],
        },
      ],
    };

    setWorkflows([newWorkflow, ...workflows]);
    setSelectedWorkflowId(newWorkflow.id);
    setIsAddRuleModalOpen(false);
    showToast(`Workflow Rule "${newWorkflow.name}" created successfully.`);
  };

  // Open Append Stage Modal
  const handleOpenAppendStage = () => {
    if (!selectedWf) return;
    const nextStageNum = selectedWf.stages.length + 1;
    setStageForm({
      stageName: `Stage ${nextStageNum}: Executive Authorization`,
      approverType: 'Role',
      approverValue: 'Financial Controller',
      escalateAfterHours: 24,
      escalateTo: 'Managing Director',
      requireComment: true,
      notifyVia: ['Email', 'InApp'],
    });
    setIsAppendStageModalOpen(true);
  };

  // Save Appended Stage
  const handleSaveAppendedStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWf || !stageForm.stageName) {
      showToast('Please enter a stage name.');
      return;
    }

    const nextStageNum = selectedWf.stages.length + 1;
    const newStage = {
      stageNumber: nextStageNum,
      stageName: stageForm.stageName,
      approverType: stageForm.approverType,
      approverValue: stageForm.approverValue,
      escalateAfterHours: Number(stageForm.escalateAfterHours) || 24,
      escalateTo: stageForm.escalateTo,
      requireComment: stageForm.requireComment,
      notifyVia: stageForm.notifyVia,
    };

    const updatedStages = [...selectedWf.stages, newStage];
    const totalSla = updatedStages.reduce((sum, s) => sum + s.escalateAfterHours, 0);

    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === selectedWf.id) {
          return { ...w, stages: updatedStages, slaHoursTotal: totalSla };
        }
        return w;
      })
    );

    setIsAppendStageModalOpen(false);
    showToast(`Appended Stage ${nextStageNum} ("${newStage.stageName}") to ${selectedWf.name}.`);
  };

  // Delete a Stage
  const handleDeleteStage = (stageNum: number) => {
    if (!selectedWf || selectedWf.stages.length <= 1) {
      showToast('Workflow must have at least one approval stage.');
      return;
    }

    const filtered = selectedWf.stages
      .filter((s) => s.stageNumber !== stageNum)
      .map((s, idx) => ({ ...s, stageNumber: idx + 1 }));

    const totalSla = filtered.reduce((sum, s) => sum + s.escalateAfterHours, 0);

    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === selectedWf.id) {
          return { ...w, stages: filtered, slaHoursTotal: totalSla };
        }
        return w;
      })
    );
    showToast(`Removed stage ${stageNum}. Sequential numbering updated.`);
  };

  // Toggle Notification Channel for Stage Form
  const toggleNotifyChannel = (ch: 'Email' | 'InApp' | 'WhatsApp' | 'SMS') => {
    setStageForm((prev) => {
      const exists = prev.notifyVia.includes(ch);
      return {
        ...prev,
        notifyVia: exists ? prev.notifyVia.filter((c) => c !== ch) : [...prev.notifyVia, ch],
      };
    });
  };

  // Handle Deploy All Workflows
  const handleOpenDeploy = () => {
    setIsDeployModalOpen(true);
    setDeploymentSuccess(false);
    setIsDeploying(false);
  };

  const handleExecuteDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setDeploymentSuccess(true);
      showToast(`Successfully compiled and deployed ${workflows.filter((w) => w.isActive).length} active workflow matrices.`);
    }, 1200);
  };

  // Export Matrix JSON
  const handleExportMatrix = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workflows, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Approval_Matrices_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported complete authorization matrices JSON.');
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

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportMatrix}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Matrices
          </button>
          <button
            onClick={handleOpenDeploy}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Deploy All Workflows
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workflow Directory (Left Column) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
            <span>Configured Workflows ({workflows.length})</span>
            <button
              onClick={handleOpenAddRule}
              className="text-[#0F8B8D] hover:underline flex items-center gap-1 normal-case font-semibold cursor-pointer"
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    selectedWf.isActive
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      : 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700'
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
                  onClick={handleOpenAppendStage}
                  className="flex items-center gap-1 text-xs font-semibold text-[#0F8B8D] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Append Stage
                </button>
              </div>

              <div className="space-y-4 relative before:content-[''] before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                {selectedWf.stages.map((stg) => (
                  <div
                    key={stg.stageNumber}
                    className="relative pl-12 bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all group"
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

                      <div className="flex items-center gap-2">
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
                        {selectedWf.stages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStage(stg.stageNumber)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Remove Stage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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

      {/* ========================================================================= */}
      {/* MODAL: ADD WORKFLOW RULE */}
      {/* ========================================================================= */}
      {isAddRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Create New Workflow Rule</h3>
                <p className="text-xs text-slate-500 mt-0.5">Define trigger conditions and initial authorization gate.</p>
              </div>
              <button
                onClick={() => setIsAddRuleModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workflow Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterbatch Batch Release Sign-off (>₹2.5 Lakhs)"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Document Type</label>
                  <select
                    value={ruleForm.documentType}
                    onChange={(e) => setRuleForm({ ...ruleForm, documentType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Purchase Order (PO)">Purchase Order (PO)</option>
                    <option value="Material Review Board (MRB)">Material Review Board (MRB)</option>
                    <option value="Engineering Change Order (ECO)">Engineering Change Order (ECO)</option>
                    <option value="Goods Receipt Note (GRN)">Goods Receipt Note (GRN)</option>
                    <option value="Sales Order (SO)">Sales Order (SO)</option>
                    <option value="Scrap & Purge Lump Quarantine">Scrap &amp; Purge Lump Quarantine</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ERP Module</label>
                  <select
                    value={ruleForm.module}
                    onChange={(e) => setRuleForm({ ...ruleForm, module: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Procurement">Procurement</option>
                    <option value="Quality & Shopfloor">Quality &amp; Shopfloor</option>
                    <option value="Tooling & R&D">Tooling &amp; R&amp;D</option>
                    <option value="Inventory & Logistics">Inventory &amp; Logistics</option>
                    <option value="Finance & Accounts">Finance &amp; Accounts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Financial Gate Threshold (₹)</label>
                  <input
                    type="number"
                    value={ruleForm.minAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, minAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max SLA Duration (Hours)</label>
                  <input
                    type="number"
                    value={ruleForm.initialSlaHours}
                    onChange={(e) => setRuleForm({ ...ruleForm, initialSlaHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trigger Condition Expression</label>
                <input
                  type="text"
                  required
                  value={ruleForm.conditionFormula}
                  onChange={(e) => setRuleForm({ ...ruleForm, conditionFormula: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose &amp; Scope Description</label>
                <textarea
                  rows={2}
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  placeholder="Describe when this workflow is triggered and compliance requirements..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {/* Stage 1 details */}
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200/70 space-y-3">
                <span className="font-bold text-teal-900 block text-[11px] uppercase tracking-wider">
                  Initial Stage 1 Sign-off Gate
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Stage 1 Name</label>
                    <input
                      type="text"
                      value={ruleForm.initialStageName}
                      onChange={(e) => setRuleForm({ ...ruleForm, initialStageName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Approver Role</label>
                    <select
                      value={ruleForm.initialApproverValue}
                      onChange={(e) => setRuleForm({ ...ruleForm, initialApproverValue: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="SCM Purchase Manager">SCM Purchase Manager</option>
                      <option value="Quality Assurance Lead">Quality Assurance Lead</option>
                      <option value="Financial Controller">Financial Controller</option>
                      <option value="Lead Tooling Engineer">Lead Tooling Engineer</option>
                      <option value="Plant Manager">Plant Manager</option>
                      <option value="Executive Director">Executive Director</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Escalate To (if breached)</label>
                  <input
                    type="text"
                    value={ruleForm.initialEscalateTo}
                    onChange={(e) => setRuleForm({ ...ruleForm, initialEscalateTo: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddRuleModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                >
                  Create Workflow Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPEND APPROVAL STAGE */}
      {/* ========================================================================= */}
      {isAppendStageModalOpen && selectedWf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Append Stage {selectedWf.stages.length + 1} &mdash; {selectedWf.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Add next authorization level in the sequential chain.</p>
              </div>
              <button
                onClick={() => setIsAppendStageModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppendedStage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stage Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stage 3: Board Expenditure Approval"
                  value={stageForm.stageName}
                  onChange={(e) => setStageForm({ ...stageForm, stageName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Approver Entity Type</label>
                  <select
                    value={stageForm.approverType}
                    onChange={(e) =>
                      setStageForm({
                        ...stageForm,
                        approverType: e.target.value as 'Role' | 'Department Head' | 'Specific User',
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Role">Role</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Specific User">Specific User</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Approver Role / Name</label>
                  <select
                    value={stageForm.approverValue}
                    onChange={(e) => setStageForm({ ...stageForm, approverValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Financial Controller">Financial Controller</option>
                    <option value="VP of Supply Chain">VP of Supply Chain</option>
                    <option value="Chief Financial Officer (CFO)">Chief Financial Officer (CFO)</option>
                    <option value="VP of Operations">VP of Operations</option>
                    <option value="Managing Director">Managing Director</option>
                    <option value="OEM Program Manager">OEM Program Manager</option>
                    <option value="Lead Tooling Engineer">Lead Tooling Engineer</option>
                    <option value="Plant Manager (Chakan)">Plant Manager (Chakan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max SLA Response (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={stageForm.escalateAfterHours}
                    onChange={(e) => setStageForm({ ...stageForm, escalateAfterHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Escalate Target on Breach</label>
                  <input
                    type="text"
                    value={stageForm.escalateTo}
                    onChange={(e) => setStageForm({ ...stageForm, escalateTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notification Channels</label>
                <div className="flex flex-wrap gap-2">
                  {(['Email', 'InApp', 'WhatsApp', 'SMS'] as const).map((ch) => {
                    const active = stageForm.notifyVia.includes(ch);
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleNotifyChannel(ch)}
                        className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0F8B8D]/10 border-[#0F8B8D] text-[#0F8B8D]'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requireComment"
                  checked={stageForm.requireComment}
                  onChange={(e) => setStageForm({ ...stageForm, requireComment: e.target.checked })}
                  className="rounded border-slate-300 text-[#0F8B8D] focus:ring-[#0F8B8D]"
                />
                <label htmlFor="requireComment" className="text-slate-700 font-medium cursor-pointer">
                  Require mandatory reviewer remarks / justification notes
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAppendStageModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                >
                  Append Stage to Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DEPLOY ALL WORKFLOWS */}
      {/* ========================================================================= */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center border border-teal-200">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Deploy Approval Workflow Matrices</h3>
                  <p className="text-xs text-slate-500">Live deployment across ERP transaction interceptors.</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeployModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!deploymentSuccess ? (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Deploying will compile all <strong>{workflows.length}</strong> configured rule trees into active AST memory across all plant database clusters.
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Active Workflow Rules:</span>
                    <strong className="text-slate-900">{workflows.filter((w) => w.isActive).length}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Disabled / Draft Rules:</span>
                    <strong className="text-slate-500">{workflows.filter((w) => !w.isActive).length}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Evaluated Stages:</span>
                    <strong className="text-[#0F8B8D]">{workflows.reduce((s, w) => s + w.stages.length, 0)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Expected Interception Latency:</span>
                    <strong className="text-emerald-700">&lt; 1.8ms</strong>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsDeployModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeploying}
                    onClick={handleExecuteDeploy}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isDeploying ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Compiling &amp; Syncing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        Confirm &amp; Deploy Matrices
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Matrices Deployed Successfully!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All active approval routes and SLA escalation rules are now operational in production.
                </p>
                <div className="pt-3">
                  <button
                    onClick={() => setIsDeployModalOpen(false)}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

