import React, { useState, useMemo } from 'react';
import { CustomerInvoice, Customer, CustomerPayment, JournalEntry } from '../../types';
import {
  EnterpriseCustomerInvoice,
  CustomerCollectionProfile,
  CustomerAdvanceRecord,
  AdvanceCheckData,
  AdvanceCheckBadge,
  CustomerInvoiceStatus,
  AdvanceStatus,
} from '../../types/financeEnterprise';
import {
  mockEnterpriseCustomerInvoices,
  mockCustomerCollectionProfiles,
  mockCustomerAdvances,
  mockAdvanceCheckDataByCustomer,
} from '../../data/financeEnterpriseData';
import { FinanceAuditDrawer } from './FinanceAuditDrawer';
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
  ArrowRight,
  Check,
  X,
  Phone,
  Mail,
  User,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  Percent,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Receipt,
  CreditCard,
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
  // Navigation Tabs for AR & Collections Subsystem (STEP-15 to STEP-21)
  const [arActiveTab, setArActiveTab] = useState<
    'dashboard' | 'invoicesList' | 'collectionWorkbench' | 'advanceCheck' | 'advanceHistory' | 'recordAdvance'
  >('invoicesList');

  // Enterprise State
  const [customerInvoices, setCustomerInvoices] = useState<EnterpriseCustomerInvoice[]>(
    mockEnterpriseCustomerInvoices
  );
  const [collectionProfiles, setCollectionProfiles] = useState<CustomerCollectionProfile[]>(
    mockCustomerCollectionProfiles
  );
  const [customerAdvances, setCustomerAdvances] = useState<CustomerAdvanceRecord[]>(
    mockCustomerAdvances
  );

  // Selected customer for Collection Workbench & Advance Check
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('CUST-001');

  // Filter States for Invoices List
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('All');
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState<string>('');
  const [agingBucketFilter, setAgingBucketFilter] = useState<string>('All');

  // State for Apply Advance Modal (STEP-20)
  const [showApplyAdvanceModal, setShowApplyAdvanceModal] = useState<boolean>(false);
  const [targetInvoiceForAdvance, setTargetInvoiceForAdvance] =
    useState<EnterpriseCustomerInvoice | null>(null);
  const [selectedAdvanceToApply, setSelectedAdvanceToApply] = useState<CustomerAdvanceRecord | null>(
    mockCustomerAdvances[0]
  );
  const [advanceAmountInput, setAdvanceAmountInput] = useState<number>(100000);

  // New Advance Receipt Form State (STEP-18 & 21)
  const [newAdvanceCustomer, setNewAdvanceCustomer] = useState<string>('CUST-001');
  const [newAdvanceAmount, setNewAdvanceAmount] = useState<number>(250000);
  const [newAdvanceType, setNewAdvanceType] = useState<
    'General Advance' | 'Order-Specific Advance' | 'Project Advance' | 'Proforma Advance'
  >('Order-Specific Advance');
  const [newAdvanceMethod, setNewAdvanceMethod] = useState<
    'Bank Wire' | 'NEFT/RTGS' | 'Cheque' | 'Credit Card' | 'Letter of Credit'
  >('NEFT/RTGS');
  const [newAdvanceRefSo, setNewAdvanceRefSo] = useState<string>('SO-509');
  const [newAdvanceRemarks, setNewAdvanceRemarks] = useState<string>('Advance for Tooling & Production Run');

  // KPI Calculations (STEP-15)
  const totalAr = customerInvoices.reduce((s, i) => s + i.balanceDue, 0);
  const overdueAr = customerInvoices
    .filter((i) => i.status === 'Overdue')
    .reduce((s, i) => s + i.balanceDue, 0);
  const totalAvailableAdvances = customerAdvances.reduce((s, a) => s + a.availableBalance, 0);

  // Selected Customer Profile for Workbench
  const currentCustomerProfile =
    collectionProfiles.find((c) => c.customerCode === selectedCustomerId) ||
    collectionProfiles[0];

  // Advance Check Data for Selected Customer (STEP-19)
  const currentAdvanceCheckData: AdvanceCheckData =
    mockAdvanceCheckDataByCustomer[selectedCustomerId] ||
    mockAdvanceCheckDataByCustomer['CUST-001'];

  // Filtered customer invoices
  const filteredCustomerInvoices = useMemo(() => {
    return customerInvoices.filter((inv) => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
        (inv.salesOrderRef && inv.salesOrderRef.toLowerCase().includes(invoiceSearchTerm.toLowerCase()));
      const matchStatus = invoiceStatusFilter === 'All' || inv.status === invoiceStatusFilter;
      const matchAging = agingBucketFilter === 'All' || inv.agingBucket === agingBucketFilter;
      return matchSearch && matchStatus && matchAging;
    });
  }, [customerInvoices, invoiceSearchTerm, invoiceStatusFilter, agingBucketFilter]);

  // Open Audit Drawer (STEP-24)
  const handleOpenAudit = (inv: EnterpriseCustomerInvoice) => {
    openDrawer(
      `AR Audit Trail: ${inv.invoiceNumber}`,
      <FinanceAuditDrawer
        title="Customer Invoice Audit"
        documentNumber={inv.invoiceNumber}
        auditTrail={inv.auditTrail}
        onClose={closeDrawer}
      />
    );
  };

  // Open Apply Advance Modal for an invoice (STEP-20)
  const handleTriggerApplyAdvanceModal = (inv: EnterpriseCustomerInvoice) => {
    setTargetInvoiceForAdvance(inv);
    const customerAdv = customerAdvances.find(
      (a) => a.customerCode === inv.customer && a.availableBalance > 0
    );
    if (!customerAdv) {
      showToast(`No unallocated advance available for ${inv.customerName}.`);
      return;
    }
    setSelectedAdvanceToApply(customerAdv);
    setAdvanceAmountInput(Math.min(customerAdv.availableBalance, inv.balanceDue));
    setShowApplyAdvanceModal(true);
  };

  // Submit Apply Advance Execution (STEP-20)
  const handleExecuteApplyAdvance = () => {
    if (!targetInvoiceForAdvance || !selectedAdvanceToApply) return;
    if (advanceAmountInput <= 0 || advanceAmountInput > selectedAdvanceToApply.availableBalance) {
      showToast('Invalid advance application amount.');
      return;
    }

    // 1. Update Customer Invoice
    const updatedInvoices = customerInvoices.map((inv) => {
      if (inv.invoiceNumber === targetInvoiceForAdvance.invoiceNumber) {
        const newAdvanceApplied = inv.advanceApplied + advanceAmountInput;
        const newBalanceDue = Math.max(0, inv.invoiceAmount - newAdvanceApplied - inv.paidAmount);
        const newStatus: CustomerInvoiceStatus =
          newBalanceDue === 0 ? 'Paid' : ('Advance Adjusted' as any);
        return {
          ...inv,
          advanceApplied: newAdvanceApplied,
          balanceDue: newBalanceDue,
          status: newStatus,
          auditTrail: [
            ...inv.auditTrail,
            {
              id: `AUD-ADV-${Date.now()}`,
              timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
              action: 'Customer Advance Applied',
              actor: 'AR Accountant',
              role: 'AR Accountant' as const,
              notes: `Applied ₹${advanceAmountInput.toLocaleString()} from ${selectedAdvanceToApply.receiptNumber}`,
            },
          ],
        };
      }
      return inv;
    });

    // 2. Update Customer Advance Record
    const updatedAdvances = customerAdvances.map((adv) => {
      if (adv.receiptNumber === selectedAdvanceToApply.receiptNumber) {
        const newAllocated = adv.allocatedAmount + advanceAmountInput;
        const newAvailable = Math.max(0, adv.amountReceived - newAllocated);
        const newStatus: AdvanceStatus = newAvailable === 0 ? 'Fully Allocated' : 'Partially Allocated';
        return {
          ...adv,
          allocatedAmount: newAllocated,
          availableBalance: newAvailable,
          status: newStatus,
          allocations: [
            ...adv.allocations,
            {
              invoiceOrSoNumber: targetInvoiceForAdvance.invoiceNumber,
              allocationAmount: advanceAmountInput,
              allocationDate: new Date().toISOString().slice(0, 10),
              allocatedBy: 'AR Accountant',
            },
          ],
        };
      }
      return adv;
    });

    setCustomerInvoices(updatedInvoices);
    setCustomerAdvances(updatedAdvances);
    setShowApplyAdvanceModal(false);
    showToast(
      `Successfully applied ₹${advanceAmountInput.toLocaleString()} advance to ${targetInvoiceForAdvance.invoiceNumber}.`
    );
  };

  // Submit New Advance Receipt (STEP-18 & STEP-21)
  const handleCreateAdvanceReceipt = () => {
    const newReceipt: CustomerAdvanceRecord = {
      receiptNumber: `ADV-RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
      receiptDate: new Date().toISOString().slice(0, 10),
      customerCode: newAdvanceCustomer,
      customerName:
        collectionProfiles.find((c) => c.customerCode === newAdvanceCustomer)?.customerName ||
        'Customer Enterprise',
      paymentMethod: newAdvanceMethod,
      bankAccount: 'HDFC Corporate Current - 008920001928',
      currency: 'INR (₹)',
      exchangeRate: 1.0,
      amountReceived: newAdvanceAmount,
      advanceType: newAdvanceType,
      referenceSalesOrder: newAdvanceRefSo || undefined,
      remarks: newAdvanceRemarks,
      availableBalance: newAdvanceAmount,
      allocatedAmount: 0,
      refundedAmount: 0,
      status: 'Unallocated',
      allocations: [],
      auditTrail: [
        {
          id: `AUD-RCP-${Date.now()}`,
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
          action: 'Advance Receipt Created & Realized',
          actor: 'Vikram Seth',
          role: 'AR Accountant',
          notes: `Recorded advance via ${newAdvanceMethod}`,
        },
      ],
    };

    setCustomerAdvances([newReceipt, ...customerAdvances]);
    showToast(`Advance Receipt ${newReceipt.receiptNumber} recorded. Available balance updated.`);
    setArActiveTab('advanceHistory');
  };

  // Helper for Advance Status Badge (STEP-19)
  const getAdvanceBadge = (badge: AdvanceCheckBadge) => {
    switch (badge) {
      case 'Advance Available':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Advance Available
          </span>
        );
      case 'Partially Used':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" /> Partially Used
          </span>
        );
      case 'Fully Used':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Fully Used
          </span>
        );
      case 'Advance Exceeded':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Advance Exceeded
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            No Advance
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner (STEP-15) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase rounded-md tracking-wider">
              Order-to-Cash Subsystem
            </span>
            <span className="text-xs text-slate-300">
              Customer Receivables &bull; Advance Check &bull; Priority Collection Workbench
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            Accounts Receivable & Collections
          </h1>
          <p className="text-xs text-slate-400">
            Integrated customer advance verification, credit limit surveillance, broken promise tracking, and aging controls.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setArActiveTab('advanceCheck')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition"
          >
            <ShieldCheck className="w-4 h-4" />
            Advance Check Option
          </button>
          <button
            type="button"
            onClick={() => setArActiveTab('recordAdvance')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-xl transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            + Record Advance Receipt
          </button>
          <button
            type="button"
            onClick={() => setArActiveTab('collectionWorkbench')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-800/60 text-xs font-medium rounded-xl transition"
          >
            <Phone className="w-4 h-4 text-indigo-400" />
            Collection Workbench
          </button>
        </div>
      </div>

      {/* Primary Subsystem Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setArActiveTab('dashboard')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            arActiveTab === 'dashboard'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          AR Dashboard & KPIs
        </button>
        <button
          type="button"
          onClick={() => setArActiveTab('invoicesList')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            arActiveTab === 'invoicesList'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Customer Invoices ({customerInvoices.length})
        </button>
        <button
          type="button"
          onClick={() => setArActiveTab('collectionWorkbench')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            arActiveTab === 'collectionWorkbench'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          Collection Workbench
        </button>
        <button
          type="button"
          onClick={() => setArActiveTab('advanceCheck')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            arActiveTab === 'advanceCheck'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Advance Check Option & Panel
        </button>
        <button
          type="button"
          onClick={() => setArActiveTab('advanceHistory')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            arActiveTab === 'advanceHistory'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Customer Advance History ({customerAdvances.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AR DASHBOARD (STEP-15) */}
      {/* ========================================================================= */}
      {arActiveTab === 'dashboard' && (
        <div className="space-y-6">
          {/* STEP-15: 12 KPI Cards (Shown in 5-col grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Outstanding AR</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">₹{totalAr.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500 font-medium">3 active enterprise accounts</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-rose-200 bg-rose-50/30 shadow-xs">
              <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">Overdue AR</span>
              <div className="text-xl font-bold font-mono text-rose-900 mt-1">₹{overdueAr.toLocaleString()}</div>
              <span className="text-[10px] text-rose-700 font-medium">1 broken promise</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Available Advance Balance</span>
              <div className="text-xl font-bold font-mono text-emerald-950 mt-1">₹{totalAvailableAdvances.toLocaleString()}</div>
              <span className="text-[10px] text-emerald-700 font-bold">Unapplied customer advances</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">DSO (Days Sales Out)</span>
              <div className="text-xl font-bold text-slate-900 mt-1">34.2 Days</div>
              <span className="text-[10px] text-emerald-600 font-medium">Within 45 day target</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Disputed Balance</span>
              <div className="text-xl font-bold font-mono text-amber-900 mt-1">₹2,80,000</div>
              <span className="text-[10px] text-amber-700 font-medium">1 quality dispute</span>
            </div>
          </div>

          {/* Conditional Alerts (STEP-15) */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">Unapplied Customer Advance Optimization</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  &bull; <strong>Tata AutoComp Systems Ltd</strong> has <strong>₹2,50,000.00</strong> available in unallocated advance. Recommended to adjust against open invoice INV-2026-2201.<br />
                  &bull; <strong>Bajaj Auto Component Div:</strong> Partial advance of ₹80,000 ready for allocation against current billing.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setArActiveTab('advanceCheck')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shrink-0 shadow-xs transition"
            >
              Run Advance Check
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOMER INVOICES LIST (STEP-16) */}
      {/* ========================================================================= */}
      {arActiveTab === 'invoicesList' && (
        <div className="space-y-4">
          {/* Sub-status tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['All', 'Partially Paid', 'Overdue', 'Disputed', 'Paid'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setInvoiceStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  invoiceStatusFilter === st
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Filters Bar */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Invoice #, Customer, SO Ref..."
                  value={invoiceSearchTerm}
                  onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={agingBucketFilter}
                onChange={(e) => setAgingBucketFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="All">All Aging Buckets</option>
                <option value="Current">Current</option>
                <option value="1-30">1 - 30 Days</option>
                <option value="31-60">31 - 60 Days</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                const csv =
                  'Invoice #,Customer,Date,Due Date,Gross,Advance Applied,Paid,Balance Due,Status\n' +
                  filteredCustomerInvoices
                    .map(
                      (i) =>
                        `"${i.invoiceNumber}","${i.customerName}","${i.invoiceDate}","${i.dueDate}",${i.invoiceAmount},${i.advanceApplied},${i.paidAmount},${i.balanceDue},"${i.status}"`
                    )
                    .join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'AR_Customer_Invoices.csv';
                a.click();
                showToast('Exported AR Customer Invoices CSV.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          {/* Customer Invoices Table (STEP-16) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">SO Ref</th>
                    <th className="p-3">Invoice Date</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Gross Amount (₹)</th>
                    <th className="p-3 text-right">Advance Applied (₹)</th>
                    <th className="p-3 text-right">Balance Due (₹)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Advance Action</th>
                    <th className="p-3 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomerInvoices.map((inv) => (
                    <tr key={inv.invoiceNumber} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-mono font-bold text-indigo-700">{inv.invoiceNumber}</td>
                      <td className="p-3 font-semibold text-slate-900">{inv.customerName}</td>
                      <td className="p-3 font-mono text-slate-600">{inv.salesOrderRef || '—'}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{inv.invoiceDate}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{inv.dueDate}</td>
                      <td className="p-3 text-right font-mono text-slate-800">₹{inv.invoiceAmount.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {inv.advanceApplied > 0 ? `₹${inv.advanceApplied.toLocaleString()}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{inv.balanceDue.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : inv.status === 'Disputed'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {inv.balanceDue > 0 && (
                          <button
                            type="button"
                            onClick={() => handleTriggerApplyAdvanceModal(inv)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold transition"
                          >
                            Apply Advance
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenAudit(inv)}
                          className="p-1 hover:bg-slate-100 text-slate-500 rounded transition"
                          title="Audit Trail"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AR COLLECTION WORKBENCH (STEP-17) */}
      {/* ========================================================================= */}
      {arActiveTab === 'collectionWorkbench' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Panel: Customer Priority List (STEP-17) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Customer Priority Accounts ({collectionProfiles.length})
            </h3>
            <div className="space-y-2.5">
              {collectionProfiles.map((cp) => (
                <div
                  key={cp.customerCode}
                  onClick={() => setSelectedCustomerId(cp.customerCode)}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                    selectedCustomerId === cp.customerCode
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{cp.customerName}</span>
                      <span className="font-mono text-[10px] text-slate-500">{cp.customerCode}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cp.riskRating === 'High' || cp.riskRating === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : cp.riskRating === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {cp.riskRating} Risk
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] pt-1">
                    <span className="text-slate-600">Outstanding:</span>
                    <span className="font-mono font-bold text-slate-900">₹{cp.totalOutstanding.toLocaleString()}</span>
                  </div>

                  {cp.advanceAvailable > 0 && (
                    <div className="flex justify-between text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-emerald-800 font-bold">
                      <span>Advance Available:</span>
                      <span className="font-mono">₹{cp.advanceAvailable.toLocaleString()}</span>
                    </div>
                  )}

                  {cp.hasBrokenPromise && (
                    <div className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Broken Promise to Pay!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Customer Collection Detail Deep Dive (STEP-17) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Section 1: Customer Summary Bar */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentCustomerProfile.customerName}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Contact: {currentCustomerProfile.contactPerson} &bull; {currentCustomerProfile.contactPhone}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      showToast(`Logging reminder call for ${currentCustomerProfile.customerName}...`);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Log Call
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      showToast(`Statement of Account emailed to ${currentCustomerProfile.contactEmail}.`);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Send Statement
                  </button>
                </div>
              </div>

              {/* Credit Limit & Advance Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Credit Limit</span>
                  <span className="font-mono font-bold text-slate-900">₹{currentCustomerProfile.creditLimit.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Used: {currentCustomerProfile.creditLimitPct}%
                  </span>
                </div>
                <div className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-800 block">Overdue Balance</span>
                  <span className="font-mono font-bold text-rose-900">₹{currentCustomerProfile.overdueAmount.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Available Advance</span>
                  <span className="font-mono font-bold text-emerald-950">₹{currentCustomerProfile.advanceAvailable.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">Ready for deduction</span>
                </div>
                <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Promise to Pay</span>
                  <span className="font-mono font-bold text-amber-900">
                    {currentCustomerProfile.promiseDate || 'None logged'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 6: Communication History & Notes */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Communication History & Collection Notes
              </h4>
              <div className="space-y-2 text-xs">
                {currentCustomerProfile.communicationHistory.map((ch, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-indigo-600" />
                        {ch.type} by {ch.agent}
                      </span>
                      <span className="font-mono text-slate-500">{ch.date}</span>
                    </div>
                    <p className="text-slate-600">{ch.summary}</p>
                    <div className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded inline-block">
                      Outcome: {ch.outcome}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ADVANCE CHECK OPTION & PANEL (STEP-18 & STEP-19) */}
      {/* ========================================================================= */}
      {arActiveTab === 'advanceCheck' && (
        <div className="space-y-5">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Real-Time Customer Advance Check Option
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-invoice and pre-delivery advance availability audit. Checks order-specific vs general advances, credit limits, and overdue status.
                </p>
              </div>

              {/* Customer Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Select Customer:</span>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
                >
                  <option value="CUST-001">Tata AutoComp Systems Ltd</option>
                  <option value="CUST-003">Bajaj Auto Component Div</option>
                  <option value="CUST-004">Hero MotoCorp Tier-1 Division</option>
                </select>
              </div>
            </div>

            {/* STEP-19: 11 PANEL FIELDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Advance Received</span>
                <div className="font-mono text-sm font-bold text-slate-900">
                  ₹{currentAdvanceCheckData.totalAdvanceReceived.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Already Allocated</span>
                <div className="font-mono text-sm font-bold text-slate-600">
                  ₹{currentAdvanceCheckData.advanceAlreadyAllocated.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Available Advance Balance</span>
                <div className="font-mono text-sm font-bold text-emerald-950">
                  ₹{currentAdvanceCheckData.availableAdvanceBalance.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Advance Status</span>
                <div className="mt-0.5">{getAdvanceBadge(currentAdvanceCheckData.advanceStatusBadge)}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Order-Specific Advance</span>
                <div className="font-mono text-sm font-bold text-indigo-700">
                  ₹{currentAdvanceCheckData.orderSpecificAdvance.toLocaleString()}
                </div>
                <span className="text-[9px] text-slate-500 block">Restricted to linked SO</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">General Advance</span>
                <div className="font-mono text-sm font-bold text-teal-700">
                  ₹{currentAdvanceCheckData.generalAdvance.toLocaleString()}
                </div>
                <span className="text-[9px] text-slate-500 block">Applicable to any invoice</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Document Amount</span>
                <div className="font-mono text-sm font-bold text-slate-900">
                  ₹{currentAdvanceCheckData.currentDocumentAmount.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-teal-800 block">Recommended to Apply</span>
                <div className="font-mono text-sm font-bold text-teal-950">
                  ₹{currentAdvanceCheckData.recommendedAdvanceToApply.toLocaleString()}
                </div>
                <span className="text-[9px] text-teal-700 block">Min(Advance, Document)</span>
              </div>
            </div>

            {/* Overdue Alert if customer has overdue debts */}
            {currentAdvanceCheckData.hasOverdueInvoices && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>Overdue Invoices Warning:</strong> Customer has overdue invoices. ERP policy recommends applying advance to oldest overdue invoice first.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setArActiveTab('invoicesList')}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px]"
                >
                  View Overdue List
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CUSTOMER ADVANCE HISTORY (STEP-21) */}
      {/* ========================================================================= */}
      {arActiveTab === 'advanceHistory' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Advance Receipts & Allocation Ledger</h3>
              <p className="text-xs text-slate-500">
                Track unallocated advances, order-specific pre-payments, proforma settlements, and refund history.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setArActiveTab('recordAdvance')}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              + New Advance Receipt
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="p-3">Receipt #</th>
                  <th className="p-3">Receipt Date</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">SO Reference</th>
                  <th className="p-3 text-right">Received (₹)</th>
                  <th className="p-3 text-right">Allocated (₹)</th>
                  <th className="p-3 text-right">Available Balance (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerAdvances.map((adv) => (
                  <tr key={adv.receiptNumber} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono font-bold text-teal-700">{adv.receiptNumber}</td>
                    <td className="p-3 font-mono text-slate-600 text-[11px]">{adv.receiptDate}</td>
                    <td className="p-3 font-semibold text-slate-900">{adv.customerName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-800">
                        {adv.advanceType}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{adv.referenceSalesOrder || 'General Account'}</td>
                    <td className="p-3 text-right font-mono text-slate-800">₹{adv.amountReceived.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">₹{adv.allocatedAmount.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ₹{adv.availableBalance.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          adv.status === 'Unallocated'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : adv.status === 'Partially Allocated'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {adv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: RECORD ADVANCE RECEIPT FORM (STEP-18 & STEP-21) */}
      {/* ========================================================================= */}
      {arActiveTab === 'recordAdvance' && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Record Customer Advance Receipt</h3>
              <p className="text-xs text-slate-500">
                Log customer advance against Bank Current Account with Sales Order or General Account allocation.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setArActiveTab('advanceHistory')}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAdvanceReceipt}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-xs"
              >
                Post Advance Receipt
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Customer Account *</label>
              <select
                value={newAdvanceCustomer}
                onChange={(e) => setNewAdvanceCustomer(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="CUST-001">Tata AutoComp Systems Ltd (CUST-001)</option>
                <option value="CUST-003">Bajaj Auto Component Div (CUST-003)</option>
                <option value="CUST-004">Hero MotoCorp Tier-1 (CUST-004)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Advance Amount (₹) *</label>
              <input
                type="number"
                value={newAdvanceAmount}
                onChange={(e) => setNewAdvanceAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Advance Classification *</label>
              <select
                value={newAdvanceType}
                onChange={(e) => setNewAdvanceType(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white font-semibold text-indigo-800"
              >
                <option value="Order-Specific Advance">Order-Specific Advance</option>
                <option value="General Advance">General Advance</option>
                <option value="Proforma Advance">Proforma Advance</option>
                <option value="Project Advance">Project Advance</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Payment Method</label>
              <select
                value={newAdvanceMethod}
                onChange={(e) => setNewAdvanceMethod(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="NEFT/RTGS">NEFT / RTGS Wire</option>
                <option value="Bank Wire">Bank Wire Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Letter of Credit">Letter of Credit (LC)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Reference Sales Order (SO #)</label>
              <input
                type="text"
                value={newAdvanceRefSo}
                onChange={(e) => setNewAdvanceRefSo(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                placeholder="e.g. SO-509"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Remarks / Note</label>
              <input
                type="text"
                value={newAdvanceRemarks}
                onChange={(e) => setNewAdvanceRemarks(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPLY ADVANCE MODAL (STEP-20) */}
      {/* ========================================================================= */}
      {showApplyAdvanceModal && targetInvoiceForAdvance && selectedAdvanceToApply && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Apply Customer Advance to Invoice: {targetInvoiceForAdvance.invoiceNumber}
                </h3>
                <span className="text-slate-500">Customer: {targetInvoiceForAdvance.customerName}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyAdvanceModal(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Invoice Gross</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{targetInvoiceForAdvance.invoiceAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Remaining Balance Due</span>
                  <span className="font-mono font-bold text-indigo-700">
                    ₹{targetInvoiceForAdvance.balanceDue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Selected Advance Receipt: {selectedAdvanceToApply.receiptNumber}
                </label>
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center text-[11px] text-emerald-900">
                  <span>
                    Available in {selectedAdvanceToApply.advanceType}:
                  </span>
                  <span className="font-mono font-bold">
                    ₹{selectedAdvanceToApply.availableBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Advance Deduction Amount (₹) *
                </label>
                <input
                  type="number"
                  value={advanceAmountInput}
                  max={selectedAdvanceToApply.availableBalance}
                  onChange={(e) => setAdvanceAmountInput(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Net balance payable after deduction: ₹
                  {Math.max(0, targetInvoiceForAdvance.balanceDue - advanceAmountInput).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApplyAdvanceModal(false)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteApplyAdvance}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs transition"
              >
                Confirm Advance Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
