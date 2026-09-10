import React, { useState } from 'react';
import {
  Building,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  Upload,
  Send,
  Search,
  Filter,
  Eye,
  Award,
  Clock,
} from 'lucide-react';
import { mockSupplierCollaboration } from '../../data/mockScmData';
import { SupplierCollaborationPO } from '../../types/scm';

interface ScmSupplierCollaborationViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmSupplierCollaborationView: React.FC<ScmSupplierCollaborationViewProps> = ({ onNavigate, showToast }) => {
  const [pos, setPos] = useState<SupplierCollaborationPO[]>(mockSupplierCollaboration);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAsnModalOpen, setIsAsnModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<SupplierCollaborationPO | null>(null);

  const handleSendReminder = (po: SupplierCollaborationPO) => {
    showToast(`Sent EDI Reminder & Email Notification to ${po.supplierName} for PO ${po.poNumber}`);
  };

  const handleApproveDeliveryChange = (po: SupplierCollaborationPO) => {
    setPos((prev) =>
      prev.map((p) => (p.id === po.id ? { ...p, deliveryStatus: 'Dispatched', actionNeeded: 'Delivery revised & approved' } : p))
    );
    showToast(`Approved revised dispatch schedule for ${po.poNumber}`);
  };

  const filteredPos = pos.filter(
    (p) =>
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-semibold uppercase">
              Supplier Collaboration Portal
            </span>
            <span className="text-xs text-slate-500">· Real-Time Supplier Commitments &amp; ASN Gateway</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Supplier Collaboration &amp; Advance Shipping Notices (ASN)
          </h1>
          <p className="text-slate-500 text-xs">
            Coordinate purchase order acknowledgments, dispatch dates, digital COA/MSDS uploads, and supplier quality scorecard metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('scmSupplierRisk')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-purple-600" />
            <span>Supplier Risk &amp; Scorecards</span>
          </button>
        </div>
      </div>

      {/* Supplier Collaboration Summary Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Active Open Purchase Orders</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            {pos.length} POs
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Polymers &amp; Additives</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">ASNs Received &amp; Verified</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-600 mt-1">
            {pos.filter((p) => p.asnStatus === 'Verified' || p.asnStatus === 'Submitted').length} / {pos.length}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Pre-arrival clearance</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Missing COA / Documents</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-rose-600 mt-1">
            {pos.filter((p) => p.documentStatus.includes('Missing')).length} POs
          </div>
          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">Pending Lab Compliance</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Supplier OTD Rating</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-[#0F8B8D] mt-1">
            91.8%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Weighted across all vendors</div>
        </div>
      </div>

      {/* Collaboration PO Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk']">
            Supplier Purchase Order Tracking &amp; ASN Gateway
          </h3>
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Supplier, PO #, Resin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Supplier &amp; PO Number</th>
                <th className="p-3">Item / Resin</th>
                <th className="p-3 text-right">Order Qty</th>
                <th className="p-3">Required Date</th>
                <th className="p-3">Promised Date</th>
                <th className="p-3">ASN Status</th>
                <th className="p-3">Document Compliance</th>
                <th className="p-3">Delivery Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPos.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{po.supplierName}</div>
                    <div className="text-[11px] font-mono text-[#0F8B8D] font-semibold">{po.poNumber}</div>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-mono">
                      Scorecard: Grade {po.scorecardGrade}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{po.itemCode}</div>
                    <div className="text-[11px] text-slate-500">{po.itemName}</div>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {po.orderQty.toLocaleString()} {po.uom}
                  </td>
                  <td className="p-3 font-mono text-slate-700">{po.requiredDate}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">{po.promisedDate}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        po.asnStatus === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : po.asnStatus === 'Discrepancy'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {po.asnNumber || po.asnStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[11px] font-medium block ${
                        po.documentStatus.includes('Missing') ? 'text-rose-600 font-bold' : 'text-emerald-700'
                      }`}
                    >
                      {po.documentStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        po.deliveryStatus === 'Delayed'
                          ? 'bg-rose-100 text-rose-800'
                          : po.deliveryStatus === 'Customs Hold'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {po.deliveryStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <button
                      onClick={() => handleSendReminder(po)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                      title="Send Reminder"
                    >
                      Remind
                    </button>
                    {po.deliveryStatus === 'Delayed' && (
                      <button
                        onClick={() => handleApproveDeliveryChange(po)}
                        className="px-2 py-1 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded text-[11px] font-bold transition"
                      >
                        Approve Change
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
