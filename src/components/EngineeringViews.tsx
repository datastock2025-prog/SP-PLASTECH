import React, { useState, useMemo, useEffect } from 'react';
import {
  BomMaster,
  BomLine,
  EngineeringChangeRequest,
  EngineeringChangeOrder,
  RecipeFormula,
  AlternateMaterial,
  RegrindUsageSpec,
  BomRouting,
  MachineMoldRequirement,
  ItemMaster,
  ApprovalStatus,
} from '../types';
import { ManufacturingBomWizardModal } from './engineering/bomWizard/ManufacturingBomWizardModal';
import { MultiLevelBomTreeView } from './engineering/MultiLevelBomTreeView';
import { BomVersionDiffView } from './engineering/BomVersionDiffView';
import { ProcessRoutingOperationsView } from './engineering/ProcessRoutingOperationsView';
import { EngineeringChangeOrderView } from './engineering/EngineeringChangeOrderView';
import { LegacyBomBuilderView } from './engineering/LegacyBomBuilderView';
import {
  INITIAL_BOMS,
  INITIAL_ECRS,
  INITIAL_ECOS,
  INITIAL_RECIPES,
  INITIAL_ALTERNATES,
  INITIAL_REGRIND_SPECS,
  INITIAL_ROUTINGS,
  INITIAL_MACHINE_MOLD_REQS,
  INITIAL_CATEGORY_TREE,
} from '../data/engineeringData';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Printer,
  Copy,
  ArrowLeft,
  FileSpreadsheet,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  RefreshCw,
  GitCompare,
  GitBranch,
  Shield,
  FileText,
  Sliders,
  DollarSign,
  Cpu,
  Boxes,
  HelpCircle,
  Upload,
  Download,
  Filter,
  CheckSquare,
  Square,
  FolderTree,
  Scale,
  Eye,
  AlertCircle,
  BarChart3,
  Calendar,
  Tag,
  FileCheck,
  Maximize2,
  Link2,
  Fingerprint,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  SlidersHorizontal,
  X,
  Activity,
  TrendingUp,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { masterDataGovernanceService } from '../services/masterDataGovernanceService';

interface EngineeringViewsProps {
  view: string;
  items: ItemMaster[];
  boms: BomMaster[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  onUpdateBom: (bom: BomMaster) => void;
  onDeleteBom: (id: string) => void;
  onCreateBom: (bom: BomMaster) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
}

export const EngineeringViews: React.FC<EngineeringViewsProps> = ({
  view,
  items,
  boms,
  selectedId,
  onNavigate,
  onUpdateBom,
  onDeleteBom,
  onCreateBom,
  openDrawer,
  closeDrawer,
  openConfirm,
  showToast,
}) => {
  // Local state for engineering sub-views & controls
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Selected BOM for details/editing/tree
  const activeBom = useMemo(() => {
    return boms.find((b) => b.id === selectedId) || boms[0] || INITIAL_BOMS[0];
  }, [boms, selectedId]);

  // Inline editing state for BOM list and grid
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');
  const [selectedBomIds, setSelectedBomIds] = useState<string[]>([]);

  // Scalable BOM Grid State (Optimized for 10,000+ items/year)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [quickModifyBom, setQuickModifyBom] = useState<BomMaster | null>(null);

  // Tree view expansion state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    'node-1': true,
    'node-2': true,
  });

  // State for ECRs and ECOs
  const [ecrs, setEcrs] = useState<EngineeringChangeRequest[]>(INITIAL_ECRS);
  const [ecos, setEcos] = useState<EngineeringChangeOrder[]>(INITIAL_ECOS);
  const [recipes, setRecipes] = useState<RecipeFormula[]>(INITIAL_RECIPES);
  const [alternates, setAlternates] = useState<AlternateMaterial[]>(INITIAL_ALTERNATES);
  const [regrindSpecs, setRegrindSpecs] = useState<RegrindUsageSpec[]>(INITIAL_REGRIND_SPECS);
  const [routings, setRoutings] = useState<BomRouting[]>(INITIAL_ROUTINGS);
  const [machineReqs, setMachineReqs] = useState<MachineMoldRequirement[]>(INITIAL_MACHINE_MOLD_REQS);

  // 9-Step Manufacturing BOM Wizard State
  const [isMfgBomWizardOpen, setIsMfgBomWizardOpen] = useState<boolean>(false);
  const [wizardParentItem, setWizardParentItem] = useState<ItemMaster | null>(null);

  // Status helper badges
  const renderStatusBadge = (status: ApprovalStatus | string) => {
    const map: Record<string, { cls: string; label: string; bg: string; text: string }> = {
      draft: { cls: 'gray', label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700' },
      under_review: { cls: 'amber', label: 'Under Review', bg: 'bg-amber-100', text: 'text-amber-800' },
      pending: { cls: 'amber', label: 'Pending Approval', bg: 'bg-amber-100', text: 'text-amber-800' },
      approved: { cls: 'teal', label: 'Approved', bg: 'bg-emerald-100', text: 'text-emerald-800' },
      released: { cls: 'green', label: 'Released', bg: 'bg-blue-100', text: 'text-blue-800' },
      obsolete: { cls: 'red', label: 'Obsolete', bg: 'bg-rose-100', text: 'text-rose-800' },
      rejected: { cls: 'red', label: 'Rejected', bg: 'bg-rose-100', text: 'text-rose-800' },
    };
    const res = map[status] || { cls: 'gray', label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${res.bg} ${res.text}`}>
        {res.label}
      </span>
    );
  };

  // Helper for inline cell save
  const handleSaveInlineCell = (bomId: string, field: string) => {
    const targetBom = boms.find((b) => b.id === bomId);
    if (!targetBom) return;

    let updated = { ...targetBom };
    if (field === 'version') updated.version = cellEditValue;
    if (field === 'batchSize') updated.batchSize = parseFloat(cellEditValue) || 1000;
    if (field === 'standardCost') updated.standardCost = parseFloat(cellEditValue) || 0;
    if (field === 'scrapPct') updated.scrapPct = parseFloat(cellEditValue) || 0;
    if (field === 'yieldPct') updated.yieldPct = parseFloat(cellEditValue) || 100;
    if (field === 'status') updated.status = cellEditValue as ApprovalStatus;

    onUpdateBom(updated);
    setEditingCell(null);
    showToast(`Updated ${field} for ${bomId}`);
  };

  // Multi-select bulk approval
  const handleBulkApprove = () => {
    if (selectedBomIds.length === 0) {
      showToast('Select at least one BOM for bulk approval');
      return;
    }
    selectedBomIds.forEach((id) => {
      const b = boms.find((item) => item.id === id);
      if (b) {
        onUpdateBom({
          ...b,
          status: 'approved',
          approvalStage: 'Approved',
          approvals: [
            ...(b.approvals || []),
            {
              stage: 'Bulk Engineering Approval',
              approver: 'Engineering Director',
              role: 'Release Authority',
              status: 'Approved',
              timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
              signature: 'SIG-BULK-APPROVE'
            }
          ]
        });
      }
    });
    showToast(`Bulk approved ${selectedBomIds.length} BOM(s)`);
    setSelectedBomIds([]);
  };

  const handleBulkRelease = () => {
    if (selectedBomIds.length === 0) {
      showToast('Select at least one BOM for bulk release');
      return;
    }
    selectedBomIds.forEach((id) => {
      const b = boms.find((item) => item.id === id);
      if (b) {
        onUpdateBom({
          ...b,
          status: 'released',
          approvalStage: 'Released',
        });
      }
    });
    showToast(`Released ${selectedBomIds.length} BOM(s) to production floor`);
    setSelectedBomIds([]);
  };

  const renderViewContent = () => {
    /* =========================================================================
       1. BOM / ENGINEERING DASHBOARD
    ========================================================================= */
    if (view === 'bomDash' || view === 'engineeringDash') {
    const totalActive = boms.filter((b) => b.status === 'released').length;
    const drafts = boms.filter((b) => b.status === 'draft').length;
    const pendingApproval = boms.filter((b) => b.status === 'pending' || b.status === 'under_review').length;
    const openEcrs = ecrs.filter((e) => e.status !== 'Closed').length;
    const openEcos = ecos.filter((e) => e.status !== 'Closed').length;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Engineering &amp; Product Architecture
            </div>
            <h1 className="text-2xl font-bold text-[#14213D]">BOM &amp; Recipe Engineering Center</h1>
            <p className="text-xs text-[#6B7280]">
              Multi-level plastic formulas, masterbatch dosages, mold parameters, ECR/ECO change control &amp; cost rollups.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setWizardParentItem(null);
                setIsMfgBomWizardOpen(true);
              }}
              className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Create Manufacturing BOM
            </button>
            <button
              onClick={() => onNavigate('ecrList')}
              className="btn btn-sm btn-ghost border-[#E4E0D6] flex items-center gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#E8622C]" /> New ECR
            </button>
          </div>
        </div>

        {/* 13 KPI Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
            <div className="lbl text-[11px] text-[#6B7280]">Total Active BOMs</div>
            <div className="val text-xl font-bold text-[#14213D] mt-1">{totalActive}</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">IATF 16949 Validated</div>
          </div>
          <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
            <div className="lbl text-[11px] text-[#6B7280]">Draft / In-Design</div>
            <div className="val text-xl font-bold text-[#6B7280] mt-1">{drafts}</div>
            <div className="text-[10px] text-[#9CA3AF] mt-0.5">Work In Progress</div>
          </div>
          <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
            <div className="lbl text-[11px] text-[#6B7280]">Pending Approval</div>
            <div className="val text-xl font-bold text-amber-600 mt-1">{pendingApproval}</div>
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">QA &amp; Cost Signoff</div>
          </div>
          <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
            <div className="lbl text-[11px] text-[#6B7280]">Open ECR Requests</div>
            <div className="val text-xl font-bold text-[#E8622C] mt-1">{openEcrs}</div>
            <div className="text-[10px] text-[#E8622C] font-medium mt-0.5">Engineering Changes</div>
          </div>
          <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
            <div className="lbl text-[11px] text-[#6B7280]">Open ECO Orders</div>
            <div className="val text-xl font-bold text-purple-600 mt-1">{openEcos}</div>
            <div className="text-[10px] text-purple-600 font-medium mt-0.5">Floor Implementation</div>
          </div>
          <div className="kpi-card bg-white p-3 rounded-lg border border-[#E4E0D6] shadow-xs">
            <div className="lbl text-[11px] text-[#6B7280]">Avg BOM Cost Variance</div>
            <div className="val text-xl font-bold text-emerald-600 mt-1">-1.8%</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Regrind Offset Benefit</div>
          </div>
        </div>

        {/* Process Breakdown & Pending Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Plastic Process Breakdown */}
          <div className="panel bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
              <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#0F8B8D]" /> Process Architecture Distribution
              </h3>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { name: 'Injection Molding (IMM)', count: 18, pct: 65, color: 'bg-[#0F8B8D]' },
                { name: 'Blow Molding (Bottles)', count: 5, pct: 18, color: 'bg-[#E8622C]' },
                { name: 'Extrusion & Profiles', count: 3, pct: 10, color: 'bg-amber-500' },
                { name: 'Compounding & Blending', count: 2, pct: 7, color: 'bg-purple-500' },
              ].map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-[#374151]">
                    <span>{p.name}</span>
                    <span className="font-mono text-[#6B7280]">{p.count} BOMs ({p.pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[#E4E0D6] flex justify-between text-xs text-[#6B7280]">
              <span>Standard Batch Size: 1,000 PCS</span>
              <span className="text-[#0F8B8D] font-semibold">100% Formulas Balanced</span>
            </div>
          </div>

          {/* Pending Engineering Approvals */}
          <div className="panel bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
              <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#E8622C]" /> Pending Engineering Approvals &amp; Stage Gates
              </h3>
              <button
                onClick={() => onNavigate('approvalWorkflow')}
                className="text-xs text-[#0F8B8D] font-semibold hover:underline"
              >
                View Workflow Hub &rarr;
              </button>
            </div>
            <div className="divide-y divide-[#F3F4F6] mt-2">
              {boms.slice(0, 3).map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#14213D]">{b.id}</span>
                      <span className="font-semibold text-xs text-[#374151] truncate">{b.parentName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#F6F4EF] rounded font-mono text-[#6B7280]">{b.version}</span>
                    </div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-3">
                      <span>Owner: {b.owner || 'Vikram Singh'}</span>
                      <span>&bull;</span>
                      <span>Process: {b.processType || 'Injection Molding'}</span>
                      <span>&bull;</span>
                      <span>Stage: <b className="text-amber-700">{b.approvalStage || 'Engineering Review'}</b></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onNavigate('bomDetail', { id: b.id })}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-[#F6F4EF] hover:bg-[#E5E7EB] text-[#14213D] transition-colors"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => {
                        onUpdateBom({ ...b, status: 'approved', approvalStage: 'Approved' });
                        showToast(`Approved ${b.id}`);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Engineering Jump Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigate('bomTree')}
            className="p-3 bg-white border border-[#E4E0D6] rounded-xl hover:border-[#0F8B8D] transition-all cursor-pointer shadow-xs group"
          >
            <FolderTree className="w-5 h-5 text-[#0F8B8D] mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-[#14213D]">Multi-Level BOM Tree</div>
            <div className="text-[11px] text-[#6B7280]">Visual component hierarchies &amp; sprue rollups</div>
          </div>
          <div
            onClick={() => onNavigate('recipeFormula')}
            className="p-3 bg-white border border-[#E4E0D6] rounded-xl hover:border-[#0F8B8D] transition-all cursor-pointer shadow-xs group"
          >
            <Scale className="w-5 h-5 text-[#E8622C] mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-[#14213D]">Formula &amp; Recipe Scaler</div>
            <div className="text-[11px] text-[#6B7280]">Percentage compounding &amp; resin balancer</div>
          </div>
          <div
            onClick={() => onNavigate('bomCompare')}
            className="p-3 bg-white border border-[#E4E0D6] rounded-xl hover:border-[#0F8B8D] transition-all cursor-pointer shadow-xs group"
          >
            <GitCompare className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-[#14213D]">BOM Version Comparison</div>
            <div className="text-[11px] text-[#6B7280]">Side-by-side diff between revisions</div>
          </div>
          <div
            onClick={() => onNavigate('whereUsed')}
            className="p-3 bg-white border border-[#E4E0D6] rounded-xl hover:border-[#0F8B8D] transition-all cursor-pointer shadow-xs group"
          >
            <Search className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-[#14213D]">Where-Used Analysis</div>
            <div className="text-[11px] text-[#6B7280]">Impact analysis &amp; mass replacements</div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     2. ADVANCED BOM LIST WITH HIGH-PERFORMANCE PAGINATION & QUICK MODIFY MODAL
     (Engineered for 10,000+ BOM Records/Year & Ultra-Aesthetic UX)
  ========================================================================= */
  if (view === 'bomList') {
    // KPI Stats computation
    const totalBomCount = boms.length;
    const releasedBomCount = boms.filter((b) => b.status === 'released').length;
    const underReviewBomCount = boms.filter((b) => b.status === 'under_review' || b.status === 'pending').length;
    const draftBomCount = boms.filter((b) => b.status === 'draft').length;
    const avgYieldPct = totalBomCount > 0 ? (boms.reduce((acc, b) => acc + (b.yieldPct || 98.5), 0) / totalBomCount).toFixed(1) : '98.5';
    const avgScrapPct = totalBomCount > 0 ? (boms.reduce((acc, b) => acc + (b.scrapPct || 1.5), 0) / totalBomCount).toFixed(1) : '1.5';

    // Filtering
    const filteredBoms = boms.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.parent.toLowerCase().includes(q) ||
        b.parentName.toLowerCase().includes(q) ||
        (b.processType && b.processType.toLowerCase().includes(q)) ||
        (b.notes && b.notes.toLowerCase().includes(q));
      if (!matchSearch) return false;

      if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;

      if (selectedYear !== 'all') {
        const itemYear = b.effectiveDate ? b.effectiveDate.substring(0, 4) : '2026';
        if (itemYear !== selectedYear) return false;
      }

      return true;
    });

    // Sorting
    const sortedBoms = [...filteredBoms].sort((a, b) => {
      let aVal: any = a[sortField as keyof BomMaster] ?? '';
      let bVal: any = b[sortField as keyof BomMaster] ?? '';

      if (sortField === 'standardCost') {
        aVal = a.standardCost || a.lines.reduce((s, l) => s + (l.cost || 0), 0);
        bVal = b.standardCost || b.lines.reduce((s, l) => s + (l.cost || 0), 0);
      }

      if (typeof aVal === 'string') {
        const comp = aVal.localeCompare(String(bVal));
        return sortDirection === 'asc' ? comp : -comp;
      }
      if (typeof aVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedBoms.length / pageSize));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const paginatedBoms = sortedBoms.slice(startIndex, startIndex + pageSize);

    const isAllPageSelected =
      paginatedBoms.length > 0 && paginatedBoms.every((b) => selectedBomIds.includes(b.id));

    const handleSort = (field: string) => {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
      setCurrentPage(1);
    };

    const handleJumpToPage = (e: React.FormEvent) => {
      e.preventDefault();
      const p = parseInt(jumpPageInput, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        setCurrentPage(p);
        setJumpPageInput('');
      } else {
        showToast(`Please enter a valid page between 1 and ${totalPages}`);
      }
    };

    return (
      <div className="space-y-5 max-w-[1600px] mx-auto pb-8">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5" /> Engineering Master Data &bull; Enterprise Scale (10,000+ Items/Yr)
            </div>
            <h1 className="text-xl font-bold text-[#14213D] flex items-center gap-2">
              Bill of Materials / Engineering BOMs
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200">
                {boms.length} Active Records
              </span>
            </h1>
            <p className="text-xs text-[#6B7280]">
              High-throughput recipe engine with instant search, multi-field sorting, and quick inline/modal editing.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setWizardParentItem(null);
                setIsMfgBomWizardOpen(true);
              }}
              className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Create Manufacturing BOM
            </button>
            <button
              onClick={() => onNavigate('bomBuilder')}
              className="btn btn-sm btn-ghost border-[#E4E0D6] flex items-center gap-1.5 hover:bg-orange-50/50 text-[#14213D]"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#E8622C]" /> Legacy Builder
            </button>
            <button
              onClick={() => onNavigate('bomImport')}
              className="btn btn-sm btn-ghost border-[#E4E0D6] flex items-center gap-1.5 hover:bg-teal-50/50 text-[#14213D]"
            >
              <Upload className="w-3.5 h-3.5 text-[#0F8B8D]" /> Import / Export
            </button>
          </div>
        </div>

        {/* Scalability KPI Cards Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total BOMs</div>
              <div className="text-lg font-bold text-[#14213D] font-mono leading-none mt-0.5">{totalBomCount}</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Ready for 10k+/yr</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Released / Live</div>
              <div className="text-lg font-bold text-emerald-700 font-mono leading-none mt-0.5">{releasedBomCount}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {totalBomCount > 0 ? `${Math.round((releasedBomCount / totalBomCount) * 100)}% of total` : '0%'}
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Under Review</div>
              <div className="text-lg font-bold text-amber-700 font-mono leading-none mt-0.5">{underReviewBomCount}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{draftBomCount} Drafts</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0F8B8D] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Avg Production Yield</div>
              <div className="text-lg font-bold text-[#0F8B8D] font-mono leading-none mt-0.5">{avgYieldPct}%</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Optimal Standard</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Target Scrap Rate</div>
              <div className="text-lg font-bold text-rose-700 font-mono leading-none mt-0.5">{avgScrapPct}%</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Tolerance &le; 2.5%</div>
            </div>
          </div>
        </div>

        {/* Filter Bar & Fast Query Ribbon */}
        <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-1 max-w-lg bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg px-3 py-1.5 text-xs focus-within:border-[#0F8B8D] focus-within:bg-white transition-all">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Instant search by BOM ID, parent item name, code, process..."
              className="w-full bg-transparent border-none outline-none text-xs text-[#14213D]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-700 p-0.5"
                title="Clear Search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-[#F6F4EF] p-1 rounded-lg border border-[#E4E0D6]">
              {['all', 'draft', 'under_review', 'approved', 'released', 'obsolete'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setSelectedStatus(st);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 text-[11px] font-semibold rounded capitalize transition-all ${
                    selectedStatus === st
                      ? 'bg-[#14213D] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#14213D] hover:bg-white/60'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5 px-2.5 border border-[#E4E0D6] rounded-lg bg-[#F6F4EF] font-semibold text-gray-700 hover:bg-white"
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedBomIds.length > 0 && (
          <div className="p-2.5 bg-[#14213D] text-white rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150 shadow-md">
            <div className="flex items-center gap-2 font-semibold">
              <CheckSquare className="w-4 h-4 text-[#E8622C]" />
              <span>{selectedBomIds.length} BOM(s) selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-bold transition-colors"
              >
                Bulk Approve
              </button>
              <button
                onClick={handleBulkRelease}
                className="px-3 py-1 bg-[#0F8B8D] hover:bg-[#0c7274] rounded text-xs font-bold transition-colors"
              >
                Bulk Release to Shop Floor
              </button>
              <button
                onClick={() => {
                  showToast(`Exported ${selectedBomIds.length} BOMs to CSV`);
                  setSelectedBomIds([]);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-semibold transition-colors"
              >
                Export Selected
              </button>
              <button
                onClick={() => setSelectedBomIds([])}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Advanced High-Density Scalable Table (Scrollbar-Free Clean Container) */}
        <div className="panel bg-white rounded-xl border border-[#E4E0D6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] font-bold text-[11px] uppercase tracking-wider select-none">
                  <th className="p-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const pageIds = paginatedBoms.map((b) => b.id);
                          setSelectedBomIds(Array.from(new Set([...selectedBomIds, ...pageIds])));
                        } else {
                          const pageIds = new Set(paginatedBoms.map((b) => b.id));
                          setSelectedBomIds(selectedBomIds.filter((id) => !pageIds.has(id)));
                        }
                      }}
                      className="rounded text-[#0F8B8D]"
                    />
                  </th>
                  <th className="p-3 cursor-pointer hover:bg-amber-50/50" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">
                      BOM ID
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:bg-amber-50/50" onClick={() => handleSort('parentName')}>
                    <div className="flex items-center gap-1">
                      Parent Item &amp; Description
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:bg-amber-50/50" onClick={() => handleSort('version')}>
                    <div className="flex items-center gap-1">
                      Version
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:bg-amber-50/50" onClick={() => handleSort('processType')}>
                    <div className="flex items-center gap-1">
                      Process
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="p-3 text-right cursor-pointer hover:bg-amber-50/50" onClick={() => handleSort('batchSize')}>
                    <div className="flex items-center justify-end gap-1">
                      Batch Size
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="p-3 text-right cursor-pointer hover:bg-amber-50/50" onClick={() => handleSort('yieldPct')}>
                    <div className="flex items-center justify-end gap-1">
                      Yield %
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="p-3 text-right cursor-pointer hover:bg-amber-50/50" onClick={() => handleSort('scrapPct')}>
                    <div className="flex items-center justify-end gap-1">
                      Scrap %
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="p-3 text-right cursor-pointer hover:bg-amber-50/50" onClick={() => handleSort('standardCost')}>
                    <div className="flex items-center justify-end gap-1">
                      Std Unit Cost (₹)
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="p-3 text-center cursor-pointer hover:bg-amber-50/50" onClick={() => handleSort('status')}>
                    <div className="flex items-center justify-center gap-1">
                      Approval Status
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="p-3 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {paginatedBoms.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-gray-500 bg-[#F9F8F5]">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Boxes className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="font-bold text-sm text-[#14213D]">No BOM master records found</p>
                        <p className="text-xs text-gray-400">Try adjusting your search query or status filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBoms.map((bom) => {
                    const isSelected = selectedBomIds.includes(bom.id);
                    const totalCost = bom.standardCost || bom.lines.reduce((s, l) => s + (l.cost || 0), 0);

                    return (
                      <tr
                        key={bom.id}
                        className={`hover:bg-amber-50/30 transition-colors cursor-pointer group ${
                          isSelected ? 'bg-teal-50/40' : ''
                        }`}
                        onClick={() => setQuickModifyBom(bom)}
                        title="Click to Quick Modify BOM Recipe"
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBomIds([...selectedBomIds, bom.id]);
                              } else {
                                setSelectedBomIds(selectedBomIds.filter((id) => id !== bom.id));
                              }
                            }}
                            className="rounded text-[#0F8B8D]"
                          />
                        </td>

                        <td className="p-3 font-mono font-bold text-[#0F8B8D]">
                          <div className="flex items-center gap-1.5">
                            <span>{bom.id}</span>
                            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-amber-600 transition-opacity" />
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-[#14213D] group-hover:text-[#0F8B8D] transition-colors">
                            {bom.parentName}
                          </div>
                          <div className="text-[11px] text-[#6B7280] font-mono">{bom.parent}</div>
                        </td>

                        {/* Inline Editable Version */}
                        <td
                          className="p-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCell({ id: bom.id, field: 'version' });
                            setCellEditValue(bom.version);
                          }}
                        >
                          {editingCell?.id === bom.id && editingCell.field === 'version' ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={cellEditValue}
                                onChange={(e) => setCellEditValue(e.target.value)}
                                className="w-16 px-1.5 py-0.5 text-xs border border-[#0F8B8D] rounded bg-white font-mono"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveInlineCell(bom.id, 'version')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono px-2 py-0.5 bg-[#F6F4EF] rounded border border-[#E4E0D6] text-[11px] hover:border-[#0F8B8D] transition-colors" title="Click to edit version">
                              {bom.version}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-[#374151] font-medium">
                          {bom.processType || 'Injection Molding'}
                        </td>

                        {/* Inline Editable Batch Size */}
                        <td
                          className="p-3 text-right font-mono text-[#374151]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCell({ id: bom.id, field: 'batchSize' });
                            setCellEditValue(String(bom.batchSize || 1000));
                          }}
                        >
                          {editingCell?.id === bom.id && editingCell.field === 'batchSize' ? (
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                value={cellEditValue}
                                onChange={(e) => setCellEditValue(e.target.value)}
                                className="w-20 px-1.5 py-0.5 text-xs border border-[#0F8B8D] rounded bg-white font-mono text-right"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveInlineCell(bom.id, 'batchSize')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="hover:underline" title="Click to edit batch size">
                              {(bom.batchSize || 1000).toLocaleString()} {bom.baseUOM || 'PCS'}
                            </span>
                          )}
                        </td>

                        {/* Yield % */}
                        <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                          {bom.yieldPct || 98.5}%
                        </td>

                        {/* Scrap % */}
                        <td className="p-3 text-right font-mono text-rose-600 font-semibold">
                          {bom.scrapPct || 1.5}%
                        </td>

                        {/* Inline Editable Standard Cost */}
                        <td
                          className="p-3 text-right font-mono font-bold text-[#14213D]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCell({ id: bom.id, field: 'standardCost' });
                            setCellEditValue(String(totalCost.toFixed(2)));
                          }}
                        >
                          {editingCell?.id === bom.id && editingCell.field === 'standardCost' ? (
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                step="0.01"
                                value={cellEditValue}
                                onChange={(e) => setCellEditValue(e.target.value)}
                                className="w-20 px-1.5 py-0.5 text-xs border border-[#0F8B8D] rounded bg-white font-mono text-right"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveInlineCell(bom.id, 'standardCost')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="hover:underline" title="Click to edit standard cost">
                              ₹{totalCost.toFixed(2)}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {renderStatusBadge(bom.status)}
                        </td>

                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setQuickModifyBom(bom)}
                              title="Quick Modify Recipe Parameters"
                              className="p-1 text-[#6B7280] hover:text-[#E8622C] hover:bg-orange-50 rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onNavigate('bomTree', { id: bom.id })}
                              title="Multi-Level Tree View"
                              className="p-1 text-[#6B7280] hover:text-[#0F8B8D] hover:bg-[#F6F4EF] rounded"
                            >
                              <FolderTree className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const pItem = items.find((i) => i.code === bom.parent) || (items.length > 0 ? items[0] : null);
                                if (pItem) {
                                  setWizardParentItem(pItem);
                                  setIsMfgBomWizardOpen(true);
                                } else {
                                  showToast('No parent item record found in catalog for this BOM.');
                                }
                              }}
                              title="Open in 9-Step Manufacturing BOM Wizard"
                              className="p-1 text-[#6B7280] hover:text-[#0F8B8D] hover:bg-teal-50 rounded"
                            >
                              <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" />
                            </button>
                            <button
                              onClick={() => {
                                openConfirm(`Delete ${bom.id}?`, `Delete recipe for ${bom.parentName}?`, () => {
                                  onDeleteBom(bom.id);
                                  showToast(`BOM ${bom.id} deleted`);
                                });
                              }}
                              title="Delete BOM"
                              className="p-1 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* High-Performance Scalable Pagination & Footer Bar */}
          <div className="p-3 bg-[#F9F8F5] border-t border-[#E4E0D6] text-xs text-[#6B7280] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span>
                Showing <strong className="text-[#14213D] font-mono">{filteredBoms.length === 0 ? 0 : startIndex + 1}</strong> to{' '}
                <strong className="text-[#14213D] font-mono">{Math.min(startIndex + pageSize, filteredBoms.length)}</strong> of{' '}
                <strong className="text-[#14213D] font-mono">{filteredBoms.length}</strong> BOM master formulas
                {filteredBoms.length !== boms.length && (
                  <span className="text-gray-400 font-normal"> (filtered from {boms.length} total)</span>
                )}
              </span>

              {/* Rows Per Page Selector */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-[#E4E0D6]">
                <span className="text-[11px] text-gray-500">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="py-1 px-2 border border-[#E4E0D6] rounded-md bg-white text-xs font-semibold text-[#14213D]"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                  <option value={250}>250 / page</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 border border-[#E4E0D6] rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 border border-[#E4E0D6] rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-xs font-semibold text-[#14213D]">
                Page <span className="font-mono font-bold text-[#0F8B8D]">{safeCurrentPage}</span> of{' '}
                <span className="font-mono font-bold">{totalPages}</span>
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 border border-[#E4E0D6] rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 border border-[#E4E0D6] rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>

              {/* Jump to Page Form */}
              <form onSubmit={handleJumpToPage} className="flex items-center gap-1 pl-2 border-l border-[#E4E0D6]">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder="Go to"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  className="w-14 py-1 px-1.5 border border-[#E4E0D6] rounded bg-white text-xs font-mono text-center"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-[#14213D] text-white rounded text-[11px] font-semibold hover:bg-gray-800"
                >
                  Go
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     3. BOM BUILDER / BOM EDITOR (Redesigned Legacy BOM Builder Workspace)
  ========================================================================= */
  if (view === 'bomBuilder') {
    return (
      <LegacyBomBuilderView
        boms={boms}
        items={items}
        selectedId={selectedId}
        routings={routings}
        alternates={alternates}
        regrindSpecs={regrindSpecs}
        machineReqs={machineReqs}
        ecrs={ecrs}
        ecos={ecos}
        onUpdateBom={onUpdateBom}
        onCreateBom={onCreateBom}
        onNavigate={onNavigate}
        showToast={showToast}
        onOpenWizard={(parent) => {
          setWizardParentItem(parent);
          setIsMfgBomWizardOpen(true);
        }}
      />
    );
  }

  /* =========================================================================
     4. MULTI-LEVEL BOM TREE VIEW
  ========================================================================= */
  if (view === 'bomTree') {
    return (
      <MultiLevelBomTreeView
        boms={boms}
        items={items}
        selectedId={selectedId}
        onNavigate={onNavigate}
        showToast={showToast}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
      />
    );
  }

  /* =========================================================================
     5. RECIPE / FORMULA-BASED BOM (Percentage Formulation)
  ========================================================================= */
  if (view === 'recipeFormula') {
    const activeRecipe = recipes[0] || INITIAL_RECIPES[0];
    const linkedRecipe = masterDataGovernanceService.generateLinkedRecipeCode(
      '1.0',
      activeRecipe.lines.map((l) => ({
        item: l.item,
        name: l.description,
        percentage: l.percentage,
        qty: l.qtyKg,
      }))
    );

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
              Compounding &amp; Blending
            </div>
            <h1 className="text-xl font-bold text-[#14213D]">Percentage Formula &amp; Recipe Manager</h1>
            <p className="text-xs text-[#6B7280]">
              Normalized percentage recipe formulations for compounding, masterbatch letdown ratios &amp; additives.
            </p>
          </div>
          <button
            onClick={() => showToast('Scaled formula to 2,500 KG Production Batch')}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5" /> Simulate Batch Scale
          </button>
        </div>

        {/* Task 3: Unique Recipe Identification Number & Linked Version Number Card */}
        <div className="p-4 bg-gradient-to-r from-[#14213D] via-purple-950 to-slate-900 text-white rounded-xl shadow-md border border-purple-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-mono font-bold flex items-center gap-1 uppercase tracking-wider">
                <Fingerprint className="w-3 h-3 text-purple-300" />
                Unique Recipe Identification Number
              </span>
              <span className="text-slate-400 text-xs">&bull;</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-blue-300" />
                BOM Version: v1.0
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="font-mono text-base font-bold text-amber-300 tracking-wider">
                {linkedRecipe.recipeUid}
              </div>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 text-[11px] font-semibold">Bi-directionally Linked with Version</span>
              </span>
            </div>
            <p className="text-[11px] text-purple-200/80 font-mono">
              Material Sum: {linkedRecipe.formulaSummary}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-white/10 backdrop-blur-xs p-2.5 rounded-lg border border-white/15 text-xs">
            <div className="text-right">
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Total Material Sum</div>
              <div className="font-mono font-bold text-sm">
                {activeRecipe.totalPercentage.toFixed(1)}% / 100%
              </div>
            </div>
            {Math.abs(activeRecipe.totalPercentage - 100) < 0.1 ? (
              <span className="flex items-center gap-1 text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-500/50 px-2 py-1 rounded text-[11px]">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 100% Balanced
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-300 font-bold bg-amber-950/80 border border-amber-500/50 px-2 py-1 rounded text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Discrepancy
              </span>
            )}
          </div>
        </div>

        {/* Recipe Formulation Card */}
        <div className="panel bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4E0D6]">
            <div>
              <div className="text-xs font-mono font-bold text-[#0F8B8D]">{activeRecipe.id}</div>
              <h2 className="text-base font-bold text-[#14213D]">{activeRecipe.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                Total: {activeRecipe.totalPercentage.toFixed(1)}% Balanced
              </span>
              <span className="px-2.5 py-1 rounded bg-[#14213D] text-white text-xs font-bold">
                Batch Size: {activeRecipe.batchSizeKg} KG
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] font-bold text-[11px]">
                  <th className="p-2.5">Seq</th>
                  <th className="p-2.5">Material Group</th>
                  <th className="p-2.5">Item &amp; Description</th>
                  <th className="p-2.5">Formula %</th>
                  <th className="p-2.5">Batch Qty (KG)</th>
                  <th className="p-2.5">Addition Phase</th>
                  <th className="p-2.5">Tolerance</th>
                  <th className="p-2.5 text-right">Cost / KG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {activeRecipe.lines.map((line) => (
                  <tr key={line.seq} className="hover:bg-[#F9F8F5]">
                    <td className="p-2.5 font-mono text-[#6B7280]">{line.seq}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-[#F6F4EF] font-semibold text-[10px] text-[#14213D]">
                        {line.materialGroup}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <div className="font-bold text-[#14213D]">{line.description}</div>
                      <div className="font-mono text-[10px] text-[#0F8B8D]">{line.item}</div>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-[#14213D]">
                      {line.percentage.toFixed(1)}%
                    </td>
                    <td className="p-2.5 font-mono font-bold text-[#0F8B8D]">
                      {line.qtyKg.toFixed(2)} KG
                    </td>
                    <td className="p-2.5 text-[#4B5563] font-medium">
                      {line.additionPhase}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-[#6B7280]">
                      {line.tolerance}
                    </td>
                    <td className="p-2.5 text-right font-mono font-semibold text-[#14213D]">
                      ₹{line.costPerKg.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#F6F4EF] rounded-lg text-xs space-y-1">
            <div className="font-bold text-[#14213D]">Mixing &amp; Processing Instructions:</div>
            <p className="text-[#4B5563]">{activeRecipe.mixingInstructions}</p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     6. ECR / ECO ENGINEERING CHANGE MANAGEMENT
  ========================================================================= */
  if (view === 'ecrList' || view === 'ecoList') {
    return (
      <EngineeringChangeOrderView
        initialViewMode={view === 'ecoList' ? 'eco' : 'ecr'}
        selectedId={selectedId}
        ecrs={ecrs}
        ecos={ecos}
        items={items}
        boms={boms}
        onUpdateEcrs={setEcrs}
        onUpdateEcos={setEcos}
        onUpdateBom={onUpdateBom}
        onNavigate={onNavigate}
        showToast={showToast}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
      />
    );
  }

  /* =========================================================================
     7. BOM COMPARISON SCREEN (Side-by-Side Diff & Version Analysis)
  ========================================================================= */
  if (view === 'bomCompare' || view === 'bomVersions') {
    return (
      <BomVersionDiffView
        boms={boms}
        items={items}
        selectedId={selectedId}
        onNavigate={onNavigate}
        showToast={showToast}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
      />
    );
  }

  /* =========================================================================
     7b. PROCESS ROUTING OPERATIONS SCREEN
  ========================================================================= */
  if (view === 'routingList') {
    return (
      <ProcessRoutingOperationsView
        routings={routings}
        boms={boms}
        items={items}
        selectedId={selectedId}
        onNavigate={onNavigate}
        showToast={showToast}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
      />
    );
  }

  /* =========================================================================
     8. WHERE-USED ANALYSIS SCREEN
  ========================================================================= */
  if (view === 'whereUsed') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
              Traceability &amp; Impact Analysis
            </div>
            <h1 className="text-xl font-bold text-[#14213D]">Where-Used Analysis Hub</h1>
            <p className="text-xs text-[#6B7280]">
              Identify all finished goods, parent BOMs, active work orders, and open customer orders for any raw resin or additive.
            </p>
          </div>
          <button
            onClick={() => showToast('Simulated mass replacement across 4 parent BOMs')}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Mass Replace Component
          </button>
        </div>

        <div className="panel bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs space-y-4">
          <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] text-xs">
            <span className="text-[#6B7280]">Queried Item:</span>
            <div className="font-bold text-sm text-[#14213D] mt-0.5">
              RM-PP-NAT-001 &mdash; PP Natural Granules (Prime Virgin)
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] font-bold text-[11px]">
                <th className="p-2.5">Parent Finished Good</th>
                <th className="p-2.5">BOM ID &amp; Version</th>
                <th className="p-2.5">Quantity Used / Unit</th>
                <th className="p-2.5">Active Work Orders</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              <tr className="hover:bg-[#F9F8F5]">
                <td className="p-2.5 font-bold text-[#14213D]">Plastic Container 500ml (FG-CTN-500)</td>
                <td className="p-2.5 font-mono text-[#0F8B8D]">BOM-1001 (v2.1)</td>
                <td className="p-2.5 font-mono">0.0425 KG</td>
                <td className="p-2.5 font-semibold text-emerald-700">WO-4401 (10,000 PCS)</td>
                <td className="p-2.5">{renderStatusBadge('released')}</td>
              </tr>
              <tr className="hover:bg-[#F9F8F5]">
                <td className="p-2.5 font-bold text-[#14213D]">Round Cosmetic Tub 250ml (FG-TUB-250)</td>
                <td className="p-2.5 font-mono text-[#0F8B8D]">BOM-1004 (v1.0)</td>
                <td className="p-2.5 font-mono">0.0240 KG</td>
                <td className="p-2.5 font-semibold text-[#6B7280]">None (Draft BOM)</td>
                <td className="p-2.5">{renderStatusBadge('draft')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* Fallback: BOM Detail view */
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('bomList')}
            className="p-1.5 text-[#6B7280] hover:text-[#14213D] hover:bg-white rounded-lg border border-[#E4E0D6]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#14213D]">{activeBom.parentName}</h1>
            <div className="text-xs text-[#6B7280]">{activeBom.id} &middot; {activeBom.version}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {renderStatusBadge(activeBom.status)}
          <button
            onClick={() => {
              const pItem = items.find((i) => i.code === activeBom.parent) || (items.length > 0 ? items[0] : null);
              if (pItem) {
                setWizardParentItem(pItem);
                setIsMfgBomWizardOpen(true);
              } else {
                showToast('No parent item record found in catalog for this BOM.');
              }
            }}
            className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" /> 9-Step Manufacturing Wizard
          </button>
          <button
            onClick={() => onNavigate('bomBuilder', { id: activeBom.id })}
            className="btn btn-sm btn-ghost border-[#E4E0D6]"
          >
            Open Legacy Editor
          </button>
        </div>
      </div>

      {/* Manufacturing Category & Parameters if available */}
      {activeBom.mfgCategory && (
        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-900">Manufacturing Category:</span>
            <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold font-mono">
              {activeBom.mfgCategory}
            </span>
            {activeBom.bomType && (
              <span className="text-gray-500 font-medium">({activeBom.bomType})</span>
            )}
          </div>
          {activeBom.standardCost && (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-gray-600">Calculated Std Cost:</span>
              <span className="font-bold text-teal-900 text-sm">
                ${activeBom.standardCost.toFixed(3)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="panel bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs">
        <h3 className="font-bold text-sm text-[#14213D] mb-3">Recipe Formulation Lines</h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] font-semibold text-[11px]">
              <th className="p-2.5">Item Code</th>
              <th className="p-2.5">Name</th>
              <th className="p-2.5">Qty / Unit</th>
              <th className="p-2.5">Scrap %</th>
              <th className="p-2.5 text-right">Cost (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E0D6]">
            {activeBom.lines.map((l, idx) => (
              <tr key={idx}>
                <td className="p-2.5 font-mono text-[#0F8B8D] font-bold">{l.item}</td>
                <td className="p-2.5 font-bold text-[#14213D]">{l.name}</td>
                <td className="p-2.5 font-mono">{l.qty} {l.uom}</td>
                <td className="p-2.5 font-mono">{l.scrap}%</td>
                <td className="p-2.5 text-right font-mono font-bold">₹{(l.cost || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  };

  return (
    <>
      {renderViewContent()}

      {/* Quick Modify BOM Modal on Row Click */}
      {quickModifyBom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E0D6] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E4E0D6] bg-gradient-to-r from-[#14213D] to-[#1a2f58] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Edit2 className="w-5 h-5 text-[#E8622C]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#E8622C] font-bold uppercase tracking-wider">
                      Quick Modify BOM Recipe
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 border border-white/20 text-white">
                      {quickModifyBom.id}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    {quickModifyBom.parentName}
                    <span className="text-xs text-gray-300 font-mono font-normal">({quickModifyBom.parent})</span>
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickModifyBom(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 [scrollbar-width:thin]">
              {/* Lifecycle & Status Bar */}
              <div className="p-3.5 bg-[#F9F8F5] rounded-xl border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[#14213D] block">Recipe Approval Lifecycle State</span>
                  <span className="text-[11px] text-gray-500">Update governance stage for shop floor release</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['draft', 'under_review', 'approved', 'released', 'obsolete'] as ApprovalStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setQuickModifyBom({ ...quickModifyBom, status: st })}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize border transition-all ${
                        quickModifyBom.status === st
                          ? 'bg-[#14213D] text-white border-[#14213D] shadow-xs'
                          : 'bg-white text-gray-600 border-[#E4E0D6] hover:border-gray-400'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">BOM Version</label>
                  <input
                    type="text"
                    value={quickModifyBom.version || 'v1.0'}
                    onChange={(e) => setQuickModifyBom({ ...quickModifyBom, version: e.target.value })}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono text-xs focus:border-[#0F8B8D] outline-none"
                    placeholder="e.g. v1.0"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">Process Type</label>
                  <select
                    value={quickModifyBom.processType || 'Injection Molding'}
                    onChange={(e) => setQuickModifyBom({ ...quickModifyBom, processType: e.target.value as any })}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg text-xs focus:border-[#0F8B8D] outline-none bg-white"
                  >
                    <option value="Injection Molding">Injection Molding</option>
                    <option value="Blow Molding">Blow Molding</option>
                    <option value="Compression Molding">Compression Molding</option>
                    <option value="Extrusion">Extrusion</option>
                    <option value="Assembly">Assembly</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">Batch Size ({quickModifyBom.baseUOM || 'PCS'})</label>
                  <input
                    type="number"
                    value={quickModifyBom.batchSize || 1000}
                    onChange={(e) => setQuickModifyBom({ ...quickModifyBom, batchSize: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono text-xs focus:border-[#0F8B8D] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">Standard Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickModifyBom.standardCost || 0}
                    onChange={(e) => setQuickModifyBom({ ...quickModifyBom, standardCost: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono font-bold text-xs focus:border-[#0F8B8D] outline-none text-[#14213D]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">Target Yield (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={quickModifyBom.yieldPct || 98.5}
                    onChange={(e) => setQuickModifyBom({ ...quickModifyBom, yieldPct: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono text-xs focus:border-[#0F8B8D] outline-none text-emerald-700 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">Scrap Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={quickModifyBom.scrapPct || 1.5}
                    onChange={(e) => setQuickModifyBom({ ...quickModifyBom, scrapPct: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono text-xs focus:border-[#0F8B8D] outline-none text-rose-600 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">Target Work Center</label>
                  <input
                    type="text"
                    value={quickModifyBom.routings?.[0]?.workCenter || 'WC-INJ-01'}
                    onChange={(e) => {
                      const updatedRoutings = [...(quickModifyBom.routings || [])];
                      if (updatedRoutings.length > 0) {
                        updatedRoutings[0] = { ...updatedRoutings[0], workCenter: e.target.value };
                      }
                      setQuickModifyBom({ ...quickModifyBom, routings: updatedRoutings });
                    }}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg text-xs focus:border-[#0F8B8D] outline-none"
                    placeholder="e.g. WC-INJ-01"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">Assigned Mold Tool</label>
                  <input
                    type="text"
                    value={quickModifyBom.machineMoldReqs?.moldToolId || 'MOLD-001'}
                    onChange={(e) => {
                      setQuickModifyBom({
                        ...quickModifyBom,
                        machineMoldReqs: {
                          ...(quickModifyBom.machineMoldReqs || { cavities: 1, standardCycleTimeSec: 45, setupTimeMin: 45 }),
                          moldToolId: e.target.value,
                        },
                      });
                    }}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg text-xs focus:border-[#0F8B8D] outline-none font-mono"
                    placeholder="e.g. MOLD-INJ-084"
                  />
                </div>
              </div>

              {/* Recipe Components Quick Overview Table */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">
                    Formula Components ({quickModifyBom.lines?.length || 0})
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    Batch Size: {quickModifyBom.batchSize} {quickModifyBom.baseUOM || 'PCS'}
                  </span>
                </div>

                <div className="overflow-x-auto border border-[#E4E0D6] rounded-xl [scrollbar-width:none]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold text-[11px]">
                        <th className="py-2 px-3">Item Code</th>
                        <th className="py-2 px-3">Component Name</th>
                        <th className="py-2 px-3 text-right">Unit Qty</th>
                        <th className="py-2 px-3 text-center">UOM</th>
                        <th className="py-2 px-3 text-right">Batch Qty</th>
                        <th className="py-2 px-3 text-right">Scrap %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(quickModifyBom.lines || []).map((line, idx) => (
                        <tr key={line.id || idx} className="hover:bg-gray-50">
                          <td className="py-2 px-3 font-mono font-bold text-[#0F8B8D]">{line.item}</td>
                          <td className="py-2 px-3 font-medium text-[#14213D]">{line.name}</td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="0.001"
                              value={line.qty}
                              onChange={(e) => {
                                const newQty = parseFloat(e.target.value) || 0;
                                const updatedLines = [...quickModifyBom.lines];
                                updatedLines[idx] = { ...updatedLines[idx], qty: newQty };
                                setQuickModifyBom({ ...quickModifyBom, lines: updatedLines });
                              }}
                              className="w-20 text-right py-0.5 px-1.5 border border-[#E4E0D6] rounded font-mono text-xs focus:border-[#0F8B8D]"
                            />
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-gray-600">{line.uom}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-gray-700">
                            {(line.qty * (quickModifyBom.batchSize || 1000)).toFixed(2)} {line.uom}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="0.1"
                              value={line.scrapPct ?? 1.5}
                              onChange={(e) => {
                                const newScrap = parseFloat(e.target.value) || 0;
                                const updatedLines = [...quickModifyBom.lines];
                                updatedLines[idx] = { ...updatedLines[idx], scrapPct: newScrap };
                                setQuickModifyBom({ ...quickModifyBom, lines: updatedLines });
                              }}
                              className="w-16 text-right py-0.5 px-1.5 border border-[#E4E0D6] rounded font-mono text-xs focus:border-[#0F8B8D] text-rose-600"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Engineering Notes & Remarks */}
              <div>
                <label className="text-xs font-bold text-[#14213D] block mb-1">Engineering Notes / Revision Remarks</label>
                <textarea
                  rows={2}
                  value={quickModifyBom.notes || ''}
                  onChange={(e) => setQuickModifyBom({ ...quickModifyBom, notes: e.target.value })}
                  placeholder="Enter revision notes, engineering change justification, or production instructions..."
                  className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg text-xs focus:border-[#0F8B8D] outline-none resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E4E0D6] bg-[#F9F8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const pItem = items.find((i) => i.code === quickModifyBom.parent) || (items.length > 0 ? items[0] : null);
                    if (pItem) {
                      setWizardParentItem(pItem);
                      setQuickModifyBom(null);
                      setIsMfgBomWizardOpen(true);
                    } else {
                      showToast('Catalog record not found for parent item.');
                    }
                  }}
                  className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs flex items-center gap-1.5 hover:bg-teal-50"
                >
                  <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" /> Open in 9-Step Wizard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const bId = quickModifyBom.id;
                    setQuickModifyBom(null);
                    onNavigate('bomTree', { id: bId });
                  }}
                  className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs flex items-center gap-1.5 hover:bg-gray-100"
                >
                  <FolderTree className="w-3.5 h-3.5" /> View BOM Tree
                </button>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setQuickModifyBom(null)}
                  className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateBom(quickModifyBom);
                    showToast(`✓ BOM ${quickModifyBom.id} (${quickModifyBom.parentName}) updated successfully!`);
                    setQuickModifyBom(null);
                  }}
                  className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMfgBomWizardOpen && (
        <ManufacturingBomWizardModal
          isOpen={isMfgBomWizardOpen}
          onClose={() => {
            setIsMfgBomWizardOpen(false);
          }}
          parentItem={wizardParentItem}
          allItems={items}
          existingBoms={boms}
          onSaveBom={(newBom) => {
            const exists = boms.some((b) => b.id === newBom.id);
            if (exists) {
              onUpdateBom(newBom);
            } else {
              onCreateBom(newBom);
            }
            setIsMfgBomWizardOpen(false);
            onNavigate('bomDetail', { id: newBom.id });
          }}
          showToast={showToast}
          onViewBomDetails={(b) => {
            setIsMfgBomWizardOpen(false);
            onNavigate('bomDetail', { id: b.id });
          }}
        />
      )}
    </>
  );
};
