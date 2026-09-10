import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpDown,
  Eye,
  SlidersHorizontal,
  Package,
  Layers,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  X,
} from 'lucide-react';
import { InventoryStockItem, InventoryStockLot } from '../../types/warehouse';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  stockItems: InventoryStockItem[];
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  onUpdateItem?: (updated: InventoryStockItem) => void;
}

export const StockLedgerListView: React.FC<Props> = ({
  stockItems,
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
  onUpdateItem,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedItemForLots, setSelectedItemForLots] = useState<InventoryStockItem | null>(null);

  const categories = ['ALL', 'Virgin Polymer', 'Masterbatch', 'Regrind Polymer', 'Molded Part (FG)'];

  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      const matchSearch =
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.primaryBin.toLowerCase().includes(search.toLowerCase()) ||
        (item.resinGrade && item.resinGrade.toLowerCase().includes(search.toLowerCase()));

      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;

      return matchSearch && matchCat && matchStatus;
    });
  }, [stockItems, search, selectedCategory, selectedStatus]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Open Quick Stock Adjustment Drawer
  const openStockAdjustmentDrawer = (item: InventoryStockItem) => {
    let adjustmentQty = 0;
    let reason = 'Physical Count Cycle Variance';
    let targetBin = item.primaryBin;

    openDrawer(
      `Quick Stock Adjustment &mdash; ${item.sku}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="font-bold text-slate-800 text-sm">{item.name}</div>
          <div className="text-slate-500 font-mono">Current On Hand: <span className="font-bold text-[#14213D]">{item.totalOnHand.toLocaleString()} {item.uom}</span></div>
          <div className="text-slate-500">Warehouse: {item.primaryWarehouse} &bull; Bin: {item.primaryBin}</div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Adjustment Quantity (+ for inward, - for writeoff)</label>
          <input
            type="number"
            defaultValue={adjustmentQty}
            onChange={(e) => (adjustmentQty = parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            placeholder="e.g. +500 or -25"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Adjustment Reason</label>
          <select
            defaultValue={reason}
            onChange={(e) => (reason = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          >
            <option value="Physical Count Cycle Variance">Physical Count Cycle Variance</option>
            <option value="Hopper / Conveying Spillage Write-off">Hopper / Conveying Spillage Write-off</option>
            <option value="Lab Moisture Sample Consumption">Lab Moisture Sample Consumption</option>
            <option value="Manual GRN Correction">Manual GRN Correction</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Storage Location Bin</label>
          <input
            type="text"
            defaultValue={targetBin}
            onChange={(e) => (targetBin = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          />
        </div>
      </div>,
      <div className="flex items-center justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const updatedOnHand = Math.max(0, item.totalOnHand + adjustmentQty);
            const updatedItem: InventoryStockItem = {
              ...item,
              totalOnHand: updatedOnHand,
              availableToPromise: Math.max(0, updatedOnHand - item.allocatedToProduction - item.reservedForOrders),
              totalValuationInr: updatedOnHand * item.unitCostInr,
              primaryBin: targetBin,
            };
            if (onUpdateItem) onUpdateItem(updatedItem);
            closeDrawer();
            showToast(`Adjusted ${item.sku} by ${adjustmentQty > 0 ? '+' : ''}${adjustmentQty} ${item.uom}`);
          }}
          className="px-4 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold"
        >
          Post Inventory Adjustment
        </button>
      </div>
    );
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = ['SKU', 'Item Name', 'Category', 'Resin Grade', 'Primary Bin', 'On Hand (KG/PCS)', 'Allocated', 'Available', 'Unit Cost (INR)', 'Total Valuation (INR)', 'Status'];
    const rows = filteredItems.map((i) => [
      i.sku,
      `"${i.name.replace(/"/g, '""')}"`,
      i.category,
      `"${(i.resinGrade || '').replace(/"/g, '""')}"`,
      i.primaryBin,
      i.totalOnHand,
      i.allocatedToProduction,
      i.availableToPromise,
      i.unitCostInr,
      i.totalValuationInr,
      i.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reboot_Stock_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Stock Ledger exported to CSV');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/30 uppercase tracking-wider">
              Stock Balances &middot; Master Ledger
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Warehouse Stock Overview &amp; Lot Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Real-time on-hand, allocated, and reserved balances across Plant 01 silos and high-bay racks
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => onNavigate('binMap')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" /> Bin Map
          </button>
          <button
            onClick={() => onNavigate('poList')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> + Purchase Requisition
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by SKU, item description, resin grade, or storage bin..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#14213D] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-[11px]">
                <th className="py-3 px-4">Item SKU / Code</th>
                <th className="py-3 px-4">Description &amp; Grade</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">On Hand</th>
                <th className="py-3 px-4 text-right">Allocated</th>
                <th className="py-3 px-4 text-right">Available</th>
                <th className="py-3 px-4">Primary Bin</th>
                <th className="py-3 px-4 text-right">Valuation (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/60 transition group cursor-pointer"
                  onClick={() => setSelectedItemForLots(item)}
                >
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-[#0F8B8D] group-hover:underline">
                      {item.sku}
                    </span>
                    <div className="text-[10px] text-slate-400">Class {item.abcClassification}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#14213D]">{item.name}</div>
                    {item.resinGrade && (
                      <div className="text-[10px] text-slate-500 font-mono">{item.resinGrade}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {item.totalOnHand.toLocaleString()} <span className="text-[10px] text-slate-400">{item.uom}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">
                    {item.allocatedToProduction.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                    {item.availableToPromise.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-xs text-[#0F8B8D] px-1.5 py-0.5 bg-teal-50 rounded border border-teal-200">
                      {item.primaryBin}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                    ₹{item.totalValuationInr.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <WarehouseStatusBadge status={item.status} size="xs" />
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedItemForLots(item)}
                        title="View Lot Breakdown"
                        className="p-1.5 text-slate-600 hover:text-[#0F8B8D] hover:bg-slate-100 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openStockAdjustmentDrawer(item)}
                        title="Adjust Stock"
                        className="p-1.5 text-slate-600 hover:text-[#E8622C] hover:bg-slate-100 rounded-lg transition"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-100">
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Lot Breakdown Modal / Slideover (if item selected) */}
      {selectedItemForLots && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0F8B8D]">{selectedItemForLots.sku}</span>
                  <WarehouseStatusBadge status={selectedItemForLots.status} size="xs" />
                </div>
                <h3 className="font-bold font-['Space_Grotesk'] text-base text-[#14213D]">
                  {selectedItemForLots.name} &mdash; Inward Lot Breakdown
                </h3>
              </div>
              <button
                onClick={() => setSelectedItemForLots(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500">Total On Hand</div>
                <div className="text-base font-bold font-mono text-[#14213D]">{selectedItemForLots.totalOnHand.toLocaleString()} {selectedItemForLots.uom}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500">Allocated to WOs</div>
                <div className="text-base font-bold font-mono text-slate-700">{selectedItemForLots.allocatedToProduction.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500">Available to Promise</div>
                <div className="text-base font-bold font-mono text-emerald-600">{selectedItemForLots.availableToPromise.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500">Unit Cost / Valuation</div>
                <div className="text-base font-bold font-mono text-slate-800">₹{selectedItemForLots.unitCostInr}/kg</div>
              </div>
            </div>

            {/* Lot Table */}
            <div>
              <h4 className="font-bold text-xs text-slate-700 mb-2">Active Traceable Lots</h4>
              {selectedItemForLots.lots && selectedItemForLots.lots.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Lot Number</th>
                        <th className="py-2.5 px-3">Supplier Batch</th>
                        <th className="py-2.5 px-3 text-right">Available Qty</th>
                        <th className="py-2.5 px-3">MFI Tested</th>
                        <th className="py-2.5 px-3">Moisture %</th>
                        <th className="py-2.5 px-3">Storage Bin</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedItemForLots.lots.map((lot) => (
                        <tr key={lot.lotNumber} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{lot.lotNumber}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{lot.supplierBatchNumber}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">{lot.availableQuantityKg.toLocaleString()} KG</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{lot.mfiTested}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{lot.moisturePct}%</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{lot.storageBin}</td>
                          <td className="py-2.5 px-3"><WarehouseStatusBadge status={lot.status} size="xs" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Bulk item tracked at SKU level &bull; No subdivided batch lot records.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedItemForLots(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
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
