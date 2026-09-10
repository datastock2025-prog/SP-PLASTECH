import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Layers,
  ArrowRight,
  Scale,
  CreditCard,
  Building,
  Truck,
} from 'lucide-react';
import { SupplierInvoiceRecord, ExtendedPurchaseOrder } from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  invoices: SupplierInvoiceRecord[];
  pos: ExtendedPurchaseOrder[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateInvoice: (inv: SupplierInvoiceRecord) => void;
  showToast: (msg: string) => void;
}

export const SupplierInvoiceManagementView: React.FC<Props> = ({
  invoices,
  pos,
  onNavigate,
  onUpdateInvoice,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatchStatus, setSelectedMatchStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoiceRecord | null>(invoices[0] || null);

  const filteredInvoices = invoices.filter((i) => {
    const matchSearch =
      i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.poNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = selectedMatchStatus === 'All' || i.matchStatus === selectedMatchStatus;
    return matchSearch && matchStatus;
  });

  const handleApproveMatch = (inv: SupplierInvoiceRecord) => {
    const updated: SupplierInvoiceRecord = {
      ...inv,
      matchStatus: 'matched',
      approvalStatus: 'approved',
      paymentStatus: 'Scheduled',
    };
    onUpdateInvoice(updated);
    setSelectedInvoice(updated);
    showToast(`3-Way Match Approved for Invoice ${inv.invoiceNumber}. Forwarded to Accounts Payable.`);
  };

  const handleCreateDebitNote = (inv: SupplierInvoiceRecord) => {
    const updated: SupplierInvoiceRecord = {
      ...inv,
      debitNoteRef: `DN-2026-${Math.floor(100 + Math.random() * 900)}`,
      matchStatus: 'matched',
    };
    onUpdateInvoice(updated);
    setSelectedInvoice(updated);
    showToast(`Issued Debit Note ${updated.debitNoteRef} for ₹${(inv.varianceAmount || 0).toLocaleString()} price difference`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Supplier Invoices & 3-Way Matching
          </h1>
          <p className="text-xs text-slate-500">
            Verify PO contract price, warehouse GRN accepted quantities, and vendor tax invoices before AP payment release
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('procurementReports')}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <FileText className="w-3.5 h-3.5" /> Accruals Report
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Column: Invoice List */}
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs focus:outline-none"
            />
          </div>

          <div className="space-y-2.5">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedInvoice?.id === inv.id
                    ? 'border-[#0F8B8D] bg-[#0F8B8D]/5 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#14213D]">{inv.invoiceNumber}</span>
                  <ProcurementStatusBadge status={inv.matchStatus} size="xs" />
                </div>
                <div className="text-xs text-slate-600 font-medium mt-1">{inv.supplierName}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>PO: {inv.poNumber}</span>
                  <span className="font-bold text-[#14213D]">₹{(inv.totalInvoiceAmount / 100000).toFixed(2)}L</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: 3-Way Match Inspector */}
        <div className="lg:col-span-2 space-y-5">
          {selectedInvoice ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Match Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold font-['Space_Grotesk'] text-[#14213D]">
                      3-Way Match Verification: {selectedInvoice.invoiceNumber}
                    </h2>
                    <ProcurementStatusBadge status={selectedInvoice.matchStatus} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vendor: <span className="font-semibold text-[#14213D]">{selectedInvoice.supplierName}</span> • PO: <span className="font-mono">{selectedInvoice.poNumber}</span> • GRN: <span className="font-mono">{selectedInvoice.grnNumber}</span>
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Invoice Amount</div>
                  <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
                    ₹{(selectedInvoice.totalInvoiceAmount || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 3 Columns Comparison */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                {/* 1. PO Baseline */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-[#14213D] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0F8B8D]" /> 1. Purchase Order
                  </div>
                  <div className="text-[11px] text-slate-500">Ref: {selectedInvoice.poNumber}</div>
                  <div className="space-y-1 pt-1 text-slate-700">
                    <div>Rate: <strong>₹{(selectedInvoice.lines[0]?.poPrice || 0).toFixed(2)}/kg</strong></div>
                    <div>Qty Ordered: <strong>{(selectedInvoice.lines[0]?.poQty || 0).toLocaleString()} KG</strong></div>
                    <div>Expected Total: <strong>₹{(selectedInvoice.lines[0]?.poTotal || 0).toLocaleString()}</strong></div>
                  </div>
                </div>

                {/* 2. GRN Physical Receipt */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-[#14213D] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-teal-600" /> 2. Warehouse GRN
                  </div>
                  <div className="text-[11px] text-slate-500">Ref: {selectedInvoice.grnNumber}</div>
                  <div className="space-y-1 pt-1 text-slate-700">
                    <div>Qty Received: <strong>{(selectedInvoice.lines[0]?.grnQty || 0).toLocaleString()} KG</strong></div>
                    <div>QC Accepted: <strong className="text-emerald-700">{(selectedInvoice.lines[0]?.grnAcceptedQty || 0).toLocaleString()} KG</strong></div>
                    <div>Gate Status: <strong className="text-emerald-700">Cleared (QC Pass)</strong></div>
                  </div>
                </div>

                {/* 3. Vendor Invoice */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-[#14213D] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-purple-600" /> 3. Vendor Bill
                  </div>
                  <div className="text-[11px] text-slate-500">Ref: {selectedInvoice.invoiceNumber}</div>
                  <div className="space-y-1 pt-1 text-slate-700">
                    <div>Invoiced Rate: <strong>₹{(selectedInvoice.lines[0]?.invoicePrice || 0).toFixed(2)}/kg</strong></div>
                    <div>Invoiced Qty: <strong>{(selectedInvoice.lines[0]?.invoiceQty || 0).toLocaleString()} KG</strong></div>
                    <div>Billed Total: <strong>₹{(selectedInvoice.totalInvoiceAmount || 0).toLocaleString()}</strong></div>
                  </div>
                </div>
              </div>

              {/* Variance Analysis Box */}
              {selectedInvoice.matchStatus === 'price_variance' ? (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Price Variance Detected: Invoiced ₹{selectedInvoice.lines[0]?.invoicePrice} vs PO Contract ₹{selectedInvoice.lines[0]?.poPrice}
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    Vendor billed price differs from contracted rate. Total discrepancy is ₹{(selectedInvoice.varianceAmount || 0).toLocaleString()}.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCreateDebitNote(selectedInvoice)}
                      className="px-3 py-1.5 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg font-semibold shadow-sm"
                    >
                      Generate Debit Note (₹{(selectedInvoice.varianceAmount || 0).toLocaleString()})
                    </button>
                    <button
                      onClick={() => handleApproveMatch(selectedInvoice)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-white text-slate-700 font-semibold"
                    >
                      Accept Variance & Approve
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Perfect 3-Way Match (Zero Price or Quantity Variance)
                  </div>
                  <button
                    onClick={() => handleApproveMatch(selectedInvoice)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm"
                  >
                    Authorize Payment (Pass to AP)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              Select an invoice to review 3-way match.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
