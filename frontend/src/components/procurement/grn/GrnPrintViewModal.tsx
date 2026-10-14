import React, { useState } from 'react';
import {
  X,
  Printer,
  QrCode,
  Barcode,
  Building,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { GoodsReceiptNoteExt } from '../../../types/grnTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grn: GoodsReceiptNoteExt | null;
  showToast: (msg: string) => void;
}

export const GrnPrintViewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  grn,
  showToast,
}) => {
  const [printMode, setPrintMode] = useState<'voucher' | 'label' | 'checklist'>('voucher');

  if (!isOpen || !grn) return null;

  const handlePrint = () => {
    window.print();
    showToast(`Sent ${printMode.toUpperCase()} to thermal/office printer.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95">
        {/* Header with Mode Toggle */}
        <div className="px-6 py-4 bg-[#14213D] text-white flex items-center justify-between border-b border-slate-700 print:hidden">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-teal-300" />
            <div>
              <h3 className="font-bold text-base font-['Space_Grotesk']">
                Print Official Documents & Thermal Labels
              </h3>
              <p className="text-xs text-slate-300">
                {grn.grnNumber} • PO: {grn.poNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 p-1 rounded-xl text-xs">
              <button
                onClick={() => setPrintMode('voucher')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  printMode === 'voucher' ? 'bg-white text-[#14213D]' : 'text-slate-300 hover:text-white'
                }`}
              >
                GRN Voucher
              </button>
              <button
                onClick={() => setPrintMode('label')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  printMode === 'label' ? 'bg-white text-[#14213D]' : 'text-slate-300 hover:text-white'
                }`}
              >
                4x6" Pallet Labels
              </button>
              <button
                onClick={() => setPrintMode('checklist')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  printMode === 'checklist' ? 'bg-white text-[#14213D]' : 'text-slate-300 hover:text-white'
                }`}
              >
                Putaway Slip
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Preview Canvas */}
        <div className="p-8 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
          {/* VOUCHER FORMAT */}
          {printMode === 'voucher' && (
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-300 w-full max-w-3xl text-slate-900 text-xs space-y-6 print:shadow-none print:border-none print:p-0">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black font-['Space_Grotesk'] text-[#14213D] uppercase tracking-wider">
                    Apex Polymer Manufacturing Ltd.
                  </h1>
                  <p className="text-[11px] text-slate-600">
                    Plot 48, GIDC Industrial Estate, Vapi, Gujarat 396195 | GSTIN: 24AAACA0000A1Z5
                  </p>
                  <h2 className="text-sm font-bold mt-2 text-[#0F8B8D] uppercase tracking-wide">
                    Goods Receipt Note (GRN)
                  </h2>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-mono text-sm font-bold text-slate-900">{grn.grnNumber}</div>
                  <div className="text-[11px] text-slate-600">Date: {grn.receiptDate}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Gate Entry: {grn.gateEntryNumber}</div>
                </div>
              </div>

              {/* Vendor & Delivery Grid */}
              <div className="grid grid-cols-2 gap-4 border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Supplier Information</div>
                  <div className="font-bold text-sm text-slate-900">{grn.supplierName}</div>
                  <div className="text-[11px] text-slate-600 font-mono">GSTIN: {grn.supplierGstin}</div>
                  <div className="text-[11px] text-slate-600">PO Number: <strong className="font-mono text-blue-800">{grn.poNumber}</strong></div>
                  <div className="text-[11px] text-slate-600">Supplier Inv: {grn.supplierInvoiceNo} ({grn.supplierInvoiceDate})</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Gate Logistics & Weighbridge</div>
                  <div className="text-[11px] text-slate-700">Challan No: <strong>{grn.deliveryChallanNo}</strong></div>
                  <div className="text-[11px] text-slate-700">Vehicle / Truck: <strong className="font-mono">{grn.vehicleNumber}</strong></div>
                  <div className="text-[11px] text-slate-700">Transporter: {grn.transporterName}</div>
                  <div className="text-[11px] text-slate-700">Driver: {grn.driverName}</div>
                  <div className="text-[11px] text-slate-700">Dock & Store: {grn.receivingDock} ({grn.warehouse})</div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2 border-r">Line #</th>
                    <th className="py-2 px-3 border-r">Item Code & Name</th>
                    <th className="py-2 px-2 border-r text-center">UOM</th>
                    <th className="py-2 px-2 border-r text-right">PO Qty</th>
                    <th className="py-2 px-2 border-r text-right">Recv Qty</th>
                    <th className="py-2 px-2 border-r text-right">Accepted</th>
                    <th className="py-2 px-2 border-r text-right">Rejected</th>
                    <th className="py-2 px-3">Batch / Lot #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {grn.lines.map((l, i) => (
                    <tr key={i}>
                      <td className="py-2 px-2 border-r font-mono text-center">{l.poLineNo}</td>
                      <td className="py-2 px-3 border-r">
                        <div className="font-bold">{l.itemName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{l.itemCode}</div>
                      </td>
                      <td className="py-2 px-2 border-r text-center font-bold">{l.uom}</td>
                      <td className="py-2 px-2 border-r text-right">{l.orderedQty.toLocaleString()}</td>
                      <td className="py-2 px-2 border-r text-right font-bold">{l.currentReceivedQty.toLocaleString()}</td>
                      <td className="py-2 px-2 border-r text-right font-bold text-emerald-700">{l.acceptedQty.toLocaleString()}</td>
                      <td className="py-2 px-2 border-r text-right font-bold text-rose-700">{l.rejectedQty.toLocaleString()}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{l.lotBatchNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-12 text-center text-[11px] text-slate-600">
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-bold text-slate-800">{grn.receivedBy}</div>
                  <div>Store / Dock Receiver</div>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-bold text-slate-800">Dr. Anita Mehta</div>
                  <div>Quality Assurance Manager</div>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-bold text-slate-800">Security Gate Officer</div>
                  <div>Authorized Security Inward</div>
                </div>
              </div>
            </div>
          )}

          {/* THERMAL 4x6 PALLET LABEL FORMAT */}
          {printMode === 'label' && (
            <div className="bg-white p-6 rounded-xl shadow-md border-2 border-slate-900 w-96 text-slate-900 text-xs space-y-3 font-mono">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2">
                <span className="font-bold text-sm tracking-wider">APEX POLYMER INWARD</span>
                <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold">RAW MATERIAL</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block">ITEM DESCRIPTION</span>
                <strong className="text-sm font-sans font-bold block">{grn.lines[0]?.itemName}</strong>
                <span className="text-xs font-bold">{grn.lines[0]?.itemCode}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 border-y border-slate-300 py-2">
                <div>
                  <span className="text-[9px] text-slate-500 block">LOT / BATCH #</span>
                  <strong className="text-xs font-bold text-blue-900">{grn.lines[0]?.lotBatchNumber}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">NET WEIGHT</span>
                  <strong className="text-sm font-bold">{grn.lines[0]?.currentReceivedQty} {grn.lines[0]?.uom}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-slate-500 block">MFG DATE</span>
                  <span className="text-[10px]">{grn.lines[0]?.mfgDate}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">EXPIRY DATE</span>
                  <span className="text-[10px] font-bold">{grn.lines[0]?.expiryDate}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-300">
                <div className="space-y-0.5 text-[9px]">
                  <div>GRN: {grn.grnNumber}</div>
                  <div>BIN: {grn.lines[0]?.bin}</div>
                  <div>SUP: {grn.supplierName.slice(0, 16)}</div>
                </div>
                <div className="w-16 h-16 bg-slate-100 border border-slate-400 flex items-center justify-center p-1">
                  <QrCode className="w-14 h-14 text-black" />
                </div>
              </div>
            </div>
          )}

          {/* CHECKLIST / PUTAWAY SLIP */}
          {printMode === 'checklist' && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-300 w-full max-w-2xl text-slate-900 text-xs space-y-4">
              <div className="border-b pb-2 flex justify-between">
                <div>
                  <h3 className="font-bold text-sm font-['Space_Grotesk'] uppercase">Warehouse Putaway Order</h3>
                  <p className="text-[11px] text-slate-500">Forklift Staging to Bin Transfer Sheet</p>
                </div>
                <div className="text-right font-mono font-bold">{grn.grnNumber}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <div>Source: <strong>{grn.receivingDock}</strong></div>
                <div>Destination Bin: <strong className="text-purple-800 font-mono text-sm">{grn.lines[0]?.bin}</strong></div>
                <div>Material: <strong>{grn.lines[0]?.itemName}</strong> ({grn.lines[0]?.currentReceivedQty} {grn.lines[0]?.uom})</div>
                <div>Batch: <strong className="font-mono">{grn.lines[0]?.lotBatchNumber}</strong></div>
              </div>

              <div className="border-t pt-8 flex justify-between text-[11px] text-slate-500">
                <div>Forklift Operator Signature: __________________</div>
                <div>Date & Time: __________________</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Now
          </button>
        </div>
      </div>
    </div>
  );
};
