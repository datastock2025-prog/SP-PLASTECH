import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Calendar,
  Building2,
  Clock,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
  Search,
  Plus,
  TrendingDown,
} from 'lucide-react';
import {
  ReturnableDCRecord,
  UserRolePerspective,
} from '../../types/stockTransferTypes';

interface ReturnableDCScreenProps {
  returnableDcs?: ReturnableDCRecord[];
  currentUserRole?: UserRolePerspective;
  onReceiveReturn?: (dcId: string, returnedQty: number, condition: string) => void;
  onConvertToInvoice?: (dcId: string, invoiceNumber: string) => void;
  onOpenCreateModal?: () => void;
  showToast?: (msg: string) => void;
}

export const ReturnableDCScreen: React.FC<ReturnableDCScreenProps> = ({
  returnableDcs = [],
  currentUserRole = 'Logistics & Dispatch Manager',
  onReceiveReturn = (_dcId?: string, _returnedQty?: number, _condition?: string) => {},
  onConvertToInvoice = (_dcId?: string, _invoiceNumber?: string) => {},
  onOpenCreateModal = () => {},
  showToast = (_msg?: string) => {},
}) => {
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [agingFilter, setAgingFilter] = useState<string>('ALL');

  // Receive Return Modal
  const [selectedDcForReturn, setSelectedDcForReturn] = useState<ReturnableDCRecord | null>(null);
  const [returnQtyInput, setReturnQtyInput] = useState<number>(0);
  const [returnCondition, setReturnCondition] = useState<'Good' | 'Damaged' | 'Scrapped'>('Good');

  // Convert to Tax Invoice Modal (Edge Case 4)
  const [selectedDcForInvoice, setSelectedDcForInvoice] = useState<ReturnableDCRecord | null>(null);

  // Returnable DC Print Preview Modal
  const [selectedDcForPrint, setSelectedDcForPrint] = useState<ReturnableDCRecord | null>(null);

  const safeReturnableDcs = returnableDcs || [];

  const filteredDcs = safeReturnableDcs.filter((dc) => {
    const matchesSearch =
      dc.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      dc.destinationName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      dc.itemName.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesAging =
      agingFilter === 'ALL'
        ? true
        : agingFilter === 'GREEN'
        ? dc.agingStatus.includes('<15d')
        : agingFilter === 'AMBER'
        ? dc.agingStatus.includes('15-30d')
        : dc.agingStatus.includes('>30d');

    return matchesSearch && matchesAging;
  });

  const totalIssued = returnableDcs.reduce((acc, d) => acc + d.issuedQty, 0);
  const totalReturned = returnableDcs.reduce((acc, d) => acc + d.returnedQty, 0);
  const totalPending = returnableDcs.reduce((acc, d) => acc + d.pendingReturnQty, 0);

  const handleOpenReceiveModal = (dc: ReturnableDCRecord) => {
    setSelectedDcForReturn(dc);
    setReturnQtyInput(dc.pendingReturnQty);
    setReturnCondition('Good');
  };

  const handleConfirmReceive = () => {
    if (!selectedDcForReturn) return;
    if (returnQtyInput <= 0 || returnQtyInput > selectedDcForReturn.pendingReturnQty) {
      showToast('Please enter a valid return quantity.');
      return;
    }

    onReceiveReturn(selectedDcForReturn.id, returnQtyInput, returnCondition);
    setSelectedDcForReturn(null);
  };

  const handleConfirmInvoiceConversion = () => {
    if (!selectedDcForInvoice) return;
    const invNo = `INV-RET-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    onConvertToInvoice(selectedDcForInvoice.id, invNo);
    setSelectedDcForInvoice(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
              Returnable Packaging Asset Tracker
            </span>
            <span className="text-xs text-slate-500 font-medium">Screen 6: Lifecycle &amp; Aging</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Returnable Delivery Challans (Pallets, Bins &amp; Drums)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict tracking of non-saleable circulating packaging sent to customers and external plants.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Issue Returnable DC
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Total Circulating Assets</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalIssued.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Issued Under Active RDCs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-emerald-700 font-medium">Returned &amp; Sanitized</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{totalReturned.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-medium">
            {Math.round((totalReturned / (totalIssued || 1)) * 100)}% Recovered
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-amber-700 font-medium">Pending In Transit / At Client</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{totalPending.toLocaleString()}</div>
          <div className="text-[11px] text-amber-600 font-medium">Awaiting Physical Return</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-2xs">
          <span className="text-xs text-rose-700 font-bold">Overdue Return (&gt;30 Days)</span>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {returnableDcs.filter((d) => d.agingStatus.includes('>30d') && d.pendingReturnQty > 0).length}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold mt-0.5">Eligible for Tax Invoicing</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search DC #, Customer, or Item..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { key: 'ALL', label: 'All DCs' },
            { key: 'GREEN', label: '< 15 Days (Fresh)' },
            { key: 'AMBER', label: '15 - 30 Days (Warning)' },
            { key: 'RED', label: '> 30 Days (Overdue)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setAgingFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                agingFilter === tab.key
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Returnable DC List Table (Screen 6 Main Table) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 font-bold">DC Number</th>
                <th className="py-3 px-3 font-bold">Destination</th>
                <th className="py-3 px-3 font-bold">Packaging Item</th>
                <th className="py-3 px-3 font-bold text-right">Issued</th>
                <th className="py-3 px-3 font-bold text-right">Returned</th>
                <th className="py-3 px-3 font-bold text-right">Pending Return</th>
                <th className="py-3 px-3 font-bold">Issue Date</th>
                <th className="py-3 px-3 font-bold text-right">Days Out</th>
                <th className="py-3 px-3 font-bold text-center">Aging Status</th>
                <th className="py-3 px-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDcs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No returnable delivery challans found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredDcs.map((dc) => {
                  const isClosed = dc.pendingReturnQty === 0;
                  const isOverdue = dc.agingStatus.includes('>30d') && !isClosed;

                  return (
                    <tr
                      key={dc.id}
                      className={isOverdue ? 'bg-rose-50/40 hover:bg-rose-50' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-teal-700">
                        {dc.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{dc.destinationName}</div>
                        <div className="text-[11px] text-slate-500">{dc.destinationLocation}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{dc.itemName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{dc.itemCode}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        {dc.issuedQty.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-emerald-700">
                        {dc.returnedQty.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {dc.pendingReturnQty.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{dc.issueDate}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        {dc.daysOutstanding}d
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isClosed
                              ? 'bg-slate-100 text-slate-600'
                              : dc.agingStatus.includes('<15d')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : dc.agingStatus.includes('15-30d')
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isClosed ? 'Closed (100% Ret)' : dc.agingStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedDcForPrint(dc)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 rounded bg-slate-100 hover:bg-slate-200"
                          title="Print Returnable DC"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {!isClosed && (
                          <button
                            onClick={() => handleOpenReceiveModal(dc)}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                          >
                            Receive Return
                          </button>
                        )}

                        {/* Edge Case 4 Action Button */}
                        {isOverdue && !dc.convertedToTaxInvoice && (
                          <button
                            onClick={() => setSelectedDcForInvoice(dc)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                          >
                            Convert to Tax Invoice
                          </button>
                        )}

                        {dc.convertedToTaxInvoice && (
                          <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 font-mono text-[10px] font-bold">
                            Invoiced: {dc.taxInvoiceNumber}
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

      {/* MODAL 1: Receive Return Workflow */}
      {selectedDcForReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Receive Packaging Return</h3>
              </div>
              <button
                onClick={() => setSelectedDcForReturn(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>DC Ref: <strong className="font-mono text-teal-700">{selectedDcForReturn.id}</strong></div>
              <div>Item: <strong className="text-slate-900">{selectedDcForReturn.itemName}</strong></div>
              <div>From: <strong>{selectedDcForReturn.destinationName}</strong></div>
              <div>Pending Return: <strong className="text-amber-800">{selectedDcForReturn.pendingReturnQty} Units</strong></div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Physical Return Quantity Counted <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedDcForReturn.pendingReturnQty}
                  value={returnQtyInput}
                  onChange={(e) => setReturnQtyInput(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Condition of Returned Pallets / Bins</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                >
                  <option value="Good">Good Condition - Restock to Returnable Packaging Store</option>
                  <option value="Damaged">Damaged - Requires Repair / Wash</option>
                  <option value="Scrapped">Scrapped / Broken Beyond Repair</option>
                </select>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-900">
                Stock will be directly added back to <strong>"Returnable Packaging Yard (STR-PMP-RET)"</strong>. If 100% of
                issued count is returned, the DC will automatically be closed.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedDcForReturn(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReceive}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edge Case 4 Convert to Tax Invoice Modal */}
      {selectedDcForInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-rose-300">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-sm font-black">Convert Overdue Returnable DC to Tax Invoice</h3>
            </div>

            <p className="text-xs text-slate-600">
              According to statutory GST packaging rules, returnable packaging outstanding for over 30 days without return
              agreement must be converted to an official Tax Invoice to bill the recipient for lost assets.
            </p>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">DC Number:</span>
                <span className="font-mono font-bold text-slate-900">{selectedDcForInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Customer:</span>
                <span className="font-bold text-slate-900">{selectedDcForInvoice.destinationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unreturned Asset:</span>
                <span className="font-bold text-slate-900">
                  {selectedDcForInvoice.pendingReturnQty} x {selectedDcForInvoice.itemName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Days Outstanding:</span>
                <span className="font-bold text-rose-700">{selectedDcForInvoice.daysOutstanding} Days</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-rose-200">
                <span className="font-bold text-slate-900">Billing Amount (@ ₹{selectedDcForInvoice.notionalValuePerUnit}/unit):</span>
                <span className="font-black text-rose-700 font-mono text-sm">
                  ₹{(selectedDcForInvoice.pendingReturnQty * selectedDcForInvoice.notionalValuePerUnit).toLocaleString('en-IN')} + 18% GST
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedDcForInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmInvoiceConversion}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm"
              >
                Generate Tax Invoice &amp; Bill Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Print Returnable DC Modal */}
      {selectedDcForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Returnable Delivery Challan</h3>
              <button onClick={() => setSelectedDcForPrint(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="border border-slate-300 p-4 rounded-xl text-xs space-y-3">
              <div className="p-2 bg-amber-50 border border-amber-300 rounded text-center font-bold text-amber-900">
                "Goods sent on returnable basis. Not for sale."
              </div>

              <div className="flex justify-between">
                <div>
                  <div className="font-bold">Unit 1 - Pimpri Auto-Plastics</div>
                  <div className="text-slate-500 text-[11px]">Returnable Packaging Division</div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-teal-700">{selectedDcForPrint.id}</div>
                  <div className="text-slate-500 text-[11px]">Date: {selectedDcForPrint.issueDate}</div>
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded">
                <div>Consignee: <strong>{selectedDcForPrint.destinationName}</strong></div>
                <div className="text-slate-500 text-[11px]">{selectedDcForPrint.destinationLocation}</div>
              </div>

              <div className="p-3 border rounded space-y-1">
                <div className="font-bold">{selectedDcForPrint.itemName}</div>
                <div>Quantity Issued: <strong>{selectedDcForPrint.issuedQty} Units</strong></div>
                <div>Condition: Industrial Grade 4-Way Entry</div>
              </div>

              <div className="text-[10px] text-slate-500 italic pt-2">
                Statutory clause: The recipient agrees to return these packaging units within 14 days in sound condition.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedDcForPrint(null)}
                className="px-4 py-2 bg-slate-100 rounded-lg text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast('Printed Returnable DC.');
                  setSelectedDcForPrint(null);
                }}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print Challan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
