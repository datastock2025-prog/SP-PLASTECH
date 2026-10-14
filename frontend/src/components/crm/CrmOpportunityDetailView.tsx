import React, { useState } from 'react';
import {
  Target,
  ArrowLeft,
  Edit,
  FileText,
  FlaskConical,
  Calendar,
  CheckCircle2,
  XCircle,
  Building2,
  DollarSign,
  Award,
  Layers,
  Phone,
  Mail,
  User,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { Opportunity, Quotation, SampleRequest } from '../../types/crm';
import { mockOpportunities, mockQuotations, mockSampleRequests } from '../../data/mockCrmData';

interface CrmOpportunityDetailViewProps {
  oppId?: string;
  isNew?: boolean;
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
}

export const CrmOpportunityDetailView: React.FC<CrmOpportunityDetailViewProps> = ({
  oppId,
  isNew = false,
  onNavigate,
  showToast,
}) => {
  const opp = mockOpportunities.find(o => o.id === oppId) || mockOpportunities[0];
  const [activeTab, setActiveTab] = useState<
    'overview' | 'requirement' | 'quotations' | 'samples' | 'competitors' | 'activities' | 'documents' | 'approvals' | 'history'
  >('overview');

  const [showWonModal, setShowWonModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('Price Too High');
  const [lostNotes, setLostNotes] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'requirement', label: 'Technical & Tooling Specs' },
    { id: 'quotations', label: 'Quotations & Pricing' },
    { id: 'samples', label: 'Sample Trials' },
    { id: 'competitors', label: 'Competitor Intelligence' },
    { id: 'activities', label: 'Activities' },
    { id: 'documents', label: 'Documents' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'history', label: 'History' },
  ];

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(2)} Lakhs`;

  const handleMarkWon = () => {
    opp.status = 'Won';
    opp.stage = 'Won';
    opp.winProbability = 100;
    setShowWonModal(false);
    showToast(`Opportunity ${opp.id} marked as WON! Work order generation unlocked.`);
  };

  const handleMarkLost = () => {
    opp.status = 'Lost';
    opp.stage = 'Lost';
    opp.winProbability = 0;
    setShowLostModal(false);
    showToast(`Opportunity ${opp.id} marked as Lost.`);
  };

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('crmOpportunityPipeline')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pipeline
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('crmCustomer360', { accountId: opp.accountId })}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            Customer 360
          </button>
          <button
            onClick={() => onNavigate('crmQuotationManagement', { createFromOpp: opp.id })}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            Create Quote
          </button>
          <button
            onClick={() => onNavigate('crmSampleRequest', { createFromOpp: opp.id })}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Request Sample
          </button>
          <button
            onClick={() => setShowWonModal(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Won
          </button>
          <button
            onClick={() => setShowLostModal(true)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors"
          >
            Mark Lost
          </button>
        </div>
      </div>

      {/* Header Record Summary */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {opp.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Stage: {opp.stage}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                opp.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {opp.priority} Priority
              </span>
              <span className="text-xs text-slate-500 font-medium">Win Probability: {opp.winProbability}%</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{opp.opportunityName}</h1>
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              {opp.accountName} • {opp.productCategory}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Expected Value</span>
              <div className="text-lg font-bold text-teal-800">{formatCurrency(opp.expectedValue)}</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Target Close</span>
              <div className="text-sm font-bold text-slate-900">{opp.expectedCloseDate}</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Owner</span>
              <div className="text-sm font-semibold text-slate-900">{opp.salesperson}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
                Commercial Parameters
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block">Customer Account:</span>
                  <span className="font-semibold text-slate-800">{opp.accountName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Primary Contact:</span>
                  <span className="font-semibold text-slate-800">{opp.contactPerson} ({opp.contactPhone})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Expected Quantity:</span>
                  <span className="font-semibold text-slate-800">{opp.expectedQuantity.toLocaleString()} {opp.uom}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Customer Price:</span>
                  <span className="font-semibold text-slate-800">₹{opp.targetPrice} / {opp.uom}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Customer Part Number:</span>
                  <span className="font-bold text-teal-700 font-mono">{opp.customerPartNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Polymer / Material Grade:</span>
                  <span className="font-semibold text-slate-800">{opp.polymerGrade || 'Virgin Custom Compound'}</span>
                </div>
              </div>

              {opp.nextActivity && (
                <div className="pt-3 border-t border-slate-200 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                  <span className="text-amber-900 font-bold block mb-0.5">Next Planned Step:</span>
                  <p className="text-amber-800">{opp.nextActivity} (Due: {opp.nextActivityDueDate})</p>
                </div>
              )}
            </div>

            {/* Quotation & Sample Integration Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Quotation Reference
                  </span>
                  <span className="text-xs font-bold text-purple-700">{opp.quotationId || 'Pending'}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Quoted Amount: <strong>{opp.quotationAmount ? formatCurrency(opp.quotationAmount) : 'N/A'}</strong>
                </div>
                <div className="text-xs text-slate-600">
                  Calculated Margin: <strong className="text-emerald-700">{opp.marginPct || 22.0}%</strong>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-blue-600" />
                    Sample Approval Status
                  </span>
                  <span className="text-xs font-bold text-blue-700">{opp.sampleApprovalStatus || 'Pending'}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Mold Tooling Run: <strong>{opp.moldToolingRequired ? 'Yes (Tooling Required)' : 'Standard Stock'}</strong>
                </div>
                <div className="text-xs text-slate-600">
                  Trial Result: <strong>Customer Lab Signed-off</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Competitor Quick View */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Competitor Intelligence</h3>
            {opp.competitors && opp.competitors.length > 0 ? (
              <div className="space-y-3">
                {opp.competitors.map((comp, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{comp.name}</span>
                      <span className="text-rose-700">₹{comp.quotedPrice}</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">Strengths: {comp.strengths}</div>
                    <div className="text-slate-600 text-[11px]">Weaknesses: {comp.weaknesses}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No competitor bids logged on this opportunity.</p>
            )}
          </div>
        </div>
      )}

      {/* Technical Requirements Tab */}
      {activeTab === 'requirement' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900">Technical Mold & Polymer Specifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Product Category</span>
              <span className="font-bold text-slate-800">{opp.productCategory}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Customer Part No</span>
              <span className="font-bold text-teal-700 font-mono">{opp.customerPartNumber || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Polymer / Blend</span>
              <span className="font-bold text-slate-800">{opp.polymerGrade}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Mold Amortization</span>
              <span className="font-bold text-slate-800">{opp.moldToolingRequired ? 'Amortized / 15k units' : 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Won Modal */}
      {showWonModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Mark Opportunity as WON</h3>
            </div>
            <p className="text-xs text-slate-600">
              Congratulations! Marking this opportunity as Won will unlock automated Sales Order creation, ERP production scheduling, and inventory staging.
            </p>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 font-medium">
              Confirmed Contract Value: <strong>{formatCurrency(opp.expectedValue)}</strong>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowWonModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkWon}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Confirm Won Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Modal */}
      {showLostModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <XCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Mark Opportunity as Lost</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Lost Reason *</label>
                <select
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Price Too High">Price Too High (Competitor Undercut)</option>
                  <option value="Competitor Tooling Advantage">Competitor Tooling Advantage</option>
                  <option value="Lead Time Failure">Lead Time Failure (Urgent Supply Need)</option>
                  <option value="Sample Trial Failed">Sample Trial Failed (Spec Mismatch)</option>
                  <option value="Customer Project Canceled">Customer Project Canceled by OEM</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Debrief Notes & Competitor Details</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Competitor Time Tech offered 7% lower price due to in-house compounding..."
                  value={lostNotes}
                  onChange={(e) => setLostNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowLostModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkLost}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
