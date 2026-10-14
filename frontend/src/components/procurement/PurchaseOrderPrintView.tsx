import React from 'react';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { ExtendedPurchaseOrder } from '../../types/procurement';

interface Props {
  poId: string;
  pos: ExtendedPurchaseOrder[];
  onNavigate: (view: string, param?: any) => void;
}

export const PurchaseOrderPrintView: React.FC<Props> = ({
  poId,
  pos,
  onNavigate,
}) => {
  const po = pos.find((p) => p.id === poId) || pos[0];

  if (!po) {
    return <div>PO Not Found</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Controls (Hidden during print) */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => onNavigate('poDetail', { id: po.id })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#14213D] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to PO Details
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Printable PO Sheet */}
      <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 text-slate-800 text-xs">
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b-2 border-[#14213D] pb-6">
          <div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
              REBOOT INJECTION MOLDING CORP
            </div>
            <p className="text-slate-500 text-[11px] mt-1">
              Plot 42-45, GIDC Industrial Estate, Phase II, Vapi, Gujarat - 396195<br />
              GSTIN: <span className="font-mono font-semibold">24AAACR1234K1ZG</span> • CIN: U25200GJ2018PTC104523<br />
              Email: purchase@rebootpolymers.com • Phone: +91 260 2439000
            </p>
          </div>

          <div className="text-right">
            <div className="px-3 py-1 bg-[#14213D] text-white text-sm font-bold font-['Space_Grotesk'] rounded">
              PURCHASE ORDER
            </div>
            <div className="font-mono font-bold text-base text-[#14213D] mt-2">{po.poNumber}</div>
            <div className="text-slate-500 text-[11px]">Date: {po.poDate}</div>
          </div>
        </div>

        {/* Vendor & Delivery Addresses */}
        <div className="grid grid-cols-2 gap-8 my-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Vendor / Supplier</div>
            <div className="font-bold text-sm text-[#14213D]">{po.supplierName}</div>
            <div className="text-slate-600 mt-1">
              Supplier Code: <span className="font-mono font-semibold">{po.supplierCode}</span><br />
              GSTIN: <span className="font-mono font-semibold">{po.supplierGstin || '27AAACR1982K1Z5'}</span><br />
              Payment Terms: <span className="font-semibold">{po.paymentTerms}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Delivery / Ship-To Location</div>
            <div className="font-bold text-sm text-[#14213D]">Reboot Polymers Plant #1</div>
            <div className="text-slate-600 mt-1">
              Receiving Warehouse: <span className="font-semibold">{po.receivingWarehouse}</span><br />
              Promised Delivery Date: <span className="font-semibold text-emerald-700">{po.expectedDeliveryDate}</span><br />
              Incoterms: <span className="font-semibold">{po.incoterms}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden my-6">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Material Description & Grade</th>
                <th className="py-2.5 px-3">Item Code</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">GST %</th>
                <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {po.lines.map((line, idx) => {
                const qty = line.orderedQty ?? (line as any).quantityOrdered ?? 0;
                const lineTot = line.lineTotal ?? (line as any).lineTotalAmount ?? 0;
                const taxPct = line.taxPct ?? (line as any).taxRatePct ?? 18;
                return (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#14213D]">{line.itemName}</div>
                      <div className="text-[10px] text-slate-500">MFI Spec: {(line as any).mfiSpec || '12 g/10min'} • Injection Grade</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold">{line.itemCode}</td>
                    <td className="py-2.5 px-3 text-right font-bold">{qty.toLocaleString()} {line.uom}</td>
                    <td className="py-2.5 px-3 text-right">₹{line.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">{taxPct}%</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#14213D]">
                      ₹{lineTot.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Calculations */}
        <div className="flex justify-end my-6">
          <div className="w-72 space-y-1.5 border-t border-slate-200 pt-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-[#14213D]">₹{(po.totalSubtotal ?? (po as any).subtotal ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18% IGST/CGST+SGST):</span>
              <span className="font-semibold text-[#14213D]">₹{(po.totalTax ?? (po as any).taxAmount ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Freight Charges:</span>
              <span className="font-semibold text-[#14213D]">₹{(po.freightAmount ?? (po as any).freightCharges ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#14213D] border-t border-slate-300 pt-2">
              <span>Grand Total:</span>
              <span className="text-[#0F8B8D] font-['Space_Grotesk']">
                ₹{(po.totalAmount ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Quality Clauses */}
        <div className="border-t border-slate-200 pt-4 space-y-2 text-[11px] text-slate-600">
          <div className="font-bold text-[#14213D]">Terms & Commercial Conditions:</div>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Raw material must strictly conform to technical specifications and melt flow index (MFI) tolerances mentioned above.</li>
            <li>Manufacturer batch Certificate of Analysis (COA) and MSDS must accompany each vehicle consignment.</li>
            <li>Packaging must be in intact 25 KG multi-layer moisture barrier bags on shrink-wrapped wooden pallets.</li>
            <li>Invoices without valid E-Way bill and Delivery Challan reference will not be cleared for 3-way matching.</li>
          </ol>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-slate-200">
          <div>
            <div className="h-12 border-b border-dashed border-slate-300"></div>
            <div className="font-bold text-slate-700 mt-1">Prepared by: Senior Buyer</div>
            <div className="text-[10px] text-slate-400">Reboot Procurement Division</div>
          </div>
          <div className="text-right">
            <div className="h-12 border-b border-dashed border-slate-300"></div>
            <div className="font-bold text-slate-700 mt-1">Authorized Signatory</div>
            <div className="text-[10px] text-slate-400">Vice President - Supply Chain</div>
          </div>
        </div>
      </div>
    </div>
  );
};
