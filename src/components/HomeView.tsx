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
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-white/10 min-w-0 text-center sm:text-left">
              <div className="text-base sm:text-xl font-bold text-white font-mono">92.4%</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium truncate">OEE Today</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-white/10 min-w-0 text-center sm:text-left">
              <div className="text-base sm:text-xl font-bold text-cyan-300 font-mono">{activeWOCount}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium truncate">Active WOs</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-white/10 min-w-0 text-center sm:text-left">
              <div className="text-base sm:text-xl font-bold text-amber-300 font-mono">{lowStockCount}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium truncate">Low Stock</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-white/10 min-w-0 text-center sm:text-left">
              <div className="text-base sm:text-xl font-bold text-emerald-300 font-mono">{openPOCount}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium truncate">Open POs</div>
            </div>
          </div>
        </div>
      </div>

      {/* React Architecture Guide & AI Stack Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#E8622C]/10 via-[#0F8B8D]/10 to-white bg-white border border-[#E8622C]/30 flex items-center justify-between gap-4 shadow-xs min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E8622C] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Code className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">React Enterprise Spec</h3>
              <p className="text-xs text-slate-500 truncate">Modular monolith, state stores &amp; concurrency.</p>
            </div>
          </div>
          <button
            onClick={handleOpenGuide}
            className="px-3 py-1.5 rounded-lg bg-[#E8622C] hover:bg-[#D45320] text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
          >
            <span>Open Spec</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-[#0F8B8D]/10 via-[#E8622C]/10 to-white bg-white border border-[#0F8B8D]/30 flex items-center justify-between gap-4 shadow-xs min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0F8B8D] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">AI Stack &amp; Prompt Studio</h3>
              <p className="text-xs text-slate-500 truncate">Streaming UI, context selectors &amp; tone sliders.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('aiPromptBuilder')}
            className="px-3 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0D7A7C] text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-teal-500/10 to-white bg-white border border-indigo-200 flex items-center justify-between gap-4 shadow-xs min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">HR &amp; Line Staffing</h3>
              <p className="text-xs text-slate-500 truncate">128 active personnel, IATF skill matrix.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('hrCommandCenter')}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
          >
            <span>HR Command</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#14213D] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 min-w-0">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(item.view, item.params)}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between group relative overflow-hidden min-w-0"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-600 flex items-center justify-center font-bold text-xs transition-colors shrink-0">
                            {item.subGroup ? item.subGroup.slice(0, 2).toUpperCase() : group.title.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            {item.subGroup && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block leading-none">
                                {item.subGroup}
                              </span>
                            )}
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mt-0.5">
                              {item.label}
                            </h4>
                          </div>
                        </div>

                        {item.badge && (
                          <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor || 'bg-indigo-600'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {item.tooltip && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.tooltip}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-600 font-semibold opacity-80 group-hover:opacity-100">
                      <span className="font-mono text-[10px] text-slate-400">/{item.view}</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Launch &rarr;
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
