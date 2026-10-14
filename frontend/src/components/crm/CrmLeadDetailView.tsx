import React, { useState } from 'react';
import {
  Users,
  ArrowLeft,
  Edit,
  Target,
  Building2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Award,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Plus,
  FileCheck,
} from 'lucide-react';
import { Lead, Opportunity, Account, Contact } from '../../types/crm';
import { mockLeads, mockAccounts } from '../../data/mockCrmData';

interface CrmLeadDetailViewProps {
  leadId: string;
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
  initialConvert?: boolean;
}

export const CrmLeadDetailView: React.FC<CrmLeadDetailViewProps> = ({
  leadId,
  onNavigate,
  showToast,
  initialConvert = false,
}) => {
  const lead = mockLeads.find(l => l.id === leadId) || mockLeads[0];
  const [activeTab, setActiveTab] = useState<'overview' | 'contact' | 'requirement' | 'activities' | 'documents' | 'notes' | 'history'>('overview');
  const [showConvertModal, setShowConvertModal] = useState(initialConvert);
  const [convertTarget, setConvertTarget] = useState<'create_new' | 'link_existing'>('create_new');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(mockAccounts[0].id);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'contact', label: 'Contact Details' },
    { id: 'requirement', label: 'Polymer & Technical Requirements' },
    { id: 'activities', label: 'Activities & Timeline' },
    { id: 'documents', label: 'Documents & COAs' },
    { id: 'notes', label: 'Internal Notes' },
    { id: 'history', label: 'Audit Trail' },
  ];

  const handleConvertLead = () => {
    showToast(`Lead ${lead.id} converted successfully into Account, Contact, and Opportunity!`);
    setShowConvertModal(false);
    onNavigate('crmOpportunityPipeline');
  };

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(2)} Lakhs`;

  return (
    <div className="space-y-5">
      {/* Back Button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('crmLeadList')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads List
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast(`Marked ${lead.id} as Qualified`)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
          >
            Mark Qualified
          </button>
          <button
            onClick={() => setShowConvertModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            Convert to Opportunity
          </button>
        </div>
      </div>

      {/* Header Record Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {lead.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {lead.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Priority: {lead.priority}
              </span>
              <span className="text-xs text-slate-500">Source: {lead.source}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{lead.leadName}</h1>
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              {lead.companyName} ({lead.industry})
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Expected Value</span>
              <div className="text-lg font-bold text-teal-800">{formatCurrency(lead.expectedValue)}</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Lead Score</span>
              <div className="text-lg font-bold text-emerald-700">{lead.leadScore} / 100</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Sales Owner</span>
              <div className="text-sm font-semibold text-slate-900">{lead.assignedSalesperson}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
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

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
                Lead Overview & Sourcing Context
              </h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Company Name:</span>
                  <span className="font-semibold text-slate-800">{lead.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Industry Segment:</span>
                  <span className="font-semibold text-slate-800">{lead.industry}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact Person:</span>
                  <span className="font-semibold text-slate-800">{lead.contactPerson} ({lead.designation})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Lead Ingestion Date:</span>
                  <span className="font-semibold text-slate-800">{lead.createdAt}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Next Scheduled Action:</span>
                  <span className="font-semibold text-teal-700">{lead.nextFollowUpDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Competitor Information:</span>
                  <span className="font-semibold text-slate-800">{lead.competitorInfo || 'No direct competitor logged'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <span className="text-slate-500 text-xs block mb-1">Commercial Notes & Requirements:</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {lead.notes || 'No custom notes.'}
                </p>
              </div>
            </div>

            {/* Quick Spec Highlights */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Technical Highlights</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100">
                  <span className="text-[10px] text-teal-800 font-semibold uppercase">Product Interest</span>
                  <div className="font-bold text-slate-900 mt-0.5">{lead.requirements.productInterest}</div>
                </div>
                <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100">
                  <span className="text-[10px] text-teal-800 font-semibold uppercase">Polymer Grade</span>
                  <div className="font-bold text-slate-900 mt-0.5">{lead.requirements.grade || 'Custom Mold'}</div>
                </div>
                <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100">
                  <span className="text-[10px] text-teal-800 font-semibold uppercase">Target Price</span>
                  <div className="font-bold text-slate-900 mt-0.5">₹{lead.requirements.targetPrice} / {lead.requirements.uom}</div>
                </div>
                <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100">
                  <span className="text-[10px] text-teal-800 font-semibold uppercase">Required Qty</span>
                  <div className="font-bold text-slate-900 mt-0.5">{lead.requirements.expectedQuantity.toLocaleString()} {lead.requirements.uom}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Direct Contact</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <span className="font-medium">{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-teal-600" />
                  <span className="font-medium">{lead.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>{lead.city}, {lead.state}, {lead.country}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
                <button
                  onClick={() => showToast(`Initiated email to ${lead.email}`)}
                  className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg border border-teal-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Send SCM Catalog / Brochure
                </button>
                <button
                  onClick={() => onNavigate('crmActivityManagement')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule Sales Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirement Details Tab */}
      {activeTab === 'requirement' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Plastic Manufacturing & Technical Specifications</h2>
            <span className="px-2.5 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold text-xs border border-teal-200">
              {lead.requirements.productInterest}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-1">Polymer Resin Type</span>
              <span className="text-sm font-bold text-slate-800">{lead.requirements.polymerType || 'Polypropylene (PP)'}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-1">Grade / Compounding Code</span>
              <span className="text-sm font-bold text-slate-800">{lead.requirements.grade || 'Impact Copolymer 3030J'}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-1">Melt Flow Index (MFI Target)</span>
              <span className="text-sm font-bold text-slate-800">{lead.requirements.mfiTarget || '14.5 g/10min (230°C/2.16kg)'}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-1">Customer Part Number</span>
              <span className="text-sm font-bold text-teal-700 font-mono">{lead.requirements.customerPartNumber || 'N/A'}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-1">Target Delivery Date</span>
              <span className="text-sm font-bold text-slate-800">{lead.requirements.requiredDeliveryDate}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-1">Packaging Specification</span>
              <span className="text-sm font-bold text-slate-800">{lead.requirements.packagingRequirement || '25kg Kraft Bags'}</span>
            </div>
          </div>

          <div className="p-4 bg-teal-50/40 rounded-xl border border-teal-200 space-y-3">
            <h3 className="text-xs font-bold text-teal-900 uppercase">Compliance & Documentation Checklist</h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-800">COA Batch Analysis Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-800">MSDS / REACH / RoHS Certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-800">Pre-Production Mold Plaque Sample</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Details Tab */}
      {activeTab === 'contact' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900">Lead Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block">Name & Designation:</span>
              <span className="font-bold text-slate-800">{lead.contactPerson} ({lead.designation})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Corporate Email:</span>
              <span className="font-bold text-slate-800">{lead.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Direct Telephone:</span>
              <span className="font-bold text-slate-800">{lead.phone}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Address / Plant:</span>
              <span className="font-bold text-slate-800">{lead.address || 'Industrial Area'}, {lead.city}, {lead.state}</span>
            </div>
          </div>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Timeline & Activity History</h2>
            <button
              onClick={() => onNavigate('crmActivityManagement')}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg"
            >
              + Log Activity
            </button>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
              <div className="p-2 bg-teal-100 text-teal-700 rounded-md">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Lead Ingested from PlastIndia Exhibition</div>
                <div className="text-slate-500 text-[10px]">Logged by Rajesh Sharma on {lead.createdAt}</div>
                <p className="text-slate-700 mt-1">Visited booth, discussed 28 MT requirement for EV interior components.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Modal / Panel */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-bold text-slate-900">Convert Lead to Commercial Opportunity</h3>
              </div>
              <button onClick={() => setShowConvertModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Converting this lead will automatically generate an <strong>Account</strong> record, a <strong>Primary Contact</strong>, and inject an active <strong>Opportunity</strong> into the Sales Pipeline.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 space-y-2">
                <div className="font-bold text-teal-900">Entities to be Created:</div>
                <ul className="list-disc pl-4 space-y-1 text-teal-800">
                  <li><strong>Account:</strong> {lead.companyName} ({lead.industry})</li>
                  <li><strong>Contact:</strong> {lead.contactPerson} ({lead.designation})</li>
                  <li><strong>Opportunity:</strong> {lead.leadName} (Expected: {formatCurrency(lead.expectedValue)})</li>
                </ul>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Creation Option</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="accTarget"
                      checked={convertTarget === 'create_new'}
                      onChange={() => setConvertTarget('create_new')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span>Create New Account</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="accTarget"
                      checked={convertTarget === 'link_existing'}
                      onChange={() => setConvertTarget('link_existing')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span>Link to Existing Account</span>
                  </label>
                </div>
              </div>

              {convertTarget === 'link_existing' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Existing Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    {mockAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.accountName} ({acc.accountCode})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvertLead}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Confirm Conversion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
