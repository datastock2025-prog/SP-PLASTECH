import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  Filter,
  Plus,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  Download,
  FileCheck,
} from 'lucide-react';
import { HrSkillMatrixRecord, HrTrainingProgram } from '../../types';

interface HrSkillsTrainingViewProps {
  skills: HrSkillMatrixRecord[];
  trainings: HrTrainingProgram[];
  onAddTraining: (training: HrTrainingProgram) => void;
  showToast: (msg: string) => void;
}

export const HrSkillsTrainingView: React.FC<HrSkillsTrainingViewProps> = ({
  skills,
  trainings,
  onAddTraining,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'trainings' | 'certifications'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<string>('All');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const filteredSkills = skills.filter((sk) => {
    const matchSearch =
      sk.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sk.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sk.machineOrProcess.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMachine = selectedMachine === 'All' || sk.machineOrProcess.includes(selectedMachine);
    return matchSearch && matchMachine;
  });

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 5:
        return <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[10px]">L5 Master / Trainer</span>;
      case 4:
        return <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold text-[10px]">L4 Expert</span>;
      case 3:
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">L3 Independent</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">L2 Supervised</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">L1 Trainee</span>;
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header & Tab Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <span>Manufacturing Skill Matrix &amp; Technical Training SOPs</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                IATF 16949 Compliant
              </span>
            </h2>
            <p className="text-slate-500">
              5-level operator competency matrix, machine certifications, mold changeover qualification, and mandatory EHS training programs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'matrix' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Skill Matrix ({skills.length})
            </button>
            <button
              onClick={() => setActiveTab('trainings')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'trainings' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Training Programs ({trainings.length})
            </button>
          </div>

          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#14213D] text-white rounded-lg font-bold hover:bg-[#1C2B4D] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#E8622C]" />
            <span>Schedule New Training</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search operator, skill, machine line, assessor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F8B8D]"
          />
        </div>

        <select
          value={selectedMachine}
          onChange={(e) => setSelectedMachine(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
        >
          <option value="All">All Processes &amp; Lines</option>
          <option value="Injection Molding">Injection Molding (Demag/Engel)</option>
          <option value="Extrusion">Extrusion Line 01</option>
          <option value="Mold Setter">Mold Setter &amp; Quick Clamping</option>
          <option value="Spectrophotometer">Quality Color Lab</option>
        </select>
      </div>

      {/* 1. Skill Matrix Table */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Operator / Code</th>
                  <th className="p-3">Machine / Process Competency</th>
                  <th className="p-3">Skill Category</th>
                  <th className="p-3">Certified Level</th>
                  <th className="p-3">Assessor / Auditor</th>
                  <th className="p-3">Validity</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSkills.map((sk) => (
                  <tr key={sk.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="font-bold text-[#14213D]">{sk.employeeName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{sk.employeeId}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{sk.machineOrProcess}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium text-[10px]">
                        {sk.category}
                      </span>
                    </td>
                    <td className="p-3">{getLevelBadge(sk.level)}</td>
                    <td className="p-3 text-slate-600">{sk.assessor}</td>
                    <td className="p-3 font-mono text-slate-600">{sk.validUntil}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => showToast(`Skill evaluation record opened for ${sk.employeeName}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 transition cursor-pointer"
                      >
                        Re-Assess
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Training Programs Catalog */}
      {activeTab === 'trainings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainings.map((tr) => (
            <div key={tr.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                    {tr.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tr.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tr.status === 'Ongoing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tr.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#14213D] leading-snug">{tr.title}</h3>
                <p className="text-slate-500 text-[11px]">{tr.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Trainer: <strong className="text-slate-800">{tr.trainer}</strong></span>
                  <span>Duration: <strong>{tr.durationHours} Hours</strong></span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Enrolled: <strong>{tr.enrolledEmployees.length} Staff</strong></span>
                  {tr.effectivenessScore && (
                    <span className="text-emerald-700 font-bold">Effectiveness: {tr.effectivenessScore}/100</span>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => showToast(`Opening enrollment roster for ${tr.title}`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs transition cursor-pointer"
                  >
                    View Roster
                  </button>
                  <button
                    onClick={() => showToast(`Training certificates generated for ${tr.title}`)}
                    className="px-3 py-1.5 bg-[#14213D] hover:bg-[#1C2B4D] text-white rounded-lg font-bold text-xs transition cursor-pointer"
                  >
                    Issue Certs
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Training Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>Schedule New Technical Training</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Robot Automation & Takeout Arm Programming"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input type="date" defaultValue="2026-09-15" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Hours)</label>
                  <input type="number" defaultValue="8" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trainer / Certification Body</label>
                <input
                  type="text"
                  placeholder="e.g. Engel Technical Academy"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast('Training program scheduled and calendar invitations dispatched.');
                  setIsScheduleModalOpen(false);
                }}
                className="px-4 py-2 bg-[#14213D] text-white rounded-lg font-bold hover:bg-[#1C2B4D] transition cursor-pointer"
              >
                Publish Program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
