import React, { useState, useEffect } from 'react';
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
  X,
  Check,
  Download,
  AlertCircle,
  Clock,
  Briefcase,
} from 'lucide-react';
import { UserGroup, mockUserGroups } from '../../data/mockAdminExtendedData';
import { adminService } from '../../services/adminService';
import { AdminUser } from '../../types/admin';
import { mockAdminUsers } from '../../data/mockAdminData';

interface AdminUserGroupsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminUserGroupsView: React.FC<AdminUserGroupsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [groups, setGroups] = useState<UserGroup[]>(mockUserGroups);
  const [allUsers, setAllUsers] = useState<AdminUser[]>(mockAdminUsers);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState<UserGroup>(groups[0]);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Group Member Enrollment State (Group ID -> User IDs)
  const [groupMembersMap, setGroupMembersMap] = useState<Record<string, string[]>>({
    'GRP-01': ['USR-01', 'USR-04', 'USR-07'],
    'GRP-02': ['USR-02', 'USR-07'],
    'GRP-03': ['USR-03', 'USR-05'],
    'GRP-04': ['USR-05', 'USR-06'],
    'GRP-05': ['USR-03', 'USR-01'],
  });

  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Form State
  const [groupForm, setGroupForm] = useState({
    name: '',
    code: '',
    department: 'Production',
    description: '',
    supervisorName: '',
    plantAccess: ['Pune / Chakan Hub'],
    rolesAssigned: ['Standard Operator'],
    tags: 'Injection Molds, Critical',
  });

  // Load live users from adminService
  useEffect(() => {
    adminService.getUsers().then((users) => {
      if (users && users.length > 0) {
        setAllUsers(users);
      }
    });
  }, []);

  const departments = [
    'ALL',
    'Production',
    'Tooling & Maintenance',
    'Quality Assurance',
    'Supply Chain & Warehousing',
    'OEM Quality Compliance',
  ];

  const filteredGroups = groups.filter((grp) => {
    const matchSearch =
      grp.name.toLowerCase().includes(search.toLowerCase()) ||
      grp.code.toLowerCase().includes(search.toLowerCase()) ||
      grp.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDept === 'ALL' || grp.department === selectedDept;
    return matchSearch && matchDept;
  });

  // Toggle Group Status (Active / Inactive)
  const handleToggleStatus = (id: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const nextStatus = g.status === 'Active' ? 'Inactive' : 'Active';
          const updated = { ...g, status: nextStatus as 'Active' | 'Inactive' };
          if (selectedGroup.id === id) setSelectedGroup(updated);
          showToast(`Group "${g.name}" set to ${nextStatus}.`);
          return updated;
        }
        return g;
      })
    );
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setGroupForm({
      name: '',
      code: `GRP-0${groups.length + 1}`,
      department: 'Production',
      description: '',
      supervisorName: 'Priya Rao',
      plantAccess: ['Pune / Chakan Hub', 'Sanand Precision'],
      rolesAssigned: ['Operator Level-2'],
      tags: 'Floor Gang, Shift A',
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (grp: UserGroup) => {
    setGroupForm({
      name: grp.name,
      code: grp.code,
      department: grp.department,
      description: grp.description,
      supervisorName: grp.supervisorName,
      plantAccess: grp.plantAccess,
      rolesAssigned: grp.rolesAssigned,
      tags: grp.tags.join(', '),
    });
    setIsEditModalOpen(true);
  };

  // Save Create Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name || !groupForm.code) {
      showToast('Please specify group name and code.');
      return;
    }
    const createdId = `GRP-0${groups.length + 1}`;
    const created: UserGroup = {
      id: createdId,
      name: groupForm.name,
      code: groupForm.code.toUpperCase(),
      department: groupForm.department,
      description: groupForm.description || 'Cross-functional crew unit.',
      membersCount: 0,
      rolesAssigned: groupForm.rolesAssigned,
      plantAccess: groupForm.plantAccess,
      supervisorName: groupForm.supervisorName || 'Plant Operations Lead',
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      tags: groupForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    setGroups([created, ...groups]);
    setSelectedGroup(created);
    setGroupMembersMap((prev) => ({ ...prev, [createdId]: [] }));
    setIsCreateModalOpen(false);
    showToast(`User Group "${created.name}" created successfully.`);
  };

  // Save Edit Group
  const handleSaveEditGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name || !groupForm.code || !selectedGroup) return;

    const updated: UserGroup = {
      ...selectedGroup,
      name: groupForm.name,
      code: groupForm.code.toUpperCase(),
      department: groupForm.department,
      description: groupForm.description,
      supervisorName: groupForm.supervisorName,
      plantAccess: groupForm.plantAccess,
      rolesAssigned: groupForm.rolesAssigned,
      tags: groupForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    setGroups((prev) => prev.map((g) => (g.id === selectedGroup.id ? updated : g)));
    setSelectedGroup(updated);
    setIsEditModalOpen(false);
    showToast(`User Group "${updated.name}" updated successfully.`);
  };

  // Open Add Members Modal
  const handleOpenAddMembers = () => {
    if (!selectedGroup) return;
    const currentMemberIds = groupMembersMap[selectedGroup.id] || [];
    setSelectedMemberIds([...currentMemberIds]);
    setMemberSearch('');
    setIsAddMemberModalOpen(true);
  };

  // Toggle user enrollment selection
  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Save Members Enrollment
  const handleSaveMembers = () => {
    if (!selectedGroup) return;
    const count = selectedMemberIds.length;
    setGroupMembersMap((prev) => ({
      ...prev,
      [selectedGroup.id]: selectedMemberIds,
    }));

    const updatedGroup: UserGroup = {
      ...selectedGroup,
      membersCount: count,
    };

    setGroups((prev) => prev.map((g) => (g.id === selectedGroup.id ? updatedGroup : g)));
    setSelectedGroup(updatedGroup);
    setIsAddMemberModalOpen(false);
    showToast(`Updated crew enrollment for "${selectedGroup.name}": ${count} members assigned.`);
  };

  // Export Crew Roster CSV
  const handleExportRoster = () => {
    if (!selectedGroup) return;
    const enrolledIds = groupMembersMap[selectedGroup.id] || [];
    const enrolledUsers = allUsers.filter((u) => enrolledIds.includes(u.id));

    const csvContent = [
      ['Group Code', 'Group Name', 'Department', 'Member ID', 'Member Name', 'Email', 'Role', 'Status'],
      ...(enrolledUsers.length > 0
        ? enrolledUsers.map((u) => [
            `"${selectedGroup.code}"`,
            `"${selectedGroup.name}"`,
            `"${selectedGroup.department}"`,
            `"${u.id}"`,
            `"${u.fullName}"`,
            `"${u.email}"`,
            `"${u.roleName}"`,
            `"${u.status}"`,
          ])
        : [[
            `"${selectedGroup.code}"`,
            `"${selectedGroup.name}"`,
            `"${selectedGroup.department}"`,
            '"No members enrolled"',
            '""',
            '""',
            '""',
            '""',
          ]]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Crew_Roster_${selectedGroup.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded crew roster for "${selectedGroup.name}".`);
  };

  const filteredCandidateUsers = allUsers.filter((u) => {
    const q = memberSearch.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.designation.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  });

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
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto cursor-pointer"
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
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedGroup)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Edit Group Details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleToggleStatus(selectedGroup.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    selectedGroup.status === 'Active'
                      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700'
                  }`}
                >
                  {selectedGroup.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
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
                onClick={handleExportRoster}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export Crew Roster
              </button>
              <button
                onClick={handleOpenAddMembers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0c7274] transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Members ({selectedGroup.membersCount})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD / MANAGE MEMBERS MODAL */}
      {/* ========================================================================= */}
      {isAddMemberModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Enroll Members &mdash; {selectedGroup.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select technicians, operators, or supervisors to assign to this operational crew.
                </p>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees by name, designation, department..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 max-h-96 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Available Enterprise Personnel ({filteredCandidateUsers.length})
              </div>

              {filteredCandidateUsers.map((user) => {
                const isEnrolled = selectedMemberIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleToggleMember(user.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isEnrolled
                        ? 'bg-teal-50/70 border-[#0F8B8D] text-teal-950 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white bg-gradient-to-tr ${
                          user.avatarColor || 'from-[#0F8B8D] to-[#E8622C]'
                        }`}
                      >
                        {user.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{user.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400">({user.username})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {user.designation} &middot; {user.department}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isEnrolled
                          ? 'bg-[#0F8B8D] border-[#0F8B8D] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isEnrolled && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                <strong>{selectedMemberIds.length}</strong> personnel selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMembers}
                  className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Save Enrolled Members
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT USER GROUP */}
      {/* ========================================================================= */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {isEditModalOpen ? `Edit ${groupForm.code}` : 'Create New User Group'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={isEditModalOpen ? handleSaveEditGroup : handleCreateGroup}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ultrasonic Welding Cell Operators"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Group Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELD-CELL-01"
                    value={groupForm.code}
                    onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={groupForm.department}
                    onChange={(e) => setGroupForm({ ...groupForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Production">Production</option>
                    <option value="Tooling & Maintenance">Tooling &amp; Maintenance</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Supply Chain & Warehousing">Supply Chain &amp; Warehousing</option>
                    <option value="OEM Quality Compliance">OEM Quality Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gang Supervisor</label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram Patel"
                    value={groupForm.supervisorName}
                    onChange={(e) => setGroupForm({ ...groupForm, supervisorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description &amp; Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Describe operational responsibilities and shift coverage..."
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operational Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Injection Molds, Shift A, Critical"
                  value={groupForm.tags}
                  onChange={(e) => setGroupForm({ ...groupForm, tags: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] text-white font-semibold hover:bg-[#0c7274] shadow-sm cursor-pointer"
                >
                  {isEditModalOpen ? 'Save Group Details' : 'Create User Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
