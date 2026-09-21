import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  FileText,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Package,
  Printer,
  Eye,
  Truck,
  Building2,
  Calendar,
  X,
  Send,
  Download,
  Filter,
  ArrowRight,
  ShieldAlert,
  Clock,
  Check,
} from 'lucide-react';
import {
  SupplierReturnRecord,
  SupplierReturnStatus,
  SupplierMaster,
  ExtendedPurchaseOrder,
  GoodsReceiptNote,
} from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { INITIAL_PROCUREMENT_RETURNS } from '../../data/procurementData';

interface Props {
  returns?: SupplierReturnRecord[];
  suppliers?: SupplierMaster[];
  pos?: ExtendedPurchaseOrder[];
  grns?: GoodsReceiptNote[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateReturn?: (updated: SupplierReturnRecord) => void;
  onCreateReturn?: (newReturn: SupplierReturnRecord) => void;
  showToast: (msg: string) => void;
}

export const PurchaseReturnsView: React.FC<Props> = ({
  returns: initialReturns = INITIAL_PROCUREMENT_RETURNS,
  suppliers = [],
  pos = [],
  grns = [],
  onNavigate,
  onUpdateReturn,
  onCreateReturn,
  showToast,
}) => {
  const [returnRecords, setReturnRecords] = useState<SupplierReturnRecord[]>(initialReturns);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [reasonFilter, setReasonFilter] = useState<string>('All');

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedReturnForDetail, setSelectedReturnForDetail] = useState<SupplierReturnRecord | null>(null);
  const [selectedReturnForPrint, setSelectedReturnForPrint] = useState<SupplierReturnRecord | null>(null);

  // Sync internal state if prop updates
  React.useEffect(() => {
    if (initialReturns) {
      setReturnRecords(initialReturns);
    }
  }, [initialReturns]);

  // Filtered returns
  const filteredReturns = useMemo(() => {
    return returnRecords.filter((r) => {
      const matchSearch =
        r.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.debitNoteNumber && r.debitNoteNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.linkedNcrId && r.linkedNcrId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchReason = reasonFilter === 'All' || r.reason === reasonFilter;

      return matchSearch && matchStatus && matchReason;
    });
  }, [returnRecords, searchTerm, statusFilter, reasonFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = returnRecords.length;
    const totalDebitValue = returnRecords.reduce((sum, r) => sum + (Number(r.creditAmount) || 0), 0);
    const pendingCount = returnRecords.filter(
      (r) => r.status === 'draft' || r.status === 'pending_approval' || r.status === 'sent_to_supplier'
    ).length;
    const pendingValue = returnRecords
      .filter((r) => r.status === 'draft' || r.status === 'pending_approval' || r.status === 'sent_to_supplier')
      .reduce((sum, r) => sum + (Number(r.creditAmount) || 0), 0);
    const settledCount = returnRecords.filter(
      (r) => r.status === 'credit_note_received' || r.status === 'replacement_received' || r.status === 'closed'
    ).length;

    return { totalCount, totalDebitValue, pendingCount, pendingValue, settledCount };
  }, [returnRecords]);

  // Handle creating new material return
  const handleSaveNewReturn = (newReturn: SupplierReturnRecord) => {
    const updated = [newReturn, ...returnRecords];
    setReturnRecords(updated);
    onCreateReturn?.(newReturn);
    setIsLogModalOpen(false);
    showToast(`✓ Material Return ${newReturn.returnNumber} logged with Debit Note ₹${(newReturn.creditAmount || 0).toLocaleString()}`);
  };

  // Quick Status Update
  const handleUpdateStatus = (returnId: string, newStatus: SupplierReturnStatus) => {
    const updated = returnRecords.map((r) => {
      if (r.id === returnId) {
        return {
          ...r,
          status: newStatus,
          debitNoteNumber:
            newStatus === 'supplier_acknowledged' || newStatus === 'credit_note_received'
              ? r.debitNoteNumber || `DN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
              : r.debitNoteNumber,
        };
      }
      return r;
    });

    setReturnRecords(updated);
    const changedItem = updated.find((r) => r.id === returnId);
    if (changedItem) {
      onUpdateReturn?.(changedItem);
      if (selectedReturnForDetail?.id === returnId) {
        setSelectedReturnForDetail(changedItem);
      }
    }
    showToast(`Return status updated to ${newStatus.replace(/_/g, ' ').toUpperCase()}`);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#E8622C]" />
            Purchase Returns & Vendor Debit Notes
          </h1>
          <p className="text-xs text-slate-500">
            Off-spec polymer rejection handling, dock turnarounds, Non-Conformance Reports (NCR), and vendor debit memos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Material Return
          </button>
        </div>
      </div>

      {/* KPI Overview Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span>Total Returns Logged</span>
            <RotateCcw className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D]">
            {metrics.totalCount} Cases
          </div>
          <span className="text-[11px] text-slate-400">All recorded supplier RM rejections</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-red-200 shadow-2xs bg-red-50/20">
          <div className="flex items-center justify-between text-red-700 mb-1">
            <span className="font-semibold">Total Debit Memo Value</span>
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-lg font-bold font-['Space_Grotesk'] text-red-600">
            ₹{metrics.totalDebitValue.toLocaleString()}
          </div>
          <span className="text-[11px] text-red-600/80">Cumulative supplier claims value</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="font-semibold">Pending Vendor Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold font-['Space_Grotesk'] text-amber-800">
            {metrics.pendingCount} Cases
          </div>
          <span className="text-[11px] text-amber-700">₹{metrics.pendingValue.toLocaleString()} awaiting credit</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="font-semibold">Settled & Replaced</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-['Space_Grotesk'] text-emerald-700">
            {metrics.settledCount} Settled
          </div>
          <span className="text-[11px] text-emerald-600">Credit note or goods received</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Return #, supplier, item, batch, debit note #, NCR #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#E8622C]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="All">All Return Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent_to_supplier">Sent to Supplier</option>
              <option value="supplier_acknowledged">Supplier Acknowledged</option>
              <option value="credit_note_received">Credit Note Received</option>
              <option value="replacement_received">Replacement Received</option>
              <option value="closed">Closed / Settled</option>
            </select>

            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="All">All Rejection Causes</option>
              <option value="Quality rejection">Quality Rejection (QC Fail)</option>
              <option value="Damaged material">Damaged Material (Logistics)</option>
              <option value="Wrong item received">Wrong Item Received</option>
              <option value="Excess receipt">Excess Supply Over PO</option>
              <option value="Expired material">Expired / Degraded</option>
              <option value="Supplier recall">Supplier Voluntary Recall</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setReasonFilter('All');
              }}
              className="px-2.5 py-2 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Returns List Cards */}
      <div className="space-y-3.5 text-xs">
        {filteredReturns.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <RotateCcw className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">No purchase return records match criteria.</p>
            <p className="text-[11px] text-slate-400">Click "+ Log Material Return" above to register a new vendor rejection.</p>
          </div>
        ) : (
          filteredReturns.map((ret) => (
            <div
              key={ret.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-[#E8622C]/60 transition space-y-3"
            >
              {/* Row 1: Header info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#14213D]">{ret.returnNumber}</span>
                  <ProcurementStatusBadge status={ret.status} size="xs" />
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600">
                    Supplier: <strong className="text-slate-900">{ret.supplierName}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Date: {ret.returnDate}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Debit Note Value</div>
                    <div className="text-base font-bold font-['Space_Grotesk'] text-red-600">
                      ₹{(Number(ret.creditAmount) || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: 3-Column Detail Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Rejected Material & Batch</div>
                  <div className="font-bold text-[#14213D] truncate" title={ret.itemName}>{ret.itemName}</div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    Code: {ret.itemCode} • Batch: <strong className="text-purple-700">{ret.lotBatchNumber}</strong>
                  </div>
                  <div className="text-slate-500 font-semibold text-[11px]">
                    Qty: {(Number(ret.returnQty) || 0).toLocaleString()} {ret.uom} @ ₹{ret.unitPrice || 0}/{ret.uom}
                  </div>
                </div>

                <div className="p-3 bg-red-50/60 rounded-lg border border-red-100 space-y-1">
                  <div className="text-red-700 text-[10px] uppercase font-bold flex items-center justify-between">
                    <span>Defect Cause & Reason</span>
                    {ret.linkedNcrId && (
                      <span className="px-1.5 py-0.2 rounded bg-red-200 text-red-900 text-[9px] font-mono">
                        {ret.linkedNcrId}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-red-900">{ret.reason}</div>
                  <div className="text-red-800/90 text-[11px]">
                    Requested Settlement: <strong>{ret.dispositionRequested}</strong>
                  </div>
                  <p className="text-[10px] text-slate-600 line-clamp-1 italic" title={ret.notes}>
                    "{ret.notes}"
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Debit Note & Outward Logistics</div>
                  <div className="font-mono font-bold text-[#14213D] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#E8622C]" />
                    {ret.debitNoteNumber || 'Pending DN Issuance'}
                  </div>
                  <div className="text-emerald-700 font-semibold text-[11px] truncate flex items-center gap-1">
                    <Truck className="w-3 h-3" /> {ret.trackingNumber || 'Local Dispatch Gate Pass'}
                  </div>
                  <div className="text-slate-400 text-[10px] font-mono">
                    Linked PO: {ret.poNumber} • GRN: {ret.grnNumber}
                  </div>
                </div>
              </div>

              {/* Row 3: Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Quick Workflow:</span>
                  {ret.status === 'draft' && (
                    <button
                      onClick={() => handleUpdateStatus(ret.id, 'sent_to_supplier')}
                      className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold border border-blue-200 transition cursor-pointer"
                    >
                      Send to Supplier
                    </button>
                  )}
                  {ret.status === 'sent_to_supplier' && (
                    <button
                      onClick={() => handleUpdateStatus(ret.id, 'supplier_acknowledged')}
                      className="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold border border-purple-200 transition cursor-pointer"
                    >
                      Record Acknowledgment
                    </button>
                  )}
                  {ret.status === 'supplier_acknowledged' && (
                    <button
                      onClick={() => handleUpdateStatus(ret.id, 'credit_note_received')}
                      className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200 transition cursor-pointer"
                    >
                      Record Credit Note Received
                    </button>
                  )}
                  {ret.status === 'credit_note_received' && (
                    <button
                      onClick={() => handleUpdateStatus(ret.id, 'closed')}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition cursor-pointer"
                    >
                      Close Return
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedReturnForPrint(ret)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Debit Note
                  </button>
                  <button
                    onClick={() => setSelectedReturnForDetail(ret)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#14213D] hover:bg-[#1a2d52] text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: Log Material Return & Debit Note Wizard */}
      {isLogModalOpen && (
        <LogMaterialReturnModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          onSave={handleSaveNewReturn}
          suppliers={suppliers}
          pos={pos}
          grns={grns}
        />
      )}

      {/* MODAL 2: View Return Details Modal */}
      {selectedReturnForDetail && (
        <ReturnDetailModal
          returnItem={selectedReturnForDetail}
          onClose={() => setSelectedReturnForDetail(null)}
          onPrint={() => {
            setSelectedReturnForPrint(selectedReturnForDetail);
          }}
          onStatusChange={handleUpdateStatus}
        />
      )}

      {/* MODAL 3: Printable Debit Note Voucher Modal */}
      {selectedReturnForPrint && (
        <PrintDebitNoteModal
          returnItem={selectedReturnForPrint}
          onClose={() => setSelectedReturnForPrint(null)}
        />
      )}
    </div>
  );
};

// ----------------------------------------------------
// SUB-MODAL 1: Log Material Return Wizard
// ----------------------------------------------------
interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: SupplierReturnRecord) => void;
  suppliers: SupplierMaster[];
  pos: ExtendedPurchaseOrder[];
  grns: GoodsReceiptNote[];
}

const LogMaterialReturnModal: React.FC<LogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  suppliers,
  pos,
  grns,
}) => {
  const [supplierName, setSupplierName] = useState(suppliers[0]?.name || 'EcoPolymer Regrind Suppliers');
  const [poNumber, setPoNumber] = useState('PO-3378');
  const [grnNumber, setGrnNumber] = useState('GRN-4482');
  const [itemCode, setItemCode] = useState('RM-PP-NAT-001');
  const [itemName, setItemName] = useState('PP Natural Granules H110MA');
  const [lotBatchNumber, setLotBatchNumber] = useState('LOT-2026-PP-902');
  const [returnQty, setReturnQty] = useState<number>(500);
  const [uom, setUom] = useState('KG');
  const [unitPrice, setUnitPrice] = useState<number>(78.5);
  const [reason, setReason] = useState<SupplierReturnRecord['reason']>('Quality rejection');
  const [dispositionRequested, setDispositionRequested] = useState<SupplierReturnRecord['dispositionRequested']>('Credit Note');
  const [linkedNcrId, setLinkedNcrId] = useState('NCR-2026-09');
  const [trackingNumber, setTrackingNumber] = useState('TRK-RET-' + Math.floor(1000 + Math.random() * 9000));
  const [notes, setNotes] = useState('Material failed ASTM melt flow index and visual contamination check.');

  const totalCreditAmount = returnQty * unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `SRET-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: SupplierReturnRecord = {
      id: newId,
      returnNumber: newId,
      supplierId: suppliers.find((s) => s.name === supplierName)?.id || 'SUP-001',
      supplierName,
      poNumber,
      grnNumber,
      itemCode,
      itemName,
      lotBatchNumber,
      returnQty,
      uom,
      unitPrice,
      creditAmount: totalCreditAmount,
      returnDate: new Date().toISOString().slice(0, 10),
      reason,
      dispositionRequested,
      status: 'draft',
      linkedNcrId: linkedNcrId || undefined,
      debitNoteNumber: `DN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      trackingNumber,
      notes,
    };
    onSave(newRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-[#14213D] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E8622C] text-white rounded-lg">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Space_Grotesk']">
                Log Material Return & Issue Debit Note
              </h3>
              <p className="text-xs text-slate-300">
                Register rejected raw materials for outward turnaround, NCR settlement, and debit memo
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Supplier & Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Supplier *</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Linked PO Number</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Linked GRN Number</label>
              <input
                type="text"
                value={grnNumber}
                onChange={(e) => setGrnNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          {/* Material Item & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Item Code *</label>
              <input
                type="text"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Material Name *</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>
          </div>

          {/* Batch & Quantities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Lot / Batch # *</label>
              <input
                type="text"
                value={lotBatchNumber}
                onChange={(e) => setLotBatchNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-purple-700 font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Return Qty *</label>
              <input
                type="number"
                value={returnQty}
                onChange={(e) => setReturnQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">UOM</label>
              <input
                type="text"
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Unit Rate (₹)</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          {/* Total Debit Box */}
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-red-900 block">Total Calculated Debit Note Amount</span>
              <span className="text-[11px] text-red-700">
                {returnQty} {uom} × ₹{unitPrice} = ₹{totalCreditAmount.toLocaleString()}
              </span>
            </div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-red-600">
              ₹{totalCreditAmount.toLocaleString()}
            </div>
          </div>

          {/* Reason & Disposition */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Defect Cause *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              >
                <option value="Quality rejection">Quality rejection</option>
                <option value="Damaged material">Damaged material</option>
                <option value="Wrong item received">Wrong item received</option>
                <option value="Excess receipt">Excess receipt</option>
                <option value="Expired material">Expired material</option>
                <option value="Supplier recall">Supplier recall</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Requested Settlement *</label>
              <select
                value={dispositionRequested}
                onChange={(e) => setDispositionRequested(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              >
                <option value="Credit Note">Credit Note</option>
                <option value="Replacement">Replacement</option>
                <option value="Refund">Refund</option>
                <option value="Repair">Repair</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Linked NCR # (Optional)</label>
              <input
                type="text"
                value={linkedNcrId}
                onChange={(e) => setLinkedNcrId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                placeholder="NCR-2026-..."
              />
            </div>
          </div>

          {/* Logistics Tracking */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Outward Gate Pass / Transport Tracking #</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Rejection Remarks & Inspector Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Save & Issue Debit Memo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// SUB-MODAL 2: View Return Detail Modal
// ----------------------------------------------------
const ReturnDetailModal: React.FC<{
  returnItem: SupplierReturnRecord;
  onClose: () => void;
  onPrint: () => void;
  onStatusChange: (id: string, st: SupplierReturnStatus) => void;
}> = ({ returnItem, onClose, onPrint, onStatusChange }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-[#14213D] text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base font-['Space_Grotesk']">
              Purchase Return Dossier: {returnItem.returnNumber}
            </h3>
            <p className="text-xs text-slate-300">
              Supplier: {returnItem.supplierName} • {returnItem.returnDate}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Workflow Status</span>
              <div>
                <ProcurementStatusBadge status={returnItem.status} size="sm" />
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Debit Amount</span>
              <div className="text-xl font-bold font-['Space_Grotesk'] text-red-600">
                ₹{(Number(returnItem.creditAmount) || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Material Code & Name</span>
              <strong className="text-slate-900">{returnItem.itemName}</strong>
              <div className="text-[11px] font-mono text-slate-500">{returnItem.itemCode}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Batch & Quantity</span>
              <strong className="font-mono text-purple-700">{returnItem.lotBatchNumber}</strong>
              <div className="text-[11px] text-slate-600">
                {(Number(returnItem.returnQty) || 0).toLocaleString()} {returnItem.uom}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Defect Reason</span>
              <span className="font-bold text-red-700">{returnItem.reason}</span>
              {returnItem.linkedNcrId && (
                <div className="text-[10px] text-slate-500">NCR: {returnItem.linkedNcrId}</div>
              )}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Debit Note & Gate Pass</span>
              <div className="font-mono font-bold text-slate-800">{returnItem.debitNoteNumber || 'Pending DN'}</div>
              <div className="text-[10px] text-emerald-700">{returnItem.trackingNumber || 'Local Outward Challan'}</div>
            </div>
          </div>

          <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-1">
            <span className="text-[10px] text-red-700 uppercase font-bold block">Rejection Cause Description</span>
            <p className="text-slate-800 italic">{returnItem.notes}</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Debit Note Voucher
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#14213D] text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// SUB-MODAL 3: Printable Debit Note Voucher
// ----------------------------------------------------
const PrintDebitNoteModal: React.FC<{
  returnItem: SupplierReturnRecord;
  onClose: () => void;
}> = ({ returnItem, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const gstTax = (Number(returnItem.creditAmount) || 0) * 0.18;
  const grandTotal = (Number(returnItem.creditAmount) || 0) + gstTax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <span className="font-bold text-sm">Vendor Debit Note Voucher Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#E8622C] text-white rounded-lg text-xs font-bold hover:bg-[#d45320] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Voucher
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800 font-sans bg-white">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h2 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
                SP-PLASTECH MANUFACTURING LTD
              </h2>
              <p className="text-[11px] text-slate-500">
                Plot 42-45, Polymer Zone, GIDC Industrial Estate, Halol, Gujarat - 389350<br />
                GSTIN: 24AAACS1234F1Z8 • Email: accounts@sp-plastech.com
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-extrabold uppercase rounded">
                DEBIT NOTE MEMO
              </span>
              <div className="text-sm font-bold font-mono mt-2">{returnItem.debitNoteNumber || 'DN-2026-014'}</div>
              <div className="text-[11px] text-slate-500">Date: {returnItem.returnDate}</div>
            </div>
          </div>

          {/* Supplier Info & Reference */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">DEBITED TO (VENDOR)</span>
              <strong className="text-sm text-slate-900 block">{returnItem.supplierName}</strong>
              <div className="text-slate-600 text-[11px]">Vendor Code: {returnItem.supplierId}</div>
              <div className="text-slate-600 text-[11px]">Reason: {returnItem.reason}</div>
            </div>
            <div className="space-y-1 text-[11px]">
              <div><strong>Return RMA #:</strong> {returnItem.returnNumber}</div>
              <div><strong>Original PO #:</strong> {returnItem.poNumber}</div>
              <div><strong>Inward GRN #:</strong> {returnItem.grnNumber}</div>
              <div><strong>Outward Pass #:</strong> {returnItem.trackingNumber}</div>
            </div>
          </div>

          {/* Line Item Table */}
          <table className="w-full text-xs text-left border border-slate-300">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] border-b border-slate-300">
              <tr>
                <th className="p-2.5">Item Description</th>
                <th className="p-2.5">Batch / Lot #</th>
                <th className="p-2.5 text-right">Rejected Qty</th>
                <th className="p-2.5 text-right">Unit Rate (₹)</th>
                <th className="p-2.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2.5 font-bold">
                  {returnItem.itemName}
                  <div className="text-[10px] font-mono text-slate-500">{returnItem.itemCode}</div>
                </td>
                <td className="p-2.5 font-mono text-purple-800">{returnItem.lotBatchNumber}</td>
                <td className="p-2.5 text-right font-semibold">
                  {(Number(returnItem.returnQty) || 0).toLocaleString()} {returnItem.uom}
                </td>
                <td className="p-2.5 text-right font-mono">₹{(Number(returnItem.unitPrice) || 0).toFixed(2)}</td>
                <td className="p-2.5 text-right font-bold">
                  ₹{(Number(returnItem.creditAmount) || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total Calculation */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Base Debit):</span>
                <span className="font-mono font-bold">₹{(Number(returnItem.creditAmount) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Reversal (18%):</span>
                <span className="font-mono">₹{gstTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-red-600 pt-1.5 border-t border-slate-300">
                <span>Total Debit Amount:</span>
                <span>₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Remarks & Signatures */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 block mb-0.5">Commercial & Quality Note:</span>
            <p className="text-[11px] text-slate-600">
              {returnItem.notes} Please adjust this amount against pending Invoice payments or provide a Credit Note / Replacement as requested.
            </p>
          </div>

          <div className="grid grid-cols-2 pt-8 text-center text-xs">
            <div>
              <div className="border-t border-slate-400 w-40 mx-auto pt-1 font-bold">QA / Inward Inspector</div>
              <span className="text-[10px] text-slate-400">Dr. Anita Mehta</span>
            </div>
            <div>
              <div className="border-t border-slate-400 w-40 mx-auto pt-1 font-bold">Commercial Accounts Head</div>
              <span className="text-[10px] text-slate-400">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
