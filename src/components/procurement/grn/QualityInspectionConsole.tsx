import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Sparkles,
  ClipboardList,
  Printer,
  ChevronRight,
  FlaskConical,
} from 'lucide-react';
import { GoodsReceiptNoteExt, GrnLineItemExt } from '../../../types/grnTypes';

interface Props {
  grns: GoodsReceiptNoteExt[];
  onUpdateGrn: (updated: GoodsReceiptNoteExt) => void;
  showToast: (msg: string) => void;
}

export const QualityInspectionConsole: React.FC<Props> = ({
  grns,
  onUpdateGrn,
  showToast,
}) => {
  const [selectedGrn, setSelectedGrn] = useState<GoodsReceiptNoteExt | null>(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number>(0);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Filter GRNs that require QC or have QC status
  const qcGrns = grns.filter(
    (g) =>
      g.inspectionMode === 'QC_BEFORE_GRN' ||
      g.inspectionMode === 'QC_AFTER_GRN' ||
      g.status === 'pending_qc' ||
      g.lines.some((l) => l.qualityStatus !== 'Not Required')
  );

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQcGrns = qcGrns.filter((g) => {
    const matchSearch =
      g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.lines.some((l) => l.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || l.lotBatchNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Pending' && (g.status === 'pending_qc' || g.inspectionStatus === 'Pending')) ||
      (filterStatus === 'Approved' && g.inspectionStatus === 'Approved') ||
      (filterStatus === 'Quarantined' && g.inspectionStatus === 'Quarantined') ||
      (filterStatus === 'Rejected' && g.inspectionStatus === 'Rejected');

    return matchSearch && matchStatus;
  });

  const handleOpenInspection = (grn: GoodsReceiptNoteExt, lineIdx: number = 0) => {
    setSelectedGrn(grn);
    setSelectedLineIndex(lineIdx);
    setIsTestModalOpen(true);
  };

  const handleCompleteInspection = (
    result: 'Approved' | 'Rejected' | 'Concession',
    acceptedQty: number,
    rejectedQty: number,
    concessionQty: number,
    notes: string,
    testResults: any[]
  ) => {
    if (!selectedGrn) return;

    const updatedLines = [...selectedGrn.lines];
    const targetLine = { ...updatedLines[selectedLineIndex] };

    targetLine.acceptedQty = acceptedQty;
    targetLine.rejectedQty = rejectedQty;
    targetLine.concessionQty = concessionQty;
    targetLine.qualityStatus =
      result === 'Approved'
        ? 'Passed QC'
        : result === 'Rejected'
        ? 'Failed QC'
        : 'Concession Approved';
    targetLine.qcParameters = testResults;
    updatedLines[selectedLineIndex] = targetLine;

    const allApproved = updatedLines.every((l) => l.qualityStatus === 'Passed QC' || l.qualityStatus === 'Concession Approved');
    const hasRejections = updatedLines.some((l) => l.rejectedQty > 0);

    const updatedGrn: GoodsReceiptNoteExt = {
      ...selectedGrn,
      lines: updatedLines,
      inspectionStatus: allApproved ? 'Approved' : hasRejections ? 'Quarantined' : 'Rejected',
      status: allApproved
        ? 'accepted'
        : hasRejections
        ? 'partially_accepted'
        : 'rejected',
      inventoryPostingStatus: allApproved
        ? 'Posted to Available Stock'
        : hasRejections
        ? 'Posted to Quarantine'
        : 'Posted to Rejected Stock',
      putawayStatus: allApproved ? 'In Progress' : 'Pending',
      auditTrail: [
        ...selectedGrn.auditTrail,
        {
          id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
          action: 'Inspected',
          user: 'Dr. Anita Mehta (Lead Quality Chemist)',
          timestamp: new Date().toLocaleString(),
          details: `QC Result: ${result}. Accepted: ${acceptedQty} KG, Rejected: ${rejectedQty} KG. Notes: ${notes}`,
        },
      ],
    };

    onUpdateGrn(updatedGrn);
    setIsTestModalOpen(false);
    showToast(`Inspection finalized for ${selectedGrn.grnNumber}: ${result}`);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D] flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#0F8B8D]" />
            Incoming Material Quality Inspection Console
          </h2>
          <p className="text-xs text-slate-500">
            Verify plastic raw materials against ASTM / ISO specs before inventory release (QC Before GRN) or quarantine release (QC After GRN)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {qcGrns.filter((g) => g.status === 'pending_qc').length} Quarantine Lots Pending
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by GRN #, lot number, polymer grade, supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="All">All QC Statuses</option>
            <option value="Pending">Pending Inspection</option>
            <option value="Approved">Passed QC / Released</option>
            <option value="Quarantined">Quarantine / Partial</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* QC Lots Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-semibold">GRN & PO Number</th>
                <th className="py-3 px-3 font-semibold">Supplier</th>
                <th className="py-3 px-3 font-semibold">Polymer Grade / Material</th>
                <th className="py-3 px-3 font-semibold">Lot / Batch #</th>
                <th className="py-3 px-3 font-semibold text-right">Received Qty</th>
                <th className="py-3 px-3 font-semibold text-right">Accepted Qty</th>
                <th className="py-3 px-3 font-semibold text-center">QC Mode</th>
                <th className="py-3 px-3 font-semibold text-center">QC Status</th>
                <th className="py-3 px-3 font-semibold text-center">Inventory Posting</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQcGrns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <p className="font-semibold text-slate-600">No inspection records match current filter.</p>
                  </td>
                </tr>
              ) : (
                filteredQcGrns.map((grn) => {
                  const line = grn.lines[0];
                  return (
                    <tr key={grn.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900">{grn.grnNumber}</div>
                        <div className="text-[10px] text-blue-700 font-mono">PO: {grn.poNumber}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{grn.supplierName}</div>
                        <div className="text-[10px] text-slate-400">Challan: {grn.deliveryChallanNo}</div>
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-semibold text-slate-900 truncate">{line?.itemName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{line?.itemCode}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-purple-700">{line?.lotBatchNumber}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Sup: {line?.supplierLotNumber}</div>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {line?.currentReceivedQty?.toLocaleString()} {line?.uom}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                        {line?.acceptedQty?.toLocaleString()} {line?.uom}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {grn.inspectionMode === 'QC_BEFORE_GRN' ? 'QC Before GRN' : 'QC After GRN'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {line?.qualityStatus === 'Passed QC' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> QC Passed
                          </span>
                        ) : line?.qualityStatus === 'Failed QC' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        ) : line?.qualityStatus === 'Concession Approved' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                            Concession
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold animate-pulse">
                            Pending QC
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-medium text-slate-600 block">
                          {grn.inventoryPostingStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleOpenInspection(grn, 0)}
                          className="px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1 ml-auto"
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                          {line?.qualityStatus === 'Passed QC' ? 'Review Test' : 'Run Inspection'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Quality Inspection Test Modal */}
      {isTestModalOpen && selectedGrn && (
        <QualityTestModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          grn={selectedGrn}
          line={selectedGrn.lines[selectedLineIndex]}
          onComplete={handleCompleteInspection}
        />
      )}
    </div>
  );
};

// ----------------------------------------------------
// SUB-MODAL: Plastic Lab Inspection Test Panel
// ----------------------------------------------------
interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  grn: GoodsReceiptNoteExt;
  line: GrnLineItemExt;
  onComplete: (
    result: 'Approved' | 'Rejected' | 'Concession',
    acceptedQty: number,
    rejectedQty: number,
    concessionQty: number,
    notes: string,
    testResults: any[]
  ) => void;
}

const QualityTestModal: React.FC<TestModalProps> = ({
  isOpen,
  onClose,
  grn,
  line,
  onComplete,
}) => {
  const [testRows, setTestRows] = useState<any[]>(() => {
    if (line.qcParameters && line.qcParameters.length > 0) {
      return line.qcParameters;
    }
    // Default plastic resin parameters
    return [
      { testName: 'Melt Flow Index (MFI @ 230°C/2.16kg)', standard: '11.0 - 13.0 g/10min', actual: '12.2 g/10min', passed: true },
      { testName: 'Moisture Content % (Karl Fischer)', standard: '< 0.05%', actual: '0.02%', passed: true },
      { testName: 'Density @ 23°C (ASTM D792)', standard: '0.900 - 0.910 g/cm³', actual: '0.905 g/cm³', passed: true },
      { testName: 'Visual Color & Black Specks', standard: 'Clean natural, Nil contamination', actual: 'Clear Natural, 0 specks', passed: true },
      { testName: 'Bag & Seal Packaging Condition', standard: 'Zero leakage, moisture barrier intact', actual: 'Intact', passed: true },
    ];
  });

  const [acceptedQty, setAcceptedQty] = useState<number>(line.currentReceivedQty);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [concessionQty, setConcessionQty] = useState<number>(0);
  const [inspectorNotes, setInspectorNotes] = useState(
    'MFI and density confirmed within ASTM D1238 tolerance. COA matched supplier heat sheet.'
  );

  const allPassed = testRows.every((t) => t.passed);

  const handleTestPassToggle = (idx: number) => {
    setTestRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], passed: !next[idx].passed };
      return next;
    });
  };

  const handleTestActualChange = (idx: number, val: string) => {
    setTestRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], actual: val };
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#14213D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Space_Grotesk']">
                Quality Inspection Test Worksheet: {grn.grnNumber}
              </h3>
              <p className="text-xs text-slate-300">
                Lot #{line.lotBatchNumber} — {line.itemName} ({line.currentReceivedQty.toLocaleString()} {line.uom})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Matrix */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Header Specs Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Supplier & PO</span>
              <strong className="text-slate-800">{grn.supplierName}</strong>
              <div className="text-[10px] text-blue-700 font-mono">{grn.poNumber}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Supplier Lot #</span>
              <strong className="font-mono text-purple-700">{line.supplierLotNumber}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">COA Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> {line.coaStatus}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Quarantine Location</span>
              <span className="font-mono text-slate-700">{line.quarantineBin}</span>
            </div>
          </div>

          {/* Test Parameters Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between">
              <span>ASTM / ISO Polymer Physical & Rheological Assay</span>
              <span className="text-[11px] text-slate-500 font-normal">Click toggle to verify parameter</span>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Inspection Parameter</th>
                  <th className="py-2.5 px-3">Target Standard</th>
                  <th className="py-2.5 px-3">Actual Lab Result</th>
                  <th className="py-2.5 px-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {testRows.map((test, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{test.testName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{test.standard}</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={test.actual}
                        onChange={(e) => handleTestActualChange(idx, e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs bg-white"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleTestPassToggle(idx)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 mx-auto ${
                          test.passed
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {test.passed ? (
                          <>
                            <Check className="w-3 h-3" /> Pass
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" /> Fail
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quantities Disposition Breakdown */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800">Disposition Quantity Breakdown ({line.uom})</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 font-medium">Accepted Qty</label>
                <input
                  type="number"
                  value={acceptedQty}
                  onChange={(e) => setAcceptedQty(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Rejected Qty (NCR / Return)</label>
                <input
                  type="number"
                  value={rejectedQty}
                  onChange={(e) => setRejectedQty(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-rose-700"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Concession Qty (Restricted)</label>
                <input
                  type="number"
                  value={concessionQty}
                  onChange={(e) => setConcessionQty(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-purple-700"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Chemist / Inspector Final Sign-Off Remarks</label>
            <textarea
              rows={2}
              value={inspectorNotes}
              onChange={(e) => setInspectorNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Inspector: <strong>Dr. Anita Mehta (Lead Polymer QA)</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              onClick={() =>
                onComplete('Rejected', 0, line.currentReceivedQty, 0, inspectorNotes, testRows)
              }
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject Batch
            </button>

            <button
              onClick={() =>
                onComplete('Concession', acceptedQty, rejectedQty, concessionQty || 100, inspectorNotes, testRows)
              }
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              Concession Approval
            </button>

            <button
              onClick={() =>
                onComplete('Approved', acceptedQty, rejectedQty, 0, inspectorNotes, testRows)
              }
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve & Release Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
