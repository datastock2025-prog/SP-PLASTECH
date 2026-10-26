import { PaginationBar } from '@/src/components/common/PaginationBar';
import React, { useState } from 'react';
import { useGridUrlSync } from '@/src/shared/hooks';
import { BomMaster, ItemMaster, ApprovalStatus } from '@/src/types';
import {
  Boxes,
  Plus,
  Edit2,
  Upload,
  CheckCircle2,
  Clock,
  TrendingUp,
  Scale,
  Search,
  X,
  CheckSquare,
  ArrowUpDown,
  Check,
  FolderTree,
  Layers,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { masterDataGovernanceService } from '@/src/services/masterDataGovernanceService';

export interface EngineeringBomListViewProps {
  effectiveBoms: BomMaster[];
  boms: BomMaster[];
  items: ItemMaster[];
  isBomsLoading?: boolean;
  onNavigate: (view: string, param?: any) => void;
  onUpdateBom: (bom: BomMaster) => void;
  onDeleteBom: (id: string) => void;
  onOpenQuickModify: (bom: BomMaster) => void;
  onOpenWizard: (parentItem?: ItemMaster | null) => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
  renderStatusBadge: (status: ApprovalStatus | string) => React.ReactNode;
}

export const EngineeringBomListView: React.FC<EngineeringBomListViewProps> = ({
  effectiveBoms,
  boms,
  items,
  isBomsLoading,
  onNavigate,
  onUpdateBom,
  onDeleteBom,
  onOpenQuickModify,
  onOpenWizard,
  openConfirm,
  showToast,
  renderStatusBadge,
}) => {
  const {
    page: currentPage,
    pageSize,
    search: searchQuery,
    debouncedSearch,
    sortBy: sortField = 'id',
    sortOrder: sortDirection = 'asc',
    setPage: setCurrentPage,
    setPageSize,
    setSearch: setSearchQuery,
    setSorting,
  } = useGridUrlSync({
    prefix: 'bom',
    defaultPage: 1,
    defaultPageSize: 25,
    defaultSortBy: 'id',
    defaultSortOrder: 'asc',
    debounceMs: 300,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedBomIds, setSelectedBomIds] = useState<string[]>([]);

  // Inline editing state for BOM list and grid
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // KPI Stats computation
  const totalBomCount = effectiveBoms.length;
  const releasedBomCount = effectiveBoms.filter((b) => b.status === 'released').length;
  const underReviewBomCount = effectiveBoms.filter((b) => b.status === 'under_review' || b.status === 'pending').length;
  const draftBomCount = effectiveBoms.filter((b) => b.status === 'draft').length;
  const avgYieldPct = totalBomCount > 0 ? (effectiveBoms.reduce((acc, b) => acc + (b.yieldPct || 98.5), 0) / totalBomCount).toFixed(1) : '98.5';
  const avgScrapPct = totalBomCount > 0 ? (effectiveBoms.reduce((acc, b) => acc + (b.scrapPct || 1.5), 0) / totalBomCount).toFixed(1) : '1.5';

  // Filtering
  const filteredBoms = effectiveBoms.filter((b) => {
    const q = debouncedSearch.toLowerCase().trim();
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
    setSorting(field);
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

  const handleSaveInlineCell = (bomId: string, field: string) => {
    if (!masterDataGovernanceService.canUserPerformAction('edit_bom')) {
      showToast('Admin permission required to edit BOM specifications.');
      setEditingCell(null);
      return;
    }
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

  const handleBulkApprove = () => {
    if (!masterDataGovernanceService.canUserPerformAction('approve_bom')) {
      showToast('Admin or Quality Lead permission required for bulk approval.');
      return;
    }
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
              signature: 'SIG-BULK-APPROVE',
            },
          ],
        });
      }
    });
    showToast(`Bulk approved ${selectedBomIds.length} BOM(s)`);
    setSelectedBomIds([]);
  };

  const handleBulkRelease = () => {
    if (!masterDataGovernanceService.canUserPerformAction('approve_bom')) {
      showToast('Admin or Operations Lead permission required for bulk release.');
      return;
    }
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
            onClick={() => onOpenWizard(null)}
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
              {isBomsLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`bom-skel-${idx}`} className="animate-pulse">
                    <td className="p-3"><div className="h-4 w-4 bg-gray-200 rounded mx-auto" /></td>
                    <td className="p-3"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-36 bg-gray-200 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-14 bg-gray-200 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-20 bg-gray-200 rounded mx-auto" /></td>
                    <td className="p-3"><div className="h-4 w-16 bg-gray-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedBoms.length === 0 ? (
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
                      onClick={() => onOpenQuickModify(bom)}
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
                            onClick={() => {
                              if (!masterDataGovernanceService.canUserPerformAction('edit_bom')) {
                                showToast('Admin permission required to modify BOM recipes.');
                                return;
                              }
                              onOpenQuickModify(bom);
                            }}
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
                              if (!masterDataGovernanceService.canUserPerformAction('edit_bom')) {
                                showToast('Admin permission required to modify BOM recipes.');
                                return;
                              }
                              const pItem = items.find((i) => i.code === bom.parent) || (items.length > 0 ? items[0] : null);
                              if (pItem) {
                                onOpenWizard(pItem);
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
                              if (!masterDataGovernanceService.canUserPerformAction('delete_bom')) {
                                showToast('Admin permission required to delete BOM records.');
                                return;
                              }
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

        {/* Standard High-Performance Pagination Bar */}
        <PaginationBar
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredBoms.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100, 250]}
          itemName="BOM master formulas"
        />
      </div>
    </div>
  );
};
