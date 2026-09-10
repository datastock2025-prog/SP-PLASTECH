import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Building2,
  Calendar,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { CustomerDocument, CustomerDocumentType } from '../../types/crm';
import { mockCustomerDocuments, mockAccounts } from '../../data/mockCrmData';

interface CrmDocumentCenterViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
  initialAccountId?: string;
}

export const CrmDocumentCenterView: React.FC<CrmDocumentCenterViewProps> = ({
  onNavigate,
  showToast,
  initialAccountId,
}) => {
  const [documents, setDocuments] = useState<CustomerDocument[]>(mockCustomerDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [newDoc, setNewDoc] = useState<Partial<CustomerDocument>>({
    documentTitle: '',
    documentType: 'Certificate of Analysis (COA)',
    accountId: initialAccountId || mockAccounts[0].id,
    accountName: mockAccounts[0].accountName,
    fileName: '',
    fileSize: '1.8 MB',
    fileExtension: 'PDF',
    version: '1.0',
    expiryDate: '2027-09-01',
    isConfidential: true,
  });

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      if (initialAccountId && d.accountId !== initialAccountId) return false;
      if (docTypeFilter !== 'All' && d.documentType !== docTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.documentTitle.toLowerCase().includes(q) ||
          d.accountName.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.documentType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, initialAccountId, docTypeFilter, searchQuery]);

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.documentTitle) {
      showToast('Please specify a document title');
      return;
    }

    const matchedAccount = mockAccounts.find(a => a.id === newDoc.accountId);
    const created: CustomerDocument = {
      id: `DOC-2026-0${documents.length + 1}`,
      documentTitle: newDoc.documentTitle,
      documentType: newDoc.documentType as CustomerDocumentType,
      accountId: newDoc.accountId || mockAccounts[0].id,
      accountName: matchedAccount ? matchedAccount.accountName : 'Customer Account',
      fileName: newDoc.fileName || `${newDoc.documentTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileSize: newDoc.fileSize || '2.4 MB',
      fileExtension: 'PDF',
      uploadedAt: '2026-09-01',
      uploadedBy: 'Rajesh Sharma',
      version: '1.0',
      expiryDate: newDoc.expiryDate || '2027-12-31',
      isConfidential: Boolean(newDoc.isConfidential),
    };

    setDocuments([created, ...documents]);
    setShowUploadModal(false);
    showToast(`Document ${created.documentTitle} uploaded to customer vault!`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Customer Compliance & Vault
            </span>
            <span className="text-xs text-slate-500">{filteredDocs.length} Documents stored</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Document Center & Regulatory Vault</h1>
          <p className="text-sm text-slate-600">
            Repository for Master Supply Agreements, bilateral NDAs, REACH / RoHS declarations, MSDS sheets, and batch COAs.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search document title, customer, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Document Types</option>
            <option value="Non-Disclosure Agreement (NDA)">Non-Disclosure Agreement (NDA)</option>
            <option value="Master Service Agreement (MSA)">Master Service Agreement (MSA)</option>
            <option value="MSDS / REACH / RoHS Certificate">MSDS / REACH / RoHS Cert</option>
            <option value="Certificate of Analysis (COA)">Certificate of Analysis (COA)</option>
            <option value="Customer Tooling Agreement">Tooling Agreement</option>
          </select>
        </div>
      </div>

      {/* Documents Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3">Document Title</th>
                <th className="p-3">Customer Account</th>
                <th className="p-3">Document Type</th>
                <th className="p-3">File Size</th>
                <th className="p-3">Uploaded Date</th>
                <th className="p-3">Valid Until</th>
                <th className="p-3">Confidential</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-teal-50/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{doc.documentTitle}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono ml-6">{doc.fileName} (v{doc.version})</div>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{doc.accountName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {doc.documentType}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-mono">{doc.fileSize}</td>
                  <td className="p-3 text-slate-700">{doc.uploadedAt}</td>
                  <td className="p-3 font-medium text-teal-700">{doc.expiryDate || 'Perpetual'}</td>
                  <td className="p-3">
                    {doc.isConfidential ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                        <Lock className="w-3 h-3" />
                        Confidential
                      </span>
                    ) : (
                      <span className="text-slate-400">Public</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => showToast(`Downloaded ${doc.fileName}`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-semibold rounded text-[11px] transition-colors inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Upload Regulatory / Customer Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadDoc} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Account *</label>
                <select
                  value={newDoc.accountId}
                  onChange={(e) => {
                    const acc = mockAccounts.find(a => a.id === e.target.value);
                    setNewDoc({ ...newDoc, accountId: e.target.value, accountName: acc?.accountName });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  {mockAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PP Flame Retardant RoHS 3 Compliance Declaration"
                  value={newDoc.documentTitle}
                  onChange={(e) => setNewDoc({ ...newDoc, documentTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document Category</label>
                  <select
                    value={newDoc.documentType}
                    onChange={(e) => setNewDoc({ ...newDoc, documentType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Non-Disclosure Agreement (NDA)">Non-Disclosure Agreement (NDA)</option>
                    <option value="Master Service Agreement (MSA)">Master Service Agreement (MSA)</option>
                    <option value="MSDS / REACH / RoHS Certificate">MSDS / REACH / RoHS Cert</option>
                    <option value="Certificate of Analysis (COA)">Certificate of Analysis (COA)</option>
                    <option value="Customer Tooling Agreement">Customer Tooling Agreement</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiration / Review Date</label>
                  <input
                    type="date"
                    value={newDoc.expiryDate}
                    onChange={(e) => setNewDoc({ ...newDoc, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDoc.isConfidential}
                    onChange={(e) => setNewDoc({ ...newDoc, isConfidential: e.target.checked })}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-semibold text-slate-700">Flag as Customer-Confidential / Encrypted</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Upload & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
