import React, { useState } from 'react';
import {
  ArrowLeft,
  FileEdit,
  Save,
  CheckCircle,
  XCircle,
  Send,
  ShoppingBag,
  Download,
  Copy,
  Clock,
  Building,
  ShieldCheck,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  CheckSquare,
  Truck,
  Package,
} from 'lucide-react';
import { SalesQuotation, SalesOrder, Customer } from '../../types';
import { SalesStatusBadge } from './SalesStatusBadge';

interface Props {
  quoteId: string;
  quotes: SalesQuotation[];
  customers: Customer[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateQuote: (q: SalesQuotation) => void;
  onCreateSO?: (so: SalesOrder) => void;
  showToast: (msg: string) => void;
}

export const QuotationDetailView: React.FC<Props> = ({
  quoteId,
  quotes,
  customers,
  onNavigate,
  onUpdateQuote,
  onCreateSO,
  showToast,
}) => {
  const quote = quotes.find((q) => q.id === quoteId) || quotes[0];
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Line Items' | 'Pricing' | 'Terms' | 'Documents' | 'Approvals' | 'Activity'
  >('Overview');

  if (!quote) {
    return (
      <div className="p-12 text-center text-xs">
        <p className="text-[#6B7280]">Quotation not found.</p>
        <button onClick={() => onNavigate('quoteList')} className="btn btn-sm btn-primary mt-3">
          Back to Quotations
        </button>
      </div>
    );
  }

  const customerObj = customers.find((c) => c.name === quote.customer || c.code === quote.customer);

  const getSubtotal = () => quote.lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const getTotalDiscount = () =>
    quote.lines.reduce((sum, l) => sum + l.qty * l.price * ((l.discountPct || 0) / 100), 0);
  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const netAmount = subtotal - totalDiscount;
  const estimatedCost = netAmount * (1 - quote.margin / 100);
  const isMarginWarning = quote.margin < 18;

  const handleApprove = () => {
    const updated: SalesQuotation = {
      ...quote,
      stage: 'approved',
      approval: 'approved',
      history: [
        { event: `Quotation approved by Sales Director`, time: 'Just now' },
        ...quote.history,
      ],
    };
    onUpdateQuote(updated);
    showToast(`Quotation ${quote.id} approved`);
  };

  const handleConvertToSO = () => {
    const updated: SalesQuotation = {
      ...quote,
      stage: 'converted',
      convertedSo: `SO-50${quotes.length + 2}`,
      history: [
        { event: `Converted to Sales Order SO-50${quotes.length + 2}`, time: 'Just now' },
        ...quote.history,
      ],
    };
    onUpdateQuote(updated);

    if (onCreateSO) {
      const newSO: SalesOrder = {
        id: updated.convertedSo!,
        customer: quote.customer,
        customerPO: quote.customerRfq || 'PO-DIRECT-2026',
        priority: quote.priority,
        quoteRef: quote.id,
        orderDate: new Date().toISOString().slice(0, 10),
        deliveryDate: quote.terms?.delivery || '2026-09-15',
        approval: 'approved',
        lines: quote.lines.map((l) => ({
          item: l.item,
          name: l.name,
          qty: l.qty,
          uom: l.uom,
          price: l.price * (1 - (l.discountPct || 0) / 100),
          dispatched: 0,
        })),
        dispatchLogs: [],
        history: [{ event: `Created from Quotation ${quote.id}`, time: 'Just now' }],
      };
      onCreateSO(newSO);
    }
    showToast(`Converted ${quote.id} to Sales Order ${updated.convertedSo}`);
    onNavigate('soList');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('quoteList')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0F8B8D] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast(`Downloaded PDF for ${quote.id}`)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-xs font-semibold text-[#14213D]"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>

          {quote.stage === 'pending' && (
            <>
              <button
                onClick={() => {
                  const updated: SalesQuotation = {
                    ...quote,
                    stage: 'lost',
                    history: [{ event: 'Marked as rejected/lost', time: 'Just now' }, ...quote.history],
                  };
                  onUpdateQuote(updated);
                  showToast('Quotation marked as lost');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>

              <button
                onClick={handleApprove}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve Quote
              </button>
            </>
          )}

          {quote.stage === 'approved' && !quote.convertedSo && (
            <button
              onClick={handleConvertToSO}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#E8622C] hover:bg-[#d45320] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Convert to Sales Order
            </button>
          )}
        </div>
      </div>

      {/* Main Quotation Header Card */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E4E0D6] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-[#0F8B8D]">{quote.id}</span>
              <SalesStatusBadge status={quote.stage} size="sm" />
              <SalesStatusBadge status={quote.approval} size="sm" />
              {isMarginWarning && (
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Margin Below Threshold ({quote.margin}%)
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#14213D] mt-1">{quote.customer}</h1>
            <p className="text-xs text-[#6B7280]">
              RFQ Ref: <b className="text-[#14213D]">{quote.customerRfq || '—'}</b> &middot; Salesperson:{' '}
              <b>{quote.salesperson}</b> &middot; Currency: <b>{quote.currency}</b>
            </p>
          </div>

          <div className="flex items-center gap-6 font-mono text-right">
            <div>
              <div className="text-[10px] uppercase text-[#7C88AC] font-semibold">Net Total</div>
              <div className="text-2xl font-bold text-[#14213D]">₹{netAmount.toLocaleString()}</div>
            </div>
            <div className="border-l border-[#E4E0D6] pl-6">
              <div className="text-[10px] uppercase text-[#7C88AC] font-semibold">Gross Margin</div>
              <div
                className={`text-2xl font-bold ${
                  isMarginWarning ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {quote.margin}%
              </div>
            </div>
          </div>
        </div>

        {/* Quick Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-[#6B7280] block text-[11px]">Quotation Date</span>
            <span className="font-mono font-semibold text-[#14213D]">{quote.date}</span>
          </div>
          <div>
            <span className="text-[#6B7280] block text-[11px]">Valid Until</span>
            <span className="font-mono font-semibold text-[#14213D]">{quote.validUntil}</span>
          </div>
          <div>
            <span className="text-[#6B7280] block text-[11px]">Expected Close Date</span>
            <span className="font-mono font-semibold text-[#14213D]">{quote.expectedClose}</span>
          </div>
          <div>
            <span className="text-[#6B7280] block text-[11px]">Priority Tier</span>
            <span className="font-semibold text-[#14213D] uppercase">{quote.priority}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-[#E4E0D6] bg-white px-3 rounded-t-xl">
        {(
          [
            'Overview',
            'Line Items',
            'Pricing',
            'Terms',
            'Documents',
            'Approvals',
            'Activity',
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === tab
                ? 'border-[#0F8B8D] text-[#0F8B8D]'
                : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Customer Summary Card */}
          <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase text-[#7C88AC] tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0F8B8D]" />
              <span>Customer Account Profile</span>
            </h2>
            <div className="space-y-2 text-xs divide-y divide-[#E4E0D6]">
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Customer Code</span>
                <span className="font-mono font-bold text-[#14213D]">
                  {customerObj?.code || 'CUST-001'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Customer Segment</span>
                <span className="font-semibold text-[#14213D]">
                  {customerObj?.segment || 'Retail & FMCG'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Primary Contact</span>
                <span className="text-[#14213D]">
                  {customerObj?.contact} ({customerObj?.phone})
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Billing Address</span>
                <span className="text-[#14213D] text-right">Plot 14, Electronic City, Bengaluru</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Credit Limit</span>
                <span className="font-mono font-bold text-[#14213D]">
                  ₹{(customerObj?.creditLimit || 2000000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Available Credit</span>
                <span className="font-mono font-bold text-emerald-600">₹14,25,000</span>
              </div>
            </div>
          </div>

          {/* Quotation Summary Card */}
          <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase text-[#7C88AC] tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#E8622C]" />
              <span>Commercial &amp; Margin Summary</span>
            </h2>
            <div className="space-y-2 text-xs divide-y divide-[#E4E0D6]">
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Total Lines &amp; Qty</span>
                <span className="font-mono font-bold text-[#14213D]">
                  {quote.lines.length} line(s) &middot; {quote.lines.reduce((s, l) => s + l.qty, 0).toLocaleString()} PCS
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Gross Subtotal</span>
                <span className="font-mono text-[#14213D]">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Total Line Discounts</span>
                <span className="font-mono text-rose-600">-₹{totalDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Estimated Manufacturing Cost</span>
                <span className="font-mono text-[#6B7280]">₹{estimatedCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 font-bold text-sm bg-[#F6F4EF] p-2 rounded-lg">
                <span className="text-[#14213D]">Grand Net Total</span>
                <span className="font-mono text-[#0F8B8D]">₹{netAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Line Items with Plastic Specifics */}
      {activeTab === 'Line Items' && (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0F8B8D]" />
              <span>Quotation Line Items &middot; Polymer &amp; Quality Specifications</span>
            </h2>
            <button
              onClick={() => showToast('Add item modal')}
              className="px-3 py-1 rounded bg-[#0F8B8D] text-white text-xs font-semibold"
            >
              + Add Polymer Line
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold text-[11px]">
                  <th className="p-3">Line #</th>
                  <th className="p-3">Item / Part Code</th>
                  <th className="p-3">Customer Item Code</th>
                  <th className="p-3">Polymer Grade &amp; Resin</th>
                  <th className="p-3">Color / Additive</th>
                  <th className="p-3 text-right">Qty &amp; UOM</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Disc %</th>
                  <th className="p-3 text-right">Net Price</th>
                  <th className="p-3 text-right">Total (₹)</th>
                  <th className="p-3 text-center">COA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {quote.lines.map((l, idx) => {
                  const netUnitPrice = l.price * (1 - (l.discountPct || 0) / 100);
                  const lineTotal = l.qty * netUnitPrice;

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-[#6B7280]">#{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-[#14213D]">{l.name}</div>
                        <div className="text-[10px] font-mono text-[#0F8B8D]">{l.item}</div>
                      </td>
                      <td className="p-3 font-mono text-[#14213D]">
                        {l.customerItemCode || 'CUST-STD'}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-[#14213D]">{l.resinType || 'HDPE'}</div>
                        <div className="text-[10px] text-[#6B7280]">{l.grade || 'Standard'}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {l.color || 'Natural'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                        {l.qty.toLocaleString()} {l.uom}
                      </td>
                      <td className="p-3 text-right font-mono text-[#6B7280]">₹{l.price.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-rose-600">
                        {l.discountPct ? `${l.discountPct}%` : '0%'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                        ₹{netUnitPrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#0F8B8D]">
                        ₹{lineTotal.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        {l.coaRequired ? (
                          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono text-[10px]">
                            Required
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Pricing */}
      {activeTab === 'Pricing' && (
        <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#0F8B8D]" />
            <span>Pricing Source &amp; Margin Rules Matrix</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] space-y-2">
              <span className="text-[11px] font-bold text-[#7C88AC] uppercase">Price Source</span>
              <div className="text-sm font-bold text-[#14213D]">Tier 1 Preferred Price List</div>
              <p className="text-[11px] text-[#6B7280]">Standard catalog pricing with volume bracket override.</p>
            </div>

            <div className="p-3.5 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] space-y-2">
              <span className="text-[11px] font-bold text-[#7C88AC] uppercase">Packaging &amp; Freight</span>
              <div className="text-sm font-bold text-[#14213D]">Palletized &middot; Freight Excluded</div>
              <p className="text-[11px] text-[#6B7280]">Ex-Works Hosur; Buyer arranges road logistics.</p>
            </div>

            <div className="p-3.5 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] space-y-2">
              <span className="text-[11px] font-bold text-[#7C88AC] uppercase">Target Margin Floor</span>
              <div className="text-sm font-bold text-[#14213D]">18.0% Minimum Floor</div>
              <p className="text-[11px] text-[#6B7280]">Current quote margin: <b>{quote.margin}%</b></p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Terms */}
      {activeTab === 'Terms' && (
        <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
            <span>Commercial, Payment &amp; Incoterms</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#F6F4EF] border border-[#E4E0D6] space-y-2">
              <div className="font-bold text-[#14213D]">Payment Terms</div>
              <p className="text-[#6B7280]">{quote.terms?.payment || 'Net 30 Days'}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F6F4EF] border border-[#E4E0D6] space-y-2">
              <div className="font-bold text-[#14213D]">Incoterms 2020</div>
              <p className="text-[#6B7280]">{quote.terms?.incoterm || 'EXW Hosur Plant 01'}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F6F4EF] border border-[#E4E0D6] space-y-2">
              <div className="font-bold text-[#14213D]">Shipping Method</div>
              <p className="text-[#6B7280]">{quote.terms?.shipping || 'Road freight container'}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F6F4EF] border border-[#E4E0D6] space-y-2">
              <div className="font-bold text-[#14213D]">Delivery Lead Time</div>
              <p className="text-[#6B7280]">{quote.terms?.delivery || 'Within 14 days'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Documents */}
      {activeTab === 'Documents' && (
        <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0F8B8D]" />
            <span>Attached Technical Drawings &amp; Compliance Documents</span>
          </h2>
          <div className="divide-y divide-[#E4E0D6]">
            {[
              { name: 'Customer_RFQ_Spec_Sheet.pdf', size: '1.2 MB', type: 'Customer RFQ', date: quote.date },
              { name: 'HDPE_500ml_Mold_Drawing_RevB.dwg', size: '4.8 MB', type: 'Product Drawing', date: quote.date },
              { name: 'Resin_B56003_COA_Sample_Cert.pdf', size: '420 KB', type: 'COA Cert', date: quote.date },
            ].map((doc, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#0F8B8D]" />
                  <div>
                    <span className="font-bold text-[#14213D] block">{doc.name}</span>
                    <span className="text-[10px] text-[#6B7280]">
                      {doc.type} &middot; {doc.size} &middot; {doc.date}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => showToast(`Opening ${doc.name}`)}
                  className="px-2.5 py-1 rounded bg-[#F6F4EF] hover:bg-[#E4E0D6] text-[11px] font-semibold"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Approvals */}
      {activeTab === 'Approvals' && (
        <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#0F8B8D]" />
            <span>Governance &amp; Multi-Level Approval Timeline</span>
          </h2>

          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-900 block">Sales Director Approval</span>
                <span className="text-[11px] text-emerald-700">Priya Rao &middot; Commercial Clearance</span>
              </div>
              <span className="badge green">Approved</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-[#14213D] block">Finance Margin Override Gate</span>
                <span className="text-[11px] text-[#6B7280]">Triggered when margin &lt; 18.0%</span>
              </div>
              <span className="badge teal">Passed (Auto)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Activity Log */}
      {activeTab === 'Activity' && (
        <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0F8B8D]" />
            <span>Quotation History &amp; Audit Trail</span>
          </h2>
          <div className="space-y-3">
            {quote.history.map((h, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#0F8B8D] mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-[#14213D]">{h.event}</div>
                  <div className="text-[10px] text-[#6B7280] font-mono">{h.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
