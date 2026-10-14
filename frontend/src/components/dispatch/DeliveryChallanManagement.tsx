import React, { useState } from 'react';
import {
  Truck,
  Search,
  Filter,
  Plus,
  Eye,
  FileCheck,
  FileText,
  ShieldCheck,
  Download,
  Printer,
  Calendar,
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle,
  UploadCloud,
  ChevronDown,
} from 'lucide-react';
import {
  DeliveryNoteChallan,
  EInvoiceRecord,
  EWayBillRecord,
  GatePassRecord,
} from '../../types/salesOrderDeliveryTypes';

interface DeliveryChallanManagementProps {
  deliveries?: DeliveryNoteChallan[];
  onSelectDelivery?: (delivery: DeliveryNoteChallan) => void;
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const DeliveryChallanManagement: React.FC<DeliveryChallanManagementProps> = ({
  deliveries = [],
  onSelectDelivery = (_delivery?: DeliveryNoteChallan) => {},
  onNavigate = (_view?: string, _param?: any) => {},
  showToast = (_msg?: string) => {},
}) => {
  const [activeTab, setActiveTab] = useState('All Deliveries');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlant, setFilterPlant] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const safeDeliveries = deliveries || [];

  // Metrics
  const totalCount = safeDeliveries.length;
  const totalValue = safeDeliveries.reduce((sum, d) => sum + (d.invoiceValue || 0), 0);
  const challansToday = safeDeliveries.filter((d) => (d.deliveryDate === '2026-09-12' || d.dispatchDate === '2026-09-12' || d.date === '2026-09-12')).length;
  const inTransitCount = safeDeliveries.filter((d) => d.status === 'In-Transit').length;
  const pendingGatePass = safeDeliveries.filter((d) => !d.gatePassNumber).length;
  const ewbPending = safeDeliveries.filter((d) => d.ewbStatus === 'Pending').length;
  const eInvPending = safeDeliveries.filter((d) => d.eInvoiceStatus === 'Pending').length;

  const tabs = [
    'All Deliveries',
    'Draft',
    'Picked & Packed',
    'Challan Generated',
    'E-Invoiced',
    'E-Way Bill Generated',
    'Gate Pass Issued',
    'Dispatched / In-Transit',
    'Delivered',
    'Cancelled / Returned',
  ];

  // Filtering
  const filtered = safeDeliveries.filter((d) => {
    if (activeTab === 'Draft' && d.status !== 'Draft') return false;
    if (activeTab === 'Picked & Packed' && d.status !== 'Packaged') return false;
    if (activeTab === 'Challan Generated' && d.status !== 'Challan Generated') return false;
    if (activeTab === 'E-Invoiced' && d.status !== 'E-Invoiced') return false;
    if (activeTab === 'E-Way Bill Generated' && d.ewbStatus !== 'Generated') return false;
    if (activeTab === 'Gate Pass Issued' && d.status !== 'Gate Pass Issued') return false;
    if (activeTab === 'Dispatched / In-Transit' && d.status !== 'In-Transit') return false;
    if (activeTab === 'Delivered' && d.status !== 'Delivered') return false;
    if (activeTab === 'Cancelled / Returned' && d.status !== 'Cancelled') return false;

    if (filterPlant !== 'All' && !d.plant.includes(filterPlant)) return false;
    if (filterType !== 'All' && d.type !== filterType) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = d.id.toLowerCase().includes(q);
      const matchSo = d.salesOrderId.toLowerCase().includes(q);
      const matchCust = d.customer.toLowerCase().includes(q);
      const matchVeh = d.vehicleNumber.toLowerCase().includes(q);
      const matchIrn = d.irn?.toLowerCase().includes(q);
      const matchEwb = d.ewbNumber?.toLowerCase().includes(q);
      if (!matchId && !matchSo && !matchCust && !matchVeh && !matchIrn && !matchEwb) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#0F8B8D]/10 text-[#0F8B8D]">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-gray-900 font-['Space_Grotesk']">
              Delivery Notes & Outward Dispatch Challans
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Rule 55 Delivery Challans, Tax Invoices, and Gate Security Passes with IRN/EWB integration.
          </p>
        </div>

        <button
          onClick={() => onNavigate('createChallan')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold shadow-sm self-start sm:self-auto transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Delivery Note
        </button>
      </div>

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Total Delivery Notes</div>
          <div className="text-lg font-bold text-gray-900 mt-1">{totalCount}</div>
          <div className="text-[10px] text-gray-400">₹{(totalValue / 100000).toFixed(1)}L total</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Generated Today</div>
          <div className="text-lg font-bold text-[#0F8B8D] mt-1">{challansToday} Notes</div>
          <div className="text-[10px] text-gray-400">September 12, 2026</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">In-Transit</div>
          <div className="text-lg font-bold text-blue-700 mt-1">{inTransitCount} Loads</div>
          <div className="text-[10px] text-blue-600">On the road</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Pending Gate Pass</div>
          <div className="text-lg font-bold text-amber-700 mt-1">{pendingGatePass} Pending</div>
          <div className="text-[10px] text-gray-400">Security hold</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">E-Way Bills Pending</div>
          <div className="text-lg font-bold text-red-700 mt-1">{ewbPending} Pending</div>
          <div className="text-[10px] text-gray-400">Part A/B needed</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">E-Invoices Pending</div>
          <div className="text-lg font-bold text-purple-700 mt-1">{eInvPending} Pending</div>
          <div className="text-[10px] text-gray-400">NIC IRP queue</div>
        </div>
      </div>

      {/* 10 Tab Navigation */}
      <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search Challan #, SO #, Customer, Vehicle #, LR #, IRN, EWB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterPlant}
            onChange={(e) => setFilterPlant(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 text-xs"
          >
            <option value="All">All Plants</option>
            <option value="Plant 1">Plant 1 - Pimpri</option>
            <option value="Plant 2">Plant 2 - Chakan</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 text-xs"
          >
            <option value="All">All Challan Types</option>
            <option value="Delivery Challan">Delivery Challan</option>
            <option value="Tax Invoice-cum-Challan">Tax Invoice-cum-Challan</option>
            <option value="Job Work Challan">Job Work Challan</option>
          </select>

          <button
            onClick={() => showToast('Exported Delivery Register (Excel).')}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" /> Export Excel
          </button>
        </div>
      </div>

      {/* 16-Column Detailed Deliveries Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-bold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-2.5">Delivery # & Date</th>
                <th className="p-2.5">Type & SO #</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Plant & Store</th>
                <th className="p-2.5 text-right">Items & Qty</th>
                <th className="p-2.5 text-right">Value (₹)</th>
                <th className="p-2.5">Vehicle & Transporter</th>
                <th className="p-2.5">E-Invoice (IRN)</th>
                <th className="p-2.5">E-Way Bill</th>
                <th className="p-2.5">Gate Pass</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => onSelectDelivery(d)}
                  className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                >
                  {/* Delivery # & Date */}
                  <td className="p-2.5">
                    <div className="font-mono font-bold text-[#0F8B8D]">{d.id}</div>
                    <div className="text-[10px] text-gray-400">{d.deliveryDate || d.dispatchDate || d.date || '-'}</div>
                  </td>

                  {/* Type & SO # */}
                  <td className="p-2.5">
                    <div className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 inline-block">
                      {d.type}
                    </div>
                    <div className="font-mono text-gray-600 text-[10px] mt-0.5">SO: {d.salesOrderId}</div>
                  </td>

                  {/* Customer */}
                  <td className="p-2.5">
                    <div className="font-semibold text-gray-900 truncate max-w-[160px]">{d.customer}</div>
                    <div className="font-mono text-[10px] text-gray-400">{d.customerGstin}</div>
                  </td>

                  {/* Plant & Store */}
                  <td className="p-2.5 text-gray-600">
                    <div>{d.plant ? d.plant.split('-')[0].trim() : '-'}</div>
                    <div className="text-[10px] text-gray-400">{d.fgStore}</div>
                  </td>

                  {/* Items & Qty */}
                  <td className="p-2.5 text-right">
                    <div className="font-bold text-gray-900">
                      {(d.items || []).reduce((s, i) => s + (i.deliveredQty ?? i.packedQty ?? i.pickedQty ?? i.requestedQty ?? i.orderedQty ?? 0), 0).toLocaleString()} PCS
                    </div>
                    <div className="text-[10px] text-gray-400">{(d.items || []).length} product(s)</div>
                  </td>

                  {/* Value */}
                  <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                    ₹{(d.invoiceValue ?? 0).toLocaleString()}
                  </td>

                  {/* Vehicle & Transporter */}
                  <td className="p-2.5">
                    <div className="font-mono font-bold text-gray-900">{d.vehicleNumber}</div>
                    <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{d.transporterName}</div>
                  </td>

                  {/* E-Invoice */}
                  <td className="p-2.5">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        d.eInvoiceStatus === 'Generated'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.eInvoiceStatus}
                    </span>
                    {d.irn && (
                      <div className="font-mono text-[9px] text-gray-400 truncate max-w-[90px]">
                        {d.irn.substring(0, 10)}...
                      </div>
                    )}
                  </td>

                  {/* E-Way Bill */}
                  <td className="p-2.5">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        d.ewbStatus === 'Generated'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.ewbStatus}
                    </span>
                    {d.ewbNumber && (
                      <div className="font-mono text-[9px] text-gray-600">{d.ewbNumber}</div>
                    )}
                  </td>

                  {/* Gate Pass */}
                  <td className="p-2.5">
                    {d.gatePassNumber ? (
                      <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {d.gatePassNumber}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-semibold">Pending</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.status === 'In-Transit'
                          ? 'bg-blue-100 text-blue-800'
                          : d.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.status === 'Gate Pass Issued'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectDelivery(d)}
                      className="p-1 text-gray-500 hover:text-[#0F8B8D]"
                      title="View Challan Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
