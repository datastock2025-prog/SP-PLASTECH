import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Code,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Package,
  Award,
  Users,
  Briefcase,
  Landmark,
  ShoppingBag,
  BarChart3,
  Sliders,
  CheckSquare,
  FileCheck,
  Bell,
  Activity,
  Zap,
  Shield,
  Clock,
  Trash2,
  Calendar,
  AlertTriangle,
  FolderTree,
  RotateCcw,
  Truck,
  DollarSign,
  Boxes,
  FileText,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { NAVIGATION_GROUPS, NavGroupDef, NavItemDef } from '../data/sidebarNavigationData';
import { useWorkspaceRbac } from '../hooks/useWorkspaceRbac';
import { AuthUser } from '../types';

interface HomeViewProps {
  onNavigate: (view: string, param?: any) => void;
  openArchitectureGuide?: () => void;
  activeWOCount: number;
  lowStockCount: number;
  openPOCount: number;
  currentUser?: AuthUser | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  openArchitectureGuide,
  activeWOCount,
  lowStockCount,
  openPOCount,
  currentUser,
}) => {
  const handleOpenGuide = openArchitectureGuide || (() => onNavigate('architectureGuide'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // RBAC Workspace Access Hook
  const {
    roles,
    normalizeRoleKey,
    isWorkspaceVisible,
    quarantinedScreens,
    pendingCount,
  } = useWorkspaceRbac();

  // Active user canonical role
  const canonicalRole = normalizeRoleKey(currentUser?.role || currentUser?.roleType);
  const userRoleDef = roles.find((r) => r.id === canonicalRole) || roles[0];
  const isAdminUser = canonicalRole === 'admin';

  // Admin filter simulation state
  const [adminBypass, setAdminBypass] = useState(false);
  const [rolePreviewOverride, setRolePreviewOverride] = useState<string>(canonicalRole);

  const effectiveRole = isAdminUser && !adminBypass ? rolePreviewOverride : canonicalRole;
  const effectiveRoleDef = roles.find((r) => r.id === effectiveRole) || userRoleDef;

  const categories = [
    { id: 'ALL', label: 'All Modules' },
    { id: 'HOME', label: 'Home Tools' },
    { id: 'FRONT_OFFICE', label: 'Front Office' },
    { id: 'OPERATIONS', label: 'Operations' },
    { id: 'PLANNING', label: 'Planning' },
    { id: 'FINANCE', label: 'Finance' },
    { id: 'PEOPLE', label: 'People (HR)' },
    { id: 'PROCUREMENT', label: 'Procurement' },
    { id: 'ANALYTICS', label: 'Analytics' },
    { id: 'ADMINISTRATION', label: 'Administration' },
  ];

  // Combined groups including approved/quarantined screens
  const combinedGroups = useMemo(() => {
    const groups: NavGroupDef[] = JSON.parse(JSON.stringify(NAVIGATION_GROUPS || []));

    // Incorporate quarantined / new screens
    (quarantinedScreens || []).forEach((qs) => {
      let target = groups.find((g) => g.id === qs.groupId);
      if (!target) {
        target = {
          id: qs.groupId,
          title: qs.groupTitle,
          icon: 'Layers',
          defaultExpanded: true,
          items: [],
        };
        groups.push(target);
      }

      if (!target.items.some((it) => it.view === qs.view)) {
        target.items.push({
          id: `nav-${qs.view}`,
          label: qs.title,
          view: qs.view,
          icon: 'Sparkles',
          subGroup: qs.subGroup,
          badge: qs.status === 'PENDING_APPROVAL' ? 'Restricted' : 'Approved',
          badgeColor: qs.status === 'PENDING_APPROVAL' ? 'bg-amber-500' : 'bg-emerald-600',
          tooltip: qs.description,
        });
      }
    });

    return groups;
  }, [quarantinedScreens]);

  // Calculate total vs visible count for effective role
  const totalGovernedModulesCount = useMemo(() => {
    return combinedGroups.reduce((acc, g) => acc + (g?.items?.length || 0), 0);
  }, [combinedGroups]);

  const visibleModulesCountForRole = useMemo(() => {
    let count = 0;
    combinedGroups.forEach((g) => {
      (g?.items || []).forEach((it) => {
        if (adminBypass || isWorkspaceVisible(effectiveRole, it.view)) {
          count++;
        }
      });
    });
    return count;
  }, [combinedGroups, effectiveRole, adminBypass, isWorkspaceVisible]);

  const hiddenModulesCount = totalGovernedModulesCount - visibleModulesCountForRole;

  // Flatten all items with group context
  const allItems = useMemo(() => {
    return (combinedGroups || []).flatMap((group) =>
      (group?.items || []).map((item) => ({
        ...item,
        groupId: group?.id || '',
        groupTitle: group?.title || '',
      }))
    );
  }, [combinedGroups]);

  // Filter items by search query, category, and RBAC role visibility
  const filteredGroups = useMemo(() => {
    const q = searchQuery ? searchQuery.toLowerCase().trim() : '';

    return (combinedGroups || []).map((group) => {
      if (!group) return null;
      // Category check
      if (selectedCategory !== 'ALL' && group.id !== selectedCategory) {
        return null;
      }

      // Items filter: must match search query AND role visibility
      const matchingItems = (group?.items || []).filter((item) => {
        if (!item) return false;

        // RBAC Visibility Check: checked = visible, unchecked = hidden
        const isAllowedByRole = adminBypass ? true : isWorkspaceVisible(effectiveRole, item.view);
        if (!isAllowedByRole) {
          return false;
        }

        if (!q) return true;
        return (
          (item.label && item.label.toLowerCase().includes(q)) ||
          (item.subGroup && item.subGroup.toLowerCase().includes(q)) ||
          (group.title && group.title.toLowerCase().includes(q)) ||
          (item.view && item.view.toLowerCase().includes(q))
        );
      });

      if (matchingItems.length === 0) return null;

      return {
        ...group,
        items: matchingItems,
      };
    }).filter(Boolean) as typeof NAVIGATION_GROUPS;
  }, [combinedGroups, searchQuery, selectedCategory, effectiveRole, adminBypass, isWorkspaceVisible]);

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-[1600px] mx-auto pb-12 min-w-0">
      {/* Launch Hero Command Banner */}
      <div className="bg-gradient-to-br from-[#14213D] via-[#1A2C52] to-[#0F8B8D] text-white p-4 sm:p-6 lg:p-7 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/[0.08] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 lg:gap-6 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 text-[11px] font-mono uppercase tracking-wider mb-2 backdrop-blur-xs flex-wrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>Plant 01 &bull; Injection Molding Unit (Hosūr) &bull; Shift A</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight font-['Space_Grotesk'] text-white truncate">
              Reboot ERP &mdash; Workspace Home
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              Unified operating command for plastics manufacturing &mdash; from resin intake, mold tooling, and press execution to multi-tier finance, supply chain, and compliance.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 w-full xl:w-auto shrink-0 min-w-0">
            <div
              onClick={() => onNavigate('oeeDashboard')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-xs px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-white/10 hover:border-white/25 min-w-0 text-center sm:text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none group shadow-xs"
            >
              <div className="text-base sm:text-xl font-bold text-white font-mono group-hover:text-emerald-200 transition-colors">92.4%</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium truncate">OEE Today</div>
            </div>
            <div
              onClick={() => onNavigate('woList')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-xs px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-white/10 hover:border-white/25 min-w-0 text-center sm:text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none group shadow-xs"
            >
              <div className="text-base sm:text-xl font-bold text-cyan-300 font-mono group-hover:text-cyan-200 transition-colors">{activeWOCount}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium truncate">Active WOs</div>
            </div>
            <div
              onClick={() => onNavigate('stockList')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-xs px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-white/10 hover:border-white/25 min-w-0 text-center sm:text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none group shadow-xs"
            >
              <div className="text-base sm:text-xl font-bold text-amber-300 font-mono group-hover:text-amber-200 transition-colors">{lowStockCount}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium truncate">Low Stock</div>
            </div>
            <div
              onClick={() => onNavigate('poList')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-xs px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-white/10 hover:border-white/25 min-w-0 text-center sm:text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none group shadow-xs"
            >
              <div className="text-base sm:text-xl font-bold text-emerald-300 font-mono group-hover:text-emerald-200 transition-colors">{openPOCount}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium truncate">Open POs</div>
            </div>
          </div>
        </div>
      </div>

      {/* React Architecture Guide & AI Stack Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">
        <div
          onClick={handleOpenGuide}
          className="p-4 rounded-2xl bg-gradient-to-r from-[#E8622C]/10 via-[#0F8B8D]/5 to-white bg-white border border-[#E8622C]/30 hover:border-[#E8622C]/60 flex items-center justify-between gap-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer min-w-0 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E8622C] group-hover:bg-[#D45320] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 group-hover:scale-105 transition-all duration-200">
              <Code className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#E8622C] transition-colors truncate">React Enterprise Spec</h3>
              <p className="text-xs text-slate-500 truncate">Modular monolith, state stores &amp; concurrency.</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenGuide(); }}
            className="px-3 py-1.5 rounded-lg bg-[#E8622C] hover:bg-[#D45320] active:scale-95 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
          >
            <span>Open Spec</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div
          onClick={() => onNavigate('aiPromptBuilder')}
          className="p-4 rounded-2xl bg-gradient-to-r from-[#0F8B8D]/10 via-[#E8622C]/5 to-white bg-white border border-[#0F8B8D]/30 hover:border-[#0F8B8D]/60 flex items-center justify-between gap-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer min-w-0 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0F8B8D] group-hover:bg-[#0D7A7C] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 group-hover:scale-105 transition-all duration-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0F8B8D] transition-colors truncate">AI Stack &amp; Prompt Studio</h3>
              <p className="text-xs text-slate-500 truncate">Streaming UI, context selectors &amp; tone sliders.</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('aiPromptBuilder'); }}
            className="px-3 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0D7A7C] active:scale-95 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div
          onClick={() => onNavigate('hrCommandCenter')}
          className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-teal-500/5 to-white bg-white border border-indigo-200 hover:border-indigo-400 flex items-center justify-between gap-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer min-w-0 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 group-hover:scale-105 transition-all duration-200">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">HR &amp; Line Staffing</h3>
              <p className="text-xs text-slate-500 truncate">128 active personnel, IATF skill matrix.</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('hrCommandCenter'); }}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
          >
            <span>HR Command</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* RBAC Role-Based Module Visibility Governance Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0F8B8D] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Role-Based Module Visibility (RBAC)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/20">
                  Active for {effectiveRoleDef.name}
                </span>
                {hiddenModulesCount > 0 && !adminBypass && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {hiddenModulesCount} Modules Hidden for this Role
                  </span>
                )}
                {adminBypass && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Admin Superuser Bypass Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing <strong className="text-slate-800">{visibleModulesCountForRole}</strong> of{' '}
                <strong className="text-slate-800">{totalGovernedModulesCount}</strong> modules authorized for your profile. Modules not granted by Admin in RBAC are hidden.
              </p>
            </div>
          </div>

          {/* Admin Controls */}
          <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-center">
            {isAdminUser && (
              <>
                {/* Role Switcher Preview */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[11px] font-medium text-slate-500">Preview as:</span>
                  <select
                    value={rolePreviewOverride}
                    onChange={(e) => {
                      setRolePreviewOverride(e.target.value);
                      setAdminBypass(false);
                    }}
                    className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Admin Bypass Toggle */}
                <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={adminBypass}
                    onChange={(e) => setAdminBypass(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#0F8B8D] focus:ring-[#0F8B8D] border-slate-300"
                  />
                  <span>Show All (Bypass)</span>
                </label>
              </>
            )}

            <button
              onClick={() => onNavigate('adminWorkspaceRbac')}
              className="px-3 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Admin Visibility Controls</span>
            </button>
          </div>
        </div>

        {/* Quarantined Screen Banner (Alert) */}
        {pendingCount > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-900">
                  Zero-Trust Screen Quarantine Active:
                </span>{' '}
                <span className="text-amber-800">
                  {pendingCount} newly discovered application screen{pendingCount > 1 ? 's are' : ' is'} restricted in the quarantine area awaiting Admin security approval.
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('adminWorkspaceRbac')}
              className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition-colors"
            >
              Review in RBAC &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Module Finder & Category Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 min-w-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all 90+ modules, tools, and screens..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium self-end md:self-center shrink-0">
            Showing <b>{filteredGroups.reduce((acc, g) => acc + g.items.length, 0)}</b> of <b>{allItems.length}</b> screens
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-[#14213D] text-white shadow-xs font-bold'
                  : 'bg-slate-100 hover:bg-slate-200/80 hover:text-slate-900 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 min-w-0">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No modules match "{searchQuery}"</h3>
          <p className="text-xs text-slate-500 mt-1">Try searching for keywords like "BOM", "Work Order", "Quality", "Tax", or "Audit".</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
            className="mt-4 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8 min-w-0">
          {filteredGroups.map((group) => (
            <div key={group.id} className="space-y-3 min-w-0">
              {/* Group Title Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#E8622C] shrink-0" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider font-['Space_Grotesk'] truncate">
                    {group.title}
                  </h2>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-semibold shrink-0">
                    {group.items.length} {group.items.length === 1 ? 'Screen' : 'Screens'}
                  </span>
                </div>
              </div>

              {/* Items Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 min-w-0">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(item.view, item.params)}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#0F8B8D]/50 hover:shadow-lg hover:shadow-teal-900/5 hover:-translate-y-1 active:translate-y-0.5 active:scale-[0.975] active:duration-75 transition-all duration-200 ease-out cursor-pointer flex flex-col justify-between group relative overflow-hidden min-w-0 select-none"
                  >
                    {/* Top Flow Bar Reveal */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#E8622C] via-[#0F8B8D] to-indigo-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform origin-left scale-x-0 group-hover:scale-x-100" />
                    {/* Subtle Ambient Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.03] via-transparent to-[#E8622C]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div className="space-y-2.5 relative z-10">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8.5 h-8.5 rounded-xl bg-slate-100/90 border border-slate-200/70 text-slate-700 group-hover:bg-[#0F8B8D] group-hover:text-white group-hover:border-[#0F8B8D] group-hover:shadow-md group-hover:shadow-teal-500/20 group-hover:scale-105 transition-all duration-200 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                            {(item.subGroup || group?.title || 'NA').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            {item.subGroup && (
                              <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#0F8B8D] uppercase tracking-wider block leading-none transition-colors duration-150 truncate">
                                {item.subGroup}
                              </span>
                            )}
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0F8B8D] transition-colors duration-150 leading-snug mt-0.5 truncate">
                              {item.label}
                            </h4>
                          </div>
                        </div>

                        {item.badge && (
                          <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs ${item.badgeColor || 'bg-indigo-600'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {item.tooltip && (
                        <p className="text-[11px] text-slate-500 group-hover:text-slate-600 line-clamp-2 leading-relaxed transition-colors duration-150">
                          {item.tooltip}
                        </p>
                      )}
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 group-hover:border-teal-100 flex items-center justify-between text-[11px] text-[#0F8B8D] font-semibold relative z-10 transition-colors duration-150">
                      <span className="font-mono text-[10px] text-slate-400 group-hover:text-teal-700 bg-slate-50 group-hover:bg-teal-50/70 px-1.5 py-0.5 rounded transition-colors duration-150">
                        /{item.view}
                      </span>
                      <span className="flex items-center gap-1 font-bold group-hover:gap-1.5 transition-all duration-200">
                        <span>Launch</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200 ease-out" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
