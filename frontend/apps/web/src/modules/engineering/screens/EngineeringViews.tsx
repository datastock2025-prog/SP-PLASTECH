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
} from '@/src/types';
import { ManufacturingBomWizardModal } from '../components/bomWizard/ManufacturingBomWizardModal';
import { MultiLevelBomTreeView } from '../components/MultiLevelBomTreeView';
import { BomVersionDiffView } from '../components/BomVersionDiffView';
import { ProcessRoutingOperationsView } from '../components/ProcessRoutingOperationsView';
import { EngineeringChangeOrderView } from '../components/EngineeringChangeOrderView';
import { LegacyBomBuilderView } from '../components/LegacyBomBuilderView';
import { QuickModifyBomModal } from '../components/QuickModifyBomModal';
import { EngineeringDashboardView } from '../components/EngineeringDashboardView';
import { EngineeringBomListView } from '../components/EngineeringBomListView';
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
} from '@/src/data/engineeringData';
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
import { masterDataGovernanceService } from '@/src/services/masterDataGovernanceService';
import { useBoms, useSaveBom, useDeleteBom } from '../api/useEngineering';
import { usePaginatedItems } from '@/src/hooks/useMasterData';
import { normalizeItemMaster } from '../../masterdata/screens/MasterDataViews';

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
  // TanStack Query SSOT Hooks (Rule 1 & Rule 3)
  const { data: queryBoms, isLoading: isBomsLoading } = useBoms();
  const saveBomMutation = useSaveBom();
  const deleteBomMutation = useDeleteBom();
  const effectiveBoms = (queryBoms && queryBoms.length > 0 ? queryBoms : boms) || [];

  // Fetch Approved Master Items via bounded TanStack Query so BOM Wizard always has live Approved FG & RM items
  const { data: approvedCatalogData } = usePaginatedItems({
    page: 1,
    limit: 100,
    approval: 'approved',
  });
  const effectiveApprovedItems = useMemo(() => {
    const map = new Map<string, ItemMaster>();
    if (Array.isArray(items)) {
      items.forEach((i) => {
        const norm = normalizeItemMaster(i);
        if (norm.code && norm.approval === 'approved') map.set(norm.code, norm);
      });
    }
    if (Array.isArray(approvedCatalogData?.items)) {
      approvedCatalogData.items.forEach((i) => {
        const norm = normalizeItemMaster(i);
        if (norm.code && norm.approval === 'approved') map.set(norm.code, norm);
      });
    }
    return Array.from(map.values());
  }, [items, approvedCatalogData?.items]);

  const handleSaveBomToApi = (bom: BomMaster, isCreate: boolean = false) => {
    if (isCreate) {
      onCreateBom(bom);
    } else {
      onUpdateBom(bom);
    }
    saveBomMutation.mutate(bom);
  };

  const handleDeleteBomFromApi = (id: string) => {
    onDeleteBom(id);
    deleteBomMutation.mutate(id);
  };

  // Local state for engineering sub-views & controls
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Selected BOM for details/editing/tree (No static INITIAL_BOMS fallback)
  const activeBom = useMemo(() => {
    return (
      effectiveBoms.find((b) => b.id === selectedId) ||
      effectiveBoms[0] || {
        id: 'BOM-NEW',
        parent: '',
        parentName: 'No BOM Selected',
        version: '1.0',
        status: 'draft',
        updated: '',
        lines: [],
      }
    );
  }, [effectiveBoms, selectedId]);

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

  const renderViewContent = () => {
    /* =========================================================================
       1. BOM / ENGINEERING DASHBOARD
    ========================================================================= */
    if (view === 'bomDash' || view === 'engineeringDash') {
      return (
        <EngineeringDashboardView
          effectiveBoms={effectiveBoms}
          boms={effectiveBoms}
          ecrs={ecrs}
          ecos={ecos}
          onNavigate={onNavigate}
          onOpenWizard={() => {
            setWizardParentItem(null);
            setIsMfgBomWizardOpen(true);
          }}
          onUpdateBom={(updated) => handleSaveBomToApi(updated, false)}
          showToast={showToast}
        />
      );
    }

    if (view === 'bomList') {
      return (
        <EngineeringBomListView
          effectiveBoms={effectiveBoms}
          boms={effectiveBoms}
          items={effectiveApprovedItems}
          isBomsLoading={isBomsLoading && effectiveBoms.length === 0}
          onNavigate={onNavigate}
          onUpdateBom={(updated) => handleSaveBomToApi(updated, false)}
          onDeleteBom={handleDeleteBomFromApi}
          onOpenQuickModify={(b) => setQuickModifyBom(b)}
          onOpenWizard={(pItem) => {
            setWizardParentItem(pItem || null);
            setIsMfgBomWizardOpen(true);
          }}
          openConfirm={openConfirm}
          showToast={showToast}
          renderStatusBadge={renderStatusBadge}
        />
      );
    }

  /* =========================================================================
     3. BOM BUILDER / BOM EDITOR (Redesigned Legacy BOM Builder Workspace)
  ========================================================================= */
  if (view === 'bomBuilder') {
    return (
      <LegacyBomBuilderView
        boms={effectiveBoms}
        items={effectiveApprovedItems}
        selectedId={selectedId}
        routings={routings}
        alternates={alternates}
        regrindSpecs={regrindSpecs}
        machineReqs={machineReqs}
        ecrs={ecrs}
        ecos={ecos}
        onUpdateBom={(updated) => handleSaveBomToApi(updated, false)}
        onCreateBom={(created) => handleSaveBomToApi(created, true)}
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
      {(activeBom as any).mfgCategory && (
        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-900">Manufacturing Category:</span>
            <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold font-mono">
              {(activeBom as any).mfgCategory}
            </span>
            {(activeBom as any).bomType && (
              <span className="text-gray-500 font-medium">({(activeBom as any).bomType})</span>
            )}
          </div>
          {(activeBom as any).standardCost && (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-gray-600">Calculated Std Cost:</span>
              <span className="font-bold text-teal-900 text-sm">
                ${Number((activeBom as any).standardCost).toFixed(3)}
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
      <QuickModifyBomModal
        bom={quickModifyBom}
        items={effectiveApprovedItems}
        onClose={() => setQuickModifyBom(null)}
        onSave={(updated) => handleSaveBomToApi(updated, false)}
        onNavigate={onNavigate}
        onOpenWizard={(parentItem) => {
          setWizardParentItem(parentItem);
          setIsMfgBomWizardOpen(true);
        }}
        showToast={showToast}
      />


      {isMfgBomWizardOpen && (
        <ManufacturingBomWizardModal
          isOpen={isMfgBomWizardOpen}
          onClose={() => {
            setIsMfgBomWizardOpen(false);
          }}
          parentItem={wizardParentItem}
          allItems={effectiveApprovedItems}
          existingBoms={effectiveBoms}
          onSaveBom={(newBom) => {
            const exists = effectiveBoms.some((b) => b.id === newBom.id);
            handleSaveBomToApi(newBom, !exists);
            setIsMfgBomWizardOpen(false);
            onNavigate('bomDetail', { id: newBom.id });
          }}
          onSaveDraftBom={(draftBom) => {
            const exists = effectiveBoms.some((b) => b.id === draftBom.id);
            handleSaveBomToApi(draftBom, !exists);
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
