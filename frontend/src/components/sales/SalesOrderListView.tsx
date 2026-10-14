import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  Truck,
  DollarSign,
  AlertTriangle,
  ArrowUpDown,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Building,
  Layers,
} from 'lucide-react';
import { SalesOrder, Customer } from '../../types';
import { SalesStatusBadge } from './SalesStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  sos: SalesOrder[];
  customers: Customer[];
  onNavigate: (view: string, param?: any) => void;
  onCreateSO: (so: SalesOrder) => void;
  onUpdateSO: (so: SalesOrder) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const SalesOrderListView: React.FC<Props> = ({
  sos,
  customers,
  onNavigate,
  onCreateSO,
  onUpdateSO,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSOIds, setSelectedSOIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof SalesOrder>('orderDate');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const getSOTotal = (so: SalesOrder) => so.lines.reduce((sum, l) => sum + l.qty * l.price, 0);

  const savedViews = [
    { id: 'all', label: 'All Orders', count: sos.length },
    { id: 'pending', label: 'Pending Approval', count: sos.filter((s) => s.approval === 'pending').length },
    { id: 'confirmed', label: 'Confirmed', count: sos.filter((s) => s.approval === 'approved').length },
    { id: 'in_production', label: 'In Production', count: 2 },
    { id: 'ready_to_ship', label: 'Ready to Ship', count: 1 },
    { id: 'partially_delivered', label: 'Partially Delivered', count: sos.filter((s) => s.lines.some((l) => l.dispatched > 0 && l.dispatched < l.qty)).length },
    { id: 'delivered', label: 'Delivered', count: sos.filter((s) => s.lines.every((l) => l.dispatched >= l.qty)).length },
    { id: 'credit_blocked', label: 'Credit Hold', count: sos.filter((s) => s.approval === 'rejected').length },
  ];

  const filteredSOs = useMemo(() => {
    return sos.filter((s) => {
      // Tab filter
      if (activeTab === 'pending' && s.approval !== 'pending') return false;
      if (activeTab === 'confirmed' && s.approval !== 'approved') return false;
      if (activeTab === 'credit_blocked' && s.approval !== 'rejected') return false;
      if (activeTab === 'partially_delivered') {
        const isPart = s.lines.some((l) => l.dispatched > 0 && l.dispatched < l.qty);
        if (!isPart) return false;
      }
      if (activeTab === 'delivered') {
        const isDeliv = s.lines.every((l) => l.dispatched >= l.qty && l.qty > 0);
        if (!isDeliv) return false;
      }

      // Dropdown filters
      if (filterCustomer !== 'all' && s.customer !== filterCustomer) return false;
      if (filterPriority !== 'all' && s.priority?.toLowerCase() !== filterPriority.toLowerCase()) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = s.id.toLowerCase().includes(q);
        const matchesCust = s.customer.toLowerCase().includes(q);
        const matchesPO = (s.customerPO || '').toLowerCase().includes(q);
        const matchesItem = s.lines.some((l) => l.name.toLowerCase().includes(q) || l.item.toLowerCase().includes(q));
        if (!matchesId && !matchesCust && !matchesPO && !matchesItem) return false;
      }

      return true;
    });
  }, [sos, activeTab, filterCustomer, filterPriority, searchQuery]);

  const sortedSOs = useMemo(() => {
    return [...filteredSOs].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredSOs, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedSOs.length / pageSize) || 1;
  const pagedSOs = sortedSOs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: keyof SalesOrder) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportCSV = () => {
    const headers = ['SO #', 'Customer', 'PO #', 'Order Date', 'Delivery Date', 'Order Value', 'Status', 'Priority'];
    const rows = sortedSOs.map((s) => [
      s.id,
      s.customer,
      s.customerPO || '—',
      s.orderDate,
      s.deliveryDate,
      getSOTotal(s).toFixed(2),
      s.approval,
      s.priority,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported sales orders to CSV');
  };

  const handleCreateSODrawer = () => {
    let cust = customers[0]?.name || 'Metro Retail Distributors';
    let po = 'PO-2026-';
    let qty = 10000;
    let price = 9.5;
    let resin = 'FG-CTN-500';
    let resinName = '500ml HDPE Dispenser Container';
    let priority: 'high' | 'medium' | 'low' = 'high';

    openDrawer(
      'Create New Sales Order',
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 font-medium">
          Direct Sales Order Entry &middot; Automated Credit &amp; BOM Feasibility Gate
        </div>

        <div className="field">
          <label className="font-bold text-[#14213D]">Customer / Account</label>
          <select
            defaultValue={cust}
            onChange={(e) => (cust = e.target.value)}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-medium"
          >
            {customers.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name} ({c.segment})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label className="font-bold text-[#14213D]">Customer PO #</label>
            <input
              type="text"
              defaultValue={po}
              onChange={(e) => (po = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
          <div className="field">
            <label className="font-bold text-[#14213D]">Order Priority</label>
            <select
              defaultValue={priority}
              onChange={(e) => (priority = e.target.value as any)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            >
              <option value="high">High (Automotive / Urgent)</option>
              <option value="medium">Medium (Standard)</option>
              <option value="low">Low (Stock replenishment)</option>
            </select>
          </div>
        </div>

        <div className="p-3.5 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] space-y-3">
          <div className="font-bold text-[#14213D] uppercase text-[11px] tracking-wider">
            Order Line Item &middot; Polymer Product
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#6B7280]">Item Part #</label>
              <select
                defaultValue={resin}
                onChange={(e) => {
                  resin = e.target.value;
                  resinName = e.target.options[e.target.selectedIndex].text;
                }}
                className="w-full p-1.5 border border-[#E4E0D6] rounded bg-white text-xs"
              >
                <option value="FG-CTN-500">500ml HDPE Dispenser Container</option>
                <option value="FG-PET-030">30mm PET Bottle Preform 28g</option>
                <option value="FG-BKT-010">10L Heavy Duty Bucket</option>
                <option value="RM-AB-060">ABS Heat Resistant Compound</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#6B7280]">Order Quantity (PCS)</label>
              <input
                type="number"
                defaultValue={qty}
                onChange={(e) => (qty = parseInt(e.target.value) || 1000)}
                className="w-full p-1.5 border border-[#E4E0D6] rounded bg-white text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#6B7280]">Unit Price (₹)</label>
              <input
                type="number"
                step="0.1"
                defaultValue={price}
                onChange={(e) => (price = parseFloat(e.target.value) || 9.5)}
                className="w-full p-1.5 border border-[#E4E0D6] rounded bg-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6B7280]">Target Delivery</label>
              <input
                type="date"
                defaultValue={new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
                className="w-full p-1.5 border border-[#E4E0D6] rounded bg-white text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button className="btn btn-sm btn-ghost" onClick={closeDrawer}>
          Cancel
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            const newSO: SalesOrder = {
              id: `SO-50${sos.length + 1}`,
              customer: cust,
              customerPO: po,
              priority,
              orderDate: new Date().toISOString().slice(0, 10),
              deliveryDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().slice(0, 10),
              approval: 'approved',
              lines: [
                {
                  item: resin,
                  name: resinName,
                  qty,
                  uom: 'PCS',
                  price,
                  dispatched: 0,
                },
              ],
              dispatchLogs: [],
              history: [{ event: 'Sales order confirmed and scheduled', time: 'Just now' }],
            };
            onCreateSO(newSO);
            closeDrawer();
            showToast(`Sales Order ${newSO.id} registered`);
          }}
        >
          Confirm &amp; Release SO
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-[#E8622C]">
            <span>Order Fulfillment &middot; Production Linked</span>
            <span className="w-1 h-1 rounded-full bg-[#E8622C]" />
            <span>ERP Engine</span>
          </div>
          <h1 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-0.5">
            Sales Orders (SOs)
          </h1>
          <p className="text-xs text-[#6B7280]">
            Order confirmation, stock allocation, production work-order dispatching, and billing runs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-[#F6F4EF] hover:bg-[#E4E0D6] text-xs font-semibold text-[#14213D] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleCreateSODrawer}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#E8622C] hover:bg-[#d45320] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Sales Order</span>
          </button>
        </div>
      </div>

      {/* Saved View Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E4E0D6]">
        {savedViews.map((sv) => (
          <button
            key={sv.id}
            onClick={() => {
              setActiveTab(sv.id);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === sv.id
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'bg-white text-[#6B7280] hover:bg-[#F6F4EF] hover:text-[#14213D] border border-[#E4E0D6]'
            }`}
          >
            <span>{sv.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === sv.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {sv.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9AA5C4]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by SO #, customer PO, customer name, resin or delivery note..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs focus:outline-none focus:border-[#0F8B8D] bg-[#F6F4EF]"
            />
          </div>

          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isFilterPanelOpen || filterCustomer !== 'all'
                ? 'bg-[#E8622C]/10 border-[#E8622C] text-[#E8622C]'
                : 'border-[#E4E0D6] bg-white text-[#6B7280] hover:bg-[#F6F4EF]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        <div className="text-xs text-[#6B7280] font-mono">
          Showing <b>{pagedSOs.length}</b> of {sortedSOs.length} orders
        </div>
      </div>

      {/* Expandable Filter Box */}
      {isFilterPanelOpen && (
        <div className="bg-white p-4 rounded-xl border border-[#E8622C]/30 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-[#14213D] block mb-1">Customer</label>
            <select
              value={filterCustomer}
              onChange={(e) => {
                setFilterCustomer(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg text-xs bg-[#F6F4EF]"
            >
              <option value="all">All Customers</option>
              {customers.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#14213D] block mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg text-xs bg-[#F6F4EF]"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterCustomer('all');
                setFilterPriority('all');
                setSearchQuery('');
              }}
              className="w-full p-2 rounded-lg border border-[#E4E0D6] text-xs font-semibold text-[#6B7280] hover:bg-[#F6F4EF]"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Main SO Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold tracking-wider text-[11px] border-b border-[#1C2B4D]">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedSOIds.length === pagedSOs.length && pagedSOs.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSOIds(pagedSOs.map((s) => s.id));
                      } else {
                        setSelectedSOIds([]);
                      }
                    }}
                    className="rounded text-[#0F8B8D]"
                  />
                </th>
                <th
                  onClick={() => toggleSort('id')}
                  className="p-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>SO #</span>
                    <ArrowUpDown className="w-3 h-3 text-[#9AA5C4]" />
                  </div>
                </th>
                <th className="p-3">Customer &amp; PO</th>
                <th className="p-3">Order Date</th>
                <th className="p-3">Req. Delivery</th>
                <th className="p-3 text-right">Order Value (₹)</th>
                <th className="p-3 text-right">Dispatched Qty</th>
                <th className="p-3 text-center">Credit Gate</th>
                <th className="p-3 text-center">Fulfillment</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {pagedSOs.length > 0 ? (
                pagedSOs.map((so) => {
                  const isSelected = selectedSOIds.includes(so.id);
                  const totalVal = getSOTotal(so);
                  const totalQty = so.lines.reduce((s, l) => s + l.qty, 0);
                  const totalDispatched = so.lines.reduce((s, l) => s + (l.dispatched || 0), 0);
                  const isFullyDispatched = totalDispatched >= totalQty && totalQty > 0;
                  const isPartiallyDispatched = totalDispatched > 0 && totalDispatched < totalQty;

                  return (
                    <tr
                      key={so.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedSOIds((prev) =>
                              prev.includes(so.id) ? prev.filter((id) => id !== so.id) : [...prev, so.id]
                            );
                          }}
                          className="rounded text-[#0F8B8D]"
                        />
                      </td>

                      <td className="p-3 font-mono font-bold text-[#0F8B8D]">
                        <button
                          onClick={() => onNavigate('soDetail', { id: so.id })}
                          className="hover:underline text-left font-mono"
                        >
                          {so.id}
                        </button>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-[#14213D]">{so.customer}</div>
                        <div className="text-[10px] font-mono text-[#6B7280]">
                          {so.customerPO ? `PO: ${so.customerPO}` : '—'}
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[#6B7280]">{so.orderDate}</td>

                      <td className="p-3 font-mono font-semibold text-[#14213D]">
                        {so.deliveryDate}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                        ₹{totalVal.toLocaleString()}
                      </td>

                      <td className="p-3 text-right font-mono">
                        <span className="font-bold text-[#14213D]">
                          {totalDispatched.toLocaleString()}
                        </span>
                        <span className="text-[#6B7280]"> / {totalQty.toLocaleString()}</span>
                      </td>

                      <td className="p-3 text-center">
                        <SalesStatusBadge
                          status={so.approval === 'rejected' ? 'credit_blocked' : so.approval}
                          size="xs"
                        />
                      </td>

                      <td className="p-3 text-center">
                        {isFullyDispatched ? (
                          <span className="badge green">Delivered</span>
                        ) : isPartiallyDispatched ? (
                          <span className="badge blue">Partially Shipped</span>
                        ) : so.approval === 'rejected' ? (
                          <span className="badge red">Credit Hold</span>
                        ) : (
                          <span className="badge cyan">In Production</span>
                        )}
                      </td>

                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => onNavigate('soDetail', { id: so.id })}
                          className="px-2 py-1 rounded bg-[#F6F4EF] hover:bg-[#E4E0D6] text-[#14213D] font-semibold text-[11px] border border-[#E4E0D6] transition-colors"
                        >
                          Detail
                        </button>

                        <button
                          onClick={() => onNavigate('soConfirm', { id: so.id })}
                          className="px-2 py-1 rounded bg-[#0F8B8D]/10 hover:bg-[#0F8B8D]/20 text-[#0F8B8D] font-semibold text-[11px] border border-[#0F8B8D]/30 transition-colors"
                        >
                          Acknowledge
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-[#9CA3AF]">
                    No sales orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          totalItems={sortedSOs.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="sales orders"
        />
      </div>
    </div>
  );
};
