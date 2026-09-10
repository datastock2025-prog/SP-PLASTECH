import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Truck,
  FileText,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Download,
  Calendar,
  Layers,
  Plus,
  Send,
  Scale,
} from 'lucide-react';
import {
  ExtendedPurchaseOrder,
  GoodsReceiptNote,
  SupplierInvoiceRecord,
} from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';

interface Props {
  poId: string;
  pos: ExtendedPurchaseOrder[];
  grns: GoodsReceiptNote[];
  invoices: SupplierInvoiceRecord[];
  onNavigate: (view: string, param?: any) => void;
  onUpdatePO: (po: ExtendedPurchaseOrder) => void;
  showToast: (msg: string) => void;
}

export const PurchaseOrderDetailView: React.FC<Props> = ({
  poId,
  pos,
  grns,
  invoices,
  onNavigate,
  onUpdatePO,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const po = pos.find((p) => p.id === poId) || pos[0];

  if (!po) {
    return (
      <div className="p-8 text-center bg-white rounded-xl">
        <h2 className="text-lg font-bold">Purchase Order Not Found</h2>
      </div>
    );
  }

  const linkedGrns = grns.filter((g) => g.poNumber === po.poNumber);
  const linkedInvoices = invoices.filter((i) => i.poNumber === po.poNumber);

  const tabs = [
    '1. PO Overview',
    '2. Line Items & Specs',
    '3. Goods Receipts (GRN)',
    '4. Invoices & 3-Way Match',
    '5. PPV & Pricing Breakdown',
    '6. Quality & IQC Protocols',
    '7. Dispatch & Tracking',
    '8. Documents & Attachments',
    '9. Approval Audit Trail',
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('poList')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#14213D] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Purchase Orders
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('poPrint', { id: po.id })}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print PO Document
          </button>

          {po.status === 'sent_to_supplier' && (
            <button
              onClick={() => {
                showToast(`Opening Goods Receipt Note creator for ${po.poNumber}`);
                onNavigate('grnList');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Truck className="w-3.5 h-3.5" /> Record Receipt (GRN)
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xl font-bold text-[#14213D]">{po.poNumber}</span>
              <ProcurementStatusBadge status={po.status} />
              {(po.sourceRfqNumber || (po as any).rfqReference) && (
                <span className="text-[11px] text-slate-500 font-mono">From RFQ: {po.sourceRfqNumber || (po as any).rfqReference}</span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Supplier: <span className="font-bold text-[#14213D]">{po.supplierName}</span> • Plant: <span className="font-medium text-[#14213D]">{po.plantWarehouse || (po as any).plantCode || 'Plant 1'}</span> • Buyer: <span className="font-medium text-[#14213D]">{po.buyer || (po as any).buyerName || 'Procurement Team'}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 self-start md:self-auto">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total PO Value</div>
              <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
                ₹{((po.totalAmount || 0) / 100000).toFixed(2)} Lakhs
              </div>
            </div>
          </div>
        </div>

        {/* 9 Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto mt-6 pt-2 border-t border-slate-100 scrollbar-thin">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg transition ${
                activeTab === idx
                  ? 'bg-[#14213D] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {/* TAB 0: OVERVIEW */}
        {activeTab === 0 && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-500">Order Date</div>
                <div className="text-base font-bold text-[#14213D] mt-1">{po.poDate}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Approved & Released</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-500">Promised Delivery</div>
                <div className="text-base font-bold text-[#14213D] mt-1">{po.expectedDeliveryDate}</div>
                <div className="text-[10px] text-emerald-600 mt-0.5 font-semibold">On Schedule</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-500">Commercial Terms</div>
                <div className="text-base font-bold text-[#14213D] mt-1">{po.paymentTerms}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{po.deliveryTerms || (po as any).incoterms}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-500">Receiving Dock</div>
                <div className="text-base font-bold text-[#14213D] mt-1">{po.plantWarehouse || (po as any).receivingWarehouse}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Dock #3 Polymer Silo</div>
              </div>
            </div>

            {/* Line Items Summary */}
            <div>
              <h3 className="font-bold text-sm text-[#14213D] mb-3">Order Line Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item Code</th>
                      <th className="py-2.5 px-3">Description / Polymer Specs</th>
                      <th className="py-2.5 px-3 text-right">Qty Ordered</th>
                      <th className="py-2.5 px-3 text-right">Qty Received</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {po.lines.map((line, idx) => {
                      const ordQty = line.orderedQty ?? (line as any).quantityOrdered ?? 0;
                      const rcvQty = line.receivedQty ?? (line as any).quantityReceived ?? 0;
                      const lineTot = line.lineTotal ?? (line as any).lineTotalAmount ?? 0;
                      return (
                        <tr key={line.itemCode || idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#14213D]">{line.itemCode}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-[#14213D]">{line.itemName}</div>
                            <div className="text-[10px] text-slate-500">MFI: {(line as any).mfiSpec || 'Standard Grade'}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#14213D]">
                            {ordQty.toLocaleString()} {line.uom}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {rcvQty.toLocaleString()} {line.uom}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-[#14213D]">
                            ₹{line.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#14213D]">
                            ₹{lineTot.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: LINE ITEMS & SPECS */}
        {activeTab === 1 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Polymer Engineering & Chemical Specifications</h3>
            <div className="space-y-3">
              {po.lines.map((line, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#14213D]">{line.itemName} ({line.itemCode})</span>
                    <span className="font-mono text-slate-500">Category: {(line as any).category || 'Raw Material'}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase">MFI Specification</span>
                      <div className="font-bold text-[#14213D]">{(line as any).mfiSpec || '11.5 - 12.5 g/10min'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase">Density</span>
                      <div className="font-bold text-[#14213D]">0.905 g/cm³</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase">Moisture Limit</span>
                      <div className="font-bold text-[#14213D]">&lt; 0.05% Max</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase">GST Applicable</span>
                      <div className="font-bold text-[#14213D]">{line.taxPct ?? (line as any).taxRatePct ?? 18}% (₹{((line.unitPrice * 0.18)).toFixed(2)}/kg)</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: GOODS RECEIPTS (GRN) */}
        {activeTab === 2 && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#14213D]">Linked Goods Receipt Notes (GRN)</h3>
              <button
                onClick={() => onNavigate('grnList')}
                className="text-[#0F8B8D] font-semibold hover:underline"
              >
                + Record New Inward GRN
              </button>
            </div>

            {linkedGrns.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No goods receipts recorded yet for this purchase order.</div>
            ) : (
              linkedGrns.map((grn) => (
                <div key={grn.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#14213D]">{grn.grnNumber}</span>
                      <span className="text-slate-500 text-[11px] ml-2">Date: {grn.receiptDate}</span>
                    </div>
                    <ProcurementStatusBadge status={grn.status} size="sm" />
                  </div>
                  <p className="text-slate-600">
                    Vehicle: <span className="font-mono font-semibold">{grn.vehicleNumber}</span> • Challan Ref: <span className="font-mono">{grn.deliveryChallanNo || (grn as any).deliveryChallanNumber}</span> • QC Pass: <span className="font-bold text-emerald-700">{grn.lines[0]?.acceptedQty ?? (grn.lines[0] as any)?.quantityAccepted ?? 0} {grn.lines[0]?.uom}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: INVOICES & 3-WAY MATCH */}
        {activeTab === 3 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Supplier Invoices & 3-Way Match Verification</h3>
            {linkedInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No invoices submitted yet by supplier.</div>
            ) : (
              linkedInvoices.map((inv) => (
                <div key={inv.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#14213D]">{inv.supplierInvoiceNumber}</span>
                      <span className="text-slate-500 ml-2">Internal: {inv.invoiceNumber}</span>
                    </div>
                    <ProcurementStatusBadge status={inv.matchStatus} size="sm" />
                  </div>
                  <div className="text-slate-600">
                    Invoice Amount: <span className="font-bold text-[#14213D]">₹{(inv.totalInvoiceAmount ?? (inv as any).totalAmount ?? 0).toLocaleString()}</span> • GST: ₹{(inv.taxAmount ?? 0).toLocaleString()} • Match Status: <span className="font-semibold">{inv.matchStatus}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: PPV & PRICING BREAKDOWN */}
        {activeTab === 4 && (
          <div className="space-y-5 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Purchase Price Variance (PPV) & Cost Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-500">Standard Baseline Cost</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">₹80.00 / KG</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-500">PO Contract Price</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">₹78.50 / KG</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-500">Net Favorable PPV Variance</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">-1.87% (₹15,000 Saved)</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: QUALITY & IQC */}
        {activeTab === 5 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Quality Acceptance Requirements</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-semibold">
                ✓ Batch COA Mandatory
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-semibold">
                ✓ FDA Food Grade 21 CFR
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-semibold">
                ✓ IQC Level II Testing
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DISPATCH & TRACKING */}
        {activeTab === 6 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Vehicle & Carrier Dispatch Status</h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Transporter Name</span>
                <span className="font-bold text-[#14213D]">{po.deliveryTracking?.transporterName || 'Direct Logistics'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tracking Status</span>
                <span className="font-semibold text-emerald-700">{po.deliveryTracking?.trackingStatus || 'En Route to Main Plant'}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DOCUMENTS */}
        {activeTab === 7 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">PO Attachments & Technical Sheets</h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#14213D]">{po.poNumber}_Authorized.pdf</div>
                <div className="text-slate-500 text-[11px]">Digitally signed purchase order</div>
              </div>
              <button
                onClick={() => onNavigate('poPrint', { id: po.id })}
                className="px-3 py-1.5 bg-[#14213D] text-white rounded-lg text-xs font-semibold"
              >
                View PDF
              </button>
            </div>
          </div>
        )}

        {/* TAB 8: APPROVAL AUDIT */}
        {activeTab === 8 && (
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Order Authorization & Release Log</h3>
            <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">1. Buyer Verification</span>
                <span className="text-emerald-600 font-bold">Passed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">2. Procurement Head Sign-Off</span>
                <span className="text-emerald-600 font-bold">Approved</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
