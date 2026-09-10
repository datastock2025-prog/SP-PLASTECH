import React, { useState } from 'react';
import { QualityDocument, QualityAudit } from '../../types';
import { INITIAL_QUALITY_DOCS, INITIAL_AUDITS } from '../../data/initialData';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  Download,
  Eye,
  CheckSquare,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const DocControlAuditView: React.FC<Props> = ({
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'audits'>('docs');

  // Docs State
  const [docs, setDocs] = useState<QualityDocument[]>(INITIAL_QUALITY_DOCS);
  const [selectedDocId, setSelectedDocId] = useState<string>(INITIAL_QUALITY_DOCS[0]?.id || 'SOP-QC-001');
  const [docSearch, setDocSearch] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('all');

  // Audits State
  const [audits, setAudits] = useState<QualityAudit[]>(INITIAL_AUDITS);
  const [selectedAuditId, setSelectedAuditId] = useState<string>(INITIAL_AUDITS[0]?.id || 'AUD-2026-004');
  const [auditSearch, setAuditSearch] = useState('');

  // Filtered Docs
  const filteredDocs = docs.filter((d) => {
    const matchesCat = docCategoryFilter === 'all' || d.category === docCategoryFilter;
    const matchesSearch =
      d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.id.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.owner.toLowerCase().includes(docSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const selectedDoc = docs.find((d) => d.id === selectedDocId) || filteredDocs[0] || docs[0];

  // Filtered Audits
  const filteredAudits = audits.filter((a) => {
    return (
      a.id.toLowerCase().includes(auditSearch.toLowerCase()) ||
      a.scope.toLowerCase().includes(auditSearch.toLowerCase()) ||
      a.auditor.toLowerCase().includes(auditSearch.toLowerCase()) ||
      a.standard.toLowerCase().includes(auditSearch.toLowerCase())
    );
  });

  const selectedAudit = audits.find((a) => a.id === selectedAuditId) || filteredAudits[0] || audits[0];

  const handleOpenNewDocDrawer = () => {
    let id = `SOP-QC-0${docs.length + 10}`;
    let title = '';
    let category: QualityDocument['category'] = 'SOP';
    let rev = '1';
    let effectiveDate = '2026-09-01';
    let reviewDate = '2027-09-01';
    let owner = 'Quality Assurance Lead';

    openDrawer(
      'Create New Controlled Quality Document (DCC)',
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Document Control #</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-[#F6F4EF] font-mono"
              defaultValue={id}
              onChange={(e) => (id = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Document Category</label>
            <select
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-white"
              defaultValue={category}
              onChange={(e) => (category = e.target.value as any)}
            >
              <option value="SOP">SOP (Standard Operating Procedure)</option>
              <option value="Work Instruction">Work Instruction (WI)</option>
              <option value="Specification">Technical Specification</option>
              <option value="Form">Form / Checklist</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">Document Title</label>
          <input
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            placeholder="e.g. Statistical Process Control (SPC) Out-of-Control Action Plan"
            defaultValue={title}
            onChange={(e) => (title = e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Revision Level</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={rev}
              onChange={(e) => (rev = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Effective Date</label>
            <input
              type="date"
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={effectiveDate}
              onChange={(e) => (effectiveDate = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Periodic Review Date</label>
            <input
              type="date"
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={reviewDate}
              onChange={(e) => (reviewDate = e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">Document Owner / Process Author</label>
          <input
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            defaultValue={owner}
            onChange={(e) => (owner = e.target.value)}
          />
        </div>

        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 text-[11px] leading-relaxed">
          <strong>Controlled Distribution:</strong> Registering this document automatically assigns standard ISO revision watermarks and notifies designated department heads.
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-1.5 text-xs font-semibold border border-[#E4E0D6] rounded text-[#6B7280] hover:bg-[#F6F4EF]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const newDoc: QualityDocument = {
              id,
              title: title || 'New Controlled Quality Procedure',
              category,
              rev,
              effectiveDate,
              reviewDate,
              owner,
              status: 'Released',
            };
            setDocs([newDoc, ...docs]);
            setSelectedDocId(newDoc.id);
            closeDrawer();
            showToast(`Controlled document ${newDoc.id} released.`);
          }}
          className="px-4 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded hover:bg-[#1f3158]"
        >
          Release Document
        </button>
      </div>
    );
  };

  const handleOpenNewAuditDrawer = () => {
    let id = `AUD-2026-00${audits.length + 6}`;
    let type: QualityAudit['type'] = 'Internal';
    let standard = 'ISO 9001:2015';
    let scope = 'Injection Molding & Material Traceability Control';
    let auditor = 'Dr. Robert Evans';
    let date = '2026-09-15';

    openDrawer(
      'Schedule New Quality Audit',
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Audit Record #</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-[#F6F4EF] font-mono"
              defaultValue={id}
              onChange={(e) => (id = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Audit Type</label>
            <select
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded bg-white"
              defaultValue={type}
              onChange={(e) => (type = e.target.value as any)}
            >
              <option value="Internal">Internal Quality Audit</option>
              <option value="Supplier">Supplier On-Site Audit</option>
              <option value="Layered Process Audit">Layered Process Audit (LPA)</option>
              <option value="Customer">Customer Audit</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Compliance Standard</label>
            <input
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded font-mono"
              defaultValue={standard}
              onChange={(e) => (standard = e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold text-[#14213D] mb-1">Audit Date</label>
            <input
              type="date"
              className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
              defaultValue={date}
              onChange={(e) => (date = e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">Audit Scope &amp; Target Departments</label>
          <textarea
            rows={2}
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            defaultValue={scope}
            onChange={(e) => (scope = e.target.value)}
          />
        </div>

        <div>
          <label className="block font-semibold text-[#14213D] mb-1">Lead Auditor / Team</label>
          <input
            className="w-full px-2.5 py-1.5 border border-[#E4E0D6] rounded"
            defaultValue={auditor}
            onChange={(e) => (auditor = e.target.value)}
          />
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-1.5 text-xs font-semibold border border-[#E4E0D6] rounded text-[#6B7280] hover:bg-[#F6F4EF]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const newAudit: QualityAudit = {
              id,
              type,
              standard,
              scope,
              auditor,
              date,
              status: 'Scheduled',
              findings: 0,
            };
            setAudits([newAudit, ...audits]);
            setSelectedAuditId(newAudit.id);
            closeDrawer();
            showToast(`Scheduled audit ${newAudit.id}.`);
          }}
          className="px-4 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded hover:bg-[#1f3158]"
        >
          Schedule Audit
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Quality Assurance &middot; ISO Compliance &amp; Governance
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Document Control &amp; Quality Audits (DCC)
          </h1>
          <p className="text-xs text-[#6B7280]">
            Centralized SOP / Work Instruction revision vault, Layered Process Audits (LPA), and ISO 9001 / IATF 16949 compliance logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'docs' ? (
            <button
              onClick={handleOpenNewDocDrawer}
              className="px-3.5 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158] flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" /> + Release SOP / Document
            </button>
          ) : (
            <button
              onClick={handleOpenNewAuditDrawer}
              className="px-3.5 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158] flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" /> + Schedule Quality Audit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E0D6]">
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'docs'
              ? 'border-[#0F8B8D] text-[#0F8B8D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Controlled Documents &amp; SOPs ({docs.length})
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'audits'
              ? 'border-[#0F8B8D] text-[#0F8B8D]'
              : 'border-transparent text-[#6B7280] hover:text-[#14213D]'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Quality Audits &amp; LPA ({audits.length})
        </button>
      </div>

      {/* TAB 1: CONTROLLED DOCUMENTS */}
      {activeTab === 'docs' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-sm">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-2.5 top-2 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search Doc #, Title, Author..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E4E0D6] rounded-lg focus:outline-none focus:border-[#0F8B8D]"
                />
              </div>
              <select
                value={docCategoryFilter}
                onChange={(e) => setDocCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg"
              >
                <option value="all">All Categories</option>
                <option value="SOP">SOP</option>
                <option value="Work Instruction">Work Instruction</option>
                <option value="Specification">Specification</option>
                <option value="Form">Form / Checklist</option>
              </select>
            </div>
            <div className="text-xs text-[#6B7280] font-mono">
              Showing <strong>{filteredDocs.length}</strong> controlled documents
            </div>
          </div>

          {/* Master Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Doc Cards */}
            <div className="lg:col-span-5 space-y-3">
              {filteredDocs.map((doc) => {
                const isSelected = doc.id === selectedDoc?.id;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-sm ${
                      isSelected
                        ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/15'
                        : 'border-[#E4E0D6] hover:border-[#0F8B8D]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#0F8B8D]">{doc.id}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F6F4EF] text-[#6B7280]">
                          Rev {doc.rev}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {doc.status}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-[#14213D] mt-1.5">
                      {doc.title}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-3 pt-2 border-t border-[#E4E0D6]">
                      <span>Category: <strong className="text-[#14213D]">{doc.category}</strong></span>
                      <span className="font-mono text-slate-500">Effective: {doc.effectiveDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Detailed Document Sheet */}
            <div className="lg:col-span-7">
              {selectedDoc ? (
                <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-[#E4E0D6] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#0F8B8D]">{selectedDoc.id}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#F6F4EF] text-[#14213D]">
                          Rev {selectedDoc.rev}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {selectedDoc.status}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-1">
                        {selectedDoc.title}
                      </h2>
                      <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                        Category: <strong>{selectedDoc.category}</strong> &middot; Owner: <strong>{selectedDoc.owner}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => showToast(`Opened PDF viewer for ${selectedDoc.id}`)}
                        className="px-3 py-1.5 text-xs font-semibold border border-[#E4E0D6] rounded-lg text-[#14213D] hover:bg-[#F6F4EF] flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#0F8B8D]" /> View SOP
                      </button>
                      <button
                        onClick={() => showToast(`Downloaded controlled copy of ${selectedDoc.id}`)}
                        className="p-2 text-[#6B7280] hover:text-[#14213D] border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]"
                        title="Download Controlled PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lifecycle Metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Current Revision</div>
                      <div className="font-mono font-bold text-[#14213D]">Revision {selectedDoc.rev}.0</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Effective Date</div>
                      <div className="font-mono font-bold text-[#14213D]">{selectedDoc.effectiveDate}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Annual Review Due</div>
                      <div className="font-mono font-bold text-[#0F8B8D]">{selectedDoc.reviewDate}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Classification</div>
                      <div className="font-bold text-[#14213D]">Controlled Copy</div>
                    </div>
                  </div>

                  {/* Document Summary / Scope */}
                  <div className="space-y-2 text-xs">
                    <h3 className="font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                      Procedure Purpose &amp; Quality Mandate
                    </h3>
                    <p className="text-[#6B7280] leading-relaxed">
                      Defines strict operating protocol, mandatory safety verifications, critical sampling intervals, and non-conformance containment protocols in accordance with ISO 9001:2015 Clause 8.5 (Production and Service Provision).
                    </p>
                  </div>

                  {/* Document Revision History Table */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0F8B8D]" />
                      Document Change &amp; Revision Log
                    </h3>
                    <div className="border border-[#E4E0D6] rounded-xl divide-y divide-[#E4E0D6] text-xs">
                      <div className="p-3 flex items-center justify-between hover:bg-[#F6F4EF]/50">
                        <div>
                          <div className="font-bold text-[#14213D]">Rev {selectedDoc.rev} — Regular Periodic Review &amp; Update</div>
                          <div className="text-[11px] text-[#6B7280]">Approved by: QA Director &middot; Status: Active</div>
                        </div>
                        <div className="text-right font-mono text-[11px] text-[#6B7280]">
                          {selectedDoc.effectiveDate}
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between hover:bg-[#F6F4EF]/50">
                        <div>
                          <div className="font-bold text-[#14213D]">Rev {Math.max(1, parseInt(selectedDoc.rev) - 1)} — Initial Baseline Release</div>
                          <div className="text-[11px] text-[#6B7280]">Approved by: QA Director &middot; Status: Superseded</div>
                        </div>
                        <div className="text-right font-mono text-[11px] text-[#6B7280]">
                          2025-06-01
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#6B7280] bg-white rounded-xl border border-[#E4E0D6]">
                  Select a document from the left to view details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUALITY AUDITS */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          {/* Audit Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-sm">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 absolute left-2.5 top-2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search Audit #, Scope, Auditor, Standard..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E4E0D6] rounded-lg focus:outline-none focus:border-[#0F8B8D]"
              />
            </div>
            <div className="text-xs text-[#6B7280] font-mono">
              Showing <strong>{filteredAudits.length}</strong> audits
            </div>
          </div>

          {/* Master Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Audit Cards */}
            <div className="lg:col-span-5 space-y-3">
              {filteredAudits.map((audit) => {
                const isSelected = audit.id === selectedAudit?.id;

                return (
                  <div
                    key={audit.id}
                    onClick={() => setSelectedAuditId(audit.id)}
                    className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-sm ${
                      isSelected
                        ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/15'
                        : 'border-[#E4E0D6] hover:border-[#0F8B8D]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#0F8B8D]">{audit.id}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          audit.status === 'Closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : audit.status === 'Scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {audit.status}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-[#14213D] mt-1.5">
                      {audit.scope}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-2.5 font-mono">
                      <span>Type: <strong className="text-[#14213D]">{audit.type}</strong></span>
                      <span>Standard: <strong>{audit.standard}</strong></span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-3 pt-2 border-t border-[#E4E0D6]">
                      <span>Auditor: <strong className="text-[#14213D]">{audit.auditor}</strong></span>
                      <span className="font-mono">{audit.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Detailed Audit Card */}
            <div className="lg:col-span-7">
              {selectedAudit ? (
                <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-[#E4E0D6] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#0F8B8D]">{selectedAudit.id}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#F6F4EF] text-[#14213D]">
                          {selectedAudit.type} Audit
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            selectedAudit.status === 'Closed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {selectedAudit.status}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-1">
                        {selectedAudit.scope}
                      </h2>
                      <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                        Standard: <strong>{selectedAudit.standard}</strong> &middot; Lead Auditor: <strong>{selectedAudit.auditor}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => showToast(`Generated official Audit Summary for ${selectedAudit.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold border border-[#E4E0D6] rounded-lg text-[#14213D] hover:bg-[#F6F4EF] flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-[#0F8B8D]" /> Export Summary
                    </button>
                  </div>

                  {/* Audit Metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Audit Date</div>
                      <div className="font-mono font-bold text-[#14213D]">{selectedAudit.date}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Findings / NCRs</div>
                      <div className="font-mono font-bold text-amber-700">{selectedAudit.findings} Logged</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Audit Status</div>
                      <div className="font-bold text-[#14213D]">{selectedAudit.status}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Governance Level</div>
                      <div className="font-bold text-[#14213D]">Level III Tier</div>
                    </div>
                  </div>

                  {/* Audit Checklist & Findings Evaluation */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-[#0F8B8D]" />
                      Audit Clause Verification &amp; Evidence
                    </h3>

                    <div className="border border-[#E4E0D6] rounded-xl divide-y divide-[#E4E0D6] text-xs">
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#14213D]">Clause 7.1.5: Monitoring and Measuring Resources</div>
                          <div className="text-[11px] text-[#6B7280]">Calibration certificates checked; 1 spectrophotometer found pending certification.</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                          Minor Finding
                        </span>
                      </div>

                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#14213D]">Clause 8.5.2: Identification and Traceability</div>
                          <div className="text-[11px] text-[#6B7280]">Lot barcodes match ERP inventory stock transactions perfectly.</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          Conforming
                        </span>
                      </div>

                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#14213D]">Clause 8.7: Control of Nonconforming Outputs</div>
                          <div className="text-[11px] text-[#6B7280]">Quarantine area segregation verified with active physical signage.</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          Conforming
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#6B7280] bg-white rounded-xl border border-[#E4E0D6]">
                  Select an audit record from the left to view details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
