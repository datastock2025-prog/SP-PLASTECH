import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Building,
  Tag,
  Download,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  Truck,
  RotateCw,
} from 'lucide-react';
import { SalesContract, SalesOrder, Customer } from '../../types';
import { SALES_CONTRACTS_SEED } from '../../data/salesData';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  contracts?: SalesContract[];
  customers?: Customer[];
  onNavigate: (view: string, param?: any) => void;
  onCreateSO?: (so: SalesOrder) => void;
  openDrawer?: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer?: () => void;
  showToast: (msg: string) => void;
}

export const SalesContractListView: React.FC<Props> = ({
  contracts = SALES_CONTRACTS_SEED,
  customers = [],
  onNavigate,
  onCreateSO,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [contractList, setContractList] = useState<SalesContract[]>(contracts);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Summary Metrics
  const totalContractsValue = contractList.reduce((sum, c) => sum + (c.totalValue || 0), 0);
  const totalReleasedValue = contractList.reduce((sum, c) => sum + (c.releasedValue || 0), 0);
  const activeContractsCount = contractList.filter((c) => c.status === 'active').length;
  const expiringContractsCount = contractList.filter((c) => c.status === 'expiring').length;
  const overallDrawdownPct = totalContractsValue > 0 ? ((totalReleasedValue / totalContractsValue) * 100).toFixed(1) : '0';

  const filteredContracts = contractList.filter((c) => {
    const matchSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.customer.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredContracts.length / pageSize) || 1;
  const pagedContracts = filteredContracts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Handle New Contract Drawer
  const handleOpenNewContractDrawer = () => {
    if (!openDrawer) return;

    let custName = customers[0]?.name || 'Apex Automotive Components';
    let contractType = 'Annual Volume Blanket Agreement';
    let startDate = '2026-09-01';
    let endDate = '2027-08-31';
    let itemCode = 'FG-AUTO-012';
    let totalQty = 200000;
    let unitPrice = 45.0;
    let priceClause = 'Quarterly ICIS Platts Polymer Price Index Adjustment';

    openDrawer(
      'Register New Sales Blanket Contract / Rate Agreement',
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 font-medium">
          Commercial Operations &middot; Long-term Rate Agreements &amp; Volume Commitments
        </div>

        <div className="field">
          <label className="font-bold text-[#14213D] block mb-1">Customer / OEM Account</label>
          <select
            defaultValue={custName}
            onChange={(e) => (custName = e.target.value)}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
          >
            {customers.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name} ({c.code}) - {c.segment}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="font-bold text-[#14213D] block mb-1">Agreement Type</label>
          <select
            defaultValue={contractType}
            onChange={(e) => (contractType = e.target.value)}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
          >
            <option value="Annual Volume Blanket Agreement">Annual Volume Blanket Agreement</option>
            <option value="Rate Contract with Polymer Index Linkage">Rate Contract with Polymer Index Linkage</option>
            <option value="Quarterly Volume Rebate Contract">Quarterly Volume Rebate Contract</option>
            <option value="Medical Grade Dedicated Cell Contract">Medical Grade Dedicated Cell Contract</option>
            <option value="Export Long-term Supply Contract (FOB/CIF)">Export Long-term Supply Contract (FOB/CIF)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Effective Start Date</label>
            <input
              type="date"
              defaultValue={startDate}
              onChange={(e) => (startDate = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Contract End Date</label>
            <input
              type="date"
              defaultValue={endDate}
              onChange={(e) => (endDate = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
        </div>

        <div className="border-t border-[#E4E0D6] pt-3">
          <div className="font-bold text-[#14213D] mb-2">Committed Product Line</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Product SKU</label>
              <input
                type="text"
                defaultValue={itemCode}
                onChange={(e) => (itemCode = e.target.value)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Total Qty (PCS)</label>
              <input
                type="number"
                defaultValue={totalQty}
                onChange={(e) => (totalQty = parseInt(e.target.value) || 100000)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Rate (₹/Unit)</label>
              <input
                type="number"
                step="0.1"
                defaultValue={unitPrice}
                onChange={(e) => (unitPrice = parseFloat(e.target.value) || 20)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="font-bold text-[#14213D] block mb-1">Raw Material Escalation Clause</label>
          <input
            type="text"
            defaultValue={priceClause}
            onChange={(e) => (priceClause = e.target.value)}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
          />
        </div>
      </div>,
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => closeDrawer && closeDrawer()}
          className="px-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const newContract: SalesContract = {
              id: `CNT-${new Date().getFullYear()}-${String(contractList.length + 1).padStart(2, '0')}`,
              customer: custName,
              type: contractType,
              startDate,
              endDate,
              totalQty,
              releasedQty: 0,
              totalValue: totalQty * unitPrice,
              releasedValue: 0,
              status: 'active',
              items: [
                {
                  item: itemCode,
                  qty: totalQty,
                  price: unitPrice,
                  moq: Math.round(totalQty * 0.05),
                  frequency: 'Bi-Weekly JIT Schedule',
                },
              ],
            };
            setContractList([newContract, ...contractList]);
            if (closeDrawer) closeDrawer();
            showToast(`Blanket Contract ${newContract.id} registered for ${custName}`);
          }}
          className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0d7a7c]"
        >
          Create Contract
        </button>
      </div>
    );
  };

  // Handle Drawdown Release to SO
  const handleReleaseDrawdown = (contract: SalesContract) => {
    if (!openDrawer) return;

    let releaseQty = Math.min(20000, contract.totalQty - contract.releasedQty);
    let targetDeliveryDate = '2026-09-10';
    let customerPO = `PO-DRAWDOWN-${Math.floor(1000 + Math.random() * 9000)}`;

    openDrawer(
      `Release Delivery Drawdown from ${contract.id}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
          <div className="font-bold">{contract.customer}</div>
          <div className="text-[11px] text-blue-700 mt-0.5">
            Agreement: {contract.type} &middot; Balance Qty: {(contract.totalQty - contract.releasedQty).toLocaleString()} PCS
          </div>
        </div>

        <div>
          <label className="font-bold text-[#14213D] block mb-1">Customer Release PO #</label>
          <input
            type="text"
            defaultValue={customerPO}
            onChange={(e) => (customerPO = e.target.value)}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Release Quantity (PCS)</label>
            <input
              type="number"
              defaultValue={releaseQty}
              max={contract.totalQty - contract.releasedQty}
              onChange={(e) => (releaseQty = parseInt(e.target.value) || 5000)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Target Dispatch Date</label>
            <input
              type="date"
              defaultValue={targetDeliveryDate}
              onChange={(e) => (targetDeliveryDate = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
        </div>

        <div className="p-3 bg-[#F6F4EF] rounded-lg space-y-1">
          <div className="flex justify-between text-[#6B7280]">
            <span>Contract Unit Rate:</span>
            <span className="font-mono font-bold text-[#14213D]">₹{contract.items[0]?.price || 35}/PCS</span>
          </div>
          <div className="flex justify-between text-[#6B7280]">
            <span>Release Order Value:</span>
            <span className="font-mono font-bold text-[#0F8B8D]">
              ₹{((releaseQty * (contract.items[0]?.price || 35)) / 100000).toFixed(2)} Lakhs
            </span>
          </div>
          <div className="flex justify-between text-[#6B7280]">
            <span>Remaining Drawdown Capacity:</span>
            <span className="font-mono font-bold text-slate-700">
              {(contract.totalQty - contract.releasedQty - releaseQty).toLocaleString()} PCS
            </span>
          </div>
        </div>
      </div>,
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => closeDrawer && closeDrawer()}
          className="px-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const itemPrice = contract.items[0]?.price || 35;
            const updated = contractList.map((c) =>
              c.id === contract.id
                ? {
                    ...c,
                    releasedQty: c.releasedQty + releaseQty,
                    releasedValue: c.releasedValue + releaseQty * itemPrice,
                    status: (c.releasedQty + releaseQty >= c.totalQty ? 'expired' : c.status) as any,
                  }
                : c
            );
            setContractList(updated);

            if (onCreateSO) {
              const newSO: SalesOrder = {
                id: `SO-50${Math.floor(100 + Math.random() * 900)}`,
                customer: contract.customer,
                customerPO,
                priority: 'High',
                quoteRef: contract.id,
                orderDate: new Date().toISOString().split('T')[0],
                deliveryDate: targetDeliveryDate,
                approval: 'approved',
                lines: [
                  {
                    item: contract.items[0]?.item || 'FG-PLASTIC-ITEM',
                    name: `Drawdown Lot under ${contract.id}`,
                    qty: releaseQty,
                    uom: 'PCS',
                    price: itemPrice,
                    dispatched: 0,
                  },
                ],
                dispatchLogs: [],
                history: [
                  { event: `Generated from Blanket Contract ${contract.id} with PO ${customerPO}`, time: 'Just now' },
                ],
              };
              onCreateSO(newSO);
            }

            if (closeDrawer) closeDrawer();
            showToast(`Released ${releaseQty.toLocaleString()} PCS against Contract ${contract.id}`);
          }}
          className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0d7a7c]"
        >
          Confirm Release &amp; Generate SO
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#0F8B8D]/10 text-[#0F8B8D] font-mono font-bold text-[10px] uppercase tracking-wider">
              Commercial Governance &middot; Long Term Agreements
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[10px] font-semibold border border-amber-200">
              ICIS Polymer Linked
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] mt-1 font-['Space_Grotesk']">
            Sales Contracts &amp; Blanket Agreements
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Annual volume commitments, periodic drawdown schedules, polymer index escalation clauses, and fulfillment tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Exporting active contract schedules...')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-[#F6F4EF] hover:bg-[#E4E0D6] text-xs font-semibold text-[#14213D]"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={handleOpenNewContractDrawer}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0d7a7c] text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> + New Contract
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Total Contract Value</span>
            <BookOpen className="w-4 h-4 text-[#0F8B8D]" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            ₹{(totalContractsValue / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {contractList.length} registered rate agreements
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Total Released (YTD)</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">
            ₹{(totalReleasedValue / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {overallDrawdownPct}% Drawdown Fulfillment
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Active Agreements</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-blue-700 mt-1">
            {activeContractsCount}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            {expiringContractsCount} expiring within 60 days
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Remaining Drawdown Capacity</span>
            <RotateCw className="w-4 h-4 text-[#E8622C]" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#E8622C] mt-1">
            ₹{((totalContractsValue - totalReleasedValue) / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Open commitment for H2 production
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9AA5C4]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Contract ID, Customer Name, or Product..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs bg-[#F6F4EF] focus:outline-none focus:border-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-[#F6F4EF] p-1 rounded-lg border border-[#E4E0D6] text-xs">
            {(['all', 'active', 'expiring', 'expired'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md capitalize font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-[#14213D] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
                <th className="p-3">Contract # &amp; Agreement Type</th>
                <th className="p-3">Customer &amp; Segment</th>
                <th className="p-3">Validity Period</th>
                <th className="p-3">Volume Drawdown Progress</th>
                <th className="p-3 text-right">Total Contract Value</th>
                <th className="p-3 text-right">Released Value</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {pagedContracts.map((c) => {
                const drawdownPct = c.totalQty > 0 ? ((c.releasedQty / c.totalQty) * 100).toFixed(1) : '0';
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-mono font-bold text-[#0F8B8D]">{c.id}</div>
                      <div className="text-[11px] text-[#14213D] font-medium mt-0.5">{c.type}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Items: {c.items.map((it) => it.item).join(', ')}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#14213D]">{c.customer}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-medium">
                        OEM Partner
                      </span>
                    </td>
                    <td className="p-3 text-[#6B7280] font-mono text-[11px]">
                      <div>{c.startDate}</div>
                      <div className="text-[10px] text-slate-400">to {c.endDate}</div>
                    </td>
                    <td className="p-3 min-w-[180px]">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-mono font-bold text-[#14213D]">
                          {c.releasedQty.toLocaleString()} / {c.totalQty.toLocaleString()}
                        </span>
                        <span className="font-semibold text-emerald-700">{drawdownPct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            parseFloat(drawdownPct) >= 90
                              ? 'bg-emerald-500'
                              : parseFloat(drawdownPct) >= 50
                              ? 'bg-[#0F8B8D]'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, parseFloat(drawdownPct))}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                      ₹{(c.totalValue / 100000).toFixed(2)}L
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ₹{(c.releasedValue / 100000).toFixed(2)}L
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'expiring'
                            ? 'bg-amber-100 text-amber-800'
                            : c.status === 'expired'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleReleaseDrawdown(c)}
                          disabled={c.status === 'expired'}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                            c.status === 'expired'
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-[#0F8B8D] text-white hover:bg-[#0d7a7c]'
                          }`}
                        >
                          <Truck className="w-3 h-3" /> Release SO
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          totalItems={filteredContracts.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="contracts"
        />
      </div>
    </div>
  );
};
