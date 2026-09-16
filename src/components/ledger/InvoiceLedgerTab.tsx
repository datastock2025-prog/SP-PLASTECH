// ============================================================================
// TAB 7: INVOICE LEDGER (PURCHASE AP & SALES AR) & TAX COMPLIANCE
// Step-10 & Step-11 Specification: AP/AR Toggle, 3-Way Match Panel, Tax & E-Invoice
// ============================================================================

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Receipt,
  Truck,
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Building,
  Calendar,
  DollarSign,
  Download,
} from 'lucide-react';
import { InvoiceLedgerRecord, DocumentAccountingImpact } from '../../types/unifiedLedgerTypes';
import { mockInvoices } from '../../data/unifiedLedgerData';

interface Props {
  onOpenAccountingImpact: (impact: DocumentAccountingImpact) => void;
  onOpenDocPreview: (docType: string, docNumber: string, data: any) => void;
  onTraceDoc: (docNumber: string) => void;
}

export const InvoiceLedgerTab: React.FC<Props> = ({
  onOpenAccountingImpact,
  onOpenDocPreview,
  onTraceDoc,
}) => {
  const [invoiceTypeToggle, setInvoiceTypeToggle] = useState<'ALL' | 'Supplier Invoice' | 'Customer Invoice'>('ALL');
  const [selectedInv, setSelectedInv] = useState<InvoiceLedgerRecord>(mockInvoices[0] || {} as any);
  const [detailTab, setDetailTab] = useState<'overview' | 'threeWayMatch' | 'tax' | 'accounting'>('threeWayMatch');

  const filteredInvoices = mockInvoices.filter((inv) => {
    if (invoiceTypeToggle === 'ALL') return true;
    if (invoiceTypeToggle === 'Supplier Invoice') {
      return inv.invoiceType === 'Supplier Invoice' || inv.invoiceType === 'Purchase Invoice';
    }
    if (invoiceTypeToggle === 'Customer Invoice') {
      return inv.invoiceType === 'Customer Invoice' || inv.invoiceType === 'Sales Invoice';
    }
    return inv.invoiceType === invoiceTypeToggle;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Active Invoice Turnover</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            ₹33,76,200
          </span>
          <span className="text-[11px] text-blue-600 block mt-0.5">AP: ₹14.75L | AR: ₹19.01L</span>
        </div>
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 block mb-1">3-Way Match Rate</span>
          <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            100% Matched
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">Zero Price / Qty Deviations</span>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 shadow-xs">
          <span className="text-xs text-purple-700 dark:text-purple-400 block mb-1">E-Invoice IRN & GST Portal</span>
          <span className="text-xl font-bold font-mono text-purple-800 dark:text-purple-300">
            Compliant
          </span>
          <span className="text-[11px] text-purple-600 block mt-0.5">QR Codes Validated</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Eligible Input Tax Credit (ITC)</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            ₹2,25,000
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">GSTR-2B Auto-Reconciled</span>
        </div>
      </div>

      {/* Invoice Register Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Tax Invoice Register (AP & AR) with Upstream 3-Way Match
            </h3>
            <p className="text-[11px] text-slate-500">
              Tax invoices validated against PO, GRN, and delivery notes before general ledger voucher entry
            </p>
          </div>

          <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-lg text-xs">
            <button
              onClick={() => setInvoiceTypeToggle('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                invoiceTypeToggle === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              All Invoices
            </button>
            <button
              onClick={() => setInvoiceTypeToggle('Supplier Invoice')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                invoiceTypeToggle === 'Supplier Invoice'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Vendor Bills (AP)
            </button>
            <button
              onClick={() => setInvoiceTypeToggle('Customer Invoice')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                invoiceTypeToggle === 'Customer Invoice'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Sales Bills (AR)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Invoice # & Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Party & GSTIN</th>
                <th className="py-2.5 px-3">Ref Documents</th>
                <th className="py-2.5 px-3 text-right">Taxable Val</th>
                <th className="py-2.5 px-3 text-right">GST Total</th>
                <th className="py-2.5 px-3 text-right">Total Invoice</th>
                <th className="py-2.5 px-3">3-Way Match</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-center">GL Impact</th>
                <th className="py-2.5 px-3 text-center">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.map((inv) => {
                const isSelected = selectedInv.id === inv.id;
                return (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInv(inv)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-l-4 border-l-[#E8622C]'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">{inv.invoiceDate}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.invoiceType === 'Supplier Invoice' || inv.invoiceType === 'Purchase Invoice'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {inv.invoiceType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{inv.party || inv.customerSupplier || '—'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.partyGstin || '27AAACC5678K1Z2'}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                      <div>{inv.referenceDocument || inv.sourceReference || inv.sourceDocument || '—'}</div>
                      {(inv.referenceGrn || (inv.sourceDocument?.startsWith('GRN') ? inv.sourceDocument : null)) && (
                        <div className="text-[10px] text-emerald-600">
                          {inv.referenceGrn || inv.sourceDocument}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      ₹{(inv.taxableValue ?? inv.invoiceValue ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      ₹{(inv.totalTax ?? inv.taxAmount ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₹{(inv.invoiceTotal ?? inv.netAmount ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {inv.threeWayMatchStatus || 'Matched (100%)'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-semibold">
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAccountingImpact(inv.accountingImpact);
                        }}
                        className="p-1.5 text-[#E8622C] hover:bg-[#E8622C]/10 rounded-lg transition font-semibold"
                        title="View GL Journal Voucher"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTraceDoc(inv.invoiceNumber);
                        }}
                        className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Invoice Details & 3-Way Match Visualizer */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {selectedInv.invoiceNumber} — {selectedInv.party || selectedInv.customerSupplier || 'Party'}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {selectedInv.accountingStatus || 'Posted'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Invoice Total: ₹{(selectedInv.invoiceTotal ?? selectedInv.netAmount ?? selectedInv.invoiceValue ?? 0).toLocaleString('en-IN')} • IRN: {selectedInv.irn || 'IRN-2026-0914-9941'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            {[
              { id: 'threeWayMatch', label: '3-Way Match Visualizer' },
              { id: 'tax', label: 'GST Tax Compliance' },
              { id: 'accounting', label: 'General Ledger Voucher' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition ${
                  detailTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: 3-Way Match Visualizer (Step-10 Requirement) */}
        {detailTab === 'threeWayMatch' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Three-Way Verification Matrix (PO ⟷ GRN ⟷ Invoice)
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded">
                Tolerance Status: Within 0.00% Variance (Approved)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Box 1: Purchase Order */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">1. Purchase Order</span>
                  <span className="font-mono text-blue-600 font-bold">{selectedInv.referenceDocument || selectedInv.sourceReference || 'PO-2026-0842'}</span>
                </div>
                <div className="text-slate-500 space-y-1">
                  <div>Ordered Qty: <span className="font-semibold text-slate-900 dark:text-slate-100">10,000 KG</span></div>
                  <div>Contracted Rate: <span className="font-semibold text-slate-900 dark:text-slate-100">₹125.00 / KG</span></div>
                  <div>PO Base Value: <span className="font-semibold text-slate-900 dark:text-slate-100">₹12,50,000</span></div>
                  <div>Payment Terms: <span className="font-semibold text-slate-900 dark:text-slate-100">Net 30 Days</span></div>
                </div>
              </div>

              {/* Box 2: Goods Receipt (GRN) */}
              <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">2. Goods Receipt (GRN)</span>
                  <span className="font-mono text-emerald-600 font-bold">{selectedInv.referenceGrn || selectedInv.sourceDocument || 'N/A'}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-400 space-y-1">
                  <div>Received Qty: <span className="font-semibold text-slate-900 dark:text-slate-100">10,000 KG</span></div>
                  <div>QC Accepted Qty: <span className="font-semibold text-emerald-600">10,000 KG (100%)</span></div>
                  <div>QC Rejected Qty: <span className="font-semibold text-slate-900 dark:text-slate-100">0 KG</span></div>
                  <div>Dock Gate Entry: <span className="font-semibold text-slate-900 dark:text-slate-100">GE-2026-8801</span></div>
                </div>
              </div>

              {/* Box 3: Tax Invoice */}
              <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-800 dark:text-purple-300">3. Supplier Tax Invoice</span>
                  <span className="font-mono text-purple-600 font-bold">{selectedInv.invoiceNumber}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-400 space-y-1">
                  <div>Billed Qty: <span className="font-semibold text-slate-900 dark:text-slate-100">10,000 KG</span></div>
                  <div>Billed Unit Rate: <span className="font-semibold text-slate-900 dark:text-slate-100">₹125.00</span></div>
                  <div>Total Payable: <span className="font-semibold text-purple-600 font-bold">₹{(selectedInv.invoiceTotal ?? selectedInv.netAmount ?? selectedInv.invoiceValue ?? 1475000).toLocaleString('en-IN')}</span></div>
                  <div>Match Result: <span className="font-bold text-emerald-600">✓ Fully Cleared for Payment</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: GST Tax Compliance (Step-11) */}
        {detailTab === 'tax' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Statutory GST Breakdown & Electronic Portal Compliance
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">CGST (9%)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  ₹{(selectedInv.cgst ?? (selectedInv.taxAmount ? selectedInv.taxAmount / 2 : 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">SGST (9%)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  ₹{(selectedInv.sgst ?? (selectedInv.taxAmount ? selectedInv.taxAmount / 2 : 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">IGST (0%)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  ₹{(selectedInv.igst ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Input Tax Credit (ITC)</span>
                <span className="font-bold text-emerald-600">
                  {selectedInv.itcEligibility || 'Eligible (GSTR-2B Confirmed)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Accounting */}
        {detailTab === 'accounting' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>General Ledger Impact for {selectedInv.invoiceNumber}</span>
              <span className="font-mono text-[#E8622C] font-semibold">
                Journal Entry #{selectedInv.accountingImpact?.journalEntryNumber || selectedInv.linkedJournalEntry || 'JE-2026-0920'}
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              The Invoice posting cleared the temporary GRNI Accrual Account (2120-00), recognized Input Tax Credit GST
              (1410-01 & 1410-02), and created the Accounts Payable liability (2110-00) for {selectedInv.party || selectedInv.customerSupplier}.
            </p>
            <button
              onClick={() => {
                if (selectedInv.accountingImpact) {
                  onOpenAccountingImpact(selectedInv.accountingImpact);
                }
              }}
              className="px-3 py-1.5 bg-[#E8622C] text-white rounded-lg font-semibold text-xs hover:bg-[#d55320] flex items-center gap-1.5 transition"
            >
              <Layers className="w-3.5 h-3.5" /> Open Detailed Journal Voucher
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
