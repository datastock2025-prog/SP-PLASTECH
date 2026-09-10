import React, { useState } from 'react';
import {
  FileCheck,
  ShieldCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Download,
  Calendar,
  Building2,
  Layers,
  Search,
  Plus,
  Printer,
  Sparkles,
} from 'lucide-react';
import { HrComplianceDoc, HrContractAgency } from '../../types';

interface HrComplianceContractViewProps {
  complianceDocs: HrComplianceDoc[];
  agencies: HrContractAgency[];
  showToast: (msg: string) => void;
}

export const HrComplianceContractView: React.FC<HrComplianceContractViewProps> = ({
  complianceDocs,
  agencies,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'statutory' | 'contractors' | 'registers'>('statutory');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = complianceDocs.filter((doc) => {
    return (
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.act.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredAgencies = agencies.filter((a) => {
    return (
      a.agencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header & Tab Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <span>Labor Law Compliance &amp; Contract Labor Management</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                100% Audit Ready
              </span>
            </h2>
            <p className="text-slate-500">
              Factories Act 1948 statutory registers, Contract Labour (CLRA) Form XII/XXII, contractor agency licenses, PF/ESI challans, and audit trails.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setActiveTab('statutory')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'statutory' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Statutory Registers ({complianceDocs.length})
            </button>
            <button
              onClick={() => setActiveTab('contractors')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'contractors' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contractor Agencies ({agencies.length})
            </button>
            <button
              onClick={() => setActiveTab('registers')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'registers' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Government Forms &amp; Reports
            </button>
          </div>
        </div>
      </div>

      {/* 1. Statutory Registers Tab */}
      {activeTab === 'statutory' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search register, statutory act, periodicity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F8B8D]"
              />
            </div>
            <button
              onClick={() => showToast('Compliance Audit Report generated for DISH & Labor Officer review.')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14213D] text-white rounded-lg font-bold hover:bg-[#1C2B4D] transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Compliance Dossier</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Register Name &amp; Statutory Act</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Filing Frequency</th>
                  <th className="p-3">Last Filing Date</th>
                  <th className="p-3">Next Due Date</th>
                  <th className="p-3">Compliance Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="font-bold text-[#14213D]">{doc.title}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{doc.act}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium text-[10px]">
                        {doc.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{doc.frequency}</td>
                    <td className="p-3 font-mono">{doc.lastFilingDate}</td>
                    <td className="p-3 font-mono font-bold text-indigo-700">{doc.nextDueDate}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.status === 'Compliant'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => showToast(`Generating official PDF for ${doc.title}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold transition cursor-pointer"
                      >
                        Export Register
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Contractor Agencies Tab */}
      {activeTab === 'contractors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAgencies.map((ag) => (
              <div key={ag.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                      {ag.id}
                    </span>
                    <h3 className="font-bold text-sm text-[#14213D] mt-1">{ag.agencyName}</h3>
                    <div className="text-[11px] text-slate-500 font-mono">CLRA License: {ag.licenseNumber}</div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ag.complianceScore >= 95
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Compliance Score: {ag.complianceScore}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-semibold">Active Deployed Workers</span>
                    <div className="text-base font-bold text-[#14213D] mt-0.5">{ag.activeWorkers} Manpower</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-semibold">License Valid Until</span>
                    <div className="text-sm font-bold text-slate-800 mt-0.5 font-mono">{ag.licenseValidUntil}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-semibold">Monthly PF Code</span>
                    <div className="font-bold font-mono text-indigo-700 mt-0.5">{ag.pfCode}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-semibold">ESI Sub-Code</span>
                    <div className="font-bold font-mono text-indigo-700 mt-0.5">{ag.esiCode}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-600">
                    Contact: <strong>{ag.contactPerson}</strong> ({ag.phone})
                  </span>
                  <button
                    onClick={() => showToast(`Audited monthly contractor challans for ${ag.agencyName}`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 transition cursor-pointer"
                  >
                    Audit Challans
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Government Forms & Reports Tab */}
      {activeTab === 'registers' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#14213D]">Standard Statutory Form Generators</h3>
          <p className="text-slate-500 text-[11px]">
            Instantly compile and populate government labor department inspection forms directly from ERP production logs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { form: 'Form XII (Contract Labour)', desc: 'Register of Contractors in Form XII under Rule 74' },
              { form: 'Form D (Equal Remuneration)', desc: 'Register showing complaints and details under Rule 6' },
              { form: 'Form II (Muster Roll)', desc: 'Combined Muster Roll-cum-Register of Wages under Factories Act' },
              { form: 'Form 25 (Accident Book)', desc: 'Notice of accidents resulting in bodily injury or death' },
              { form: 'Form 31 (Inspection Book)', desc: 'Inspection Book for Factories Inspector visits' },
              { form: 'Form IV (Annual Return)', desc: 'Annual statutory labor returns under Payment of Wages' },
            ].map((f, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900">{f.form}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{f.desc}</p>
                </div>
                <button
                  onClick={() => showToast(`Generated printable PDF for ${f.form}`)}
                  className="flex items-center justify-center gap-1.5 py-1.5 bg-[#14213D] hover:bg-[#1C2B4D] text-white rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate Printable Form</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
