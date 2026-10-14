import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Download,
  Upload,
  Mail,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Phone,
  Building2,
  Calendar,
  Layers,
  FileCheck,
  Zap,
} from 'lucide-react';
import { Lead, LeadStatus, ProductInterestType } from '../../types/crm';
import { mockLeads } from '../../data/mockCrmData';

interface CrmLeadListViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
  initialFilter?: string;
}

export const CrmLeadListView: React.FC<CrmLeadListViewProps> = ({ onNavigate, showToast, initialFilter }) => {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<string>(initialFilter || 'All Leads');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [industryFilter, setIndustryFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Lead Form State
  const [newLeadForm, setNewLeadForm] = useState<Partial<Lead>>({
    leadName: '',
    companyName: '',
    contactPerson: '',
    designation: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: 'India',
    source: 'Website Inquiry',
    status: 'New',
    priority: 'High',
    assignedSalesperson: 'Rajesh Sharma',
    expectedValue: 1500000,
    expectedQuantity: 10000,
    leadScore: 80,
    industry: 'Automotive OEM / Tier-1',
    requirements: {
      productInterest: 'Raw Resin / Polymer',
      polymerType: 'PP',
      grade: 'Prime Virgin',
      expectedQuantity: 10000,
      uom: 'KG',
      targetPrice: 120,
      requiredDeliveryDate: '2026-09-30',
      moqAcceptance: true,
      coaRequired: true,
      msdsRequired: true,
      sampleRequired: true,
    },
  });

  const savedViews = [
    { id: 'All Leads', label: 'All Leads', count: leads.length },
    { id: 'My Leads', label: 'My Leads', count: leads.filter(l => l.assignedSalesperson === 'Rajesh Sharma').length },
    { id: 'New Leads', label: 'New Leads', count: leads.filter(l => l.status === 'New').length },
    { id: 'Contacted Leads', label: 'Contacted', count: leads.filter(l => l.status === 'Contacted').length },
    { id: 'Qualified Leads', label: 'Qualified', count: leads.filter(l => l.status === 'Qualified').length },
    { id: 'Hot Leads', label: 'Hot Leads (Score > 85)', count: leads.filter(l => l.leadScore >= 85).length },
    { id: 'Unqualified Leads', label: 'Unqualified', count: leads.filter(l => l.status === 'Unqualified').length },
  ];

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Saved View Filter
      if (selectedView === 'My Leads' && lead.assignedSalesperson !== 'Rajesh Sharma') return false;
      if (selectedView === 'New Leads' && lead.status !== 'New') return false;
      if (selectedView === 'Contacted Leads' && lead.status !== 'Contacted') return false;
      if (selectedView === 'Qualified Leads' && lead.status !== 'Qualified') return false;
      if (selectedView === 'Hot Leads' && lead.leadScore < 85) return false;
      if (selectedView === 'Unqualified Leads' && lead.status !== 'Unqualified') return false;

      // Status Filter
      if (statusFilter !== 'All' && lead.status !== statusFilter) return false;

      // Industry Filter
      if (industryFilter !== 'All' && lead.industry !== industryFilter) return false;

      // Source Filter
      if (sourceFilter !== 'All' && lead.source !== sourceFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          lead.leadName.toLowerCase().includes(query) ||
          lead.companyName.toLowerCase().includes(query) ||
          lead.contactPerson.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.phone.toLowerCase().includes(query) ||
          lead.assignedSalesperson.toLowerCase().includes(query) ||
          lead.requirements.productInterest.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [leads, selectedView, statusFilter, industryFilter, sourceFilter, searchQuery]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleMarkStatus = (leadId: string, status: LeadStatus) => {
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, status } : l))
    );
    showToast(`Lead ${leadId} marked as ${status}`);
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.companyName || !newLeadForm.contactPerson) {
      showToast('Please fill required fields (Company Name, Contact Person)');
      return;
    }

    const created: Lead = {
      id: `LEAD-2026-0${leads.length + 86}`,
      leadName: newLeadForm.leadName || `${newLeadForm.companyName} Inquiry`,
      companyName: newLeadForm.companyName || '',
      contactPerson: newLeadForm.contactPerson || '',
      designation: newLeadForm.designation || 'Procurement Lead',
      email: newLeadForm.email || '',
      phone: newLeadForm.phone || '',
      city: newLeadForm.city || 'Mumbai',
      state: newLeadForm.state || 'Maharashtra',
      country: 'India',
      source: newLeadForm.source || 'Website Inquiry',
      status: 'New',
      priority: newLeadForm.priority || 'High',
      assignedSalesperson: newLeadForm.assignedSalesperson || 'Rajesh Sharma',
      expectedValue: Number(newLeadForm.expectedValue) || 1000000,
      expectedQuantity: Number(newLeadForm.expectedQuantity) || 5000,
      leadScore: Number(newLeadForm.leadScore) || 75,
      industry: newLeadForm.industry || 'Automotive OEM / Tier-1',
      notes: newLeadForm.notes || '',
      createdAt: '2026-09-01',
      nextFollowUpDate: '2026-09-05',
      requirements: newLeadForm.requirements as any,
    };

    setLeads([created, ...leads]);
    setShowCreateModal(false);
    showToast(`Lead ${created.id} created successfully`);
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">New</span>;
      case 'Contacted':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Contacted</span>;
      case 'Qualified':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Qualified</span>;
      case 'Unqualified':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Unqualified</span>;
      case 'Converted':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Converted</span>;
      case 'Lost':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">Lost</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Pipeline Capture
            </span>
            <span className="text-xs text-slate-500">{filteredLeads.length} Leads found</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Leads & Inquiry Ingestion</h1>
          <p className="text-sm text-slate-600">
            Track and qualify potential customer inquiries for virgin polymers, color masterbatches, and molded components.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => showToast('Exported leads to Excel format')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => showToast('Bulk lead import CSV template ready')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Lead
          </button>
        </div>
      </div>

      {/* Saved Views Pills */}
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

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search lead, company, resin, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">Status: All</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Unqualified">Unqualified</option>
            <option value="Converted">Converted</option>
          </select>

          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">Industry: All</option>
            <option value="Automotive OEM / Tier-1">Automotive OEM</option>
            <option value="FMCG & Packaging">FMCG Packaging</option>
            <option value="Medical & Healthcare">Medical</option>
            <option value="Agriculture & Pipes">Agriculture</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">Source: All</option>
            <option value="PlastIndia Exhibition">PlastIndia Expo</option>
            <option value="Website Inquiry">Website</option>
            <option value="Direct Referral">Referral</option>
            <option value="Trade Fair">Trade Fair</option>
          </select>

          {selectedLeadIds.length > 0 && (
            <div className="flex items-center gap-2 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 text-xs text-teal-800">
              <span className="font-semibold">{selectedLeadIds.length} Selected</span>
              <button
                onClick={() => showToast(`Bulk assigned ${selectedLeadIds.length} leads`)}
                className="text-teal-700 hover:underline font-bold"
              >
                Assign
              </button>
              <button
                onClick={() => showToast(`Bulk emailed ${selectedLeadIds.length} leads`)}
                className="text-teal-700 hover:underline font-bold"
              >
                Email
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leads Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="p-3">Lead ID & Name</th>
                <th className="p-3">Company & Location</th>
                <th className="p-3">Contact Person</th>
                <th className="p-3">Product Interest</th>
                <th className="p-3">Exp. Value</th>
                <th className="p-3">Score</th>
                <th className="p-3">Assigned To</th>
                <th className="p-3">Status</th>
                <th className="p-3">Next Follow-Up</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                  onClick={() => onNavigate('crmLeadDetail', { leadId: lead.id })}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.includes(lead.id)}
                      onChange={() => handleSelectOne(lead.id)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 group-hover:text-teal-700">{lead.leadName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{lead.id} • {lead.source}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-slate-800">{lead.companyName}</div>
                    <div className="text-[10px] text-slate-500">{lead.city}, {lead.state}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-900 font-medium">{lead.contactPerson}</div>
                    <div className="text-[10px] text-slate-500">{lead.phone}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {lead.requirements.productInterest}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {lead.requirements.grade || lead.requirements.polymerType || 'Custom Tooling'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{formatCurrency(lead.expectedValue)}</div>
                    <div className="text-[10px] text-slate-500">{lead.expectedQuantity.toLocaleString()} {lead.requirements.uom}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${lead.leadScore >= 80 ? 'bg-emerald-500' : lead.leadScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      <span className="font-bold text-slate-800">{lead.leadScore}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-800">{lead.assignedSalesperson}</div>
                  </td>
                  <td className="p-3">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="p-3">
                    <div className="text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{lead.nextFollowUpDate}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onNavigate('crmLeadDetail', { leadId: lead.id, convert: true })}
                        className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded text-[11px] border border-teal-200 transition-colors"
                        title="Convert to Opportunity"
                      >
                        Convert
                      </button>
                      <button
                        onClick={() => handleMarkStatus(lead.id, lead.status === 'Qualified' ? 'Contacted' : 'Qualified')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-emerald-600"
                        title="Toggle Qualified"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Plastic CRM Lead</h3>
                <p className="text-xs text-slate-500">Capture resin specs, customer part numbers, and target price.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Motherson Sumi / Tata AutoComp"
                    value={newLeadForm.companyName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={newLeadForm.contactPerson}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="procurement@company.com"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / Mobile</label>
                  <input
                    type="text"
                    placeholder="+91 98230 11492"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Segment</label>
                  <select
                    value={newLeadForm.industry}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, industry: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Automotive OEM / Tier-1">Automotive OEM / Tier-1</option>
                    <option value="FMCG & Packaging">FMCG & Packaging</option>
                    <option value="Medical & Healthcare">Medical & Healthcare</option>
                    <option value="Electronics & Appliances">Electronics & Appliances</option>
                    <option value="Agriculture & Pipes">Agriculture & Pipes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Category Interest</label>
                  <select
                    value={newLeadForm.requirements?.productInterest}
                    onChange={(e) => setNewLeadForm({
                      ...newLeadForm,
                      requirements: { ...newLeadForm.requirements!, productInterest: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Raw Resin / Polymer">Raw Resin / Polymer</option>
                    <option value="Color Masterbatch">Color Masterbatch</option>
                    <option value="Performance Additive">Performance Additive</option>
                    <option value="Custom Injection Molded Part">Custom Injection Molded Part</option>
                    <option value="Blow Molded Container">Blow Molded Container</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Quantity</label>
                  <input
                    type="number"
                    value={newLeadForm.expectedQuantity}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, expectedQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Deal Value (₹)</label>
                  <input
                    type="number"
                    value={newLeadForm.expectedValue}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, expectedValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Notes / Polymer Spec</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Requires 20% Talc filled PP with MFI 14.5 g/10min for automotive bumper..."
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Save & Ingest Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
