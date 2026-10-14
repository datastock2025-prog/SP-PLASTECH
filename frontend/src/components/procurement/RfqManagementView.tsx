import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  FileText,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  Scale,
  Users,
} from 'lucide-react';
import { RequestForQuotation, SupplierMaster } from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  rfqs: RequestForQuotation[];
  suppliers: SupplierMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateRFQ: (rfq: RequestForQuotation) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const RfqManagementView: React.FC<Props> = ({
  rfqs,
  suppliers,
  onNavigate,
  onUpdateRFQ,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRfqs = rfqs.filter((r) => {
    const matchSearch =
      r.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.items.some((i) => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = selectedStatus === 'All' || r.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredRfqs.length / pageSize) || 1;
  const paginatedRfqs = filteredRfqs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenCreateDrawer = () => {
    let formNumber = `RFQ-2026-${Math.floor(100 + Math.random() * 900)}`;
    let formTitle = '';
    let formDueDate = '2026-09-05';
    let formItemName = 'PP Natural Injection Grade Resin';
    let formQty = 15000;
    let formUom = 'KG';

    const handleCreate = () => {
      if (!formTitle) {
        alert('Please enter RFQ Title');
        return;
      }

      const newRfq: RequestForQuotation = {
        id: formNumber,
        rfqNumber: formNumber,
        title: formTitle,
        sourcePrNumber: 'PR-2026-081',
        createdDate: new Date().toISOString().slice(0, 10),
        closingDate: formDueDate,
        requiredDeliveryDate: '2026-09-12',
        owner: 'Procurement Specialist',
        status: 'sent',
        incoterms: 'DDP (Delivered Duty Paid)',
        shippingTerms: 'Road Freight',
        paymentTerms: 'Net 30 Days',
        currency: 'INR (₹)',
        submissionInstructions: 'Submit sealed technical and commercial bids.',
        responsesCount: 0,
        invitedSuppliers: [
          {
            supplierId: 'SUP-001',
            supplierName: 'Reliance Polymers Ltd',
            supplierEmail: 'sales@ril.com',
            status: 'Invited',
            invitedDate: new Date().toISOString().slice(0, 10),
          },
          {
            supplierId: 'SUP-002',
            supplierName: 'Indian Oil Corporation Ltd',
            supplierEmail: 'polymers@iocl.co.in',
            status: 'Invited',
            invitedDate: new Date().toISOString().slice(0, 10),
          },
          {
            supplierId: 'SUP-003',
            supplierName: 'GAIL Polymers Division',
            supplierEmail: 'info@gail.co.in',
            status: 'Invited',
            invitedDate: new Date().toISOString().slice(0, 10),
          }
        ],
        lines: [
          {
            lineNo: 1,
            itemCode: 'RM-PP-NAT-001',
            itemName: formItemName,
            description: 'Virgin Polymer Injection Grade',
            quantity: formQty,
            uom: formUom,
            targetPrice: 78.0,
            historicalPrice: 80.0,
            requiredDate: '2026-09-12',
            technicalSpecs: 'MFI 11-13 g/10min, Density 0.905 g/cm3',
            coaRequired: true,
            msdsRequired: true,
          }
        ],
      };

      onUpdateRFQ(newRfq);
      closeDrawer();
      showToast(`RFQ ${formNumber} broadcasted to 3 polymer suppliers via email`);
    };

    openDrawer(
      'Issue Request for Quotation (RFQ)',
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[#14213D] text-white rounded-xl">
          <div className="text-[10px] text-[#0F8B8D] font-bold uppercase">Competitive Sourcing</div>
          <div className="font-bold text-sm">Multi-Vendor Price & Technical Bidding</div>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">RFQ Number</label>
          <input
            type="text"
            defaultValue={formNumber}
            onChange={(e) => (formNumber = e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono text-xs"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">RFQ Title / Subject *</label>
          <input
            type="text"
            placeholder="e.g. Sourcing 15 MT Polypropylene Copolymer for Automotive Trays"
            onChange={(e) => (formTitle = e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Quotation Due Date</label>
            <input
              type="date"
              defaultValue={formDueDate}
              onChange={(e) => (formDueDate = e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Target Quantity</label>
            <input
              type="number"
              defaultValue={formQty}
              onChange={(e) => (formQty = Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Material Description & Grade</label>
          <input
            type="text"
            defaultValue={formItemName}
            onChange={(e) => (formItemName = e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-xs"
          />
        </div>

        <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
          <div className="font-semibold text-slate-700">Suppliers to Auto-Invite</div>
          <div className="space-y-1 text-slate-600">
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded text-[#0F8B8D]" />
              <span>Reliance Polymers Ltd (Tier-1)</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded text-[#0F8B8D]" />
              <span>Indian Oil Corporation Ltd (IOCL)</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded text-[#0F8B8D]" />
              <span>GAIL Polymers Division</span>
            </div>
          </div>
        </div>
      </div>,
      <div className="flex justify-end gap-2">
        <button
          onClick={closeDrawer}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm"
        >
          Broadcast RFQ
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Request for Quotations (RFQ)
          </h1>
          <p className="text-xs text-slate-500">
            Send inquiries to multiple suppliers, collect structured bids, and run weighted comparison analysis
          </p>
        </div>

        <button
          onClick={handleOpenCreateDrawer}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Issue RFQ
        </button>
      </div>

      {/* RFQ Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by RFQ #, title, or material SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
        >
          <option value="All">All Statuses</option>
          <option value="sent">Sent to Suppliers</option>
          <option value="response_received">Responses Received</option>
          <option value="awarded">Awarded</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* RFQ Cards / Table */}
      <div className="grid grid-cols-1 gap-4">
        {paginatedRfqs.map((rfq) => (
          <div
            key={rfq.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-[#0F8B8D] transition space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#14213D]">{rfq.rfqNumber}</span>
                  <ProcurementStatusBadge status={rfq.status} />
                  <span className="text-[11px] text-slate-500">Ref: {rfq.sourcePrNumber || 'Manual'}</span>
                </div>
                <h3 className="font-bold text-base text-[#14213D] mt-0.5">{rfq.title}</h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Bidding Deadline</div>
                  <div className="font-bold text-[#14213D]">{rfq.closingDate}</div>
                </div>

                <button
                  onClick={() => onNavigate('rfqCompare', { rfqNumber: rfq.rfqNumber })}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold transition shadow-sm"
                >
                  <Scale className="w-3.5 h-3.5 text-[#0F8B8D]" /> Compare Quotes Matrix
                </button>
              </div>
            </div>

            {/* Invited Suppliers Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {rfq.invitedSuppliers.map((sup, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#14213D]">{sup.supplierName}</div>
                    <div className="text-[10px] text-slate-400">Invited: {sup.invitedDate}</div>
                  </div>
                  <ProcurementStatusBadge status={sup.status} size="xs" />
                </div>
              ))}
            </div>

            {/* Target Item summary */}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-lg text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#14213D]">{rfq.lines[0]?.itemCode}</span>
                <span>• {rfq.lines[0]?.itemName}</span>
                <span className="font-bold text-[#14213D]">({(rfq.lines[0]?.quantity ?? 0).toLocaleString()} {rfq.lines[0]?.uom || 'KG'})</span>
              </div>
              <div>
                <span className="text-slate-400">Target Budget Price: </span>
                <span className="font-bold text-emerald-700">₹{rfq.lines[0]?.targetPrice || 0} / {rfq.lines[0]?.uom || 'KG'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredRfqs.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
        itemName="RFQs"
      />
    </div>
  );
};
