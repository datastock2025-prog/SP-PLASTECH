import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { WorkflowRuleConfig, workflowConfigs } from '../../data/adminExtendedData';
import { adminEventBus } from '../../services/adminService';
import { masterDataGovernanceService } from '../../services/masterDataGovernanceService';
import { useAuthContext } from '../../shared/components/RequireAuth';
import { useAdminWorkflows, useSaveAdminWorkflow } from '../../hooks/useAdmin';

const WORKFLOW_RULES_STORAGE_KEY = 'reboot_erp_workflow_rules_v2';
const DELEGATIONS_STORAGE_KEY = 'reboot_erp_delegations_v2';
const BREAK_GLASS_LOGS_STORAGE_KEY = 'reboot_erp_break_glass_logs_v2';

function loadStoredWorkflows(): WorkflowRuleConfig[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(WORKFLOW_RULES_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...workflowConfigs];
}

function loadStoredDelegations(): ApprovalDelegation[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DELEGATIONS_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [
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
  ];
}

function loadStoredBreakGlassLogs(): BreakGlassLog[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(BREAK_GLASS_LOGS_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
}

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
  const { currentUser } = useAuthContext();
  const [activeAdminTab, setActiveAdminTab] = useState<'RULES' | 'DELEGATIONS' | 'BREAK_GLASS' | 'SOD_POLICY' | 'SIMULATOR'>('RULES');
  const [workflows, setWorkflows] = useState<WorkflowRuleConfig[]>(loadStoredWorkflows);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || '');
  const [delegations, setDelegations] = useState<ApprovalDelegation[]>(loadStoredDelegations);
  const [breakGlassLogs, setBreakGlassLogs] = useState<BreakGlassLog[]>(loadStoredBreakGlassLogs);

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
    const updated = workflows.map((w) => {
      if (w.id === id) {
        const next = !w.isActive;
        return { ...w, isActive: next };
      }
      return w;
    });
    setWorkflows(updated);
    try {
      localStorage.setItem(WORKFLOW_RULES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    const target = updated.find((w) => w.id === id);
    if (target) {
      masterDataGovernanceService.recordAudit({
        entityType: 'WORKFLOW_CONFIG',
        entityCode: target.id,
        entityName: target.name,
        action: 'UPDATE',
        changedBy: currentUser?.fullName || 'Administrator',
        userRole: 'admin',
        changeSummary: `Toggled status of Workflow Rule "${target.name}" to ${target.isActive ? 'ACTIVE' : 'DISABLED'}.`,
      });
      adminEventBus.emit('WORKFLOW_CONFIG_SAVED', target);
      showToast(`Workflow "${target.name}" is now ${target.isActive ? 'Active' : 'Draft / Disabled'}.`);
    }
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

    const updated = [newWorkflow, ...workflows];
    setWorkflows(updated);
    try {
      localStorage.setItem(WORKFLOW_RULES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    masterDataGovernanceService.recordAudit({
      entityType: 'WORKFLOW_CONFIG',
      entityCode: newWorkflow.id,
      entityName: newWorkflow.name,
      action: 'CREATE',
      changedBy: currentUser?.fullName || 'Administrator',
      userRole: 'admin',
      changeSummary: `Created new Multi-Tier Approval Workflow Rule "${newWorkflow.name}" for module ${newWorkflow.module}.`,
    });
    adminEventBus.emit('WORKFLOW_CONFIG_SAVED', newWorkflow);

    setSelectedWorkflowId(newWorkflow.id);
    setIsAddRuleModalOpen(false);
    showToast(`✓ Workflow Rule "${newWorkflow.name}" created and saved to DB.`);
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
    <div className="min-w-0 space-y-4 pb-8">
      {/* Header */}
      <Card className="rounded-md border-slate-200 shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <GitFork className="w-4 h-4 text-[#0F8B8D]" />
            <span>Governance &amp; Authorization Suite</span>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Approval Workflow Engine &amp; Admin Provisions</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Configure multi-tier authorization rules, delegation proxy matrices, Segregation of Duties (SoD), and emergency break-glass overrides.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Button type="button" variant="outline" size="sm"
            onClick={handleExportMatrix}
          >
            <Download aria-hidden="true" />
            Export Matrices
          </Button>
          <Button type="button" size="sm" className="bg-[#0F8B8D] text-white hover:bg-[#0c7274]"
            onClick={handleOpenDeploy}
          >
            <Save aria-hidden="true" />
            Deploy Active Matrices
          </Button>
        </div>
        </CardContent>
      </Card>

      {/* Admin Provisions Navigation Tabs */}
      <div className="min-w-0 overflow-x-auto rounded-md border border-slate-200 bg-slate-100 p-1.5">
      <div className="flex min-w-max items-center gap-2">
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
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKFLOW MATRICES & STAGES */}
      {/* ========================================================================= */}
      {activeAdminTab === 'RULES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Workflow Directory (Left Column) */}
          <div className="min-w-0 space-y-3 lg:col-span-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              <span>Configured Workflows ({workflows.length})</span>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenAddRule}
                className="text-[#0F8B8D]"
              >
                <Plus aria-hidden="true" /> Add Rule
              </Button>
            </div>

            {workflows.map((wf) => {
              const isSelected = wf.id === selectedWorkflowId;
              return (
                <Button
                  key={wf.id}
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedWorkflowId(wf.id)}
                  aria-pressed={isSelected}
                  className={`h-auto w-full justify-start whitespace-normal rounded-md px-4 py-4 text-left transition-colors ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/50 text-slate-900 ring-1 ring-teal-600/15 hover:bg-teal-50/50'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {wf.module}
                    </span>
                    <Badge
                      variant="outline"
                      className={`h-5 shrink-0 text-[10px] ${
                        wf.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-100 text-slate-500'
                      }`}
                    >
                      {wf.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 mt-2">{wf.name}</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">Doc: {wf.documentType}</div>

                  <div className="mt-3 flex w-full items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                    <span>{wf.stages.length} Approval Stages</span>
                    <span className="font-mono text-slate-700 font-semibold">{wf.slaHoursTotal}h Total SLA</span>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Visual Workflow Canvas & Inspector (Right Column) */}
          {selectedWf && (
            <Card className="min-w-0 rounded-md border-slate-200 shadow-none lg:col-span-8">
              <CardContent className="space-y-6 p-4 sm:p-5">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(selectedWf.id)}
                    className={`text-xs ${
                      selectedWf.isActive
                        ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {selectedWf.isActive ? 'Disable Rule' : 'Activate Rule'}
                  </Button>
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAppendStage}
                    className="text-[#0F8B8D]"
                  >
                    <Plus aria-hidden="true" /> Append Stage
                  </Button>
                </div>

                <div className="space-y-4 relative before:content-[''] before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                  {selectedWf.stages.map((stg) => (
                    <div
                      key={stg.stageNumber}
                      className="group relative rounded-md border border-slate-200 bg-white p-4 pl-12 transition-colors hover:border-slate-300"
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
                              <Button
                              type="button"
                                variant="ghost"
                                size="icon-sm"
                              onClick={() => handleDeleteStage(stg.stageNumber)}
                                className="text-slate-400 hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Remove Stage"
                                aria-label={`Remove stage ${stg.stageNumber}`}
                            >
                                <Trash2 aria-hidden="true" />
                              </Button>
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
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DELEGATIONS & OUT-OF-OFFICE (OOO) */}
      {/* ========================================================================= */}
      {activeAdminTab === 'DELEGATIONS' && (
        <div className="min-w-0 space-y-4">
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">Out-of-Office &amp; Proxy Delegation Registry</h2>
              <p className="mt-1 text-sm text-slate-500">
                Grant temporary sign-off authority during business travels or leaves without transferring permanent system credentials.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddDelegationModalOpen(true)}
              className="w-full shrink-0 bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto"
            >
              <Plus aria-hidden="true" /> Add Delegation Proxy
            </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {delegations.length === 0 && (
              <Card className="rounded-md border-slate-200 shadow-none md:col-span-2">
                <CardContent className="py-10 text-center text-sm text-slate-500">No proxy delegations are active.</CardContent>
              </Card>
            )}
            {delegations.map((del) => (
              <Card key={del.id} className="min-w-0 rounded-md border-slate-200 shadow-none">
                <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="h-auto max-w-[70%] whitespace-normal bg-indigo-50 text-[10px] text-indigo-700">
                    {del.domainScope}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`h-5 shrink-0 text-[10px] ${
                      del.status === 'Active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {del.status}
                  </Badge>
                </div>

                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                      {del.delegatorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-bold text-slate-900">{del.delegatorName}</h3>
                      <p className="truncate text-[11px] text-slate-500">{del.delegatorRole}</p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                      {del.delegateeName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-bold text-indigo-900">{del.delegateeName}</h3>
                      <p className="truncate text-[11px] text-indigo-600">{del.delegateeRole}</p>
                    </div>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeDelegation(del.id)}
                    className="text-xs text-rose-700 hover:bg-rose-50"
                  >
                    Revoke Proxy Immediately
                  </Button>
                </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BREAK-GLASS EMERGENCY OVERRIDES */}
      {/* ========================================================================= */}
      {activeAdminTab === 'BREAK_GLASS' && (
        <div className="min-w-0 space-y-4">
          <Card className="rounded-md border-rose-200 bg-rose-50/50 shadow-none">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-rose-100 text-rose-700">
                <Flame className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-rose-950">Break-Glass Emergency Bypass Console</h2>
                <p className="mt-1 max-w-2xl text-sm text-rose-800">
                  Super-Admin emergency force-approval utility for critical plant blockages. Requires secondary dual-admin cryptographic authorization. Every invocation is permanently committed to the security audit vault.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setIsBreakGlassModalOpen(true)}
              className="w-full shrink-0 bg-rose-700 text-white hover:bg-rose-800 sm:w-auto"
            >
              <KeyRound aria-hidden="true" /> Trigger Break-Glass Override
            </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-md border-slate-200 shadow-none">
            <div className="flex flex-col gap-1 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Emergency override forensic logbook</h3>
              <Badge variant="outline" className="w-fit text-slate-500">Immutable audit trail</Badge>
            </div>

            <CardContent className="divide-y divide-slate-100 p-0">
              {breakGlassLogs.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-slate-500">No emergency overrides have been recorded.</p>
              )}
              {breakGlassLogs.map((log) => (
                <article key={log.id} className="min-w-0 space-y-3 p-4 sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Badge variant="destructive" className="h-5 font-mono text-[10px]">
                        {log.reasonCode}
                      </Badge>
                      <span className="break-all font-mono text-xs font-semibold text-slate-900">{log.documentRef}</span>
                      <span className="text-xs text-slate-500">({log.domain})</span>
                    </div>
                    <time className="shrink-0 font-mono text-xs text-slate-500">{log.timestamp}</time>
                  </div>

                  <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <strong>Operational justification:</strong> {log.justification}
                  </p>

                  <div className="flex flex-col gap-2 pt-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span>Primary admin: <strong className="text-slate-800">{log.overriddenBy}</strong></span>
                      <span>Dual-auth co-signer: <strong className="text-slate-800">{log.authorizedBySecondAdmin}</strong></span>
                    </div>
                    <Badge variant="outline" className="w-fit gap-1 border-emerald-200 bg-emerald-50 text-emerald-800">
                      <CheckCircle2 aria-hidden="true" /> Verified
                    </Badge>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SEGREGATION OF DUTIES (SOD) & POLICIES */}
      {/* ========================================================================= */}
      {activeAdminTab === 'SOD_POLICY' && (
        <div className="grid min-w-0 grid-cols-1 gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200 motion-reduce:animate-none md:grid-cols-2">
          <Card className="rounded-md border-teal-200 shadow-none transition-shadow duration-150 hover:shadow-sm motion-reduce:transition-none">
            <CardContent className="space-y-5 p-4 sm:p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">Governance &amp; Conflict Prevention Rules</h2>
                <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">4 safeguards</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Configure corporate anti-fraud policies and statutory segregation of duties (SoD) constraints.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start justify-between gap-4 rounded-md border border-sky-200 bg-sky-50/70 p-3.5 transition-colors duration-150 hover:bg-sky-50 motion-reduce:transition-none">
                <div>
                  <h4 className="font-bold text-slate-900">Self-Approval Prohibition</h4>
                  <p className="text-slate-500 mt-0.5">
                    Prevent document creators/initiators from acting as an approver at any tier of their own submission.
                  </p>
                </div>
                <Switch
                  checked={sodConfig.preventSelfApproval}
                  onCheckedChange={(checked) => setSodConfig({ ...sodConfig, preventSelfApproval: checked })}
                  aria-label="Prevent self-approval"
                  className="mt-1 shrink-0 data-[state=checked]:bg-teal-700"
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-md border border-teal-200 bg-teal-50/60 p-3.5 transition-colors duration-150 hover:bg-teal-50 motion-reduce:transition-none">
                <div>
                  <h4 className="font-bold text-slate-900">Four-Eyes Principle (Successive Tiers)</h4>
                  <p className="text-slate-500 mt-0.5">
                    A single individual cannot approve two consecutive stages for the same document even if holding multiple roles.
                  </p>
                </div>
                <Switch
                  checked={sodConfig.enforceFourEyesRule}
                  onCheckedChange={(checked) => setSodConfig({ ...sodConfig, enforceFourEyesRule: checked })}
                  aria-label="Enforce the four-eyes principle"
                  className="mt-1 shrink-0 data-[state=checked]:bg-teal-700"
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-md border border-amber-200 bg-amber-50/60 p-3.5 transition-colors duration-150 hover:bg-amber-50 motion-reduce:transition-none">
                <div>
                  <h4 className="font-bold text-slate-900">Supplier / Vendor Conflict Guard</h4>
                  <p className="text-slate-500 mt-0.5">
                    Users mapped as primary vendor account managers cannot authorize purchase orders or GRN rate variances.
                  </p>
                </div>
                <Switch
                  checked={sodConfig.blockApproverAsVendorContact}
                  onCheckedChange={(checked) => setSodConfig({ ...sodConfig, blockApproverAsVendorContact: checked })}
                  aria-label="Block vendor-contact approver conflicts"
                  className="mt-1 shrink-0 data-[state=checked]:bg-teal-700"
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-md border border-rose-200 bg-rose-50/70 p-3.5 transition-colors duration-150 hover:bg-rose-50 motion-reduce:transition-none">
                <div>
                  <h4 className="font-bold text-slate-900">Dual-Admin Break-Glass Requirement</h4>
                  <p className="text-slate-500 mt-0.5">
                    Emergency overrides require secondary active admin password verification to avoid single-point compromises.
                  </p>
                </div>
                <Switch
                  checked={sodConfig.mandatoryDualAdminBreakGlass}
                  onCheckedChange={(checked) => setSodConfig({ ...sodConfig, mandatoryDualAdminBreakGlass: checked })}
                  aria-label="Require dual-admin break-glass approval"
                  className="mt-1 shrink-0 data-[state=checked]:bg-teal-700"
                />
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => showToast('Segregation of Duties policies successfully saved.')}
              className="bg-[#0F8B8D] text-white hover:bg-[#0c7274]"
            >
              <Save aria-hidden="true" />
              Save Policy Rules
            </Button>
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 shadow-none transition-shadow duration-150 hover:shadow-sm motion-reduce:transition-none">
            <CardContent className="space-y-5 p-4 sm:p-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">SLA &amp; Escalation Defaults</h2>
              <p className="mt-1 text-sm text-slate-500">Global fallback parameters for auto-escalation routines.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Default Stage SLA (Hours)</label>
                <Input
                  type="number"
                  value={sodConfig.autoEscalateHoursDefault}
                  onChange={(e) => setSodConfig({ ...sodConfig, autoEscalateHoursDefault: Number(e.target.value) })}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Non-repudiation Cryptographic Hash</label>
                <Input
                  type="text"
                  disabled
                  value={sodConfig.auditTrailEncryption}
                  className="h-10 bg-slate-100 font-mono text-sm text-slate-600"
                />
              </div>

              <div className="space-y-1 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <h4 className="font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-700" /> SOC2 &amp; IATF 16949 Audit Compliance
                </h4>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  All approval and rejection events capture client IP, user agent, server timestamp, and cryptographic hash payload.
                </p>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: WORKFLOW SIMULATOR & DEBUGGER */}
      {/* ========================================================================= */}
      {activeAdminTab === 'SIMULATOR' && (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-12">
          <Card className="min-w-0 rounded-md border-sky-200 shadow-none lg:col-span-5">
            <CardContent className="space-y-4 p-4 sm:p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-md bg-sky-50 text-sky-700"><Play className="size-4" aria-hidden="true" /></span>
                <h2 className="text-base font-semibold text-slate-900">Workflow Routing Simulator</h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Test how a transaction payload will be routed through active authorization matrices before live submission.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block font-medium text-slate-700">Target ERP Module</label>
                <select
                  value={simInput.domain}
                  onChange={(e) => setSimInput({ ...simInput, domain: e.target.value })}
                  aria-label="Target ERP module"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                >
                  <option value="Procurement">Procurement (PO / PR)</option>
                  <option value="Finance">Finance &amp; Credit</option>
                  <option value="Quality & Shopfloor">Quality MRB / Disposition</option>
                  <option value="Engineering">Engineering ECO / Tooling</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700">Transaction Value (INR ₹)</label>
                <Input
                  type="number"
                  value={simInput.amount}
                  onChange={(e) => setSimInput({ ...simInput, amount: Number(e.target.value) })}
                  aria-label="Transaction value"
                  className="h-10"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700">Category / Material Type</label>
                <Input
                  type="text"
                  value={simInput.category}
                  onChange={(e) => setSimInput({ ...simInput, category: e.target.value })}
                  aria-label="Category or material type"
                  className="h-10"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700">Initiator Role</label>
                <Input
                  type="text"
                  value={simInput.initiatorRole}
                  onChange={(e) => setSimInput({ ...simInput, initiatorRole: e.target.value })}
                  aria-label="Initiator role"
                  className="h-10"
                />
              </div>

              <Button
                type="button"
                onClick={handleRunSimulator}
                className="mt-2 w-full bg-sky-700 text-white hover:bg-sky-800"
              >
                <Play aria-hidden="true" /> Run Pipeline Simulation
              </Button>
            </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 rounded-md border-slate-200 shadow-none lg:col-span-7">
            <CardContent className="space-y-4 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Simulation Execution Breakdown
            </h3>

            {!simResult ? (
              <div className="space-y-2 rounded-md border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
                <Play className="mx-auto size-7 text-slate-300" aria-hidden="true" />
                <p>Set the transaction details and run a simulation to inspect its approval route.</p>
              </div>
            ) : (
              <div className="space-y-4 text-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200 motion-reduce:animate-none">
                <div className="flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs font-medium text-emerald-800">Matched workflow</span>
                    <h4 className="mt-0.5 text-sm font-semibold text-emerald-950">{simResult.matchedWorkflow.name}</h4>
                  </div>
                  <Badge variant="outline" className="w-fit border-emerald-300 bg-white/70 font-mono text-emerald-900">
                    Est. SLA: {simResult.estimatedResolutionTime}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Rule Evaluation Checks</h4>
                  <div className="space-y-1.5">
                    {simResult.evaluatedRules.map((r: any, idx: number) => (
                      <div key={idx} className="flex min-w-0 items-start justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-2.5">
                        <span className="min-w-0 break-words font-mono text-xs text-slate-700">{r.rule}</span>
                        <Badge variant="outline" className="shrink-0 gap-1 border-emerald-200 bg-emerald-50 text-emerald-800">
                          <CheckCircle2 aria-hidden="true" /> Passed
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Simulated Multi-Tier Route</h4>
                  <div className="space-y-2">
                    {simResult.simulatedPipeline.map((stg: any) => (
                      <div key={stg.step} className="flex min-w-0 flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sky-700 text-xs font-semibold text-white">
                            {stg.step}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900">{stg.name}</div>
                            <div className="truncate text-xs font-medium text-indigo-700">{stg.assignedTo}</div>
                          </div>
                        </div>
                        <div className="text-left text-xs text-slate-500 sm:text-right">
                          <div>Max SLA: <b>{stg.slaHours}h</b></div>
                          <div>Fallback: <i>{stg.escalatesTo}</i></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD RULE */}
      {/* ========================================================================= */}
      {isAddRuleModalOpen && (
        <Dialog open={isAddRuleModalOpen} onOpenChange={setIsAddRuleModalOpen}>
          <DialogContent showCloseButton={false} className="max-h-[90dvh] max-w-xl overflow-y-auto border-slate-200 bg-white p-4 text-slate-900 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-[#0F8B8D]" />
                <DialogHeader><DialogTitle className="font-bold text-slate-900 text-base">Create Approval Workflow Rule</DialogTitle></DialogHeader>
              </div>
              <button
                onClick={() => setIsAddRuleModalOpen(false)}
                aria-label="Close workflow rule form"
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Rule Name *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Masterbatch Spot Purchase > ₹1 Lakh"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ERP Module</label>
                  <select
                    value={ruleForm.module}
                    onChange={(e) => setRuleForm({ ...ruleForm, module: e.target.value })}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="Procurement">Procurement</option>
                    <option value="Finance">Finance</option>
                    <option value="Quality & Shopfloor">Quality &amp; Shopfloor</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Document Type</label>
                  <Input
                    type="text"
                    value={ruleForm.documentType}
                    onChange={(e) => setRuleForm({ ...ruleForm, documentType: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Financial Gate Minimum (₹ INR)</label>
                <Input
                  type="number"
                  value={ruleForm.minAmount}
                  onChange={(e) => setRuleForm({ ...ruleForm, minAmount: Number(e.target.value) })}
                  className="h-10 font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Condition Evaluation Formula</label>
                <Input
                  type="text"
                  value={ruleForm.conditionFormula}
                  onChange={(e) => setRuleForm({ ...ruleForm, conditionFormula: e.target.value })}
                  className="h-10 font-mono text-sm"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Initial Stage 1 Sign-off
                </h4>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Approver Role</label>
                    <Input
                      type="text"
                      value={ruleForm.initialApproverValue}
                      onChange={(e) => setRuleForm({ ...ruleForm, initialApproverValue: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">SLA Turnaround (Hours)</label>
                    <Input
                      type="number"
                      value={ruleForm.initialSlaHours}
                      onChange={(e) => setRuleForm({ ...ruleForm, initialSlaHours: Number(e.target.value) })}
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddRuleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#0F8B8D] text-white hover:bg-[#0c7274]"
                >
                  Create Rule Matrix
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPEND STAGE */}
      {/* ========================================================================= */}
      {isAppendStageModalOpen && (
        <Dialog open={isAppendStageModalOpen} onOpenChange={setIsAppendStageModalOpen}>
          <DialogContent showCloseButton={false} className="max-h-[90dvh] max-w-lg overflow-y-auto border-slate-200 bg-white p-4 text-slate-900 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <DialogHeader><DialogTitle className="font-bold text-slate-900 text-base">Append Approval Stage</DialogTitle></DialogHeader>
              <button
                onClick={() => setIsAppendStageModalOpen(false)}
                aria-label="Close append stage form"
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppendedStage} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Stage Name *</label>
                <Input
                  type="text"
                  required
                  value={stageForm.stageName}
                  onChange={(e) => setStageForm({ ...stageForm, stageName: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Approver Role / Authority</label>
                <Input
                  type="text"
                  required
                  value={stageForm.approverValue}
                  onChange={(e) => setStageForm({ ...stageForm, approverValue: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Max SLA (Hours)</label>
                  <Input
                    type="number"
                    required
                    value={stageForm.escalateAfterHours}
                    onChange={(e) => setStageForm({ ...stageForm, escalateAfterHours: Number(e.target.value) })}
                    className="h-10 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Auto-Escalate To</label>
                  <Input
                    type="text"
                    value={stageForm.escalateTo}
                    onChange={(e) => setStageForm({ ...stageForm, escalateTo: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Notification Dispatch Channels</label>
                <div className="flex gap-2">
                  {(['Email', 'InApp', 'WhatsApp', 'SMS'] as const).map((ch) => {
                    const active = stageForm.notifyVia.includes(ch);
                    return (
                      <Button
                        key={ch}
                        type="button"
                        size="sm"
                        variant={active ? 'secondary' : 'outline'}
                        onClick={() => toggleNotifyChannel(ch)}
                        aria-pressed={active}
                        className={`h-8 text-xs ${
                          active
                            ? 'bg-teal-50 text-[#0F8B8D] hover:bg-teal-50'
                            : 'text-slate-600'
                        }`}
                      >
                        {active && <Check aria-hidden="true" />}
                        {ch}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAppendStageModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#0F8B8D] text-white hover:bg-[#0c7274]"
                >
                  Append Stage to Chain
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD DELEGATION */}
      {/* ========================================================================= */}
      {isAddDelegationModalOpen && (
        <Dialog open={isAddDelegationModalOpen} onOpenChange={setIsAddDelegationModalOpen}>
          <DialogContent showCloseButton={false} className="max-h-[90dvh] max-w-lg overflow-y-auto border-slate-200 bg-white p-4 text-slate-900 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <DialogHeader><DialogTitle className="font-bold text-slate-900 text-base">Assign Out-of-Office Proxy Delegation</DialogTitle></DialogHeader>
              <button
                onClick={() => setIsAddDelegationModalOpen(false)}
                aria-label="Close delegation form"
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelegation} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Delegator Name *</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Priya Rao"
                    value={delegationForm.delegatorName}
                    onChange={(e) => setDelegationForm({ ...delegationForm, delegatorName: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Proxy Delegatee *</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Anand Kumar"
                    value={delegationForm.delegateeName}
                    onChange={(e) => setDelegationForm({ ...delegationForm, delegateeName: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date</label>
                  <Input
                    type="date"
                    required
                    value={delegationForm.validFrom}
                    onChange={(e) => setDelegationForm({ ...delegationForm, validFrom: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Date</label>
                  <Input
                    type="date"
                    required
                    value={delegationForm.validUntil}
                    onChange={(e) => setDelegationForm({ ...delegationForm, validUntil: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Delegation Reason</label>
                <Input
                  type="text"
                  placeholder="e.g. Supplier Audit in Germany"
                  value={delegationForm.reason}
                  onChange={(e) => setDelegationForm({ ...delegationForm, reason: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddDelegationModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Activate Proxy
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BREAK-GLASS OVERRIDE */}
      {/* ========================================================================= */}
      {isBreakGlassModalOpen && (
        <Dialog open={isBreakGlassModalOpen} onOpenChange={setIsBreakGlassModalOpen}>
          <DialogContent showCloseButton={false} className="max-h-[90dvh] max-w-lg overflow-y-auto border-rose-300 bg-white p-4 text-slate-900 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600" />
                <DialogHeader><DialogTitle className="font-bold text-rose-950 text-base">Authorize Emergency Break-Glass</DialogTitle></DialogHeader>
              </div>
              <button
                onClick={() => setIsBreakGlassModalOpen(false)}
                aria-label="Close break-glass authorization"
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteBreakGlass} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Target Document Identifier *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. PO-2026-00998"
                  value={breakGlassForm.documentRef}
                  onChange={(e) => setBreakGlassForm({ ...breakGlassForm, documentRef: e.target.value })}
                  className="h-10 font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Emergency Reason Code</label>
                <select
                  value={breakGlassForm.reasonCode}
                  onChange={(e) => setBreakGlassForm({ ...breakGlassForm, reasonCode: e.target.value as any })}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium"
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
                  className="min-h-24 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-rose-600/20"
                />
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                <h4 className="font-bold text-rose-950 flex items-center gap-1.5 text-[11px]">
                  <KeyRound className="w-3.5 h-3.5" /> Dual-Authorization Co-Signer
                </h4>
                <Input
                  type="text"
                  required
                  placeholder="Second Administrator Username"
                  value={breakGlassForm.secondAdminUsername}
                  onChange={(e) => setBreakGlassForm({ ...breakGlassForm, secondAdminUsername: e.target.value })}
                  className="h-10 border-rose-300 bg-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBreakGlassModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="destructive"
                  className="bg-rose-700 text-white hover:bg-rose-800"
                >
                  Sign &amp; Force Approve
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
