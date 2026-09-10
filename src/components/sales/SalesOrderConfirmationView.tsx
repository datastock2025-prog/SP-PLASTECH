import React from 'react';
import {
  ArrowLeft,
  Printer,
  Download,
  Send,
  CheckCircle,
  FileText,
  Building,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { SalesOrder } from '../../types';

interface Props {
  soId: string;
  sos: SalesOrder[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const SalesOrderConfirmationView: React.FC<Props> = ({
  soId,
  sos,
  onNavigate,
  showToast,
}) => {
  const so = sos.find((s) => s.id === soId) || sos[0];

  if (!so) {
    return (
      <div className="p-12 text-center text-xs">
        <p className="text-[#6B7280]">Sales order not found.</p>
        <button onClick={() => onNavigate('soList')} className="btn btn-sm btn-primary mt-3">
          Back to Sales Orders
        </button>
      </div>
    );
  }

  const subtotal = so.lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const tax = subtotal * 0.18;
  const grandTotal = subtotal + tax;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-16 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => onNavigate('soDetail', { id: so.id })}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0F8B8D] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order {so.id}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast(`Emailed Sales Order Confirmation for ${so.id} to customer`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-xs font-semibold text-[#14213D]"
          >
            <Send className="w-3.5 h-3.5 text-[#0F8B8D]" /> Email to Customer
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#14213D] hover:bg-[#1C2B4D] text-white text-xs font-bold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Formal Printable Document Card */}
      <div className="bg-white p-8 rounded-xl border border-[#E4E0D6] shadow-md space-y-6 text-[#14213D]">
        {/* Header with Reboot ERP branding */}
        <div className="flex justify-between items-start border-b-2 border-[#14213D] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-['Space_Grotesk'] tracking-tight text-[#14213D]">
                REBOOT <span className="text-[#0F8B8D]">POLYMER OPS</span>
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Plot 48, Phase II, SIPCOT Industrial Complex, Hosur, Tamil Nadu 635126
            </p>
            <p className="text-xs text-[#6B7280]">
              GSTIN: <b>33AAACR9928K1ZB</b> &middot; ISO 9001:2015 &amp; IATF 16949 Certified
            </p>
          </div>

          <div className="text-right">
            <h1 className="text-xl font-bold uppercase tracking-wider text-[#14213D]">
              Sales Order Confirmation
            </h1>
            <div className="font-mono text-base font-bold text-[#0F8B8D] mt-1">{so.id}</div>
            <div className="text-xs text-[#6B7280] mt-0.5">Date: {so.orderDate}</div>
          </div>
        </div>

        {/* Sold-To and Ship-To Parties */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-lg bg-[#F6F4EF] border border-[#E4E0D6] space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#7C88AC]">Sold-To Party / Buyer</span>
            <div className="font-bold text-sm text-[#14213D]">{so.customer}</div>
            <p className="text-[#6B7280]">Plot 14, Electronic City, Bengaluru, Karnataka 560100</p>
            <p className="text-[#6B7280]">GSTIN: 29AABCB1234M1Z2 &middot; Attn: Purchase Dept</p>
          </div>

          <div className="p-4 rounded-lg bg-[#F6F4EF] border border-[#E4E0D6] space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#7C88AC]">Ship-To Delivery Address</span>
            <div className="font-bold text-sm text-[#14213D]">{so.customer} &middot; Plant 02</div>
            <p className="text-[#6B7280]">Warehouse Bay 4, Industrial Area, Bommasandra, Bangalore</p>
            <p className="text-[#6B7280]">Target Date: <b>{so.deliveryDate}</b></p>
          </div>
        </div>

        {/* Commercial Grid */}
        <div className="grid grid-cols-4 gap-3 text-xs bg-[#F6F4EF] p-3 rounded-lg border border-[#E4E0D6]">
          <div>
            <span className="text-[10px] text-[#6B7280] block">Customer PO Ref</span>
            <span className="font-mono font-bold text-[#14213D]">{so.customerPO || 'DIRECT'}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#6B7280] block">Payment Terms</span>
            <span className="font-semibold text-[#14213D]">Net 30 Days</span>
          </div>
          <div>
            <span className="text-[10px] text-[#6B7280] block">Incoterms 2020</span>
            <span className="font-semibold text-[#14213D]">EXW Hosur Plant</span>
          </div>
          <div>
            <span className="text-[10px] text-[#6B7280] block">Currency</span>
            <span className="font-mono font-bold text-[#14213D]">INR (₹)</span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-[#E4E0D6] rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#14213D] text-white font-semibold text-[11px]">
                <th className="p-3">#</th>
                <th className="p-3">Part # &amp; Polymer Description</th>
                <th className="p-3 text-center">Quality / COA</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-right">Unit Price (₹)</th>
                <th className="p-3 text-right">Line Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {so.lines.map((l, idx) => (
                <tr key={idx}>
                  <td className="p-3 font-mono text-[#6B7280]">{idx + 1}</td>
                  <td className="p-3">
                    <div className="font-bold text-[#14213D]">{l.name}</div>
                    <div className="text-[10px] font-mono text-[#6B7280]">{l.item}</div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono text-[10px]">
                      COA Guaranteed
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                    {l.qty.toLocaleString()} {l.uom}
                  </td>
                  <td className="p-3 text-right font-mono text-[#6B7280]">₹{l.price.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                    ₹{(l.qty * l.price).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end text-xs">
          <div className="w-64 space-y-1.5 font-mono">
            <div className="flex justify-between text-[#6B7280]">
              <span>Taxable Subtotal:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#6B7280]">
              <span>GST @ 18%:</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#14213D] border-t border-[#E4E0D6] pt-1.5">
              <span>Grand Total:</span>
              <span className="text-[#0F8B8D]">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Terms & Authorization Signature */}
        <div className="border-t border-[#E4E0D6] pt-5 grid grid-cols-2 gap-8 text-[11px] text-[#6B7280]">
          <div>
            <h3 className="font-bold text-[#14213D] mb-1">Standard B2B Terms &amp; Conditions</h3>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Goods once sold will not be returned unless covered under authorized RMA.</li>
              <li>Subject to Hosur / Bengaluru jurisdiction.</li>
              <li>COA test certificates accompany all physical dispatches.</li>
            </ul>
          </div>

          <div className="text-right flex flex-col justify-end">
            <div className="font-bold text-[#14213D]">For REBOOT POLYMER OPS (PVT LTD)</div>
            <div className="h-10" />
            <div className="border-t border-[#14213D] inline-block pt-1 font-semibold text-[#14213D]">
              Authorized Commercial Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
