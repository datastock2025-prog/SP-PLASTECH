import React, { useState } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  DollarSign,
  Layers,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Building,
  AlertTriangle,
  Download,
  Printer,
  Sparkles,
  Search,
  Package,
  Wrench,
} from 'lucide-react';
import { SalesOrder, Customer } from '../../types';
import { SalesStatusBadge } from './SalesStatusBadge';

interface Props {
  soId: string;
  sos: SalesOrder[];
  customers: Customer[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateSO: (so: SalesOrder) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const SalesOrderDetailView: React.FC<Props> = ({
  soId,
  sos,
  customers,
  onNavigate,
  onUpdateSO,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const so = sos.find((s) => s.id === soId) || sos[0];
  const [activeTab, setActiveTab] = useState<
    | 'Overview'
    | 'Line Items'
    | 'Production & Stock'
    | 'Delivery & Shipping'
    | 'Billing & Invoices'
    | 'Credit & Terms'
    | 'Documents'
    | 'Activity'
  >('Overview');

  if (!so) {
    return (
      <div className="p-12 text-center text-xs">
        <p className="text-[#6B7280]">Sales Order not found.</p>
        <button onClick={() => onNavigate('soList')} className="btn btn-sm btn-primary mt-3">
          Back to Sales Orders
        </button>
      </div>
    );
  }

  const customerObj = customers.find((c) => c.name === so.customer || c.code === so.customer);
  const totalAmount = so.lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const totalQty = so.lines.reduce((sum, l) => sum + l.qty, 0);
  const totalDispatched = so.lines.reduce((sum, l) => sum + (l.dispatched || 0), 0);
  const progressPct = totalQty > 0 ? Math.round((totalDispatched / totalQty) * 100) : 0;

  const handleCreateDeliveryDrawer = () => {
    let dispatchQty = totalQty - totalDispatched;
    let vehicle = 'KA-51-MM-8841';
    let driver = 'Ramesh Kumar (9884019234)';
    let carrier = 'VRL Logistics Logistics Express';
    let lr = `LR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    openDrawer(
      `Create Delivery / Outward Gate Pass for ${so.id}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 font-medium">
          Outward Dispatch Note &middot; Polymer LOT &amp; COA Test Binding
        </div>

        <div className="field">
          <label className="font-bold text-[#14213D]">Customer / Consignee</label>
          <div className="p-2 bg-[#F6F4EF] rounded border border-[#E4E0D6] font-semibold">
            {so.customer}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label className="font-bold text-[#14213D]">Dispatched Quantity (PCS)</label>
            <input
              type="number"
              defaultValue={dispatchQty}
              onChange={(e) => (dispatchQty = parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
          <div className="field">
            <label className="font-bold text-[#14213D]">Vehicle / Truck Number</label>
            <input
              type="text"
              defaultValue={vehicle}
              onChange={(e) => (vehicle = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label className="font-bold text-[#14213D]">Logistics Carrier</label>
            <input
              type="text"
              defaultValue={carrier}
              onChange={(e) => (carrier = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
            />
          </div>
          <div className="field">
            <label className="font-bold text-[#14213D]">Lorry Receipt (LR) #</label>
            <input
              type="text"
              defaultValue={lr}
              onChange={(e) => (lr = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Automated Quality COA Certificate attached to shipment documents.</span>
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button className="btn btn-sm btn-ghost" onClick={closeDrawer}>
          Cancel
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            const newLog = {
              date: new Date().toISOString().slice(0, 10),
              qty: dispatchQty,
              dc: `DC-${Math.floor(8000 + Math.random() * 1000)}`,
              invoice: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
              transporter: `${carrier} (${vehicle})`,
              eWay: `EWAY-9948201`,
              status: 'Delivered',
            };

            const updatedLines = so.lines.map((l) => ({
              ...l,
              dispatched: Math.min(l.qty, (l.dispatched || 0) + dispatchQty),
            }));

            const updatedSO: SalesOrder = {
              ...so,
              lines: updatedLines,
              dispatchLogs: [newLog, ...(so.dispatchLogs || [])],
              history: [
                {
                  event: `Dispatched ${dispatchQty.toLocaleString()} units via ${newLog.dc}`,
                  time: 'Just now',
                },
                ...so.history,
              ],
            };

            onUpdateSO(updatedSO);
            closeDrawer();
            showToast(`Delivery Note ${newLog.dc} generated for ${so.id}`);
          }}
        >
          Generate Delivery Note &amp; COA
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('soList')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0F8B8D] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sales Orders
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('soConfirm', { id: so.id })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-xs font-semibold text-[#14213D]"
          >
            <FileText className="w-3.5 h-3.5 text-[#0F8B8D]" /> Order Confirmation PDF
          </button>

          {so.approval !== 'rejected' && (
            <button
              onClick={handleCreateDeliveryDrawer}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0d7a7c] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Truck className="w-3.5 h-3.5" /> + Create Delivery Note
            </button>
          )}
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E4E0D6] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-[#E8622C]">{so.id}</span>
              <SalesStatusBadge
                status={so.approval === 'rejected' ? 'credit_blocked' : so.approval}
                size="sm"
              />
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold uppercase">
                Priority: {so.priority}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#14213D] mt-1">{so.customer}</h1>
            <p className="text-xs text-[#6B7280]">
              Customer PO: <b className="text-[#14213D]">{so.customerPO || '—'}</b> &middot; Quote Ref:{' '}
              <b>{so.quoteRef || 'Direct'}</b> &middot; Plant: <b>Hosur Plant 01</b>
            </p>
          </div>

          <div className="flex items-center gap-6 font-mono text-right">
            <div>
              <div className="text-[10px] uppercase text-[#7C88AC] font-semibold">Total Order Value</div>
              <div className="text-2xl font-bold text-[#14213D]">₹{totalAmount.toLocaleString()}</div>
            </div>
            <div className="border-l border-[#E4E0D6] pl-6">
              <div className="text-[10px] uppercase text-[#7C88AC] font-semibold">Fulfillment</div>
              <div className="text-2xl font-bold text-[#0F8B8D]">{progressPct}%</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-[#6B7280]">
            <span>
              Dispatched: <b>{totalDispatched.toLocaleString()} PCS</b> / {totalQty.toLocaleString()} PCS
            </span>
            <span>{totalQty - totalDispatched} PCS remaining</span>
          </div>
          <div className="h-2.5 w-full bg-[#F6F4EF] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0F8B8D] to-[#25a5a7] rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E4E0D6] bg-white px-3 rounded-t-xl overflow-x-auto">
        {(
          [
            'Overview',
            'Line Items',
            'Production & Stock',
            'Delivery & Shipping',
            'Billing & Invoices',
            'Credit & Terms',
            'Documents',
            'Activity',
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'border-[#0F8B8D] text-[#0F8B8D]'
                : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase text-[#7C88AC] tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0F8B8D]" />
              <span>Customer &amp; Shipping Account</span>
            </h2>
            <div className="space-y-2 text-xs divide-y divide-[#E4E0D6]">
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Customer Name</span>
                <span className="font-bold text-[#14213D]">{so.customer}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Customer PO Number</span>
                <span className="font-mono font-bold text-[#14213D]">{so.customerPO || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Order Placed Date</span>
                <span className="font-mono text-[#14213D]">{so.orderDate}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Committed Delivery Date</span>
                <span className="font-mono font-bold text-emerald-600">{so.deliveryDate}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase text-[#7C88AC] tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#E8622C]" />
              <span>Manufacturing &amp; Work Order Linkages</span>
            </h2>
            <div className="space-y-2 text-xs divide-y divide-[#E4E0D6]">
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Production Work Order</span>
                <span className="font-mono font-bold text-[#0F8B8D]">WO-7740 (Active)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Target Machine Line</span>
                <span className="font-semibold text-[#14213D]">IMM-150T (Battenfeld)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Raw Material Batch Staged</span>
                <span className="font-mono text-[#14213D]">HDPE-LOT-B56003 (250 KG)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280]">Quality Pre-Inspection</span>
                <span className="badge green">Passed First Piece</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Line Items Tab */}
      {activeTab === 'Line Items' && (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0F8B8D]" />
            <span>Sales Order Product Lines</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold text-[11px]">
                  <th className="p-3">Item Part #</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-right">Ordered Qty</th>
                  <th className="p-3 text-right">Unit Price (₹)</th>
                  <th className="p-3 text-right">Total (₹)</th>
                  <th className="p-3 text-right">Dispatched</th>
                  <th className="p-3 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {so.lines.map((l, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-[#0F8B8D]">{l.item}</td>
                    <td className="p-3 font-medium text-[#14213D]">{l.name}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                      {l.qty.toLocaleString()} {l.uom}
                    </td>
                    <td className="p-3 text-right font-mono text-[#6B7280]">₹{l.price.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                      ₹{(l.qty * l.price).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-600 font-bold">
                      {(l.dispatched || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-[#E8622C] font-bold">
                      {(l.qty - (l.dispatched || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delivery & Shipping Tab */}
      {activeTab === 'Delivery & Shipping' && (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#0F8B8D]" />
              <span>Outward Dispatches, Delivery Challans &amp; Transporter Logs</span>
            </h2>
            <button
              onClick={handleCreateDeliveryDrawer}
              className="px-3 py-1 rounded bg-[#0F8B8D] text-white text-xs font-semibold"
            >
              + Create Delivery Note
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold text-[11px]">
                  <th className="p-3">Challan / DC #</th>
                  <th className="p-3">Dispatch Date</th>
                  <th className="p-3 text-right">Dispatched Qty</th>
                  <th className="p-3">Transporter &amp; Vehicle</th>
                  <th className="p-3">Invoice Ref</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {(so.dispatchLogs || []).length > 0 ? (
                  so.dispatchLogs!.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-[#0F8B8D]">{log.dc}</td>
                      <td className="p-3 font-mono text-[#6B7280]">{log.date}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                        {log.qty.toLocaleString()} PCS
                      </td>
                      <td className="p-3 text-[#14213D]">{log.transporter}</td>
                      <td className="p-3 font-mono text-[#6B7280]">{log.invoice || 'Pending'}</td>
                      <td className="p-3 text-center">
                        <span className="badge green">{log.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#9CA3AF]">
                      No outward dispatches recorded yet for this sales order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credit & Terms Tab */}
      {activeTab === 'Credit & Terms' && (
        <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
            <span>Credit Check &amp; Risk Parameters</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] space-y-1">
              <span className="text-[10px] text-[#7C88AC] uppercase font-bold">Credit Status</span>
              <div className="text-sm font-bold text-[#14213D]">
                {so.approval === 'rejected' ? 'Credit Blocked' : 'Credit Approved'}
              </div>
            </div>
            <div className="p-3.5 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] space-y-1">
              <span className="text-[10px] text-[#7C88AC] uppercase font-bold">Total Customer Limit</span>
              <div className="text-sm font-bold text-[#14213D]">₹20,00,000</div>
            </div>
            <div className="p-3.5 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6] space-y-1">
              <span className="text-[10px] text-[#7C88AC] uppercase font-bold">Available Credit</span>
              <div className="text-sm font-bold text-emerald-600">₹14,25,000</div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'Activity' && (
        <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0F8B8D]" />
            <span>Sales Order Timeline &amp; Event Logs</span>
          </h2>
          <div className="space-y-3">
            {so.history.map((h, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#E8622C] mt-1.5 shrink-0" />
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
