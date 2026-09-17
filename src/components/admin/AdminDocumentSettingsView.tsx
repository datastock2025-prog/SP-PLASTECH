import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Cloud,
  ShieldCheck,
  Clock,
  CheckCircle2,
  HardDrive,
  Lock,
  Edit2,
  Trash2,
  FileCheck,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Download,
  FolderLock,
  Database,
  Shield,
  Layers,
} from 'lucide-react';
import { DocumentSettingPolicy, mockDocumentPolicies } from '../../data/mockAdminExtendedData';

interface AdminDocumentSettingsViewProps {
  showToast?: (msg: string) => void;
}

const AVAILABLE_EXTENSIONS = ['.pdf', '.xlsx', '.csv', '.step', '.iges', '.dxf', '.jpg', '.png', '.docx', '.zip'];

export const AdminDocumentSettingsView: React.FC<AdminDocumentSettingsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [policies, setPolicies] = useState<DocumentSettingPolicy[]>(mockDocumentPolicies);
  const [search, setSearch] = useState('');
  
  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<DocumentSettingPolicy | null>(null);

  // Form State
  const initialFormState = {
    categoryName: '',
    codePrefix: '',
    description: '',
    mandatoryWatermark: 'OFFICIAL REBOOT ERP SAFETY MASTER',
    retentionYears: 10,
    approvalRequired: true,
    allowedExtensions: ['.pdf'],
    maxFileSizeMb: 25,
    cloudStorageBucket: 's3://reboot-erp-vault-ap-south-1',
    autoExpireAlertDays: 60,
  };

  const [form, setForm] = useState(initialFormState);

  const filtered = policies.filter(
    (p) =>
      p.categoryName.toLowerCase().includes(search.toLowerCase()) ||
      p.codePrefix.toLowerCase().includes(search.toLowerCase()) ||
      p.cloudStorageBucket.toLowerCase().includes(search.toLowerCase())
  );

  // Open Wizard
  const handleOpenWizard = () => {
    setForm({
      categoryName: '',
      codePrefix: 'DOC-',
      description: '',
      mandatoryWatermark: 'OFFICIAL REBOOT ERP COMPLIANCE VAULT',
      retentionYears: 10,
      approvalRequired: true,
      allowedExtensions: ['.pdf', '.xlsx'],
      maxFileSizeMb: 25,
      cloudStorageBucket: 's3://reboot-erp-digital-vault-ap-south-1',
      autoExpireAlertDays: 60,
    });
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (policy: DocumentSettingPolicy) => {
    setEditingPolicy(policy);
    setForm({
      categoryName: policy.categoryName,
      codePrefix: policy.codePrefix,
      description: policy.description,
      mandatoryWatermark: policy.mandatoryWatermark,
      retentionYears: policy.retentionYears,
      approvalRequired: policy.approvalRequired,
      allowedExtensions: [...policy.allowedExtensions],
      maxFileSizeMb: policy.maxFileSizeMb,
      cloudStorageBucket: policy.cloudStorageBucket,
      autoExpireAlertDays: policy.autoExpireAlertDays,
    });
    setIsEditModalOpen(true);
  };

  // Toggle Extension
  const handleToggleExtension = (ext: string) => {
    setForm((prev) => {
      const exists = prev.allowedExtensions.includes(ext);
      if (exists) {
        if (prev.allowedExtensions.length === 1) return prev; // keep at least one
        return { ...prev, allowedExtensions: prev.allowedExtensions.filter((e) => e !== ext) };
      }
      return { ...prev, allowedExtensions: [...prev.allowedExtensions, ext] };
    });
  };

  // Submit Wizard
  const handleCompleteWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryName || !form.codePrefix) {
      showToast('Please provide category name and code prefix.');
      return;
    }

    const newPolicy: DocumentSettingPolicy = {
      id: `DOC-POL-${Date.now().toString().slice(-4)}`,
      categoryName: form.categoryName,
      codePrefix: form.codePrefix.endsWith('-') ? form.codePrefix : `${form.codePrefix}-`,
      description: form.description || 'Enterprise regulatory digital document policy.',
      mandatoryWatermark: form.mandatoryWatermark,
      retentionYears: Number(form.retentionYears) || 10,
      approvalRequired: form.approvalRequired,
      allowedExtensions: form.allowedExtensions,
      maxFileSizeMb: Number(form.maxFileSizeMb) || 25,
      cloudStorageBucket: form.cloudStorageBucket,
      autoExpireAlertDays: Number(form.autoExpireAlertDays) || 60,
    };

    setPolicies([newPolicy, ...policies]);
    setIsWizardOpen(false);
    showToast(`Document Policy "${newPolicy.categoryName}" registered successfully.`);
  };

  // Submit Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;

    const updated: DocumentSettingPolicy = {
      ...editingPolicy,
      categoryName: form.categoryName,
      codePrefix: form.codePrefix.endsWith('-') ? form.codePrefix : `${form.codePrefix}-`,
      description: form.description,
      mandatoryWatermark: form.mandatoryWatermark,
      retentionYears: Number(form.retentionYears) || 10,
      approvalRequired: form.approvalRequired,
      allowedExtensions: form.allowedExtensions,
      maxFileSizeMb: Number(form.maxFileSizeMb) || 25,
      cloudStorageBucket: form.cloudStorageBucket,
      autoExpireAlertDays: Number(form.autoExpireAlertDays) || 60,
    };

    setPolicies((prev) => prev.map((p) => (p.id === editingPolicy.id ? updated : p)));
    setIsEditModalOpen(false);
    showToast(`Policy for "${updated.codePrefix}" updated successfully.`);
  };

  // Delete Policy
  const handleDeletePolicy = (id: string, name: string) => {
    if (policies.length <= 1) {
      showToast('Cannot delete last remaining document policy.');
      return;
    }
    setPolicies((prev) => prev.filter((p) => p.id !== id));
    setIsEditModalOpen(false);
    showToast(`Deleted policy "${name}".`);
  };

  // Export Policies
  const handleExportPolicies = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(policies, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `Document_Vault_Policies_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showToast('Exported document policies JSON.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <FileText className="w-4 h-4 text-[#0F8B8D]" />
            <span>Digital Vault &amp; Regulatory Document Policies</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Document Management Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure secure cloud storage buckets, mandatory watermarking, retention periods, and approved formats for MSDS, PPAP L3, and CMM scans.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportPolicies}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Policies
          </button>
          <button
            onClick={handleOpenWizard}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Document Policy
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0F8B8D] border border-teal-200 flex items-center justify-center">
            <FolderLock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Active Categories</div>
            <div className="text-lg font-bold text-slate-900">{policies.length} Regulatory Policies</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">S3 Vault Endpoints</div>
            <div className="text-lg font-bold text-slate-900">
              {new Set(policies.map((p) => p.cloudStorageBucket)).size} Dedicated Buckets
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Avg Retention Mandate</div>
            <div className="text-lg font-bold text-slate-900">
              {(policies.reduce((s, p) => s + p.retentionYears, 0) / policies.length).toFixed(1)} Years Standard
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search policies by prefix, category name, bucket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Showing {filtered.length} of {policies.length} policies
        </span>
      </div>

      {/* Grid of Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((pol) => (
          <div
            key={pol.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Prefix: {pol.codePrefix}
                  </span>
                  <h3 className="font-bold text-xs text-slate-900 mt-1.5">{pol.categoryName}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F8B8D] border border-teal-200">
                    {pol.retentionYears} Years Retention
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{pol.description}</p>

              {/* Security & Watermarking Specs */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mandatory Watermark:</span>
                  <span className="font-mono font-bold text-rose-700 text-right">{pol.mandatoryWatermark}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allowed File Extensions:</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {pol.allowedExtensions.map((ext) => (
                      <span key={ext} className="font-mono text-[11px] px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-700">
                        {ext}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Upload Size:</span>
                  <span className="font-mono font-semibold text-slate-800">{pol.maxFileSizeMb} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Storage Target:</span>
                  <span className="font-mono text-[11px] text-indigo-600 truncate max-w-[220px]">{pol.cloudStorageBucket}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Expiry Alert: {pol.autoExpireAlertDays} days in advance</span>
              <button
                onClick={() => handleOpenEdit(pol)}
                className="font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" /> Configure Policy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 3-STEP WIZARD: ADD DOCUMENT POLICY */}
      {/* ========================================================================= */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">New Document Vault Policy Wizard</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure regulatory archiving, watermarking, and cloud bucket destinations.
                </p>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between px-2 text-xs">
              <div
                className={`flex items-center gap-2 cursor-pointer ${
                  wizardStep >= 1 ? 'text-[#0F8B8D] font-bold' : 'text-slate-400'
                }`}
                onClick={() => setWizardStep(1)}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                    wizardStep >= 1 ? 'bg-[#0F8B8D] text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  1
                </div>
                <span>Category</span>
              </div>

              <div className="h-0.5 w-12 bg-slate-200" />

              <div
                className={`flex items-center gap-2 cursor-pointer ${
                  wizardStep >= 2 ? 'text-[#0F8B8D] font-bold' : 'text-slate-400'
                }`}
                onClick={() => setWizardStep(2)}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                    wizardStep >= 2 ? 'bg-[#0F8B8D] text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  2
                </div>
                <span>Security &amp; Target</span>
              </div>

              <div className="h-0.5 w-12 bg-slate-200" />

              <div
                className={`flex items-center gap-2 cursor-pointer ${
                  wizardStep >= 3 ? 'text-[#0F8B8D] font-bold' : 'text-slate-400'
                }`}
                onClick={() => setWizardStep(3)}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                    wizardStep >= 3 ? 'bg-[#0F8B8D] text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  3
                </div>
                <span>Retention &amp; Types</span>
              </div>
            </div>

            {/* Wizard Content by Step */}
            <form onSubmit={handleCompleteWizard} className="space-y-4 text-xs">
              {wizardStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-100">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category / Document Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mold Cavity Inspection &amp; Maintenance Sheets"
                      value={form.categoryName}
                      onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Document Code Prefix *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MOLD-MAINT-"
                      value={form.codePrefix}
                      onChange={(e) => setForm({ ...form, codePrefix: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Uploaded files will automatically be serialized under this prefix (e.g. {form.codePrefix || 'DOC-'}2026-0001).
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description &amp; Regulatory Purpose</label>
                    <textarea
                      rows={3}
                      placeholder="Describe the nature of files stored, compliance requirement (IATF 16949 / ISO 9001)..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-100">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mandatory Security Watermark</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CONFIDENTIAL PROPRIETARY IATF 16949"
                      value={form.mandatoryWatermark}
                      onChange={(e) => setForm({ ...form, mandatoryWatermark: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-rose-700 font-bold focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      This text string is burned across every page render for export security.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cloud Storage Target Bucket (S3 / Blob)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. s3://reboot-erp-vault-ap-south-1"
                      value={form.cloudStorageBucket}
                      onChange={(e) => setForm({ ...form, cloudStorageBucket: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-indigo-600 focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="approvalRequired"
                      checked={form.approvalRequired}
                      onChange={(e) => setForm({ ...form, approvalRequired: e.target.checked })}
                      className="rounded border-slate-300 text-[#0F8B8D] focus:ring-[#0F8B8D]"
                    />
                    <label htmlFor="approvalRequired" className="text-slate-700 font-medium cursor-pointer">
                      Require QA Department Head Approval before vault commit
                    </label>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Retention Duration (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={form.retentionYears}
                        onChange={(e) => setForm({ ...form, retentionYears: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Max Upload Size (MB)</label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={form.maxFileSizeMb}
                        onChange={(e) => setForm({ ...form, maxFileSizeMb: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Auto-Expiry Notice (Days prior)</label>
                    <input
                      type="number"
                      min="7"
                      max="365"
                      value={form.autoExpireAlertDays}
                      onChange={(e) => setForm({ ...form, autoExpireAlertDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Allowed File Formats</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_EXTENSIONS.map((ext) => {
                        const active = form.allowedExtensions.includes(ext);
                        return (
                          <button
                            key={ext}
                            type="button"
                            onClick={() => handleToggleExtension(ext)}
                            className={`px-3 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#0F8B8D] border-[#0F8B8D] text-white shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {active && <Check className="w-3.5 h-3.5" />}
                            {ext}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => (prev - 1) as 1 | 2)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsWizardOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => (prev + 1) as 2 | 3)}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                  >
                    Save &amp; Deploy Policy
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURE / EDIT POLICY */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Configure Policy &mdash; {editingPolicy.codePrefix}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Modify digital vault specifications and archiving rules.</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={form.categoryName}
                  onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Code Prefix</label>
                  <input
                    type="text"
                    required
                    value={form.codePrefix}
                    onChange={(e) => setForm({ ...form, codePrefix: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Retention (Years)</label>
                  <input
                    type="number"
                    value={form.retentionYears}
                    onChange={(e) => setForm({ ...form, retentionYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mandatory Security Watermark</label>
                <input
                  type="text"
                  value={form.mandatoryWatermark}
                  onChange={(e) => setForm({ ...form, mandatoryWatermark: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-rose-700 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">S3 Bucket Storage Target</label>
                <input
                  type="text"
                  value={form.cloudStorageBucket}
                  onChange={(e) => setForm({ ...form, cloudStorageBucket: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Upload (MB)</label>
                  <input
                    type="number"
                    value={form.maxFileSizeMb}
                    onChange={(e) => setForm({ ...form, maxFileSizeMb: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Alert (Days)</label>
                  <input
                    type="number"
                    value={form.autoExpireAlertDays}
                    onChange={(e) => setForm({ ...form, autoExpireAlertDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Allowed Extensions</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_EXTENSIONS.map((ext) => {
                    const active = form.allowedExtensions.includes(ext);
                    return (
                      <button
                        key={ext}
                        type="button"
                        onClick={() => handleToggleExtension(ext)}
                        className={`px-3 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0F8B8D] border-[#0F8B8D] text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                        {ext}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleDeletePolicy(editingPolicy.id, editingPolicy.categoryName)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Policy
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

