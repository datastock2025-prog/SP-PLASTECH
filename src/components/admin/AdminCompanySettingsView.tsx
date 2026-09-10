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
} from 'lucide-react';

interface AdminCompanySettingsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminCompanySettingsView: React.FC<AdminCompanySettingsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [formData, setFormData] = useState({
    legalName: 'Reboot Polymers & Precision Plastics Pvt. Ltd.',
    tradeName: 'Reboot Plastics Group',
    cinNumber: 'U25209PN2021PTC199842',
    panNumber: 'AABCR1234F',
    gstinNumber: '27AABCR1234F1Z8',
    incorporationDate: '2021-04-14',
    registeredAddress: 'Plot No. C-14, Phase II, Chakan MIDC, Industrial Corridor',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '410501',
    country: 'India',
    corporateEmail: 'compliance@reboot-erp.com',
    corporatePhone: '+91 (020) 6790 4400',
    websiteUrl: 'https://plastics.reboot-erp.com',
    baseCurrency: 'INR (₹)',
    fiscalYearStart: '01 April',
    fiscalYearEnd: '31 March',
    msmeRegistrationNo: 'UDYAM-MH-26-0038912',
    primaryBank: 'State Bank of India - Industrial Finance Branch, Pune',
    bankAccountNumber: '39482019482',
    bankIfscCode: 'SBIN0004123',
    iatfCertNumber: 'IATF-16949:2016 / 048291',
    iso14001CertNumber: 'ISO-14001:2015 / EMS-9812',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Company Organization & Compliance profiles updated successfully.');
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
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          Save Company Settings
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
              <label className="block font-semibold text-slate-700 mb-1">Registered Corporate Legal Name</label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand / Trade Name</label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Identification Number (CIN)</label>
              <input
                type="text"
                value={formData.cinNumber}
                onChange={(e) => setFormData({ ...formData, cinNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Permanent Account Number (PAN)</label>
              <input
                type="text"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Headquarters GSTIN</label>
              <input
                type="text"
                value={formData.gstinNumber}
                onChange={(e) => setFormData({ ...formData, gstinNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">MSME / Udyam Certificate No.</label>
              <input
                type="text"
                value={formData.msmeRegistrationNo}
                onChange={(e) => setFormData({ ...formData, msmeRegistrationNo: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Incorporation</label>
              <input
                type="date"
                value={formData.incorporationDate}
                onChange={(e) => setFormData({ ...formData, incorporationDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fiscal Year Cycle</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.fiscalYearStart}
                  onChange={(e) => setFormData({ ...formData, fiscalYearStart: e.target.value })}
                  className="w-1/2 px-2 py-2 rounded-lg border border-slate-300"
                />
                <span className="self-center text-slate-400">to</span>
                <input
                  type="text"
                  value={formData.fiscalYearEnd}
                  onChange={(e) => setFormData({ ...formData, fiscalYearEnd: e.target.value })}
                  className="w-1/2 px-2 py-2 rounded-lg border border-slate-300"
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
                value={formData.registeredAddress}
                onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City / Industrial Zone</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State &amp; Postal Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-1/2 px-2 py-2 rounded-lg border border-slate-300"
                />
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-1/2 px-2 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Corporate Email</label>
              <input
                type="email"
                value={formData.corporateEmail}
                onChange={(e) => setFormData({ ...formData, corporateEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Boardline Phone</label>
              <input
                type="text"
                value={formData.corporatePhone}
                onChange={(e) => setFormData({ ...formData, corporatePhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Official Web Portal</label>
              <input
                type="text"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
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
                  value={formData.primaryBank}
                  onChange={(e) => setFormData({ ...formData, primaryBank: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IFSC / RTGS Code</label>
                  <input
                    type="text"
                    value={formData.bankIfscCode}
                    onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
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
                  value={formData.iatfCertNumber}
                  onChange={(e) => setFormData({ ...formData, iatfCertNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[#0F8B8D] font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ISO 14001:2015 Environmental System</label>
                <input
                  type="text"
                  value={formData.iso14001CertNumber}
                  onChange={(e) => setFormData({ ...formData, iso14001CertNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
