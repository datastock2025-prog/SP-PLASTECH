import React, { useState, useMemo, useEffect } from 'react';
import { BomMaster, ItemMaster } from '../../types';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  Search,
  Filter,
  Layers,
  Boxes,
  DollarSign,
  AlertTriangle,
  GitBranch,
  Eye,
  Plus,
  ExternalLink,
  Package,
  Info,
  Scale,
  Sparkles,
  Printer,
  X,
  Edit2,
  CheckCircle2,
  ListOrdered,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Compass,
  FileCheck,
} from 'lucide-react';

interface MultiLevelBomTreeViewProps {
  boms: BomMaster[];
  items: ItemMaster[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
  openDrawer?: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer?: () => void;
}

type ViewMode = 'tree' | 'table' | 'rollup';

interface TreeNodeData {
  id: string;
  level: number;
  sequence: number;
  itemCode: string;
  itemName: string;
  category: string;
  qty: number;
  uom: string;
  scrap: number;
  yieldPct: number;
  unitCost: number;
  extendedCost: number;
  additionPhase?: string;
  dosageRate?: string;
  regrindPct?: number;
  issueMethod?: string;
  position?: string;
  isCritical?: boolean;
  substituteItem?: string;
  substituteGroup?: string;
  isSubassembly?: boolean;
  childBomId?: string;
  children?: TreeNodeData[];
}

export const MultiLevelBomTreeView: React.FC<MultiLevelBomTreeViewProps> = ({
  boms,
  items,
  selectedId,
  onNavigate,
  showToast,
}) => {
  // Active BOM selection state
  const [activeBomId, setActiveBomId] = useState<string>(() => {
    if (selectedId && boms.some((b) => b.id === selectedId)) {
      return selectedId;
    }
    return boms.length > 0 ? boms[0].id : '';
  });

  // Sync if selectedId changes from navigation
  useEffect(() => {
    if (selectedId && boms.some((b) => b.id === selectedId)) {
      setActiveBomId(selectedId);
    } else if (!activeBomId && boms.length > 0) {
      setActiveBomId(boms[0].id);
    }
  }, [selectedId, boms]);

  // Dropdown open state for BOM selector
  const [isBomSelectorOpen, setIsBomSelectorOpen] = useState(false);
  const [bomSelectorQuery, setBomSelectorQuery] = useState('');

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('tree');

  // Search and filter inside the active BOM tree
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [maxDepthFilter, setMaxDepthFilter] = useState<number>(0); // 0 = all levels

  // Selected node for inspector drawer
  const [inspectedNode, setInspectedNode] = useState<TreeNodeData | null>(null);

  // Active BOM object
  const activeBom = useMemo(() => {
    return boms.find((b) => b.id === activeBomId) || boms[0];
  }, [boms, activeBomId]);

  // Expansion state for nodes
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'root': true,
  });

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Build recursive Multi-Level Tree structure dynamically from BOM data
  const treeData = useMemo<TreeNodeData | null>(() => {
    if (!activeBom) return null;

    const visitedBoms = new Set<string>();
    visitedBoms.add(activeBom.id);

    // Helper to build children for a BOM recursively
    const buildLinesForBom = (bom: BomMaster, parentLevel: number = 0): TreeNodeData[] => {
      if (!bom.lines || bom.lines.length === 0) return [];

      return bom.lines.map((line, idx) => {
        const lineId = `${bom.id}-${line.id || idx}`;
        // Check if this component is itself a subassembly with its own BOM
        const subBom = boms.find(
          (b) =>
            (b.parent === line.item || b.id === line.item) &&
            !visitedBoms.has(b.id)
        );

        const isSubassembly =
          !!subBom ||
          line.category === 'Subassembly' ||
          line.category === 'Semi-Finished' ||
          (line.level || 1) >= 2;

        const effectiveLevel = parentLevel + 1;

        let children: TreeNodeData[] | undefined = undefined;
        if (subBom) {
          visitedBoms.add(subBom.id);
          children = buildLinesForBom(subBom, effectiveLevel);
        }

        // Calculate dynamic cost
        const dynamicCost = line.cost ?? 0;
        const dynamicExtCost =
          line.extendedCost ?? Number(((line.qty || 0) * dynamicCost).toFixed(2));

        return {
          id: lineId,
          level: effectiveLevel,
          sequence: line.sequence || (idx + 1) * 10,
          itemCode: line.item,
          itemName: line.name,
          category: line.category || 'Raw Material',
          qty: line.qty || 0,
          uom: line.uom || 'KG',
          scrap: line.scrap || 0,
          yieldPct: line.yield ?? (100 - (line.scrap || 0)),
          unitCost: dynamicCost,
          extendedCost: dynamicExtCost,
          additionPhase: line.additionPhase,
          dosageRate: line.dosageRate,
          regrindPct: line.regrindPct,
          issueMethod: line.issueMethod || 'Auto Backflush',
          position: line.position,
          isCritical: line.isCritical,
          substituteItem: line.substituteItem,
          substituteGroup: line.substituteGroup,
          isSubassembly,
          childBomId: subBom?.id,
          children,
        };
      });
    };

    const rootChildren = buildLinesForBom(activeBom, 0);

    const rootNode: TreeNodeData = {
      id: 'root',
      level: 0,
      sequence: 0,
      itemCode: activeBom.parent,
      itemName: activeBom.parentName,
      category: activeBom.bomType || 'Finished Goods',
      qty: activeBom.batchSize || 1,
      uom: activeBom.baseUOM || 'PCS',
      scrap: activeBom.scrapPct || 0,
      yieldPct: activeBom.yieldPct || 100,
      unitCost: activeBom.standardCost || 0,
      extendedCost: Number(((activeBom.standardCost || 0) * (activeBom.batchSize || 1)).toFixed(2)),
      isSubassembly: true,
      children: rootChildren,
    };

    return rootNode;
  }, [activeBom, boms]);

  // Flattened tree for calculations and table view
  const flattenedNodes = useMemo<TreeNodeData[]>(() => {
    if (!treeData) return [];
    const result: TreeNodeData[] = [];

    const recurse = (node: TreeNodeData) => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        node.children.forEach(recurse);
      }
    };

    recurse(treeData);
    return result;
  }, [treeData]);

  // Set initial expansion when tree data changes
  useEffect(() => {
    if (treeData) {
      const initial: Record<string, boolean> = { root: true };
      if (treeData.children) {
        treeData.children.forEach((child) => {
          initial[child.id] = true;
          if (child.children) {
            child.children.forEach((sub) => {
              initial[sub.id] = true;
            });
          }
        });
      }
      setExpandedNodes(initial);
    }
  }, [treeData]);

  // Rollup KPI calculations derived dynamically from active BOM and lines
  const kpiMetrics = useMemo(() => {
    if (!activeBom) {
      return {
        totalLevels: 0,
        lineCount: 0,
        matCost: 0,
        pkgCost: 0,
        laborCost: 0,
        overheadCost: 0,
        totalUnitCost: 0,
        criticalCount: 0,
        regrindShare: 0,
        subassemblyCount: 0,
      };
    }

    const lines = flattenedNodes.filter((n) => n.level > 0);
    let maxLevel = 1;
    let criticalCount = 0;
    let matCost = 0;
    let pkgCost = 0;
    let regrindTotal = 0;
    let subassemblies = 0;

    lines.forEach((l) => {
      if (l.level > maxLevel) maxLevel = l.level;
      if (l.isCritical) criticalCount += 1;
      if (l.isSubassembly) subassemblies += 1;

      const ext = l.extendedCost || l.unitCost * l.qty;
      const cat = (l.category || '').toLowerCase();
      if (cat.includes('pack') || cat.includes('box')) {
        pkgCost += ext;
      } else {
        matCost += ext;
      }
      if (l.regrindPct) regrindTotal += l.regrindPct;
    });

    const labor = activeBom.laborCost ?? 0;
    const overhead = (activeBom.machineOverhead ?? 0) + (activeBom.energyCost ?? 0);
    const calculatedStandardCost =
      activeBom.standardCost && activeBom.standardCost > 0
        ? activeBom.standardCost
        : Number((matCost + pkgCost + labor + overhead).toFixed(2));

    return {
      totalLevels: maxLevel + 1,
      lineCount: lines.length,
      matCost: Number(matCost.toFixed(2)),
      pkgCost: Number(pkgCost.toFixed(2)),
      laborCost: Number(labor.toFixed(2)),
      overheadCost: Number(overhead.toFixed(2)),
      totalUnitCost: calculatedStandardCost,
      criticalCount,
      regrindShare: regrindTotal,
      subassemblyCount: subassemblies,
    };
  }, [activeBom, flattenedNodes]);

  // Category badge styling helper
  const getCategoryBadge = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('virgin') || c.includes('raw material') || c.includes('resin')) {
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    }
    if (c.includes('masterbatch') || c.includes('color')) {
      return { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500' };
    }
    if (c.includes('additive')) {
      return { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', dot: 'bg-sky-500' };
    }
    if (c.includes('regrind')) {
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' };
    }
    if (c.includes('pack')) {
      return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', dot: 'bg-slate-500' };
    }
    if (c.includes('sub') || c.includes('semi')) {
      return { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', dot: 'bg-indigo-500' };
    }
    return { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200', dot: 'bg-gray-400' };
  };

  // Filter node predicate
  const filterNode = (node: TreeNodeData, query: string, catFilter: string, maxDepth: number): boolean => {
    if (node.level === 0) return true;

    if (maxDepth > 0 && node.level > maxDepth) return false;

    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      node.itemCode.toLowerCase().includes(q) ||
      node.itemName.toLowerCase().includes(q) ||
      (node.position && node.position.toLowerCase().includes(q)) ||
      (node.additionPhase && node.additionPhase.toLowerCase().includes(q)) ||
      (node.substituteItem && node.substituteItem.toLowerCase().includes(q));

    const matchCategory =
      catFilter === 'all' ||
      node.category.toLowerCase().includes(catFilter.toLowerCase()) ||
      (catFilter === 'regrind' && (node.regrindPct || 0) > 0) ||
      (catFilter === 'critical' && node.isCritical) ||
      (catFilter === 'subassembly' && node.isSubassembly);

    return matchQuery && matchCategory;
  };

  // Expand all
  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    flattenedNodes.forEach((n) => {
      all[n.id] = true;
    });
    setExpandedNodes(all);
    showToast('All multi-tier tree levels expanded');
  };

  // Collapse all
  const handleCollapseAll = () => {
    setExpandedNodes({ root: true });
    showToast('Tree collapsed to root assembly level');
  };

  // Export CSV
  const handleExportTree = () => {
    if (!treeData) return;
    const headers = [
      'Level',
      'Sequence',
      'Item Number',
      'Item Description',
      'Category',
      'Quantity',
      'UOM',
      'Scrap %',
      'Unit Cost (₹)',
      'Extended Cost (₹)',
      'Issue Method',
      'Addition Phase',
      'Dosage Rate',
      'Regrind %',
      'Critical Flag',
      'Substitute Material',
    ];
    const rows = flattenedNodes.map((n) => [
      `L${n.level}`,
      n.sequence,
      `"${n.itemCode}"`,
      `"${n.itemName}"`,
      `"${n.category}"`,
      n.qty,
      n.uom,
      `${n.scrap}%`,
      n.unitCost.toFixed(2),
      n.extendedCost.toFixed(2),
      `"${n.issueMethod || ''}"`,
      `"${n.additionPhase || ''}"`,
      `"${n.dosageRate || ''}"`,
      n.regrindPct ? `${n.regrindPct}%` : '0%',
      n.isCritical ? 'Yes' : 'No',
      `"${n.substituteItem || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BOM_MultiLevel_Tree_${activeBom?.parent || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported Multi-Level BOM Tree for ${activeBom?.parent} to CSV`);
  };

  // Empty state if no BOMs in system
  if (!activeBom) {
    return (
      <div className="panel bg-white p-12 rounded-2xl border border-[#E4E0D6] text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#E8622C] flex items-center justify-center mx-auto">
          <Boxes className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#14213D]">No BOM Records Available</h2>
        <p className="text-xs text-gray-500">
          There are currently no Bill of Materials configured. Create a Manufacturing BOM using the guided wizard to explore dynamic multi-level structures.
        </p>
        <button
          onClick={() => onNavigate('bomBuilder')}
          className="btn btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 mx-auto"
        >
          <Plus className="w-4 h-4" /> Create Manufacturing BOM
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Header Bar: Navigation, Breadcrumb, Active BOM Switcher, & View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E4E0D6]">
        {/* Left Side: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('bomList')}
            className="p-2 text-gray-500 hover:text-[#14213D] hover:bg-white rounded-xl border border-[#E4E0D6] transition-colors shadow-2xs"
            title="Back to BOM Master List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#0F8B8D] font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                <GitBranch className="w-3 h-3" /> Multi-Level Hierarchy Engine
              </span>
              <span className="text-[11px] text-gray-400">&bull;</span>
              <span className="text-[11px] text-gray-500 font-mono">Dynamic Indented Tree</span>
            </div>
            <h1 className="text-xl font-bold text-[#14213D] flex items-center gap-2">
              <span>Multi-Level BOM Tree</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                {activeBom.version || 'v1.0'}
              </span>
            </h1>
          </div>
        </div>

        {/* Center / Right: Active BOM Switcher combobox & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active BOM Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsBomSelectorOpen(!isBomSelectorOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E4E0D6] rounded-xl text-xs font-bold text-[#14213D] hover:border-[#0F8B8D] transition-all shadow-2xs"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-gray-400 font-normal">Active BOM:</span>
              <span className="font-mono text-[#0F8B8D]">{activeBom.parent}</span>
              <span className="max-w-[140px] truncate text-gray-700 hidden sm:inline">&mdash; {activeBom.parentName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </button>

            {/* Dropdown panel */}
            {isBomSelectorOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsBomSelectorOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#E4E0D6] p-2.5 z-30 space-y-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 pt-1 flex items-center justify-between">
                    <span>Select Manufacturing BOM</span>
                    <span className="font-mono text-[10px] text-gray-500">{boms.length} Available</span>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search BOM by code or product name..."
                      value={bomSelectorQuery}
                      onChange={(e) => setBomSelectorQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 border rounded-lg bg-[#FAF9F5] border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                    {boms
                      .filter((b) => {
                        if (!bomSelectorQuery) return true;
                        const q = bomSelectorQuery.toLowerCase();
                        return (
                          b.parent.toLowerCase().includes(q) ||
                          b.parentName.toLowerCase().includes(q) ||
                          b.id.toLowerCase().includes(q)
                        );
                      })
                      .map((b) => {
                        const isCurrent = b.id === activeBom.id;
                        return (
                          <div
                            key={b.id}
                            onClick={() => {
                              setActiveBomId(b.id);
                              setIsBomSelectorOpen(false);
                              setBomSelectorQuery('');
                              showToast(`Switched BOM view to ${b.parent}`);
                            }}
                            className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition-colors ${
                              isCurrent
                                ? 'bg-teal-50/80 font-bold border-l-4 border-l-[#0F8B8D]'
                                : 'hover:bg-[#F6F4EF]'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[#0F8B8D] font-bold">{b.parent}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-gray-100 rounded text-gray-600 font-mono">
                                  {b.version}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-600 truncate max-w-[200px]">
                                {b.parentName}
                              </div>
                            </div>
                            <div className="text-right text-[10px]">
                              <span className="font-semibold text-gray-700 block">
                                {b.lines?.length || 0} lines
                              </span>
                              <span className="text-gray-400 capitalize">{b.status}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="pt-2 border-t border-[#E4E0D6] flex items-center justify-between">
                    <button
                      onClick={() => {
                        setIsBomSelectorOpen(false);
                        onNavigate('bomBuilder');
                      }}
                      className="text-xs text-[#0F8B8D] font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Manufacturing BOM
                    </button>
                    <button
                      onClick={() => setIsBomSelectorOpen(false)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Real Navigation Link to BOM Builder & Diff Viewer */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('bomBuilder', { id: activeBom.id })}
              className="px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
              title="Edit this BOM in BOM Builder"
            >
              <Edit2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Edit BOM</span>
            </button>
            <button
              onClick={() => onNavigate('bomVersions', { id: activeBom.id })}
              className="px-2.5 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
              title="Compare revisions in Diff Viewer"
            >
              <GitBranch className="w-3.5 h-3.5 text-teal-600" />
              <span>Compare Diff</span>
            </button>
          </div>

          {/* View Modes Toggle */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E4E0D6] shadow-2xs">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'tree' ? 'bg-[#14213D] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Tree Graph</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-[#14213D] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Indented Table</span>
            </button>
            <button
              onClick={() => setViewMode('rollup')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'rollup' ? 'bg-[#14213D] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Cost Rollup</span>
            </button>
          </div>

          {/* Expand / Collapse & Export */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExpandAll}
              className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs py-1.5 flex items-center gap-1"
              title="Expand all hierarchy levels"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand</span>
            </button>
            <button
              onClick={handleCollapseAll}
              className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs py-1.5 flex items-center gap-1"
              title="Collapse to root level"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Collapse</span>
            </button>
            <button
              onClick={handleExportTree}
              className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 py-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Metric Ribbon (Dynamic Data computed from BOM) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Levels</span>
            <GitBranch className="w-3.5 h-3.5 text-[#0F8B8D]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#14213D]">
            {kpiMetrics.totalLevels} <span className="text-xs font-normal text-gray-500 font-sans">Tiers</span>
          </div>
          <div className="text-[10px] text-gray-400">Multi-tier depth</div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Total Components</span>
            <Boxes className="w-3.5 h-3.5 text-[#0F8B8D]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#14213D]">
            {kpiMetrics.lineCount} <span className="text-xs font-normal text-gray-500 font-sans">Items</span>
          </div>
          <div className="text-[10px] text-gray-400">Active BOM lines</div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Unit Standard Cost</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-700">
            ₹{kpiMetrics.totalUnitCost.toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-400">Per {activeBom.baseUOM || 'PCS'}</div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Material Cost</span>
            <Scale className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-lg font-bold font-mono text-teal-800">
            ₹{kpiMetrics.matCost.toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-400">Direct Materials</div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Packaging Cost</span>
            <Package className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-700">
            ₹{kpiMetrics.pkgCost.toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-400">Boxes &amp; Logistics</div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Critical Items</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-800">
            {kpiMetrics.criticalCount} <span className="text-xs font-normal text-gray-500 font-sans">Tracked</span>
          </div>
          <div className="text-[10px] text-gray-400">QA approval required</div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="panel bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search within Tree */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search component number, name, addition phase..."
            value={treeSearchQuery}
            onChange={(e) => setTreeSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border rounded-lg bg-[#FAF9F5] border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
          {treeSearchQuery && (
            <button
              onClick={() => setTreeSearchQuery('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          <span className="text-gray-400 text-[11px] font-semibold mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {[
            { id: 'all', label: 'All Items' },
            { id: 'raw', label: 'Resin / Raw' },
            { id: 'masterbatch', label: 'Masterbatch' },
            { id: 'additive', label: 'Additives' },
            { id: 'packaging', label: 'Packaging' },
            { id: 'critical', label: 'Critical Only' },
            { id: 'subassembly', label: 'Subassemblies' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors whitespace-nowrap ${
                selectedCategoryFilter === cat.id
                  ? 'bg-[#0F8B8D] text-white shadow-2xs'
                  : 'bg-[#F6F4EF] text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Depth Level Filter */}
        <div className="flex items-center gap-2 shrink-0 text-xs">
          <span className="text-gray-400 text-[11px] font-semibold flex items-center gap-1">
            <Layers className="w-3 h-3" /> Max Depth:
          </span>
          <select
            value={maxDepthFilter}
            onChange={(e) => setMaxDepthFilter(Number(e.target.value))}
            className="text-xs bg-[#FAF9F5] border border-[#E4E0D6] rounded-lg px-2 py-1 font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          >
            <option value={0}>All Levels</option>
            <option value={1}>Level 1 Only</option>
            <option value={2}>Level 1 &amp; 2</option>
            <option value={3}>Level 1, 2 &amp; 3</option>
          </select>
        </div>
      </div>

      {/* 4. Main Body: View Modes */}
      {viewMode === 'tree' && (
        <div className="panel bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-4">
          {/* Level 0: Finished Good Root Assembly Card */}
          <div className="p-4 bg-gradient-to-r from-[#14213D] to-[#1E2E4E] text-white rounded-xl shadow-md border border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <button
                  onClick={() => toggleNode('root')}
                  className="mt-0.5 sm:mt-0 p-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Expand / Collapse BOM Components"
                >
                  {expandedNodes['root'] ? (
                    <ChevronDown className="w-4 h-4 text-[#E8622C]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#E8622C]" />
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-bold text-amber-300">
                      {activeBom.parent}
                    </span>
                    <span className="text-white/80 font-semibold text-sm">
                      {activeBom.parentName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono uppercase">
                      {activeBom.status || 'Active'}
                    </span>
                  </div>
                  <div className="text-xs text-white/60 flex items-center gap-3 mt-1 flex-wrap font-sans">
                    <span>Process: <strong className="text-white/90">{activeBom.processType || 'Injection Molding'}</strong></span>
                    <span>&bull;</span>
                    <span>Batch Size: <strong className="text-white/90">{activeBom.batchSize} {activeBom.baseUOM}</strong></span>
                    <span>&bull;</span>
                    <span>Yield: <strong className="text-emerald-400">{activeBom.yieldPct}%</strong></span>
                    {activeBom.moldId && (
                      <>
                        <span>&bull;</span>
                        <span>Tooling: <strong className="text-white/90">{activeBom.moldId}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right shrink-0">
                <div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">Total Standard Cost</div>
                  <div className="text-base font-mono font-bold text-emerald-300">
                    ₹{kpiMetrics.totalUnitCost.toFixed(2)} <span className="text-xs font-normal text-white/70">/{activeBom.baseUOM}</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('bomDetail', { id: activeBom.id })}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 border border-white/10"
                  title="Open Full BOM Master Details"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Level 1 & 2 Tree Branch Nodes with Visual Connectors */}
          {expandedNodes['root'] && (
            <div className="ml-3 sm:ml-6 pl-3 sm:pl-6 border-l-2 border-dashed border-[#0F8B8D]/30 space-y-3 pt-2">
              {treeData?.children && treeData.children.length > 0 ? (
                treeData.children
                  .filter((child) => filterNode(child, treeSearchQuery, selectedCategoryFilter, maxDepthFilter))
                  .map((node) => {
                    const badge = getCategoryBadge(node.category);
                    const isNodeExpanded = !!expandedNodes[node.id];
                    const hasSubChildren = node.children && node.children.length > 0;

                    return (
                      <div key={node.id} className="relative group">
                        {/* Connecting Horizontal Line from parent's vertical line */}
                        <div className="absolute -left-3 sm:-left-6 top-5 w-3 sm:w-6 h-0.5 border-t-2 border-dashed border-[#0F8B8D]/30" />

                        {/* Node Card */}
                        <div
                          className={`p-3.5 rounded-xl border transition-all shadow-2xs ${
                            inspectedNode?.id === node.id
                              ? 'bg-amber-50/50 border-[#E8622C] ring-1 ring-[#E8622C]'
                              : 'bg-white border-[#E4E0D6] hover:border-[#0F8B8D] hover:shadow-sm'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            {/* Left: Expander, Level badge, Code & Name */}
                            <div className="flex items-start sm:items-center gap-2.5">
                              {hasSubChildren ? (
                                <button
                                  onClick={() => toggleNode(node.id)}
                                  className="mt-0.5 sm:mt-0 p-1 rounded hover:bg-gray-100 text-gray-500"
                                  title={isNodeExpanded ? 'Collapse Subassembly' : 'Expand Subassembly'}
                                >
                                  {isNodeExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-[#0F8B8D]" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-[#0F8B8D]" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <div className={`w-2 h-2 rounded-full ${badge.dot}`} />
                                </div>
                              )}

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-[#14213D] group-hover:text-[#0F8B8D] transition-colors">
                                    {node.itemCode}
                                  </span>
                                  <span className="text-xs text-gray-700 font-medium">
                                    &mdash; {node.itemName}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                                  >
                                    {node.category}
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                    L{node.level} &bull; Seq {node.sequence}
                                  </span>
                                  {node.isSubassembly && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                                      <GitBranch className="w-2.5 h-2.5" /> Subassembly
                                    </span>
                                  )}
                                  {node.isCritical && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Critical
                                    </span>
                                  )}
                                  {node.substituteItem && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                      Sub: {node.substituteItem}
                                    </span>
                                  )}
                                </div>

                                {/* Operational & Dosage Details */}
                                <div className="text-[11px] text-gray-500 flex items-center gap-3 flex-wrap">
                                  <span>
                                    Qty: <strong className="font-mono text-[#14213D]">{node.qty} {node.uom}</strong>
                                  </span>
                                  {node.dosageRate && (
                                    <>
                                      <span>&bull;</span>
                                      <span>Dosage: <strong className="text-purple-700">{node.dosageRate}</strong></span>
                                    </>
                                  )}
                                  {node.regrindPct ? (
                                    <>
                                      <span>&bull;</span>
                                      <span>Regrind: <strong className="text-amber-700">{node.regrindPct}%</strong></span>
                                    </>
                                  ) : null}
                                  <span>&bull;</span>
                                  <span>Scrap: <strong className="text-gray-700">{node.scrap}%</strong></span>
                                  <span>&bull;</span>
                                  <span>Issue: <strong className="text-gray-700">{node.issueMethod}</strong></span>
                                  {node.position && (
                                    <>
                                      <span>&bull;</span>
                                      <span>Loc: <strong className="text-gray-700">{node.position}</strong></span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Cost, Real Item Nav, and Inspect Button */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                              <div className="text-right">
                                <div className="text-xs font-mono font-bold text-[#14213D]">
                                  ₹{node.extendedCost.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">
                                  @ ₹{node.unitCost.toFixed(2)}/{node.uom}
                                </div>
                              </div>

                              <button
                                onClick={() => onNavigate('itemDetail', { code: node.itemCode })}
                                className="p-1.5 rounded-lg border border-[#E4E0D6] text-gray-500 hover:text-[#0F8B8D] hover:bg-gray-50 transition-colors shadow-2xs"
                                title="Jump to Item Master"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setInspectedNode(node)}
                                className="btn btn-sm btn-ghost border border-[#E4E0D6] text-xs py-1 px-2.5 flex items-center gap-1 hover:border-[#0F8B8D]"
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-500" />
                                <span>Inspect</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Nested Sub-assembly Children (Level 2/3) */}
                        {hasSubChildren && isNodeExpanded && (
                          <div className="ml-4 sm:ml-6 pl-4 sm:pl-6 border-l-2 border-dashed border-indigo-300 space-y-2 mt-2">
                            {node.children?.map((subNode) => {
                              const subBadge = getCategoryBadge(subNode.category);
                              return (
                                <div
                                  key={subNode.id}
                                  className="p-3 bg-[#FAF9F5] border border-[#E4E0D6] rounded-xl flex items-center justify-between text-xs hover:border-[#0F8B8D] transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${subBadge.dot}`} />
                                    <span className="font-mono font-bold text-[#14213D]">{subNode.itemCode}</span>
                                    <span className="text-gray-700">&mdash; {subNode.itemName}</span>
                                    <span className="text-[10px] font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                      L{subNode.level}
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded ${subBadge.bg} ${subBadge.text}`}>
                                      {subNode.category}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs font-mono">
                                    <span className="text-gray-600">{subNode.qty} {subNode.uom}</span>
                                    <span className="text-emerald-700 font-bold">₹{subNode.extendedCost.toFixed(2)}</span>
                                    <button
                                      onClick={() => setInspectedNode(subNode)}
                                      className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                      title="Inspect Subcomponent"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-2">
                  <p className="text-xs text-gray-500">
                    No components found matching your current filter criteria.
                  </p>
                  <button
                    onClick={() => {
                      setTreeSearchQuery('');
                      setSelectedCategoryFilter('all');
                      setMaxDepthFilter(0);
                    }}
                    className="text-xs text-[#0F8B8D] font-semibold hover:underline"
                  >
                    Clear Search &amp; Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Indented Table View */}
      {viewMode === 'table' && (
        <div className="panel bg-white rounded-2xl border border-[#E4E0D6] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-gray-600 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">Level / Tree</th>
                  <th className="py-3 px-3">Seq</th>
                  <th className="py-3 px-3">Item Code</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Qty / Parent</th>
                  <th className="py-3 px-3">UOM</th>
                  <th className="py-3 px-3 text-right">Scrap %</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Ext. Cost</th>
                  <th className="py-3 px-3">Issue Method</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flattenedNodes
                  .filter((n) => filterNode(n, treeSearchQuery, selectedCategoryFilter, maxDepthFilter))
                  .map((row) => {
                    const badge = getCategoryBadge(row.category);
                    const isRoot = row.level === 0;

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-[#FAF9F5] transition-colors ${
                          isRoot ? 'bg-amber-50/40 font-bold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                          <div
                            className="flex items-center gap-1.5"
                            style={{ paddingLeft: `${row.level * 16}px` }}
                          >
                            {row.level > 0 && <span className="text-gray-300">└─</span>}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                isRoot
                                  ? 'bg-[#14213D] text-white'
                                  : 'bg-teal-50 text-teal-800 border border-teal-200'
                              }`}
                            >
                              L{row.level}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-500">{row.sequence}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#14213D]">
                          <button
                            onClick={() => onNavigate('itemDetail', { code: row.itemCode })}
                            className="hover:underline text-left"
                          >
                            {row.itemCode}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 max-w-xs truncate">
                          {row.itemName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {row.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#14213D]">
                          {row.qty}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 font-mono">{row.uom}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-500">
                          {row.scrap}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                          ₹{row.unitCost.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          ₹{row.extendedCost.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 text-[11px] whitespace-nowrap">
                          {row.issueMethod || 'Auto Backflush'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setInspectedNode(row)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                            title="Inspect Item Specs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Cost Rollup Breakdown View */}
      {viewMode === 'rollup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cost Drivers Panel */}
          <div className="lg:col-span-2 panel bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
              <div>
                <h3 className="font-bold text-[#14213D] text-sm">Material &amp; Component Cost Rollup</h3>
                <p className="text-xs text-gray-500">Breakdown of extended direct material cost per batch and unit</p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Batch Size: {activeBom.batchSize} {activeBom.baseUOM}
              </span>
            </div>

            <div className="space-y-3">
              {flattenedNodes
                .filter((n) => n.level > 0)
                .map((line) => {
                  const pctOfTotal =
                    kpiMetrics.totalUnitCost > 0
                      ? Math.min(100, (line.extendedCost / kpiMetrics.totalUnitCost) * 100)
                      : 0;
                  const badge = getCategoryBadge(line.category);

                  return (
                    <div key={line.id} className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#14213D]">{line.itemCode}</span>
                          <span className="text-gray-600 truncate max-w-xs">{line.itemName}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${badge.bg} ${badge.text}`}>
                            {line.category}
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-emerald-800">₹{line.extendedCost.toFixed(2)}</span>
                          <span className="text-[10px] text-gray-400 ml-1.5">({pctOfTotal.toFixed(1)}%)</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0F8B8D] rounded-full transition-all duration-500"
                          style={{ width: `${pctOfTotal}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Cost Composition Card */}
          <div className="panel bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-4">
            <h3 className="font-bold text-[#14213D] text-sm">Standard Cost Absorption</h3>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-600">Raw Material &amp; Additives:</span>
                <span className="font-mono font-bold text-gray-900">₹{kpiMetrics.matCost.toFixed(2)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-600">Packaging &amp; Boxing:</span>
                <span className="font-mono font-bold text-gray-900">₹{kpiMetrics.pkgCost.toFixed(2)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-600">Direct Labor Allocation:</span>
                <span className="font-mono font-bold text-gray-900">₹{kpiMetrics.laborCost.toFixed(2)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-600">Machine Overhead &amp; Energy:</span>
                <span className="font-mono font-bold text-gray-900">₹{kpiMetrics.overheadCost.toFixed(2)}</span>
              </div>
              {activeBom.regrindCredit ? (
                <div className="py-2.5 flex justify-between text-emerald-700 font-semibold">
                  <span>Regrind Circularity Credit:</span>
                  <span className="font-mono">-₹{Math.abs(activeBom.regrindCredit).toFixed(2)}</span>
                </div>
              ) : null}
              <div className="pt-3 flex justify-between text-sm font-bold text-[#14213D]">
                <span>Total Standard Unit Cost:</span>
                <span className="font-mono text-emerald-700">₹{kpiMetrics.totalUnitCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-teal-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-700" /> Cost Rollup Engine Verified
              </div>
              <p className="text-teal-800 text-[11px]">
                Standard cost rollup dynamically absorbs raw materials, additives, scrap allowances, and plant overhead directly from live BOM master.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. Slide-over / Modal Inspector Drawer for Inspected Node */}
      {inspectedNode && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#E4E0D6] animate-in slide-in-from-right duration-200">
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#14213D] text-white font-bold">
                    L{inspectedNode.level} Component
                  </span>
                  <span className="text-xs text-gray-400 font-mono">Seq {inspectedNode.sequence}</span>
                </div>
                <button
                  onClick={() => setInspectedNode(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Item Identification Card */}
              <div className="p-3.5 bg-[#FAF9F5] border border-[#E4E0D6] rounded-xl space-y-1.5">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Item Master Record</div>
                <div className="font-mono text-base font-bold text-[#14213D]">{inspectedNode.itemCode}</div>
                <div className="text-xs text-gray-700">{inspectedNode.itemName}</div>
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                    Category: {inspectedNode.category}
                  </span>
                </div>
              </div>

              {/* Formulation & Dosage Specs */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">Formulation &amp; Engineering Specs</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-400 block">Quantity per Unit</span>
                    <strong className="font-mono text-[#14213D]">{inspectedNode.qty} {inspectedNode.uom}</strong>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-400 block">Scrap / Yield Rate</span>
                    <strong className="font-mono text-gray-800">{inspectedNode.scrap}% scrap &bull; {inspectedNode.yieldPct}% yield</strong>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-400 block">Addition Phase / Feed</span>
                    <strong className="text-gray-800">{inspectedNode.additionPhase || 'Main Hopper'}</strong>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-400 block">Issue Method</span>
                    <strong className="text-gray-800">{inspectedNode.issueMethod}</strong>
                  </div>
                </div>
              </div>

              {/* Inventory & Warehouse Cross-reference */}
              {(() => {
                const itemMasterRec = items.find((i) => i.code === inspectedNode.itemCode);
                return (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">Live Inventory Balance</h4>
                    {itemMasterRec ? (
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <span className="text-[10px] text-emerald-800 block">On Hand</span>
                          <strong className="font-mono text-emerald-900">{itemMasterRec.stock} {itemMasterRec.baseUOM}</strong>
                        </div>
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <span className="text-[10px] text-blue-800 block">Available</span>
                          <strong className="font-mono text-blue-900">{itemMasterRec.avail} {itemMasterRec.baseUOM}</strong>
                        </div>
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <span className="text-[10px] text-amber-800 block">Allocated</span>
                          <strong className="font-mono text-amber-900">{itemMasterRec.alloc || '0'} {itemMasterRec.baseUOM}</strong>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Inventory balance for {inspectedNode.itemCode} is tracked in warehouse staging.</p>
                    )}
                  </div>
                );
              })()}

              {/* Cost Impact */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Unit Cost Breakdown</div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-xs text-gray-600">Unit Standard Cost:</span>
                  <strong className="text-emerald-900">₹{inspectedNode.unitCost.toFixed(2)}/{inspectedNode.uom}</strong>
                </div>
                <div className="flex justify-between items-center font-mono border-t border-emerald-200 pt-1">
                  <span className="text-xs font-bold text-gray-800">Extended Cost (Qty &times; Rate):</span>
                  <strong className="text-sm text-emerald-900 font-bold">₹{inspectedNode.extendedCost.toFixed(2)}</strong>
                </div>
              </div>

              {/* Substitute & Alternative Materials */}
              {inspectedNode.substituteItem && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-blue-900 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-600" /> Substitute Item Configured
                  </div>
                  <p className="text-blue-800 text-[11px]">
                    Material <strong className="font-mono">{inspectedNode.substituteItem}</strong> ({inspectedNode.substituteGroup || 'Group A'}) is pre-approved for engineering changeover if stock is unavailable.
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-gray-50 border-t border-[#E4E0D6] flex items-center justify-between">
              <button
                onClick={() => {
                  setInspectedNode(null);
                  onNavigate('itemDetail', { code: inspectedNode.itemCode });
                }}
                className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View in Item Master
              </button>
              <button
                onClick={() => setInspectedNode(null)}
                className="btn btn-sm btn-primary text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
