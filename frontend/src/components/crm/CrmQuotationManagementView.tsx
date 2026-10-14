import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Send,
  Building2,
  DollarSign,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Quotation, QuotationStatus } from '../../types/crm';
import { mockQuotations, mockAccounts, mockOpportunities } from '../../data/mockCrmData';

interface CrmQuotationManagementViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
  initialAccountId?: string;
  createFromOpp?: string;
}

export const CrmQuotationManagementView: React.FC<CrmQuotationManagementViewProps> = ({
  onNavigate,
  showToast,
  initialAccountId,
  createFromOpp,
}) => {
  const [quotations, setQuotations] = useState<Quotation[]>(mockQuotations);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(quotations[0]);
  const [showCreateModal, setShowCreateModal] = useState(Boolean(createFromOpp));

  const [newQuoteForm, setNewQuoteForm] = useState<Partial<Quotation>>({
    quotationNumber: `QUO-2026-0${quotations.length + 89}`,
    revisionNumber: 0,
    accountId: initialAccountId || mockAccounts[0].id,
    accountName: mockAccounts[0].accountName,
    opportunityId: createFromOpp || mockOpportunities[0].id,
    opportunityName: mockOpportunities[0].opportunityName,
    salesperson: 'Rajesh Sharma',
    quotationDate: '2026-09-01',
    validUntil: '2026-09-30',
    status: 'Draft',
    subtotal: 1800000,
    taxAmount: 324000,
    totalAmount: 2124000,
    marginPercentage: 24.5,
    approvalStatus: 'Approved',
    paymentTerms: 'Net 30 Days',
    deliveryTerms: 'Ex-Works Chakan',
    polymerPriceEscalationClause: true,
    items: [
      {
        id: 'QI-1',
        itemCode: 'PP-AUTO-01',
        description: 'Automotive Door Trim Clip (PA66-GF30)',
        polymerGrade: 'PA66 30% Glass Filled Heat Stabilized',
        quantity: 50000,
        uom: 'NOS',
        unitPrice: 36.0,
        lineTotal: 1800000,
        marginPct: 24.5,
      },
    ],
  });

  const filteredQuotes = useMemo(() => {
    return quotations.filter(q => {
      if (initialAccountId && q.accountId !== initialAccountId) return false;
      if (statusFilter !== 'All' && q.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          q.quotationNumber.toLowerCase().includes(query) ||
          q.accountName.toLowerCase().includes(query) ||
          q.salesperson.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [quotations, initialAccountId, statusFilter, searchQuery]);

  const handleStatusChange = (quoteId: string, status: QuotationStatus) => {
    setQuotations(prev =>
      prev.map(q => (q.id === quoteId ? { ...q, status } : q))
    );
    if (selectedQuote?.id === quoteId) {
      setSelectedQuote(prev => (prev ? { ...prev, status } : null));
    }
    showToast(`Quotation status changed to ${status}`);
  };

  const handleConvertToOrder = (quote: Quotation) => {
    showToast(`Quotation ${quote.quotationNumber} successfully converted to Confirmed Sales Order!`);
    onNavigate('crmAccountList');
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedAccount = mockAccounts.find(a => a.id === newQuoteForm.accountId);
    const created: Quotation = {
      id: `QUO-0${quotations.length + 1}`,
      quotationNumber: newQuoteForm.quotationNumber || `QUO-2026-099`,
      revisionNumber: 0,
      accountId: newQuoteForm.accountId || mockAccounts[0].id,
      accountName: matchedAccount ? matchedAccount.accountName : 'Customer Account',
      opportunityId: newQuoteForm.opportunityId,
      opportunityName: newQuoteForm.opportunityName,
      salesperson: newQuoteForm.salesperson || 'Rajesh Sharma',
      quotationDate: newQuoteForm.quotationDate || '2026-09-01',
      validUntil: newQuoteForm.validUntil || '2026-09-30',
      status: 'Submitted',
      subtotal: Number(newQuoteForm.subtotal) || 1500000,
      taxAmount: Number(newQuoteForm.taxAmount) || 270000,
      totalAmount: Number(newQuoteForm.totalAmount) || 1770000,
      marginPercentage: Number(newQuoteForm.marginPercentage) || 24,
      approvalStatus: 'Approved',
      paymentTerms: newQuoteForm.paymentTerms || 'Net 30 Days',
      deliveryTerms: newQuoteForm.deliveryTerms || 'Ex-Works Chakan',
      polymerPriceEscalationClause: true,
      items: newQuoteForm.items || [],
    };

    setQuotations([created, ...quotations]);
    setSelectedQuote(created);
    setShowCreateModal(false);
    showToast(`Quotation ${created.quotationNumber} created and ready for distribution!`);
  };

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(2)} Lakhs`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Commercial Quotations
            </span>
            <span className="text-xs text-slate-500">{filteredQuotes.length} Quotes logged</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Quotation Proposals & Pricing Desk</h1>
          <p className="text-sm text-slate-600">
            Build formal quotes with polymer escalation clauses, margin guardrails, revision tracking, and conversion to ERP Sales Orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('crmInquiryCosting')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            Costing Calculator
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create Quotation
          </button>
        </div>
      </div>

      {/* Main Two-Pane View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Quotation List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search quote or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto">
            {filteredQuotes.map(quote => (
              <div
                key={quote.id}
                onClick={() => setSelectedQuote(quote)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  selectedQuote?.id === quote.id
                    ? 'bg-purple-50/50 border-purple-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900 font-mono">
                    {quote.quotationNumber} (Rev {quote.revisionNumber})
                  </div>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                    quote.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700' :
                    quote.status === 'Submitted' ? 'bg-purple-50 text-purple-700' :
                    quote.status === 'Draft' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {quote.status}
                  </span>
                </div>

                <div className="font-semibold text-xs text-slate-800">{quote.accountName}</div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="font-bold text-teal-800">{formatCurrency(quote.totalAmount)}</span>
                  <span className="text-emerald-700 font-semibold text-[11px]">Margin: {quote.marginPercentage}%</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Valid: {quote.validUntil}</span>
                  <span>Owner: {quote.salesperson.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Selected Quotation Details (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedQuote ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-purple-900">
                      {selectedQuote.quotationNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                      Rev {selectedQuote.revisionNumber}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{selectedQuote.accountName}</div>
                  <div className="text-xs text-slate-500">Date: {selectedQuote.quotationDate} | Valid Until: {selectedQuote.validUntil}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => showToast(`Sent quotation PDF to ${selectedQuote.accountName}`)}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200 flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email PDF
                  </button>
                  <button
                    onClick={() => handleConvertToOrder(selectedQuote)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Convert to Sales Order
                  </button>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase text-slate-500">Quoted Line Items</h3>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="p-2.5">Item & Material</th>
                        <th className="p-2.5 text-right">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedQuote.items.map(item => (
                        <tr key={item.id}>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{item.description}</div>
                            <div className="text-[10px] text-slate-500">{item.polymerGrade}</div>
                          </td>
                          <td className="p-2.5 text-right font-medium">{item.quantity.toLocaleString()} {item.uom}</td>
                          <td className="p-2.5 text-right font-bold text-slate-800">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-bold text-teal-800">₹{(item.lineTotal / 100000).toFixed(2)}L</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedQuote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax (18%):</span>
                  <span>{formatCurrency(selectedQuote.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Quoted Amount:</span>
                  <span className="text-purple-900 font-black">{formatCurrency(selectedQuote.totalAmount)}</span>
                </div>
              </div>

              {/* Special Terms & Polymer Escalation */}
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-2 text-xs">
                <h4 className="font-bold text-purple-900 uppercase text-[11px]">Special Terms & Conditions</h4>
                <ul className="list-disc pl-4 space-y-1 text-purple-800">
                  <li><strong>Payment Terms:</strong> {selectedQuote.paymentTerms}</li>
                  <li><strong>Delivery Terms:</strong> {selectedQuote.deliveryTerms}</li>
                  <li><strong>Polymer Escalation Clause:</strong> Active (Quarterly price adjustment linked to ICIS / Reliance polymer index)</li>
                </ul>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">Sales Lead: <strong>{selectedQuote.salesperson}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedQuote.id, 'Accepted')}
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold border border-emerald-200"
                  >
                    Mark Customer Accepted
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedQuote.id, 'Rejected')}
                    className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-semibold border border-rose-200"
                  >
                    Mark Rejected
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a quotation from the left panel to review line items and approvals.
            </div>
          )}
        </div>
      </div>

      {/* Create Quote Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Create New Quotation Proposal</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Account *</label>
                  <select
                    value={newQuoteForm.accountId}
                    onChange={(e) => {
                      const acc = mockAccounts.find(a => a.id === e.target.value);
                      setNewQuoteForm({ ...newQuoteForm, accountId: e.target.value, accountName: acc?.accountName });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    {mockAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quotation Number</label>
                  <input
                    type="text"
                    value={newQuoteForm.quotationNumber}
                    onChange={(e) => setNewQuoteForm({ ...newQuoteForm, quotationNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subtotal Amount (₹)</label>
                  <input
                    type="number"
                    value={newQuoteForm.subtotal}
                    onChange={(e) => {
                      const sub = Number(e.target.value);
                      const tax = sub * 0.18;
                      setNewQuoteForm({ ...newQuoteForm, subtotal: sub, taxAmount: tax, totalAmount: sub + tax });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    value={newQuoteForm.validUntil}
                    onChange={(e) => setNewQuoteForm({ ...newQuoteForm, validUntil: e.target.value })}
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
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Save & Draft Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
