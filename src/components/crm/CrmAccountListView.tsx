import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Star,
  DollarSign,
  Layers,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';
import { Account } from '../../types/crm';
import { mockAccounts } from '../../data/mockCrmData';

interface CrmAccountListViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
  initialFilter?: string;
}

export const CrmAccountListView: React.FC<CrmAccountListViewProps> = ({
  onNavigate,
  showToast,
  initialFilter,
}) => {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<string>(initialFilter || 'All Accounts');
  const [customerGroupFilter, setCustomerGroupFilter] = useState('All');
  const [creditStatusFilter, setCreditStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Account State
  const [newAccForm, setNewAccForm] = useState<Partial<Account>>({
    accountCode: `CUST-PLAST-0${mockAccounts.length + 1}`,
    accountName: '',
    customerGroup: 'Automotive Tier-1',
    customerType: 'Key Strategic Account',
    industry: 'Automotive OEM / Tier-1',
    accountManager: 'Rajesh Sharma',
    status: 'Active',
    creditStatus: 'Good Standing',
    riskRating: 'Low',
    isPreferredCustomer: true,
    isBlocked: false,
    phone: '',
    email: '',
    website: '',
    address: '',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    creditLimit: 25000000,
    availableCredit: 25000000,
    outstandingBalance: 0,
    overdueAmount: 0,
    paymentTerms: 'Net 30 Days',
    customerRating: 4.8,
    healthScore: 90,
    segmentTier: 'Tier 1 - Strategic',
  });

  const savedViews = [
    { id: 'All Accounts', label: 'All Accounts', count: accounts.length },
    { id: 'Active Customers', label: 'Active', count: accounts.filter(a => a.status === 'Active').length },
    { id: 'Preferred Customers', label: 'Preferred ⭐', count: accounts.filter(a => a.isPreferredCustomer).length },
    { id: 'Credit Risk', label: 'Credit Alert ⚠️', count: accounts.filter(a => a.creditStatus === 'Near Limit' || a.overdueAmount > 0).length },
    { id: 'Dormant Customers', label: 'Dormant', count: accounts.filter(a => a.status === 'Dormant').length },
  ];

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      if (selectedView === 'Active Customers' && acc.status !== 'Active') return false;
      if (selectedView === 'Preferred Customers' && !acc.isPreferredCustomer) return false;
      if (selectedView === 'Credit Risk' && acc.creditStatus !== 'Near Limit' && acc.overdueAmount === 0) return false;
      if (selectedView === 'Dormant Customers' && acc.status !== 'Dormant') return false;

      if (customerGroupFilter !== 'All' && acc.customerGroup !== customerGroupFilter) return false;
      if (creditStatusFilter !== 'All' && acc.creditStatus !== creditStatusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          acc.accountName.toLowerCase().includes(q) ||
          acc.accountCode.toLowerCase().includes(q) ||
          acc.industry.toLowerCase().includes(q) ||
          acc.accountManager.toLowerCase().includes(q) ||
          acc.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [accounts, selectedView, customerGroupFilter, creditStatusFilter, searchQuery]);

  const handleToggleBlock = (accId: string) => {
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === accId) {
          const isBlocked = !acc.isBlocked;
          return { ...acc, isBlocked, status: isBlocked ? 'Blocked' : 'Active' };
        }
        return acc;
      })
    );
    showToast(`Toggled customer block status for ${accId}`);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccForm.accountName) {
      showToast('Please specify an account name');
      return;
    }

    const created: Account = {
      id: `ACC-100${accounts.length + 1}`,
      accountCode: newAccForm.accountCode || `CUST-0${accounts.length + 1}`,
      accountName: newAccForm.accountName,
      customerGroup: newAccForm.customerGroup as any,
      customerType: newAccForm.customerType as any,
      industry: newAccForm.industry || 'Automotive OEM / Tier-1',
      accountManager: newAccForm.accountManager || 'Rajesh Sharma',
      status: 'Active',
      creditStatus: 'Good Standing',
      riskRating: 'Low',
      isPreferredCustomer: Boolean(newAccForm.isPreferredCustomer),
      isBlocked: false,
      phone: newAccForm.phone || '+91 20 6608 5000',
      email: newAccForm.email || 'purchase@customer.com',
      website: newAccForm.website || 'https://customer.com',
      address: newAccForm.address || 'Industrial Estate',
      city: newAccForm.city || 'Pune',
      state: newAccForm.state || 'Maharashtra',
      country: 'India',
      creditLimit: Number(newAccForm.creditLimit) || 10000000,
      availableCredit: Number(newAccForm.creditLimit) || 10000000,
      outstandingBalance: 0,
      overdueAmount: 0,
      paymentTerms: newAccForm.paymentTerms as any || 'Net 30 Days',
      openOpportunitiesValue: 0,
      openOrdersValue: 0,
      totalRevenueYtd: 0,
      lastOrderDate: '2026-09-01',
      nextExpectedOrderDate: '2026-09-15',
      customerRating: 4.8,
      healthScore: 92,
      segmentTier: 'Tier 1 - Strategic',
    };

    setAccounts([created, ...accounts]);
    setShowCreateModal(false);
    showToast(`Account ${created.accountName} created!`);
  };

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Customer Master
            </span>
            <span className="text-xs text-slate-500">{filteredAccounts.length} Accounts managed</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Accounts & Customer Directory</h1>
          <p className="text-sm text-slate-600">
            Unified repository of automotive OEMs, packaging converters, pharmaceutical companies, and industrial molders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => showToast('Exported customer matrix to Excel')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Account
          </button>
        </div>
      </div>

      {/* Saved Views */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {savedViews.map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              selectedView === view.id
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{view.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedView === view.id ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {view.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search account code, customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={customerGroupFilter}
            onChange={(e) => setCustomerGroupFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Customer Groups</option>
            <option value="Automotive Tier-1">Automotive Tier-1</option>
            <option value="Packaging Converter">Packaging Converter</option>
            <option value="Healthcare/Pharma">Healthcare/Pharma</option>
            <option value="Industrial OEM">Industrial OEM</option>
            <option value="FMCG Major">FMCG Major</option>
          </select>

          <select
            value={creditStatusFilter}
            onChange={(e) => setCreditStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Credit Statuses</option>
            <option value="Good Standing">Good Standing</option>
            <option value="Near Limit">Near Limit</option>
            <option value="Overdue Hold">Overdue Hold</option>
          </select>
        </div>
      </div>

      {/* Account Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3">Customer Account</th>
                <th className="p-3">Customer Group</th>
                <th className="p-3">Manager</th>
                <th className="p-3">Credit Status</th>
                <th className="p-3">Avail. Credit</th>
                <th className="p-3">Outstanding</th>
                <th className="p-3">Open Orders</th>
                <th className="p-3">YTD Sales</th>
                <th className="p-3">Health</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAccounts.map(acc => (
                <tr
                  key={acc.id}
                  onClick={() => onNavigate('crmCustomer360', { accountId: acc.id })}
                  className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 group-hover:text-teal-700">
                      {acc.isPreferredCustomer && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />}
                      <span>{acc.accountName}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{acc.accountCode} • {acc.city}, {acc.state}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {acc.customerGroup}
                    </span>
                  </td>
                  <td className="p-3 text-slate-800">{acc.accountManager}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      acc.creditStatus === 'Good Standing' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      acc.creditStatus === 'Near Limit' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {acc.creditStatus}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-900">{formatCurrency(acc.availableCredit)}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{formatCurrency(acc.outstandingBalance)}</div>
                    {acc.overdueAmount > 0 && (
                      <div className="text-[10px] text-rose-600 font-semibold">Overdue: {formatCurrency(acc.overdueAmount)}</div>
                    )}
                  </td>
                  <td className="p-3 font-bold text-indigo-700">{formatCurrency(acc.openOrdersValue)}</td>
                  <td className="p-3 font-bold text-teal-800">{formatCurrency(acc.totalRevenueYtd)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${acc.healthScore >= 90 ? 'bg-emerald-500' : acc.healthScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      <span className="font-bold text-slate-800">{acc.healthScore}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onNavigate('crmCustomer360', { accountId: acc.id })}
                        className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded text-[11px] border border-teal-200"
                      >
                        360°
                      </button>
                      <button
                        onClick={() => handleToggleBlock(acc.id)}
                        className={`p-1 rounded ${acc.isBlocked ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                        title={acc.isBlocked ? 'Unblock Account' : 'Block Account'}
                      >
                        {acc.isBlocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Create Customer Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Code</label>
                  <input
                    type="text"
                    value={newAccForm.accountCode}
                    onChange={(e) => setNewAccForm({ ...newAccForm, accountCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Account Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Motherson Sumi / Tata AutoComp"
                    value={newAccForm.accountName}
                    onChange={(e) => setNewAccForm({ ...newAccForm, accountName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Group</label>
                  <select
                    value={newAccForm.customerGroup}
                    onChange={(e) => setNewAccForm({ ...newAccForm, customerGroup: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Automotive Tier-1">Automotive Tier-1</option>
                    <option value="Packaging Converter">Packaging Converter</option>
                    <option value="Healthcare/Pharma">Healthcare/Pharma</option>
                    <option value="Industrial OEM">Industrial OEM</option>
                    <option value="FMCG Major">FMCG Major</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newAccForm.creditLimit}
                    onChange={(e) => setNewAccForm({ ...newAccForm, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
