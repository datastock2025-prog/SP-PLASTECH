import React, { useState } from 'react';
import {
  X,
  FileText,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  FileCheck,
  Paperclip,
  RotateCcw,
  History,
  QrCode,
  Printer,
  Scale,
  Calendar,
  Building,
  User,
  ExternalLink,
  ChevronRight,
  Download,
  AlertCircle,
  FlaskConical,
} from 'lucide-react';
import { GoodsReceiptNoteExt } from '../../../types/grnTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grn: GoodsReceiptNoteExt | null;
  onPrint: (grn: GoodsReceiptNoteExt) => void;
  onOpenReturnModal: (grn: GoodsReceiptNoteExt) => void;
  onOpenReversalModal: (grn: GoodsReceiptNoteExt) => void;
  showToast: (msg: string) => void;
}

type DetailTab =
  | 'overview'
  | 'poLines'
  | 'receivedLines'
  | 'lotBatch'
  | 'qc'
  | 'putaway'
  | 'documents'
  | 'threeWayMatch'
  | 'returns'
  | 'audit';

export const GrnDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  grn,
  onPrint,
  onOpenReturnModal,
  onOpenReversalModal,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  if (!isOpen || !grn) return null;

  const totalOrdered = grn.lines.reduce((s, l) => s + l.orderedQty, 0);
  const totalReceived = grn.lines.reduce((s, l) => s + l.currentReceivedQty, 0);
  const totalAccepted = grn.lines.reduce((s, l) => s + l.acceptedQty, 0);
  const totalRejected = grn.lines.reduce((s, l) => s + l.rejectedQty, 0);
  const totalGrossKg = grn.lines.reduce((s, l) => s + (l.grossWeightKg || 0), 0);
  const totalNetKg = grn.lines.reduce((s, l) => s + (l.netWeightKg || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#14213D] text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-teal-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-['Space_Grotesk'] text-white">
                  Goods Receipt Note Master: {grn.grnNumber}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    grn.status === 'posted' || grn.status === 'accepted'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : grn.status === 'pending_qc'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {grn.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                PO #{grn.poNumber} • {grn.supplierName} • Received on {grn.receiptDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(grn)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition border border-white/20"
            >
              <Printer className="w-3.5 h-3.5 text-teal-300" />
              Print GRN
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 10-Tab Navigation Ribbon */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto text-xs py-1 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'poLines', label: 'PO Lines', icon: FileCheck },
            { id: 'receivedLines', label: 'Received Lines', icon: Layers },
            { id: 'lotBatch', label: 'Lot / Batch', icon: QrCode },
            { id: 'qc', label: 'Quality Lab', icon: FlaskConical },
            { id: 'putaway', label: 'Putaway History', icon: Truck },
            { id: 'documents', label: 'Attachments (4)', icon: Paperclip },
            { id: 'threeWayMatch', label: '3-Way Match', icon: CheckCircle2 },
            { id: 'returns', label: 'Exceptions & Returns', icon: RotateCcw },
            { id: 'audit', label: 'Audit Trail', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DetailTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-white text-[#14213D] font-bold shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0F8B8D]' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs bg-slate-50/50 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Ordered</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">{totalOrdered.toLocaleString()} KG</div>
                  <div className="text-[10px] text-slate-500">Across {grn.lines.length} lines</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Received Qty</div>
                  <div className="text-base font-bold text-[#0F8B8D] mt-0.5">{totalReceived.toLocaleString()} KG</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Tally matched weighbridge</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Accepted Qty</div>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">{totalAccepted.toLocaleString()} KG</div>
                  <div className="text-[10px] text-emerald-600">QC Status: {grn.inspectionStatus}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Weighbridge Weights</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{totalNetKg.toLocaleString()} KG Net</div>
                  <div className="text-[10px] text-slate-500">Gross: {totalGrossKg.toLocaleString()} KG</div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Consignment & Supplier */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-600" />
                    Supplier & Purchase Order Reference
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Supplier Name</span>
                      <strong className="text-slate-800">{grn.supplierName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Supplier GSTIN</span>
                      <span className="font-mono text-slate-700">{grn.supplierGstin}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Purchase Order</span>
                      <strong className="font-mono text-blue-700">{grn.poNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Delivery Challan #</span>
                      <span className="font-medium text-slate-800">{grn.deliveryChallanNo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Supplier Invoice #</span>
                      <span className="font-medium text-slate-800">{grn.supplierInvoiceNo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Invoice Date</span>
                      <span className="text-slate-700">{grn.supplierInvoiceDate}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Dock & Logistics */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-teal-600" />
                    Dock Gate Entry & Logistics Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Gate Entry #</span>
                      <span className="font-mono font-bold text-slate-800">{grn.gateEntryNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Vehicle / Truck #</span>
                      <span className="font-mono font-bold text-slate-900 uppercase">{grn.vehicleNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Transporter Fleet</span>
                      <span className="text-slate-700">{grn.transporterName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Driver Name</span>
                      <span className="text-slate-700">{grn.driverName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Receiving Dock & WH</span>
                      <span className="text-slate-800 font-medium">{grn.receivingDock} ({grn.warehouse})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Received By</span>
                      <span className="text-slate-800 font-medium">{grn.receivedBy}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Receipt Notes & Dock Remarks</span>
                <p className="text-slate-700">{grn.notes || 'All bags verified, pallet seal inspected.'}</p>
              </div>
            </div>
          )}

          {/* TAB 2: PO LINES */}
          {activeTab === 'poLines' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">PO Line #</th>
                    <th className="py-2.5 px-3">Item Code & Name</th>
                    <th className="py-2.5 px-3 text-center">UOM</th>
                    <th className="py-2.5 px-3 text-right">PO Ordered</th>
                    <th className="py-2.5 px-3 text-right">Prev Received</th>
                    <th className="py-2.5 px-3 text-right">GRN Received</th>
                    <th className="py-2.5 px-3 text-right">Remaining Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grn.lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">#{line.poLineNo}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{line.itemName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{line.itemCode}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold">{line.uom}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{line.orderedQty.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{line.previouslyReceivedQty.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{line.currentReceivedQty.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-blue-700">{line.remainingPoQty.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: RECEIVED LINES */}
          {activeTab === 'receivedLines' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Line #</th>
                    <th className="py-2.5 px-3">Item Details</th>
                    <th className="py-2.5 px-3 text-right">Arrived</th>
                    <th className="py-2.5 px-3 text-right">Counted</th>
                    <th className="py-2.5 px-3 text-right">Accepted</th>
                    <th className="py-2.5 px-3 text-right">Rejected</th>
                    <th className="py-2.5 px-3 text-center">Tolerance</th>
                    <th className="py-2.5 px-3">Location & Bin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grn.lines.map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono">#{l.lineNo}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{l.itemName}</div>
                        <div className="text-[10px] font-mono text-slate-500">Lot: {l.lotBatchNumber}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{l.arrivedQty} {l.uom}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{l.countedQty} {l.uom}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{l.acceptedQty} {l.uom}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-700">{l.rejectedQty} {l.uom}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {l.toleranceWarning === 'ok' ? 'Within PO' : l.toleranceWarning}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-slate-800 font-semibold">{l.bin}</div>
                        <div className="text-[10px] text-slate-500">{l.locationCode}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: LOT / BATCH */}
          {activeTab === 'lotBatch' && (
            <div className="space-y-4">
              {grn.lines.map((line, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <QrCode className="w-4 h-4 text-[#0F8B8D]" />
                      <span>{line.itemName}</span>
                      <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                        {line.lotBatchNumber}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      COA: {line.coaStatus} ({line.coaReference})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Supplier Heat / Lot</span>
                      <strong className="font-mono text-slate-800">{line.supplierLotNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">MFG Date</span>
                      <span className="text-slate-700">{line.mfgDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Expiry Date</span>
                      <span className="text-slate-700">{line.expiryDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Remaining Shelf Life</span>
                      <strong className="text-emerald-700">{line.remainingShelfLifeDays} days</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Packaging Format</span>
                      <span className="text-slate-800 font-medium">{line.packingType} ({line.bagCount} bags)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Net / Gross Tally</span>
                      <span className="text-slate-800 font-medium">{line.netWeightKg} KG / {line.grossWeightKg} KG</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Storage Environment</span>
                      <span className="text-slate-800">{line.storageCondition}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Country of Origin</span>
                      <span className="text-slate-800">{line.countryOrigin}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: QUALITY LAB */}
          {activeTab === 'qc' && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-[#0F8B8D]" />
                    <h4 className="font-bold text-slate-900">Lab Inspection Certificate & Rheology Tests</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Status: {grn.inspectionStatus}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Test Parameter</th>
                        <th className="py-2.5 px-3">Standard Spec</th>
                        <th className="py-2.5 px-3">Observed Result</th>
                        <th className="py-2.5 px-3 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(grn.lines[0]?.qcParameters || [
                        { testName: 'Melt Flow Index (MFI @ 230°C/2.16kg)', standard: '11.0 - 13.0 g/10min', actual: '12.2 g/10min', passed: true },
                        { testName: 'Moisture Content %', standard: '< 0.05%', actual: '0.02%', passed: true },
                        { testName: 'Density @ 23°C', standard: '0.900 - 0.910 g/cm³', actual: '0.905 g/cm³', passed: true },
                        { testName: 'Visual Color & Black Specks', standard: 'Zero contamination', actual: 'Clear Natural', passed: true },
                      ]).map((param, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 font-semibold text-slate-800">{param.testName}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{param.standard}</td>
                          <td className="py-2 px-3 font-mono text-slate-900 font-bold">{param.actual}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              PASS
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-[11px] text-slate-500 pt-1">
                  Testing standard: ASTM D1238, ASTM D792. Tested by: Dr. Anita Mehta (Lead Quality Chemist).
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PUTAWAY HISTORY */}
          {activeTab === 'putaway' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600" />
                Dock to Bin Putaway Execution History
              </h4>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="text-purple-900 font-bold">Forklift Transfer Task #PTW-9901</strong>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Completed
                  </span>
                </div>
                <div className="text-slate-600">
                  Transferred {grn.lines[0]?.currentReceivedQty} {grn.lines[0]?.uom} from <strong>{grn.receivingDock}</strong> into permanent storage bin <strong>{grn.lines[0]?.bin}</strong>.
                </div>
                <div className="text-[11px] text-slate-400">
                  Operator: Dharmesh Solanki • Forklift Bay #2 • Completed on {grn.receiptDate} 10:45 AM
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DOCUMENTS & ATTACHMENTS */}
          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: `Supplier Invoice: ${grn.supplierInvoiceNo}`, size: '1.2 MB PDF', type: 'Invoice', date: grn.supplierInvoiceDate },
                { name: `Delivery Challan: ${grn.deliveryChallanNo}`, size: '840 KB PDF', type: 'Challan', date: grn.receiptDate },
                { name: `Weighbridge Tare & Gross Slip #${grn.gateEntryNumber}`, size: '320 KB PDF', type: 'Weighbridge', date: grn.receiptDate },
                { name: `Supplier COA Certificate #${grn.lines[0]?.coaReference || 'COA-892'}`, size: '2.1 MB PDF', type: 'COA', date: grn.receiptDate },
              ].map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                      <Paperclip className="w-4 h-4 text-[#0F8B8D]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-xs">{doc.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {doc.type} • {doc.size} • {doc.date}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast(`Opening document ${doc.name}...`)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                    title="View / Download Document"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 8: 3-WAY INVOICE MATCH */}
          {activeTab === 'threeWayMatch' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Automated 3-Way Match Verification</h4>
                  <p className="text-[11px] text-slate-500">Cross-verification between Purchase Order, GRN Inward Qty, and Supplier Invoice</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Fully Matched (OK to Pay)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">1. PO Ordered Qty</span>
                  <strong className="text-slate-800 text-sm">{totalOrdered.toLocaleString()} KG</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">2. GRN Accepted Qty</span>
                  <strong className="text-emerald-700 text-sm">{totalAccepted.toLocaleString()} KG</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">3. Supplier Billed Qty</span>
                  <strong className="text-blue-800 text-sm">{totalReceived.toLocaleString()} KG</strong>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero quantity variance detected. Line items within agreed unit price contract. No debit note required.</span>
              </div>
            </div>
          )}

          {/* TAB 9: EXCEPTIONS & RETURNS */}
          {activeTab === 'returns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs">Material Discrepancies & Supplier Returns</h4>
                <button
                  onClick={() => onOpenReturnModal(grn)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Log Rejection / Debit Note
                </button>
              </div>

              {totalRejected > 0 ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Rejected Stock: {totalRejected.toLocaleString()} KG
                  </div>
                  <p className="text-slate-700 text-[11px]">
                    Material marked for supplier return or debit note deduction.
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-1" />
                  <p className="font-semibold text-slate-700">No rejections or exceptions recorded.</p>
                  <p className="text-[11px]">All goods received match purchase order specifications.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Immutable GRN Lifecycle Audit Log
              </h4>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {grn.auditTrail.map((log) => (
                  <div key={log.id} className="relative text-xs">
                    <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#0F8B8D] border-2 border-white ring-1 ring-[#0F8B8D]/30" />
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-slate-700">{log.action}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="text-slate-600 mt-0.5">{log.details}</div>
                    <div className="text-[10px] text-slate-400 font-medium">By: {log.user}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => onOpenReversalModal(grn)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reverse / Correct GRN
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Close
            </button>
            <button
              onClick={() => onPrint(grn)}
              className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print GRN Voucher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
