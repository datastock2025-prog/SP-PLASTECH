import React, { useState } from 'react';
import {
  Building2,
  ArrowLeft,
  Edit,
  Target,
  FileText,
  ShoppingCart,
  Truck,
  DollarSign,
  AlertOctagon,
  FlaskConical,
  FileCheck,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  Lock,
  Unlock,
  Plus,
  ArrowRight,
  TrendingUp,
  CreditCard,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  Account,
  Contact,
  Opportunity,
  Quotation,
  SalesOrder,
  Complaint,
  SampleRequest,
  CustomerDocument,
} from '../../types/crm';
import {
  mockAccounts,
  mockContacts,
  mockOpportunities,
  mockQuotations,
  mockSalesOrders,
  mockComplaints,
  mockSampleRequests,
  mockCustomerDocuments,
} from '../../data/mockCrmData';

interface CrmCustomer360ViewProps {
  accountId?: string;
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
}

export const CrmCustomer360View: React.FC<CrmCustomer360ViewProps> = ({
  accountId,
  onNavigate,
  showToast,
}) => {
  const account = mockAccounts.find(a => a.id === accountId) || mockAccounts[0];

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'contacts'
    | 'opportunities'
    | 'quotations'
    | 'orders'
    | 'complaints'
    | 'samples'
    | 'documents'
    | 'compliance'
    | 'activities'
  >('overview');

  const contacts = mockContacts.filter(c => c.accountId === account.id);
  const opportunities = mockOpportunities.filter(o => o.accountId === account.id);
  const quotations = mockQuotations.filter(q => q.accountId === account.id);
  const orders = mockSalesOrders.filter(o => o.accountId === account.id);
  const complaints = mockComplaints.filter(c => c.accountId === account.id);
  const samples = mockSampleRequests.filter(s => s.accountId === account.id);
  const documents = mockCustomerDocuments.filter(d => d.accountId === account.id);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'contacts', label: `Contacts (${contacts.length})` },
    { id: 'opportunities', label: `Deals & Opps (${opportunities.length})` },
    { id: 'quotations', label: `Quotations (${quotations.length})` },
    { id: 'orders', label: `Sales Orders (${orders.length})` },
    { id: 'complaints', label: `Complaints (${complaints.length})` },
    { id: 'samples', label: `Samples & Lab (${samples.length})` },
    { id: 'documents', label: `Documents & COAs (${documents.length})` },
    { id: 'compliance', label: 'Compliance' },
    { id: 'activities', label: 'Activity Feed' },
  ];

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(2)} Lakhs`;

  return (
    <div className="space-y-5">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('crmAccountList')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Accounts Directory
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('crmQuotationManagement', { accountId: account.id })}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200 transition-colors"
          >
            + Create Quote
          </button>
          <button
            onClick={() => onNavigate('crmSampleRequest', { accountId: account.id })}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
          >
            + Request Sample
          </button>
          <button
            onClick={() => onNavigate('crmComplaintManagement', { accountId: account.id })}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors"
          >
            + Log Complaint
          </button>
        </div>
      </div>

      {/* Hero 360 Header Record */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                {account.accountCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {account.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {account.customerGroup}
              </span>
              {account.isPreferredCustomer && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  Preferred Account
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              {account.accountName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {account.city}, {account.state}, {account.country}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {account.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {account.email}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Account Mgr: <strong>{account.accountManager}</strong>
              </span>
            </div>
          </div>

          {/* Quick Balance Cards */}
          <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Credit Limit</span>
              <div className="text-sm font-bold text-slate-900">{formatCurrency(account.creditLimit)}</div>
              <span className="text-[10px] text-emerald-600 font-semibold">
                Avail: {formatCurrency(account.availableCredit)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">YTD Revenue</span>
              <div className="text-sm font-bold text-teal-800">{formatCurrency(account.totalRevenueYtd)}</div>
              <span className="text-[10px] text-slate-500">{orders.length} orders fulfilled</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Account Health</span>
              <div className="text-sm font-bold text-emerald-700">{account.healthScore}%</div>
              <span className="text-[10px] text-slate-500">Low Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* 360 Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Commercial Profile */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
                Commercial Profile & Credit Settings
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-500 block">Customer Segment Tier:</span>
                  <span className="font-bold text-slate-800">{account.segmentTier}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Terms:</span>
                  <span className="font-bold text-slate-800">{account.paymentTerms}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Credit Status:</span>
                  <span className="font-bold text-emerald-700">{account.creditStatus}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Outstanding Receivables:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(account.outstandingBalance)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Overdue Balance:</span>
                  <span className="font-bold text-rose-600">{formatCurrency(account.overdueAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Last Order Invoiced:</span>
                  <span className="font-bold text-slate-800">{account.lastOrderDate}</span>
                </div>
              </div>
            </div>

            {/* Open Orders & Active Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-indigo-600" />
                    Active Pipeline Opportunities
                  </h3>
                  <span className="text-xs font-bold text-indigo-700">{opportunities.length}</span>
                </div>
                <div className="space-y-2">
                  {opportunities.map(opp => (
                    <div
                      key={opp.id}
                      onClick={() => onNavigate('crmOpportunityDetail', { oppId: opp.id })}
                      className="p-2.5 bg-slate-50 hover:bg-indigo-50/50 rounded-lg border border-slate-200 cursor-pointer transition-colors text-xs"
                    >
                      <div className="font-bold text-slate-900">{opp.opportunityName}</div>
                      <div className="flex items-center justify-between text-slate-500 mt-1 text-[11px]">
                        <span>Stage: {opp.stage}</span>
                        <strong className="text-teal-700">{formatCurrency(opp.expectedValue)}</strong>
                      </div>
                    </div>
                  ))}
                  {opportunities.length === 0 && <p className="text-xs text-slate-400">No active opportunities.</p>}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    Recent Sales Orders
                  </h3>
                  <span className="text-xs font-bold text-emerald-700">{orders.length}</span>
                </div>
                <div className="space-y-2">
                  {orders.map(order => (
                    <div key={order.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{order.orderNumber}</span>
                        <span className="text-emerald-700">{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 mt-1 text-[11px]">
                        <span>Status: {order.orderStatus}</span>
                        <span>Del: {order.deliveryStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Contacts Card */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Key Contacts</h3>
                <button
                  onClick={() => onNavigate('crmContactList', { accountId: account.id })}
                  className="text-xs text-teal-700 font-semibold hover:underline"
                >
                  Manage All
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {contacts.map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{c.fullName}</span>
                      {c.isPrimary && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 text-[11px]">{c.designation} • {c.department}</div>
                    <div className="text-slate-500 text-[11px]">{c.phone} | {c.email}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Contacts */}
      {activeTab === 'contacts' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Stakeholder Directory ({contacts.length})</h2>
            <button
              onClick={() => onNavigate('crmContactList', { accountId: account.id })}
              className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg"
            >
              + Add Contact
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {contacts.map(c => (
              <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                  <span>{c.fullName}</span>
                  {c.isPrimary && <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded">Primary</span>}
                </div>
                <div className="text-slate-600">{c.designation} - {c.department}</div>
                <div className="text-slate-500">Phone: {c.phone} (Mob: {c.mobile})</div>
                <div className="text-slate-500">Email: {c.email}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Quotations */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Customer Quotations</h2>
            <button
              onClick={() => onNavigate('crmQuotationManagement', { accountId: account.id })}
              className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg"
            >
              + New Quotation
            </button>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="p-3">Quote No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Margin</th>
                <th className="p-3">Status</th>
                <th className="p-3">Valid Until</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {quotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900 font-mono">{q.quotationNumber}</td>
                  <td className="p-3 text-slate-600">{q.quotationDate}</td>
                  <td className="p-3 font-bold text-teal-800">{formatCurrency(q.totalAmount)}</td>
                  <td className="p-3 font-semibold text-emerald-700">{q.marginPercentage}%</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      {q.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{q.validUntil}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Complaints & CAPA */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Quality Complaints & 8D CAPA</h2>
            <button
              onClick={() => onNavigate('crmComplaintManagement', { accountId: account.id })}
              className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg"
            >
              + Log Complaint
            </button>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="p-3">Complaint ID</th>
                <th className="p-3">Defect Category</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Batch Number</th>
                <th className="p-3">CAPA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {complaints.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900 font-mono">{c.complaintNumber}</td>
                  <td className="p-3 font-medium text-slate-800">{c.complaintCategory}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      {c.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-700">{c.batchNumber || 'N/A'}</td>
                  <td className="p-3 font-semibold text-teal-700">{c.capaStatus || 'In Root Cause Analysis'}</td>
                </tr>
              ))}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">No quality complaints recorded for this customer.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
