import React, { useState } from 'react';
import {
  Layers,
  ChevronRight,
  ChevronDown,
  Building2,
  Users,
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  FolderTree,
  Briefcase,
  Sliders,
  DollarSign,
  Tag,
} from 'lucide-react';
import { HrDepartment, HrDesignation } from '../../types';

interface HrOrgStructureViewProps {
  departments: HrDepartment[];
  designations: HrDesignation[];
  onAddDepartment?: (dept: HrDepartment) => void;
  showToast: (msg: string) => void;
}

export const HrOrgStructureView: React.FC<HrOrgStructureViewProps> = ({
  departments,
  designations,
  showToast,
}) => {
  const [selectedDept, setSelectedDept] = useState<HrDepartment>(departments[0]);
  const [activeTab, setActiveTab] = useState<'tree' | 'departments' | 'designations'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'COMPANY': true,
    'PLANT-01': true,
    'DEPT-PROD': true,
    'DEPT-MEP': true,
  });

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.headName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDesignations = designations.filter((des) =>
    des.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    des.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    des.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Header & Tab switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[#14213D]">Company Organization &amp; Hierarchy</h2>
            <p className="text-xs text-slate-500">
              Manage departments, plant divisions, reporting lines, cost centers, and designation grades.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'tree' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Org Tree View
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'departments' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Department Master ({departments.length})
            </button>
            <button
              onClick={() => setActiveTab('designations')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'designations' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Designations Master ({designations.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Interactive Tree Panel */}
          <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-xs text-[#14213D] uppercase tracking-wider">Enterprise Tree</span>
              </div>
              <button
                onClick={() => showToast('Organization structure exported to PDF.')}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Export Chart
              </button>
            </div>

            {/* Tree Nodes */}
            <div className="space-y-1.5 text-xs font-medium">
              {/* Root: Enterprise */}
              <div>
                <div
                  onClick={() => toggleNode('COMPANY')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 text-white cursor-pointer hover:bg-slate-800 transition"
                >
                  {expandedNodes['COMPANY'] ? <ChevronDown className="w-3.5 h-3.5 text-[#E8622C]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#E8622C]" />}
                  <Building2 className="w-4 h-4 text-[#E8622C]" />
                  <span className="font-bold">Apex Plastics Corporation Ltd</span>
                  <span className="ml-auto text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">HQ Entity</span>
                </div>

                {expandedNodes['COMPANY'] && (
                  <div className="ml-4 pl-3 border-l-2 border-slate-200 mt-1.5 space-y-1.5">
                    {/* Plant Node */}
                    <div>
                      <div
                        onClick={() => toggleNode('PLANT-01')}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer text-[#14213D] transition"
                      >
                        {expandedNodes['PLANT-01'] ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                        <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" />
                        <span className="font-bold">Plant 01 - Pune Plastics Manufacturing Complex</span>
                        <span className="ml-auto text-[10px] text-slate-500">128 Staff</span>
                      </div>

                      {expandedNodes['PLANT-01'] && (
                        <div className="ml-4 pl-3 border-l-2 border-slate-200 mt-1.5 space-y-1">
                          {departments.map((dept) => {
                            const isSelected = selectedDept.code === dept.code;
                            const isParent = !dept.parentDept;
                            return (
                              <div
                                key={dept.code}
                                onClick={() => setSelectedDept(dept)}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                                  isSelected
                                    ? 'bg-[#14213D] text-white shadow-xs'
                                    : 'hover:bg-slate-100 text-slate-700'
                                } ${!isParent ? 'ml-3 text-[11px]' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      isSelected ? 'bg-[#E8622C]' : 'bg-[#0F8B8D]'
                                    }`}
                                  />
                                  <span className="font-semibold">{dept.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>
                                    {dept.headcount} staff
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Selected Department Details Card */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  {selectedDept.code}
                </span>
                <h3 className="text-lg font-bold text-[#14213D] mt-1">{selectedDept.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedDept.description}</p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {selectedDept.status}
              </span>
            </div>

            {/* Department Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px]">Head of Dept</span>
                <div className="font-bold text-[#14213D] text-sm mt-0.5">{selectedDept.headName}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px]">Cost Center</span>
                <div className="font-bold text-indigo-700 text-sm mt-0.5 font-mono">{selectedDept.costCenter}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px]">Active Headcount</span>
                <div className="font-bold text-[#14213D] text-sm mt-0.5">{selectedDept.headcount} Employees</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px]">Open Requisitions</span>
                <div className="font-bold text-[#E8622C] text-sm mt-0.5">{selectedDept.openPositions} Positions</div>
              </div>
            </div>

            {/* Designations in this department */}
            <div className="space-y-2.5 pt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Associated Designations &amp; Qualification Requirements
              </h4>
              <div className="space-y-2">
                {designations
                  .filter((des) => des.department === selectedDept.code || selectedDept.code === 'DEPT-PROD')
                  .slice(0, 4)
                  .map((des) => (
                    <div
                      key={des.code}
                      className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-bold text-[#14213D] flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{des.name}</span>
                        </div>
                        <span className="text-[10px] font-bold font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {des.grade}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex flex-wrap gap-1.5 pt-1">
                        <span className="text-slate-400 font-semibold">Skills:</span>
                        {des.skillRequirements.map((sk, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => showToast(`Opening edit view for ${selectedDept.name}`)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Edit Department Master
              </button>
              <button
                onClick={() => showToast('Department headcount report generated.')}
                className="px-3.5 py-2 bg-[#14213D] hover:bg-[#1C2B4D] text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                View Staff Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Department Master Table */}
      {activeTab === 'departments' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search department, code, head..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F8B8D]"
              />
            </div>
            <button
              onClick={() => showToast('Add Department modal opened.')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F8B8D] text-white rounded-lg text-xs font-bold hover:bg-[#0c7072] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Dept Code</th>
                  <th className="p-3">Department Name</th>
                  <th className="p-3">Cost Center</th>
                  <th className="p-3">Head of Department</th>
                  <th className="p-3">Plant Facility</th>
                  <th className="p-3 text-center">Headcount</th>
                  <th className="p-3 text-center">Open Pos.</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDepts.map((d) => (
                  <tr key={d.code} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-[#14213D]">{d.code}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      {d.parentDept && (
                        <div className="text-[10px] text-slate-400">Parent: {d.parentDept}</div>
                      )}
                    </td>
                    <td className="p-3 font-mono text-indigo-700 font-semibold">{d.costCenter}</td>
                    <td className="p-3 font-medium text-slate-800">{d.headName}</td>
                    <td className="p-3 text-slate-500">{d.plant}</td>
                    <td className="p-3 text-center font-bold text-[#14213D]">{d.headcount}</td>
                    <td className="p-3 text-center font-bold text-[#E8622C]">{d.openPositions}</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Designations Master Table */}
      {activeTab === 'designations' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search designation or grade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F8B8D]"
              />
            </div>
            <button
              onClick={() => showToast('Add Designation master modal opened.')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14213D] text-white rounded-lg text-xs font-bold hover:bg-[#1C2B4D] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Designation</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Designation Code</th>
                  <th className="p-3">Designation Title</th>
                  <th className="p-3">Grade Level</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Reports To</th>
                  <th className="p-3">Mandatory Certifications</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDesignations.map((des) => (
                  <tr key={des.code} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-900">{des.code}</td>
                    <td className="p-3 font-bold text-[#14213D]">{des.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold rounded">
                        {des.grade}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{des.department}</td>
                    <td className="p-3 text-slate-600">{des.reportingDesignation}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {des.certificationRequirements.map((cert, idx) => (
                          <span key={idx} className="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded border border-indigo-100">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        {des.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
