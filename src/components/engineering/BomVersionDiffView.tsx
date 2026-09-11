import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BomMaster, BomLine, ItemMaster, EngineeringChangeOrder, EngineeringChangeRequest } from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  GitCompare,
  ArrowLeftRight,
  Download,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  Sparkles,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronRight,
  Maximize2,
  X,
  ExternalLink,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  FileText,
  Boxes,
  Scale,
  Sliders,
  Tag,
  ShieldCheck,
  Check,
  Edit2,
  FolderTree,
  Package,
} from 'lucide-react';
import { INITIAL_ECOS, INITIAL_ECRS } from '../../data/engineeringData';

interface BomVersionDiffViewProps {
  boms: BomMaster[];
  items: ItemMaster[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
  openDrawer?: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer?: () => void;
}

// Version snapshot definition
export interface BomVersionSnapshot {
  id: string;
  bomId: string;
  version: string;
  label: string;
  parent: string;
  parentName: string;
  effectiveDate: string;
  author: string;
  status: 'Approved' | 'Active' | 'Under Review' | 'Obsolete' | 'Draft' | 'Released';
  changeReason?: string;
  ecoNumber?: string;
  standardCost: number;
  batchSize: number;
  baseUOM: string;
  scrapPct: number;
  yieldPct: number;
  lines: BomLine[];
}

export type DiffChangeType = 'unchanged' | 'modified' | 'added' | 'removed';

export interface FieldDiff {
  fieldName: string;
  label: string;
  oldVal: any;
  newVal: any;
  delta?: string | number;
  type: 'cost' | 'qty' | 'scrap' | 'text' | 'badge';
}

export interface DiffRow {
  key: string;
  itemCode: string;
  itemName: string;
  category: string;
  changeType: DiffChangeType;
  lineA?: BomLine;
  lineB?: BomLine;
  fieldChanges: FieldDiff[];
  costA: number;
  costB: number;
  costDelta: number;
  qtyA: number;
  qtyB: number;
  qtyDelta: number;
  uom: string;
  isCritical: boolean;
  additionPhaseA?: string;
  additionPhaseB?: string;
  dosageRateA?: string;
  dosageRateB?: string;
  regrindPctA?: number;
  regrindPctB?: number;
  substituteA?: string;
  substituteB?: string;
}

export const BomVersionDiffView: React.FC<BomVersionDiffViewProps> = ({
  boms,
  items,
  selectedId,
  onNavigate,
  showToast,
  openDrawer,
  closeDrawer,
}) => {
  // Built-in snapshots repository dynamically constructed from live real BOMs in state
  const allSnapshots = useMemo<BomVersionSnapshot[]>(() => {
    const list: BomVersionSnapshot[] = [];

    // 1. Ingest all current real BOMs from props first so any live edits reflect in real time
    boms.forEach((b) => {
      list.push({
        id: `${b.id}-${b.version || 'current'}`,
        bomId: b.id,
        version: b.version || 'v1.0',
        label: `${b.version || 'v1.0'} - Current Master: ${b.parent} (${b.status || 'Active'})`,
        parent: b.parent,
        parentName: b.parentName,
        effectiveDate: b.effectiveFrom || b.updated || '2026-08-20',
        author: b.owner || 'Engineering Team',
        status: (b.status === 'released' ? 'Released' : b.status === 'approved' ? 'Approved' : b.status === 'under_review' ? 'Under Review' : b.status === 'draft' ? 'Draft' : 'Active'),
        changeReason: b.notes || 'Current live production BOM specification.',
        standardCost: b.standardCost || b.lines.reduce((s, l) => s + ((l.cost || 0) * (l.qty || 1)), 0),
        batchSize: b.batchSize || 1000,
        baseUOM: b.baseUOM || 'PCS',
        scrapPct: b.scrapPct || 1.5,
        yieldPct: b.yieldPct || 98.5,
        lines: b.lines || [],
      });
    });

    // 2. Add historical revision snapshots linked to BOM-1001
    const bom1001 = boms.find((b) => b.id === 'BOM-1001') || boms[0];
    if (bom1001) {
      // Historical Baseline v2.0 (Approved Standard prior to UV Masterbatch upgrade ECO-2026-084)
      if (!list.some((s) => s.id === `${bom1001.id}-v2.0`)) {
        list.push({
          id: `${bom1001.id}-v2.0`,
          bomId: bom1001.id,
          version: 'v2.0',
          label: 'v2.0 - Standard Baseline (Pre-ECO-084)',
          parent: bom1001.parent,
          parentName: bom1001.parentName,
          effectiveDate: '2026-01-01',
          author: 'Vikram Singh',
          status: 'Approved',
          changeReason: 'Baseline production release prior to Clariant UV Masterbatch upgrade.',
          standardCost: 46.10,
          batchSize: bom1001.batchSize || 1000,
          baseUOM: bom1001.baseUOM || 'PCS',
          scrapPct: 1.5,
          yieldPct: 98.5,
          lines: [
            {
              id: 'L1',
              sequence: 10,
              level: 1,
              item: 'RM-PP-NAT-001',
              name: 'PP Natural Granules (Prime Virgin)',
              category: 'Raw Material',
              qty: 0.0425,
              uom: 'KG',
              scrap: 1.5,
              cost: 32.50,
              extendedCost: 32.50,
              additionPhase: 'Main Hopper',
              regrindPct: 0,
              isCritical: true,
              issueMethod: 'Auto Backflush',
            },
            {
              id: 'L2-old',
              sequence: 20,
              level: 1,
              item: 'MB-WHT-002',
              name: 'Standard White Masterbatch (TiO2 60% Old Spec)',
              category: 'Masterbatch',
              qty: 0.0012,
              uom: 'KG',
              scrap: 0.5,
              cost: 2.60,
              extendedCost: 2.60,
              additionPhase: 'Side Feeder',
              dosageRate: '2.5% LDR',
              isCritical: true,
              issueMethod: 'Auto Backflush',
            },
            {
              id: 'L3',
              sequence: 30,
              level: 1,
              item: 'AD-UV-STAB-003',
              name: 'UV Stabilizer & Clarifier Additive',
              category: 'Additive',
              qty: 0.0004,
              uom: 'KG',
              scrap: 0.2,
              cost: 1.60,
              extendedCost: 1.60,
              additionPhase: 'Liquid Dosing',
              dosageRate: '0.8% LDR',
              isCritical: false,
              issueMethod: 'Auto Backflush',
            },
            {
              id: 'L4',
              sequence: 40,
              level: 1,
              item: 'RG-PP-CLN-010',
              name: 'Clean PP Regrind (Internal Sprue / Runner)',
              category: 'Regrind',
              qty: 0.0065,
              uom: 'KG',
              scrap: 2.0,
              cost: 1.20,
              extendedCost: -2.30,
              additionPhase: 'Pre-mix',
              regrindPct: 13.5,
              isCritical: false,
              issueMethod: 'Floor Stock',
            },
            {
              id: 'L5',
              sequence: 50,
              level: 2,
              item: 'PK-BOX-001',
              name: 'Corrugated Shipping Box (200 Units/Box)',
              category: 'Packaging',
              qty: 0.005,
              uom: 'PCS',
              scrap: 0.5,
              cost: 0.45,
              extendedCost: 0.45,
              issueMethod: 'Manual Issue',
            },
          ],
        });
      }
    }

    // 3. Add historical revision snapshots linked to BOM-1002
    const bom1002 = boms.find((b) => b.id === 'BOM-1002');
    if (bom1002) {
      if (!list.some((s) => s.id === `${bom1002.id}-v1.0`)) {
        list.push({
          id: `${bom1002.id}-v1.0`,
          bomId: bom1002.id,
          version: 'v1.0',
          label: 'v1.0 - Initial Release (10% Regrind)',
          parent: bom1002.parent,
          parentName: bom1002.parentName,
          effectiveDate: '2025-06-01',
          author: 'Vikram Singh',
          status: 'Obsolete',
          changeReason: 'Initial tool qualification trial with 10% regrind.',
          standardCost: 1420.00,
          batchSize: 100,
          baseUOM: 'PCS',
          scrapPct: 4.0,
          yieldPct: 96.0,
          lines: [
            { id: 'L201', sequence: 10, level: 1, item: 'RM-HD-GRN-014', name: 'HDPE Injection Grade Resin', category: 'Raw Material', qty: 10.8, uom: 'KG', scrap: 3.5, cost: 950.00 },
            { id: 'L202', sequence: 20, level: 1, item: 'RG-HD-BLK-002', name: 'HDPE Regrind Pellets', category: 'Regrind', qty: 1.2, uom: 'KG', scrap: 3.0, cost: 45.00, regrindPct: 10.0 },
            { id: 'L203', sequence: 30, level: 1, item: 'MB-BLK-001', name: 'Carbon Black Masterbatch (40%)', category: 'Masterbatch', qty: 0.25, uom: 'KG', scrap: 1.0, cost: 65.00 },
          ],
        });
      }

      if (!list.some((s) => s.id === `${bom1002.id}-v2.0-ecr`)) {
        list.push({
          id: `${bom1002.id}-v2.0-ecr`,
          bomId: bom1002.id,
          version: 'v2.0',
          label: 'v2.0 - Proposed 20% Regrind (ECR-2026-002)',
          parent: bom1002.parent,
          parentName: bom1002.parentName,
          effectiveDate: '2026-10-01',
          author: 'Vikram Singh',
          status: 'Under Review',
          changeReason: 'Increase regrind from 15% to 20% using dual-stage melt filtration. Cost reduction of ₹38.50/unit.',
          ecoNumber: 'ECR-2026-002',
          standardCost: 1346.50,
          batchSize: 100,
          baseUOM: 'PCS',
          scrapPct: 2.5,
          yieldPct: 97.5,
          lines: [
            { id: 'L201-p', sequence: 10, level: 1, item: 'RM-HD-GRN-014', name: 'HDPE Injection Grade Resin', category: 'Raw Material', qty: 9.20, uom: 'KG', scrap: 2.5, cost: 890.00 },
            { id: 'L202-p', sequence: 20, level: 1, item: 'RG-HD-BLK-002', name: 'HDPE Regrind Pellets (Filtered)', category: 'Regrind', qty: 2.40, uom: 'KG', scrap: 2.5, cost: 75.00, regrindPct: 20.0 },
            { id: 'L203-p', sequence: 30, level: 1, item: 'MB-BLK-001', name: 'Carbon Black Masterbatch (40%)', category: 'Masterbatch', qty: 0.25, uom: 'KG', scrap: 1.0, cost: 65.00 },
          ],
        });
      }
    }

    return list;
  }, [boms]);

  // Selected Version A (Baseline) and Version B (Target)
  const defaultBase = allSnapshots[1] ? allSnapshots[1].id : allSnapshots[0]?.id || '';
  const defaultTarget = allSnapshots[0]?.id || '';
  const [versionAId, setVersionAId] = useState<string>(defaultBase);
  const [versionBId, setVersionBId] = useState<string>(defaultTarget);

  // If selectedId is passed, adapt to it
  useEffect(() => {
    if (selectedId) {
      const match = allSnapshots.find((s) => s.bomId === selectedId);
      if (match) {
        setVersionBId(match.id);
        const base = allSnapshots.find((s) => s.bomId === selectedId && s.id !== match.id);
        if (base) {
          setVersionAId(base.id);
        } else {
          // Compare with first other snapshot
          const other = allSnapshots.find((s) => s.id !== match.id);
          if (other) setVersionAId(other.id);
        }
      }
    }
  }, [selectedId, allSnapshots]);

  // Get Version A and B objects
  const versionA = useMemo<BomVersionSnapshot>(() => {
    return allSnapshots.find((s) => s.id === versionAId) || allSnapshots[0];
  }, [allSnapshots, versionAId]);

  const versionB = useMemo<BomVersionSnapshot>(() => {
    return (
      allSnapshots.find((s) => s.id === versionBId) ||
      allSnapshots.find((s) => s.id !== versionAId) ||
      allSnapshots[0]
    );
  }, [allSnapshots, versionBId, versionAId]);

  // Real BOMs that correspond to versionA and versionB
  const realBomA = useMemo<BomMaster | undefined>(() => {
    return boms.find((b) => b.id === versionA.bomId);
  }, [boms, versionA]);

  const realBomB = useMemo<BomMaster | undefined>(() => {
    return boms.find((b) => b.id === versionB.bomId);
  }, [boms, versionB]);

  // Swap Version A and B
  const handleSwapVersions = () => {
    const temp = versionAId;
    setVersionAId(versionBId);
    setVersionBId(temp);
    showToast('Swapped baseline and comparison versions');
  };

  // View presentation mode: 'unified' | 'split' | 'formulation'
  const [diffViewMode, setDiffViewMode] = useState<'unified' | 'split' | 'formulation'>('unified');

  // Filter options
  const [showDiffsOnly, setShowDiffsOnly] = useState<boolean>(false);
  const [selectedChangeTypeFilter, setSelectedChangeTypeFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Search & Autocomplete state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Inspector state
  const [inspectingRow, setInspectingRow] = useState<DiffRow | null>(null);

  // Deep field-level comparison calculation
  const diffRows = useMemo<DiffRow[]>(() => {
    if (!versionA || !versionB) return [];

    const rows: DiffRow[] = [];
    const linesA = versionA.lines || [];
    const linesB = versionB.lines || [];

    // Track matched B lines to identify newly added lines
    const matchedBIds = new Set<string>();

    // Step 1: Compare each line in A with lines in B
    linesA.forEach((lineA) => {
      const matchInB = linesB.find((b) => b.item === lineA.item);

      if (matchInB) {
        matchedBIds.add(matchInB.item);

        const fieldChanges: FieldDiff[] = [];

        if (Number(lineA.qty) !== Number(matchInB.qty)) {
          const delta = Number((matchInB.qty - lineA.qty).toFixed(4));
          fieldChanges.push({
            fieldName: 'qty',
            label: 'Quantity',
            oldVal: `${lineA.qty} ${lineA.uom}`,
            newVal: `${matchInB.qty} ${matchInB.uom}`,
            delta: delta > 0 ? `+${delta} ${lineA.uom}` : `${delta} ${lineA.uom}`,
            type: 'qty',
          });
        }

        const costA = lineA.cost || 0;
        const costB = matchInB.cost || 0;
        if (costA !== costB) {
          const delta = Number((costB - costA).toFixed(2));
          fieldChanges.push({
            fieldName: 'cost',
            label: 'Unit Cost',
            oldVal: `₹${costA.toFixed(2)}`,
            newVal: `₹${costB.toFixed(2)}`,
            delta: delta > 0 ? `+₹${delta.toFixed(2)}` : `-₹${Math.abs(delta).toFixed(2)}`,
            type: 'cost',
          });
        }

        if (Number(lineA.scrap) !== Number(matchInB.scrap)) {
          const delta = Number(((matchInB.scrap || 0) - (lineA.scrap || 0)).toFixed(1));
          fieldChanges.push({
            fieldName: 'scrap',
            label: 'Scrap %',
            oldVal: `${lineA.scrap}%`,
            newVal: `${matchInB.scrap}%`,
            delta: delta > 0 ? `+${delta}%` : `${delta}%`,
            type: 'scrap',
          });
        }

        if (lineA.additionPhase !== matchInB.additionPhase && (lineA.additionPhase || matchInB.additionPhase)) {
          fieldChanges.push({
            fieldName: 'additionPhase',
            label: 'Addition Phase',
            oldVal: lineA.additionPhase || 'None',
            newVal: matchInB.additionPhase || 'None',
            type: 'text',
          });
        }

        if (lineA.dosageRate !== matchInB.dosageRate && (lineA.dosageRate || matchInB.dosageRate)) {
          fieldChanges.push({
            fieldName: 'dosageRate',
            label: 'Dosage Rate',
            oldVal: lineA.dosageRate || 'N/A',
            newVal: matchInB.dosageRate || 'N/A',
            type: 'text',
          });
        }

        if (lineA.regrindPct !== matchInB.regrindPct && (lineA.regrindPct || matchInB.regrindPct)) {
          fieldChanges.push({
            fieldName: 'regrindPct',
            label: 'Regrind %',
            oldVal: `${lineA.regrindPct || 0}%`,
            newVal: `${matchInB.regrindPct || 0}%`,
            type: 'qty',
          });
        }

        if (lineA.name !== matchInB.name) {
          fieldChanges.push({
            fieldName: 'name',
            label: 'Spec Description',
            oldVal: lineA.name,
            newVal: matchInB.name,
            type: 'text',
          });
        }

        const isModified = fieldChanges.length > 0;
        const changeType: DiffChangeType = isModified ? 'modified' : 'unchanged';

        const extA = lineA.extendedCost ?? (lineA.cost || 0) * (lineA.qty || 0);
        const extB = matchInB.extendedCost ?? (matchInB.cost || 0) * (matchInB.qty || 0);

        rows.push({
          key: `match-${lineA.item}`,
          itemCode: lineA.item,
          itemName: matchInB.name || lineA.name,
          category: matchInB.category || lineA.category || 'Raw Material',
          changeType,
          lineA,
          lineB: matchInB,
          fieldChanges,
          costA: extA,
          costB: extB,
          costDelta: Number((extB - extA).toFixed(2)),
          qtyA: lineA.qty,
          qtyB: matchInB.qty,
          qtyDelta: Number((matchInB.qty - lineA.qty).toFixed(4)),
          uom: lineA.uom || 'KG',
          isCritical: !!(lineA.isCritical || matchInB.isCritical),
          additionPhaseA: lineA.additionPhase,
          additionPhaseB: matchInB.additionPhase,
          dosageRateA: lineA.dosageRate,
          dosageRateB: matchInB.dosageRate,
          regrindPctA: lineA.regrindPct,
          regrindPctB: matchInB.regrindPct,
          substituteA: lineA.substituteItem,
          substituteB: matchInB.substituteItem,
        });
      } else {
        // Line exists in A but NOT in B (Removed)
        const extA = lineA.extendedCost ?? (lineA.cost || 0) * (lineA.qty || 0);
        rows.push({
          key: `removed-${lineA.item}`,
          itemCode: lineA.item,
          itemName: lineA.name,
          category: lineA.category || 'Raw Material',
          changeType: 'removed',
          lineA,
          lineB: undefined,
          fieldChanges: [
            {
              fieldName: 'status',
              label: 'Component Status',
              oldVal: 'Active in Baseline',
              newVal: 'Removed from Revision',
              type: 'badge',
            },
          ],
          costA: extA,
          costB: 0,
          costDelta: -extA,
          qtyA: lineA.qty,
          qtyB: 0,
          qtyDelta: -lineA.qty,
          uom: lineA.uom || 'KG',
          isCritical: !!lineA.isCritical,
          additionPhaseA: lineA.additionPhase,
          dosageRateA: lineA.dosageRate,
          regrindPctA: lineA.regrindPct,
        });
      }
    });

    // Step 2: Identify lines that are in B but were NOT in A (Added)
    linesB.forEach((lineB) => {
      if (!matchedBIds.has(lineB.item)) {
        const extB = lineB.extendedCost ?? (lineB.cost || 0) * (lineB.qty || 0);
        rows.push({
          key: `added-${lineB.item}`,
          itemCode: lineB.item,
          itemName: lineB.name,
          category: lineB.category || 'Raw Material',
          changeType: 'added',
          lineA: undefined,
          lineB,
          fieldChanges: [
            {
              fieldName: 'status',
              label: 'Component Status',
              oldVal: 'Not in Baseline',
              newVal: 'Newly Added in Revision',
              type: 'badge',
            },
          ],
          costA: 0,
          costB: extB,
          costDelta: extB,
          qtyA: 0,
          qtyB: lineB.qty,
          qtyDelta: lineB.qty,
          uom: lineB.uom || 'KG',
          isCritical: !!lineB.isCritical,
          additionPhaseB: lineB.additionPhase,
          dosageRateB: lineB.dosageRate,
          regrindPctB: lineB.regrindPct,
        });
      }
    });

    return rows;
  }, [versionA, versionB]);

  // Autocomplete Suggestions: search both current diff components and full item master database
  const autocompleteResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    // 1. Matches in currently compared diff lines
    const inDiffMatches = diffRows
      .filter((r) => r.itemCode.toLowerCase().includes(q) || r.itemName.toLowerCase().includes(q))
      .map((r) => ({
        code: r.itemCode,
        name: r.itemName,
        category: r.category,
        inDiff: true,
        diffChangeType: r.changeType,
        uom: r.uom,
      }));

    // 2. Matches in entire Item Master catalog (so user can look for ANY item)
    const inCatalogMatches = items
      .filter((it) => {
        const matchesQuery = it.code.toLowerCase().includes(q) || it.name.toLowerCase().includes(q) || it.cat?.toLowerCase().includes(q);
        const alreadyInDiff = inDiffMatches.some((d) => d.code === it.code);
        return matchesQuery && !alreadyInDiff;
      })
      .slice(0, 8)
      .map((it) => ({
        code: it.code,
        name: it.name,
        category: it.type || it.cat || 'Item',
        inDiff: false,
        uom: it.baseUOM || 'KG',
      }));

    return [...inDiffMatches, ...inCatalogMatches].slice(0, 10);
  }, [searchQuery, diffRows, items]);

  // Executive Variance Metrics
  const metrics = useMemo(() => {
    let addedCount = 0;
    let removedCount = 0;
    let modifiedCount = 0;
    let unchangedCount = 0;

    diffRows.forEach((r) => {
      if (r.changeType === 'added') addedCount++;
      else if (r.changeType === 'removed') removedCount++;
      else if (r.changeType === 'modified') modifiedCount++;
      else unchangedCount++;
    });

    const costA = versionA.standardCost || 0;
    const costB = versionB.standardCost || 0;
    const costDelta = Number((costB - costA).toFixed(2));
    const costDeltaPct = costA > 0 ? Number(((costDelta / costA) * 100).toFixed(2)) : 0;

    // Mass balance totals
    const massA = (versionA.lines || []).reduce((acc, l) => acc + (l.qty || 0), 0);
    const massB = (versionB.lines || []).reduce((acc, l) => acc + (l.qty || 0), 0);
    const massDelta = Number((massB - massA).toFixed(4));

    // Scrap delta
    const scrapDelta = Number(((versionB.scrapPct || 0) - (versionA.scrapPct || 0)).toFixed(1));

    return {
      addedCount,
      removedCount,
      modifiedCount,
      unchangedCount,
      totalChanges: addedCount + removedCount + modifiedCount,
      costA,
      costB,
      costDelta,
      costDeltaPct,
      massA: Number(massA.toFixed(4)),
      massB: Number(massB.toFixed(4)),
      massDelta,
      scrapDelta,
    };
  }, [diffRows, versionA, versionB]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return diffRows.filter((r) => {
      if (showDiffsOnly && r.changeType === 'unchanged') return false;

      if (selectedChangeTypeFilter !== 'all' && r.changeType !== selectedChangeTypeFilter) {
        return false;
      }

      if (selectedCategoryFilter !== 'all') {
        const cat = r.category.toLowerCase();
        if (!cat.includes(selectedCategoryFilter.toLowerCase())) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = r.itemCode.toLowerCase().includes(q);
        const matchesName = r.itemName.toLowerCase().includes(q);
        const matchesPhase =
          (r.additionPhaseA && r.additionPhaseA.toLowerCase().includes(q)) ||
          (r.additionPhaseB && r.additionPhaseB.toLowerCase().includes(q));
        if (!matchesCode && !matchesName && !matchesPhase) return false;
      }

      return true;
    });
  }, [diffRows, showDiffsOnly, selectedChangeTypeFilter, selectedCategoryFilter, searchQuery]);

  // Helper for change badge
  const getChangeBadge = (type: DiffChangeType) => {
    switch (type) {
      case 'added':
        return {
          label: '+ ADDED',
          bg: 'bg-emerald-100/80 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-600',
        };
      case 'removed':
        return {
          label: '- REMOVED',
          bg: 'bg-rose-100/80 text-rose-800 border-rose-300',
          dot: 'bg-rose-600',
        };
      case 'modified':
        return {
          label: '~ MODIFIED',
          bg: 'bg-amber-100/80 text-amber-800 border-amber-300',
          dot: 'bg-amber-600',
        };
      case 'unchanged':
      default:
        return {
          label: '= UNCHANGED',
          bg: 'bg-gray-100 text-gray-700 border-gray-300',
          dot: 'bg-gray-400',
        };
    }
  };

  // Export to CSV
  const handleExportDiff = () => {
    const headers = [
      'Diff Status',
      'Item Code',
      'Item Description',
      'Category',
      `Qty (${versionA.version})`,
      `Qty (${versionB.version})`,
      'Qty Delta',
      'UOM',
      `Cost (${versionA.version})`,
      `Cost (${versionB.version})`,
      'Cost Delta (₹)',
      'Field Alterations',
    ];

    const rows = diffRows.map((r) => [
      r.changeType.toUpperCase(),
      `"${r.itemCode}"`,
      `"${r.itemName}"`,
      `"${r.category}"`,
      r.qtyA,
      r.qtyB,
      r.qtyDelta,
      r.uom,
      r.costA.toFixed(2),
      r.costB.toFixed(2),
      r.costDelta.toFixed(2),
      `"${r.fieldChanges.map((f) => `${f.label}: ${f.oldVal} -> ${f.newVal}`).join('; ')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `BOM_Diff_${versionA.parent}_${versionA.version}_vs_${versionB.version}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported BOM Revision Diff to CSV`);
  };

  // Related ECO if versionB has ecoNumber
  const linkedEco = useMemo<EngineeringChangeOrder | undefined>(() => {
    const ecoNum = versionB.ecoNumber || versionA.ecoNumber;
    if (!ecoNum) return undefined;
    return INITIAL_ECOS.find((e) => e.ecoNumber === ecoNum || e.id === ecoNum);
  }, [versionA, versionB]);

  return (
    <div className="space-y-5">
      {/* 1. Header Toolbar with Direct Navigation to Real BOM Screens */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E4E0D6]">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('bomList')}
            className="p-2 text-gray-500 hover:text-[#14213D] hover:bg-white rounded-xl border border-[#E4E0D6] transition-colors shadow-2xs"
            title="Back to BOM Master Grid"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#0F8B8D] font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                <GitCompare className="w-3 h-3" /> Visual Revision Diff Tool
              </span>
              <span className="text-[11px] text-gray-400">&bull;</span>
              <span className="text-[11px] text-gray-500 font-mono">
                {versionA.parent} ({versionA.version} &rarr; {versionB.version})
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#14213D] flex items-center gap-2">
              <span>BOM Version &amp; Diff Viewer</span>
            </h1>
          </div>
        </div>

        {/* Right Actions: Links to Real BOM Screens, ECO, Print, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Links to Real BOM Screen for Active Target / Baseline */}
          <div className="flex items-center bg-[#F6F4EF] p-1 rounded-xl border border-[#E4E0D6] gap-1">
            <button
              onClick={() => onNavigate('bomBuilder', { id: versionB.bomId })}
              className="px-2.5 py-1 text-xs font-semibold text-[#14213D] hover:bg-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title={`Open ${versionB.bomId} in BOM Builder`}
            >
              <Edit2 className="w-3.5 h-3.5 text-[#0F8B8D]" />
              <span>Open in BOM Builder ({versionB.bomId})</span>
            </button>
            <button
              onClick={() => onNavigate('bomTree', { id: versionB.bomId })}
              className="p-1.5 text-gray-600 hover:text-[#0F8B8D] hover:bg-white rounded-lg transition-colors"
              title={`Open ${versionB.bomId} in Multi-Level Tree View`}
            >
              <FolderTree className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('bomList')}
              className="px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-white rounded-lg transition-colors"
              title="Return to Master BOM Catalog"
            >
              BOM Master Grid &rarr;
            </button>
          </div>

          {linkedEco && (
            <button
              onClick={() => onNavigate('ecoList', { id: linkedEco.id })}
              className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-purple-100 transition-colors shadow-2xs"
              title="Inspect Linked Engineering Change Order"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Linked {linkedEco.ecoNumber}</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="p-2 text-gray-500 hover:text-[#14213D] hover:bg-white rounded-xl border border-[#E4E0D6] transition-colors shadow-2xs"
            title="Print Diff Summary"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportDiff}
            className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 py-2 px-3 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export Diff Report
          </button>
        </div>
      </div>

      {/* 2. Version Comparison Selector Box (A vs B) */}
      <div className="panel bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Version A: Baseline Box */}
          <div className="flex-1 w-full bg-[#FAF9F5] border border-[#E4E0D6] rounded-xl p-3 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Baseline Version (A)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                  {versionA.version}
                </span>
                {realBomA && (
                  <button
                    onClick={() => onNavigate('bomBuilder', { id: versionA.bomId })}
                    className="text-[10px] text-[#0F8B8D] hover:underline font-semibold flex items-center gap-0.5"
                    title="Jump to Baseline Real BOM Screen"
                  >
                    Edit &rarr;
                  </button>
                )}
              </div>
            </div>
            <select
              value={versionAId}
              onChange={(e) => setVersionAId(e.target.value)}
              className="w-full text-xs font-bold text-[#14213D] bg-white border border-[#E4E0D6] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            >
              {allSnapshots.map((s) => (
                <option key={`a-${s.id}`} value={s.id}>
                  {s.parent} &mdash; {s.label}
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
              <span>Date: <strong className="text-gray-700">{versionA.effectiveDate}</strong></span>
              <span>Cost: <strong className="font-mono text-[#14213D]">₹{versionA.standardCost.toFixed(2)}</strong></span>
              <span>Author: <strong className="text-gray-700">{versionA.author}</strong></span>
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwapVersions}
            className="p-2.5 rounded-full bg-white border border-[#E4E0D6] hover:border-[#0F8B8D] hover:bg-[#F6F4EF] text-[#14213D] transition-all shadow-2xs shrink-0"
            title="Swap Baseline (A) and Revision (B)"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#0F8B8D]" />
          </button>

          {/* Version B: Comparison Target Box */}
          <div className="flex-1 w-full bg-teal-50/40 border border-teal-200 rounded-xl p-3 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F8B8D] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0F8B8D] animate-pulse" />
                Comparison Revision (B)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                  {versionB.version}
                </span>
                {realBomB && (
                  <button
                    onClick={() => onNavigate('bomBuilder', { id: versionB.bomId })}
                    className="text-[10px] text-[#0F8B8D] hover:underline font-bold flex items-center gap-0.5"
                    title="Jump to Revision Real BOM Screen"
                  >
                    Open Real BOM &rarr;
                  </button>
                )}
              </div>
            </div>
            <select
              value={versionBId}
              onChange={(e) => setVersionBId(e.target.value)}
              className="w-full text-xs font-bold text-[#14213D] bg-white border border-teal-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            >
              {allSnapshots.map((s) => (
                <option key={`b-${s.id}`} value={s.id}>
                  {s.parent} &mdash; {s.label}
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
              <span>Date: <strong className="text-gray-700">{versionB.effectiveDate}</strong></span>
              <span>Cost: <strong className="font-mono text-teal-800">₹{versionB.standardCost.toFixed(2)}</strong></span>
              <span>Status: <strong className="text-emerald-700">{versionB.status}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Presets for Instant Comparisons */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
          <span className="text-gray-400 font-semibold mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#E8622C]" /> Quick Presets:
          </span>
          <button
            onClick={() => {
              const b = allSnapshots.find((s) => s.id === 'BOM-1001-v2.0') || allSnapshots[1];
              const t = allSnapshots.find((s) => s.id.startsWith('BOM-1001-v2.1')) || allSnapshots[0];
              if (b) setVersionAId(b.id);
              if (t) setVersionBId(t.id);
              showToast('Loaded BOM-1001 UV Masterbatch Upgrade Diff');
            }}
            className="px-2.5 py-1 bg-[#FAF9F5] hover:bg-gray-200 text-gray-700 rounded-lg border border-[#E4E0D6] font-medium transition-colors"
          >
            BOM-1001: v2.0 vs v2.1 (Clariant UV ECO-084)
          </button>
          <button
            onClick={() => {
              const b = allSnapshots.find((s) => s.id.startsWith('BOM-1002-v1')) || allSnapshots[0];
              const t = allSnapshots.find((s) => s.id.startsWith('BOM-1002-v2')) || allSnapshots[1];
              if (b) setVersionAId(b.id);
              if (t) setVersionBId(t.id);
              showToast('Loaded BOM-1002 20% Regrind Study Diff');
            }}
            className="px-2.5 py-1 bg-[#FAF9F5] hover:bg-gray-200 text-gray-700 rounded-lg border border-[#E4E0D6] font-medium transition-colors"
          >
            BOM-1002: v1.0 vs v2.0 (20% Regrind Study)
          </button>
          <button
            onClick={() => {
              const b1 = allSnapshots.find((s) => s.bomId === 'BOM-1001') || allSnapshots[0];
              const b4 = allSnapshots.find((s) => s.bomId === 'BOM-1004') || allSnapshots[allSnapshots.length - 1];
              if (b1) setVersionAId(b1.id);
              if (b4) setVersionBId(b4.id);
              showToast('Loaded 500ml vs 250ml Cross-Product Diff');
            }}
            className="px-2.5 py-1 bg-[#FAF9F5] hover:bg-gray-200 text-gray-700 rounded-lg border border-[#E4E0D6] font-medium transition-colors"
          >
            Cross-Variant: 500ml vs 250ml Cosmetic Tub
          </button>
        </div>

        {/* Change Reason Note if available */}
        {versionB.changeReason && (
          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E8622C] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-[#14213D]">Change Justification ({versionB.version}): </span>
              <span>{versionB.changeReason}</span>
              {versionB.ecoNumber && (
                <span
                  className="ml-1.5 font-mono text-[11px] font-bold text-purple-700 underline cursor-pointer"
                  onClick={() => onNavigate('ecoList')}
                >
                  Ref: {versionB.ecoNumber}
                </span>
              )}
            </div>
            {realBomB && (
              <button
                onClick={() => onNavigate('bomBuilder', { id: realBomB.id })}
                className="text-[11px] font-bold text-[#0F8B8D] hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                <span>Edit in Real BOM</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Executive Variance & Impact Summary Card (KPI Ribbon) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Cost Variance */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Unit Cost Delta</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-lg font-bold font-mono ${
                metrics.costDelta > 0
                  ? 'text-rose-600'
                  : metrics.costDelta < 0
                  ? 'text-emerald-700'
                  : 'text-[#14213D]'
              }`}
            >
              {metrics.costDelta > 0 ? `+₹${metrics.costDelta.toFixed(2)}` : `₹${metrics.costDelta.toFixed(2)}`}
            </span>
            <span className="text-[10px] font-mono text-gray-500">
              ({metrics.costDeltaPct > 0 ? `+${metrics.costDeltaPct}%` : `${metrics.costDeltaPct}%`})
            </span>
          </div>
          <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
            {metrics.costDelta > 0 ? (
              <span className="text-amber-700 font-medium">Cost Increase</span>
            ) : metrics.costDelta < 0 ? (
              <span className="text-emerald-700 font-medium">Cost Reduction</span>
            ) : (
              <span>Cost Neutral</span>
            )}
          </div>
        </div>

        {/* Change Counts */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Modified Lines</span>
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-700">
            {metrics.modifiedCount} <span className="text-xs font-normal text-gray-500 font-sans">Components</span>
          </div>
          <div className="text-[10px] text-gray-400">Specs or dosage changed</div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Added Components</span>
            <Boxes className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-700">
            +{metrics.addedCount} <span className="text-xs font-normal text-gray-500 font-sans">New items</span>
          </div>
          <div className="text-[10px] text-gray-400">Introduced in {versionB.version}</div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Removed Components</span>
            <X className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-bold font-mono text-rose-700">
            -{metrics.removedCount} <span className="text-xs font-normal text-gray-500 font-sans">Deleted</span>
          </div>
          <div className="text-[10px] text-gray-400">Phased out in {versionB.version}</div>
        </div>

        {/* Mass Balance */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Batch Mass Delta</span>
            <Scale className="w-3.5 h-3.5 text-[#0F8B8D]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#14213D]">
            {metrics.massDelta > 0 ? `+${metrics.massDelta}` : `${metrics.massDelta}`}{' '}
            <span className="text-xs font-normal text-gray-500 font-sans">KG</span>
          </div>
          <div className="text-[10px] text-gray-400">Total batch formulation mass</div>
        </div>

        {/* Scrap & Yield Delta */}
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Scrap Rate Delta</span>
            <TrendingDown className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-lg font-bold font-mono text-teal-800">
            {metrics.scrapDelta > 0 ? `+${metrics.scrapDelta}%` : `${metrics.scrapDelta}%`}
          </div>
          <div className="text-[10px] text-gray-400">
            {metrics.scrapDelta < 0 ? 'Improved production yield' : 'Scrap variance'}
          </div>
        </div>
      </div>

      {/* 4. Interactive Diff Navigation & Filter Bar with Autocomplete Search */}
      <div className="panel bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#F6F4EF] p-1 rounded-xl border border-[#E4E0D6]">
          <button
            onClick={() => setDiffViewMode('unified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              diffViewMode === 'unified'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Unified Diff</span>
          </button>
          <button
            onClick={() => setDiffViewMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              diffViewMode === 'split'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Side-by-Side Split</span>
          </button>
          <button
            onClick={() => setDiffViewMode('formulation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              diffViewMode === 'formulation'
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Formulation Shift</span>
          </button>
        </div>

        {/* Center: Search inside Diff with Live Autocomplete Popover */}
        <div ref={searchContainerRef} className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5 z-10" />
          <input
            type="text"
            placeholder="Search any item code, name, resin, phase..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsAutocompleteOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsAutocompleteOpen(true);
            }}
            className="w-full text-xs pl-8 pr-8 py-1.5 border rounded-lg bg-[#FAF9F5] border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsAutocompleteOpen(false);
              }}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete Dropdown List */}
          {isAutocompleteOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E4E0D6] rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-gray-100">
              <div className="p-2 bg-[#FAF9F5] border-b border-[#E4E0D6] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <span>Matching Items ({autocompleteResults.length})</span>
                <span className="text-[9px] text-[#0F8B8D]">Click to inspect or filter</span>
              </div>
              {autocompleteResults.length > 0 ? (
                autocompleteResults.map((item) => (
                  <div
                    key={item.code}
                    onClick={() => {
                      setSearchQuery(item.code);
                      setIsAutocompleteOpen(false);
                      // If item is in diff, open inspector directly
                      const matchRow = diffRows.find((r) => r.itemCode === item.code);
                      if (matchRow) {
                        setInspectingRow(matchRow);
                      }
                    }}
                    className="p-2.5 hover:bg-[#F6F4EF] cursor-pointer transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#14213D]">{item.code}</span>
                        {item.inDiff ? (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              item.diffChangeType === 'added'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.diffChangeType === 'removed'
                                ? 'bg-rose-100 text-rose-800'
                                : item.diffChangeType === 'modified'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            In Current Diff ({item.diffChangeType})
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Master Catalog
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-600 truncate">{item.name}</div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 font-mono">{item.category}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('itemDetail', { code: item.code });
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-[#0F8B8D]"
                        title="View Master Item Screen"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-gray-400">
                  No components found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: "Show Only Differences" toggle & Category Filter */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none bg-[#FAF9F5] px-2.5 py-1.5 rounded-lg border border-[#E4E0D6]">
            <input
              type="checkbox"
              checked={showDiffsOnly}
              onChange={(e) => setShowDiffsOnly(e.target.checked)}
              className="rounded border-gray-300 text-[#0F8B8D] focus:ring-[#0F8B8D] w-3.5 h-3.5"
            />
            <span>Changes Only ({metrics.totalChanges})</span>
          </label>

          <select
            value={selectedChangeTypeFilter}
            onChange={(e) => setSelectedChangeTypeFilter(e.target.value)}
            className="text-xs bg-[#FAF9F5] border border-[#E4E0D6] rounded-lg px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          >
            <option value="all">All Change Types</option>
            <option value="modified">Modified Only (~{metrics.modifiedCount})</option>
            <option value="added">Added Only (+{metrics.addedCount})</option>
            <option value="removed">Removed Only (-{metrics.removedCount})</option>
            <option value="unchanged">Unchanged Only (={metrics.unchangedCount})</option>
          </select>
        </div>
      </div>

      {/* 5. Main Diff Display View */}

      {/* Mode A: Unified Table Diff (GitHub / GitLab Style) */}
      {diffViewMode === 'unified' && (
        <div className="panel bg-white rounded-2xl border border-[#E4E0D6] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-gray-600 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3 w-28">Status</th>
                  <th className="py-3 px-3">Component / Spec</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Qty ({versionA.version})</th>
                  <th className="py-3 px-3 text-right">Qty ({versionB.version})</th>
                  <th className="py-3 px-3 text-right">Cost Delta</th>
                  <th className="py-3 px-3">Altered Attributes</th>
                  <th className="py-3 px-3 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => {
                    const badge = getChangeBadge(row.changeType);

                    // Row background styling
                    const rowBg =
                      row.changeType === 'added'
                        ? 'bg-emerald-50/50 hover:bg-emerald-50'
                        : row.changeType === 'removed'
                        ? 'bg-rose-50/50 hover:bg-rose-50'
                        : row.changeType === 'modified'
                        ? 'bg-amber-50/40 hover:bg-amber-50/80'
                        : 'hover:bg-[#FAF9F5]';

                    return (
                      <tr key={row.key} className={`transition-colors ${rowBg}`}>
                        {/* Status Badge */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>

                        {/* Component Item */}
                        <td className="py-2.5 px-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono font-bold text-xs ${
                                  row.changeType === 'removed'
                                    ? 'line-through text-rose-800'
                                    : row.changeType === 'added'
                                    ? 'text-emerald-800'
                                    : 'text-[#14213D]'
                                }`}
                              >
                                {row.itemCode}
                              </span>
                              {row.isCritical && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                                  Critical
                                </span>
                              )}
                            </div>
                            <div className="text-gray-600 text-[11px] truncate max-w-xs">
                              {row.itemName}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3 text-gray-500 text-[11px] whitespace-nowrap">
                          {row.category}
                        </td>

                        {/* Baseline Qty (A) */}
                        <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                          {row.lineA ? `${row.qtyA} ${row.uom}` : <span className="text-gray-300">&mdash;</span>}
                        </td>

                        {/* Target Qty (B) */}
                        <td className="py-2.5 px-3 text-right font-mono">
                          {row.lineB ? (
                            <span
                              className={`font-bold ${
                                row.qtyDelta > 0
                                  ? 'text-emerald-700'
                                  : row.qtyDelta < 0
                                  ? 'text-amber-700'
                                  : 'text-gray-800'
                              }`}
                            >
                              {row.qtyB} {row.uom}
                            </span>
                          ) : (
                            <span className="text-gray-300">&mdash;</span>
                          )}
                        </td>

                        {/* Cost Delta */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          {row.costDelta !== 0 ? (
                            <span
                              className={
                                row.costDelta > 0 ? 'text-rose-700' : 'text-emerald-700'
                              }
                            >
                              {row.costDelta > 0 ? `+₹${row.costDelta.toFixed(2)}` : `-₹${Math.abs(row.costDelta).toFixed(2)}`}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-normal">₹0.00</span>
                          )}
                        </td>

                        {/* Altered Attributes / Diff Chips */}
                        <td className="py-2.5 px-3">
                          {row.fieldChanges.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {row.fieldChanges.map((f, i) => (
                                <div
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E4E0D6] shadow-2xs font-mono flex items-center gap-1"
                                >
                                  <span className="text-gray-500 font-sans">{f.label}:</span>
                                  <span className="line-through text-gray-400">{f.oldVal}</span>
                                  <span className="text-gray-400">&rarr;</span>
                                  <span className="font-bold text-[#14213D]">{f.newVal}</span>
                                  {f.delta && (
                                    <span className="text-purple-700 font-semibold">({f.delta})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">Identical specification</span>
                          )}
                        </td>

                        {/* Action buttons: Inspect diff and View in Real Item Master / Real BOM */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setInspectingRow(row)}
                              className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                              title="Inspect field level differences"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onNavigate('itemDetail', { code: row.itemCode })}
                              className="p-1 hover:bg-teal-50 rounded text-[#0F8B8D] transition-colors"
                              title={`View ${row.itemCode} in Item Master`}
                            >
                              <Package className="w-3.5 h-3.5" />
                            </button>
                            {realBomB && (
                              <button
                                onClick={() => onNavigate('bomBuilder', { id: realBomB.id })}
                                className="p-1 hover:bg-purple-50 rounded text-purple-700 transition-colors"
                                title={`Open ${realBomB.id} in BOM Builder`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 text-xs">
                      No components found matching your current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode B: Side-by-Side Split View (VS Code / Arena PLM Style) */}
      {diffViewMode === 'split' && (
        <div className="panel bg-white rounded-2xl border border-[#E4E0D6] shadow-2xs overflow-hidden">
          {/* Column Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E4E0D6] bg-[#FAF9F5] border-b border-[#E4E0D6]">
            <div className="p-3 font-bold text-xs text-[#14213D] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                Baseline Version: {versionA.version} &mdash; {versionA.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-500">₹{versionA.standardCost.toFixed(2)}</span>
                {realBomA && (
                  <button
                    onClick={() => onNavigate('bomBuilder', { id: versionA.bomId })}
                    className="text-[10px] text-[#0F8B8D] hover:underline"
                    title="Open Baseline in BOM Builder"
                  >
                    Edit &rarr;
                  </button>
                )}
              </div>
            </div>
            <div className="p-3 font-bold text-xs text-[#0F8B8D] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F8B8D]" />
                Revision Target: {versionB.version} &mdash; {versionB.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-teal-800">₹{versionB.standardCost.toFixed(2)}</span>
                {realBomB && (
                  <button
                    onClick={() => onNavigate('bomBuilder', { id: versionB.bomId })}
                    className="text-[10px] text-[#0F8B8D] hover:underline font-bold"
                    title="Open Target in BOM Builder"
                  >
                    Edit Real BOM &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Synchronized Row Comparison */}
          <div className="divide-y divide-gray-100 text-xs">
            {filteredRows.map((row) => {
              const isMod = row.changeType === 'modified';
              const isAdd = row.changeType === 'added';
              const isRem = row.changeType === 'removed';

              return (
                <div
                  key={row.key}
                  className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 hover:bg-[#FAF9F5] transition-colors"
                >
                  {/* Left (Version A) */}
                  <div
                    className={`p-3 space-y-1.5 ${
                      isRem
                        ? 'bg-rose-50/60'
                        : isMod
                        ? 'bg-amber-50/30'
                        : isAdd
                        ? 'bg-gray-50/40 text-gray-400 italic'
                        : 'bg-white'
                    }`}
                  >
                    {row.lineA ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#14213D]">{row.lineA.item}</span>
                            <span className="text-gray-500">&mdash; {row.lineA.name}</span>
                          </div>
                          <span className="font-mono font-bold text-[#14213D]">
                            {row.lineA.qty} {row.lineA.uom}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-3 mt-1 font-mono">
                          <span>Cost: ₹{(row.lineA.cost || 0).toFixed(2)}</span>
                          <span>Scrap: {row.lineA.scrap}%</span>
                          {row.lineA.additionPhase && <span>Phase: {row.lineA.additionPhase}</span>}
                          {row.lineA.dosageRate && <span>Dosage: {row.lineA.dosageRate}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-gray-400">
                        &mdash; Component did not exist in Baseline ({versionA.version}) &mdash;
                      </div>
                    )}
                  </div>

                  {/* Right (Version B) */}
                  <div
                    className={`p-3 space-y-1.5 ${
                      isAdd
                        ? 'bg-emerald-50/60'
                        : isMod
                        ? 'bg-amber-50/30'
                        : isRem
                        ? 'bg-gray-50/40 text-gray-400 italic'
                        : 'bg-white'
                    }`}
                  >
                    {row.lineB ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#14213D]">{row.lineB.item}</span>
                            <span className="text-gray-500">&mdash; {row.lineB.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-teal-800">
                              {row.lineB.qty} {row.lineB.uom}
                            </span>
                            <button
                              onClick={() => onNavigate('itemDetail', { code: row.lineB?.item })}
                              className="text-gray-400 hover:text-[#0F8B8D]"
                              title="View in Item Master"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-3 mt-1 font-mono">
                          <span>Cost: ₹{(row.lineB.cost || 0).toFixed(2)}</span>
                          <span>Scrap: {row.lineB.scrap}%</span>
                          {row.lineB.additionPhase && <span>Phase: {row.lineB.additionPhase}</span>}
                          {row.lineB.dosageRate && <span>Dosage: {row.lineB.dosageRate}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-gray-400">
                        &mdash; Component phased out / removed in Revision ({versionB.version}) &mdash;
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode C: Visual Formulation Shift & Cost Delta Breakdown */}
      {diffViewMode === 'formulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Formulation Mass Comparison */}
          <div className="panel bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E0D6]">
              <div>
                <h3 className="font-bold text-[#14213D] text-sm">Ingredient Share &amp; Dosage Comparison</h3>
                <p className="text-xs text-gray-500">Component quantity distribution in batch</p>
              </div>
              <Scale className="w-4 h-4 text-[#0F8B8D]" />
            </div>

            <div className="space-y-3">
              {diffRows.map((row) => {
                const maxVal = Math.max(row.qtyA, row.qtyB, 0.001);
                return (
                  <div key={`form-${row.key}`} className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#14213D]">
                        {row.itemCode} &mdash; <span className="font-normal text-gray-600">{row.itemName}</span>
                      </span>
                      <span className="font-mono text-[11px] text-gray-500">
                        {row.category}
                      </span>
                    </div>

                    {/* Progress bars comparison */}
                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-gray-400">{versionA.version}:</span>
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, (row.qtyA / maxVal) * 100)}%` }}
                          />
                        </div>
                        <span className="w-20 text-right text-gray-700">{row.qtyA} {row.uom}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-[#0F8B8D] font-bold">{versionB.version}:</span>
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#0F8B8D] h-full rounded-full"
                            style={{ width: `${Math.min(100, (row.qtyB / maxVal) * 100)}%` }}
                          />
                        </div>
                        <span className="w-20 text-right font-bold text-teal-800">{row.qtyB} {row.uom}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost Delta Impact Waterfall */}
          <div className="panel bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E0D6]">
              <div>
                <h3 className="font-bold text-[#14213D] text-sm">Extended Cost Variance Drivers</h3>
                <p className="text-xs text-gray-500">Which materials drive the revision cost delta</p>
              </div>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="space-y-3">
              {diffRows
                .filter((r) => r.costDelta !== 0)
                .map((row) => {
                  const isCostUp = row.costDelta > 0;
                  return (
                    <div
                      key={`cost-delta-${row.key}`}
                      className="p-3 bg-white border border-[#E4E0D6] rounded-xl flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#14213D]">{row.itemCode}</span>
                          <span className="text-gray-600 truncate max-w-xs">{row.itemName}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          ₹{row.costA.toFixed(2)} &rarr; ₹{row.costB.toFixed(2)}
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span
                          className={`text-sm font-bold flex items-center justify-end gap-1 ${
                            isCostUp ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isCostUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {isCostUp ? `+₹${row.costDelta.toFixed(2)}` : `-₹${Math.abs(row.costDelta).toFixed(2)}`}
                        </span>
                        <span className="text-[10px] text-gray-400 block">per batch unit</span>
                      </div>
                    </div>
                  );
                })}

              {diffRows.filter((r) => r.costDelta !== 0).length === 0 && (
                <div className="p-8 text-center text-gray-400 text-xs">
                  Zero cost variance between selected revisions. Standard cost is identical.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Deep Field-Level Inspector Drawer / Modal */}
      {inspectingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E4E0D6] shadow-2xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
              <div>
                <span className="text-[10px] font-mono text-[#0F8B8D] font-bold uppercase tracking-wider">
                  Detailed Attribute Diff
                </span>
                <h3 className="text-base font-bold text-[#14213D] flex items-center gap-2">
                  <span>{inspectingRow.itemCode}</span>
                  <span className="text-xs font-normal text-gray-600">&mdash; {inspectingRow.itemName}</span>
                </h3>
              </div>
              <button
                onClick={() => setInspectingRow(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Change Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  getChangeBadge(inspectingRow.changeType).bg
                }`}
              >
                {getChangeBadge(inspectingRow.changeType).label}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                Category: {inspectingRow.category}
              </span>
            </div>

            {/* Field-by-Field Breakdown Table */}
            <div className="border border-[#E4E0D6] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-gray-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Attribute</th>
                    <th className="p-2.5">Baseline ({versionA.version})</th>
                    <th className="p-2.5">Revision ({versionB.version})</th>
                    <th className="p-2.5">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs">
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-gray-700">Quantity / Batch</td>
                    <td className="p-2.5 text-gray-600">{inspectingRow.qtyA} {inspectingRow.uom}</td>
                    <td className="p-2.5 font-bold text-[#14213D]">{inspectingRow.qtyB} {inspectingRow.uom}</td>
                    <td className="p-2.5 text-purple-700">{inspectingRow.qtyDelta}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-gray-700">Unit Cost</td>
                    <td className="p-2.5 text-gray-600">₹{(inspectingRow.lineA?.cost || 0).toFixed(2)}</td>
                    <td className="p-2.5 font-bold text-[#14213D]">₹{(inspectingRow.lineB?.cost || 0).toFixed(2)}</td>
                    <td className="p-2.5 font-bold text-emerald-700">
                      ₹{((inspectingRow.lineB?.cost || 0) - (inspectingRow.lineA?.cost || 0)).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-gray-700">Scrap %</td>
                    <td className="p-2.5 text-gray-600">{inspectingRow.lineA?.scrap || 0}%</td>
                    <td className="p-2.5 font-bold text-[#14213D]">{inspectingRow.lineB?.scrap || 0}%</td>
                    <td className="p-2.5">
                      {((inspectingRow.lineB?.scrap || 0) - (inspectingRow.lineA?.scrap || 0)).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-gray-700">Addition Phase</td>
                    <td className="p-2.5 text-gray-600">{inspectingRow.additionPhaseA || 'None'}</td>
                    <td className="p-2.5 font-bold text-[#14213D]">{inspectingRow.additionPhaseB || 'None'}</td>
                    <td className="p-2.5 text-gray-400">&mdash;</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-gray-700">Dosage Rate</td>
                    <td className="p-2.5 text-gray-600">{inspectingRow.dosageRateA || 'N/A'}</td>
                    <td className="p-2.5 font-bold text-[#14213D]">{inspectingRow.dosageRateB || 'N/A'}</td>
                    <td className="p-2.5 text-gray-400">&mdash;</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Inventory Status & Actions for Component */}
            <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Warehouse Stock &amp; Real Links
              </span>
              <div className="text-xs text-gray-700 flex flex-wrap items-center justify-between gap-2">
                <span>Stock Strategy: <strong>Use Up Existing Stock before Cutover</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setInspectingRow(null);
                      onNavigate('itemDetail', { code: inspectingRow.itemCode });
                    }}
                    className="text-xs text-[#0F8B8D] font-bold hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded border border-[#E4E0D6]"
                  >
                    <ExternalLink className="w-3 h-3" /> View Item Master
                  </button>
                  {realBomB && (
                    <button
                      onClick={() => {
                        setInspectingRow(null);
                        onNavigate('bomBuilder', { id: realBomB.id });
                      }}
                      className="text-xs text-purple-700 font-bold hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded border border-[#E4E0D6]"
                    >
                      <Edit2 className="w-3 h-3" /> Edit in Real BOM
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectingRow(null)}
                className="btn btn-sm btn-ghost border border-[#E4E0D6] text-xs px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
