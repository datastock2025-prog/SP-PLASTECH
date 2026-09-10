import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Upload,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  FileText,
} from 'lucide-react';
import { Complaint, ComplaintSeverity, ComplaintStatus } from '../../types/crm';
import { mockComplaints, mockAccounts } from '../../data/mockCrmData';

interface CrmComplaintManagementViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
  initialAccountId?: string;
}

export const CrmComplaintManagementView: React.FC<CrmComplaintManagementViewProps> = ({
  onNavigate,
  showToast,
  initialAccountId,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(complaints[0]);
  const [showLogModal, setShowLogModal] = useState(false);

  const [newComplaint, setNewComplaint] = useState<Partial<Complaint>>({
    complaintNumber: `CMP-2026-0${complaints.length + 84}`,
    accountId: initialAccountId || mockAccounts[0].id,
    accountName: mockAccounts[0].accountName,
    complaintCategory: 'Polymer Degradation / Black Specks',
    severity: 'Major',
    status: 'Open',
    batchNumber: 'BATCH-2026-PP-092',
    defectDescription: '',
    affectedQuantity: 2500,
    uom: 'KG',
    dateLogged: '2026-09-01',
    targetResolutionDate: '2026-09-08',
    assignedTo: 'Anand Kulkarni (QA Head)',
  });

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      if (initialAccountId && c.accountId !== initialAccountId) return false;
      if (severityFilter !== 'All' && c.severity !== severityFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.complaintNumber.toLowerCase().includes(q) ||
          c.accountName.toLowerCase().includes(q) ||
          c.complaintCategory.toLowerCase().includes(q) ||
          (c.batchNumber && c.batchNumber.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [complaints, initialAccountId, severityFilter, statusFilter, searchQuery]);

  const handleUpdateStatus = (complaintId: string, status: ComplaintStatus) => {
    setComplaints(prev =>
      prev.map(c => (c.id === complaintId ? { ...c, status } : c))
    );
    if (selectedComplaint?.id === complaintId) {
      setSelectedComplaint(prev => (prev ? { ...prev, status } : null));
    }
    showToast(`Complaint status set to ${status}`);
  };

  const handleLogComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedAccount = mockAccounts.find(a => a.id === newComplaint.accountId);
    const created: Complaint = {
      id: `CMP-0${complaints.length + 1}`,
      complaintNumber: newComplaint.complaintNumber || `CMP-2026-099`,
      accountId: newComplaint.accountId || mockAccounts[0].id,
      accountName: matchedAccount ? matchedAccount.accountName : 'Customer Account',
      complaintCategory: newComplaint.complaintCategory || 'Flash / Dimensional Variation',
      severity: newComplaint.severity as ComplaintSeverity || 'Major',
      status: 'Open',
      batchNumber: newComplaint.batchNumber || 'BATCH-2026-PP-999',
      defectDescription: newComplaint.defectDescription || 'Visual inspection rejection on customer assembly line',
      affectedQuantity: Number(newComplaint.affectedQuantity) || 1000,
      uom: 'KG',
      dateLogged: '2026-09-01',
      targetResolutionDate: newComplaint.targetResolutionDate || '2026-09-08',
      assignedTo: 'Anand Kulkarni (QA Lead)',
      capaStatus: 'Containment Action Initiated',
    };

    setComplaints([created, ...complaints]);
    setSelectedComplaint(created);
    setShowLogModal(false);
    showToast(`Complaint ${created.complaintNumber} logged and assigned to QA Engineering!`);
  };

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(2)} Lakhs`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              Customer Quality & 8D CAPA
            </span>
            <span className="text-xs text-slate-500">{filteredComplaints.length} Tickets active</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Complaints & Quality Incident Tracker</h1>
          <p className="text-sm text-slate-600">
            Enforce 8D root-cause problem solving for molding flash, dimensional shrinkage, color masterbatch delta E, and batch contamination.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Log Quality Complaint
        </button>
      </div>

      {/* Two Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Complaints List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket, customer, defect..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="All">All Severity</option>
              <option value="Critical">Critical</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
            </select>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto">
            {filteredComplaints.map(complaint => (
              <div
                key={complaint.id}
                onClick={() => setSelectedComplaint(complaint)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  selectedComplaint?.id === complaint.id
                    ? 'bg-rose-50/50 border-rose-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900 font-mono">
                    {complaint.complaintNumber}
                  </div>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                    complaint.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                    complaint.severity === 'Major' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {complaint.severity}
                  </span>
                </div>

                <div className="font-semibold text-xs text-slate-800">{complaint.accountName}</div>
                <div className="text-xs text-slate-600 font-medium truncate">{complaint.complaintCategory}</div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="font-mono">Batch: {complaint.batchNumber || 'N/A'}</span>
                  <span className="font-semibold text-rose-700">{complaint.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: 8D CAPA Report & Investigation Desk (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedComplaint ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-rose-900">
                      {selectedComplaint.complaintNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                      {selectedComplaint.severity}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{selectedComplaint.accountName}</div>
                  <div className="text-xs text-slate-500">Logged: {selectedComplaint.dateLogged} | Target: {selectedComplaint.targetResolutionDate}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`Generated formal 8D CAPA PDF for ${selectedComplaint.complaintNumber}`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    8D Report
                  </button>
                  <button
                    onClick={() => showToast(`Credit Note generated for ₹45,000`)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Issue Credit Note
                  </button>
                </div>
              </div>

              {/* Defect Description */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <span className="font-bold text-slate-700 block">Defect Statement & Affected Quantity:</span>
                <p className="text-slate-800 font-medium">{selectedComplaint.defectDescription}</p>
                <div className="text-[11px] text-slate-500 pt-1">
                  Affected Batch: <strong className="font-mono text-slate-800">{selectedComplaint.batchNumber}</strong> ({selectedComplaint.affectedQuantity.toLocaleString()} {selectedComplaint.uom})
                </div>
              </div>

              {/* 8D Problem Solving Status */}
              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-rose-900 uppercase text-[11px]">8D Corrective & Preventive Action (CAPA)</h3>
                  <span className="font-bold text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-200">
                    {selectedComplaint.capaStatus || 'In Progress'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 bg-white rounded-lg border border-rose-100">
                    <span className="font-bold text-slate-800 block mb-0.5">Root Cause (5-Why Analysis):</span>
                    <p className="text-slate-700">
                      {selectedComplaint.rootCause || 'Extruder zone 4 heating element degradation caused localized polymer overheating and charred degraded black specs.'}
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-rose-100">
                    <span className="font-bold text-slate-800 block mb-0.5">Corrective & Preventive Action (CAPA):</span>
                    <p className="text-slate-700">
                      {selectedComplaint.correctiveAction || 'Replaced thermocouple on Extruder #3, installed inline optical melt purity camera, and updated PM checklist to bi-weekly thermocouple calibration.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">QA Lead: <strong>{selectedComplaint.assignedTo}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedComplaint.id, 'Resolved')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedComplaint.id, 'Closed')}
                    className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Close Ticket
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a quality ticket to inspect root cause findings and 8D CAPA sign-off.
            </div>
          )}
        </div>
      </div>

      {/* Log Complaint Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Log Customer Quality Issue</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleLogComplaint} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Account *</label>
                  <select
                    value={newComplaint.accountId}
                    onChange={(e) => {
                      const acc = mockAccounts.find(a => a.id === e.target.value);
                      setNewComplaint({ ...newComplaint, accountId: e.target.value, accountName: acc?.accountName });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    {mockAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Defect Category</label>
                  <select
                    value={newComplaint.complaintCategory}
                    onChange={(e) => setNewComplaint({ ...newComplaint, complaintCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Polymer Degradation / Black Specks">Polymer Degradation / Black Specks</option>
                    <option value="Molding Flash / Parting Line Burrs">Molding Flash / Parting Line Burrs</option>
                    <option value="Dimensional Shrinkage / Warpage">Dimensional Shrinkage / Warpage</option>
                    <option value="Color Masterbatch Delta E Mismatch">Color Masterbatch Delta E Mismatch</option>
                    <option value="Short Shot / Sink Mark Defect">Short Shot / Sink Mark Defect</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity Rating</label>
                  <select
                    value={newComplaint.severity}
                    onChange={(e) => setNewComplaint({ ...newComplaint, severity: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Critical">Critical (Line Stoppage)</option>
                    <option value="Major">Major (High Scrap)</option>
                    <option value="Minor">Minor (Aesthetic)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    required
                    placeholder="BATCH-2026-PP-104"
                    value={newComplaint.batchNumber}
                    onChange={(e) => setNewComplaint({ ...newComplaint, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Detailed Defect Description</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 15% parts exhibiting sink marks near boss bosses during assembly..."
                    value={newComplaint.defectDescription}
                    onChange={(e) => setNewComplaint({ ...newComplaint, defectDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Submit to Quality Engineering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
