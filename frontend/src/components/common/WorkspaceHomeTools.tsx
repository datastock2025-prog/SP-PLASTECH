import React, { useState } from 'react';
import {
  CheckSquare,
  FileCheck,
  Bell,
  Eye,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  Trash2,
  Calendar,
  User,
  Building,
  Tag,
  Share2,
  ExternalLink,
  ChevronRight,
  Sliders,
  Plus,
  Lock,
} from 'lucide-react';
import { INITIAL_RECENT_RECORDS, RecentRecordItem } from '../../data/sidebarNavigationData';
import { RequireAuth, useAuthContext } from '../../shared/components/RequireAuth';
import {
  getStoredPRs,
  INITIAL_PURCHASE_REQUISITIONS,
  addPurchaseRequisition,
  INITIAL_EXTENDED_POS,
} from '../../data/procurementData';
import { loadStoredApprovalWorkflows } from '../../data/adminData';
import { adminEventBus } from '../../services/adminService';
import { PurchaseRequisition } from '../../types/procurement';

interface WorkspaceToolProps {
  onNavigate: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const WorkspaceTasksView: React.FC<WorkspaceToolProps> = ({ onNavigate, showToast }) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');
  const [tasks, setTasks] = useState([
    { id: 'TSK-101', title: 'Sign off Line 02 SMED Changeover Checklist', module: 'Production', priority: 'HIGH', due: 'Today, 2:00 PM', assignedBy: 'Priya Rao', status: 'PENDING', view: 'changeover' },
    { id: 'TSK-102', title: 'Perform In-Process AQL Inspection on WO-2026-00456', module: 'Quality', priority: 'CRITICAL', due: 'Today, 3:30 PM', assignedBy: 'Vikram Mehta', status: 'PENDING', view: 'inspectionPlanList' },
    { id: 'TSK-103', title: 'Review Quarantine Release for Resin Lot LOT-2026-00123', module: 'Warehouse', priority: 'MEDIUM', due: 'Tomorrow', assignedBy: 'Anand Kumar', status: 'PENDING', view: 'quarantine' },
    { id: 'TSK-104', title: 'Authorize Overtime Shift Roster for IMM-04 night shift', module: 'HR', priority: 'MEDIUM', due: 'Tomorrow, 10:00 AM', assignedBy: 'HR Ops', status: 'PENDING', view: 'hrLeaveOvertime' },
    { id: 'TSK-105', title: 'Verify Silo 03 PP Granules Cycle Count Reconciliation', module: 'Warehouse', priority: 'LOW', due: 'In 3 days', assignedBy: 'Inventory Lead', status: 'PENDING', view: 'cycleCount' },
    { id: 'TSK-106', title: 'Recalibrate Chiller Unit CH-02 Pressure Transducer', module: 'Maintenance', priority: 'MEDIUM', due: 'Yesterday', assignedBy: 'Toolroom Lead', status: 'COMPLETED', view: 'calibrationTracker' },
  ]);

  const handleToggle = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'PENDING' ? 'COMPLETED' : 'PENDING' } : t));
    showToast?.('Task status updated successfully');
  };

  const filteredTasks = tasks.filter(t => filter === 'ALL' || t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Tasks &amp; Work Items</h1>
            <p className="text-xs text-slate-500">Track and execute your assigned shop floor actions, shift checklists, and quality sign-offs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs">
            {(['PENDING', 'COMPLETED', 'ALL'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  filter === f ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              task.status === 'COMPLETED' ? 'bg-slate-50/80 border-slate-200 opacity-70' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <button
                onClick={() => handleToggle(task.id)}
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  task.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-500'
                }`}
              >
                {task.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4" />}
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{task.id}</span>
                  <span className="text-[11px] font-semibold text-slate-500">{task.module}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                    task.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <h3 className={`text-sm font-semibold mt-1 text-slate-900 ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : ''}`}>
                  {task.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {task.due}</span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> From: {task.assignedBy}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => onNavigate(task.view)}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Execute Action</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WorkspaceApprovalsView: React.FC<WorkspaceToolProps> = ({ onNavigate, showToast }) => {
  const { currentUser } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'MY_PENDING' | 'DELEGATED' | 'TEAM_QUEUE' | 'HISTORY'>('MY_PENDING');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectItem, setInspectItem] = useState<any | null>(null);
  const [reworkModalItem, setReworkModalItem] = useState<any | null>(null);
  const [reworkReason, setReworkReason] = useState('');
  const [history, setHistory] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('reboot_erp_approvals_history');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  // Dynamic approval items loaded from live real ERP modules
  const [livePrs, setLivePrs] = useState<PurchaseRequisition[]>(() => {
    const stored = getStoredPRs();
    if (stored && stored.length > 0) return stored;
    return INITIAL_PURCHASE_REQUISITIONS;
  });
  const [liveWorkflows, setLiveWorkflows] = useState(() => loadStoredApprovalWorkflows());

  // Listen for real-time PR and workflow updates across the ERP
  React.useEffect(() => {
    const refreshData = () => {
      const stored = getStoredPRs();
      setLivePrs(stored && stored.length > 0 ? stored : INITIAL_PURCHASE_REQUISITIONS);
      setLiveWorkflows(loadStoredApprovalWorkflows());
    };
    adminEventBus.on('PR_SAVED', refreshData);
    adminEventBus.on('PR_CREATED', refreshData);
    adminEventBus.on('PR_SUBMITTED_FOR_APPROVAL', refreshData);
    adminEventBus.on('WORKFLOWS_UPDATED', refreshData);
    return () => {
      adminEventBus.off('PR_SAVED', refreshData);
      adminEventBus.off('PR_CREATED', refreshData);
      adminEventBus.off('PR_SUBMITTED_FOR_APPROVAL', refreshData);
      adminEventBus.off('WORKFLOWS_UPDATED', refreshData);
    };
  }, []);

  // Compute live approval action items dynamically
  const approvals = React.useMemo(() => {
    const items: any[] = [];
    const prWf = liveWorkflows.find((w) => w.id === 'WF-PR-AUTHORIZATION' || w.module === 'Procurement');
    const poWf = liveWorkflows.find((w) => w.id === 'WF-PO-AUTHORIZATION');

    // 1. Live Purchase Requisitions pending approval (if PR workflow is active)
    if (!prWf || prWf.isActive) {
      const pendingPrs = livePrs.filter((p) => p.status === 'pending_approval' || p.approvalStatus === 'pending');
      pendingPrs.forEach((pr) => {
        const estValue = Number(pr.estimatedTotal) || 0;
        const tier = prWf?.tiers?.find((t) => !t.thresholdAmount || estValue <= t.thresholdAmount) || prWf?.tiers?.[0];
        
        items.push({
          id: `APP-PR-${pr.id}`,
          type: 'Purchase Requisition',
          domain: 'Procurement',
          record: pr.prNumber,
          desc: `${pr.lines?.[0]?.itemName || 'Materials'} (₹${(estValue / 100000).toFixed(2)} Lakhs) — ${pr.justification || 'Departmental Material Requisition'}`,
          initiator: pr.requestedBy || 'Procurement Requester',
          date: pr.requestDate || 'Recent',
          amount: `₹${(estValue / 100000).toFixed(2)} Lakhs`,
          priority: (pr.priority?.toUpperCase() || 'HIGH') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
          slaHoursLeft: tier?.slaHours || 24,
          currentTier: tier?.tierLevel || 1,
          totalTiers: prWf?.tiers?.length || 3,
          tierName: tier?.tierName || 'Department Head & Commercial Sign-off',
          approverRole: tier?.approverRoleName || 'Purchase Manager / Department Head',
          isDelegated: false,
          status: 'PENDING',
          view: 'prDetail',
          viewParam: { id: pr.id },
          vendor: pr.lines?.[0]?.suggestedSupplierName || 'Supplier Under Validation',
          costVariancePct: pr.budgetExceeded ? 'Budget Exceeded Warning' : 'Within Allocated CapEx',
          notes: pr.justification || pr.notes || 'Requisition submitted for multi-level approval & PO authorization.',
          rawType: 'PR',
          rawRecord: pr,
          timeline: pr.approvalHistory && pr.approvalHistory.length > 0
            ? pr.approvalHistory.map((h, idx) => ({
                tier: idx + 1,
                name: h.role || `Tier ${idx + 1}`,
                approver: h.user || 'Approver',
                status: h.action === 'Approved' ? 'APPROVED' : 'CURRENT',
                time: h.date || 'Pending',
              }))
            : [
                { tier: 1, name: 'Department Head & Stock Verify', approver: pr.requestedBy, status: 'APPROVED', time: pr.requestDate },
                { tier: 2, name: 'Purchase Manager Authorization', approver: 'Purchase Manager (You)', status: 'CURRENT', time: 'Pending' },
                { tier: 3, name: 'Executive Sign-off', approver: 'Plant Director', status: 'WAITING', time: 'Queued' },
              ],
        });
      });
    }

    // 2. Real Purchase Orders pending approval (if PO workflow is active)
    if (!poWf || poWf.isActive) {
      const pendingPos = INITIAL_EXTENDED_POS.filter(
        (po) => po.approvalStatus === 'pending' || po.status === 'pending_approval' || (po as any).requiresApproval
      );
      pendingPos.forEach((po) => {
        items.push({
          id: `APP-PO-${po.id}`,
          type: 'Purchase Order',
          domain: 'Procurement',
          record: po.poNumber,
          desc: `${po.vendorName} — ₹${(po.totalAmount / 100000).toFixed(2)} Lakhs (${po.items?.[0]?.description || 'Polymer Material Order'})`,
          initiator: po.buyerName || 'SCM Buyer',
          date: po.poDate || 'Recent',
          amount: `₹${(po.totalAmount / 100000).toFixed(2)} Lakhs`,
          priority: po.totalAmount > 1000000 ? 'CRITICAL' : 'HIGH',
          slaHoursLeft: 12,
          currentTier: 2,
          totalTiers: 3,
          tierName: 'Working Capital & Vendor Rate Authorization',
          approverRole: 'Purchase Manager / Procurement Head',
          isDelegated: false,
          status: 'PENDING',
          view: 'poDetail',
          viewParam: { id: po.id, poNumber: po.poNumber },
          vendor: po.vendorName,
          costVariancePct: 'Within Contract Budget',
          notes: `Purchase order released for plant operations. Payment terms: ${po.paymentTerms || '30 Days'}.`,
          rawType: 'PO',
          rawRecord: po,
          timeline: [
            { tier: 1, name: 'Technical & Rate Variance Check', approver: 'SCM Purchase Manager', status: 'APPROVED', time: 'Recent' },
            { tier: 2, name: 'Plant Budget Validation', approver: 'Purchase Head (You)', status: 'CURRENT', time: 'Pending' },
            { tier: 3, name: 'Executive Authorization', approver: 'Plant VP', status: 'WAITING', time: 'Queued' },
          ],
        });
      });
    }

    return items;
  }, [livePrs, liveWorkflows]);

  // Filter items by designation, activeTab, and domain
  const userRole = (currentUser?.role || currentUser?.roleType || '').toLowerCase();
  const filteredApprovals = React.useMemo(() => {
    return approvals.filter((item) => {
      if (activeTab === 'DELEGATED' && !item.isDelegated) return false;
      if (activeTab === 'MY_PENDING' && item.isDelegated) return false;
      if (domainFilter !== 'ALL' && item.domain !== domainFilter) return false;

      // Role-based designation coordination
      if (userRole && !userRole.includes('admin') && !userRole.includes('super')) {
        if (userRole.includes('purchase') || userRole.includes('procurement') || userRole.includes('buyer')) {
          if (item.domain !== 'Procurement') return false;
        } else if (userRole.includes('quality') || userRole.includes('qa')) {
          if (item.domain !== 'Quality') return false;
        } else if (userRole.includes('plant') || userRole.includes('operation')) {
          // Plant manager sees all operational & procurement items
          return true;
        }
      }

      return true;
    });
  }, [approvals, activeTab, domainFilter, userRole]);

  const handleAction = (id: string, action: 'Approve' | 'Reject', notes: string = '') => {
    const item = approvals.find((a) => a.id === id);
    if (!item) return;

    // 1. If it's a Purchase Requisition, update the actual real PR record in DB / LocalStorage
    if (item.rawType === 'PR' && item.rawRecord) {
      const pr = item.rawRecord as PurchaseRequisition;
      const updatedPr: PurchaseRequisition = {
        ...pr,
        status: action === 'Approve' ? 'approved' : 'rejected',
        approvalStatus: action === 'Approve' ? 'approved' : 'rejected',
        currentApprover: currentUser?.name || 'Authorized Approver',
        approvalHistory: [
          ...(pr.approvalHistory || []),
          {
            step: (pr.approvalHistory?.length || 1) + 1,
            role: currentUser?.role || 'Purchase Manager',
            user: currentUser?.name || 'Purchase Manager',
            action: action === 'Approve' ? ('Approved' as const) : ('Rejected' as const),
            date: new Date().toISOString().slice(0, 10),
            comment: notes || (action === 'Approve' ? 'Approved through Enterprise Approvals Hub' : 'Rejected by authorized reviewer'),
          },
        ],
      };
      addPurchaseRequisition(updatedPr);
      adminEventBus.emit('PR_SAVED', updatedPr);
      adminEventBus.emit('PR_APPROVED', updatedPr);
    }

    // 2. Add to Resolution History
    const historyEntry = {
      ...item,
      status: action === 'Approve' ? 'APPROVED' : 'REJECTED',
      decidedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionNotes: notes || (action === 'Approve' ? 'Approved through Universal Workflow Engine.' : 'Rejected by authorized reviewer.'),
    };
    const nextHistory = [historyEntry, ...history];
    setHistory(nextHistory);
    try {
      localStorage.setItem('reboot_erp_approvals_history', JSON.stringify(nextHistory.slice(0, 50)));
    } catch {}

    setSelectedIds((prev) => prev.filter((selId) => selId !== id));
    if (inspectItem?.id === id) setInspectItem(null);
    if (reworkModalItem?.id === id) setReworkModalItem(null);

    showToast?.(`✓ ${action === 'Approve' ? 'Approved' : 'Rejected'} ${item.record} successfully.`);
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    selectedIds.forEach((id) => handleAction(id, 'Approve', 'Batch Approved via Enterprise Approvals Hub'));
    showToast?.(`✓ Batch approved ${count} transactions.`);
  };

  const handleRequestRework = () => {
    if (!reworkModalItem || !reworkReason.trim()) {
      showToast?.('Please provide rework instructions for the requester.');
      return;
    }
    const item = reworkModalItem;

    if (item.rawType === 'PR' && item.rawRecord) {
      const pr = item.rawRecord as PurchaseRequisition;
      const updatedPr: PurchaseRequisition = {
        ...pr,
        status: 'draft',
        approvalStatus: 'pending',
        notes: `Rework Requested: ${reworkReason}`,
        approvalHistory: [
          ...(pr.approvalHistory || []),
          {
            step: (pr.approvalHistory?.length || 1) + 1,
            role: currentUser?.role || 'Purchase Manager',
            user: currentUser?.name || 'Purchase Manager',
            action: 'Pending' as const,
            date: new Date().toISOString().slice(0, 10),
            comment: `Rework Requested: ${reworkReason}`,
          },
        ],
      };
      addPurchaseRequisition(updatedPr);
      adminEventBus.emit('PR_SAVED', updatedPr);
    }

    const nextHistory = [
      {
        ...item,
        status: 'REWORK_REQUESTED',
        decidedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionNotes: `Rework Requested: ${reworkReason}`,
      },
      ...history,
    ];
    setHistory(nextHistory);
    try {
      localStorage.setItem('reboot_erp_approvals_history', JSON.stringify(nextHistory.slice(0, 50)));
    } catch {}

    setSelectedIds((prev) => prev.filter((selId) => selId !== item.id));
    setReworkModalItem(null);
    setReworkReason('');
    showToast?.(`Rework requested on ${item.record}. Document returned to ${item.initiator}.`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredApprovals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApprovals.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Approvals Hub</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Universal Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-tier hierarchical authorization with SLA tracking, Segregation of Duties (SoD), and designation coordination
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <RequireAuth roles={['admin', 'manager', 'lead', 'director']}>
              <button
                onClick={handleBatchApprove}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Batch Approve ({selectedIds.length})
              </button>
            </RequireAuth>
          )}
          <button
            onClick={() => onNavigate('adminWorkflows')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Configure Workflows in Admin</span>
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            {filteredApprovals.length} PENDING DECISIONS
          </div>
        </div>
      </div>

      {/* Tabs and Filters bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('MY_PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MY_PENDING'
                ? 'bg-white text-[#0F8B8D] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            My Action Items ({approvals.filter((a) => !a.isDelegated).length})
          </button>
          <button
            onClick={() => setActiveTab('DELEGATED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'DELEGATED'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>Delegated to Me</span>
            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">
              {approvals.filter((a) => a.isDelegated).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Resolution History ({history.length})
          </button>
        </div>

        {activeTab !== 'HISTORY' && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
            >
              <option value="ALL">All ERP Domains</option>
              <option value="Procurement">Procurement (PR / PO)</option>
              <option value="Finance">Finance &amp; Credit</option>
              <option value="Engineering">Engineering (ECO / BOM)</option>
              <option value="Quality">Quality &amp; Quarantine</option>
            </select>
            {filteredApprovals.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {selectedIds.length === filteredApprovals.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main List */}
      {activeTab === 'HISTORY' ? (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No past resolution records found. Newly approved or rejected items will be logged here.
            </div>
          ) : (
            history.map((h, idx) => (
              <div key={`${h.id}-${idx}`} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        h.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : h.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {h.status}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800">{h.record}</span>
                    <span className="text-xs text-slate-600 font-semibold">{h.desc}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Action recorded at <b>{h.decidedAt}</b> &middot; Note: <i>{h.actionNotes}</i>
                  </div>
                </div>
                <div className="text-right text-xs font-mono font-bold text-slate-700">{h.amount}</div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApprovals.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3 shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Approvals Queue Clear</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no pending authorization requests matching your designation ({currentUser?.role || 'Admin'}).
                Newly submitted Purchase Requisitions and Purchase Orders will automatically arrive here.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => onNavigate('prCreate')}
                  className="px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Purchase Requisition (PR)
                </button>
                <button
                  onClick={() => onNavigate('purchaseReqList')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  View All Requisitions
                </button>
              </div>
            </div>
          ) : (
            filteredApprovals.map((app) => {
              const isSelected = selectedIds.includes(app.id);
              const isSlaBreached = app.slaHoursLeft <= 0;
              const isSlaWarning = app.slaHoursLeft > 0 && app.slaHoursLeft <= 4;

              return (
                <div
                  key={app.id}
                  className={`bg-white p-5 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs ${
                    isSelected ? 'border-[#0F8B8D] bg-cyan-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(app.id)}
                      className="mt-1 rounded text-[#0F8B8D] focus:ring-[#0F8B8D] cursor-pointer"
                    />

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 uppercase tracking-wider">
                          {app.domain}
                        </span>
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {app.record}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{app.amount}</span>

                        {app.isDelegated && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 flex items-center gap-1">
                            Delegated from {app.delegatedFrom}
                          </span>
                        )}

                        {isSlaBreached ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-rose-600" /> SLA Breached (Auto-Escalating)
                          </span>
                        ) : isSlaWarning ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> {app.slaHoursLeft}h SLA Remaining
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> {app.slaHoursLeft}h SLA
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{app.desc}</h3>

                      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                        <span>Requested by: <b className="text-slate-700">{app.initiator}</b></span>
                        <span>&bull;</span>
                        <span>{app.date}</span>
                        <span>&bull;</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          Tier {app.currentTier}/{app.totalTiers}: {app.tierName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => setInspectItem(app)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Inspect &amp; Diff
                    </button>

                    <RequireAuth
                      roles={['admin', 'manager', 'lead', 'director', 'purchase_manager', 'procurement_head', 'procurement_buyer', 'plant_manager']}
                      fallback={
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1 font-medium">
                          <Lock className="w-3 h-3" /> Sign-off Clearance Required
                        </span>
                      }
                    >
                      <button
                        onClick={() => setReworkModalItem(app)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Request Rework
                      </button>
                      <button
                        onClick={() => handleAction(app.id, 'Reject')}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(app.id, 'Approve')}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        One-Click Approve
                      </button>
                    </RequireAuth>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Inspect & Side-by-Side Diff Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    {inspectItem.domain}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900">{inspectItem.record}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{inspectItem.desc}</h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Document Summary Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Total Amount / Impact</span>
                  <p className="font-bold text-sm text-slate-900 mt-0.5">{inspectItem.amount}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Budget Indicator</span>
                  <p className="font-semibold text-emerald-700 mt-0.5">{inspectItem.costVariancePct}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Vendor / Suggested Source</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{inspectItem.vendor}</p>
                </div>
              </div>

              {/* Justification Notes */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                  Commercial &amp; Operational Justification
                </h4>
                <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-slate-700 leading-relaxed">
                  {inspectItem.notes}
                </div>
              </div>

              {/* Requisition Lines Table (if PR) */}
              {inspectItem.rawRecord?.lines && inspectItem.rawRecord.lines.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                    Line Item Breakdown
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="p-2">Item Code</th>
                          <th className="p-2">Description</th>
                          <th className="p-2 text-right">Quantity</th>
                          <th className="p-2 text-right">Est. Unit Price</th>
                          <th className="p-2 text-right">Est. Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspectItem.rawRecord.lines.map((l: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-800">{l.itemCode}</td>
                            <td className="p-2 text-slate-700">{l.itemName}</td>
                            <td className="p-2 text-right font-bold text-slate-900">{l.quantity} {l.uom || 'KG'}</td>
                            <td className="p-2 text-right font-mono">₹{l.estimatedUnitPrice || 0}</td>
                            <td className="p-2 text-right font-bold font-mono text-emerald-700">₹{(l.estimatedTotal || ((Number(l.quantity) || 0) * (Number(l.estimatedUnitPrice) || 0))).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Multi-Tier Signature Stepper */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
                  Hierarchical Approval Pipeline
                </h4>
                <div className="space-y-3 relative before:content-[''] before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {inspectItem.timeline.map((step: any, idx: number) => (
                    <div key={idx} className="relative pl-9 flex items-center justify-between">
                      <div
                        className={`absolute left-1.5 top-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                          step.status === 'APPROVED'
                            ? 'bg-emerald-500 ring-4 ring-emerald-100'
                            : step.status === 'CURRENT'
                            ? 'bg-indigo-600 ring-4 ring-indigo-100 animate-pulse'
                            : 'bg-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{step.name}</div>
                        <div className="text-[11px] text-slate-500">{step.approver}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          step.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : step.status === 'CURRENT'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {step.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  onNavigate(inspectItem.view, inspectItem.viewParam);
                  setInspectItem(null);
                }}
                className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                Open Full ERP Module Record &rarr;
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setReworkModalItem(inspectItem);
                    setInspectItem(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                >
                  Request Rework
                </button>
                <button
                  onClick={() => handleAction(inspectItem.id, 'Reject')}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(inspectItem.id, 'Approve')}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Approve Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rework Request Modal */}
      {reworkModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Rework &amp; Amendment</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Returning <b>{reworkModalItem.record}</b> to <b>{reworkModalItem.initiator}</b> for corrections.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Detailed Feedback / Required Changes *</label>
              <textarea
                value={reworkReason}
                onChange={(e) => setReworkReason(e.target.value)}
                placeholder="e.g. Please negotiate a volume discount or update delivery schedule to split across two fortnights..."
                rows={4}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0F8B8D] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReworkModalItem(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRework}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer"
              >
                Send Rework Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const WorkspaceNotificationsView: React.FC<WorkspaceToolProps> = ({ onNavigate, showToast }) => {
  const [notifications, setNotifications] = useState([
    { id: 'NOT-01', title: 'Mold Temperature Alert on IMM Press 04', text: 'Cavity zone thermocouple reads 234°C (Upper threshold exceeded by 9°C)', type: 'ALERT', time: '12 mins ago', view: 'mfgDash' },
    { id: 'NOT-02', title: 'Raw Material Silo 02 Low Level Warning', text: 'PP Homopolymer stock below 2.5 metric tons minimum safety buffer', type: 'WARNING', time: '45 mins ago', view: 'stockList' },
    { id: 'NOT-03', title: 'Work Order WO-2026-00456 Ready for Final QC', text: 'Lot of 1,200 automotive housings finished injection molding cycle', type: 'INFO', time: '2 hrs ago', view: 'woList' },
    { id: 'NOT-04', title: 'New Customer Quotation Q-2026-89 Accepted', text: 'Tata Motors accepted quotation for battery brackets (Value ₹14.8L)', type: 'SUCCESS', time: '4 hrs ago', view: 'quoteList' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
            <p className="text-xs text-slate-500">Live floor telemetries, threshold alarms, and production milestone triggers</p>
          </div>
        </div>
        <button
          onClick={() => { setNotifications([]); showToast?.('All notifications marked as read'); }}
          className="text-xs text-indigo-600 font-semibold hover:underline"
        >
          Clear all notifications
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {notifications.map(n => (
          <div key={n.id} onClick={() => onNavigate(n.view)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex items-start gap-3.5">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
              n.type === 'ALERT' ? 'bg-rose-500' :
              n.type === 'WARNING' ? 'bg-amber-500' :
              n.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-indigo-500'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                <span className="text-[11px] text-slate-400 shrink-0">{n.time}</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{n.text}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 self-center shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const WorkspaceSavedViewsView: React.FC<WorkspaceToolProps> = ({ onNavigate }) => {
  const presets = [
    { id: 'SV-1', title: 'Active Molding Work Orders (Plant 01)', module: 'Manufacturing', view: 'woList', count: '14 orders', icon: '📋' },
    { id: 'SV-2', title: 'Critical Stock Items Below Reorder Point', module: 'Warehouse', view: 'stockList', count: '6 SKUs', icon: '📦' },
    { id: 'SV-3', title: 'Open Quality NCRs Awaiting 5-Why RCA', module: 'Quality', view: 'ncrList', count: '2 NCRs', icon: '⚠️' },
    { id: 'SV-4', title: 'Purchase Orders Pending Multi-Tier Approval', module: 'Procurement', view: 'poApprovals', count: '3 POs', icon: '🧾' },
    { id: 'SV-5', title: 'Weekly Injection Press Shift Rosters', module: 'HRMS', view: 'hrShiftRoster', count: '128 staff', icon: '👥' },
    { id: 'SV-6', title: 'Machines Exceeding Energy Thresholds', module: 'MEP', view: 'energyTelemetry', count: '4 units', icon: '⚡' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Saved Views &amp; Presets</h1>
            <p className="text-xs text-slate-500">Quickly launch predefined data grid queries, custom column layouts, and filtered records</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map(p => (
          <div
            key={p.id}
            onClick={() => onNavigate(p.view)}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-900/5 hover:-translate-y-1 active:translate-y-0.5 active:scale-[0.98] transition-all duration-200 ease-out cursor-pointer flex flex-col justify-between group relative overflow-hidden select-none"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-purple-600 group-hover:text-purple-700 transition-colors">{p.module}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px] group-hover:bg-purple-50 group-hover:text-purple-700 transition-colors">{p.count}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors flex items-center gap-2">
                <span className="text-base group-hover:scale-110 transition-transform">{p.icon}</span>
                <span>{p.title}</span>
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-purple-100 flex items-center justify-between text-xs text-purple-600 font-semibold transition-colors">
              <span>Open filtered view</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WorkspaceRecentRecordsView: React.FC<WorkspaceToolProps> = ({ onNavigate, showToast }) => {
  const [records, setRecords] = useState<RecentRecordItem[]>(INITIAL_RECENT_RECORDS);

  const handleClear = () => {
    setRecords([]);
    try {
      localStorage.removeItem('reboot_recent_records');
    } catch (e) {
      console.error(e);
    }
    showToast?.('Recent records history cleared');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recent Records Log</h1>
            <p className="text-xs text-slate-500">History of your recently visited work orders, sales orders, polymer items, and vendors</p>
          </div>
        </div>
        {records.length > 0 && (
          <RequireAuth roles={['admin', 'user']}>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </RequireAuth>
        )}
      </div>

      {records.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No recent records yet</h3>
          <p className="text-xs text-slate-500 mt-1">Navigate to any work order, part, or supplier to populate this list.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {records.map(rec => (
            <div
              key={rec.id}
              onClick={() => onNavigate(rec.view, rec.params)}
              className="bg-white p-4 rounded-xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] transition-all duration-200 ease-out cursor-pointer flex items-center justify-between gap-3 group select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-600 flex items-center justify-center font-bold text-xs uppercase font-mono shrink-0 transition-colors">
                  {rec.type}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700">{rec.recordCode}</span>
                    <span className="text-[11px] text-slate-400 font-medium">&bull; {rec.module}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate mt-0.5">{rec.title}</h4>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                <span>{rec.timestamp}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
