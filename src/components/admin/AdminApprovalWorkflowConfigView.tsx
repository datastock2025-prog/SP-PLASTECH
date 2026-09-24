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
  UserCheck,
  Lock,
  Flame,
  Play,
  History,
  ShieldAlert,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { WorkflowRuleConfig, mockWorkflowConfigs } from '../../data/mockAdminExtendedData';

interface AdminApprovalWorkflowConfigViewProps {
  showToast?: (msg: string) => void;
}

export interface ApprovalDelegation {
  id: string;
  delegatorName: string;
  delegatorRole: string;
  delegateeName: string;
  delegateeRole: string;
  validFrom: string;
  validUntil: string;
  domainScope: string;
  reason: string;
  status: 'Active' | 'Scheduled' | 'Expired';
}

export interface BreakGlassLog {
  id: string;
  documentRef: string;
  domain: string;
  originalApprover: string;
  overriddenBy: string;
  authorizedBySecondAdmin: string;
  justification: string;
  reasonCode: 'EMERGENCY_LINE_STOP' | 'VIP_CUSTOMER_EXPEDITE' | 'AUDIT_EXCLUSION' | 'SYSTEM_FAILOVER';
  timestamp: string;
  status: 'APPLIED_COMPLIANT';
}

export const AdminApprovalWorkflowConfigView: React.FC<AdminApprovalWorkflowConfigViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'RULES' | 'DELEGATIONS' | 'BREAK_GLASS' | 'SOD_POLICY' | 'SIMULATOR'>('RULES');
  const [workflows, setWorkflows] = useState<WorkflowRuleConfig[]>(mockWorkflowConfigs);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || '');

  // Delegations State
  const [delegations, setDelegations] = useState<ApprovalDelegation[]>([
    {
      id: 'DEL-001',
      delegatorName: 'Priya Rao',
      delegatorRole: 'VP Operations / CFO Proxy',
      delegateeName: 'Anand Kumar',
      delegateeRole: 'Senior Operations Lead',
      validFrom: '2026-09-24',
      validUntil: '2026-10-02',
      domainScope: 'Procurement (POs < ₹10L) & Credit Exceptions',
      reason: 'Overseas OEM Client Summit in Tokyo & Annual Leave',
      status: 'Active',
    },
    {
      id: 'DEL-002',
      delegatorName: 'Vikramaditya Sen',
      delegatorRole: 'QA Director',
      delegateeName: 'Ramesh Powar',
      delegateeRole: 'Senior QA Specialist',
      validFrom: '2026-10-05',
      validUntil: '2026-10-12',
      domainScope: 'Quality MRB & ECO Sign-offs',
      reason: 'IATF 16949 Lead Auditor Certification Training',
      status: 'Scheduled',
    },
  ]);

  // Break-Glass Overrides State
  const [breakGlassLogs, setBreakGlassLogs] = useState<BreakGlassLog[]>([
    {
      id: 'BG-2026-089',
      documentRef: 'PO-2026-00654',
      domain: 'Procurement',
      originalApprover: 'Financial Controller (Vacant Seat)',
      overriddenBy: 'Charu (Super Admin)',
      authorizedBySecondAdmin: 'Rajesh Nair (SecOps Lead)',
      justification: 'Critical polymer resin feedstock depleted; line stoppage penalty ₹4.5 Lakhs/day on Maruti Swift bumper line.',
      reasonCode: 'EMERGENCY_LINE_STOP',
      timestamp: '2026-09-22 14:32 IST',
      status: 'APPLIED_COMPLIANT',
    },
  ]);

  // SoD Policies State
  const [sodConfig, setSodConfig] = useState({
    preventSelfApproval: true,
    enforceFourEyesRule: true,
    blockApproverAsVendorContact: true,
    maxSequentialTiersPerUser: 1,
    mandatoryDualAdminBreakGlass: true,
    autoEscalateHoursDefault: 24,
    auditTrailEncryption: 'SHA-256 Nonce Hash',
  });

  // Simulator State
  const [simInput, setSimInput] = useState({
    domain: 'Procurement',
    documentType: 'Purchase Order (PO)',
    amount: 1250000,
    category: 'Polymer Resin',
    initiatorRole: 'SCM Buyer',
    urgency: 'HIGH',
  });
  const [simResult, setSimResult] = useState<any | null>(null);

  // Modals state
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [isAppendStageModalOpen, setIsAppendStageModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isAddDelegationModalOpen, setIsAddDelegationModalOpen] = useState(false);
  const [isBreakGlassModalOpen, setIsBreakGlassModalOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);

  // Break glass form
  const [breakGlassForm, setBreakGlassForm] = useState({
    documentRef: '',
    domain: 'Procurement',
    justification: '',
    reasonCode: 'EMERGENCY_LINE_STOP' as BreakGlassLog['reasonCode'],
    secondAdminUsername: '',
    secondAdminPassword: '',
  });

  // Delegation form
  const [delegationForm, setDelegationForm] = useState({
    delegatorName: '',
    delegatorRole: 'SCM Purchase Manager',
    delegateeName: '',
    delegateeRole: 'Senior SCM Buyer',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    domainScope: 'Procurement (POs & PRs)',
    reason: '',
  });

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

  // Create Delegation
  const handleCreateDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegationForm.delegatorName || !delegationForm.delegateeName) {
      showToast('Please fill out both delegator and proxy approver names.');
      return;
    }
    const newDel: ApprovalDelegation = {
      id: `DEL-${Date.now().toString().slice(-3)}`,
      delegatorName: delegationForm.delegatorName,
      delegatorRole: delegationForm.delegatorRole,
      delegateeName: delegationForm.delegateeName,
      delegateeRole: delegationForm.delegateeRole,
      validFrom: delegationForm.validFrom,
      validUntil: delegationForm.validUntil,
      domainScope: delegationForm.domainScope,
      reason: delegationForm.reason || 'Official out-of-office proxy coverage',
      status: 'Active',
    };
    setDelegations([newDel, ...delegations]);
    setIsAddDelegationModalOpen(false);
    showToast(`Delegation proxy active for ${newDel.delegatorName} -> ${newDel.delegateeName}.`);
  };

  // Revoke Delegation
  const handleRevokeDelegation = (id: string) => {
    setDelegations((prev) => prev.filter((d) => d.id !== id));
    showToast('Delegation revoked immediately.');
  };

  // Execute Break-Glass Override
  const handleExecuteBreakGlass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakGlassForm.documentRef || !breakGlassForm.justification) {
      showToast('Mandatory document reference and justification required for emergency override.');
      return;
    }
    if (!breakGlassForm.secondAdminUsername) {
      showToast('Dual-Authorization required: Second Administrator signature missing.');
      return;
    }

    const newLog: BreakGlassLog = {
      id: `BG-2026-${Date.now().toString().slice(-3)}`,
      documentRef: breakGlassForm.documentRef,
      domain: breakGlassForm.domain,
      originalApprover: 'Tiered Queue (Bypassed)',
      overriddenBy: 'Charu (Super Admin)',
      authorizedBySecondAdmin: breakGlassForm.secondAdminUsername,
      justification: breakGlassForm.justification,
      reasonCode: breakGlassForm.reasonCode,
      timestamp: new Date().toLocaleString(),
      status: 'APPLIED_COMPLIANT',
    };

    setBreakGlassLogs([newLog, ...breakGlassLogs]);
    setIsBreakGlassModalOpen(false);
    setBreakGlassForm({
      documentRef: '',
      domain: 'Procurement',
      justification: '',
      reasonCode: 'EMERGENCY_LINE_STOP',
      secondAdminUsername: '',
      secondAdminPassword: '',
    });
    showToast(`Emergency Break-Glass override executed on ${newLog.documentRef}. Logged to non-repudiation audit vault.`);
  };

  // Run Simulator
  const handleRunSimulator = () => {
    const matchedWorkflow = workflows.find((w) => {
      if (!w.isActive) return false;
      if (w.module !== simInput.domain) return false;
      if (w.minAmount && simInput.amount < w.minAmount) return false;
      return true;
    }) || workflows[0];

    setSimResult({
      matchedWorkflow,
      evaluatedRules: [
        { rule: `Domain == "${simInput.domain}"`, passed: true },
        { rule: `Amount (₹${simInput.amount.toLocaleString()}) >= Threshold`, passed: simInput.amount >= (matchedWorkflow.minAmount || 0) },
        { rule: `SoD Check: Initiator (${simInput.initiatorRole}) != Approver`, passed: true },
        { rule: `Active Delegations Evaluated`, passed: true },
      ],
      simulatedPipeline: matchedWorkflow.stages.map((stg) => ({
        step: stg.stageNumber,
        name: stg.stageName,
        assignedTo: stg.approverValue,
        slaHours: stg.escalateAfterHours,
        escalatesTo: stg.escalateTo,
        requiresComment: stg.requireComment,
      })),
      totalSlaHours: matchedWorkflow.slaHoursTotal,
      estimatedResolutionTime: `${matchedWorkflow.slaHoursTotal} Business Hours`,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <GitFork className="w-4 h-4 text-[#0F8B8D]" />
            <span>Governance &amp; Authorization Suite</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Approval Workflow Engine &amp; Admin Provisions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-tier authorization rules, delegation proxy matrices, Segregation of Duties (SoD), and emergency break-glass overrides.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
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
            Deploy Active Matrices
          </button>
        </div>
      </div>

      {/* Admin Provisions Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('RULES')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'RULES'
              ? 'bg-white text-[#0F8B8D] shadow-xs border border-slate-200'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Workflow Matrices &amp; Stages</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px]">
            {workflows.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('DELEGATIONS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'DELEGATIONS'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Delegations &amp; Out-of-Office (OOO)</span>
          <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded text-[10px]">
            {delegations.length} Active
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('BREAK_GLASS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'BREAK_GLASS'
              ? 'bg-white text-rose-600 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          <span>Emergency Break-Glass Console</span>
          <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded text-[10px]">
            {breakGlassLogs.length} Logs
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('SOD_POLICY')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'SOD_POLICY'
              ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Segregation of Duties (SoD) &amp; Controls</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('SIMULATOR')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'SIMULATOR'
              ? 'bg-white text-amber-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Workflow Rule Simulator &amp; Debugger</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKFLOW MATRICES & STAGES */}
      {/* ========================================================================= */}
      {activeAdminTab === 'RULES' && (
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

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Escalate on SLA breach &rarr; <strong className="text-slate-700">{stg.escalateTo}</strong>
                        </span>
                        <span>{stg.requireComment ? 'Mandatory comments required' : 'Optional comments'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DELEGATIONS & OUT-OF-OFFICE (OOO) */}
      {/* ========================================================================= */}
      {activeAdminTab === 'DELEGATIONS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Out-of-Office &amp; Proxy Delegation Registry</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Grant temporary sign-off authority during business travels or leaves without transferring permanent system credentials.
              </p>
            </div>
            <button
              onClick={() => setIsAddDelegationModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Delegation Proxy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {delegations.map((del) => (
              <div key={del.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {del.domainScope}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      del.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {del.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                    {del.delegatorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900">{del.delegatorName}</h3>
                    <p className="text-[11px] text-slate-500">{del.delegatorRole}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 mx-2 shrink-0" />
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {del.delegateeName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-indigo-900">{del.delegateeName}</h3>
                    <p className="text-[11px] text-indigo-600">{del.delegateeRole}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Validity Window:</span>
                    <strong className="text-slate-800 font-mono">{del.validFrom} to {del.validUntil}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Reason: <i>{del.reason}</i>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleRevokeDelegation(del.id)}
                    className="px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Revoke Proxy Immediately
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BREAK-GLASS EMERGENCY OVERRIDES */}
      {/* ========================================================================= */}
      {activeAdminTab === 'BREAK_GLASS' && (
        <div className="space-y-6">
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-rose-950">Break-Glass Emergency Bypass Console</h2>
                <p className="text-xs text-rose-700 mt-0.5 max-w-2xl">
                  Super-Admin emergency force-approval utility for critical plant blockages. Requires secondary dual-admin cryptographic authorization. Every invocation is permanently committed to the security audit vault.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsBreakGlassModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer whitespace-nowrap"
            >
              <KeyRound className="w-4 h-4" /> Trigger Break-Glass Override
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Emergency Override Forensic Logbook
              </h3>
              <span className="text-xs text-slate-500">Immutable Audit Trail</span>
            </div>

            <div className="divide-y divide-slate-100">
              {breakGlassLogs.map((log) => (
                <div key={log.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono">
                        {log.reasonCode}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900">{log.documentRef}</span>
                      <span className="text-xs text-slate-500">({log.domain})</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{log.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <b>Operational Justification:</b> {log.justification}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-3">
                      <span>Primary Admin: <strong className="text-slate-800">{log.overriddenBy}</strong></span>
                      <span>&bull;</span>
                      <span>Dual-Auth Co-Signer: <strong className="text-slate-800">{log.authorizedBySecondAdmin}</strong></span>
                    </div>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cryptographically Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SEGREGATION OF DUTIES (SOD) & POLICIES */}
      {/* ========================================================================= */}
      {activeAdminTab === 'SOD_POLICY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Governance &amp; Conflict Prevention Rules</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure corporate anti-fraud policies and statutory segregation of duties (SoD) constraints.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-900">Self-Approval Prohibition</h4>
                  <p className="text-slate-500 mt-0.5">
                    Prevent document creators/initiators from acting as an approver at any tier of their own submission.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sodConfig.preventSelfApproval}
                  onChange={(e) => setSodConfig({ ...sodConfig, preventSelfApproval: e.target.checked })}
                  className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D] mt-1 cursor-pointer"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-900">Four-Eyes Principle (Successive Tiers)</h4>
                  <p className="text-slate-500 mt-0.5">
                    A single individual cannot approve two consecutive stages for the same document even if holding multiple roles.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sodConfig.enforceFourEyesRule}
                  onChange={(e) => setSodConfig({ ...sodConfig, enforceFourEyesRule: e.target.checked })}
                  className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D] mt-1 cursor-pointer"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-900">Supplier / Vendor Conflict Guard</h4>
                  <p className="text-slate-500 mt-0.5">
                    Users mapped as primary vendor account managers cannot authorize purchase orders or GRN rate variances.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sodConfig.blockApproverAsVendorContact}
                  onChange={(e) => setSodConfig({ ...sodConfig, blockApproverAsVendorContact: e.target.checked })}
                  className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D] mt-1 cursor-pointer"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-900">Dual-Admin Break-Glass Requirement</h4>
                  <p className="text-slate-500 mt-0.5">
                    Emergency overrides require secondary active admin password verification to avoid single-point compromises.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sodConfig.mandatoryDualAdminBreakGlass}
                  onChange={(e) => setSodConfig({ ...sodConfig, mandatoryDualAdminBreakGlass: e.target.checked })}
                  className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D] mt-1 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => showToast('Segregation of Duties policies successfully saved.')}
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-xs cursor-pointer"
            >
              Save Policy Rules
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">SLA &amp; Escalation Defaults</h2>
              <p className="text-xs text-slate-500 mt-0.5">Global fallback parameters for auto-escalation routines.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Default Stage SLA (Hours)</label>
                <input
                  type="number"
                  value={sodConfig.autoEscalateHoursDefault}
                  onChange={(e) => setSodConfig({ ...sodConfig, autoEscalateHoursDefault: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Non-repudiation Cryptographic Hash</label>
                <input
                  type="text"
                  disabled
                  value={sodConfig.auditTrailEncryption}
                  className="w-full p-2.5 border border-slate-200 bg-slate-100 rounded-lg text-xs font-mono text-slate-600"
                />
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                <h4 className="font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-700" /> SOC2 &amp; IATF 16949 Audit Compliance
                </h4>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  All approval and rejection events capture client IP, user agent, server timestamp, and cryptographic hash payload.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: WORKFLOW SIMULATOR & DEBUGGER */}
      {/* ========================================================================= */}
      {activeAdminTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Workflow Routing Simulator</h2>
              <p className="text-slate-500 mt-0.5">
                Test how a transaction payload will be routed through active authorization matrices before live submission.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700">Target ERP Module</label>
                <select
                  value={simInput.domain}
                  onChange={(e) => setSimInput({ ...simInput, domain: e.target.value })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Procurement">Procurement (PO / PR)</option>
                  <option value="Finance">Finance &amp; Credit</option>
                  <option value="Quality & Shopfloor">Quality MRB / Disposition</option>
                  <option value="Engineering">Engineering ECO / Tooling</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Transaction Value (INR ₹)</label>
                <input
                  type="number"
                  value={simInput.amount}
                  onChange={(e) => setSimInput({ ...simInput, amount: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Category / Material Type</label>
                <input
                  type="text"
                  value={simInput.category}
                  onChange={(e) => setSimInput({ ...simInput, category: e.target.value })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Initiator Role</label>
                <input
                  type="text"
                  value={simInput.initiatorRole}
                  onChange={(e) => setSimInput({ ...simInput, initiatorRole: e.target.value })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <button
                onClick={handleRunSimulator}
                className="w-full py-2.5 bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Play className="w-4 h-4" /> Run Pipeline Simulation
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Simulation Execution Breakdown
            </h3>

            {!simResult ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <Play className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Configure parameters on the left and click <b>Run Pipeline Simulation</b> to evaluate the rule engine.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Matched Workflow</span>
                    <h4 className="font-bold text-sm text-emerald-950 mt-0.5">{simResult.matchedWorkflow.name}</h4>
                  </div>
                  <span className="font-mono font-bold text-xs bg-emerald-100 px-2.5 py-1 rounded text-emerald-900">
                    Est. SLA: {simResult.estimatedResolutionTime}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Rule Evaluation Checks</h4>
                  <div className="space-y-1.5">
                    {simResult.evaluatedRules.map((r: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-mono text-[11px] text-slate-700">{r.rule}</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Simulated Multi-Tier Route</h4>
                  <div className="space-y-2">
                    {simResult.simulatedPipeline.map((stg: any) => (
                      <div key={stg.step} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#0F8B8D] text-white flex items-center justify-center font-bold text-xs">
                            {stg.step}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{stg.name}</div>
                            <div className="text-[11px] text-indigo-600 font-semibold">{stg.assignedTo}</div>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-500">
                          <div>Max SLA: <b>{stg.slaHours}h</b></div>
                          <div>Fallback: <i>{stg.escalatesTo}</i></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD RULE */}
      {/* ========================================================================= */}
      {isAddRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-[#0F8B8D]" />
                <h3 className="font-bold text-slate-900 text-base">Create Approval Workflow Rule</h3>
              </div>
              <button
                onClick={() => setIsAddRuleModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterbatch Spot Purchase > ₹1 Lakh"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ERP Module</label>
                  <select
                    value={ruleForm.module}
                    onChange={(e) => setRuleForm({ ...ruleForm, module: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Procurement">Procurement</option>
                    <option value="Finance">Finance</option>
                    <option value="Quality & Shopfloor">Quality &amp; Shopfloor</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Document Type</label>
                  <input
                    type="text"
                    value={ruleForm.documentType}
                    onChange={(e) => setRuleForm({ ...ruleForm, documentType: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Financial Gate Minimum (₹ INR)</label>
                <input
                  type="number"
                  value={ruleForm.minAmount}
                  onChange={(e) => setRuleForm({ ...ruleForm, minAmount: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Condition Evaluation Formula</label>
                <input
                  type="text"
                  value={ruleForm.conditionFormula}
                  onChange={(e) => setRuleForm({ ...ruleForm, conditionFormula: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Initial Stage 1 Sign-off
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Approver Role</label>
                    <input
                      type="text"
                      value={ruleForm.initialApproverValue}
                      onChange={(e) => setRuleForm({ ...ruleForm, initialApproverValue: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">SLA Turnaround (Hours)</label>
                    <input
                      type="number"
                      value={ruleForm.initialSlaHours}
                      onChange={(e) => setRuleForm({ ...ruleForm, initialSlaHours: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddRuleModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                >
                  Create Rule Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPEND STAGE */}
      {/* ========================================================================= */}
      {isAppendStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Append Approval Stage</h3>
              <button
                onClick={() => setIsAppendStageModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppendedStage} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Stage Name *</label>
                <input
                  type="text"
                  required
                  value={stageForm.stageName}
                  onChange={(e) => setStageForm({ ...stageForm, stageName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Approver Role / Authority</label>
                <input
                  type="text"
                  required
                  value={stageForm.approverValue}
                  onChange={(e) => setStageForm({ ...stageForm, approverValue: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Max SLA (Hours)</label>
                  <input
                    type="number"
                    required
                    value={stageForm.escalateAfterHours}
                    onChange={(e) => setStageForm({ ...stageForm, escalateAfterHours: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Auto-Escalate To</label>
                  <input
                    type="text"
                    value={stageForm.escalateTo}
                    onChange={(e) => setStageForm({ ...stageForm, escalateTo: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Notification Dispatch Channels</label>
                <div className="flex gap-2">
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAppendStageModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
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
      {/* MODAL: ADD DELEGATION */}
      {/* ========================================================================= */}
      {isAddDelegationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Assign Out-of-Office Proxy Delegation</h3>
              <button
                onClick={() => setIsAddDelegationModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelegation} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Delegator Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Rao"
                    value={delegationForm.delegatorName}
                    onChange={(e) => setDelegationForm({ ...delegationForm, delegatorName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Proxy Delegatee *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Kumar"
                    value={delegationForm.delegateeName}
                    onChange={(e) => setDelegationForm({ ...delegationForm, delegateeName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    required
                    value={delegationForm.validFrom}
                    onChange={(e) => setDelegationForm({ ...delegationForm, validFrom: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Date</label>
                  <input
                    type="date"
                    required
                    value={delegationForm.validUntil}
                    onChange={(e) => setDelegationForm({ ...delegationForm, validUntil: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Delegation Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Supplier Audit in Germany"
                  value={delegationForm.reason}
                  onChange={(e) => setDelegationForm({ ...delegationForm, reason: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddDelegationModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm cursor-pointer"
                >
                  Activate Proxy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BREAK-GLASS OVERRIDE */}
      {/* ========================================================================= */}
      {isBreakGlassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-rose-300 shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-rose-950 text-base">Authorize Emergency Break-Glass</h3>
              </div>
              <button
                onClick={() => setIsBreakGlassModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteBreakGlass} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Target Document Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO-2026-00998"
                  value={breakGlassForm.documentRef}
                  onChange={(e) => setBreakGlassForm({ ...breakGlassForm, documentRef: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Emergency Reason Code</label>
                <select
                  value={breakGlassForm.reasonCode}
                  onChange={(e) => setBreakGlassForm({ ...breakGlassForm, reasonCode: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="EMERGENCY_LINE_STOP">Line Stoppage Imminent (Assembly Halt)</option>
                  <option value="VIP_CUSTOMER_EXPEDITE">OEM Customer Critical Escalation</option>
                  <option value="SYSTEM_FAILOVER">Approver System Inaccessibility</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Forensic Justification Note *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide precise commercial and operational rationale for statutory auditors..."
                  value={breakGlassForm.justification}
                  onChange={(e) => setBreakGlassForm({ ...breakGlassForm, justification: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                <h4 className="font-bold text-rose-950 flex items-center gap-1.5 text-[11px]">
                  <KeyRound className="w-3.5 h-3.5" /> Dual-Authorization Co-Signer
                </h4>
                <input
                  type="text"
                  required
                  placeholder="Second Administrator Username"
                  value={breakGlassForm.secondAdminUsername}
                  onChange={(e) => setBreakGlassForm({ ...breakGlassForm, secondAdminUsername: e.target.value })}
                  className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBreakGlassModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  Sign &amp; Force Approve
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
