import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Shield,
  Building,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  Tag,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import { UserGroup, mockUserGroups } from '../../data/mockAdminExtendedData';

interface AdminUserGroupsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminUserGroupsView: React.FC<AdminUserGroupsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [groups, setGroups] = useState<UserGroup[]>(mockUserGroups);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState<UserGroup>(groups[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    code: '',
    department: 'Production',
    description: '',
    supervisorName: '',
    plantAccess: ['Pune / Chakan Hub'],
    tags: 'Injection Molds, Critical',
  });

  const departments = ['ALL', 'Production', 'Tooling & Maintenance', 'Quality Assurance', 'Supply Chain & Warehousing', 'OEM Quality Compliance'];

  const filteredGroups = groups.filter((grp) => {
    const matchSearch =
      grp.name.toLowerCase().includes(search.toLowerCase()) ||
      grp.code.toLowerCase().includes(search.toLowerCase()) ||
      grp.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDept === 'ALL' || grp.department === selectedDept;
    return matchSearch && matchDept;
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupForm.name || !newGroupForm.code) {
      showToast('Please specify group name and code.');
      return;
    }
    const created: UserGroup = {
      id: `GRP-0${groups.length + 1}`,
      name: newGroupForm.name,
      code: newGroupForm.code.toUpperCase(),
      department: newGroupForm.department,
      description: newGroupForm.description,
      membersCount: 1,
      rolesAssigned: ['Standard Operator'],
      plantAccess: newGroupForm.plantAccess,
      supervisorName: newGroupForm.supervisorName || 'Plant Operations Lead',
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      tags: newGroupForm.tags.split(',').map((t) => t.trim()),
    };
    setGroups([created, ...groups]);
    setSelectedGroup(created);
    setIsModalOpen(false);
    setNewGroupForm({
      name: '',
      code: '',
      department: 'Production',
      description: '',
      supervisorName: '',
      plantAccess: ['Pune / Chakan Hub'],
      tags: 'Injection Molds, Critical',
    });
    showToast(`User Group "${created.name}" created successfully.`);
  };

  const handleToggleStatus = (id: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const nextStatus = g.status === 'Active' ? 'Inactive' : 'Active';
          showToast(`Group "${g.name}" set to ${nextStatus}.`);
          return { ...g, status: nextStatus };
        }
        return g;
      })
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Users className="w-4 h-4 text-[#0F8B8D]" />
            <span>Identity &amp; Access Governance</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">User Groups &amp; Cross-Functional Crews</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize shopfloor technicians, mold maintenance gangs, and lab testing cohorts into hierarchical permission units.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Create User Group
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search groups by code, gang name, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedDept === dept
                  ? 'bg-[#0F8B8D] text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Split: Groups List & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-7 space-y-3">
          {filteredGroups.map((grp) => {
            const isSelected = selectedGroup?.id === grp.id;
            return (
              <div
                key={grp.id}
                onClick={() => setSelectedGroup(grp)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F8B8D]/5 border-[#0F8B8D] shadow-xs'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0F8B8D] border border-teal-200 flex items-center justify-center font-bold text-xs">
                      {grp.code.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-xs text-slate-900">{grp.name}</h3>
                        <span className="font-mono text-[10px] text-slate-500 px-1.5 py-0.2 bg-slate-100 rounded">
                          {grp.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{grp.department}</span>
                        <span>&middot;</span>
                        <span className="text-[#0F8B8D] font-semibold">{grp.membersCount} Crew Members</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      grp.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {grp.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">{grp.description}</p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Roles: {grp.rolesAssigned.join(', ')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Group Inspector Panel */}
        {selectedGroup && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5 h-fit sticky top-4">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Group Profile
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedGroup.name}</h2>
                <span className="font-mono text-xs text-[#0F8B8D] font-semibold">{selectedGroup.code}</span>
              </div>

              <button
                onClick={() => handleToggleStatus(selectedGroup.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedGroup.status === 'Active'
                    ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    : 'bg-emerald-600 text-white border-transparent'
                }`}
              >
                {selectedGroup.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>

            {/* Crew Specs */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-900">{selectedGroup.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gang Supervisor:</span>
                  <span className="font-semibold text-slate-900">{selectedGroup.supervisorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Enrolled Personnel:</span>
                  <span className="font-bold text-[#0F8B8D]">{selectedGroup.membersCount} Operators / Techs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authorized Plants:</span>
                  <span className="font-semibold text-slate-900 text-right">{selectedGroup.plantAccess.join(', ')}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assigned Security Roles:</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGroup.rolesAssigned.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium text-[11px]"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Operational Tags:</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGroup.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="font-semibold text-slate-700 block mb-1">Description &amp; Mandate:</label>
                <p className="p-3 bg-slate-50 rounded-lg text-slate-600 leading-relaxed text-[11.5px]">
                  {selectedGroup.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => showToast(`Dispatched member roster export for ${selectedGroup.code}.`)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Export Crew Roster
              </button>
              <button
                onClick={() => showToast(`Opened member assignment drawer for ${selectedGroup.name}.`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0c7274]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Members
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create User Group */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">Create New User Group</h3>
            <p className="text-xs text-slate-500 mb-4">
              Group operators, quality inspectors, or technicians to assign shared authorizations in bulk.
            </p>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ultrasonic Welding Cell Operators"
                    value={newGroupForm.name}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Group Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELD-CELL-01"
                    value={newGroupForm.code}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newGroupForm.department}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Production">Production</option>
                    <option value="Tooling & Maintenance">Tooling & Maintenance</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Supply Chain & Warehousing">Supply Chain & Warehousing</option>
                    <option value="OEM Quality Compliance">OEM Quality Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Supervisor</label>
                  <input
                    type="text"
                    placeholder="e.g. Kailash Deshmukh"
                    value={newGroupForm.supervisorName}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, supervisorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operational Description</label>
                <textarea
                  rows={3}
                  placeholder="Define role scope, equipment authorized, and safety certifications..."
                  value={newGroupForm.description}
                  onChange={(e) => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="Molds, High-Tonnage, Night Shift"
                  value={newGroupForm.tags}
                  onChange={(e) => setNewGroupForm({ ...newGroupForm, tags: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm"
                >
                  Save User Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
