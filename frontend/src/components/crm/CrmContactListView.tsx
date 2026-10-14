import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Building2,
  Download,
  Upload,
  UserCheck,
  Crown,
  ChevronRight,
  Shield,
  Star,
} from 'lucide-react';
import { Contact } from '../../types/crm';
import { mockContacts, mockAccounts } from '../../data/mockCrmData';

interface CrmContactListViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
  initialAccountId?: string;
}

export const CrmContactListView: React.FC<CrmContactListViewProps> = ({
  onNavigate,
  showToast,
  initialAccountId,
}) => {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [buyingRoleFilter, setBuyingRoleFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newContact, setNewContact] = useState<Partial<Contact>>({
    fullName: '',
    accountId: initialAccountId || mockAccounts[0].id,
    accountName: mockAccounts[0].accountName,
    designation: '',
    department: 'Procurement / SCM',
    email: '',
    phone: '',
    mobile: '',
    isPrimary: false,
    decisionMakerRole: 'Decision Maker',
    reportsTo: '',
  });

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      if (initialAccountId && c.accountId !== initialAccountId) return false;
      if (departmentFilter !== 'All' && c.department !== departmentFilter) return false;
      if (buyingRoleFilter !== 'All' && c.decisionMakerRole !== buyingRoleFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.fullName.toLowerCase().includes(q) ||
          c.accountName.toLowerCase().includes(q) ||
          c.designation.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contacts, initialAccountId, departmentFilter, buyingRoleFilter, searchQuery]);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.fullName || !newContact.email) {
      showToast('Please provide Contact Name and Email');
      return;
    }

    const matchedAccount = mockAccounts.find(a => a.id === newContact.accountId);

    const created: Contact = {
      id: `CONT-0${contacts.length + 1}`,
      fullName: newContact.fullName,
      accountId: newContact.accountId || mockAccounts[0].id,
      accountName: matchedAccount ? matchedAccount.accountName : 'Customer Account',
      designation: newContact.designation || 'Manager',
      department: newContact.department || 'Procurement',
      email: newContact.email,
      phone: newContact.phone || '+91 20 6608 5100',
      mobile: newContact.mobile || '+91 98230 11223',
      isPrimary: Boolean(newContact.isPrimary),
      decisionMakerRole: newContact.decisionMakerRole as any || 'Evaluator',
      reportsTo: newContact.reportsTo || '',
      preferredContactChannel: 'Email',
    };

    setContacts([created, ...contacts]);
    setShowAddModal(false);
    showToast(`Added contact: ${created.fullName}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Customer Stakeholders
            </span>
            <span className="text-xs text-slate-500">{filteredContacts.length} Contacts</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Contact Directory & Buying Centers</h1>
          <p className="text-sm text-slate-600">
            Map key decision makers, tooling engineers, quality heads, and procurement directors across customer accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => showToast('Exported contacts directory')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search contact, designation, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Departments</option>
            <option value="Procurement / SCM">Procurement / SCM</option>
            <option value="Quality Assurance">Quality Assurance</option>
            <option value="Tooling & Mold Design">Tooling & Mold Design</option>
            <option value="R&D / Materials Eng">R&D / Materials</option>
            <option value="Plant Operations">Plant Operations</option>
          </select>

          <select
            value={buyingRoleFilter}
            onChange={(e) => setBuyingRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Buying Roles</option>
            <option value="Decision Maker">Decision Maker (C-Level/VP)</option>
            <option value="Influencer">Technical Influencer</option>
            <option value="Evaluator">Lab/Quality Evaluator</option>
            <option value="Gatekeeper">Gatekeeper / Commercial</option>
          </select>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map(contact => (
          <div
            key={contact.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-900 text-sm">{contact.fullName}</h3>
                  {contact.isPrimary && (
                    <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[10px] font-bold rounded">
                      Primary
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 font-medium">{contact.designation}</div>
                <div className="text-[11px] text-teal-700 font-semibold">{contact.accountName}</div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                contact.decisionMakerRole === 'Decision Maker' ? 'bg-purple-100 text-purple-800' :
                contact.decisionMakerRole === 'Influencer' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {contact.decisionMakerRole}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{contact.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{contact.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{contact.email}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => onNavigate('crmCustomer360', { accountId: contact.accountId })}
                className="text-xs text-teal-700 font-semibold hover:underline"
              >
                View Account 360°
              </button>
              <button
                onClick={() => showToast(`Initiated email to ${contact.email}`)}
                className="p-1.5 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded-lg transition-colors"
                title="Send Direct Email"
              >
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add Customer Contact</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Account *</label>
                <select
                  value={newContact.accountId}
                  onChange={(e) => {
                    const acc = mockAccounts.find(a => a.id === e.target.value);
                    setNewContact({ ...newContact, accountId: e.target.value, accountName: acc?.accountName });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  {mockAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Kulkarni"
                    value={newContact.fullName}
                    onChange={(e) => setNewContact({ ...newContact, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. VP Procurement"
                    value={newContact.designation}
                    onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newContact.department}
                    onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Procurement / SCM">Procurement / SCM</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Tooling & Mold Design">Tooling & Mold Design</option>
                    <option value="R&D / Materials Eng">R&D / Materials Eng</option>
                    <option value="Plant Operations">Plant Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Buying Role</label>
                  <select
                    value={newContact.decisionMakerRole}
                    onChange={(e) => setNewContact({ ...newContact, decisionMakerRole: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Decision Maker">Decision Maker</option>
                    <option value="Influencer">Influencer</option>
                    <option value="Evaluator">Evaluator</option>
                    <option value="Gatekeeper">Gatekeeper</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@customer.com"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98230 00000"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Save Stakeholder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
