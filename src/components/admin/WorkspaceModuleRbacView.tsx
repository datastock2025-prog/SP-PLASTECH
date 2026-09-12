import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Check,
  X,
  AlertTriangle,
  Lock,
  Unlock,
  Copy,
  Layers,
  Sparkles,
  Sliders,
  FileCheck,
  FolderTree,
  ArrowRight,
  Info,
  Clock,
  History,
  Grid,
  List,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Building,
  Activity,
  Cpu,
  ShoppingBag,
  Landmark,
  Users,
  Briefcase,
  BarChart3,
  ExternalLink,
  Menu,
  LayoutDashboard,
  ArrowLeftRight,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { NAVIGATION_GROUPS, NavGroupDef, NavItemDef } from '../../data/sidebarNavigationData';
import { useWorkspaceRbac } from '../../hooks/useWorkspaceRbac';
import { QuarantinedScreenRecord, ScreenSyncReport } from '../../types/workspaceRbac';

interface WorkspaceModuleRbacViewProps {
  showToast?: (msg: string) => void;
  onNavigate?: (view: string, param?: any) => void;
}

export const WorkspaceModuleRbacView: React.FC<WorkspaceModuleRbacViewProps> = ({
  showToast = (_msg: string) => {},
  onNavigate,
}) => {
  const {
    roles,
    visibilityMatrix,
    workspaceMatrix,
    sidebarMatrix,
    quarantinedScreens,
    pendingCount,
    auditLog,
    config,
    syncReport,
    isScreenVisible,
    isWorkspaceVisible,
    isSidebarVisible,
    setScreenVisibility,
    setWorkspaceVisibility,
    setSidebarVisibility,
    setDualVisibility,
    bulkSetScreens,
    bulkSetWorkspace,
    bulkSetSidebar,
    bulkSetDual,
    syncSidebarToWorkspace,
    syncWorkspaceToSidebar,
    syncAndDiscoverScreens,
    resetRoleToDefaults,
    copyRolePermissions,
    approveQuarantinedScreen,
    rejectQuarantinedScreen,
    registerNewScreen,
    updateConfig,
  } = useWorkspaceRbac();

  // Active top sub-tab
  const [activeSubTab, setActiveSubTab] = useState<
    'visibility_matrix' | 'screen_sync' | 'quarantine_approvals' | 'audit_log'
  >('visibility_matrix');

  // Role selection for visibility controls
  const [selectedRoleId, setSelectedRoleId] = useState<string>('operator');

  // Search and group filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [visibilityScopeFilter, setVisibilityScopeFilter] = useState<
    'ALL' | 'BOTH_VISIBLE' | 'WORKSPACE_ONLY' | 'SIDEBAR_ONLY' | 'HIDDEN'
  >('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<ScreenSyncReport | null>(syncReport || null);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedQuarantinedScreen, setSelectedQuarantinedScreen] = useState<QuarantinedScreenRecord | null>(null);
  const [approvalWorkspaceRoles, setApprovalWorkspaceRoles] = useState<string[]>([]);
  const [approvalSidebarRoles, setApprovalSidebarRoles] = useState<string[]>([]);
  const [approvalLinkBoth, setApprovalLinkBoth] = useState<boolean>(true);
  const [isCopyRoleModalOpen, setIsCopyRoleModalOpen] = useState(false);
  const [copySourceRoleId, setCopySourceRoleId] = useState<string>('plant_manager');

  // New screen registration form
  const [newScreenForm, setNewScreenForm] = useState({
    title: '',
    view: '',
    groupId: 'OPERATIONS',
    groupTitle: 'Operations',
    subGroup: 'Smart Automation',
    securityLevel: 'Standard' as 'Standard' | 'Elevated' | 'Restricted / Sovereign',
    description: '',
  });

  const selectedRoleDef = roles.find((r) => r.id === selectedRoleId) || roles[0];

  // Map category icons
  const getGroupIcon = (groupId: string) => {
    switch (groupId) {
      case 'HOME':
        return <Building className="w-4 h-4 text-indigo-600" />;
      case 'FRONT_OFFICE':
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'OPERATIONS':
        return <Cpu className="w-4 h-4 text-emerald-600" />;
      case 'PLANNING':
        return <FolderTree className="w-4 h-4 text-amber-600" />;
      case 'FINANCE':
        return <Landmark className="w-4 h-4 text-purple-600" />;
      case 'PEOPLE':
        return <Users className="w-4 h-4 text-pink-600" />;
      case 'PROCUREMENT':
        return <ShoppingBag className="w-4 h-4 text-cyan-600" />;
      case 'ANALYTICS':
        return <BarChart3 className="w-4 h-4 text-teal-600" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-slate-700" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600" />;
    }
  };

  // Combine static groups with approved quarantined modules
  const allGroups = useMemo(() => {
    const baseGroups: NavGroupDef[] = (NAVIGATION_GROUPS || []).map((g) => ({
      ...g,
      items: [...g.items],
    }));

    (quarantinedScreens || []).forEach((qs) => {
      if (qs.status === 'APPROVED') {
        let grp = baseGroups.find((g) => g.id === qs.groupId);
        if (!grp) {
          grp = {
            id: qs.groupId,
            title: qs.groupTitle,
            icon: 'Layers',
            defaultExpanded: true,
            items: [],
          };
          baseGroups.push(grp);
        }
        if (!grp.items.some((it) => it.view === qs.view)) {
          grp.items.push({
            id: `dyn-${qs.view}`,
            label: qs.title,
            view: qs.view,
            icon: 'Sparkles',
            subGroup: qs.subGroup || 'New Feature',
            badge: 'Approved',
            badgeColor: 'bg-emerald-600',
          });
        }
      }
    });

    return baseGroups;
  }, [quarantinedScreens]);

  // Flatten all items for lookup
  const allDiscoveredItems = useMemo(() => {
    return allGroups.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        groupId: group.id,
        groupTitle: group.title,
      }))
    );
  }, [allGroups]);

  // Statistics for selected role (Home Workspace vs Sidebar Menu)
  const roleStats = useMemo(() => {
    const total = allDiscoveredItems.length;
    let workspaceVisible = 0;
    let sidebarVisible = 0;
    let bothVisible = 0;

    allDiscoveredItems.forEach((it) => {
      const inWorkspace = isWorkspaceVisible(selectedRoleId, it.view);
      const inSidebar = isSidebarVisible(selectedRoleId, it.view);
      if (inWorkspace) workspaceVisible++;
      if (inSidebar) sidebarVisible++;
      if (inWorkspace && inSidebar) bothVisible++;
    });

    return {
      total,
      workspaceVisible,
      sidebarVisible,
      bothVisible,
      workspaceHidden: total - workspaceVisible,
      sidebarHidden: total - sidebarVisible,
      workspacePct: total > 0 ? Math.round((workspaceVisible / total) * 100) : 0,
      sidebarPct: total > 0 ? Math.round((sidebarVisible / total) * 100) : 0,
    };
  }, [allDiscoveredItems, selectedRoleId, workspaceMatrix, sidebarMatrix]);

  // Filter groups and items
  const filteredGroups = useMemo(() => {
    const q = searchQuery ? searchQuery.toLowerCase().trim() : '';

    return allGroups
      .map((group) => {
        if (selectedCategory !== 'ALL' && group.id !== selectedCategory) {
          return null;
        }

        const matchingItems = group.items.filter((item) => {
          const inWs = isWorkspaceVisible(selectedRoleId, item.view);
          const inSb = isSidebarVisible(selectedRoleId, item.view);

          // Visibility scope filter
          if (visibilityScopeFilter === 'BOTH_VISIBLE' && (!inWs || !inSb)) return false;
          if (visibilityScopeFilter === 'WORKSPACE_ONLY' && (!inWs || inSb)) return false;
          if (visibilityScopeFilter === 'SIDEBAR_ONLY' && (inWs || !inSb)) return false;
          if (visibilityScopeFilter === 'HIDDEN' && (inWs || inSb)) return false;

          if (!q) return true;
          return (
            item.label.toLowerCase().includes(q) ||
            (item.subGroup && item.subGroup.toLowerCase().includes(q)) ||
            group.title.toLowerCase().includes(q) ||
            item.view.toLowerCase().includes(q)
          );
        });

        if (matchingItems.length === 0) return null;

        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter(Boolean) as NavGroupDef[];
  }, [allGroups, searchQuery, selectedCategory, visibilityScopeFilter, selectedRoleId, workspaceMatrix, sidebarMatrix]);

  // Handle manual sync trigger
  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const report = syncAndDiscoverScreens('Admin Manual Trigger (Administration Module)');
      setLastSyncResult(report);
      setIsSyncing(false);
      showToast(
        `Auto-Sync Completed! Discovered ${report.totalDiscovered} screens across ${allGroups.length} domains.`
      );
    }, 450);
  };

  // Group-level batch toggles
  const handleToggleGroupWorkspace = (groupId: string, currentState: 'all' | 'none' | 'some') => {
    const group = allGroups.find((g) => g.id === groupId);
    if (!group) return;
    const views = group.items.map((i) => i.view);
    const shouldShow = currentState !== 'all';
    bulkSetWorkspace(selectedRoleId, views, shouldShow);
    showToast(
      `${shouldShow ? 'Unhid' : 'Hidden'} all ${views.length} modules in ${group.title} for ${selectedRoleDef.name} (Home Workspace).`
    );
  };

  const handleToggleGroupSidebar = (groupId: string, currentState: 'all' | 'none' | 'some') => {
    const group = allGroups.find((g) => g.id === groupId);
    if (!group) return;
    const views = group.items.map((i) => i.view);
    const shouldShow = currentState !== 'all';
    bulkSetSidebar(selectedRoleId, views, shouldShow);
    showToast(
      `${shouldShow ? 'Unhid' : 'Hidden'} all ${views.length} modules in ${group.title} for ${selectedRoleDef.name} (Sidebar Menu).`
    );
  };

  // Global actions for selected role
  const handleShowAllBoth = () => {
    const allViews = allDiscoveredItems.map((i) => i.view);
    bulkSetDual(selectedRoleId, allViews, true, true);
    showToast(`Enabled all ${allViews.length} modules in BOTH Home Workspace and Sidebar for ${selectedRoleDef.name}.`);
  };

  const handleHideAllBoth = () => {
    if (selectedRoleId === 'admin') {
      showToast('Admin role visibility is safeguarded and cannot be fully blanked.');
      return;
    }
    const optionalViews = allDiscoveredItems.filter((i) => i.view !== 'home').map((i) => i.view);
    bulkSetDual(selectedRoleId, optionalViews, false, false);
    showToast(`Restricted and hidden all optional modules from Home and Sidebar for ${selectedRoleDef.name}.`);
  };

  const handleSyncSidebarToWorkspace = () => {
    syncSidebarToWorkspace(selectedRoleId);
    showToast(`Mirrored Sidebar Menu visibility into Home Workspace for ${selectedRoleDef.name}.`);
  };

  const handleSyncWorkspaceToSidebar = () => {
    syncWorkspaceToSidebar(selectedRoleId);
    showToast(`Mirrored Home Workspace visibility into Sidebar Menu for ${selectedRoleDef.name}.`);
  };

  const handleResetDefaults = () => {
    resetRoleToDefaults(selectedRoleId);
    showToast(`Reset ${selectedRoleDef.name} to enterprise recommended visibility.`);
  };

  const handleCopyPermissions = () => {
    copyRolePermissions(copySourceRoleId, selectedRoleId);
    setIsCopyRoleModalOpen(false);
    const srcName = roles.find((r) => r.id === copySourceRoleId)?.name || copySourceRoleId;
    showToast(`Copied visibility configuration from ${srcName} to ${selectedRoleDef.name}.`);
  };

  // Approval modal openers
  const handleOpenApproveModal = (screen: QuarantinedScreenRecord) => {
    setSelectedQuarantinedScreen(screen);
    const initialRoles = screen.allowedRoles && screen.allowedRoles.length > 0 ? screen.allowedRoles : ['admin', 'plant_manager'];
    setApprovalWorkspaceRoles(initialRoles);
    setApprovalSidebarRoles(initialRoles);
    setApprovalLinkBoth(true);
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedQuarantinedScreen) return;
    const wsRoles = approvalWorkspaceRoles;
    const sbRoles = approvalLinkBoth ? approvalWorkspaceRoles : approvalSidebarRoles;
    const combinedRoles = Array.from(new Set([...wsRoles, ...sbRoles]));

    approveQuarantinedScreen(selectedQuarantinedScreen.id, combinedRoles, {
      showInWorkspaceRoles: wsRoles,
      showInSidebarRoles: sbRoles,
      approvedBy: 'Admin (Zero-Trust RBAC Console)',
    });

    setIsApprovalModalOpen(false);
    showToast(
      `Authorized "${selectedQuarantinedScreen.title}"! Published to ${wsRoles.length} workspace roles and ${sbRoles.length} sidebar roles.`
    );
    setSelectedQuarantinedScreen(null);
  };

  const handleRejectScreen = (screen: QuarantinedScreenRecord) => {
    rejectQuarantinedScreen(screen.id, 'Restricted under Zero-Trust Security Review', 'Admin');
    showToast(`Screen "${screen.title}" rejected and placed into Locked Restriction.`);
  };

  const handleCreateNewScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScreenForm.title.trim() || !newScreenForm.view.trim()) {
      showToast('Please provide both a Screen Title and View Key.');
      return;
    }

    const created = registerNewScreen({
      title: newScreenForm.title.trim(),
      view: newScreenForm.view.trim(),
      groupId: newScreenForm.groupId,
      groupTitle: newScreenForm.groupTitle,
      subGroup: newScreenForm.subGroup.trim(),
      securityLevel: newScreenForm.securityLevel,
      description: newScreenForm.description.trim(),
      registeredBy: 'Admin (Manual Route Provisioning)',
    });

    setIsRegisterModalOpen(false);
    setNewScreenForm({
      title: '',
      view: '',
      groupId: 'OPERATIONS',
      groupTitle: 'Operations',
      subGroup: 'Smart Automation',
      securityLevel: 'Standard',
      description: '',
    });

    showToast(`Screen "${created.title}" registered! Intercepted into Zero-Trust Quarantine Area.`);
    setActiveSubTab('quarantine_approvals');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Architecture Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-[#0F8B8D]">
                <Sliders className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-[#0F8B8D] uppercase tracking-wider">
                RBAC Governance • Workspace &amp; Sidebar Visibility Engine
              </span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {pendingCount} Pending Approval
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Administration Workspace &amp; Navigation Access Control
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl">
              Control and hide/unhide each module independently for the <strong>Home Workspace</strong> and the <strong>Sidebar Navigation Menu</strong> based on role. Newly created screens or routes are automatically discovered, registered, and held in the restriction area for zero-trust authorization.
            </p>
          </div>

          {/* Quick Action Button for Auto-Sync */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#0F8B8D] bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-all shadow-xs"
              title="Rescan and synchronize all application modules and routes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Scanning Routes...' : 'Auto-Sync Screens'}</span>
            </button>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Register Screen</span>
            </button>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-slate-500 font-medium flex items-center justify-between">
              <span>Discovered Modules</span>
              <Layers className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {allDiscoveredItems.length} Screens
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Across {allGroups.length} functional domains</div>
          </div>

          <div className="p-3 bg-teal-50/70 rounded-lg border border-teal-200">
            <div className="text-[#0F8B8D] font-medium flex items-center justify-between">
              <span>Dual Architecture</span>
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#0F8B8D]" />
            </div>
            <div className="text-lg font-bold text-teal-950 mt-0.5">
              Home + Sidebar
            </div>
            <div className="text-[11px] text-[#0F8B8D] mt-0.5">Independent role visibility</div>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200">
            <div className="text-amber-800 font-medium flex items-center justify-between">
              <span>Quarantine Area</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-lg font-bold text-amber-900 mt-0.5">
              {pendingCount} Pending
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">Awaiting admin clearance</div>
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-200">
            <div className="text-indigo-800 font-medium flex items-center justify-between">
              <span>Auto-Discovery Engine</span>
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-lg font-bold text-indigo-950 mt-0.5">
              Automated &amp; Live
            </div>
            <div className="text-[11px] text-indigo-700 mt-0.5">Synced to admin side</div>
          </div>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('visibility_matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
            activeSubTab === 'visibility_matrix'
              ? 'border-[#0F8B8D] text-[#0F8B8D]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Role Module &amp; Sidebar Visibility</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {roleStats.bothVisible}/{roleStats.total} Synced
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('screen_sync')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
            activeSubTab === 'screen_sync'
              ? 'border-[#0F8B8D] text-[#0F8B8D]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Discovered Screens &amp; Auto-Sync</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 text-[#0F8B8D] font-bold">
            {allDiscoveredItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('quarantine_approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all relative ${
            activeSubTab === 'quarantine_approvals'
              ? 'border-[#0F8B8D] text-[#0F8B8D]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>New Screen Approvals &amp; Restriction</span>
          {pendingCount > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
              {pendingCount}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
              Clear
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('audit_log')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
            activeSubTab === 'audit_log'
              ? 'border-[#0F8B8D] text-[#0F8B8D]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Governance &amp; Sync Audit Trail</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {auditLog.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: Role Module & Sidebar Visibility Matrix */}
      {/* ========================================================================= */}
      {activeSubTab === 'visibility_matrix' && (
        <div className="space-y-6">
          {/* Role Selection Ribbon */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#0F8B8D]" />
                <span>Select Role to Configure Dual Visibility (Workspace &amp; Sidebar):</span>
              </div>
              <div className="text-xs text-slate-500">
                Current Role: <strong className="text-slate-800">{selectedRoleDef.name}</strong> ({selectedRoleDef.scope})
              </div>
            </div>

            {/* Role Pills */}
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => {
                const isSelected = role.id === selectedRoleId;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#0F8B8D] text-white border-[#0F8B8D] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span>{role.name}</span>
                    {role.id === 'admin' && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-sm ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        Super
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Role Summary & Dual Sync Controls Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
                  <UserCheck className="w-5 h-5 text-[#0F8B8D]" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedRoleDef.name}</span>
                    <span className="text-[11px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {selectedRoleDef.scope}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5 text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-medium">
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#0F8B8D]" />
                      <strong>{roleStats.workspaceVisible}</strong> / {roleStats.total} in Home Workspace ({roleStats.workspacePct}%)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-medium">
                      <Menu className="w-3.5 h-3.5 text-indigo-600" />
                      <strong>{roleStats.sidebarVisible}</strong> / {roleStats.total} in Sidebar Menu ({roleStats.sidebarPct}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Role Mirroring */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSyncSidebarToWorkspace}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  title="Copy Sidebar Menu visibility to Home Workspace"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
                  Sidebar → Home
                </button>
                <button
                  onClick={handleSyncWorkspaceToSidebar}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  title="Copy Home Workspace visibility to Sidebar Menu"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
                  Home → Sidebar
                </button>
                <button
                  onClick={handleShowAllBoth}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  title="Unhide all modules in both Home and Sidebar"
                >
                  Unhide Both
                </button>
                <button
                  onClick={handleHideAllBoth}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  title="Hide all optional modules from both Home and Sidebar"
                >
                  Hide Both
                </button>
                <button
                  onClick={handleResetDefaults}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  title="Restore default role visibility"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={() => setIsCopyRoleModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0F8B8D] bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors"
                  title="Copy configuration from another role"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Clone From...
                </button>
              </div>
            </div>
          </div>

          {/* Search, Filter & Scope Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search Bar */}
              <div className="relative min-w-[240px] flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search screens by name, route ID (/woList), or subgroup..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
              >
                <option value="ALL">All Categories ({allGroups.length})</option>
                {allGroups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.title} ({grp.items.length})
                  </option>
                ))}
              </select>

              {/* Visibility Status Filter */}
              <select
                value={visibilityScopeFilter}
                onChange={(e) => setVisibilityScopeFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
              >
                <option value="ALL">All Visibility States</option>
                <option value="BOTH_VISIBLE">Visible in Both (Home &amp; Sidebar)</option>
                <option value="WORKSPACE_ONLY">Home Workspace Only</option>
                <option value="SIDEBAR_ONLY">Sidebar Menu Only</option>
                <option value="HIDDEN">Hidden in Both</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Cards View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Table View
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: Dual Visibility Cards */}
          {viewMode === 'cards' && (
            <div className="space-y-4">
              {filteredGroups.map((group) => {
                const groupItemViews = group.items.map((it) => it.view);
                const wsVisibleCount = group.items.filter((it) => isWorkspaceVisible(selectedRoleId, it.view)).length;
                const sbVisibleCount = group.items.filter((it) => isSidebarVisible(selectedRoleId, it.view)).length;
                const totalCount = group.items.length;

                const wsState: 'all' | 'none' | 'some' =
                  wsVisibleCount === totalCount ? 'all' : wsVisibleCount === 0 ? 'none' : 'some';
                const sbState: 'all' | 'none' | 'some' =
                  sbVisibleCount === totalCount ? 'all' : sbVisibleCount === 0 ? 'none' : 'some';

                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                  >
                    {/* Group Header with Dual Category Controls */}
                    <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {getGroupIcon(group.id)}
                        <div>
                          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>{group.title} Domain</span>
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.2 rounded-full">
                              {totalCount} Screens
                            </span>
                          </h2>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Home: <strong className="text-teal-700">{wsVisibleCount}</strong>/{totalCount} • Sidebar: <strong className="text-indigo-700">{sbVisibleCount}</strong>/{totalCount}
                          </div>
                        </div>
                      </div>

                      {/* Group-level batch toggles */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                          <LayoutDashboard className="w-3.5 h-3.5 text-[#0F8B8D]" />
                          <span className="font-semibold text-slate-700">Home:</span>
                          <button
                            onClick={() => handleToggleGroupWorkspace(group.id, wsState)}
                            className="text-[11px] font-medium text-slate-600 hover:text-[#0F8B8D] hover:underline"
                          >
                            {wsState === 'all' ? 'Hide All' : 'Show All'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                          <Menu className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-semibold text-slate-700">Sidebar:</span>
                          <button
                            onClick={() => handleToggleGroupSidebar(group.id, sbState)}
                            className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 hover:underline"
                          >
                            {sbState === 'all' ? 'Hide All' : 'Show All'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Module Items Grid with Dual Toggles */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.items.map((item) => {
                        const inWorkspace = isWorkspaceVisible(selectedRoleId, item.view);
                        const inSidebar = isSidebarVisible(selectedRoleId, item.view);
                        const isQuarantined = quarantinedScreens.some(
                          (q) => q.view === item.view && q.status === 'PENDING_APPROVAL'
                        );

                        return (
                          <div
                            key={item.id || item.view}
                            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                              inWorkspace || inSidebar
                                ? 'bg-white border-slate-200 shadow-2xs hover:border-[#0F8B8D]'
                                : 'bg-slate-50/80 border-slate-200/70 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 min-w-0">
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  <span className="truncate">{item.label}</span>
                                  {isQuarantined && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-sm bg-amber-100 text-amber-800">
                                      Quarantined
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-mono text-slate-400">/{item.view}</span>
                                  {item.subGroup && (
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-sm truncate">
                                      {item.subGroup}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* State Badge */}
                              <div className="shrink-0">
                                {inWorkspace && inSidebar ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Both Visible
                                  </span>
                                ) : inWorkspace ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#0F8B8D] border border-teal-200">
                                    Home Only
                                  </span>
                                ) : inSidebar ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Sidebar Only
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                    Hidden
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Dual Toggles Row */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                              {/* Home Workspace Toggle */}
                              <label
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer select-none transition-colors flex-1 ${
                                  inWorkspace
                                    ? 'bg-teal-50/80 border-teal-300 text-[#0F8B8D]'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={inWorkspace}
                                  onChange={(e) => {
                                    if (selectedRoleId === 'admin' && item.view === 'home') return;
                                    setWorkspaceVisibility(selectedRoleId, item.view, e.target.checked);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#0F8B8D] focus:ring-[#0F8B8D]"
                                />
                                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-semibold text-[11px] truncate">Home</span>
                              </label>

                              {/* Sidebar Navigation Toggle */}
                              <label
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer select-none transition-colors flex-1 ${
                                  inSidebar
                                    ? 'bg-indigo-50/80 border-indigo-300 text-indigo-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={inSidebar}
                                  onChange={(e) => {
                                    if (selectedRoleId === 'admin' && item.view === 'home') return;
                                    setSidebarVisibility(selectedRoleId, item.view, e.target.checked);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <Menu className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-semibold text-[11px] truncate">Sidebar</span>
                              </label>

                              {/* Quick Toggle Both */}
                              <button
                                onClick={() => {
                                  if (selectedRoleId === 'admin' && item.view === 'home') return;
                                  const targetState = !(inWorkspace && inSidebar);
                                  setDualVisibility(selectedRoleId, item.view, targetState, targetState);
                                }}
                                className="px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 transition-colors"
                                title="Toggle both Home and Sidebar on/off together"
                              >
                                Both
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredGroups.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-slate-700">No screens matched your filter</div>
                  <div className="text-xs text-slate-400 mt-1">Try clearing search terms or changing visibility filters.</div>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: Comprehensive Dual Visibility Table */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Detailed Dual Visibility Matrix ({selectedRoleDef.name})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure independent access checkboxes for the Home Workspace and Sidebar Navigation.
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  {filteredGroups.reduce((acc, g) => acc + g.items.length, 0)} Screens Shown
                </div>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold text-slate-700 w-72">Module / Screen Name</th>
                      <th className="py-2.5 px-2 font-bold text-slate-700 w-32">Domain Category</th>
                      <th className="py-2.5 px-2 font-bold text-slate-700 w-40">Subgroup</th>
                      <th className="py-2.5 px-3 font-bold text-center w-36 bg-teal-50/80 text-[#0F8B8D]">
                        <div className="flex items-center justify-center gap-1">
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Home Workspace</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 font-bold text-center w-36 bg-indigo-50/80 text-indigo-700">
                        <div className="flex items-center justify-center gap-1">
                          <Menu className="w-3.5 h-3.5" />
                          <span>Sidebar Menu</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 font-bold text-center w-28">Status</th>
                      <th className="py-2.5 px-3 font-bold text-right w-24">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGroups.map((group) => (
                      <React.Fragment key={group.id}>
                        <tr className="bg-slate-50/80 font-bold text-slate-800">
                          <td colSpan={7} className="py-2 px-3 text-xs">
                            <div className="flex items-center gap-2">
                              {getGroupIcon(group.id)}
                              <span>{group.title} Domain ({group.items.length} screens)</span>
                            </div>
                          </td>
                        </tr>
                        {group.items.map((item) => {
                          const inWorkspace = isWorkspaceVisible(selectedRoleId, item.view);
                          const inSidebar = isSidebarVisible(selectedRoleId, item.view);

                          return (
                            <tr key={item.view} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2 px-3">
                                <div className="font-semibold text-slate-900">{item.label}</div>
                                <div className="text-[10px] text-slate-400 font-mono">/{item.view}</div>
                              </td>
                              <td className="py-2 px-2 text-slate-600 text-[11px]">{group.title}</td>
                              <td className="py-2 px-2 text-slate-500 text-[11px]">{item.subGroup || '—'}</td>

                              {/* Workspace Checkbox */}
                              <td className="py-2 px-3 text-center bg-teal-50/30">
                                <label className="inline-flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={inWorkspace}
                                    disabled={selectedRoleId === 'admin' && item.view === 'home'}
                                    onChange={(e) => setWorkspaceVisibility(selectedRoleId, item.view, e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-[#0F8B8D] focus:ring-[#0F8B8D]"
                                  />
                                </label>
                              </td>

                              {/* Sidebar Checkbox */}
                              <td className="py-2 px-3 text-center bg-indigo-50/30">
                                <label className="inline-flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={inSidebar}
                                    disabled={selectedRoleId === 'admin' && item.view === 'home'}
                                    onChange={(e) => setSidebarVisibility(selectedRoleId, item.view, e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                </label>
                              </td>

                              {/* Status Badge */}
                              <td className="py-2 px-3 text-center">
                                {inWorkspace && inSidebar ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Both
                                  </span>
                                ) : inWorkspace ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                                    Home Only
                                  </span>
                                ) : inSidebar ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                    Sidebar Only
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                    Hidden
                                  </span>
                                )}
                              </td>

                              {/* Quick Action */}
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => {
                                    const next = !(inWorkspace && inSidebar);
                                    setDualVisibility(selectedRoleId, item.view, next, next);
                                  }}
                                  className="text-[11px] font-medium text-slate-600 hover:text-[#0F8B8D] underline"
                                >
                                  {inWorkspace && inSidebar ? 'Hide Both' : 'Show Both'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Discovered Screens & Auto-Sync Engine */}
      {/* ========================================================================= */}
      {activeSubTab === 'screen_sync' && (
        <div className="space-y-6">
          {/* Auto-Sync Console Banner */}
          <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border-l-4 border-[#0F8B8D] bg-white p-5 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-[#0F8B8D]" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Autonomous Screen Discovery &amp; Route Synchronization Engine
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    All UI routes, custom modules, and sub-screens in the application are automatically registered, tracked, and indexed here on the admin side.
                  </p>
                </div>
              </div>

              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-xs transition-colors shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Scan &amp; Auto-Sync Now'}</span>
              </button>
            </div>

            {/* Sync Meta Report */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Total Governed Screens</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {lastSyncResult ? lastSyncResult.totalDiscovered : allDiscoveredItems.length}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Zero-Trust Verified</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Functional Domains</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {allGroups.length}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Operations, Front Office, etc.</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Newly Discovered</div>
                <div className="text-base font-bold text-teal-700 mt-0.5">
                  {lastSyncResult ? lastSyncResult.newScreensCount : 0} Routes
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Since last audit</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px]">Last Sync Timestamp</div>
                <div className="text-xs font-mono font-semibold text-slate-800 mt-0.5 truncate">
                  {lastSyncResult ? lastSyncResult.lastSyncTime : 'Active Background Sync'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Continuous manifest listening</div>
              </div>
            </div>
          </div>

          {/* Synchronized Screen Catalog Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Complete Catalog of Discovered Application Screens ({allDiscoveredItems.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Review route endpoints, domain groups, and live role availability across the enterprise.
                </p>
              </div>

              <div className="text-xs text-slate-500">
                Auto-Synced to Admin Workspace
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-bold text-slate-700">Screen / Route</th>
                    <th className="py-2.5 px-2 font-bold text-slate-700">Domain Category</th>
                    <th className="py-2.5 px-2 font-bold text-slate-700">Subgroup</th>
                    <th className="py-2.5 px-2 font-bold text-center">Home Role Coverage</th>
                    <th className="py-2.5 px-2 font-bold text-center">Sidebar Role Coverage</th>
                    <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allDiscoveredItems.map((item) => {
                    const wsRolesCount = roles.filter((r) => isWorkspaceVisible(r.id, item.view)).length;
                    const sbRolesCount = roles.filter((r) => isSidebarVisible(r.id, item.view)).length;

                    return (
                      <tr key={item.view} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0F8B8D]" />
                            <span>{item.label}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">/{item.view}</div>
                        </td>
                        <td className="py-2 px-2 text-slate-700 font-medium">{item.groupTitle}</td>
                        <td className="py-2 px-2 text-slate-500">{item.subGroup || 'Standard'}</td>

                        {/* Home Coverage */}
                        <td className="py-2 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                            {wsRolesCount} of {roles.length} Roles
                          </span>
                        </td>

                        {/* Sidebar Coverage */}
                        <td className="py-2 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            {sbRolesCount} of {roles.length} Roles
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedRoleId('operator');
                              setActiveSubTab('visibility_matrix');
                              setSearchQuery(item.label);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#0F8B8D] hover:bg-teal-50 rounded transition-colors"
                          >
                            Configure Visibility
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: New Screen Approvals & Zero-Trust Restriction Area */}
      {/* ========================================================================= */}
      {activeSubTab === 'quarantine_approvals' && (
        <div className="space-y-6">
          {/* Informational Policy Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 bg-white p-4 rounded-xl shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold text-amber-900">
                Zero-Trust Route Quarantine &amp; New Screen Restriction Area
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-4xl">
              Any newly introduced ERP route or screen is automatically intercepted and held in this <strong>Restriction Area</strong>. Screens remain hidden from standard roles until an Administrator assigns granular authorization for both the <strong>Home Workspace</strong> and the <strong>Sidebar Navigation</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-amber-800">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Auto-Quarantine Policy: Enforced
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                Default Access: Admin Only
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Live Publication: Instant
              </span>
            </div>
          </div>

          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Quarantined Screen Registry ({quarantinedScreens.length})
              </div>
              <div className="text-xs text-slate-500">
                {pendingCount} pending administrative approval • {quarantinedScreens.filter((q) => q.status === 'APPROVED').length} authorized &amp; published
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Register New Screen / Route
              </button>
            </div>
          </div>

          {/* Quarantined Screen Cards */}
          <div className="space-y-4">
            {quarantinedScreens.map((screen) => {
              const isPending = screen.status === 'PENDING_APPROVAL';
              const isApproved = screen.status === 'APPROVED';
              const isRestricted = screen.status === 'RESTRICTED';

              return (
                <div
                  key={screen.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                    isPending
                      ? 'border-amber-300 ring-1 ring-amber-200 bg-gradient-to-b from-amber-50/20 to-white'
                      : isApproved
                      ? 'border-emerald-200'
                      : 'border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            PENDING ADMIN APPROVAL
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            APPROVED &amp; ACTIVE
                          </span>
                        )}
                        {isRestricted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            PERMANENTLY RESTRICTED
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                          {screen.groupTitle} / {screen.subGroup}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            screen.securityLevel === 'Restricted / Sovereign'
                              ? 'bg-purple-100 text-purple-800'
                              : screen.securityLevel === 'Elevated'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Tier: {screen.securityLevel}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <span>{screen.title}</span>
                          <span className="text-xs font-mono font-normal text-slate-400">({screen.route})</span>
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 max-w-3xl">{screen.description}</p>
                      </div>

                      {/* Detection Details */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <div>
                          Detected: <strong>{screen.detectedAt}</strong>
                        </div>
                        <div>
                          Trigger: <span className="font-mono text-slate-600">{screen.detectedTrigger}</span>
                        </div>
                        {screen.approvedBy && (
                          <div className="text-emerald-700 font-semibold">
                            Approved by: {screen.approvedBy} on {screen.approvedAt}
                          </div>
                        )}
                        {screen.rejectionReason && (
                          <div className="text-rose-700 font-semibold">
                            Rejection Note: {screen.rejectionReason}
                          </div>
                        )}
                      </div>

                      {/* Dual Role Coverage */}
                      <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px]">
                        <div>
                          <span className="font-semibold text-teal-800">Home Workspace Roles:</span>{' '}
                          {screen.showInWorkspaceForRoles && screen.showInWorkspaceForRoles.length > 0
                            ? screen.showInWorkspaceForRoles.length
                            : screen.allowedRoles.length}{' '}
                          roles
                        </div>
                        <div>
                          <span className="font-semibold text-indigo-800">Sidebar Menu Roles:</span>{' '}
                          {screen.showInSidebarForRoles && screen.showInSidebarForRoles.length > 0
                            ? screen.showInSidebarForRoles.length
                            : screen.allowedRoles.length}{' '}
                          roles
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex sm:flex-col items-end gap-2 shrink-0">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleOpenApproveModal(screen)}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Approve &amp; Assign Roles
                          </button>
                          <button
                            onClick={() => handleRejectScreen(screen)}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Reject &amp; Restrict
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <button
                          onClick={() => handleOpenApproveModal(screen)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          Modify Role Grants
                        </button>
                      )}

                      {isRestricted && (
                        <button
                          onClick={() => handleOpenApproveModal(screen)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          Re-open &amp; Authorize
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: Governance & Sync Audit Trail */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit_log' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Screen Approval &amp; Quarantine Audit Trail
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Immutable log of screen discoveries, administrative approvals, and visibility matrix updates.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Enforced by Zero-Trust Engine
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLog.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-start gap-3">
                <div className="mt-0.5">
                  {log.action === 'APPROVED' ? (
                    <span className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 inline-block">
                      <Check className="w-4 h-4" />
                    </span>
                  ) : log.action === 'REJECTED' ? (
                    <span className="p-1.5 rounded-md bg-rose-100 text-rose-700 inline-block">
                      <X className="w-4 h-4" />
                    </span>
                  ) : log.action === 'SYNCED' ? (
                    <span className="p-1.5 rounded-md bg-teal-100 text-[#0F8B8D] inline-block">
                      <RefreshCw className="w-4 h-4" />
                    </span>
                  ) : log.action === 'SIDEBAR_UPDATED' ? (
                    <span className="p-1.5 rounded-md bg-indigo-100 text-indigo-700 inline-block">
                      <Menu className="w-4 h-4" />
                    </span>
                  ) : log.action === 'WORKSPACE_UPDATED' ? (
                    <span className="p-1.5 rounded-md bg-teal-100 text-teal-700 inline-block">
                      <LayoutDashboard className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1.5 rounded-md bg-amber-100 text-amber-700 inline-block">
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-900">
                      {log.screenTitle}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {log.timestamp}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">
                    {log.details}
                  </p>

                  <div className="text-[11px] text-slate-400 mt-1">
                    Action: <strong className="text-slate-700">{log.action}</strong> • Actor: <span className="font-semibold text-slate-700">{log.performedBy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Register New Screen / Route */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Plus className="w-5 h-5 text-[#0F8B8D]" />
                <span>Register New Screen / Route</span>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
              <strong>Notice:</strong> In compliance with Zero-Trust RBAC, this newly registered screen will automatically land in the <strong>Restriction Area</strong>. It will remain hidden from standard roles until explicitly cleared.
            </div>

            <form onSubmit={handleCreateNewScreen} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Screen Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Resin Shrinkage & Warpage Predictor"
                  value={newScreenForm.title}
                  onChange={(e) => setNewScreenForm({ ...newScreenForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">View Key / ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. aiResinPredictor"
                    value={newScreenForm.view}
                    onChange={(e) => setNewScreenForm({ ...newScreenForm, view: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Workspace Group</label>
                  <select
                    value={newScreenForm.groupId}
                    onChange={(e) => {
                      const grp = allGroups.find((g) => g.id === e.target.value);
                      setNewScreenForm({
                        ...newScreenForm,
                        groupId: e.target.value,
                        groupTitle: grp?.title || e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                  >
                    {allGroups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subgroup / Domain</label>
                  <input
                    type="text"
                    placeholder="e.g. Smart Automation"
                    value={newScreenForm.subGroup}
                    onChange={(e) => setNewScreenForm({ ...newScreenForm, subGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Security Tier</label>
                  <select
                    value={newScreenForm.securityLevel}
                    onChange={(e) =>
                      setNewScreenForm({
                        ...newScreenForm,
                        securityLevel: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Elevated">Elevated</option>
                    <option value="Restricted / Sovereign">Restricted / Sovereign</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Explain the functional purpose of this screen..."
                  value={newScreenForm.description}
                  onChange={(e) => setNewScreenForm({ ...newScreenForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg font-bold shadow-xs"
                >
                  Register &amp; Quarantine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Approve Quarantined Screen (Dual Role Provisioning) */}
      {/* ========================================================================= */}
      {isApprovalModalOpen && selectedQuarantinedScreen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Authorize &amp; Provision Screen to Roles</span>
              </div>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{selectedQuarantinedScreen.title}</div>
                <div className="text-slate-500 font-mono mt-0.5">{selectedQuarantinedScreen.route}</div>
                <div className="text-slate-600 mt-1">{selectedQuarantinedScreen.description}</div>
              </div>

              {/* Link toggle */}
              <div className="flex items-center justify-between bg-teal-50/70 p-2.5 rounded-lg border border-teal-200">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-[#0F8B8D]" />
                  <span className="font-semibold text-teal-950">Mirror Home Workspace &amp; Sidebar Menu</span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approvalLinkBoth}
                    onChange={(e) => setApprovalLinkBoth(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0F8B8D] focus:ring-[#0F8B8D]"
                  />
                  <span className="text-[11px] font-medium text-teal-900">Link Both</span>
                </label>
              </div>

              {/* Workspace Roles Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    <span>Home Workspace Authorized Roles ({approvalWorkspaceRoles.length}):</span>
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setApprovalWorkspaceRoles(roles.map((r) => r.id))}
                      className="text-[#0F8B8D] font-semibold hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setApprovalWorkspaceRoles(['admin'])}
                      className="text-slate-500 hover:underline"
                    >
                      Admins Only
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 rounded-lg">
                  {roles.map((role) => {
                    const isChecked = approvalWorkspaceRoles.includes(role.id);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer select-none transition-colors ${
                          isChecked ? 'bg-teal-50/80 border-teal-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={role.id === 'admin'}
                          onChange={(e) => {
                            if (role.id === 'admin') return;
                            if (e.target.checked) {
                              setApprovalWorkspaceRoles([...approvalWorkspaceRoles, role.id]);
                            } else {
                              setApprovalWorkspaceRoles(approvalWorkspaceRoles.filter((id) => id !== role.id));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#0F8B8D] focus:ring-[#0F8B8D]"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate text-[11px]">{role.name}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Roles Section (if unlinked) */}
              {!approvalLinkBoth && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Menu className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sidebar Menu Authorized Roles ({approvalSidebarRoles.length}):</span>
                    </label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setApprovalSidebarRoles(roles.map((r) => r.id))}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setApprovalSidebarRoles(['admin'])}
                        className="text-slate-500 hover:underline"
                      >
                        Admins Only
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 rounded-lg">
                    {roles.map((role) => {
                      const isChecked = approvalSidebarRoles.includes(role.id);
                      return (
                        <label
                          key={role.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer select-none transition-colors ${
                            isChecked ? 'bg-indigo-50/80 border-indigo-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={role.id === 'admin'}
                            onChange={(e) => {
                              if (role.id === 'admin') return;
                              if (e.target.checked) {
                                setApprovalSidebarRoles([...approvalSidebarRoles, role.id]);
                              } else {
                                setApprovalSidebarRoles(approvalSidebarRoles.filter((id) => id !== role.id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate text-[11px]">{role.name}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold shadow-xs"
              >
                Confirm Approval &amp; Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Copy Visibility From Another Role */}
      {/* ========================================================================= */}
      {isCopyRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Copy className="w-5 h-5 text-[#0F8B8D]" />
                <span>Clone Visibility Settings</span>
              </div>
              <button
                onClick={() => setIsCopyRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <p>
                Copy all workspace and sidebar visibility configurations from a source template role and apply them directly to <strong>{selectedRoleDef.name}</strong>.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Template Role:</label>
                <select
                  value={copySourceRoleId}
                  onChange={(e) => setCopySourceRoleId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                >
                  {roles
                    .filter((r) => r.id !== selectedRoleId)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.scope})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsCopyRoleModalOpen(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCopyPermissions}
                className="px-4 py-2 text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg font-bold shadow-xs"
              >
                Apply Cloned Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
