import React, { useState } from 'react';
import { CustomerInvoice, CreditDebitNote, Customer, SalesOrder } from '../../types';
import {
  FileText,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  DollarSign,
  Download,
  Calendar,
  Send,
} from 'lucide-react';

interface Props {
  invoices?: CustomerInvoice[];
  creditDebitNotes?: CreditDebitNote[];
  customers?: Customer[];
  sos?: SalesOrder[];
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const CustomerInvoicesView: React.FC<Props> = ({
  invoices: initialInvoices,
  creditDebitNotes: initialCDNotes,
  customers = [],
  sos = [],
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'creditNotes'>('invoices');
  const [invoices, setInvoices] = useState<CustomerInvoice[]>(
    initialInvoices && initialInvoices.length > 0
      ? initialInvoices
      : [
          {
            id: 'INV-2201',
            customer: 'CUST-001',
            soId: 'SO-501',
            date: '20 Aug 2026',
            dueDate: '19 Sep 2026',
            lines: [{ item: 'FG-CTN-500', name: 'Plastic Container 500ml', qty: 6000, price: 9.5 }],
            paid: 28500,
            history: [{ event: 'Invoice raised', time: '20 Aug 2026' }],
          },
          {
            id: 'INV-2202',
            customer: 'CUST-003',
            soId: 'SO-503',
            date: '21 Aug 2026',
            dueDate: '20 Sep 2026',
            lines: [{ item: 'FG-PET-030', name: 'PET Bottle Preform', qty: 40000, price: 2.6 }],
            paid: 0,
            history: [{ event: 'Invoice raised', time: '21 Aug 2026' }],
          },
          {
            id: 'INV-2203',
            customer: 'CUST-002',
            soId: null,
            date: '05 Aug 2026',
            dueDate: '04 Sep 2026',
            lines: [{ item: 'FG-BKT-010', name: 'Household Bucket 10L', qty: 1500, price: 42 }],
            paid: 63000,
            history: [{ event: 'Invoice raised', time: '05 Aug 2026' }],
          },
        ]
  );

  const [cdNotes, setCdNotes] = useState<CreditDebitNote[]>(
    initialCDNotes || [
      { id: 'CN-501', type: 'credit', relatedInvoice: 'INV-2202', party: 'CUST-003', date: '22 Aug 2026', amount: 8400, reason: 'Quality Rejection (Short shot)', status: 'approved', appliedAmount: 0 },
      { id: 'CN-502', type: 'credit', relatedInvoice: 'INV-2201', party: 'CUST-001', date: '21 Aug 2026', amount: 1200, reason: 'Volume Rebate Tier Adjustment', status: 'applied', appliedAmount: 1200 },
      { id: 'DN-201', type: 'debit', relatedInvoice: 'SUP-78901', party: 'SUP-001', date: '23 Aug 2026', amount: 3200, reason: 'Freight Surcharge Overcharge', status: 'draft', appliedAmount: 0 },
    ]
  );

  const [searchTerm, setSearchTerm] = useState('');

  const handlePrintTaxInvoice = (inv: CustomerInvoice) => {
    const subtotal = inv.lines.reduce((s, l) => s + l.qty * l.price, 0);
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const grandTotal = subtotal + cgst + sgst;

    openDrawer(
      `Tax Invoice Document: ${inv.id}`,
      <div className="space-y-4 text-xs font-sans">
        {/* Printable Tax Invoice Paper Layout */}
        <div className="p-6 bg-white border border-[#E4E0D6] rounded-xl space-y-5 shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4 border-[#E4E0D6]">
            <div>
              <div className="font-mono text-[10px] uppercase font-bold text-[#0F8B8D]">
                TAX INVOICE (RULE 46 OF CGST RULES)
              </div>
              <h2 className="text-lg font-bold text-[#14213D] font-['Space_Grotesk']">
                POLYMER PRECISION INDUSTRIES PVT LTD
              </h2>
              <div className="text-[11px] text-[#6B7280]">
                Plot 42, GIDC Industrial Estate, Vatva, Ahmedabad, Gujarat - 382445
              </div>
              <div className="text-[11px] text-[#14213D] font-mono mt-0.5">
                GSTIN: <b>24AAACP1234F1Z8</b> &middot; PAN: AAACP1234F &middot; State Code: 24
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold font-mono text-[#0F8B8D]">{inv.id}</div>
              <div className="text-[11px] text-[#6B7280]">Invoice Date: <b>{inv.date}</b></div>
              <div className="text-[11px] text-[#6B7280]">Due Date: <b>{inv.dueDate}</b></div>
              <div className="text-[11px] text-[#6B7280]">SO Ref: <b>{inv.soId || 'Direct'}</b></div>
            </div>
          </div>

          {/* Billed To */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#6B7280]">Billed To Customer:</div>
              <div className="font-bold text-sm text-[#14213D]">{inv.customer}</div>
              <div className="text-[11px] text-[#6B7280]">Industrial Packaging Division, Plot 88, Peenya Industrial Area</div>
              <div className="text-[11px] text-[#14213D] font-mono mt-0.5">GSTIN: 29AABCS8891G1Z4 &middot; State: Karnataka (29)</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#6B7280]">Dispatched From:</div>
              <div className="font-bold text-[#14213D]">FG Warehouse 01 (Central Plant)</div>
              <div className="text-[11px] text-[#6B7280]">Transport Mode: Road Transport / Dedicated Container Van</div>
              <div className="text-[11px] text-[#14213D] font-mono">E-Way Bill: 241988273619 (Valid)</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[#E4E0D6] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F4EF] text-[10px] uppercase text-[#6B7280]">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Item Code &amp; Description</th>
                  <th className="p-2">HSN / SAC</th>
                  <th className="p-2 text-right">Quantity</th>
                  <th className="p-2 text-right">Unit Rate (₹)</th>
                  <th className="p-2 text-right">Taxable Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {inv.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="p-2 text-[#6B7280] font-mono">{i + 1}</td>
                    <td className="p-2">
                      <div className="font-mono font-bold text-[#14213D]">{l.item}</div>
                      <div className="text-[10px] text-[#6B7280]">{l.name}</div>
                    </td>
                    <td className="p-2 font-mono text-[#6B7280]">39233090</td>
                    <td className="p-2 font-mono text-right">{l.qty.toLocaleString()} PCS</td>
                    <td className="p-2 font-mono text-right">₹{l.price.toFixed(2)}</td>
                    <td className="p-2 font-mono text-right font-semibold">₹{(l.qty * l.price).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-xs border-t pt-2 border-[#E4E0D6]">
              <div className="flex justify-between text-[#6B7280]">
                <span>Taxable Amount:</span>
                <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>CGST (9.00%):</span>
                <span className="font-mono">₹{cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>SGST (9.00%):</span>
                <span className="font-mono">₹{sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#0F8B8D] pt-2 border-t border-[#E4E0D6]">
                <span>Total Invoice Value:</span>
                <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Bank Details & Signatory */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E4E0D6] text-[10px] text-[#6B7280]">
            <div>
              <div className="font-bold text-[#14213D]">Bank Remittance Details:</div>
              <div>Bank: HDFC Bank &middot; Branch: Vatva Industrial Branch</div>
              <div>A/c Name: Polymer Precision Industries Pvt Ltd</div>
              <div>A/c No: 50200088912340 &middot; IFSC: HDFC0000421</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-[#14213D]">For Polymer Precision Industries Pvt Ltd</div>
              <div className="h-10"></div>
              <div className="font-semibold text-[#14213D]">Authorized Signatory / Finance Controller</div>
            </div>
          </div>
        </div>
      </div>,
      <div className="flex items-center justify-between w-full">
        <button
          className="px-3 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF] flex items-center gap-1.5"
          onClick={() => showToast(`Printed Tax Invoice ${inv.id} successfully`)}
        >
          <Printer className="w-3.5 h-3.5 text-[#0F8B8D]" /> Print / PDF Tax Invoice
        </button>
        <button className="px-4 py-1.5 text-xs bg-[#14213D] text-white rounded-lg" onClick={closeDrawer}>
          Close
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Finance &middot; Sales Billing &amp; Tax Invoicing
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Customer Invoices &amp; Credit Notes
          </h1>
          <p className="text-xs text-[#6B7280]">
            GST-compliant tax invoices, HSN 3923 plastic packaging classification, and customer credit adjustment vouchers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Opening New Tax Invoice creator...')}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> + Create Tax Invoice
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E4E0D6] gap-4">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'invoices'
              ? 'border-[#0F8B8D] text-[#0F8B8D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          Tax Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('creditNotes')}
          className={`pb-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'creditNotes'
              ? 'border-[#0F8B8D] text-[#0F8B8D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          Credit / Debit Notes ({cdNotes.length})
        </button>
      </div>

      {/* Invoices List */}
      {activeTab === 'invoices' ? (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">SO Reference</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Taxable Value</th>
                  <th className="py-2.5 px-3 text-right">GST (18%)</th>
                  <th className="py-2.5 px-3 text-right">Total Invoice (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {invoices.map((inv) => {
                  const subtotal = inv.lines.reduce((s, l) => s + l.qty * l.price, 0);
                  const gst = subtotal * 0.18;
                  const total = subtotal + gst;
                  const isPaid = inv.paid >= total;

                  return (
                    <tr key={inv.id} className="hover:bg-[#F6F4EF]/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{inv.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#14213D]">{inv.customer}</td>
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{inv.soId || 'Manual Bill'}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">{inv.date}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#14213D]">{inv.dueDate}</td>
                      <td className="py-2.5 px-3 font-mono text-right text-[#6B7280]">
                        ₹{subtotal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-[#6B7280]">
                        ₹{gst.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">
                        ₹{total.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handlePrintTaxInvoice(inv)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-[#DCF0EF] text-[#0F8B8D] hover:bg-[#c6eae8] rounded transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3 h-3" /> View Tax Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Credit / Debit Notes */
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Note #</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Party (Customer / Vendor)</th>
                  <th className="py-2.5 px-3">Related Invoice</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reason / Justification</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {cdNotes.map((note) => (
                  <tr key={note.id} className="hover:bg-[#F6F4EF]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{note.id}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          note.type === 'credit'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {note.type} Note
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#14213D]">{note.party}</td>
                    <td className="py-2.5 px-3 font-mono text-[#6B7280]">{note.relatedInvoice}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">{note.date}</td>
                    <td className="py-2.5 px-3 text-[#14213D]">{note.reason}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">
                      ₹{note.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                        {note.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
