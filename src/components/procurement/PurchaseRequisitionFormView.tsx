import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Save,
  Send,
  Sparkles,
  Calendar,
  Building,
  User,
  DollarSign,
} from 'lucide-react';
import {
  PurchaseRequisition,
  PurchaseRequisitionLine,
  SupplierMaster,
} from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';

interface Props {
  prId?: string;
  prs: PurchaseRequisition[];
  suppliers: SupplierMaster[];
  onNavigate: (view: string, param?: any) => void;
  onSavePR: (pr: PurchaseRequisition) => void;
  showToast: (msg: string) => void;
}

export const PurchaseRequisitionFormView: React.FC<Props> = ({
  prId,
  prs,
  suppliers,
  onNavigate,
  onSavePR,
  showToast,
}) => {
  const existingPr = prs.find((p) => p.id === prId);
  const isEditing = Boolean(existingPr);

  const [prNumber, setPrNumber] = useState(existingPr?.prNumber || `PR-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [requestedBy, setRequestedBy] = useState(existingPr?.requestedBy || 'Priya Rao (Store Manager)');
  const [department, setDepartment] = useState(existingPr?.department || 'Warehouse & Inventory');
  const [plantWarehouse, setPlantWarehouse] = useState(existingPr?.plantWarehouse || 'RM-WH-01 (Main Plant)');
  const [requestDate, setRequestDate] = useState(existingPr?.requestDate || new Date().toISOString().slice(0, 10));
  const [requiredDate, setRequiredDate] = useState(existingPr?.requiredDate || '2026-09-08');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>(existingPr?.priority || 'High');
  const [source, setSource] = useState(existingPr?.source || 'Manual');
  const [justification, setJustification] = useState(existingPr?.justification || '');
  const [notes, setNotes] = useState(existingPr?.notes || '');
  const [status, setStatus] = useState(existingPr?.status || 'draft');

  const [lines, setLines] = useState<PurchaseRequisitionLine[]>(
    existingPr?.lines || [
      {
        id: 'PRL-1',
        lineNo: 1,
        itemCode: 'RM-PP-NAT-001',
        itemName: 'PP Natural Granules H110MA',
        itemCategory: 'Polypropylene',
        description: 'MFI 12 g/10min injection grade resin',
        quantity: 10000,
        uom: 'KG',
        requiredDate: '2026-09-08',
        suggestedSupplierId: 'SUP-001',
        suggestedSupplierName: 'Reliance Polymers Ltd',
        estimatedUnitPrice: 78.5,
        estimatedTotal: 785000,
        workOrderRef: 'WO-1188',
        status: 'pending',
      }
    ]
  );

  const totalEstimated = lines.reduce((acc, l) => acc + (l.estimatedTotal || 0), 0);

  const handleAddLine = () => {
    const newLine: PurchaseRequisitionLine = {
      id: `PRL-${Date.now()}`,
      lineNo: lines.length + 1,
      itemCode: 'RM-HD-GRN-014',
      itemName: 'HDPE Granules B56003',
      itemCategory: 'Polyethylene',
      description: 'Blow molding polymer',
      quantity: 5000,
      uom: 'KG',
      requiredDate: requiredDate,
      suggestedSupplierId: 'SUP-001',
      suggestedSupplierName: 'Reliance Polymers Ltd',
      estimatedUnitPrice: 84.0,
      estimatedTotal: 420000,
      status: 'pending',
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleUpdateLine = (idx: number, field: keyof PurchaseRequisitionLine, value: any) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'quantity' || field === 'estimatedUnitPrice') {
      const q = field === 'quantity' ? Number(value) : updated[idx].quantity;
      const p = field === 'estimatedUnitPrice' ? Number(value) : updated[idx].estimatedUnitPrice;
      updated[idx].estimatedTotal = q * p;
    }
    setLines(updated);
  };

  const handleSave = (submitForApproval = false) => {
    const newPr: PurchaseRequisition = {
      id: existingPr?.id || prNumber,
      prNumber,
      requestDate,
      requestedBy,
      department,
      plantWarehouse,
      requiredDate,
      priority,
      source,
      currency: 'INR (₹)',
      estimatedTotal: totalEstimated,
      budgetAllocated: 1500000,
      budgetRemaining: 1500000 - totalEstimated,
      budgetExceeded: totalEstimated > 1500000,
      status: submitForApproval ? 'pending_approval' : status,
      approvalStatus: submitForApproval ? 'pending' : (existingPr?.approvalStatus || 'pending'),
      justification,
      notes,
      lines,
      approvalHistory: existingPr?.approvalHistory || [
        {
          step: 1,
          role: 'Department Head',
          user: requestedBy,
          action: 'Approved',
          date: new Date().toISOString().slice(0, 10),
          comment: 'Submitted for approval',
        }
      ]
    };

    onSavePR(newPr);
    showToast(submitForApproval ? `PR ${prNumber} submitted for multi-level approval` : `PR ${prNumber} saved as draft`);
    onNavigate('prList');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('prList')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#14213D] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to PR List
        </button>

        <div className="flex items-center gap-2">
          {existingPr && existingPr.status === 'pending_approval' && (
            <>
              <button
                onClick={() => {
                  const updated = {
                    ...existingPr,
                    status: 'rejected' as const,
                    approvalStatus: 'rejected' as const,
                  };
                  onSavePR(updated);
                  showToast(`PR ${prNumber} Rejected`);
                  onNavigate('prList');
                }}
                className="px-3.5 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold"
              >
                Reject PR
              </button>

              <button
                onClick={() => {
                  const updated = {
                    ...existingPr,
                    status: 'approved' as const,
                    approvalStatus: 'approved' as const,
                  };
                  onSavePR(updated);
                  showToast(`PR ${prNumber} Approved for PO creation`);
                  onNavigate('prList');
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Approve PR
              </button>
            </>
          )}

          <button
            onClick={() => handleSave(false)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-[#14213D] rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>

          <button
            onClick={() => handleSave(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Send className="w-3.5 h-3.5" /> Submit for Approval
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Header Summary */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
                {isEditing ? `Purchase Requisition: ${prNumber}` : 'Create Purchase Requisition'}
              </h1>
              {existingPr && <ProcurementStatusBadge status={existingPr.status} />}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify raw materials, required delivery dates, estimated budget, and linked production work orders
            </p>
          </div>

          <div className="text-right bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Estimated Total</div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
              ₹{(totalEstimated / 100000).toFixed(2)} Lakhs
            </div>
          </div>
        </div>

        {/* Requisition Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">PR Number</label>
            <input
              type="text"
              value={prNumber}
              onChange={(e) => setPrNumber(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Requester & Dept</label>
            <input
              type="text"
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Plant / Receiving Warehouse</label>
            <select
              value={plantWarehouse}
              onChange={(e) => setPlantWarehouse(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
            >
              <option value="RM-WH-01 (Main Plant)">RM-WH-01 (Main Plant)</option>
              <option value="RM-WH-02 (Additive Store)">RM-WH-02 (Additive Store)</option>
              <option value="SP-WH-01 (Tooling Store)">SP-WH-01 (Tooling Store)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-semibold"
            >
              <option value="Urgent">Urgent (Production Stop Risk)</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Request Date</label>
            <input
              type="date"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Required Delivery Date</label>
            <input
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Requisition Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
            >
              <option value="MRP">MRP Shortage Calculation</option>
              <option value="Production Work Order">Production Work Order</option>
              <option value="Warehouse Reorder">Warehouse Safety Buffer</option>
              <option value="Maintenance Job">Maintenance Job</option>
              <option value="Manual">Manual Entry</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Budget Allocation Status</label>
            <div className="p-2 border rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-[11px] flex items-center justify-between">
              <span>₹15.0L Budget</span>
              <span>Within Limit</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#14213D]">Requisition Line Items ({lines.length})</h3>
            <button
              onClick={handleAddLine}
              className="flex items-center gap-1 text-xs font-semibold text-[#0F8B8D] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Add Material Line
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item / Description</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3">UOM</th>
                  <th className="py-2.5 px-3">Suggested Vendor</th>
                  <th className="py-2.5 px-3 text-right">Est. Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  <th className="py-2.5 px-3 text-center">Work Order</th>
                  <th className="py-2.5 px-3 text-center">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line, idx) => (
                  <tr key={line.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={line.itemName}
                        onChange={(e) => handleUpdateLine(idx, 'itemName', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs font-semibold text-[#14213D]"
                      />
                      <input
                        type="text"
                        placeholder="Polymer specs / MFI / Grade"
                        value={line.description || ''}
                        onChange={(e) => handleUpdateLine(idx, 'description', e.target.value)}
                        className="w-full px-2 py-0.5 border rounded text-[11px] text-slate-500 mt-1"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => handleUpdateLine(idx, 'quantity', Number(e.target.value))}
                        className="w-24 px-2 py-1 border rounded text-xs text-right font-bold"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={line.uom}
                        onChange={(e) => handleUpdateLine(idx, 'uom', e.target.value)}
                        className="px-2 py-1 border rounded text-xs"
                      >
                        <option value="KG">KG</option>
                        <option value="PCS">PCS</option>
                        <option value="SET">SET</option>
                        <option value="MTR">MTR</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={line.suggestedSupplierName || ''}
                        onChange={(e) => handleUpdateLine(idx, 'suggestedSupplierName', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        value={line.estimatedUnitPrice}
                        onChange={(e) => handleUpdateLine(idx, 'estimatedUnitPrice', Number(e.target.value))}
                        className="w-24 px-2 py-1 border rounded text-xs text-right font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-[#14213D]">
                      ₹{(line.estimatedTotal || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="text"
                        placeholder="e.g. WO-1188"
                        value={line.workOrderRef || ''}
                        onChange={(e) => handleUpdateLine(idx, 'workOrderRef', e.target.value)}
                        className="w-20 px-1 py-1 border rounded text-[11px] font-mono text-center"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      {lines.length > 1 && (
                        <button
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Justification & Approval Trail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Business Justification</label>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State reason for requisition (e.g. safety stock breach, export work order commitment)..."
              className="w-full p-2.5 border rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Approval Workflow Status</label>
            <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">1. Department Verification</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">2. Plant Budget Approval</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">3. Procurement VP Sign-off</span>
                <span className="text-amber-600 font-bold">Pending Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
