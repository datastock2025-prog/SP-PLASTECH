import React, { useState } from 'react';
import {
  Building,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  ShoppingBag,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Edit,
  Download,
  Share2,
  Tag,
  Truck,
  RotateCw,
  Sliders,
  DollarSign,
  User,
  BadgeAlert,
  Archive,
} from 'lucide-react';
import { Customer, SalesOrder, SalesQuotation, ReturnMerchandise } from '../../types';
import { SALES_CONTRACTS_SEED, SALES_PRICE_LISTS } from '../../data/salesData';
import { SalesStatusBadge } from './SalesStatusBadge';

interface Props {
  customerId: string;
  customers: Customer[];
  sos: SalesOrder[];
  quotes: SalesQuotation[];
  rmas?: ReturnMerchandise[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateCustomer?: (c: Customer) => void;
  openDrawer?: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer?: () => void;
  showToast: (msg: string) => void;
}

export const CustomerDetailView: React.FC<Props> = ({
  customerId,
  customers,
  sos,
  quotes,
  rmas = [],
  onNavigate,
  onUpdateCustomer,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const customer =
    customers.find((c) => c.code === customerId || c.name === customerId) || customers[0];

  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Credit & Finance' | 'Quotations' | 'Sales Orders' | 'Contracts & Pricing' | 'RMAs & Quality'
  >('Overview');

  if (!customer) {
    return (
      <div className="p-12 text-center text-xs">
        <p className="text-[#6B7280]">Customer account not found.</p>
        <button onClick={() => onNavigate('customerList')} className="btn btn-sm btn-primary mt-3">
          Back to Customer List
        </button>
      </div>
    );
  }

  // Linked Data
  const customerQuotes = quotes.filter(
    (q) => q.customer === customer.code || q.customer === customer.name
  );
  const customerSOs = sos.filter(
    (s) => s.customer === customer.code || s.customer === customer.name
  );
  const customerContracts = SALES_CONTRACTS_SEED.filter(
    (c) => c.customer === customer.name || c.customer === customer.code
  );
  const customerRMAs = rmas.filter(
    (r) => r.customer === customer.name || r.customer === customer.code
  );

  // Financial Stats
  const totalBilledValue = customerSOs.reduce(
    (sum, s) => sum + s.lines.reduce((lSum, l) => lSum + l.qty * l.price, 0),
    0
  );
  const creditLimit = customer.creditLimit || 2000000;
  const creditUsed = customer.creditUsed || Math.round(creditLimit * 0.65);
  const availableCredit = Math.max(0, creditLimit - creditUsed);
  const creditUsagePct = ((creditUsed / creditLimit) * 100).toFixed(1);
  const overdueAmount = customer.overdueAmount || 0;

  // Handle Edit Customer Modal / Drawer
  const handleEditCustomerDrawer = () => {
    if (!openDrawer) return;

    let credit = creditLimit;
    let terms = customer.paymentTerms || 'Net 30 Days';
    let status = customer.status;
    let risk = customer.riskRating || 'AA';
    let manager = customer.accountManager || 'Ananya Rao';
    let phone = customer.phone;
    let email = customer.email;

    openDrawer(
      `Edit Customer Master &middot; ${customer.code}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 font-medium">
          Modify Commercial Profile &middot; {customer.name}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Credit Limit (₹)</label>
            <input
              type="number"
              defaultValue={credit}
              onChange={(e) => (credit = parseInt(e.target.value) || creditLimit)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Payment Terms</label>
            <select
              defaultValue={terms}
              onChange={(e) => (terms = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            >
              <option value="Immediate / Advance">Immediate / Advance</option>
              <option value="Net 15 Days">Net 15 Days</option>
              <option value="Net 30 Days">Net 30 Days</option>
              <option value="Net 45 Days">Net 45 Days</option>
              <option value="Net 60 Days">Net 60 Days</option>
              <option value="Letter of Credit (LC)">Letter of Credit (LC)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Risk Rating</label>
            <select
              defaultValue={risk}
              onChange={(e) => (risk = e.target.value as any)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            >
              <option value="AAA">AAA - Prime Institutional</option>
              <option value="AA">AA - Low Risk Tier 1</option>
              <option value="A">A - Standard Good Standing</option>
              <option value="BBB">BBB - Moderate Risk</option>
              <option value="High Risk">High Risk - Escrow / Blocked</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Account Manager</label>
            <input
              type="text"
              defaultValue={manager}
              onChange={(e) => (manager = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Primary Phone</label>
            <input
              type="text"
              defaultValue={phone}
              onChange={(e) => (phone = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Primary Email</label>
            <input
              type="email"
              defaultValue={email}
              onChange={(e) => (email = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            />
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
            const updatedCustomer: Customer = {
              ...customer,
              creditLimit: credit,
              paymentTerms: terms,
              riskRating: risk,
              accountManager: manager,
              phone,
              email,
            };
            if (onUpdateCustomer) onUpdateCustomer(updatedCustomer);
            if (closeDrawer) closeDrawer();
            showToast(`Updated customer profile for ${customer.name}`);
          }}
          className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0d7a7c]"
        >
          Save Changes
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('customerList')}
          className="flex items-center gap-1 text-xs font-semibold text-[#0F8B8D] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers Directory
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEditCustomerDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-white hover:bg-slate-50 text-xs font-semibold text-[#14213D] shadow-xs"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit Profile
          </button>
          <button
            onClick={() => onNavigate('quoteList')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0d7a7c] text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> + New Quotation
          </button>
        </div>
      </div>

      {/* Customer Hero Banner */}
      <div className="bg-white p-6 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#14213D] text-white flex items-center justify-center font-bold text-xl font-['Space_Grotesk'] shadow-sm flex-shrink-0">
              {customer.code.replace('CUST-', '')}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-[#0F8B8D]">{customer.code}</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                  {customer.segment}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    customer.riskRating === 'AAA' || customer.riskRating === 'AA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : customer.riskRating === 'A'
                      ? 'bg-blue-100 text-blue-800'
                      : customer.riskRating === 'BBB'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  Rating: {customer.riskRating || 'AA'}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  {customer.status}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#14213D] mt-1 font-['Space_Grotesk']">
                {customer.name}
              </h1>

              <div className="flex items-center gap-4 text-xs text-[#6B7280] mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Account Mgr:{' '}
                  <b className="text-[#14213D]">{customer.accountManager || 'Ananya Rao'}</b>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Terms:{' '}
                  <b className="text-[#14213D]">{customer.paymentTerms || 'Net 30 Days'}</b>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 font-mono">
                  GSTIN: <b className="text-[#14213D]">{customer.gstin || '27AABCM8899K1Z4'}</b>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#F6F4EF] p-3 rounded-xl border border-[#E4E0D6]">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Credit Available</div>
              <div className="text-lg font-bold font-['Space_Grotesk'] text-emerald-700">
                ₹{(availableCredit / 100000).toFixed(2)} Lakhs
              </div>
              <div className="text-[10px] text-slate-400">Limit: ₹{(creditLimit / 100000).toFixed(2)}L</div>
            </div>
            <div className="w-[1px] h-9 bg-slate-300" />
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Overdue Aging</div>
              <div
                className={`text-lg font-bold font-['Space_Grotesk'] ${
                  overdueAmount > 0 ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                ₹{(overdueAmount / 100000).toFixed(2)}L
              </div>
              <div className="text-[10px] text-slate-400">
                {overdueAmount > 0 ? 'Action Required' : 'Zero Overdue'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Total Billed Orders</span>
            <ShoppingBag className="w-4 h-4 text-[#0F8B8D]" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            ₹{(totalBilledValue / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{customerSOs.length} orders fulfilled YTD</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Credit Limit Utilization</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-purple-700 mt-1">
            {creditUsagePct}%
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                parseFloat(creditUsagePct) > 90 ? 'bg-red-500' : 'bg-purple-500'
              }`}
              style={{ width: `${Math.min(100, parseFloat(creditUsagePct))}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Active Quotations</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-blue-700 mt-1">
            {customerQuotes.length}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            {customerQuotes.filter((q) => q.stage === 'accepted' || q.stage === 'converted').length} won/converted
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>OTIF Fulfillment SLA</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">
            98.4%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">On-Time In-Full Delivery</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-[#E4E0D6] overflow-x-auto">
        {(
          [
            'Overview',
            'Credit & Finance',
            'Quotations',
            'Sales Orders',
            'Contracts & Pricing',
            'RMAs & Quality',
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'border-[#0F8B8D] text-[#0F8B8D] bg-white'
                : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & LOCATIONS */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Legal Entity & Addresses */}
            <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0F8B8D]" /> Registered Billing &amp; Dispatch Addresses
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-[#F6F4EF] border border-[#E4E0D6] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#0F8B8D]">Primary Billing Address</span>
                  <div className="font-semibold text-[#14213D]">{customer.name}</div>
                  <div className="text-slate-600 leading-relaxed">
                    {customer.billingAddress || 'Plot 45, Bhiwandi Logistics Park, Thane, Maharashtra 421302'}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 pt-1">
                    GSTIN: <b>{customer.gstin || '27AABCM8899K1Z4'}</b> &middot; PAN: <b>{customer.pan || 'AABCM8899K'}</b>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#F6F4EF] border border-[#E4E0D6] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-blue-700">Shipping Plants / Receiving Hubs</span>
                  {(customer.shippingAddresses || [
                    'Central WH, Bhiwandi Logistics Hub, Thane 421302',
                    'North Hub, Sonipat Industrial Area, Haryana 131028',
                  ]).map((addr, idx) => (
                    <div key={idx} className="text-slate-700 py-0.5 border-b border-slate-200 last:border-0">
                      &bull; {addr}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Buyer Contact Directory */}
            <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-2">
                <User className="w-4 h-4 text-[#0F8B8D]" /> Authorized Customer Contacts &amp; Procurement Team
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {(
                  customer.contacts || [
                    {
                      name: customer.contact,
                      role: 'Head of Sourcing & Procurement',
                      email: customer.email,
                      phone: customer.phone,
                      isPrimary: true,
                    },
                    {
                      name: 'Accounts Payable Team',
                      role: 'Finance / Invoice Approvals',
                      email: `accounts@${customer.email.split('@')[1] || 'example.com'}`,
                      phone: '+91 98200 11999',
                      isPrimary: false,
                    },
                  ]
                ).map((ct, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-[#E4E0D6] bg-slate-50/50 space-y-1 relative"
                  >
                    {ct.isPrimary && (
                      <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase">
                        Primary
                      </span>
                    )}
                    <div className="font-bold text-[#14213D]">{ct.name}</div>
                    <div className="text-[11px] text-slate-500">{ct.role}</div>
                    <div className="flex items-center gap-2 text-slate-600 pt-1">
                      <Phone className="w-3 h-3 text-[#0F8B8D]" />
                      <span>{ct.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{ct.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Account Intelligence Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                Customer Account Notes
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-[#F6F4EF] p-3 rounded-lg border border-[#E4E0D6]">
                {customer.notes ||
                  'Key industrial accounts with long-standing plastic molding business. Quality inspections require COA and pallet barcode labeling.'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                Account Relationship Health
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Customer Life Stage:</span>
                  <span className="font-bold text-emerald-700">Strategic Tier 1</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">First Order Date:</span>
                  <span className="font-mono text-slate-700">14 Jan 2024</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Avg Payment Delay:</span>
                  <span className="font-bold text-slate-700">2.4 Days (Prompt)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Annual Return Rate:</span>
                  <span className="font-bold text-emerald-700">0.42% (Passes SLA)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREDIT & FINANCE */}
      {activeTab === 'Credit & Finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">Sanctioned Credit Limit</div>
              <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
                ₹{(creditLimit / 100000).toFixed(2)} Lakhs
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Reviewed by Finance: 01 Jul 2026</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">Current Ledger Balance</div>
              <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#0F8B8D] mt-1">
                ₹{(creditUsed / 100000).toFixed(2)} Lakhs
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                ₹{(availableCredit / 100000).toFixed(2)}L Headroom Remaining
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">Overdue Aging Amount</div>
              <div
                className={`text-2xl font-bold font-['Space_Grotesk'] mt-1 ${
                  overdueAmount > 0 ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                ₹{(overdueAmount / 100000).toFixed(2)} Lakhs
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {overdueAmount > 0 ? '1 overdue invoice pending' : 'Zero overdue payments'}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] mb-3">
              Aging Analysis &middot; Days Sales Outstanding (DSO)
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-[10px] text-emerald-800 font-bold uppercase">0 - 30 Days (Current)</div>
                <div className="text-lg font-bold font-mono text-emerald-900 mt-1">
                  ₹{((creditUsed - overdueAmount) / 100000).toFixed(2)}L
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-600 font-bold uppercase">31 - 60 Days</div>
                <div className="text-lg font-bold font-mono text-slate-800 mt-1">₹0.00L</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-[10px] text-amber-800 font-bold uppercase">61 - 90 Days</div>
                <div className="text-lg font-bold font-mono text-amber-900 mt-1">
                  ₹{(overdueAmount / 100000).toFixed(2)}L
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-[10px] text-red-800 font-bold uppercase">&gt; 90 Days (Bad Debt)</div>
                <div className="text-lg font-bold font-mono text-red-900 mt-1">₹0.00L</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUOTATIONS */}
      {activeTab === 'Quotations' && (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E4E0D6] flex justify-between items-center">
            <h3 className="font-bold text-xs text-[#14213D] font-['Space_Grotesk']">
              Commercial Quotations ({customerQuotes.length})
            </h3>
            <button
              onClick={() => onNavigate('quoteList')}
              className="text-xs font-semibold text-[#0F8B8D] hover:underline"
            >
              View Full Quotations Module &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
                  <th className="p-3">Quote #</th>
                  <th className="p-3">RFQ Ref</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Valid Until</th>
                  <th className="p-3 text-right">Gross Amount</th>
                  <th className="p-3 text-right">Margin %</th>
                  <th className="p-3 text-center">Stage</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {customerQuotes.map((q) => {
                  const gross = q.lines.reduce((s, l) => s + l.qty * l.price, 0);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-[#0F8B8D]">{q.id}</td>
                      <td className="p-3 text-slate-600 font-mono">{q.customerRfq || 'N/A'}</td>
                      <td className="p-3 font-mono text-slate-600">{q.date}</td>
                      <td className="p-3 font-mono text-slate-600">{q.validUntil}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                        ₹{(gross / 100000).toFixed(2)}L
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                        {q.margin}%
                      </td>
                      <td className="p-3 text-center">
                        <SalesStatusBadge status={q.stage} size="xs" />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onNavigate('quoteDetail', { id: q.id })}
                          className="px-2.5 py-1 rounded bg-[#F6F4EF] hover:bg-[#E4E0D6] text-[11px] font-semibold text-[#14213D]"
                        >
                          View Quote
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SALES ORDERS */}
      {activeTab === 'Sales Orders' && (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E4E0D6] flex justify-between items-center">
            <h3 className="font-bold text-xs text-[#14213D] font-['Space_Grotesk']">
              Sales Orders History ({customerSOs.length})
            </h3>
            <button
              onClick={() => onNavigate('soList')}
              className="text-xs font-semibold text-[#0F8B8D] hover:underline"
            >
              View Sales Orders Manager &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
                  <th className="p-3">SO # &amp; Cust PO</th>
                  <th className="p-3">Order Date</th>
                  <th className="p-3">Target Delivery</th>
                  <th className="p-3">Fulfillment Progress</th>
                  <th className="p-3 text-right">Order Value</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {customerSOs.map((so) => {
                  const val = so.lines.reduce((s, l) => s + l.qty * l.price, 0);
                  const totalQty = so.lines.reduce((s, l) => s + l.qty, 0);
                  const dispatched = so.lines.reduce((s, l) => s + l.dispatched, 0);
                  const pct = totalQty > 0 ? ((dispatched / totalQty) * 100).toFixed(0) : '0';

                  return (
                    <tr key={so.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-mono font-bold text-[#0F8B8D]">{so.id}</div>
                        <div className="text-[10px] text-slate-500 font-mono">PO: {so.customerPO || 'Direct'}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{so.orderDate}</td>
                      <td className="p-3 font-mono text-slate-600">{so.deliveryDate}</td>
                      <td className="p-3 min-w-[140px]">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span>{dispatched}/{totalQty} PCS</span>
                          <span className="font-bold">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#0F8B8D]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                        ₹{(val / 100000).toFixed(2)}L
                      </td>
                      <td className="p-3 text-center">
                        <SalesStatusBadge status={so.approval} size="xs" />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onNavigate('soDetail', { id: so.id })}
                          className="px-2.5 py-1 rounded bg-[#F6F4EF] hover:bg-[#E4E0D6] text-[11px] font-semibold text-[#14213D]"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CONTRACTS & PRICING */}
      {activeTab === 'Contracts & Pricing' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#0F8B8D]" /> Rate Agreements &amp; Blanket Contracts
            </h3>

            {customerContracts.length > 0 ? (
              <div className="space-y-3">
                {customerContracts.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-lg border border-[#E4E0D6] bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0F8B8D]">{c.id}</span>
                        <span className="font-bold text-[#14213D]">{c.type}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                          {c.status}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-1">
                        Validity: {c.startDate} to {c.endDate} &middot; Items: {c.items.map((i) => `${i.item} @ ₹${i.price}`).join(', ')}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-[#14213D]">
                        ₹{(c.releasedValue / 100000).toFixed(2)}L / ₹{(c.totalValue / 100000).toFixed(2)}L
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {((c.releasedQty / c.totalQty) * 100).toFixed(0)}% Drawn Down
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-[#F6F4EF] rounded-lg">
                No active blanket contracts registered for this account.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: RMAs & QUALITY */}
      {activeTab === 'RMAs & Quality' && (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xs text-[#14213D] font-['Space_Grotesk']">
              Customer Quality RMAs &amp; Returns ({customerRMAs.length})
            </h3>
            <button
              onClick={() => onNavigate('rmaList')}
              className="text-xs font-semibold text-[#0F8B8D] hover:underline"
            >
              Open RMA Hub &rarr;
            </button>
          </div>

          {customerRMAs.length > 0 ? (
            <div className="space-y-3">
              {customerRMAs.map((rma) => (
                <div key={rma.id} className="p-3.5 rounded-lg border border-[#E4E0D6] bg-[#F6F4EF] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0F8B8D]">{rma.id}</span>
                      <span className="font-bold text-[#14213D]">{rma.item} ({rma.qty} {rma.uom})</span>
                      <SalesStatusBadge status={rma.status} size="xs" />
                    </div>
                    <div className="text-slate-600 text-[11px] mt-1">
                      Reason: <b>{rma.reason}</b> &middot; Disposition: <b>{rma.disposition}</b>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-[#14213D]">₹{rma.creditAmount.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">{rma.date}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-[#F6F4EF] rounded-lg">
              No quality RMA claims registered for this customer.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
