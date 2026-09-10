import React, { useState } from 'react';
import {
  UserCheck,
  UserX,
  Plus,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  Award,
  Key,
  Layers,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { HrEmployee, HrDepartment } from '../../types';

interface HrOnboardingOffboardingViewProps {
  departments: HrDepartment[];
  onAddNewEmployee: (emp: Partial<HrEmployee>) => void;
  showToast: (msg: string) => void;
}

export const HrOnboardingOffboardingView: React.FC<HrOnboardingOffboardingViewProps> = ({
  departments,
  onAddNewEmployee,
  showToast,
}) => {
  const [activeMode, setActiveMode] = useState<'onboarding' | 'offboarding'>('onboarding');
  const [onboardingStep, setOnboardingStep] = useState<number>(1);

  // Form State for Onboarding
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    dob: '1998-05-15',
    bloodGroup: 'O+',
    mobile: '+91 ',
    email: '',
    department: 'Injection Molding Division',
    designation: 'Junior Machine Operator',
    grade: 'G-01 (Operator)',
    employeeType: 'Permanent',
    plant: 'Plant 01 - Main Plastics Facility',
    shift: 'Shift A (06:00 - 14:00)',
    supervisor: 'Vikram Mehta',
    nationalId: 'XXXX-XXXX-8812',
    bankAccount: 'HDFC-XXXXXX4419',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRel: 'Spouse',
    address: 'MIDC Industrial Colony, Pune',
    assignedTraining: 'TR-IND-01 (Plastics Induction & Machine Safety)',
    shoeSize: 'UK 8',
    gloveSize: 'L',
  });

  const handleNextStep = () => {
    if (onboardingStep < 5) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      // Finalize Onboarding
      const newEmpId = `EMP-${Math.floor(1010 + Math.random() * 900)}`;
      onAddNewEmployee({
        id: newEmpId,
        firstName: formData.firstName || 'Rahul',
        lastName: formData.lastName || 'Shinde',
        gender: formData.gender as any,
        dob: formData.dob,
        bloodGroup: formData.bloodGroup,
        department: formData.department,
        designation: formData.designation,
        employeeType: formData.employeeType as any,
        status: 'Active',
        plant: formData.plant,
        shift: formData.shift,
        supervisor: formData.supervisor,
        mobile: formData.mobile || '+91 98220 12345',
        email: formData.email || `${formData.firstName.toLowerCase() || 'rahul'}.${formData.lastName.toLowerCase() || 'shinde'}@plasticserp.internal`,
        nationalIdMasked: formData.nationalId,
        bankAccountMasked: formData.bankAccount,
        emergencyContact: {
          name: formData.emergencyName || 'Sunita Shinde',
          relationship: formData.emergencyRel,
          phone: formData.emergencyPhone || '+91 98220 12346',
        },
        address: formData.address,
        joiningDate: new Date().toISOString().slice(0, 10),
        noticePeriodDays: 30,
        grade: formData.grade,
        costCenter: 'CC-1020-INJ',
        skills: [
          { skillId: 'SK-INJ-01', skillName: 'Machine Operation Basic', level: 'Trainee', validUntil: '2027-09-01', assessedBy: formData.supervisor },
        ],
        certifications: [],
        assignedTrainings: [
          { trainingId: 'TR-IND-01', name: 'Plastics Factory Induction & Machine Safety', assignedDate: new Date().toISOString().slice(0, 10), dueDate: '2026-09-30', status: 'Assigned' },
        ],
        issuedPpe: [
          { issueId: `PPE-ISS-${Date.now().toString().slice(-3)}`, ppeName: 'Steel Toe Safety Shoes S3', size: formData.shoeSize, issueDate: new Date().toISOString().slice(0, 10), replacementDueDate: '2027-09-01', status: 'In Use' },
          { issueId: `PPE-ISS-${(Date.now() + 1).toString().slice(-3)}`, ppeName: 'High-Heat Nitrile Gloves', size: formData.gloveSize, issueDate: new Date().toISOString().slice(0, 10), replacementDueDate: '2026-11-01', status: 'In Use' },
        ],
        leaveBalances: { casual: 6, sick: 6, earned: 0, compOff: 0 },
      });

      showToast(`Onboarding completed! New employee ${formData.firstName || 'Rahul'} ${formData.lastName || 'Shinde'} (${newEmpId}) activated in biometric system.`);
      setOnboardingStep(1);
      setFormData({ ...formData, firstName: '', lastName: '', email: '' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Mode Toggle */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-base text-[#14213D] flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#0F8B8D]" />
            <span>Employee Lifecycle Workflows: Onboarding &amp; Offboarding</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Standardized end-to-end multi-step onboarding checklists, safety inductions, PPE issuance, biometric registration, and exit clearance.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveMode('onboarding')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              activeMode === 'onboarding' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>New Employee Onboarding</span>
          </button>
          <button
            onClick={() => setActiveMode('offboarding')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              activeMode === 'offboarding' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-rose-600" />
            <span>Exit &amp; Offboarding Pipeline</span>
          </button>
        </div>
      </div>

      {/* Onboarding Mode */}
      {activeMode === 'onboarding' && (
        <div className="space-y-5">
          {/* Stepper Progress Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between max-w-4xl mx-auto text-xs">
              {[
                { step: 1, label: '1. Personal & KYC' },
                { step: 2, label: '2. Job & Shift' },
                { step: 3, label: '3. Safety & Training' },
                { step: 4, label: '4. PPE & Biometric' },
                { step: 5, label: '5. Review & Activate' },
              ].map((st) => (
                <div key={st.step} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      onboardingStep === st.step
                        ? 'bg-[#E8622C] text-white shadow-xs'
                        : onboardingStep > st.step
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {onboardingStep > st.step ? <CheckCircle2 className="w-4 h-4" /> : st.step}
                  </div>
                  <span className={`hidden sm:inline font-semibold ${onboardingStep === st.step ? 'text-[#14213D]' : 'text-slate-500'}`}>
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Form Container */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs max-w-4xl mx-auto">
            {/* Step 1: Personal & KYC */}
            {onboardingStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#14213D] pb-2 border-b border-slate-100">
                  Step 1: Personal Details &amp; KYC Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Last Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Shinde"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Mobile Number *</label>
                    <input
                      type="text"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Official Email</label>
                    <input
                      type="email"
                      placeholder="rahul.shinde@plasticserp.internal"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="O+">O Positive</option>
                      <option value="A+">A Positive</option>
                      <option value="B+">B Positive</option>
                      <option value="AB+">AB Positive</option>
                      <option value="O-">O Negative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">National ID (Masked)</label>
                    <input
                      type="text"
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Job & Shift */}
            {onboardingStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#14213D] pb-2 border-b border-slate-100">
                  Step 2: Department, Designation, Plant &amp; Shift Assignment
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Department *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      {departments.map((d) => (
                        <option key={d.code} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Designation &amp; Role *</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Employment Type</label>
                    <select
                      value={formData.employeeType}
                      onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract (Apex Manpower)</option>
                      <option value="Trainee">Apprentice / Trainee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Shift Assignment</label>
                    <select
                      value={formData.shift}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="Shift A (06:00 - 14:00)">Shift A (06:00 - 14:00)</option>
                      <option value="Shift B (14:00 - 22:00)">Shift B (14:00 - 22:00)</option>
                      <option value="Shift C (22:00 - 06:00)">Shift C (Night Rotational)</option>
                      <option value="General Shift (09:00 - 17:30)">General Shift (09:00 - 17:30)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Reporting Supervisor</label>
                    <input
                      type="text"
                      value={formData.supervisor}
                      onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Grade Level</label>
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Safety & Mandatory Training */}
            {onboardingStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#14213D] pb-2 border-b border-slate-100">
                  Step 3: Mandatory Plastics Safety Induction &amp; SOP Assignment
                </h3>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-bold text-slate-900">Plastics Factory Induction &amp; Machine Safety (TR-IND-01)</div>
                        <div className="text-[11px] text-slate-500">Includes emergency stop, gate interlocks, and purge safety.</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      Mandatory Day 1
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-bold text-slate-900">Hazardous Chemical Handling &amp; Resin MSDS (TR-CHEM-01)</div>
                        <div className="text-[11px] text-slate-500">Safe handling of organic pigments and high-temperature molten polymers.</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                      Week 1 Target
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: PPE & Biometric */}
            {onboardingStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#14213D] pb-2 border-b border-slate-100">
                  Step 4: Personal Protective Equipment (PPE) &amp; Biometric Gateway Enrollment
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Safety Shoes Size (S3 Steel Toe)</label>
                    <select
                      value={formData.shoeSize}
                      onChange={(e) => setFormData({ ...formData, shoeSize: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="UK 7">UK 7</option>
                      <option value="UK 8">UK 8</option>
                      <option value="UK 9">UK 9</option>
                      <option value="UK 10">UK 10</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">High-Heat Gloves Size</label>
                    <select
                      value={formData.gloveSize}
                      onChange={(e) => setFormData({ ...formData, gloveSize: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="M">Medium (M)</option>
                      <option value="L">Large (L)</option>
                      <option value="XL">Extra Large (XL)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                  <div className="font-bold text-indigo-900 flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-700" />
                    <span>Automated ERP User Account &amp; Biometric Turnstile Enrollment</span>
                  </div>
                  <p className="text-indigo-800 text-[11px]">
                    Activating this employee will instantly register their badge ID on Gateway Face-01 and Turnstile Main for seamless shift clock-ins.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Review & Activate */}
            {onboardingStep === 5 && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#14213D] pb-2 border-b border-slate-100">
                  Step 5: Final Review &amp; Onboarding Activation
                </h3>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employee Name:</span>
                    <strong className="text-slate-900">{formData.firstName || 'Rahul'} {formData.lastName || 'Shinde'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Department:</span>
                    <strong className="text-slate-900">{formData.department}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Designation / Role:</span>
                    <strong className="text-slate-900">{formData.designation}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shift Assignment:</span>
                    <strong className="text-[#0F8B8D]">{formData.shift}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supervisor:</span>
                    <strong className="text-slate-900">{formData.supervisor}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {onboardingStep > 1 ? (
                <button
                  onClick={() => setOnboardingStep(onboardingStep - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous Step</span>
                </button>
              ) : <div />}

              <button
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#E8622C] hover:bg-[#d55320] text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
              >
                <span>{onboardingStep === 5 ? 'Complete Onboarding & Activate Employee' : 'Next Step'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offboarding Mode Pipeline */}
      {activeMode === 'offboarding' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs max-w-4xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Employee Resignation &amp; Exit Clearance Pipeline</h3>
              <p className="text-slate-500">Track notice period, asset/PPE handover, ERP access revocation, and final settlement.</p>
            </div>
            <button
              onClick={() => showToast('Initiate Exit Request modal opened.')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold cursor-pointer hover:bg-rose-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Initiate Exit Request</span>
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'EXIT-2026-001',
                empName: 'Vikram Joshi (Senior Tool Setter)',
                empId: 'EMP-0941',
                dept: 'Tool Room & Mold Maint',
                lastDate: '2026-09-30',
                noticeDaysLeft: 29,
                status: 'Notice Period Tracking',
                stage: 'Handover & Tool Return',
              },
            ].map((exit) => (
              <div key={exit.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{exit.empName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{exit.empId} · {exit.dept}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                    {exit.noticeDaysLeft} Days Remaining
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400">Exit Approval</span>
                    <div className="font-bold text-emerald-600">✓ Approved</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400">Tool &amp; PPE Return</span>
                    <div className="font-bold text-amber-600">Pending Handover</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400">Access Revocation</span>
                    <div className="font-bold text-slate-400">Scheduled 30-Sep</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400">Final Settlement</span>
                    <div className="font-bold text-slate-400">Pending Clearance</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
