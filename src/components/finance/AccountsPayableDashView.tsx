import React, { useState } from 'react';
import { SupplierInvoice, Supplier, PurchaseOrder, JournalEntry } from '../../types';
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Building,
  Check,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  FileText,
  Percent,
} from 'lucide-react';

interface Props {
  supplierInvoices?: SupplierInvoice[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  onCreateJE?: (je: JournalEntry) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const AccountsPayableDashView: React.FC<Props> = ({
  supplierInvoices: initialSupplierInvoices,
  suppliers = [],
  purchaseOrders = [],
  onCreateJE,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>(
    initialSupplierInvoices || [
      { id: 'SUP-78901', poId: 'PO-3390', supplier: 'SUP-001', date: '21 Aug 2026', dueDate: '20 Sep 2026', amount: 187200, tax: 16848, matchStatus: 'matched', approval: 'approved', paymentStatus: 'unpaid', discountPct: 2, discountDays: 10 },
      { id: 'SUP-78902', poId: 'PO-3392', supplier: 'SUP-003', date: '22 Aug 2026', dueDate: '21 Sep 2026', amount: 136800, tax: 12312, matchStatus: 'qty_variance', approval: 'pending', paymentStatus: 'unpaid', discountPct: 0, discountDays: 0 },
      { id: 'SUP-78903', poId: null, supplier: 'SUP-005', date: '18 Aug 2026', dueDate: '17 Sep 2026', amount: 24500, tax: 2205, matchStatus: 'no_po', approval: 'pending', paymentStatus: 'unpaid', discountPct: 0, discountDays: 0, glAccount: '6200', costCenter: 'CC-MAINT-01' },
      { id: 'SUP-78904', poId: 'PO-3391', supplier: 'SUP-002', date: '25 Aug 2026', dueDate: '24 Sep 2026', amount: 24960, tax: 2246, matchStatus: 'price_variance', approval: 'pending', paymentStatus: 'unpaid', discountPct: 0, discountDays: 0 },
      { id: 'SUP-78905', poId: 'PO-3390', supplier: 'SUP-001', date: '05 Aug 2026', dueDate: '04 Sep 2026', amount: 98000, tax: 8820, matchStatus: 'matched', approval: 'approved', paymentStatus: 'paid', discountPct: 2, discountDays: 10 },
    ]
  );

  const [selectedInvoicesForPayment, setSelectedInvoicesForPayment] = useState<string[]>([]);
  const [filterMatchStatus, setFilterMatchStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const unpaidInvoices = invoices.filter((i) => i.paymentStatus === 'unpaid');
  const totalAP = unpaidInvoices.reduce((s, i) => s + i.amount + i.tax, 0);
  const potentialDiscounts = unpaidInvoices
    .filter((i) => i.discountPct > 0)
    .reduce((s, i) => s + (i.amount * i.discountPct) / 100, 0);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.poId && inv.poId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterMatchStatus === 'all' || inv.matchStatus === filterMatchStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpen3WayMatch = (inv: SupplierInvoice) => {
    openDrawer(
      `3-Way Match Inspector: ${inv.id}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] flex justify-between items-center">
          <div>
            <div className="font-mono text-sm font-bold text-[#14213D]">{inv.id}</div>
            <div className="text-[11px] text-[#6B7280]">Supplier: {inv.supplier} &middot; Due: {inv.dueDate}</div>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase ${
              inv.matchStatus === 'matched'
                ? 'bg-emerald-100 text-emerald-800'
                : inv.matchStatus === 'qty_variance'
                ? 'bg-amber-100 text-amber-800'
                : inv.matchStatus === 'price_variance'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {inv.matchStatus.replace('_', ' ')}
          </span>
        </div>

        {/* 3-Way Match Column Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Purchase Order */}
          <div className="p-3 bg-white rounded-lg border border-[#E4E0D6] space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-[#6B7280]">1. Purchase Order (PO)</div>
            <div className="font-mono font-bold text-[#14213D]">{inv.poId || 'No PO Linked'}</div>
            <div className="text-[11px] text-[#6B7280]">Contracted: 2,400 KG @ ₹78.00/KG</div>
            <div className="text-xs font-semibold text-[#14213D]">Total PO: ₹1,87,200</div>
          </div>

          {/* 2. Goods Receipt Note */}
          <div className="p-3 bg-white rounded-lg border border-[#E4E0D6] space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-[#6B7280]">2. Goods Receipt (GRN)</div>
            <div className="font-mono font-bold text-[#0F8B8D]">GRN-4521 (Warehouse)</div>
            <div className="text-[11px] text-[#6B7280]">Received: 2,400 KG &middot; QA Passed</div>
            <div className="text-xs font-semibold text-[#0F8B8D]">Lot: RM-2026-PP-09</div>
          </div>

          {/* 3. Supplier Tax Invoice */}
          <div className="p-3 bg-white rounded-lg border border-[#E4E0D6] space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-[#6B7280]">3. Vendor Invoice</div>
            <div className="font-mono font-bold text-[#14213D]">{inv.id}</div>
            <div className="text-[11px] text-[#6B7280]">Billed Amount: ₹{inv.amount.toLocaleString('en-IN')}</div>
            <div className="text-xs font-semibold text-[#14213D]">+ GST 18%: ₹{inv.tax.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Tolerance Check */}
        <div className="p-3 bg-[#DCF0EF]/40 rounded-lg border border-[#0F8B8D]/20 text-[11px] text-[#14213D] space-y-1">
          <div className="font-bold text-[#0F8B8D]">Automated Tolerance Verification Check:</div>
          <div>Quantity Tolerance: <b>0.00%</b> variance (Threshold &le; 2.0%)</div>
          <div>Price Tolerance: <b>0.00%</b> variance (Threshold &le; 0.5%)</div>
          <div>Tax &amp; HSN Matching: HSN 39021000 confirmed (18% IGST)</div>
        </div>
      </div>,
      <div className="flex items-center justify-between w-full">
        <button className="px-3 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-lg" onClick={closeDrawer}>
          Cancel
        </button>
        <button
          className="px-4 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C]"
          onClick={() => {
            setInvoices((prev) =>
              prev.map((i) => (i.id === inv.id ? { ...i, matchStatus: 'matched', approval: 'approved' } : i))
            );
            closeDrawer();
            showToast(`Invoice ${inv.id} approved for payment processing`);
          }}
        >
          Approve for Payment Run
        </button>
      </div>
    );
  };

  const handleExecutePaymentRun = () => {
    if (selectedInvoicesForPayment.length === 0) {
      showToast('Please select at least one approved invoice for payment');
      return;
    }

    const selectedList = invoices.filter((i) => selectedInvoicesForPayment.includes(i.id));
    const grossTotal = selectedList.reduce((s, i) => s + i.amount + i.tax, 0);
    const discountTotal = selectedList.reduce(
      (s, i) => s + (i.discountPct > 0 ? (i.amount * i.discountPct) / 100 : 0),
      0
    );
    const netPayment = grossTotal - discountTotal;

    openDrawer(
      'Execute AP Payment Run Batch',
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] space-y-2">
          <div className="font-bold text-sm text-[#14213D]">Disbursement Summary</div>
          <div className="flex justify-between text-[#6B7280]">
            <span>Selected Invoices:</span>
            <span className="font-bold text-[#14213D]">{selectedList.length} vouchers</span>
          </div>
          <div className="flex justify-between text-[#6B7280]">
            <span>Gross Payable Amount:</span>
            <span className="font-mono text-[#14213D]">₹{grossTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-semibold">
            <span>Early Payment Cash Discounts (2%):</span>
            <span className="font-mono">- ₹{discountTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-[#0F8B8D] pt-2 border-t border-[#E4E0D6]">
            <span>Net Bank Disbursement:</span>
            <span className="font-mono">₹{netPayment.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div>
          <label className="block text-[#6B7280] font-semibold mb-1">Disbursement Bank Account *</label>
          <select className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white">
            <option>1110 - HDFC Bank Current A/c (Avail: ₹61.20 L)</option>
            <option>1120 - ICICI Bank Collections A/c (Avail: ₹21.00 L)</option>
          </select>
        </div>

        <div>
          <label className="block text-[#6B7280] font-semibold mb-1">Payment Method &amp; File Format</label>
          <select className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white">
            <option>NEFT / RTGS Corporate Direct Debit (HDFC E-Net)</option>
            <option>Automated Clearing House (NACH Batch)</option>
            <option>Cheque / Demand Draft</option>
          </select>
        </div>
      </div>,
      <div className="flex items-center justify-between w-full">
        <button className="px-3 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-lg" onClick={closeDrawer}>
          Cancel
        </button>
        <button
          className="px-4 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C]"
          onClick={() => {
            setInvoices((prev) =>
              prev.map((i) =>
                selectedInvoicesForPayment.includes(i.id) ? { ...i, paymentStatus: 'paid' } : i
              )
            );
            if (onCreateJE) {
              const jeId = `JE-${new Date().getFullYear()}-PAY-${Date.now().toString().slice(-4)}`;
              onCreateJE({
                id: jeId,
                date: new Date().toISOString().slice(0, 10),
                ref: 'AP-RUN-01',
                memo: `AP Batch Disbursement — ${selectedList.length} vendor invoices`,
                currency: 'INR',
                status: 'posted',
                createdBy: 'AP Manager',
                approvedBy: 'Priya Rao (CFO)',
                lines: [
                  { account: '2100', desc: 'AP Liability cleared', debit: grossTotal, credit: 0, cc: '', tax: '' },
                  { account: '1110', desc: 'HDFC Bank disbursement', debit: 0, credit: netPayment, cc: '', tax: '' },
                  ...(discountTotal > 0
                    ? [{ account: '4200', desc: 'Early Payment Discount Income', debit: 0, credit: discountTotal, cc: '', tax: '' }]
                    : []),
                ],
              });
            }
            setSelectedInvoicesForPayment([]);
            closeDrawer();
            showToast(`Disbursement of ₹${netPayment.toLocaleString('en-IN')} executed and posted to GL!`);
          }}
        >
          Authorize &amp; Post Payment Run
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
            Finance &middot; Accounts Payable (AP)
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Accounts Payable Command Center
          </h1>
          <p className="text-xs text-[#6B7280]">
            3-Way PO-GRN-Invoice matching, early payment discount capture, and automated batch disbursement runs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExecutePaymentRun}
            disabled={selectedInvoicesForPayment.length === 0}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm text-white flex items-center gap-1.5 ${
              selectedInvoicesForPayment.length > 0
                ? 'bg-[#0F8B8D] hover:bg-[#0D7A7C]'
                : 'bg-gray-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Execute Payment Run ({selectedInvoicesForPayment.length})
          </button>
        </div>
      </div>

      {/* AP Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Total AP Outstanding</div>
          <div className="text-2xl font-bold text-[#14213D] font-mono mt-1">
            ₹{(totalAP / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-[#0F8B8D]">{unpaidInvoices.length} unpaid supplier invoices</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">2/10 Early Cash Discounts</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            ₹{potentialDiscounts.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-700">Available if paid within 10 days</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">3-Way Match Pending</div>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">
            {invoices.filter((i) => i.matchStatus !== 'matched').length} Invoices
          </div>
          <div className="text-[10px] text-amber-700">Price/quantity variances detected</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Days Payable Outstanding</div>
          <div className="text-2xl font-bold text-[#14213D] font-mono mt-1">
            28 Days
          </div>
          <div className="text-[10px] text-[#6B7280]">Standard credit term: 30 days</div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6]">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['all', 'matched', 'price_variance', 'qty_variance', 'no_po'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterMatchStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                filterMatchStatus === st
                  ? 'bg-[#14213D] text-white'
                  : 'text-[#6B7280] hover:bg-[#F6F4EF]'
              }`}
            >
              {st === 'all' ? 'All Invoices' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice, vendor, or PO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Supplier Invoices Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedInvoicesForPayment.length > 0 &&
                      selectedInvoicesForPayment.length === unpaidInvoices.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoicesForPayment(unpaidInvoices.map((i) => i.id));
                      } else {
                        setSelectedInvoicesForPayment([]);
                      }
                    }}
                  />
                </th>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3">PO Linked</th>
                <th className="py-2.5 px-3">Invoice Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 text-right">GST (₹)</th>
                <th className="py-2.5 px-3 text-center">Match Status</th>
                <th className="py-2.5 px-3 text-center">Payment</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {filteredInvoices.map((inv) => {
                const isSelected = selectedInvoicesForPayment.includes(inv.id);
                return (
                  <tr key={inv.id} className="hover:bg-[#F6F4EF]/50 transition-colors">
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        disabled={inv.paymentStatus === 'paid'}
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvoicesForPayment((prev) => [...prev, inv.id]);
                          } else {
                            setSelectedInvoicesForPayment((prev) => prev.filter((id) => id !== inv.id));
                          }
                        }}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{inv.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#14213D]">{inv.supplier}</td>
                    <td className="py-2.5 px-3 font-mono text-[#6B7280]">{inv.poId || 'Direct Expense'}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">{inv.date}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#14213D]">{inv.dueDate}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">
                      ₹{inv.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-[#6B7280]">
                      ₹{inv.tax.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.matchStatus === 'matched'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.matchStatus === 'qty_variance'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : inv.matchStatus === 'price_variance'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {inv.matchStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-orange-50 text-[#E8622C]'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleOpen3WayMatch(inv)}
                        className="px-2 py-1 text-[11px] font-semibold text-[#0F8B8D] hover:bg-[#DCF0EF] rounded transition-colors"
                      >
                        Inspect 3-Way
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
