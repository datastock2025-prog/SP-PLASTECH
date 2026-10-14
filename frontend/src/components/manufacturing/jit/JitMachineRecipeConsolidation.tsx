import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Boxes,
  Layers,
  Store,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Package,
  Droplets,
  Palette,
  Sparkles,
  Info,
} from 'lucide-react';
import { MachineMaster, ItemMaster, BomMaster } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';
import { PlannedMachineJob, StoreInventoryNode, MaterialCategory } from './jitTypes';
import {
  categorizeBomLine,
  parseStockNumber,
  getSyntheticRecipeForPart,
} from './jitCalculations';

interface Props {
  scheduleNumber: string;
  selectedDate: string;
  jobs: PlannedMachineJob[];
  machines: MachineMaster[];
  items: ItemMaster[];
  molds: MoldMaster[];
  boms: BomMaster[];
  stores: StoreInventoryNode[];
}

export interface MachineRecipeDetail {
  materialCode: string;
  materialName: string;
  category: MaterialCategory;
  categoryLabel: string;
  unitDosage: number; // dosage per piece
  uom: string;
  requiredQty: number; // total for this machine on this date
  availableStock: number;
  storeLocation: string;
  storeCode: string;
  isShortage: boolean;
}

export interface MachineRecipeDemand {
  job: PlannedMachineJob;
  machine?: MachineMaster;
  item?: ItemMaster;
  mold?: MoldMaster;
  totalResinKg: number;
  totalMasterbatchKg: number;
  totalPackagingUnits: number;
  totalInserts: number;
  hasShortage: boolean;
  recipes: MachineRecipeDetail[];
}

export const JitMachineRecipeConsolidation: React.FC<Props> = ({
  scheduleNumber,
  selectedDate,
  jobs,
  machines,
  items,
  molds,
  boms,
  stores,
}) => {
  const [subView, setSubView] = useState<'by_machine' | 'matrix'>('by_machine');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'RM' | 'MB' | 'PCK' | 'INSERT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedMachineIds, setExpandedMachineIds] = useState<Record<string, boolean>>({});

  // Helper maps
  const storeMap = useMemo(() => new Map<string, StoreInventoryNode>(stores.map((s) => [s.code, s])), [stores]);
  const itemMap = useMemo(() => new Map<string, ItemMaster>(items.map((i) => [i.code, i])), [items]);
  const machineMap = useMemo(() => new Map<string, MachineMaster>(machines.map((m) => [m.id, m])), [machines]);

  // Compute Machine-by-Machine Recipe Demands
  const machineDemands: MachineRecipeDemand[] = useMemo(() => {
    return jobs.map((job) => {
      const machine = machineMap.get(job.machineId);
      const item = itemMap.get(job.itemCode);
      const mold = molds.find((m) => m.id === job.moldId);
      const bom = boms.find((b) => b.parent === job.itemCode);

      const lines =
        bom && bom.lines && bom.lines.length > 0
          ? bom.lines
          : item
          ? getSyntheticRecipeForPart(item)
          : [];

      let resinKg = 0;
      let mbKg = 0;
      let packagingUnits = 0;
      let insertsCount = 0;
      let machineHasShortage = false;

      const recipes: MachineRecipeDetail[] = lines.map((line) => {
        const matItem = itemMap.get(line.item);
        const catInfo = categorizeBomLine(line, matItem);
        const scrapFactor = 1 + (line.scrap || 0) / 100;
        const unitDosage = (line.qty || 0) * scrapFactor;
        const requiredQty = unitDosage * job.calculatedPcs;
        const available = matItem ? parseStockNumber(matItem.avail || matItem.stock) : 0;
        const storeCode = matItem?.wh || catInfo.defaultStore;
        const storeObj = storeMap.get(storeCode);
        const storeLocation = storeObj ? `${storeObj.code} (${storeObj.name})` : storeCode;
        const isShortage = available < requiredQty;

        if (isShortage) machineHasShortage = true;

        if (catInfo.cat === 'RM') resinKg += requiredQty;
        else if (catInfo.cat === 'MB') mbKg += requiredQty;
        else if (catInfo.cat === 'PCK') packagingUnits += requiredQty;
        else if (catInfo.cat === 'INSERT') insertsCount += requiredQty;

        return {
          materialCode: line.item,
          materialName: line.name || matItem?.name || line.item,
          category: catInfo.cat,
          categoryLabel: catInfo.label,
          unitDosage,
          uom: line.uom || matItem?.baseUOM || 'KG',
          requiredQty,
          availableStock: available,
          storeLocation,
          storeCode,
          isShortage,
        };
      });

      return {
        job,
        machine,
        item,
        mold,
        totalResinKg: resinKg,
        totalMasterbatchKg: mbKg,
        totalPackagingUnits: packagingUnits,
        totalInserts: insertsCount,
        hasShortage: machineHasShortage,
        recipes,
      };
    });
  }, [jobs, machineMap, itemMap, molds, boms, storeMap]);

  // Aggregate totals across all machines on this date
  const aggregateTotals = useMemo(() => {
    let totalResin = 0;
    let totalMb = 0;
    let totalPck = 0;
    let totalInserts = 0;
    let totalShortages = 0;

    machineDemands.forEach((md) => {
      totalResin += md.totalResinKg;
      totalMb += md.totalMasterbatchKg;
      totalPck += md.totalPackagingUnits;
      totalInserts += md.totalInserts;
      if (md.hasShortage) totalShortages++;
    });

    return {
      totalResin,
      totalMb,
      totalPck,
      totalInserts,
      totalShortages,
    };
  }, [machineDemands]);

  // Matrix View Data: Materials grouped across machines
  const matrixData = useMemo(() => {
    const matMap = new Map<
      string,
      {
        materialCode: string;
        materialName: string;
        category: MaterialCategory;
        categoryLabel: string;
        uom: string;
        storeLocation: string;
        availableStock: number;
        machineRequirements: Record<string, number>; // machineId -> requiredQty
        totalRequired: number;
      }
    >();

    machineDemands.forEach((md) => {
      md.recipes.forEach((rec) => {
        if (!matMap.has(rec.materialCode)) {
          matMap.set(rec.materialCode, {
            materialCode: rec.materialCode,
            materialName: rec.materialName,
            category: rec.category,
            categoryLabel: rec.categoryLabel,
            uom: rec.uom,
            storeLocation: rec.storeLocation,
            availableStock: rec.availableStock,
            machineRequirements: {},
            totalRequired: 0,
          });
        }
        const entry = matMap.get(rec.materialCode)!;
        entry.machineRequirements[md.job.machineId] =
          (entry.machineRequirements[md.job.machineId] || 0) + rec.requiredQty;
        entry.totalRequired += rec.requiredQty;
      });
    });

    return Array.from(matMap.values());
  }, [machineDemands]);

  // Filtered lists
  const filteredMachineDemands = useMemo(() => {
    return machineDemands.filter((md) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchMachine = md.job.machineId.toLowerCase().includes(q);
        const matchItem = md.job.itemCode.toLowerCase().includes(q) || md.job.itemName.toLowerCase().includes(q);
        const matchMat = md.recipes.some(
          (r) => r.materialCode.toLowerCase().includes(q) || r.materialName.toLowerCase().includes(q)
        );
        if (!matchMachine && !matchItem && !matchMat) return false;
      }
      return true;
    });
  }, [machineDemands, searchQuery]);

  const filteredMatrixData = useMemo(() => {
    return matrixData.filter((row) => {
      if (categoryFilter !== 'ALL' && row.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return row.materialCode.toLowerCase().includes(q) || row.materialName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [matrixData, categoryFilter, searchQuery]);

  const toggleMachineExpand = (machineId: string) => {
    setExpandedMachineIds((prev) => ({
      ...prev,
      [machineId]: !prev[machineId],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    machineDemands.forEach((md) => {
      all[md.job.machineId] = true;
    });
    setExpandedMachineIds(all);
  };

  const collapseAll = () => {
    setExpandedMachineIds({});
  };

  const handlePrintDispensingSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Consolidated Top Summary Cards for this Date's Machines */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span>Scheduled Machines</span>
          </span>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {jobs.length}{' '}
            <span className="text-xs font-normal text-slate-500">
              IMMs on {selectedDate}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">Total active machine lines</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-blue-600" />
            <span>Total Resin (RM) Needed</span>
          </span>
          <div className="text-xl font-extrabold text-blue-700 font-mono">
            {Math.round(aggregateTotals.totalResin).toLocaleString()}{' '}
            <span className="text-xs font-bold text-slate-500">KG</span>
          </div>
          <div className="text-[10px] text-blue-600 font-medium">Polymer for {jobs.length} machines</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-600" />
            <span>Masterbatch (MB) Needed</span>
          </span>
          <div className="text-xl font-extrabold text-purple-700 font-mono">
            {aggregateTotals.totalMb.toFixed(1)}{' '}
            <span className="text-xs font-bold text-slate-500">KG</span>
          </div>
          <div className="text-[10px] text-purple-600 font-medium">Colorants & UV additives</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            <span>Packaging & Cartons</span>
          </span>
          <div className="text-xl font-extrabold text-emerald-700 font-mono">
            {Math.round(aggregateTotals.totalPck).toLocaleString()}{' '}
            <span className="text-xs font-bold text-slate-500">Units</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Master cartons / polybags</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1 col-span-2 sm:col-span-4 lg:col-span-1">
          <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-slate-600" />
            <span>Dispensing Feasibility</span>
          </span>
          <div className="text-sm font-extrabold font-mono pt-1">
            {aggregateTotals.totalShortages > 0 ? (
              <span className="inline-flex items-center gap-1 text-rose-600">
                <AlertTriangle className="w-4 h-4" /> {aggregateTotals.totalShortages} Machine Shortages
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> 100% Stock Ready
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">Stores coverage for date</div>
        </div>
      </div>

      {/* View Switcher, Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: View Mode Segmented Switcher */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 text-xs mr-1 hidden sm:inline">Consolidated View:</span>
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setSubView('by_machine')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all flex items-center gap-1.5 ${
                subView === 'by_machine'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Machine-by-Machine Breakdown</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                {jobs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubView('matrix')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all flex items-center gap-1.5 ${
                subView === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Cross-Machine Material Matrix</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                {matrixData.length} Materials
              </span>
            </button>
          </div>
        </div>

        {/* Right: Search, Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {subView === 'matrix' && (
            <div className="flex items-center gap-1">
              {(['ALL', 'RM', 'MB', 'PCK', 'INSERT'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL'
                    ? 'All Items'
                    : cat === 'RM'
                    ? 'Resin (RM)'
                    : cat === 'MB'
                    ? 'Color (MB)'
                    : cat === 'PCK'
                    ? 'Packing'
                    : 'Inserts'}
                </button>
              ))}
            </div>
          )}

          {subView === 'by_machine' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={expandAll}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px]"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px]"
              >
                Collapse All
              </button>
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search machine or material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
            />
          </div>

          {/* Print Dispensing Traveler */}
          <button
            type="button"
            onClick={handlePrintDispensingSlip}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors shadow-2xs text-xs"
            title="Print dispensing slip for raw material handling team"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print Dispensing Slip</span>
          </button>
        </div>
      </div>

      {/* MODE 1: Machine-by-Machine Recipe Demand Breakdown */}
      {subView === 'by_machine' && (
        <div className="space-y-3">
          {filteredMachineDemands.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
              No machines match the filter criteria on {selectedDate}.
            </div>
          ) : (
            filteredMachineDemands.map((md, idx) => {
              const isExpanded = expandedMachineIds[md.job.machineId] ?? true; // default expanded for visibility
              const totalMatCount = md.recipes.length;

              return (
                <div
                  key={md.job.id}
                  className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden transition-all"
                >
                  {/* Machine Demand Card Header */}
                  <div
                    onClick={() => toggleMachineExpand(md.job.machineId)}
                    className="p-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 cursor-pointer flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="p-1 text-slate-500 hover:text-slate-800 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-xs shadow-xs">
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 font-mono">
                            {md.job.machineId}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            ({md.machine?.tonnage || '250T'} • {md.machine?.line || 'Line 1'})
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-bold text-indigo-900">
                            {md.job.itemCode}
                          </span>
                          <span className="text-xs text-slate-500 truncate max-w-xs">
                            - {md.job.itemName}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 mt-0.5">
                          <span>Target: <strong className="text-slate-800 font-mono">{md.job.calculatedPcs.toLocaleString()} PCS</strong></span>
                          <span>•</span>
                          <span>Shift: <strong className="text-slate-700">{md.job.shift} ({md.job.plannedHours}h)</strong></span>
                          <span>•</span>
                          <span>Tool: <strong className="text-slate-700">{md.job.moldName} ({md.job.cavities} Cav)</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Machine Recipe Totals Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold">
                        RM: {md.totalResinKg.toFixed(1)} KG
                      </span>

                      <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-mono font-bold">
                        MB: {md.totalMasterbatchKg.toFixed(2)} KG
                      </span>

                      {md.totalPackagingUnits > 0 && (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
                          PK: {Math.round(md.totalPackagingUnits)} Boxes
                        </span>
                      )}

                      {md.hasShortage ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Shortage
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Stock Ready
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Recipe Material Lines for this Machine */}
                  {isExpanded && (
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
                            <th className="py-2 px-4">Material Code & Name</th>
                            <th className="py-2 px-4">Category</th>
                            <th className="py-2 px-4">Dosage / Piece</th>
                            <th className="py-2 px-4">Total Needed for this Machine</th>
                            <th className="py-2 px-4">Assigned Store / WH</th>
                            <th className="py-2 px-4">Available Stock</th>
                            <th className="py-2 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {md.recipes.map((rec) => (
                            <tr key={rec.materialCode} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-4">
                                <div className="font-bold text-slate-800">{rec.materialCode}</div>
                                <div className="text-[11px] text-slate-500">{rec.materialName}</div>
                              </td>
                              <td className="py-2.5 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    rec.category === 'RM'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : rec.category === 'MB'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : rec.category === 'INSERT'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {rec.categoryLabel}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-600">
                                {rec.unitDosage.toFixed(4)} {rec.uom}/pc
                              </td>
                              <td className="py-2.5 px-4 font-mono font-black text-slate-900 text-sm">
                                {rec.requiredQty.toFixed(2)} {rec.uom}
                              </td>
                              <td className="py-2.5 px-4 text-slate-600">
                                <div className="flex items-center gap-1">
                                  <Store className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="font-medium text-slate-800">{rec.storeLocation}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-700">
                                {rec.availableStock.toLocaleString()} {rec.uom}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {rec.isShortage ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" /> Shortage
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODE 2: Cross-Machine Material Matrix */}
      {subView === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-600" />
              <span>Cross-Machine Material Requirements Matrix for {selectedDate} ({scheduleNumber})</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Horizontal breakdown across {jobs.length} scheduled machines
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 sticky left-0 bg-slate-100 z-10">Material Item</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">UOM</th>
                  <th className="py-2.5 px-4 text-right bg-indigo-50/80 text-indigo-950 font-black">
                    Total Required (All M/Cs)
                  </th>
                  {jobs.map((job) => (
                    <th key={job.id} className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-800">
                      <div>{job.machineId}</div>
                      <div className="text-[9px] font-normal text-slate-500 truncate max-w-[90px]">
                        {job.itemCode}
                      </div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right">Store Balance</th>
                  <th className="py-2.5 px-3 text-center">Net Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredMatrixData.length === 0 ? (
                  <tr>
                    <td colSpan={jobs.length + 6} className="p-8 text-center text-xs text-slate-500">
                      No materials found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMatrixData.map((row, idx) => {
                    const isShortage = row.availableStock < row.totalRequired;
                    const diff = row.availableStock - row.totalRequired;

                    return (
                      <tr
                        key={row.materialCode}
                        className={`hover:bg-indigo-50/30 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                        }`}
                      >
                        {/* Material Item */}
                        <td className="py-3 px-4 sticky left-0 bg-inherit z-10">
                          <div className="font-bold text-slate-900">{row.materialCode}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{row.materialName}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Store className="w-3 h-3" /> {row.storeLocation}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.category === 'RM'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : row.category === 'MB'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : row.category === 'INSERT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {row.category}
                          </span>
                        </td>

                        {/* UOM */}
                        <td className="py-3 px-3 font-mono text-slate-500 font-semibold">{row.uom}</td>

                        {/* Total Required */}
                        <td className="py-3 px-4 text-right bg-indigo-50/50 font-mono font-black text-indigo-900 text-sm">
                          {row.totalRequired.toFixed(2)}
                        </td>

                        {/* Per-Machine Demands */}
                        {jobs.map((job) => {
                          const machineReq = row.machineRequirements[job.machineId] || 0;
                          return (
                            <td key={job.id} className="py-3 px-3 text-right font-mono">
                              {machineReq > 0 ? (
                                <span className="font-bold text-slate-800">{machineReq.toFixed(2)}</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Available Stock */}
                        <td className="py-3 px-3 text-right font-mono text-slate-700 font-medium">
                          {row.availableStock.toLocaleString()}
                        </td>

                        {/* Net Coverage */}
                        <td className="py-3 px-3 text-center">
                          {isShortage ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-mono">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {diff.toFixed(0)} {row.uom}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              +{diff.toFixed(0)} {row.uom}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
