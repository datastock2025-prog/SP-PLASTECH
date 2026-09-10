import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  UserCheck,
  Award,
  Calendar,
  AlertTriangle,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  Shield,
  Briefcase,
  Layers,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { HrEmployee, HrEmployeeStatus, HrEmployeeType } from '../../types';

interface HrEmployeeListViewProps {
  employees: HrEmployee[];
  onSelectEmployee: (employeeId: string) => void;
  onAddEmployeeModal: () => void;
  showToast: (msg: string) => void;
}

export const HrEmployeeListView: React.FC<HrEmployeeListViewProps> = ({
  employees,
  onSelectEmployee,
  onAddEmployeeModal,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedShift, setSelectedShift] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [savedView, setSavedView] = useState<string>('All');

  // Filter logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.mobile.includes(searchTerm) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'All' || emp.department === selectedDept || emp.department.includes(selectedDept);
    const matchesShift = selectedShift === 'All' || emp.shift.includes(selectedShift);
    const matchesType = selectedType === 'All' || emp.employeeType === selectedType;
    const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;

    // Saved view filter
    let matchesSavedView = true;
    if (savedView === 'Active') matchesSavedView = emp.status === 'Active' || emp.status === 'Probation';
    if (savedView === 'Contract') matchesSavedView = emp.employeeType === 'Contract';
    if (savedView === 'Operators') matchesSavedView = emp.designation.includes('Operator');
    if (savedView === 'ExpiringCerts') {
      matchesSavedView = emp.certifications.some((c) => c.status === 'Expiring Soon' || c.status === 'Expired');
    }
    if (savedView === 'OverdueTraining') {
      matchesSavedView = emp.assignedTrainings.some((t) => t.status === 'Overdue');
    }

    return matchesSearch && matchesDept && matchesShift && matchesType && matchesStatus && matchesSavedView;
  });

  const getStatusBadge = (status: HrEmployeeStatus) => {
    switch (status) {
      case 'Active':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Active</span>;
      case 'Probation':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Probation</span>;
      case 'Contract':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Contract</span>;
      case 'Trainee':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Trainee</span>;
      case 'Suspended':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Suspended</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Employee ID,Name,Department,Designation,Type,Shift,Status,Joining Date,Mobile,Email']
        .concat(
          filteredEmployees.map(
            (e) =>
              `${e.id},"${e.firstName} ${e.lastName}",${e.department},${e.designation},${e.employeeType},${e.shift},${e.status},${e.joiningDate},${e.mobile},${e.email}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `plastic_erp_employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Employee Master dataset exported to CSV.');
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-base text-[#14213D] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0F8B8D]" />
            <span>Employee Master Directory</span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-mono">
              {filteredEmployees.length} of {employees.length} records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full manufacturing workforce master: technicians, machine operators, mold specialists, QA inspectors, and supervisors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => showToast('Bulk Import CSV template downloaded.')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <button
            onClick={onAddEmployeeModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E8622C] text-white rounded-lg text-xs font-bold hover:bg-[#d55320] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Saved Views Pill Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Views:</span>
        {[
          { id: 'All', label: 'All Employees' },
          { id: 'Active', label: 'Active Staff' },
          { id: 'Contract', label: 'Contract Workers' },
          { id: 'Operators', label: 'Machine Operators' },
          { id: 'ExpiringCerts', label: 'Expiring Certifications ⚠️' },
          { id: 'OverdueTraining', label: 'Overdue Training ⚠️' },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setSavedView(view.id)}
            className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition cursor-pointer ${
              savedView === view.id
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search code, name, designation, mobile, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F8B8D]"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
        >
          <option value="All">All Departments</option>
          <option value="Injection Molding">Injection Molding</option>
          <option value="Extrusion">Extrusion</option>
          <option value="Quality">Quality QA/QC</option>
          <option value="Tool Room">Tool Room &amp; Mold</option>
          <option value="Warehouse">Warehouse &amp; Logistics</option>
          <option value="Maintenance">Maintenance &amp; MEP</option>
          <option value="EHS">EHS &amp; Safety</option>
        </select>

        <select
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
        >
          <option value="All">All Shifts</option>
          <option value="Shift A">Shift A (06:00-14:00)</option>
          <option value="Shift B">Shift B (14:00-22:00)</option>
          <option value="Shift C">Shift C (Night)</option>
          <option value="General Shift">General Shift</option>
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
        >
          <option value="All">All Types</option>
          <option value="Permanent">Permanent</option>
          <option value="Contract">Contract</option>
          <option value="Trainee">Trainee</option>
          <option value="Apprentice">Apprentice</option>
        </select>

        {(searchTerm || selectedDept !== 'All' || selectedShift !== 'All' || selectedType !== 'All' || savedView !== 'All') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDept('All');
              setSelectedShift('All');
              setSelectedType('All');
              setSavedView('All');
            }}
            className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Employee Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Staff / Code</th>
                <th className="p-3">Department</th>
                <th className="p-3">Designation &amp; Grade</th>
                <th className="p-3">Type</th>
                <th className="p-3">Shift</th>
                <th className="p-3">Supervisor</th>
                <th className="p-3">Key Qualifications</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No employee records match the active search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const hasExpiringCert = emp.certifications.some((c) => c.status === 'Expiring Soon');
                  const hasOverdueTraining = emp.assignedTrainings.some((t) => t.status === 'Overdue');
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => onSelectEmployee(emp.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      {/* Avatar & Name */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#14213D] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                            {emp.firstName[0]}
                            {emp.lastName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{emp.firstName} {emp.lastName}</span>
                              {hasExpiringCert && (
                                <span title="Certification expiring soon" className="text-amber-500 text-[11px]">⚠️</span>
                              )}
                              {hasOverdueTraining && (
                                <span title="Training overdue" className="text-rose-500 text-[11px]">⏰</span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">{emp.id} · {emp.mobile}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-medium text-slate-800">
                        {emp.department}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-[#14213D]">{emp.designation}</div>
                        <div className="text-[10px] font-mono text-slate-500">{emp.grade}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {emp.employeeType}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="text-xs font-semibold text-slate-800">{emp.shift}</span>
                      </td>

                      <td className="p-3 text-slate-600">{emp.supervisor}</td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {emp.skills.slice(0, 2).map((sk, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                              {sk.skillName.split(' ')[0]} ({sk.level.split(' ')[0]})
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3">
                        {getStatusBadge(emp.status)}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEmployee(emp.id);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold transition cursor-pointer"
                          title="View 360 Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
