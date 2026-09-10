import React, { useState, useMemo } from 'react';
import { WorkOrder, MachineMaster, ItemMaster } from '../../types';
import { MoldMaster } from '../../data/manufacturingData';
import {
  Save,
  Plus,
  Trash2,
  Filter,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Calendar,
  Clock,
  ArrowDownUp,
  Sliders,
  Check,
  RefreshCw,
  Zap
} from 'lucide-react';
import { PaginationBar } from '../common/PaginationBar';

interface ProductionGridProps {
  workOrders: WorkOrder[];
  machines: MachineMaster[];
  items: ItemMaster[];
  molds: MoldMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateWO: (wo: WorkOrder) => void;
  onCreateWO: (wo: WorkOrder) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const DailyProductionGrid: React.FC<ProductionGridProps> = ({
  workOrders,
  machines,
  items,
  molds,
  onNavigate,
  onUpdateWO,
  onCreateWO,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-28');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [gridPage, setGridPage] = useState<number>(1);
  const [gridPageSize, setGridPageSize] = useState<number>(20);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkField, setBulkField] = useState<'operator' | 'shift' | 'status' | 'machine'>('operator');
  const [bulkValue, setBulkValue] = useState<string>('');

  // Editable local rows buffer
  const [gridData, setGridData] = useState<WorkOrder[]>(workOrders);
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<string>>(new Set());

  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;

  // Filtered rows
  const filteredGridRows = useMemo(() => {
    return gridData.filter((wo) => {
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        if (!wo.id.toLowerCase().includes(q) && !wo.item.toLowerCase().includes(q) && !itemName(wo.item).toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedShift !== 'all' && wo.shift !== selectedShift) return false;
      if (selectedMachineFilter !== 'all' && wo.machine !== selectedMachineFilter) return false;
      return true;
    });
  }, [gridData, searchFilter, selectedShift, selectedMachineFilter, items]);

  const handleCellChange = (id: string, field: keyof WorkOrder, value: any) => {
    setGridData((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          return updated;
        }
        return row;
      })
    );
    setDirtyRowIds((prev) => new Set(prev).add(id));
  };

  const handleSaveRow = (id: string) => {
    const row = gridData.find((r) => r.id === id);
    if (row) {
      onUpdateWO(row);
      setDirtyRowIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast(`Work Order ${id} saved`);
    }
  };

  const handleSaveAllDirty = () => {
    gridData.forEach((row) => {
      if (dirtyRowIds.has(row.id)) {
        onUpdateWO(row);
      }
    });
    setDirtyRowIds(new Set());
    showToast(`Saved all ${dirtyRowIds.size} modified records.`);
  };

  const handleApplyBulkUpdate = () => {
    if (!selectedRowIds.length || !bulkValue) return;

    setGridData((prev) =>
      prev.map((row) => {
        if (selectedRowIds.includes(row.id)) {
          const updated = { ...row, [bulkField]: bulkValue };
          onUpdateWO(updated);
          return updated;
        }
        return row;
      })
    );

    setIsBulkModalOpen(false);
    showToast(`Bulk updated ${selectedRowIds.length} work orders: ${bulkField} = ${bulkValue}`);
    setSelectedRowIds([]);
  };

  // Summary Totals
  const totalPlanned = filteredGridRows.reduce((sum, r) => sum + (r.qty || 0), 0);
  const totalGood = filteredGridRows.reduce((sum, r) => sum + (r.completed || 0), 0);
  const totalScrap = filteredGridRows.reduce((sum, r) => sum + (r.scrap || 0), 0);
  const overallScrapRate = totalGood + totalScrap > 0 ? ((totalScrap / (totalGood + totalScrap)) * 100).toFixed(1) : '0.0';

  const totalGridPages = Math.ceil(filteredGridRows.length / gridPageSize) || 1;
  const pagedGridRows = filteredGridRows.slice((gridPage - 1) * gridPageSize, gridPage * gridPageSize);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D]">
              High-Speed Plant Data Entry
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Inline Batch Editing &bull; 100+ Work Orders Virtualized
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Daily Production Data Grid</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dirtyRowIds.size > 0 && (
            <button
              onClick={handleSaveAllDirty}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md animate-pulse"
            >
              <Save className="w-3.5 h-3.5" /> Save All ({dirtyRowIds.size} Changes)
            </button>
          )}

          <button
            onClick={() => onNavigate('createWoGrid')}
            className="px-3 py-2 rounded-xl bg-[#0F8B8D] text-white hover:bg-[#0c7072] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Bulk Create 100+ WOs
          </button>
        </div>
      </div>

      {/* Grid Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search WO#, item code..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E4E0D6] bg-white font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#6B7280]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 rounded-xl border border-[#E4E0D6] font-semibold text-[#14213D]"
            />
          </div>

          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="w-full p-2 rounded-xl border border-[#E4E0D6] bg-white font-semibold text-[#14213D]"
          >
            <option value="all">All Shifts</option>
            <option value="Shift A">Shift A (06:00 - 14:00)</option>
            <option value="Shift B">Shift B (14:00 - 22:00)</option>
            <option value="Shift C">Shift C (22:00 - 06:00)</option>
          </select>

          <select
            value={selectedMachineFilter}
            onChange={(e) => setSelectedMachineFilter(e.target.value)}
            className="w-full p-2 rounded-xl border border-[#E4E0D6] bg-white font-semibold text-[#14213D]"
          >
            <option value="all">All Machine Bays</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.id} &mdash; {m.name}</option>
            ))}
          </select>
        </div>

        {/* Selected Rows Batch Bar */}
        {selectedRowIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
            <span className="font-bold text-purple-950">
              {selectedRowIds.length} Rows Selected for Batch Modification
            </span>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold"
            >
              Bulk Update Selected Rows &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Main High Performance Editable Grid Table */}
      <div className="bg-white rounded-2xl border border-[#E4E0D6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-20 bg-[#F6F4EF] text-[#6B7280] shadow-xs">
              <tr className="border-b border-[#E4E0D6]">
                <th className="p-3 text-center w-10 sticky left-0 bg-[#F6F4EF] z-30">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.length === filteredGridRows.length && filteredGridRows.length > 0}
                    onChange={() => {
                      if (selectedRowIds.length === filteredGridRows.length) {
                        setSelectedRowIds([]);
                      } else {
                        setSelectedRowIds(filteredGridRows.map((r) => r.id));
                      }
                    }}
                    className="rounded text-[#0F8B8D]"
                  />
                </th>
                <th className="p-3 text-left font-bold w-12">Seq</th>
                <th className="p-3 text-left font-bold w-28 sticky left-10 bg-[#F6F4EF] z-30">WO #</th>
                <th className="p-3 text-left font-bold w-52">Product Item</th>
                <th className="p-3 text-left font-bold w-32">Bay Machine</th>
                <th className="p-3 text-left font-bold w-28">Shift</th>
                <th className="p-3 text-right font-bold w-24">Planned</th>
                <th className="p-3 text-right font-bold w-24">Actual Good</th>
                <th className="p-3 text-right font-bold w-20">Scrap</th>
                <th className="p-3 text-right font-bold w-16">Scrap %</th>
                <th className="p-3 text-left font-bold w-32">Status</th>
                <th className="p-3 text-left font-bold w-32">Lead Operator</th>
                <th className="p-3 text-center font-bold w-16">Save</th>
              </tr>
            </thead>
            <tbody>
              {pagedGridRows.length > 0 ? (
                pagedGridRows.map((row, idx) => {
                  const globalIdx = (gridPage - 1) * gridPageSize + idx + 1;
                  const isDirty = dirtyRowIds.has(row.id);
                  const isSelected = selectedRowIds.includes(row.id);
                  const totalProduced = (row.completed || 0) + (row.scrap || 0);
                  const scrapPct = totalProduced > 0 ? (((row.scrap || 0) / totalProduced) * 100).toFixed(1) : '0.0';

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-[#E4E0D6] hover:bg-slate-50 transition-colors ${
                        isDirty ? 'bg-amber-50/50' : ''
                      } ${isSelected ? 'bg-purple-50/40' : ''}`}
                    >
                      <td className="p-2.5 text-center sticky left-0 bg-white z-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedRowIds((prev) =>
                              prev.includes(row.id) ? prev.filter((r) => r !== row.id) : [...prev, row.id]
                            );
                          }}
                          className="rounded text-[#0F8B8D]"
                        />
                      </td>

                      <td className="p-2.5 font-mono text-center text-[#6B7280]">#{globalIdx}</td>

                    <td className="p-2.5 font-mono font-bold text-[#0F8B8D] sticky left-10 bg-white z-10">
                      <button
                        onClick={() => onNavigate('woDetail', { id: row.id })}
                        className="hover:underline font-bold text-left"
                      >
                        {row.id}
                      </button>
                    </td>

                    <td className="p-2.5">
                      <div className="font-semibold text-[#14213D] truncate max-w-[200px]">{itemName(row.item)}</div>
                      <div className="text-[10px] font-mono text-[#6B7280]">{row.item}</div>
                    </td>

                    {/* Machine Bay Select */}
                    <td className="p-2">
                      <select
                        value={row.machine || ''}
                        onChange={(e) => handleCellChange(row.id, 'machine', e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-[#E4E0D6] bg-white font-mono text-xs font-semibold text-[#14213D]"
                      >
                        <option value="">Unassigned</option>
                        {machines.map((m) => (
                          <option key={m.id} value={m.id}>{m.id}</option>
                        ))}
                      </select>
                    </td>

                    {/* Shift Select */}
                    <td className="p-2">
                      <select
                        value={row.shift || 'Shift A'}
                        onChange={(e) => handleCellChange(row.id, 'shift', e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-[#E4E0D6] bg-white text-xs font-semibold text-[#14213D]"
                      >
                        <option value="Shift A">Shift A</option>
                        <option value="Shift B">Shift B</option>
                        <option value="Shift C">Shift C</option>
                      </select>
                    </td>

                    {/* Planned Qty */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) => handleCellChange(row.id, 'qty', parseInt(e.target.value) || 0)}
                        className="w-full p-1.5 rounded-lg border border-[#E4E0D6] bg-white font-mono text-right font-bold text-[#14213D]"
                      />
                    </td>

                    {/* Actual Good */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.completed}
                        onChange={(e) => handleCellChange(row.id, 'completed', parseInt(e.target.value) || 0)}
                        className="w-full p-1.5 rounded-lg border border-[#E4E0D6] bg-white font-mono text-right font-bold text-emerald-700"
                      />
                    </td>

                    {/* Scrap */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.scrap}
                        onChange={(e) => handleCellChange(row.id, 'scrap', parseInt(e.target.value) || 0)}
                        className="w-full p-1.5 rounded-lg border border-[#E4E0D6] bg-white font-mono text-right font-bold text-rose-700"
                      />
                    </td>

                    {/* Scrap % Auto-calculated */}
                    <td className="p-2 text-right font-mono font-bold text-[#6B7280]">
                      {scrapPct}%
                    </td>

                    {/* Status Select */}
                    <td className="p-2">
                      <select
                        value={row.status}
                        onChange={(e) => handleCellChange(row.id, 'status', e.target.value as any)}
                        className="w-full p-1.5 rounded-lg border border-[#E4E0D6] bg-white text-xs font-semibold text-[#14213D]"
                      >
                        <option value="planned">Planned</option>
                        <option value="released">Released</option>
                        <option value="in_progress">In Progress</option>
                        <option value="quality_hold">Quality Hold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>

                    {/* Operator */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.operator || ''}
                        onChange={(e) => handleCellChange(row.id, 'operator', e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-[#E4E0D6] bg-white text-xs font-medium text-[#14213D]"
                      />
                    </td>

                    {/* Save State Action */}
                    <td className="p-2 text-center">
                      {isDirty ? (
                        <button
                          onClick={() => handleSaveRow(row.id)}
                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          title="Save changes"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-emerald-600">
                          <Check className="w-4 h-4 mx-auto" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={13} className="py-12 text-center text-xs text-[#9CA3AF]">
                  No production records found matching criteria.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={gridPage}
          totalPages={totalGridPages}
          pageSize={gridPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          totalItems={filteredGridRows.length}
          onPageChange={setGridPage}
          onPageSizeChange={setGridPageSize}
          itemName="production rows"
        />

        {/* Summary Footer Bar */}
        <div className="bg-[#F6F4EF] p-4 border-t border-[#E4E0D6] flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          <div className="text-[#6B7280]">
            Summary: <b>{filteredGridRows.length}</b> records selected
          </div>
          <div className="flex items-center gap-6 font-mono text-[#14213D]">
            <div>Total Planned: <b>{totalPlanned.toLocaleString()}</b> pcs</div>
            <div>Actual Good: <b className="text-emerald-700">{totalGood.toLocaleString()}</b> pcs</div>
            <div>Total Scrap: <b className="text-rose-700">{totalScrap.toLocaleString()}</b> pcs</div>
            <div>Overall Scrap: <b className="text-[#14213D]">{overallScrapRate}%</b></div>
          </div>
        </div>
      </div>

      {/* Bulk Update Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4E0D6] p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#14213D]">Bulk Update ({selectedRowIds.length} Orders)</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#6B7280]">Select Field to Update</label>
                <select
                  value={bulkField}
                  onChange={(e) => setBulkField(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-[#E4E0D6] mt-1 bg-white font-semibold"
                >
                  <option value="operator">Operator Assignment</option>
                  <option value="shift">Shift Assignment</option>
                  <option value="status">Status Workflow</option>
                  <option value="machine">Machine Allocation</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#6B7280]">New Value</label>
                <input
                  type="text"
                  placeholder="Enter new value (e.g. R. Kumar, Shift B, released, IMM-250T-03)..."
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E4E0D6] mt-1 bg-white font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBulkUpdate}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
              >
                Apply to {selectedRowIds.length} Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
