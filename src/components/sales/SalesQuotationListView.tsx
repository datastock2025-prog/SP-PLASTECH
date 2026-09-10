import React, { useState, useMemo } from 'react';
import {
  FileEdit,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Send,
  CheckCircle,
  MoreHorizontal,
  ChevronDown,
  ArrowUpDown,
  FileSpreadsheet,
  Trash2,
  Copy,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { SalesQuotation, Customer } from '../../types';
import { SalesStatusBadge } from './SalesStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  quotes: SalesQuotation[];
  customers: Customer[];
  onNavigate: (view: string, param?: any) => void;
  onCreateQuote: (q: SalesQuotation) => void;
  onUpdateQuote: (q: SalesQuotation) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const SalesQuotationListView: React.FC<Props> = ({
  quotes,
  customers,
  onNavigate,
  onCreateQuote,
  onUpdateQuote,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof SalesQuotation>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const getQuoteTotal = (q: SalesQuotation) =>
    q.lines.reduce((sum, l) => sum + l.qty * l.price * (1 - (l.discountPct || 0) / 100), 0);

  const savedViews = [
    { id: 'all', label: 'All Quotations', count: quotes.length },
    { id: 'pending', label: 'Pending Approval', count: quotes.filter((q) => q.stage === 'pending').length },
    { id: 'approved', label: 'Approved', count: quotes.filter((q) => q.stage === 'approved').length },
    { id: 'sent', label: 'Sent to Customer', count: quotes.filter((q) => q.stage === 'sent').length },
    { id: 'reviewing', label: 'Customer Reviewing', count: quotes.filter((q) => q.stage === 'reviewing').length },
    { id: 'accepted', label: 'Accepted', count: quotes.filter((q) => q.stage === 'accepted').length },
    { id: 'converted', label: 'Converted to SO', count: quotes.filter((q) => q.stage === 'converted').length },
    { id: 'high_priority', label: 'High Priority', count: quotes.filter((q) => q.priority === 'high').length },
  ];

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      // Saved View Filter
      if (activeTab === 'pending' && q.stage !== 'pending') return false;
      if (activeTab === 'approved' && q.stage !== 'approved') return false;
      if (activeTab === 'sent' && q.stage !== 'sent') return false;
      if (activeTab === 'reviewing' && q.stage !== 'reviewing') return false;
      if (activeTab === 'accepted' && q.stage !== 'accepted') return false;
      if (activeTab === 'converted' && q.stage !== 'converted') return false;
      if (activeTab === 'high_priority' && q.priority !== 'high') return false;

      // Dropdown filters
      if (filterCustomer !== 'all' && q.customer !== filterCustomer) return false;
      if (filterPriority !== 'all' && q.priority !== filterPriority) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q_str = searchQuery.toLowerCase();
        const matchesId = q.id.toLowerCase().includes(q_str);
        const matchesCust = q.customer.toLowerCase().includes(q_str);
        const matchesRfq = (q.customerRfq || '').toLowerCase().includes(q_str);
        const matchesSales = q.salesperson.toLowerCase().includes(q_str);
        const matchesItem = q.lines.some(
          (l) => l.name.toLowerCase().includes(q_str) || l.item.toLowerCase().includes(q_str)
        );
        if (!matchesId && !matchesCust && !matchesRfq && !matchesSales && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [quotes, activeTab, filterCustomer, filterPriority, searchQuery]);

  const sortedQuotes = useMemo(() => {
    return [...filteredQuotes].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'margin') {
        aVal = a.margin || 0;
        bVal = b.margin || 0;
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredQuotes, sortField, sortAsc]);

  // Paginated records
  const totalPages = Math.ceil(sortedQuotes.length / pageSize) || 1;
  const pagedQuotes = sortedQuotes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: keyof SalesQuotation) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Quotation #', 'Customer', 'RFQ #', 'Date', 'Valid Until', 'Total Amount', 'Margin %', 'Salesperson', 'Stage'];
    const rows = sortedQuotes.map((q) => [
      q.id,
      q.customer,
      q.customerRfq || '—',
      q.date,
      q.validUntil,
      getQuoteTotal(q).toFixed(2),
      `${q.margin}%`,
      q.salesperson,
      q.stage,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_quotations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported quotations to CSV');
  };

  const handleCreateQuotationDrawer = () => {
    let custCode = customers[0]?.code || 'CUST-001';
    let rfq = 'RFQ-2026-';
    let salesperson = 'Ananya Rao';
    let priority: 'low' | 'medium' | 'high' = 'high';
    let resin = 'HDPE High Density Polyethylene';
    let grade = 'Blow Molding B56003';
    let color = 'Natural';
    let qty = 10000;
    let price = 9.5;
    let discount = 2;

    openDrawer(
      'Create Sales Quotation',
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 font-medium">
          Plastic Manufacturing B2B Quote Builder &middot; Automatic Margin Rollup
        </div>

        <div className="field">
          <label className="font-bold text-[#14213D]">Customer / Account</label>
          <select
            defaultValue={custCode}
            onChange={(e) => (custCode = e.target.value)}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-medium"
          >
            {customers.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} &middot; {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label className="font-bold text-[#14213D]">Customer RFQ Ref #</label>
            <input
              type="text"
              defaultValue={rfq}
              onChange={(e) => (rfq = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
              placeholder="e.g. RFQ-METRO-2026"
            />
          </div>
          <div className="field">
            <label className="font-bold text-[#14213D]">Sales Executive</label>
            <input
              type="text"
              defaultValue={salesperson}
              onChange={(e) => (salesperson = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            />
          </div>
        </div>

        <div className="p-3.5 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] space-y-3">
          <div className="font-bold text-[#14213D] uppercase text-[11px] tracking-wider">
            Line Item &middot; Polymer Formulation
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#6B7280]">Resin Type</label>
              <input
                type="text"
                defaultValue={resin}
                onChange={(e) => (resin = e.target.value)}
                className="w-full p-1.5 border border-[#E4E0D6] rounded bg-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6B7280]">Polymer Grade</label>
              <input
                type="text"
                defaultValue={grade}
                onChange={(e) => (grade = e.target.value)}
                className="w-full p-1.5 border border-[#E4E0D6] rounded bg-white text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-[#6B7280]">Color / Masterbatch</label>
              <input
                type="text"
                defaultValue={color}
                onChange={(e) => (color = e.target.value)}
                className="w-full p-1.5 border border-[#E4E0D6] rounded bg-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6B7280]">Quantity (PCS/KG)</label>
              <input
                type="number"
                defaultValue={qty}
                onChange={(e) => (qty = parseInt(e.target.value) || 1000)}
                className="w-full p-1.5 border border-[#E4E0D6] rounded bg-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6B7280]">Unit Price (₹)</label>
              <input
                type="number"
                step="0.1"
                defaultValue={price}
                onChange={(e) => (price = parseFloat(e.target.value) || 9.5)}
                className="w-full p-1.5 border border-[#E4E0D6] rounded bg-white text-xs"
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
            const selectedCust = customers.find((c) => c.code === custCode);
            const newQ: SalesQuotation = {
              id: `QT-${3000 + quotes.length + 1}`,
              customer: selectedCust?.name || custCode,
              customerRfq: rfq,
              date: new Date().toISOString().slice(0, 10),
              validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
              currency: 'INR',
              salesperson,
              priority,
              expectedClose: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
              stage: 'draft',
              approval: 'draft',
              margin: 24.5,
              convertedSo: null,
              lines: [
                {
                  item: 'FG-CUSTOM-PL',
                  name: `${resin} - ${color}`,
                  customerItemCode: 'CUST-SPEC',
                  qty,
                  uom: 'PCS',
                  price,
                  discountPct: discount,
                  color,
                  grade,
                  resinType: resin,
                  moq: 1000,
                  coaRequired: true,
                },
              ],
              terms: {
                payment: 'Net 30 Days',
                incoterm: 'EXW Hosur Plant 01',
                shipping: 'Road Freight',
                delivery: 'Within 14 days of PO',
              },
              history: [{ event: `Quotation created by ${salesperson}`, time: 'Just now' }],
            };
            onCreateQuote(newQ);
            closeDrawer();
            showToast(`Quotation ${newQ.id} created successfully`);
          }}
        >
          Save &amp; Generate Quote
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-[#0F8B8D]">
            <span>Commercial &middot; Pre-Sales Operations</span>
            <span className="w-1 h-1 rounded-full bg-[#0F8B8D]" />
            <span>RFQ to Quote</span>
          </div>
          <h1 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-0.5">
            Sales Quotations
          </h1>
          <p className="text-xs text-[#6B7280]">
            Proposals, resin-grade pricing breakdowns, margin governance, and sales order conversions.
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
            onClick={handleCreateQuotationDrawer}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0d7a7c] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Quotation</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs / Saved Views */}
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

      {/* Search & Secondary Filter Bar */}
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
              placeholder="Search quotation #, customer name, RFQ ref, polymer or salesperson..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs focus:outline-none focus:border-[#0F8B8D] bg-[#F6F4EF]"
            />
          </div>

          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isFilterPanelOpen || filterCustomer !== 'all' || filterPriority !== 'all'
                ? 'bg-[#0F8B8D]/10 border-[#0F8B8D] text-[#0F8B8D]'
                : 'border-[#E4E0D6] bg-white text-[#6B7280] hover:bg-[#F6F4EF]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#6B7280] font-mono">
          <span>
            Showing <b>{pagedQuotes.length}</b> of {sortedQuotes.length} quotes
          </span>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {isFilterPanelOpen && (
        <div className="bg-white p-4 rounded-xl border border-[#0F8B8D]/30 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-[#14213D] block mb-1">Customer Filter</label>
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

      {/* Main Quotation Grid Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold tracking-wider text-[11px] border-b border-[#1C2B4D]">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedQuoteIds.length === pagedQuotes.length && pagedQuotes.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuoteIds(pagedQuotes.map((q) => q.id));
                      } else {
                        setSelectedQuoteIds([]);
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
                    <span>Quote #</span>
                    <ArrowUpDown className="w-3 h-3 text-[#9AA5C4]" />
                  </div>
                </th>
                <th className="p-3">Customer &amp; RFQ</th>
                <th
                  onClick={() => toggleSort('date')}
                  className="p-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Quote Date</span>
                    <ArrowUpDown className="w-3 h-3 text-[#9AA5C4]" />
                  </div>
                </th>
                <th className="p-3">Valid Until</th>
                <th className="p-3 text-right">Total (₹)</th>
                <th
                  onClick={() => toggleSort('margin')}
                  className="p-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Margin %</span>
                    <ArrowUpDown className="w-3 h-3 text-[#9AA5C4]" />
                  </div>
                </th>
                <th className="p-3">Salesperson</th>
                <th className="p-3 text-center">Stage</th>
                <th className="p-3 text-center">Approval</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {pagedQuotes.length > 0 ? (
                pagedQuotes.map((q) => {
                  const isSelected = selectedQuoteIds.includes(q.id);
                  const totalVal = getQuoteTotal(q);
                  const isBelowMarginFloor = q.margin < 18;

                  return (
                    <tr
                      key={q.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedQuoteIds((prev) =>
                              prev.includes(q.id) ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                            );
                          }}
                          className="rounded text-[#0F8B8D]"
                        />
                      </td>

                      <td className="p-3 font-mono font-bold text-[#0F8B8D]">
                        <button
                          onClick={() => onNavigate('quoteDetail', { id: q.id })}
                          className="hover:underline text-left font-mono"
                        >
                          {q.id}
                        </button>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-[#14213D]">{q.customer}</div>
                        <div className="text-[10px] text-[#6B7280] font-mono">
                          {q.customerRfq ? `RFQ: ${q.customerRfq}` : 'Direct Proposal'}
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[#6B7280]">{q.date}</td>

                      <td className="p-3 font-mono text-[#6B7280]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {q.validUntil}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                        ₹{totalVal.toLocaleString()}
                      </td>

                      <td className="p-3 text-right font-mono font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            isBelowMarginFloor
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {q.margin}%
                        </span>
                      </td>

                      <td className="p-3 text-[#14213D]">{q.salesperson}</td>

                      <td className="p-3 text-center">
                        <SalesStatusBadge status={q.stage} size="xs" />
                      </td>

                      <td className="p-3 text-center">
                        <SalesStatusBadge status={q.approval} size="xs" />
                      </td>

                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => onNavigate('quoteDetail', { id: q.id })}
                          className="px-2 py-1 rounded bg-[#F6F4EF] hover:bg-[#E4E0D6] text-[#14213D] font-semibold text-[11px] border border-[#E4E0D6] transition-colors"
                        >
                          View
                        </button>

                        {q.stage === 'approved' && !q.convertedSo && (
                          <button
                            onClick={() => {
                              onUpdateQuote({ ...q, stage: 'converted' });
                              showToast(`Converted ${q.id} to Sales Order`);
                            }}
                            className="px-2 py-1 rounded bg-[#0F8B8D] hover:bg-[#0d7a7c] text-white font-semibold text-[11px] shadow-xs transition-colors"
                          >
                            Convert SO
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-[#9CA3AF]">
                    No sales quotations found matching criteria.
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
          totalItems={sortedQuotes.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="quotations"
        />
      </div>
    </div>
  );
};
