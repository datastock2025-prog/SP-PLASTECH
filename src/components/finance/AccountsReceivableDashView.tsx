import React, { useState } from 'react';
import { CustomerInvoice, Customer, CustomerPayment, JournalEntry } from '../../types';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  Building,
  Plus,
  Search,
  Filter,
  FileText,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';

interface Props {
  invoices?: CustomerInvoice[];
  customers?: Customer[];
  onCreateJE?: (je: JournalEntry) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const AccountsReceivableDashView: React.FC<Props> = ({
  invoices: initialInvoices,
  customers: initialCustomers,
  onCreateJE,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoice[]>(
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
          {
            id: 'INV-2204',
            customer: 'CUST-004',
            soId: 'SO-504',
            date: '10 Jul 2026',
            dueDate: '09 Aug 2026',
            lines: [{ item: 'FG-CAP-028', name: 'Flip-top Cap 28mm', qty: 50000, price: 1.2 }],
            paid: 0,
            history: [{ event: 'Invoice raised', time: '10 Jul 2026' }],
          },
        ]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [agingFilter, setAgingFilter] = useState<'all' | 'current' | 'overdue'>('all');

  const totalAR = customerInvoices.reduce((sum, inv) => {
    const totalBilled = inv.lines.reduce((s, l) => s + l.qty * l.price, 0);
    return sum + (totalBilled - inv.paid);
  }, 0);

  const overdueAR = customerInvoices
    .filter((inv) => inv.id === 'INV-2204')
    .reduce((sum, inv) => {
      const totalBilled = inv.lines.reduce((s, l) => s + l.qty * l.price, 0);
      return sum + (totalBilled - inv.paid);
    }, 0);

  const handleRecordPayment = (inv: CustomerInvoice) => {
    const totalBilled = inv.lines.reduce((s, l) => s + l.qty * l.price, 0);
    const remainingBalance = totalBilled - inv.paid;
    let paymentAmount = remainingBalance;
    let paymentMethod = 'NEFT / Bank Transfer';
    let paymentRef = `PAY-REC-${Date.now().toString().slice(-4)}`;

    openDrawer(
      `Record Customer Receipt: ${inv.id}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] space-y-1">
          <div className="text-xs font-bold text-[#14213D]">Invoice {inv.id} &middot; {inv.customer}</div>
          <div className="flex justify-between text-[#6B7280]">
            <span>Total Invoiced:</span>
            <span className="font-mono">₹{totalBilled.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[#6B7280]">
            <span>Already Received:</span>
            <span className="font-mono">₹{inv.paid.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-bold text-[#0F8B8D] text-sm pt-1 border-t border-[#E4E0D6]">
            <span>Outstanding Receivable:</span>
            <span className="font-mono">₹{remainingBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div>
          <label className="block text-[#6B7280] font-semibold mb-1">Receipt Amount (₹) *</label>
          <input
            type="number"
            defaultValue={remainingBalance}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono text-sm font-bold text-emerald-700"
            onChange={(e) => {
              paymentAmount = parseFloat(e.target.value) || 0;
            }}
          />
        </div>

        <div>
          <label className="block text-[#6B7280] font-semibold mb-1">Payment Method &amp; Bank Channel *</label>
          <select
            defaultValue={paymentMethod}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            onChange={(e) => {
              paymentMethod = e.target.value;
            }}
          >
            <option>1120 - ICICI Collections A/c (RTGS/NEFT Direct Credit)</option>
            <option>1110 - HDFC Current A/c (Customer Cheque Clearing)</option>
            <option>Customer Advance Adjustment</option>
          </select>
        </div>

        <div>
          <label className="block text-[#6B7280] font-semibold mb-1">Bank Reference / UTR Number</label>
          <input
            type="text"
            defaultValue={paymentRef}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono"
            onChange={(e) => {
              paymentRef = e.target.value;
            }}
          />
        </div>
      </div>,
      <div className="flex items-center justify-between w-full">
        <button className="px-3 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-lg" onClick={closeDrawer}>
          Cancel
        </button>
        <button
          className="px-4 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C]"
          onClick={() => {
            if (paymentAmount <= 0) {
              showToast('Please enter a valid receipt amount');
              return;
            }
            setCustomerInvoices((prev) =>
              prev.map((i) =>
                i.id === inv.id ? { ...i, paid: Math.min(totalBilled, i.paid + paymentAmount) } : i
              )
            );
            if (onCreateJE) {
              const jeId = `JE-${new Date().getFullYear()}-RCP-${Date.now().toString().slice(-4)}`;
              onCreateJE({
                id: jeId,
                date: new Date().toISOString().slice(0, 10),
                ref: inv.id,
                memo: `Customer Receipt ${inv.customer} — Ref: ${paymentRef}`,
                currency: 'INR',
                status: 'posted',
                createdBy: 'AR Officer',
                approvedBy: 'Priya Rao (CFO)',
                lines: [
                  { account: '1120', desc: 'Bank Collections A/c', debit: paymentAmount, credit: 0, cc: '', tax: '' },
                  { account: '1200', desc: `AR Cleared - ${inv.customer}`, debit: 0, credit: paymentAmount, cc: '', tax: '' },
                ],
              });
            }
            closeDrawer();
            showToast(`Received ₹${paymentAmount.toLocaleString('en-IN')} for ${inv.id}. Posted to GL!`);
          }}
        >
          Post Payment Receipt &amp; Clear AR
        </button>
      </div>
    );
  };

  const handleSendDunningNotice = (inv: CustomerInvoice) => {
    showToast(`Dunning reminder notice automatically dispatched to ${inv.customer} via Email & SMS.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Finance &middot; Accounts Receivable (AR) &amp; Credit Control
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Accounts Receivable &amp; Collections
          </h1>
          <p className="text-xs text-[#6B7280]">
            Customer payment collections, aging schedule analysis, dunning triggers, and credit exposure control.
          </p>
        </div>
      </div>

      {/* AR KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Total Receivables (AR)</div>
          <div className="text-2xl font-bold text-[#14213D] font-mono mt-1">
            ₹{(totalAR / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-[#0F8B8D]">Total open customer balance</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Current (0 - 30 Days)</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            ₹{((totalAR - overdueAR) / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-emerald-700">Within payment terms</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Overdue (&gt; 30 Days)</div>
          <div className="text-2xl font-bold text-[#E8622C] font-mono mt-1">
            ₹{(overdueAR / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-[#E8622C]">Requires collection follow-up</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Days Sales Outstanding (DSO)</div>
          <div className="text-2xl font-bold text-[#14213D] font-mono mt-1">
            38 Days
          </div>
          <div className="text-[10px] text-[#6B7280]">Target benchmark: &le; 45 days</div>
        </div>
      </div>

      {/* Customer Invoices Ledger */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F6F4EF]/50">
          <div>
            <h2 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk']">
              Receivables Subledger &amp; Collections
            </h2>
            <p className="text-[11px] text-[#6B7280]">
              Invoice balances, payment receipts, and collection reminders.
            </p>
          </div>
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice or customer code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-lg focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Invoiced (₹)</th>
                <th className="py-2.5 px-3 text-right">Received (₹)</th>
                <th className="py-2.5 px-3 text-right">Balance Due (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {customerInvoices.map((inv) => {
                const totalBilled = inv.lines.reduce((s, l) => s + l.qty * l.price, 0);
                const balanceDue = totalBilled - inv.paid;
                const isPaid = balanceDue <= 0;
                const isOverdue = inv.id === 'INV-2204';

                return (
                  <tr key={inv.id} className="hover:bg-[#F6F4EF]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{inv.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#14213D]">{inv.customer}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">{inv.date}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#14213D]">{inv.dueDate}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">
                      ₹{totalBilled.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-700">
                      ₹{inv.paid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">
                      {isPaid ? '-' : `₹${balanceDue.toLocaleString('en-IN')}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isOverdue
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Open'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isPaid && (
                          <>
                            <button
                              onClick={() => handleRecordPayment(inv)}
                              className="px-2 py-1 text-[11px] font-semibold bg-[#0F8B8D] text-white rounded hover:bg-[#0D7A7C] transition-colors"
                            >
                              Receive ₹
                            </button>
                            <button
                              onClick={() => handleSendDunningNotice(inv)}
                              title="Send Dunning Notice"
                              className="p-1 text-[#6B7280] hover:text-[#0F8B8D] hover:bg-[#F6F4EF] rounded transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
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
