import React, { useState, useMemo, useEffect } from 'react';
import {
  EngineeringChangeRequest,
  EngineeringChangeOrder,
  ItemMaster,
  BomMaster,
  BomLine,
  BomApprovalHistory,
} from '../../types';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  Download,
  Eye,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  ArrowUpRight,
  HelpCircle,
  ChevronRight,
  Calendar,
  User,
  Building,
  DollarSign,
  AlertCircle,
  FileCheck,
  Cpu,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ListTodo,
  Tag,
  ShieldAlert,
} from 'lucide-react';

interface EngineeringChangeOrderViewProps {
  initialViewMode?: 'ecr' | 'eco';
  selectedId?: string;
  ecrs: EngineeringChangeRequest[];
  ecos: EngineeringChangeOrder[];
  items: ItemMaster[];
  boms: BomMaster[];
  onUpdateEcrs: (ecrs: EngineeringChangeRequest[]) => void;
  onUpdateEcos: (ecos: EngineeringChangeOrder[]) => void;
  onUpdateBom?: (bom: BomMaster) => void;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
  openDrawer?: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer?: () => void;
}

type TabType = 'ecr' | 'eco' | 'matrix';

export const EngineeringChangeOrderView: React.FC<EngineeringChangeOrderViewProps> = ({
  initialViewMode = 'ecr',
  selectedId,
  ecrs,
  ecos,
  items,
  boms,
  onUpdateEcrs,
  onUpdateEcos,
  onUpdateBom,
  onNavigate,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialViewMode === 'eco' ? 'eco' : 'ecr');

  // Selected ECR or ECO
  const [selectedEcrId, setSelectedEcrId] = useState<string>(
    ecrs.find((e) => e.id === selectedId)?.id || ecrs[0]?.id || ''
  );
  const [selectedEcoId, setSelectedEcoId] = useState<string>(
    ecos.find((e) => e.id === selectedId)?.id || ecos[0]?.id || ''
  );

  // If selectedId changed externally, auto-switch tab and select
  useEffect(() => {
    if (selectedId) {
      const matchedEco = ecos.find((e) => e.id === selectedId || e.ecoNumber === selectedId);
      if (matchedEco) {
        setActiveTab('eco');
        setSelectedEcoId(matchedEco.id);
        return;
      }
      const matchedEcr = ecrs.find((e) => e.id === selectedId || e.ecrNumber === selectedId);
      if (matchedEcr) {
        setActiveTab('ecr');
        setSelectedEcrId(matchedEcr.id);
      }
    }
  }, [selectedId, ecrs, ecos]);

  // Filters and Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>('all');

  // Modal Dialog States
  const [isCreateEcrOpen, setIsCreateEcrOpen] = useState<boolean>(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false);
  const [ecrToConvert, setEcrToConvert] = useState<EngineeringChangeRequest | null>(null);
  const [isApproveStageModalOpen, setIsApproveStageModalOpen] = useState<boolean>(false);
  const [stageToApprove, setStageToApprove] = useState<{ ecrId: string; stageIndex: number } | null>(null);
  const [approvalComment, setApprovalComment] = useState<string>('Reviewed and approved against engineering specifications.');

  // Current selected objects
  const activeEcr = useMemo(() => {
    return ecrs.find((e) => e.id === selectedEcrId) || ecrs[0] || null;
  }, [ecrs, selectedEcrId]);

  const activeEco = useMemo(() => {
    return ecos.find((e) => e.id === selectedEcoId) || ecos[0] || null;
  }, [ecos, selectedEcoId]);

  // Real-time queries for active selection
  const activeItemData = useMemo(() => {
    const code = activeTab === 'ecr' ? activeEcr?.relatedItem : activeEco?.itemCode;
    if (!code) return null;
    return items.find((i) => i.code === code) || null;
  }, [items, activeTab, activeEcr, activeEco]);

  const activeBomData = useMemo(() => {
    const bomId = activeTab === 'ecr' ? activeEcr?.relatedBomId : activeEco?.bomId;
    if (!bomId) return null;
    return boms.find((b) => b.id === bomId) || null;
  }, [boms, activeTab, activeEcr, activeEco]);

  // Filtering Logic
  const filteredEcrs = useMemo(() => {
    return ecrs.filter((e) => {
      const matchesSearch =
        searchQuery === '' ||
        e.ecrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.relatedItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.relatedItemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || e.priority === priorityFilter;
      const matchesType = changeTypeFilter === 'all' || e.changeType === changeTypeFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [ecrs, searchQuery, statusFilter, priorityFilter, changeTypeFilter]);

  const filteredEcos = useMemo(() => {
    return ecos.filter((e) => {
      const matchesSearch =
        searchQuery === '' ||
        e.ecoNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.changeOwner.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || e.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [ecos, searchQuery, statusFilter, priorityFilter]);

  // Executive KPI stats
  const kpiStats = useMemo(() => {
    const openEcrs = ecrs.filter((e) => e.status === 'Under Review' || e.status === 'Submitted').length;
    const approvedEcrs = ecrs.filter((e) => e.status === 'Approved').length;
    const inProgressEcos = ecos.filter((e) => e.status === 'In Progress' || e.status === 'Pending Approval').length;
    const implementedEcos = ecos.filter((e) => e.status === 'Implemented' || e.status === 'Closed').length;
    const netCostImpact = ecrs.reduce((acc, curr) => acc + (curr.estimatedCostImpact || 0), 0);
    const totalQuarantineStock = ecrs.reduce((acc, curr) => acc + (curr.stockImpactKg || 0), 0);

    return {
      openEcrs,
      approvedEcrs,
      inProgressEcos,
      implementedEcos,
      netCostImpact,
      totalQuarantineStock,
    };
  }, [ecrs, ecos]);

  /* =========================================================================
     WORKFLOW HANDLERS
  ========================================================================= */

  // Approve a stage in ECR
  const handleConfirmApproveStage = () => {
    if (!stageToApprove || !activeEcr) return;
    const updatedApprovals = [...activeEcr.approvals];
    const stage = updatedApprovals[stageToApprove.stageIndex];
    if (stage) {
      stage.status = 'Approved';
      stage.timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      stage.comments = approvalComment;
    }

    // Check if all approvals are complete
    const allApproved = updatedApprovals.every((a) => a.status === 'Approved');
    const newStatus = allApproved ? 'Approved' : 'Under Review';

    const updatedEcr: EngineeringChangeRequest = {
      ...activeEcr,
      status: newStatus,
      approvals: updatedApprovals,
    };

    const updatedList = ecrs.map((e) => (e.id === updatedEcr.id ? updatedEcr : e));
    onUpdateEcrs(updatedList);
    showToast(`Approved stage '${stage?.stage}' for ${activeEcr.ecrNumber}`);
    setIsApproveStageModalOpen(false);
    setStageToApprove(null);
  };

  // Reject ECR
  const handleRejectEcr = (ecrId: string) => {
    const target = ecrs.find((e) => e.id === ecrId);
    if (!target) return;
    const updatedEcr: EngineeringChangeRequest = {
      ...target,
      status: 'Rejected',
    };
    onUpdateEcrs(ecrs.map((e) => (e.id === ecrId ? updatedEcr : e)));
    showToast(`ECR ${target.ecrNumber} marked as Rejected.`);
  };

  // Open Convert to ECO modal
  const handleOpenConvertModal = (ecr: EngineeringChangeRequest) => {
    setEcrToConvert(ecr);
    setIsConvertModalOpen(true);
  };

  // Toggle ECO checklist task
  const handleToggleEcoChecklist = (ecoId: string, taskIndex: number) => {
    const targetEco = ecos.find((e) => e.id === ecoId);
    if (!targetEco) return;

    const newChecklist = targetEco.checklist.map((t, idx) => {
      if (idx === taskIndex) {
        const willBeCompleted = !t.completed;
        return {
          ...t,
          completed: willBeCompleted,
          completedBy: willBeCompleted ? 'Vikram Singh (Lead Engineer)' : undefined,
          completedDate: willBeCompleted ? new Date().toISOString().slice(0, 10) : undefined,
        };
      }
      return t;
    });

    const updatedEco: EngineeringChangeOrder = {
      ...targetEco,
      checklist: newChecklist,
    };

    onUpdateEcos(ecos.map((e) => (e.id === ecoId ? updatedEco : e)));
    showToast(`Checklist task updated for ${targetEco.ecoNumber}`);
  };

  // Implement ECO and optionally bump BOM revision
  const handleImplementEco = (ecoId: string) => {
    const targetEco = ecos.find((e) => e.id === ecoId);
    if (!targetEco) return;

    const updatedEco: EngineeringChangeOrder = {
      ...targetEco,
      status: 'Implemented',
    };

    onUpdateEcos(ecos.map((e) => (e.id === ecoId ? updatedEco : e)));

    // If BOM exists, update revision and notify
    const linkedBom = boms.find((b) => b.id === targetEco.bomId);
    if (linkedBom && onUpdateBom) {
      const currentVerNum = parseFloat(linkedBom.version.replace(/[^0-9.]/g, '')) || 1.0;
      const nextVer = `v${(currentVerNum + 0.1).toFixed(1)}`;
      const updatedBom: BomMaster = {
        ...linkedBom,
        version: nextVer,
        updated: new Date().toISOString().slice(0, 10),
      };
      onUpdateBom(updatedBom);
      showToast(`ECO ${targetEco.ecoNumber} Implemented. Linked BOM ${linkedBom.id} revision bumped to ${nextVer}.`);
    } else {
      showToast(`ECO ${targetEco.ecoNumber} successfully Implemented & Released.`);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (activeTab === 'ecr') {
      const headers = ['ECR Number', 'Item Code', 'Item Name', 'Change Type', 'Priority', 'Status', 'Requested By', 'Cost Impact (INR)', 'Stock Impact (KG)'];
      const rows = filteredEcrs.map((e) => [
        e.ecrNumber,
        e.relatedItem,
        `"${e.relatedItemName}"`,
        e.changeType,
        e.priority,
        e.status,
        e.requestedBy,
        e.estimatedCostImpact,
        e.stockImpactKg,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const uri = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
      const link = document.createElement('a');
      link.href = uri;
      link.download = `Engineering_Change_Requests_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported ECR registry to CSV.');
    } else {
      const headers = ['ECO Number', 'Linked ECR', 'Item Code', 'Item Name', 'BOM ID', 'Change Owner', 'Priority', 'Status', 'Effective Strategy'];
      const rows = filteredEcos.map((e) => [
        e.ecoNumber,
        e.linkedEcrId || '-',
        e.itemCode,
        `"${e.itemName}"`,
        e.bomId,
        e.changeOwner,
        e.priority,
        e.status,
        e.effectiveStrategy,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const uri = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
      const link = document.createElement('a');
      link.href = uri;
      link.download = `Engineering_Change_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported ECO registry to CSV.');
    }
  };

  return (
    <div className="space-y-5" id="engineering-change-control-hub">
      {/* 1. Header Bar with Actions & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E4E0D6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#E8622C] font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-[#E8622C]" /> IATF 16949 / ISO 9001
            </span>
            <span className="text-[11px] text-gray-400">&bull;</span>
            <span className="text-[11px] text-gray-500 font-mono">BOM, Tooling &amp; Material Revision Control</span>
          </div>
          <h1 className="text-xl font-bold text-[#14213D] flex items-center gap-2">
            <span>Engineering Change Control Management</span>
          </h1>
          <p className="text-xs text-[#6B7280]">
            Governed end-to-end lifecycle for Engineering Change Requests (ECR) and Implementation Orders (ECO).
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="btn btn-sm btn-ghost border border-[#E4E0D6] text-xs py-1.5 flex items-center gap-1.5 shadow-2xs"
            title="Export Registry to CSV"
            id="btn-export-ecr-eco"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Export CSV</span>
          </button>

          {/* ALL INPUTS ENABLED NEW ECR BUTTON */}
          <button
            onClick={() => setIsCreateEcrOpen(true)}
            className="btn btn-sm btn-primary text-xs py-1.5 flex items-center gap-1.5 shadow-xs"
            id="btn-create-new-ecr-main"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New ECR</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Open ECRs */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Under Review</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600">
            {kpiStats.openEcrs} ECRs
          </div>
          <div className="text-[10px] text-gray-400">Awaiting stage approvals</div>
        </div>

        {/* Approved ECRs */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Approved ECRs</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {kpiStats.approvedEcrs} Ready
          </div>
          <div className="text-[10px] text-gray-400">Eligible for ECO conversion</div>
        </div>

        {/* In Progress ECOs */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Active ECOs</span>
            <GitPullRequest className="w-3.5 h-3.5 text-[#0F8B8D]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#0F8B8D]">
            {kpiStats.inProgressEcos} In Progress
          </div>
          <div className="text-[10px] text-gray-400">Shopfloor implementation</div>
        </div>

        {/* Implemented ECOs */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Implemented</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-[#14213D]">
            {kpiStats.implementedEcos} Released
          </div>
          <div className="text-[10px] text-gray-400">BOM revisions live in ERP</div>
        </div>

        {/* Annual Net Cost Impact */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Annual Cost Impact</span>
            {kpiStats.netCostImpact < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-[#E8622C]" />
            )}
          </div>
          <div className={`text-xl font-bold font-mono ${kpiStats.netCostImpact < 0 ? 'text-emerald-700' : 'text-[#14213D]'}`}>
            {kpiStats.netCostImpact < 0 ? `-₹${Math.abs(kpiStats.netCostImpact).toLocaleString()}` : `₹${kpiStats.netCostImpact.toLocaleString()}`}
          </div>
          <div className="text-[10px] text-gray-400">
            {kpiStats.netCostImpact < 0 ? 'Projected annual savings' : 'Net investment / tooling'}
          </div>
        </div>

        {/* Stock Subject to Quarantine */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Inventory Exposure</span>
            <Package className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-700">
            {kpiStats.totalQuarantineStock.toLocaleString()} kg
          </div>
          <div className="text-[10px] text-gray-400">Phase-out / retest stock</div>
        </div>
      </div>

      {/* 3. Tab Switching Controller */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E4E0D6] shadow-2xs">
          <button
            onClick={() => setActiveTab('ecr')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'ecr' ? 'bg-[#14213D] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
            id="tab-ecr-list"
          >
            <GitCommit className="w-3.5 h-3.5 text-[#E8622C]" />
            <span>Engineering Change Requests (ECR)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'ecr' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {ecrs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('eco')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'eco' ? 'bg-[#14213D] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
            id="tab-eco-list"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-[#0F8B8D]" />
            <span>Engineering Change Orders (ECO)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'eco' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {ecos.length}
            </span>
          </button>
        </div>

        {/* Global Search & Filters */}
        <div className="flex items-center gap-2 flex-grow max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'ecr' ? 'ECRs' : 'ECOs'} by number, part, engineer...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
              id="input-search-ecr-eco"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-[#E4E0D6] rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            {activeTab === 'ecr' ? (
              <>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Converted to ECO">Converted to ECO</option>
                <option value="Rejected">Rejected</option>
              </>
            ) : (
              <>
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="Implemented">Implemented</option>
                <option value="Closed">Closed</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 4. Main Two-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Master List of Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {activeTab === 'ecr' ? (
            filteredEcrs.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-[#E4E0D6] text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-500 font-semibold">No Engineering Change Requests match criteria.</p>
                <button
                  onClick={() => setIsCreateEcrOpen(true)}
                  className="btn btn-sm btn-primary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Create New ECR
                </button>
              </div>
            ) : (
              filteredEcrs.map((ecr) => {
                const isSelected = selectedEcrId === ecr.id;
                const approvedCount = ecr.approvals.filter((a) => a.status === 'Approved').length;
                return (
                  <div
                    key={ecr.id}
                    onClick={() => setSelectedEcrId(ecr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-[#E8622C] ring-2 ring-[#E8622C]/20 shadow-sm'
                        : 'bg-white border-[#E4E0D6] hover:border-gray-300 shadow-2xs'
                    }`}
                    id={`ecr-card-${ecr.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#E8622C] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {ecr.ecrNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ecr.priority === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : ecr.priority === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ecr.priority}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ecr.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ecr.status === 'Converted to ECO'
                          ? 'bg-teal-100 text-teal-800'
                          : ecr.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ecr.status}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-[#14213D] mt-2 line-clamp-1">
                      {ecr.description}
                    </h3>

                    <div className="mt-1 text-[11px] text-gray-500 line-clamp-1">
                      {ecr.relatedItem} &bull; {ecr.relatedItemName}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-gray-500 font-mono">
                      <span>Target: {ecr.targetDate}</span>
                      <span className={`font-bold ${ecr.estimatedCostImpact < 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                        {ecr.estimatedCostImpact < 0 ? `-₹${Math.abs(ecr.estimatedCostImpact).toLocaleString()}` : `+₹${ecr.estimatedCostImpact.toLocaleString()}`}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-sans">
                        {approvedCount}/{ecr.approvals.length} Approved
                      </span>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            filteredEcos.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-[#E4E0D6] text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-500 font-semibold">No Engineering Change Orders match criteria.</p>
              </div>
            ) : (
              filteredEcos.map((eco) => {
                const isSelected = selectedEcoId === eco.id;
                const completedTasks = eco.checklist.filter((t) => t.completed).length;
                return (
                  <div
                    key={eco.id}
                    onClick={() => setSelectedEcoId(eco.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-[#0F8B8D] ring-2 ring-[#0F8B8D]/20 shadow-sm'
                        : 'bg-white border-[#E4E0D6] hover:border-gray-300 shadow-2xs'
                    }`}
                    id={`eco-card-${eco.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0F8B8D] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {eco.ecoNumber}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {eco.linkedEcrId || 'Direct ECO'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        eco.status === 'Implemented'
                          ? 'bg-blue-100 text-blue-800'
                          : eco.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {eco.status}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-[#14213D] mt-2">
                      {eco.itemCode} &mdash; {eco.itemName}
                    </h3>

                    <div className="mt-1 text-[11px] text-gray-500 flex items-center justify-between">
                      <span>Owner: <strong>{eco.changeOwner}</strong></span>
                      <span className="font-mono text-[10px] text-[#0F8B8D]">BOM: {eco.bomId}</span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-gray-500 font-mono">
                      <span>Strategy: {eco.effectiveStrategy}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-sans">
                        Checklist: {completedTasks}/{eco.checklist.length} ({Math.round((completedTasks / Math.max(eco.checklist.length, 1)) * 100)}%)
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Right Column: Deep-Dive Comprehensive Inspector (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E4E0D6] shadow-2xs p-5 space-y-6">
          {activeTab === 'ecr' && activeEcr ? (
            <div className="space-y-6" id="ecr-inspector-pane">
              {/* ECR Header with Conversion / Action buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E0D6]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#E8622C]">
                      {activeEcr.ecrNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeEcr.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeEcr.status === 'Converted to ECO'
                        ? 'bg-teal-100 text-teal-800'
                        : activeEcr.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {activeEcr.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      Risk: {activeEcr.riskLevel}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#14213D] mt-1">
                    {activeEcr.description}
                  </h2>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeEcr.status === 'Approved' && (
                    <button
                      onClick={() => handleOpenConvertModal(activeEcr)}
                      className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-xs"
                      id="btn-convert-ecr-to-eco"
                    >
                      <GitPullRequest className="w-3.5 h-3.5" />
                      <span>Convert to ECO</span>
                    </button>
                  )}

                  {activeEcr.status === 'Converted to ECO' && (
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> ECO Issued
                    </span>
                  )}

                  {activeEcr.status === 'Under Review' && (
                    <button
                      onClick={() => handleRejectEcr(activeEcr.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded border border-rose-200 hover:bg-rose-50 transition-colors"
                      title="Reject this ECR"
                    >
                      Reject ECR
                    </button>
                  )}
                </div>
              </div>

              {/* Technical Scope, Root Cause & Justification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6] space-y-1.5">
                  <span className="font-bold text-[10px] uppercase text-[#0F8B8D] tracking-wider block">
                    Change Classification &amp; Requester
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Change Type:</span>
                      <strong className="text-[#14213D]">{activeEcr.changeType}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Requested By:</span>
                      <strong className="text-[#14213D]">{activeEcr.requestedBy}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Department:</span>
                      <strong className="text-[#14213D]">{activeEcr.department}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Target Date:</span>
                      <strong className="text-[#14213D]">{activeEcr.targetDate}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6] space-y-1.5">
                  <span className="font-bold text-[10px] uppercase text-[#0F8B8D] tracking-wider block">
                    Business &amp; Inventory Impact
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Cost Impact (Est):</span>
                      <strong className={`font-mono ${activeEcr.estimatedCostImpact < 0 ? 'text-emerald-700' : 'text-[#14213D]'}`}>
                        {activeEcr.estimatedCostImpact < 0 ? `-₹${Math.abs(activeEcr.estimatedCostImpact).toLocaleString()}` : `₹${activeEcr.estimatedCostImpact.toLocaleString()}`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Stock Impact:</span>
                      <strong className="font-mono text-purple-700">{activeEcr.stockImpactKg} kg</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Affected BOMs:</span>
                      <strong className="font-mono text-[#0F8B8D]">{activeEcr.affectedBoms.join(', ') || 'None'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Active Work Orders:</span>
                      <strong className="font-mono text-gray-700">{activeEcr.affectedWorkOrders.length > 0 ? activeEcr.affectedWorkOrders.join(', ') : 'None impacted'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Reason & Expected Impact */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white border border-[#E4E0D6] rounded-xl space-y-1">
                  <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">
                    Root Cause &amp; Technical Justification
                  </span>
                  <p className="text-gray-700 leading-relaxed">{activeEcr.reason}</p>
                </div>

                <div className="p-3 bg-white border border-[#E4E0D6] rounded-xl space-y-1">
                  <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">
                    Expected Operational &amp; Quality Impact
                  </span>
                  <p className="text-gray-700 leading-relaxed">{activeEcr.expectedImpact}</p>
                </div>
              </div>

              {/* Real-time Item & BOM Context */}
              {activeItemData && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#0F8B8D]" /> Real-Time Item Master &amp; Warehouse Stock
                    </span>
                    <button
                      onClick={() => onNavigate('itemDetail', { code: activeItemData.code })}
                      className="text-[10px] text-[#0F8B8D] font-bold hover:underline flex items-center gap-1"
                    >
                      View Item Master <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Item Code:</span>
                      <b className="text-slate-800">{activeItemData.code}</b>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Current On-Hand:</span>
                      <b className="text-slate-800">{activeItemData.stock}</b>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Warehouse:</span>
                      <b className="text-slate-800">{activeItemData.wh}</b>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Base UOM:</span>
                      <b className="text-slate-800">{activeItemData.baseUOM}</b>
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-Stage Approvals Pipeline Tracker */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" /> Stage Approval Pipeline (IATF 16949)
                  </h4>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {activeEcr.approvals.filter((a) => a.status === 'Approved').length} of {activeEcr.approvals.length} Stages Approved
                  </span>
                </div>

                <div className="space-y-2">
                  {activeEcr.approvals.map((stage, idx) => {
                    const isPending = stage.status === 'Pending';
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                          stage.status === 'Approved'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : stage.status === 'Rejected'
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-amber-50/50 border-amber-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#14213D]">{stage.stage}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                              stage.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : stage.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {stage.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-600">
                            Approver: <strong>{stage.approver}</strong> ({stage.role}) &bull; {stage.timestamp || 'Pending'}
                          </div>
                          {stage.comments && (
                            <div className="text-[10px] text-gray-500 italic">
                              "{stage.comments}"
                            </div>
                          )}
                        </div>

                        {isPending && activeEcr.status !== 'Rejected' && (
                          <button
                            onClick={() => {
                              setStageToApprove({ ecrId: activeEcr.id, stageIndex: idx });
                              setIsApproveStageModalOpen(true);
                            }}
                            className="btn btn-sm btn-primary text-xs shrink-0 self-start sm:self-center"
                            id={`btn-approve-stage-${idx}`}
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Stage
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Cross-Screen Links */}
              <div className="pt-3 border-t border-[#E4E0D6] flex flex-wrap items-center gap-2">
                {activeEcr.relatedBomId && (
                  <button
                    onClick={() => onNavigate('bomDetail', { id: activeEcr.relatedBomId })}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    <span>Inspect Linked BOM ({activeEcr.relatedBomId})</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate('routingList', { selectedId: activeEcr.relatedItem })}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-2xs"
                >
                  <Cpu className="w-3.5 h-3.5 text-[#E8622C]" />
                  <span>Inspect Process Routing</span>
                </button>
                <button
                  onClick={() => onNavigate('productCosting')}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-2xs"
                >
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>Standard Cost Rollup</span>
                </button>
              </div>
            </div>
          ) : activeTab === 'eco' && activeEco ? (
            <div className="space-y-6" id="eco-inspector-pane">
              {/* ECO Header with Implementation status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E0D6]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0F8B8D]">
                      {activeEco.ecoNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeEco.status === 'Implemented'
                        ? 'bg-blue-100 text-blue-800'
                        : activeEco.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {activeEco.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      Priority: {activeEco.priority}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#14213D] mt-1">
                    {activeEco.itemCode} &mdash; {activeEco.itemName}
                  </h2>
                </div>

                {activeEco.status !== 'Implemented' && (
                  <button
                    onClick={() => handleImplementEco(activeEco.id)}
                    className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-xs"
                    id="btn-implement-eco"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete &amp; Release ECO</span>
                  </button>
                )}
              </div>

              {/* Strategy & Owner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6] text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Change Owner:</span>
                  <strong className="text-[#14213D]">{activeEco.changeOwner}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Effective Strategy:</span>
                  <strong className="text-[#0F8B8D]">{activeEco.effectiveStrategy}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Linked BOM:</span>
                  <strong className="font-mono text-[#14213D]">{activeEco.bomId}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Target Cutover Date:</span>
                  <strong className="text-[#14213D]">{activeEco.targetDate}</strong>
                </div>
              </div>

              {/* Before vs After BOM Lines Comparison */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#0F8B8D]" /> BOM Line Item Revision Diff (Before vs. After)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Before BOM Lines */}
                  <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold uppercase text-rose-800 flex items-center justify-between">
                      <span>Existing / Superseded Material (Before)</span>
                      <span className="font-mono">Rev Old</span>
                    </span>
                    {activeEco.beforeBomLines.map((line, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-rose-100 font-mono text-[11px] space-y-0.5">
                        <div className="font-bold text-rose-900">{line.item}</div>
                        <div className="text-gray-600 font-sans">{line.name}</div>
                        <div className="text-gray-500 text-[10px]">
                          Qty: {line.qty} {line.uom} &bull; Scrap: {line.scrap}% &bull; ₹{line.cost}/unit
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* After BOM Lines */}
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center justify-between">
                      <span>New Qualified Material (After Cutover)</span>
                      <span className="font-mono">Rev Next</span>
                    </span>
                    {activeEco.afterBomLines.map((line, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-emerald-100 font-mono text-[11px] space-y-0.5">
                        <div className="font-bold text-emerald-900">{line.item}</div>
                        <div className="text-gray-600 font-sans">{line.name}</div>
                        <div className="text-gray-500 text-[10px]">
                          Qty: {line.qty} {line.uom} &bull; Scrap: {line.scrap}% &bull; ₹{line.cost}/unit
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Implementation Checklist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-[#0F8B8D]" /> IATF-16949 Implementation Tasks &amp; Signoffs
                  </h4>
                  <span className="font-mono text-xs text-gray-500">
                    {activeEco.checklist.filter((t) => t.completed).length} / {activeEco.checklist.length} Complete
                  </span>
                </div>

                <div className="space-y-1.5">
                  {activeEco.checklist.map((task, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleToggleEcoChecklist(activeEco.id, idx)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        task.completed ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-[#E4E0D6] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}} // handled by parent onClick
                          className="w-4 h-4 accent-[#0F8B8D] rounded cursor-pointer"
                        />
                        <span className={`text-xs ${task.completed ? 'line-through text-gray-500' : 'text-[#14213D] font-medium'}`}>
                          {task.task}
                        </span>
                      </div>

                      {task.completed && (
                        <span className="text-[10px] text-gray-400 font-mono shrink-0">
                          {task.completedBy?.split(' ')[0]} &bull; {task.completedDate}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="pt-3 border-t border-[#E4E0D6] flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onNavigate('bomDetail', { id: activeEco.bomId })}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  <span>Inspect BOM ({activeEco.bomId})</span>
                </button>
                <button
                  onClick={() => onNavigate('productCosting')}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-2xs"
                >
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>Run Standard Cost Rollup</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs space-y-2">
              <HelpCircle className="w-8 h-8 text-gray-300 mx-auto" />
              <p>Select a change record on the left to inspect technical scope, BOM impacts &amp; approval workflows.</p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
         MODAL 1: CREATE NEW ECR - ALL INPUTS ENABLED AND FUNCTIONAL
      ========================================================================= */}
      {isCreateEcrOpen && (
        <CreateEcrModal
          isOpen={isCreateEcrOpen}
          onClose={() => setIsCreateEcrOpen(false)}
          items={items}
          boms={boms}
          existingEcrs={ecrs}
          onCreate={(newEcr) => {
            onUpdateEcrs([newEcr, ...ecrs]);
            setSelectedEcrId(newEcr.id);
            setActiveTab('ecr');
            showToast(`Created ${newEcr.ecrNumber} and initiated engineering approval pipeline.`);
            setIsCreateEcrOpen(false);
          }}
        />
      )}

      {/* =========================================================================
         MODAL 2: CONVERT APPROVED ECR TO ECO
      ========================================================================= */}
      {isConvertModalOpen && ecrToConvert && (
        <ConvertEcrToEcoModal
          isOpen={isConvertModalOpen}
          onClose={() => {
            setIsConvertModalOpen(false);
            setEcrToConvert(null);
          }}
          ecr={ecrToConvert}
          items={items}
          boms={boms}
          existingEcos={ecos}
          onConvert={(newEco) => {
            // Add new ECO
            onUpdateEcos([newEco, ...ecos]);
            // Update ECR status to 'Converted to ECO'
            const updatedEcrs = ecrs.map((e) =>
              e.id === ecrToConvert.id ? { ...e, status: 'Converted to ECO' as const } : e
            );
            onUpdateEcrs(updatedEcrs);
            setSelectedEcoId(newEco.id);
            setActiveTab('eco');
            showToast(`ECR ${ecrToConvert.ecrNumber} converted to ECO ${newEco.ecoNumber}. Implementation initiated.`);
            setIsConvertModalOpen(false);
            setEcrToConvert(null);
          }}
        />
      )}

      {/* =========================================================================
         MODAL 3: APPROVE STAGE MODAL
      ========================================================================= */}
      {isApproveStageModalOpen && stageToApprove && activeEcr && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E4E0D6] shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Signoff Stage Approval
              </h3>
              <button
                onClick={() => setIsApproveStageModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-gray-600">
                You are endorsing <strong>{activeEcr.approvals[stageToApprove.stageIndex]?.stage}</strong> for{' '}
                <span className="font-mono font-bold text-[#E8622C]">{activeEcr.ecrNumber}</span>.
              </p>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Approver Review Comments</label>
                <textarea
                  rows={3}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="w-full p-2 border border-[#E4E0D6] rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E0D6]">
              <button
                onClick={() => setIsApproveStageModalOpen(false)}
                className="btn btn-sm btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproveStage}
                className="btn btn-sm btn-primary text-xs flex items-center gap-1"
                id="btn-confirm-approve-stage"
              >
                <Check className="w-3.5 h-3.5" /> Confirm &amp; Sign Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT: CREATE ECR MODAL (ALL INPUTS ENABLED)
========================================================================= */
interface CreateEcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItemMaster[];
  boms: BomMaster[];
  existingEcrs: EngineeringChangeRequest[];
  onCreate: (newEcr: EngineeringChangeRequest) => void;
}

const CreateEcrModal: React.FC<CreateEcrModalProps> = ({
  isOpen,
  onClose,
  items,
  boms,
  existingEcrs,
  onCreate,
}) => {
  if (!isOpen) return null;

  // Auto-generate sequential ECR ID
  const nextNum = (existingEcrs.length + 1).toString().padStart(3, '0');
  const [ecrNumber, setEcrNumber] = useState<string>(`ECR-2026-${nextNum}`);
  const [requestDate, setRequestDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [requestedBy, setRequestedBy] = useState<string>('Vikram Singh (Senior Process Engineer)');
  const [department, setDepartment] = useState<string>('Product Engineering');

  // Related Item selection
  const [selectedItemCode, setSelectedItemCode] = useState<string>(items[0]?.code || 'FG-CTN-500');

  // Change Type
  const [changeType, setChangeType] = useState<EngineeringChangeRequest['changeType']>('Material Change');
  const [priority, setPriority] = useState<EngineeringChangeRequest['priority']>('High');
  const [riskLevel, setRiskLevel] = useState<EngineeringChangeRequest['riskLevel']>('Medium');

  // Target Date (+30 days default)
  const defaultTargetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }, []);
  const [targetDate, setTargetDate] = useState<string>(defaultTargetDate);

  // Technical Specs & Justifications
  const [description, setDescription] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [expectedImpact, setExpectedImpact] = useState<string>('');

  // Financial & Stock Impact
  const [estimatedCostImpact, setEstimatedCostImpact] = useState<number>(-25000);
  const [stockImpactKg, setStockImpactKg] = useState<number>(300);

  // Active selected item details
  const currentItem = useMemo(() => {
    return items.find((i) => i.code === selectedItemCode) || items[0] || null;
  }, [items, selectedItemCode]);

  // Linked BOMs for selected item
  const linkedBoms = useMemo(() => {
    const itemNameLower = currentItem?.name?.toLowerCase();
    return boms.filter(
      (b) =>
        b.parent === selectedItemCode ||
        (itemNameLower && b.parentName && b.parentName.toLowerCase().includes(itemNameLower))
    );
  }, [boms, selectedItemCode, currentItem]);

  const [selectedBomId, setSelectedBomId] = useState<string>(linkedBoms[0]?.id || 'BOM-1001');

  // Update selectedBomId when item changes
  useEffect(() => {
    if (linkedBoms.length > 0) {
      setSelectedBomId(linkedBoms[0].id);
    }
  }, [linkedBoms]);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !reason.trim()) {
      alert('Please provide a change description and technical reason.');
      return;
    }

    const newEcr: EngineeringChangeRequest = {
      id: `ECR-${Date.now().toString().slice(-4)}`,
      ecrNumber: ecrNumber.trim() || `ECR-2026-${Date.now().toString().slice(-3)}`,
      requestDate,
      requestedBy,
      department,
      relatedItem: selectedItemCode,
      relatedItemName: currentItem ? currentItem.name : selectedItemCode,
      relatedBomId: selectedBomId,
      changeType,
      priority,
      riskLevel,
      targetDate,
      description: description.trim(),
      reason: reason.trim(),
      expectedImpact: expectedImpact.trim() || 'Scrap reduction and enhanced mold cycle stability.',
      status: 'Submitted',
      affectedBoms: selectedBomId ? [selectedBomId] : [],
      affectedWorkOrders: [],
      stockImpactKg: Number(stockImpactKg) || 0,
      estimatedCostImpact: Number(estimatedCostImpact) || 0,
      approvals: [
        {
          stage: 'Engineering Review',
          approver: requestedBy.split(' ')[0] || 'Vikram Singh',
          role: 'Lead Engineer',
          status: 'Pending',
          timestamp: '',
        },
        {
          stage: 'Quality Assurance Review',
          approver: 'Ananya Sen',
          role: 'QA Lead',
          status: 'Pending',
          timestamp: '',
        },
        {
          stage: 'Finance & Costing Review',
          approver: 'Neha Deshmukh',
          role: 'Cost Accountant',
          status: 'Pending',
          timestamp: '',
        },
      ],
    };

    onCreate(newEcr);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E4E0D6] shadow-2xl w-full max-w-3xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E4E0D6] bg-[#FAF9F5] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#E8622C] font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                IATF 16949 Engineering Governance
              </span>
            </div>
            <h2 className="text-base font-bold text-[#14213D] mt-0.5 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#E8622C]" /> Initiate New Engineering Change Request (ECR)
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Section 1: Identification & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">ECR Tracking Number *</label>
              <input
                type="text"
                value={ecrNumber}
                onChange={(e) => setEcrNumber(e.target.value)}
                required
                className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono font-bold text-[#E8622C] bg-[#FAF9F5]"
                id="input-new-ecr-number"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Request Date</label>
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Target Implementation Date *</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
                className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Section 2: Requester Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Requested By (Engineer Name) *</label>
              <input
                type="text"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                required
                className="w-full p-2 border border-[#E4E0D6] rounded-lg text-gray-800"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg text-gray-800"
              >
                <option value="Product Engineering">Product Engineering</option>
                <option value="Tooling & Mold Shop">Tooling &amp; Mold Shop</option>
                <option value="Quality Assurance">Quality Assurance (QA/QC)</option>
                <option value="Production & Manufacturing">Production &amp; Manufacturing</option>
                <option value="Sourcing & Procurement">Sourcing &amp; Procurement</option>
              </select>
            </div>
          </div>

          {/* Section 3: Real Item Master Selection & Live Usage Data */}
          <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6] space-y-3">
            <div className="font-bold text-[11px] uppercase tracking-wider text-[#0F8B8D] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Target Item Master &amp; BOM Association
              </span>
              <span className="font-mono text-gray-500">Live Item Master Query</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Select Manufactured Item / Sub-Assembly *</label>
                <select
                  value={selectedItemCode}
                  onChange={(e) => setSelectedItemCode(e.target.value)}
                  className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono font-bold text-[#14213D]"
                  id="select-ecr-item"
                >
                  {items.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} &mdash; {item.name} ({item.cat})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Associated Bill of Materials (BOM) *</label>
                <select
                  value={selectedBomId}
                  onChange={(e) => setSelectedBomId(e.target.value)}
                  className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono text-[#0F8B8D]"
                  id="select-ecr-bom"
                >
                  {linkedBoms.length > 0 ? (
                    linkedBoms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} &mdash; {b.version} ({b.status})
                      </option>
                    ))
                  ) : (
                    <option value="">No directly linked BOM &mdash; Select generic</option>
                  )}
                  {boms.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} &mdash; {b.parentName} ({b.version})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Real-time Item Usage telemetry */}
            {currentItem && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E4E0D6] text-[11px] font-mono">
                <div>
                  <span className="text-gray-400 block text-[10px]">On-Hand Inventory:</span>
                  <b className="text-[#14213D]">{currentItem.stock}</b>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Primary Warehouse:</span>
                  <b className="text-[#14213D]">{currentItem.wh}</b>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Polymer Family:</span>
                  <b className="text-emerald-800">{currentItem.resinType || currentItem.cat}</b>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Quality Status:</span>
                  <b className="text-teal-700">{currentItem.qc ? 'QC Release Req' : 'Standard'}</b>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Classification, Priority & Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Change Type</label>
              <select
                value={changeType}
                onChange={(e) => setChangeType(e.target.value as any)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg"
              >
                <option value="Material Change">Material Change (Polymer / Masterbatch)</option>
                <option value="Cost Reduction">Cost Reduction (Regrind / Lightweighting)</option>
                <option value="Quality Improvement">Quality Improvement (Shrinkage / Flash)</option>
                <option value="Process Improvement">Process Improvement (Cycle Time / Cooling)</option>
                <option value="Supplier Change">Supplier Change (Raw Material Alternate)</option>
                <option value="Packaging Change">Packaging Change</option>
                <option value="Customer Request">Customer Specification Change</option>
                <option value="Regulatory Compliance">Regulatory Compliance (FDA / RoHS)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical (Line Stop / Defect)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Risk Assessment</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as any)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg"
              >
                <option value="Low">Low (Minor cosmetic / alternate packaging)</option>
                <option value="Medium">Medium (Material substitute with equivalent MFI)</option>
                <option value="High">High (Structural tooling / Resin chemistry change)</option>
              </select>
            </div>
          </div>

          {/* Section 5: Change Description & Scope */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Change Summary / Description *</label>
            <input
              type="text"
              placeholder="e.g. Switch masterbatch supplier to Clariant Polymer to eliminate yellowing under UV exposure."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full p-2 border border-[#E4E0D6] rounded-lg text-gray-800 font-semibold"
              id="input-ecr-description"
            />
          </div>

          {/* Section 6: Technical Justification & Operational Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Root Cause &amp; Technical Justification *</label>
              <textarea
                rows={3}
                placeholder="Explain engineering findings, customer defect reports, cycle time bottlenecks, or test lab results..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full p-2 border border-[#E4E0D6] rounded-lg"
                id="input-ecr-reason"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Expected Operational Impact</label>
              <textarea
                rows={3}
                placeholder="Expected cycle time delta, scrap reduction, warranty claim reduction, or weight tolerance gain..."
                value={expectedImpact}
                onChange={(e) => setExpectedImpact(e.target.value)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg"
              />
            </div>
          </div>

          {/* Section 7: Financial Impact & Stock Quarantine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200">
            <div>
              <label className="block text-amber-900 font-bold mb-1">
                Estimated Annual Cost Impact (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-mono text-amber-700 font-bold">₹</span>
                <input
                  type="number"
                  value={estimatedCostImpact}
                  onChange={(e) => setEstimatedCostImpact(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 border border-amber-300 rounded-lg font-mono font-bold bg-white"
                />
              </div>
              <span className="text-[10px] text-amber-700 block mt-0.5">
                Negative values (-₹45,000) signify annual cost savings; positive signifies added tooling/material.
              </span>
            </div>

            <div>
              <label className="block text-amber-900 font-bold mb-1">
                Inventory Stock Subject to Quarantine / Phase-out (KG)
              </label>
              <input
                type="number"
                value={stockImpactKg}
                onChange={(e) => setStockImpactKg(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-amber-300 rounded-lg font-mono font-bold bg-white"
              />
              <span className="text-[10px] text-amber-700 block mt-0.5">
                Raw resin or finished goods stock in warehouse subject to run-out or quality re-inspection.
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-xs"
              id="btn-submit-new-ecr"
            >
              <Check className="w-3.5 h-3.5" /> Submit ECR for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT: CONVERT ECR TO ECO MODAL
========================================================================= */
interface ConvertEcrToEcoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ecr: EngineeringChangeRequest;
  items: ItemMaster[];
  boms: BomMaster[];
  existingEcos: EngineeringChangeOrder[];
  onConvert: (newEco: EngineeringChangeOrder) => void;
}

const ConvertEcrToEcoModal: React.FC<ConvertEcrToEcoModalProps> = ({
  isOpen,
  onClose,
  ecr,
  items,
  boms,
  existingEcos,
  onConvert,
}) => {
  if (!isOpen) return null;

  const nextNum = (existingEcos.length + 85).toString().padStart(3, '0');
  const [ecoNumber, setEcoNumber] = useState<string>(`ECO-2026-${nextNum}`);
  const [changeOwner, setChangeOwner] = useState<string>(ecr.requestedBy || 'Vikram Singh');
  const [targetDate, setTargetDate] = useState<string>(ecr.targetDate);
  const [priority, setPriority] = useState<EngineeringChangeOrder['priority']>('High');
  const [effectiveStrategy, setEffectiveStrategy] = useState<EngineeringChangeOrder['effectiveStrategy']>('Use Up Existing Stock');

  const linkedBom = useMemo(() => {
    return boms.find((b) => b.id === ecr.relatedBomId) || boms[0] || null;
  }, [boms, ecr]);

  const [beforeItem, setBeforeItem] = useState<string>(linkedBom?.lines[0]?.item || 'RM-PP-NAT-001');
  const [beforeQty, setBeforeQty] = useState<number>(linkedBom?.lines[0]?.qty || 0.045);
  const [afterItem, setAfterItem] = useState<string>(items[1]?.code || 'MB-WHT-009');
  const [afterQty, setAfterQty] = useState<number>(0.045);

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();

    const beforeItemObj = items.find((i) => i.code === beforeItem);
    const afterItemObj = items.find((i) => i.code === afterItem);

    const newEco: EngineeringChangeOrder = {
      id: `ECO-${Date.now().toString().slice(-4)}`,
      ecoNumber: ecoNumber.trim(),
      linkedEcrId: ecr.id,
      itemCode: ecr.relatedItem,
      itemName: ecr.relatedItemName,
      bomId: ecr.relatedBomId || linkedBom?.id || 'BOM-1001',
      changeOwner,
      priority,
      targetDate,
      status: 'In Progress',
      effectiveStrategy,
      specificBatchDate: new Date().toISOString().slice(0, 10),
      beforeBomLines: [
        {
          item: beforeItem,
          name: beforeItemObj?.name || 'Existing Standard Component',
          qty: Number(beforeQty) || 0.045,
          uom: beforeItemObj?.baseUOM || 'KG',
          scrap: 1.0,
          cost: 3.5,
        },
      ],
      afterBomLines: [
        {
          item: afterItem,
          name: afterItemObj?.name || 'New Specified Component',
          qty: Number(afterQty) || 0.045,
          uom: afterItemObj?.baseUOM || 'KG',
          scrap: 0.5,
          cost: 3.65,
        },
      ],
      checklist: [
        {
          task: `BOM revision bumped in system for ${ecr.relatedBomId}`,
          completed: false,
        },
        {
          task: `Item Master created / verified for ${afterItem}`,
          completed: false,
        },
        {
          task: 'Machine and tooling mold insert qualification passed',
          completed: false,
        },
        {
          task: 'Technical Data Sheet (TDS) and MSDS uploaded to QA portal',
          completed: false,
        },
        {
          task: 'Standard cost rollup executed and updated in General Ledger',
          completed: false,
        },
        {
          task: 'Production supervisor and shop floor work order routing notified',
          completed: false,
        },
        {
          task: 'Warehouse quarantine check completed for superseded material',
          completed: false,
        },
      ],
      approvals: [
        {
          stage: 'Engineering Release',
          approver: changeOwner,
          role: 'Lead Engineer',
          status: 'Approved',
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        },
        {
          stage: 'Plant Operations Cutover Signoff',
          approver: 'Priya Rao',
          role: 'Plant Director',
          status: 'Approved',
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        },
      ],
    };

    onConvert(newEco);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E4E0D6] shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
        <div className="p-4 border-b border-[#E4E0D6] bg-teal-50/50 flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#0F8B8D] font-bold">
              Approved Change Order Generation
            </span>
            <h2 className="text-base font-bold text-[#14213D] mt-0.5 flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-[#0F8B8D]" /> Convert {ecr.ecrNumber} to Engineering Change Order (ECO)
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConvert} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6] space-y-1">
            <div className="font-bold text-gray-700">Approved ECR Scope:</div>
            <div className="text-gray-600 font-medium">{ecr.description}</div>
            <div className="font-mono text-[11px] text-[#0F8B8D]">
              Item: {ecr.relatedItem} &bull; BOM: {ecr.relatedBomId} &bull; Est Impact: ₹{ecr.estimatedCostImpact.toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">ECO Order Number *</label>
              <input
                type="text"
                value={ecoNumber}
                onChange={(e) => setEcoNumber(e.target.value)}
                required
                className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono font-bold text-[#0F8B8D]"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Change Implementation Owner *</label>
              <input
                type="text"
                value={changeOwner}
                onChange={(e) => setChangeOwner(e.target.value)}
                required
                className="w-full p-2 border border-[#E4E0D6] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Effective Implementation Strategy *</label>
              <select
                value={effectiveStrategy}
                onChange={(e) => setEffectiveStrategy(e.target.value as any)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg font-semibold"
              >
                <option value="Use Up Existing Stock">Use Up Existing Stock (Run-out phase)</option>
                <option value="Immediate">Immediate (Quarantine current inventory)</option>
                <option value="From Specific Date">From Specific Cutover Date</option>
                <option value="From Specific Batch">From Specific Production Batch</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Target Cutover Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#E4E0D6]">
            <label className="block text-gray-700 font-bold">BOM Line Substitution (Before vs. After):</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-rose-800">Existing Component (Before)</span>
                <div>
                  <label className="block text-gray-600 text-[10px] mb-0.5">Item Code</label>
                  <select
                    value={beforeItem}
                    onChange={(e) => setBeforeItem(e.target.value)}
                    className="w-full p-1.5 border border-rose-200 rounded font-mono text-xs bg-white"
                  >
                    {items.map((i) => (
                      <option key={i.code} value={i.code}>{i.code} - {i.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-[10px] mb-0.5">Qty / Unit</label>
                  <input
                    type="number"
                    step="0.001"
                    value={beforeQty}
                    onChange={(e) => setBeforeQty(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 border border-rose-200 rounded font-mono text-xs bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-emerald-800">New Component (After Cutover)</span>
                <div>
                  <label className="block text-gray-600 text-[10px] mb-0.5">Item Code</label>
                  <select
                    value={afterItem}
                    onChange={(e) => setAfterItem(e.target.value)}
                    className="w-full p-1.5 border border-emerald-200 rounded font-mono text-xs bg-white"
                  >
                    {items.map((i) => (
                      <option key={i.code} value={i.code}>{i.code} - {i.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-[10px] mb-0.5">Qty / Unit</label>
                  <input
                    type="number"
                    step="0.001"
                    value={afterQty}
                    onChange={(e) => setAfterQty(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 border border-emerald-200 rounded font-mono text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
            <button type="button" onClick={onClose} className="btn btn-sm btn-ghost text-xs">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-xs"
              id="btn-confirm-convert-eco"
            >
              <GitPullRequest className="w-3.5 h-3.5" /> Generate &amp; Release ECO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
