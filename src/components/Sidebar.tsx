import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Home,
  CheckSquare,
  FileCheck,
  Bell,
  Eye,
  History,
  Users,
  Target,
  Building,
  PhoneCall,
  MessageSquare,
  FileText,
  ShoppingBag,
  Truck,
  RotateCcw,
  DollarSign,
  ShieldCheck,
  Layers,
  Calendar,
  ClipboardList,
  Tv,
  Activity,
  Trash2,
  Dna,
  QrCode,
  RefreshCw,
  Inbox,
  Package,
  Receipt,
  Archive,
  Boxes,
  ArrowLeftRight,
  FileSpreadsheet,
  AlertOctagon,
  Tag,
  GitPullRequest,
  Award,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Scale,
  Microscope,
  Zap,
  Cpu,
  Disc,
  Clock,
  Sliders,
  Gauge,
  FolderTree,
  Network,
  GitBranch,
  TrendingUp,
  GitCompare,
  Coins,
  Compass,
  BookOpen,
  Landmark,
  TrendingDown,
  CreditCard,
  BarChart3,
  PieChart,
  FileBarChart,
  UserCheck,
  Timer,
  CalendarDays,
  Coffee,
  Shield,
  Wallet,
  Briefcase,
  Search,
  FilePlus,
  GitFork,
  Star,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Code,
  Lock,
  Pin,
  PinOff,
} from 'lucide-react';
import { AuthUser } from '../types';
import {
  NAVIGATION_GROUPS,
  NavGroupDef,
  NavItemDef,
  RecentRecordItem,
  INITIAL_RECENT_RECORDS,
  ROLE_DEFAULT_FAVORITES,
} from '../data/sidebarNavigationData';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
  openAngularGuide: () => void;
  currentUser?: AuthUser | null;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeWOCount?: number;
  lowStockCount?: number;
  openPOCount?: number;
  showToast?: (msg: string) => void;
}

// Icon Renderer Helper
const renderNavIcon = (iconName: string, className = 'w-4 h-4') => {
  const iconMap: Record<string, React.ReactNode> = {
    Home: <Home className={className} />,
    CheckSquare: <CheckSquare className={className} />,
    FileCheck: <FileCheck className={className} />,
    Bell: <Bell className={className} />,
    Eye: <Eye className={className} />,
    History: <History className={className} />,
    Users: <Users className={className} />,
    Target: <Target className={className} />,
    Building: <Building className={className} />,
    PhoneCall: <PhoneCall className={className} />,
    MessageSquare: <MessageSquare className={className} />,
    FileText: <FileText className={className} />,
    ShoppingBag: <ShoppingBag className={className} />,
    Truck: <Truck className={className} />,
    RotateCcw: <RotateCcw className={className} />,
    DollarSign: <DollarSign className={className} />,
    ShieldCheck: <ShieldCheck className={className} />,
    Layers: <Layers className={className} />,
    Calendar: <Calendar className={className} />,
    ClipboardList: <ClipboardList className={className} />,
    Tv: <Tv className={className} />,
    Activity: <Activity className={className} />,
    Trash2: <Trash2 className={className} />,
    Dna: <Dna className={className} />,
    QrCode: <QrCode className={className} />,
    RefreshCw: <RefreshCw className={className} />,
    Inbox: <Inbox className={className} />,
    Package: <Package className={className} />,
    Receipt: <Receipt className={className} />,
    Archive: <Archive className={className} />,
    Boxes: <Boxes className={className} />,
    ArrowLeftRight: <ArrowLeftRight className={className} />,
    FileSpreadsheet: <FileSpreadsheet className={className} />,
    AlertOctagon: <AlertOctagon className={className} />,
    Tag: <Tag className={className} />,
    GitPullRequest: <GitPullRequest className={className} />,
    Award: <Award className={className} />,
    AlertTriangle: <AlertTriangle className={className} />,
    CheckCircle2: <CheckCircle2 className={className} />,
    ShieldAlert: <ShieldAlert className={className} />,
    Scale: <Scale className={className} />,
    Microscope: <Microscope className={className} />,
    Zap: <Zap className={className} />,
    Cpu: <Cpu className={className} />,
    Disc: <Disc className={className} />,
    Clock: <Clock className={className} />,
    Sliders: <Sliders className={className} />,
    Gauge: <Gauge className={className} />,
    FolderTree: <FolderTree className={className} />,
    Network: <Network className={className} />,
    GitBranch: <GitBranch className={className} />,
    TrendingUp: <TrendingUp className={className} />,
    GitCompare: <GitCompare className={className} />,
    Coins: <Coins className={className} />,
    Compass: <Compass className={className} />,
    BookOpen: <BookOpen className={className} />,
    Landmark: <Landmark className={className} />,
    TrendingDown: <TrendingDown className={className} />,
    CreditCard: <CreditCard className={className} />,
    BarChart3: <BarChart3 className={className} />,
    PieChart: <PieChart className={className} />,
    FileBarChart: <FileBarChart className={className} />,
    UserCheck: <UserCheck className={className} />,
    Timer: <Timer className={className} />,
    CalendarDays: <CalendarDays className={className} />,
    Coffee: <Coffee className={className} />,
    Shield: <Shield className={className} />,
    Wallet: <Wallet className={className} />,
    Briefcase: <Briefcase className={className} />,
    Search: <Search className={className} />,
    FilePlus: <FilePlus className={className} />,
    GitFork: <GitFork className={className} />,
  };

  return iconMap[iconName] || <Layers className={className} />;
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  openAngularGuide,
  currentUser,
  isOpenMobile = false,
  onCloseMobile = () => {},
  isCollapsed = false,
  onToggleCollapse = () => {},
  activeWOCount = 14,
  lowStockCount = 6,
  openPOCount = 12,
  showToast = (_msg: string) => {},
}) => {
  // Navigation Search & Filter
  const [filterQuery, setFilterQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Group Expand/Collapse State
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      HOME: true,
      OPERATIONS: true,
      FRONT_OFFICE: false,
      PLANNING: false,
      FINANCE: false,
      PEOPLE: false,
      PROCUREMENT: false,
      ANALYTICS: false,
      ADMINISTRATION: false,
    };
    return initial;
  });

  // Favorites / Pinned Views State
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('reboot_pinned_screens');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    const role = currentUser?.role?.toLowerCase() || 'admin';
    return ROLE_DEFAULT_FAVORITES[role] || ROLE_DEFAULT_FAVORITES.admin;
  });

  // Recent Records State
  const [recentRecords, setRecentRecords] = useState<RecentRecordItem[]>(() => {
    try {
      const stored = localStorage.getItem('reboot_recent_records');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_RECENT_RECORDS;
  });

  const [showRecentSection, setShowRecentSection] = useState(false);
  const [showFavoritesSection, setShowFavoritesSection] = useState(true);

  // Flyout menu state for collapsed mini sidebar
  const [flyoutGroup, setFlyoutGroup] = useState<NavGroupDef | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number } | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  // Close flyout on click outside or Esc
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setFlyoutGroup(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFlyoutGroup(null);
        setFilterQuery('');
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        if (!isCollapsed) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        onToggleCollapse();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCollapsed, onToggleCollapse]);

  // Expand parent group when currentView changes
  useEffect(() => {
    for (const group of NAVIGATION_GROUPS) {
      if (group.items.some((item) => item.view === currentView)) {
        setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
        break;
      }
    }
  }, [currentView]);

  // Toggle Group Collapse
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Toggle Favorite Item
  const toggleFavorite = (view: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const exists = prev.includes(view);
      const updated = exists ? prev.filter((v) => v !== view) : [...prev, view];
      try {
        localStorage.setItem('reboot_pinned_screens', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      showToast(exists ? 'Screen removed from Favorites' : 'Screen pinned to Favorites');
      return updated;
    });
  };

  // Clear Recent Records
  const clearRecentRecords = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentRecords([]);
    try {
      localStorage.removeItem('reboot_recent_records');
    } catch (err) {
      console.error(err);
    }
    showToast('Recent records history cleared');
  };

  // Navigation Trigger
  const handleNav = (view: string, param?: any) => {
    onNavigate(view, param);
    setFlyoutGroup(null);
    onCloseMobile();
  };

  // Filter items based on search input
  const filteredNavigation = useMemo(() => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return NAVIGATION_GROUPS;

    return NAVIGATION_GROUPS.map((group) => {
      const matchesGroupTitle = group.title.toLowerCase().includes(q);
      const matchedItems = group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.subGroup?.toLowerCase().includes(q) ||
          item.view.toLowerCase().includes(q)
      );

      if (matchesGroupTitle) return group;
      if (matchedItems.length > 0) {
        return {
          ...group,
          items: matchedItems,
        };
      }
      return null;
    }).filter(Boolean) as NavGroupDef[];
  }, [filterQuery]);

  // All flat navigation items for lookup
  const itemLookup = useMemo(() => {
    const map = new Map<string, NavItemDef>();
    NAVIGATION_GROUPS.forEach((g) => g.items.forEach((item) => map.set(item.view, item)));
    return map;
  }, []);

  // Update real-time counts on items
  const getItemBadge = (item: NavItemDef) => {
    if (item.view === 'woList') return { text: `${activeWOCount}`, color: 'bg-cyan-600' };
    if (item.view === 'stockList') return { text: `${lowStockCount} Low`, color: 'bg-amber-500' };
    if (item.view === 'poList') return { text: `${openPOCount}`, color: 'bg-cyan-600' };
    if (item.badge) return { text: item.badge, color: item.badgeColor || 'bg-slate-600' };
    return null;
  };

  const isSelected = (view: string) => currentView === view;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`bg-[#14213D] text-[#EDEFF7] flex flex-col select-none border-r border-[#1C2B4D] z-30 transition-all duration-200 ease-in-out ${
          isOpenMobile
            ? 'fixed inset-y-0 left-0 w-[280px] shadow-2xl z-50 flex'
            : isCollapsed
            ? 'hidden md:flex w-[68px] shrink-0'
            : 'hidden md:flex w-[250px] shrink-0'
        }`}
        style={{ height: 'calc(100vh - 56px)' }}
      >
        {/* Top Zone: Navigation Header & Filter */}
        <div className="p-2.5 border-b border-white/[0.08] shrink-0">
          {/* Header row (Mobile close button or context title) */}
          {isOpenMobile ? (
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-[#E8622C] to-[#0F8B8D] flex items-center justify-center font-bold text-xs text-white">
                  R
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-none">Reboot ERP</div>
                  <div className="text-[10px] text-slate-400 leading-tight">Plastics Manufacturing</div>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          {/* Desktop Filter Input (hidden when collapsed) */}
          {!isCollapsed && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter navigation... (/)"
                className="w-full bg-white/[0.07] border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#E8622C] transition-colors"
              />
              {filterQuery ? (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[11px]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-white/10 text-slate-300 px-1 py-0.5 rounded font-mono pointer-events-none">
                  /
                </kbd>
              )}
            </div>
          )}

          {/* Mini mode Search Trigger */}
          {isCollapsed && (
            <button
              onClick={() => onToggleCollapse()}
              title="Search Navigation (/)"
              className="w-full h-8 flex items-center justify-center rounded-lg bg-white/[0.07] text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Middle Zone: Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
          {/* Favorites / Pinned Section (if any & not searching) */}
          {!filterQuery && favorites.length > 0 && (
            <div className="pb-2 border-b border-white/[0.06]">
              {!isCollapsed && (
                <div
                  onClick={() => setShowFavoritesSection(!showFavoritesSection)}
                  className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 cursor-pointer hover:text-amber-300 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>Favorites ({favorites.length})</span>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showFavoritesSection ? 'rotate-0' : '-rotate-90'}`}
                  />
                </div>
              )}

              {(showFavoritesSection || isCollapsed) && (
                <div className="space-y-0.5 mt-1">
                  {favorites.map((view) => {
                    const item = itemLookup.get(view);
                    if (!item) return null;
                    const active = isSelected(item.view);
                    const badge = getItemBadge(item);

                    return (
                      <div
                        key={`fav-${item.id}`}
                        onClick={() => handleNav(item.view, item.params)}
                        title={isCollapsed ? `${item.label} (Pinned)` : undefined}
                        className={`group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#E8622C]/20 text-white font-semibold relative before:content-[\'\'] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-[#E8622C] before:rounded-r'
                            : 'text-[#C7CEE6] hover:bg-white/[0.06] hover:text-white'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                      >
                        <span className="shrink-0 text-amber-400">
                          {renderNavIcon(item.icon, 'w-3.5 h-3.5')}
                        </span>
                        {!isCollapsed && (
                          <>
                            <span className="truncate flex-1">{item.label}</span>
                            {badge && (
                              <span className={`text-[9px] font-bold text-white px-1.5 py-0.2 rounded-full ${badge.color}`}>
                                {badge.text}
                              </span>
                            )}
                            <button
                              onClick={(e) => toggleFavorite(item.view, e)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-amber-400 hover:text-rose-400 transition-opacity"
                              title="Unpin from favorites"
                            >
                              <Star className="w-3 h-3 fill-amber-400" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Grouped Navigation Sections */}
          {filteredNavigation.map((group) => {
            const isExpanded = expandedGroups[group.id] ?? false;
            const hasActiveChild = group.items.some((i) => isSelected(i.view));

            return (
              <div key={group.id} className="space-y-0.5">
                {/* Group Header */}
                {!isCollapsed ? (
                  <div
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-[#8B96B8] hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 opacity-70">
                        {renderNavIcon(group.icon, 'w-3.5 h-3.5')}
                      </span>
                      <span className="text-[10.5px] font-bold uppercase tracking-wider truncate">
                        {group.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {hasActiveChild && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E8622C]" />
                      )}
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          isExpanded || filterQuery ? 'rotate-0' : '-rotate-90'
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  /* Mini mode icon trigger with flyout */
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setFlyoutPosition({ top: Math.min(rect.top, window.innerHeight - 350) });
                      setFlyoutGroup(flyoutGroup?.id === group.id ? null : group);
                    }}
                    title={group.title}
                    className={`w-full py-2 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors relative ${
                      hasActiveChild
                        ? 'bg-[#E8622C]/20 text-white font-semibold before:content-[\'\'] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#E8622C] before:rounded-r'
                        : 'text-[#9AA5C4] hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {renderNavIcon(group.icon, 'w-4 h-4')}
                    <span className="text-[8.5px] font-bold uppercase tracking-tight mt-0.5 truncate max-w-[56px]">
                      {group.shortLabel || group.title.slice(0, 5)}
                    </span>
                  </div>
                )}

                {/* Group Items (when expanded on desktop/drawer) */}
                {(!isCollapsed && (isExpanded || filterQuery)) && (
                  <div className="space-y-0.5 pl-2 border-l border-white/[0.08] ml-2 mt-0.5">
                    {group.items.map((item) => {
                      const active = isSelected(item.view);
                      const isFav = favorites.includes(item.view);
                      const badge = getItemBadge(item);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNav(item.view, item.params)}
                          className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#E8622C]/20 text-white font-semibold relative before:content-[\'\'] before:absolute before:-left-2.5 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-[#E8622C] before:rounded-r'
                              : 'text-[#C7CEE6] hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`shrink-0 ${active ? 'text-[#E8622C]' : 'text-[#8B96B8] group-hover:text-white'}`}>
                              {renderNavIcon(item.icon, 'w-3.5 h-3.5')}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {badge && (
                              <span className={`text-[9px] font-bold text-white px-1.5 py-0.2 rounded-full ${badge.color}`}>
                                {badge.text}
                              </span>
                            )}
                            <button
                              onClick={(e) => toggleFavorite(item.view, e)}
                              className={`p-0.5 rounded transition-opacity ${
                                isFav ? 'opacity-100 text-amber-400' : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 text-slate-400 hover:text-amber-400'
                              }`}
                              title={isFav ? 'Unpin from favorites' : 'Pin to favorites'}
                            >
                              <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty search state */}
          {filteredNavigation.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              <Search className="w-5 h-5 mx-auto mb-1.5 opacity-50" />
              <div>No screens match "{filterQuery}"</div>
              <button
                onClick={() => setFilterQuery('')}
                className="mt-2 text-indigo-400 hover:underline text-[11px]"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Recent Records Toggle Section (Bottom of middle zone) */}
          {!isCollapsed && !filterQuery && recentRecords.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06]">
              <div
                onClick={() => setShowRecentSection(!showRecentSection)}
                className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <History className="w-3 h-3" />
                  <span>Recent Records ({recentRecords.length})</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearRecentRecords}
                    title="Clear history"
                    className="text-slate-500 hover:text-rose-400 p-0.5"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showRecentSection ? 'rotate-0' : '-rotate-90'}`}
                  />
                </div>
              </div>

              {showRecentSection && (
                <div className="space-y-1 mt-1">
                  {recentRecords.slice(0, 5).map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => handleNav(rec.view, rec.params)}
                      className="px-2 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-xs cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-bold text-indigo-300">{rec.recordCode}</span>
                        <span className="text-slate-400 text-[9px]">{rec.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-slate-200 truncate mt-0.5">{rec.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Zone: Collapse Control & Version */}
        <div className="p-2 border-t border-white/[0.08] shrink-0 bg-[#101B33]">
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-2 py-1">
              <div className="text-[10px] text-slate-400 font-mono">
                Reboot v4.8 &bull; Industrial
              </div>
              <button
                onClick={onToggleCollapse}
                title="Collapse Sidebar (Ctrl+B)"
                className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-white/10 text-xs transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[10px]">Collapse</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onToggleCollapse}
              title="Expand Sidebar (Ctrl+B)"
              className="w-full py-1.5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Flyout Submenu for Collapsed Mini Sidebar Mode */}
      {isCollapsed && flyoutGroup && flyoutPosition && (
        <div
          ref={flyoutRef}
          style={{ top: flyoutPosition.top }}
          className="fixed left-[72px] z-50 w-64 bg-[#14213D] border border-white/15 rounded-xl shadow-2xl p-2.5 space-y-1 text-white animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 text-xs font-bold uppercase tracking-wider text-[#E8622C]">
            <div className="flex items-center gap-2">
              {renderNavIcon(flyoutGroup.icon, 'w-4 h-4')}
              <span>{flyoutGroup.title}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-normal">
              {flyoutGroup.items.length} items
            </span>
          </div>

          <div className="space-y-0.5">
            {flyoutGroup.items.map((item) => {
              const active = isSelected(item.view);
              const badge = getItemBadge(item);
              const isFav = favorites.includes(item.view);

              return (
                <div
                  key={`flyout-${item.id}`}
                  onClick={() => handleNav(item.view, item.params)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#E8622C] text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 opacity-80">
                      {renderNavIcon(item.icon, 'w-3.5 h-3.5')}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {badge && (
                      <span className={`text-[9px] font-bold text-white px-1.5 py-0.2 rounded-full ${badge.color}`}>
                        {badge.text}
                      </span>
                    )}
                    <button
                      onClick={(e) => toggleFavorite(item.view, e)}
                      className={`p-0.5 rounded ${isFav ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}
                    >
                      <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
