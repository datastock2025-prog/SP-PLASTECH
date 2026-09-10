import React, { useState } from 'react';
import {
  Building,
  Search,
  Plus,
  Filter,
  Download,
  Share2,
  SlidersHorizontal,
  CreditCard,
  User,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Edit,
  DollarSign,
} from 'lucide-react';
import { Customer, SalesOrder, SalesQuotation } from '../../types';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  customers: Customer[];
  sos?: SalesOrder[];
  quotes?: SalesQuotation[];
  onNavigate: (view: string, param?: any) => void;
  onCreateCustomer?: (c: Customer) => void;
  onUpdateCustomer?: (c: Customer) => void;
  openDrawer?: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer?: () => void;
  showToast: (msg: string) => void;
}

export const CustomerMasterListView: React.FC<Props> = ({
  customers,
  sos = [],
  quotes = [],
  onNavigate,
  onCreateCustomer,
  onUpdateCustomer,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [search, setSearch] = useState<string>('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Metrics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === 'active').length;
  const totalCreditSanctioned = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const totalOverdue = customers.reduce((sum, c) => sum + (c.overdueAmount || 0), 0);

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.toLowerCase().includes(search.toLowerCase()) ||
      (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase()));

    const matchSegment = segmentFilter === 'all' || c.segment === segmentFilter;
    const matchRisk = riskFilter === 'all' || (c.riskRating && c.riskRating === riskFilter);

    return matchSearch && matchSegment && matchRisk;
  });

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const pagedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle Register Customer Drawer
  const handleOpenRegisterCustomerDrawer = () => {
    if (!openDrawer) return;

    let code = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    let name = '';
    let segment = 'Automotive OEM Tier 1';
    let contact = '';
    let email = '';
    let phone = '';
    let creditLimit = 1500000;
    let paymentTerms = 'Net 30 Days';
    let gstin = '';
    let pan = '';
    let billingAddress = '';
    let riskRating: any = 'AA';
    let accountManager = 'Ananya Rao';

    openDrawer(
      'Register New Customer & Corporate Account',
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 font-medium">
          Customer Master Registration &middot; Credit Risk &amp; KYC Verification
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Customer Code</label>
            <input
              type="text"
              defaultValue={code}
              onChange={(e) => (code = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#F6F4EF] font-mono font-bold text-[#0F8B8D]"
            />
          </div>
          <div className="col-span-2">
            <label className="font-bold text-[#14213D] block mb-1">Company / Legal Name *</label>
            <input
              type="text"
              placeholder="e.g. Maruti Polymer Components Ltd"
              onChange={(e) => (name = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Industry Segment</label>
            <select
              defaultValue={segment}
              onChange={(e) => (segment = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            >
              <option value="Automotive OEM Tier 1">Automotive OEM Tier 1</option>
              <option value="Retail & Packaging">Retail & Packaging</option>
              <option value="FMCG Packaging">FMCG Packaging</option>
              <option value="Agriculture / Irrigation">Agriculture / Irrigation</option>
              <option value="Consumer Plastics / Houseware">Consumer Plastics / Houseware</option>
              <option value="Medical & Healthcare">Medical & Healthcare</option>
              <option value="Electronics Enclosures">Electronics Enclosures</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Assigned Account Manager</label>
            <select
              defaultValue={accountManager}
              onChange={(e) => (accountManager = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            >
              <option value="Ananya Rao">Ananya Rao (Key Accounts)</option>
              <option value="Vikram Das">Vikram Das (Industrial / FMCG)</option>
              <option value="Rahul Verma">Rahul Verma (Automotive &amp; Medical)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-[#14213D] block mb-1">GSTIN Number</label>
            <input
              type="text"
              placeholder="e.g. 27AABCM8899K1Z4"
              onChange={(e) => (gstin = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono uppercase"
            />
          </div>
          <div>
            <label className="font-bold text-[#14213D] block mb-1">PAN Number</label>
            <input
              type="text"
              placeholder="e.g. AABCM8899K"
              onChange={(e) => (pan = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Credit Limit (₹)</label>
            <input
              type="number"
              defaultValue={creditLimit}
              onChange={(e) => (creditLimit = parseInt(e.target.value) || 1000000)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Payment Terms</label>
            <select
              defaultValue={paymentTerms}
              onChange={(e) => (paymentTerms = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            >
              <option value="Advance 100%">Advance 100%</option>
              <option value="Net 15 Days">Net 15 Days</option>
              <option value="Net 30 Days">Net 30 Days</option>
              <option value="Net 45 Days">Net 45 Days</option>
              <option value="Net 60 Days">Net 60 Days</option>
              <option value="LC at Sight">LC at Sight</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-[#14213D] block mb-1">Initial Risk Rating</label>
            <select
              defaultValue={riskRating}
              onChange={(e) => (riskRating = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            >
              <option value="AAA">AAA - Bluechip</option>
              <option value="AA">AA - Stable</option>
              <option value="A">A - Standard</option>
              <option value="BBB">BBB - Moderate</option>
            </select>
          </div>
        </div>

        <div className="border-t border-[#E4E0D6] pt-3">
          <div className="font-bold text-[#14213D] mb-2">Primary Procurement Contact</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Contact Person *</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Iyer"
                onChange={(e) => (contact = e.target.value)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Email *</label>
              <input
                type="email"
                placeholder="buyer@domain.example"
                onChange={(e) => (email = e.target.value)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Phone *</label>
              <input
                type="tel"
                placeholder="+91 98..."
                onChange={(e) => (phone = e.target.value)}
                className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="font-bold text-[#14213D] block mb-1">Registered Billing Address</label>
          <textarea
            rows={2}
            placeholder="Plot / Industrial Area, City, State, PIN"
            onChange={(e) => (billingAddress = e.target.value)}
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
            if (!name.trim()) {
              showToast('Please enter company name');
              return;
            }
            const newCustomer: Customer = {
              code,
              name,
              segment,
              contact: contact || 'Key Buyer',
              email: email || `contact@${name.toLowerCase().replace(/[^a-z]/g, '')}.example`,
              phone: phone || '+91 98000 00000',
              status: 'active',
              creditLimit,
              paymentTerms,
              gstin: gstin || '27AAACP9999P1Z1',
              pan: pan || 'AAACP9999P',
              billingAddress: billingAddress || 'Industrial Area, India',
              shippingAddresses: [billingAddress || 'Industrial Area, India'],
              riskRating,
              accountManager,
              creditStatus: 'good_standing',
              creditUsed: 0,
              overdueAmount: 0,
            };

            if (onCreateCustomer) onCreateCustomer(newCustomer);
            if (closeDrawer) closeDrawer();
            showToast(`Customer ${newCustomer.name} (${newCustomer.code}) registered successfully`);
          }}
          className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0d7a7c]"
        >
          Register Customer
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#0F8B8D]/10 text-[#0F8B8D] font-mono font-bold text-[10px] uppercase tracking-wider">
              Customer Accounts &middot; Commercial 360&deg; Master
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] font-semibold border border-emerald-200">
              KYC &amp; Credit Verified
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] mt-1 font-['Space_Grotesk']">
            Customer Directory &amp; Master Accounts
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Manage corporate client accounts, credit limits, authorized contacts, payment terms, and 360&deg; relationship history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Exporting customer accounts data...')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-[#F6F4EF] hover:bg-[#E4E0D6] text-xs font-semibold text-[#14213D]"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={handleOpenRegisterCustomerDrawer}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0d7a7c] text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> + New Customer
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Total Accounts</span>
            <Building className="w-4 h-4 text-[#0F8B8D]" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            {totalCustomers}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {activeCustomers} Active in good standing
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Sanctioned Credit Limit</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-purple-700 mt-1">
            ₹{(totalCreditSanctioned / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total approved working credit</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Overdue Receivables</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-red-700 mt-1">
            ₹{(totalOverdue / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-red-600 font-medium mt-1">
            {customers.filter((c) => (c.overdueAmount || 0) > 0).length} accounts with overdue aging
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Key Tier 1 Clients</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">
            {customers.filter((c) => c.riskRating === 'AAA' || c.riskRating === 'AA').length}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">High volume institutional OEMs</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9AA5C4]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by customer name, code, GSTIN, or contact..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs bg-[#F6F4EF] focus:outline-none focus:border-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={segmentFilter}
            onChange={(e) => {
              setSegmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs bg-[#F6F4EF] font-medium text-[#14213D]"
          >
            <option value="all">All Segments</option>
            <option value="Automotive OEM Tier 1">Automotive OEM Tier 1</option>
            <option value="Retail & Packaging">Retail & Packaging</option>
            <option value="FMCG Packaging">FMCG Packaging</option>
            <option value="Agriculture / Irrigation">Agriculture / Irrigation</option>
            <option value="Consumer Plastics / Houseware">Consumer Plastics</option>
            <option value="Medical & Healthcare">Medical & Healthcare</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs bg-[#F6F4EF] font-medium text-[#14213D]"
          >
            <option value="all">All Risk Ratings</option>
            <option value="AAA">Rating: AAA</option>
            <option value="AA">Rating: AA</option>
            <option value="A">Rating: A</option>
            <option value="BBB">Rating: BBB</option>
            <option value="High Risk">Rating: High Risk</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
                <th className="p-3">Customer Code &amp; Legal Name</th>
                <th className="p-3">Industry Segment</th>
                <th className="p-3">Credit Limit &amp; Usage</th>
                <th className="p-3">Payment Terms</th>
                <th className="p-3">Primary Contact</th>
                <th className="p-3 text-center">Risk Rating</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {pagedCustomers.map((c) => {
                const limit = c.creditLimit || 1500000;
                const used = c.creditUsed || Math.round(limit * 0.55);
                const usedPct = ((used / limit) * 100).toFixed(0);

                return (
                  <tr
                    key={c.code}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onNavigate('customerDetail', { id: c.code })}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#14213D] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {c.code.replace('CUST-', '')}
                        </div>
                        <div>
                          <div className="font-bold text-[#14213D] hover:text-[#0F8B8D]">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {c.code} &middot; GST: {c.gstin || '27AABCM8899K1Z4'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-medium text-slate-700">
                        {c.segment}
                      </span>
                    </td>
                    <td className="p-3 min-w-[140px]">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-mono font-bold text-[#14213D]">
                          ₹{(used / 100000).toFixed(1)}L / ₹{(limit / 100000).toFixed(1)}L
                        </span>
                        <span
                          className={`font-semibold ${
                            parseInt(usedPct) > 85 ? 'text-red-600' : 'text-slate-600'
                          }`}
                        >
                          {usedPct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            parseInt(usedPct) > 85 ? 'bg-red-500' : 'bg-[#0F8B8D]'
                          }`}
                          style={{ width: `${Math.min(100, parseInt(usedPct))}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      {c.paymentTerms || 'Net 30 Days'}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-[#14213D]">{c.contact}</div>
                      <div className="text-[10px] text-slate-500">{c.phone}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.riskRating === 'AAA' || c.riskRating === 'AA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.riskRating === 'A'
                            ? 'bg-blue-100 text-blue-800'
                            : c.riskRating === 'BBB'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {c.riskRating || 'AA'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.creditStatus === 'credit_blocked'
                            ? 'bg-red-100 text-red-800'
                            : c.creditStatus === 'near_limit'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.creditStatus === 'credit_blocked' ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate('customerDetail', { id: c.code })}
                          className="px-2.5 py-1 rounded bg-[#F6F4EF] hover:bg-[#E4E0D6] text-[11px] font-semibold text-[#14213D] flex items-center gap-1"
                        >
                          360&deg; Profile <ChevronRight className="w-3 h-3" />
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
          totalItems={filteredCustomers.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="customers"
        />
      </div>
    </div>
  );
};
