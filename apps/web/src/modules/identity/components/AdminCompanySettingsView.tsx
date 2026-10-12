import React, { useState } from 'react';
import {
  Building2,
  Save,
  Award,
  Globe,
  FileText,
  Mail,
  Phone,
  MapPin,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { SupabaseDataService } from '../../services/supabaseService';
import { masterDataGovernanceService } from '../../services/masterDataGovernanceService';
import { adminEventBus } from '../../services/adminService';

interface AdminCompanySettingsViewProps {
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

const emptyCompanyForm = {
  legalName: '',
  tradeName: '',
  cinNumber: '',
  panNumber: '',
  gstinNumber: '',
  incorporationDate: '',
  registeredAddress: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  corporateEmail: '',
  corporatePhone: '',
  websiteUrl: '',
  baseCurrency: 'INR (₹)',
  fiscalYearStart: '01 April',
  fiscalYearEnd: '31 March',
  msmeRegistrationNo: '',
  primaryBank: '',
  bankAccountNumber: '',
  bankIfscCode: '',
  iatfCertNumber: '',
  iso14001CertNumber: '',
};

export const AdminCompanySettingsView: React.FC<AdminCompanySettingsViewProps> = ({
  onNavigate,
  showToast = (_msg: string) => {},
}) => {
  // Task 2: Initially company settings fields are empty
  const [formData, setFormData] = useState(emptyCompanyForm);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.legalName.trim() && !formData.tradeName.trim()) {
      showToast('⚠️ Please enter Registered Corporate Legal Name or Brand Name.');
      return;
    }

    setIsSaving(true);

    try {
      // 1. Save to localStorage
      localStorage.setItem('reboot_company_profile', JSON.stringify(formData));

      // 2. Persist to Supabase Database
      await SupabaseDataService.upsertCompanySettings({
        legal_name: formData.legalName,
        trade_name: formData.tradeName,
        cin_number: formData.cinNumber,
        pan_number: formData.panNumber,
        gstin_number: formData.gstinNumber,
        incorporation_date: formData.incorporationDate,
        registered_address: formData.registeredAddress,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        corporate_email: formData.corporateEmail,
        corporate_phone: formData.corporatePhone,
        website_url: formData.websiteUrl,
        primary_bank: formData.primaryBank,
        bank_account_number: formData.bankAccountNumber,
        bank_ifsc_code: formData.bankIfscCode,
        iatf_cert_number: formData.iatfCertNumber,
        iso14001_cert_number: formData.iso14001CertNumber,
      });

      // 3. Record in Audit History
      masterDataGovernanceService.recordAudit({
        entityType: 'COMPANY_SETTINGS',
        entityCode: formData.cinNumber || 'COMP-01',
        entityName: formData.legalName || formData.tradeName,
        action: 'UPDATE',
        changedBy: 'Super Administrator',
        userRole: 'admin',
        changeSummary: `Updated Company & Organization Legal Settings for ${formData.legalName || formData.tradeName}.`,
      });

      adminEventBus.emit('COMPANY_PROFILE_SAVED', formData);

      showToast('✓ Company Profile saved in DB. Moving to Plant & Branch settings...');

      // 4. Task 2: Reset form fields back to empty
      setFormData(emptyCompanyForm);

      // 5. Task 2: Transition to Plant and Branch screen
      if (onNavigate) {
        setTimeout(() => {
          onNavigate('adminPlantSettings');
        }, 500);
      }
    } catch (err: any) {
      console.warn('Error saving company profile:', err);
      showToast('✓ Company Profile saved locally.');
      setFormData(emptyCompanyForm);
      if (onNavigate) {
        onNavigate('adminPlantSettings');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-[#0F8B8D]" />
            <span>Corporate Entity &amp; Legal Profile</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Company / Organization Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain statutory identifiers, corporate tax registration, banking details, and global IATF automotive quality certifications.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving to DB...' : 'Save Company Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Corporate Identifiers */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0F8B8D]" />
            Statutory Legal Identity &amp; Registrations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Registered Corporate Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Reboot Polymers & Precision Plastics Pvt. Ltd."
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand / Trade Name</label>
              <input
                type="text"
                placeholder="e.g. Reboot Plastics Group"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Identification Number (CIN)</label>
              <input
                type="text"
                placeholder="e.g. U25209PN2021PTC199842"
                value={formData.cinNumber}
                onChange={(e) => setFormData({ ...formData, cinNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Permanent Account Number (PAN)</label>
              <input
                type="text"
                placeholder="e.g. AABCR1234F"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Headquarters GSTIN</label>
              <input
                type="text"
                placeholder="e.g. 27AABCR1234F1Z8"
                value={formData.gstinNumber}
                onChange={(e) => setFormData({ ...formData, gstinNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">MSME / Udyam Certificate No.</label>
              <input
                type="text"
                placeholder="e.g. UDYAM-MH-26-0038912"
                value={formData.msmeRegistrationNo}
                onChange={(e) => setFormData({ ...formData, msmeRegistrationNo: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Incorporation</label>
              <input
                type="date"
                value={formData.incorporationDate}
                onChange={(e) => setFormData({ ...formData, incorporationDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fiscal Year Cycle</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="01 April"
                  value={formData.fiscalYearStart}
                  onChange={(e) => setFormData({ ...formData, fiscalYearStart: e.target.value })}
                  className="w-1/2 px-2 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
                <span className="self-center text-slate-400">to</span>
                <input
                  type="text"
                  placeholder="31 March"
                  value={formData.fiscalYearEnd}
                  onChange={(e) => setFormData({ ...formData, fiscalYearEnd: e.target.value })}
                  className="w-1/2 px-2 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Registered Head Office Address & Contact */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0F8B8D]" />
            Registered Head Office &amp; Communications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Registered Address</label>
              <input
                type="text"
                placeholder="e.g. Plot No. C-14, Phase II, Chakan MIDC, Industrial Corridor"
                value={formData.registeredAddress}
                onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City / Industrial Zone</label>
              <input
                type="text"
                placeholder="e.g. Pune"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State &amp; Postal Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-1/2 px-2 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
                <input
                  type="text"
                  placeholder="410501"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-1/2 px-2 py-2 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Corporate Email</label>
              <input
                type="email"
                placeholder="e.g. compliance@reboot-erp.com"
                value={formData.corporateEmail}
                onChange={(e) => setFormData({ ...formData, corporateEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Boardline Phone</label>
              <input
                type="text"
                placeholder="e.g. +91 (020) 6790 4400"
                value={formData.corporatePhone}
                onChange={(e) => setFormData({ ...formData, corporatePhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Official Web Portal</label>
              <input
                type="text"
                placeholder="e.g. https://plastics.reboot-erp.com"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>
          </div>
        </div>

        {/* Banking & Automotive Quality Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banking */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#0F8B8D]" />
              Primary Treasury &amp; Disbursement Bank
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name &amp; Branch</label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India - Industrial Finance Branch"
                  value={formData.primaryBank}
                  onChange={(e) => setFormData({ ...formData, primaryBank: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 39482019482"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IFSC / RTGS Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0004123"
                    value={formData.bankIfscCode}
                    onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quality Standards */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0F8B8D]" />
              Automotive Quality Certifications
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">IATF 16949:2016 Automotive License</label>
                <input
                  type="text"
                  placeholder="e.g. IATF-16949:2016 / 048291"
                  value={formData.iatfCertNumber}
                  onChange={(e) => setFormData({ ...formData, iatfCertNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[#0F8B8D] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ISO 14001:2015 Environmental System</label>
                <input
                  type="text"
                  placeholder="e.g. ISO-14001:2015 / EMS-9812"
                  value={formData.iso14001CertNumber}
                  onChange={(e) => setFormData({ ...formData, iso14001CertNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button at bottom */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Company Settings & Proceed to Plant / Branch'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </form>
    </div>
  );
};
