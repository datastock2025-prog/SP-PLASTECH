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
  X,
  Save,
  ArrowRight,
  Maximize2
} from 'lucide-react';

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
     2. ADVANCED BOM LIST WITH INLINE EDIT GRID & MULTI-STAGE APPROVALS
  ========================================================================= */
  if (view === 'bomList') {
    const filteredBoms = boms.filter((b) => {
      const matchSearch =
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.parent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.parentName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (selectedStatus === 'all') return true;
      return b.status === selectedStatus;
    });

    const isAllSelected = filteredBoms.length > 0 && selectedBomIds.length === filteredBoms.length;

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
              Engineering Master Data
            </div>
            <h1 className="text-xl font-bold text-[#14213D]">Bill of Materials / Engineering BOMs</h1>
            <p className="text-xs text-[#6B7280]">
              High-density editable recipe grid with inline cell updates, multi-stage approvals &amp; cost rollups.
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
              className="btn btn-sm btn-ghost border-[#E4E0D6] flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#0F8B8D]" /> Legacy Builder
            </button>
            <button
              onClick={() => onNavigate('bomImport')}
              className="btn btn-sm btn-ghost border-[#E4E0D6] flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-[#0F8B8D]" /> Import / Export
            </button>
          </div>
        </div>

        {/* Filter Bar & Saved Views */}
        <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg px-3 py-1.5 text-xs">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search BOM ID, finished item, resin type..."
              className="w-full bg-transparent border-none outline-none text-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'draft', 'under_review', 'approved', 'released', 'obsolete'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                  selectedStatus === st
                    ? 'bg-[#14213D] text-white'
                    : 'bg-[#F6F4EF] text-[#6B7280] hover:bg-[#E5E7EB]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedBomIds.length > 0 && (
          <div className="p-2.5 bg-[#14213D] text-white rounded-lg flex items-center justify-between text-xs animate-in fade-in duration-150">
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

        {/* Advanced High-Density Inline Edit Table */}
        <div className="panel bg-white rounded-xl border border-[#E4E0D6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBomIds(filteredBoms.map((b) => b.id));
                        } else {
                          setSelectedBomIds([]);
                        }
                      }}
                      className="rounded text-[#0F8B8D]"
                    />
                  </th>
                  <th className="p-3">BOM ID</th>
                  <th className="p-3">Parent Item &amp; Description</th>
                  <th className="p-3">Version</th>
                  <th className="p-3">Process</th>
                  <th className="p-3">Batch Size</th>
                  <th className="p-3">Yield %</th>
                  <th className="p-3">Scrap %</th>
                  <th className="p-3">Std Unit Cost (₹)</th>
                  <th className="p-3">Approval Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {filteredBoms.map((bom) => {
                  const isSelected = selectedBomIds.includes(bom.id);
                  const totalCost = bom.standardCost || bom.lines.reduce((s, l) => s + (l.cost || 0), 0);

                  return (
                    <tr
                      key={bom.id}
                      className={`hover:bg-[#F9F8F5] transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#F0FDF4]' : ''
                      }`}
                      onClick={() => onNavigate('bomDetail', { id: bom.id })}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
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
                        {bom.id}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-[#14213D]">{bom.parentName}</div>
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
                              className="w-16 px-1.5 py-0.5 text-xs border border-[#0F8B8D] rounded bg-white"
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

                      <td className="p-3 text-[#374151]">
                        {bom.processType || 'Injection Molding'}
                      </td>

                      {/* Inline Editable Batch Size */}
                      <td
                        className="p-3 font-mono text-[#374151]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCell({ id: bom.id, field: 'batchSize' });
                          setCellEditValue(String(bom.batchSize || 1000));
                        }}
                      >
                        {editingCell?.id === bom.id && editingCell.field === 'batchSize' ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              value={cellEditValue}
                              onChange={(e) => setCellEditValue(e.target.value)}
                              className="w-20 px-1.5 py-0.5 text-xs border border-[#0F8B8D] rounded bg-white font-mono"
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
                      <td className="p-3 font-mono text-emerald-700 font-semibold">
                        {bom.yieldPct || 98.5}%
                      </td>

                      {/* Scrap % */}
                      <td className="p-3 font-mono text-rose-600 font-semibold">
                        {bom.scrapPct || 1.5}%
                      </td>

                      {/* Inline Editable Standard Cost */}
                      <td
                        className="p-3 font-mono font-bold text-[#14213D]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCell({ id: bom.id, field: 'standardCost' });
                          setCellEditValue(String(totalCost.toFixed(2)));
                        }}
                      >
                        {editingCell?.id === bom.id && editingCell.field === 'standardCost' ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              step="0.01"
                              value={cellEditValue}
                              onChange={(e) => setCellEditValue(e.target.value)}
                              className="w-20 px-1.5 py-0.5 text-xs border border-[#0F8B8D] rounded bg-white font-mono"
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

                      <td className="p-3">
                        {renderStatusBadge(bom.status)}
                      </td>

                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNavigate('bomTree', { id: bom.id })}
                            title="Multi-Level Tree View"
                            className="p-1 text-[#6B7280] hover:text-[#0F8B8D] hover:bg-[#F6F4EF] rounded"
                          >
                            <FolderTree className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const pItem = items.find((i) => i.code === bom.parent) || items[0];
                              setWizardParentItem(pItem);
                              setIsMfgBomWizardOpen(true);
                            }}
                            title="Open in 9-Step Manufacturing BOM Wizard"
                            className="p-1 text-[#6B7280] hover:text-[#0F8B8D] hover:bg-teal-50 rounded"
                          >
                            <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" />
                          </button>
                          <button
                            onClick={() => onNavigate('bomBuilder', { id: bom.id })}
                            title="Open in BOM Editor"
                            className="p-1 text-[#6B7280] hover:text-[#14213D] hover:bg-[#F6F4EF] rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#F9F8F5] border-t border-[#E4E0D6] text-xs text-[#6B7280] flex items-center justify-between">
            <span>Showing {filteredBoms.length} of {boms.length} BOM master formulas</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-[#0F8B8D]">
                <Sparkles className="w-3 h-3" /> Inline Editing Active (Click cell to edit)
              </span>
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
              const pItem = items.find((i) => i.code === activeBom.parent) || items[0];
              setWizardParentItem(pItem);
              setIsMfgBomWizardOpen(true);
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
