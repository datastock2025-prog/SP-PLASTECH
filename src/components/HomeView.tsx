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
} from 'lucide-react';
import { NAVIGATION_GROUPS, NavItemDef } from '../data/sidebarNavigationData';

interface HomeViewProps {
  onNavigate: (view: string, param?: any) => void;
  openAngularGuide: () => void;
  activeWOCount: number;
  lowStockCount: number;
  openPOCount: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  openAngularGuide,
  activeWOCount,
  lowStockCount,
  openPOCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

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

  // Flatten all items with group context
  const allItems = useMemo(() => {
    return NAVIGATION_GROUPS.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        groupId: group.id,
        groupTitle: group.title,
      }))
    );
  }, []);

  // Filter items by search query and category
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return NAVIGATION_GROUPS.map((group) => {
      // Category check
      if (selectedCategory !== 'ALL' && group.id !== selectedCategory) {
        return null;
      }

      // Items filter
      const matchingItems = group.items.filter((item) => {
        if (!q) return true;
        return (
          item.label.toLowerCase().includes(q) ||
          item.subGroup?.toLowerCase().includes(q) ||
          group.title.toLowerCase().includes(q) ||
          item.view.toLowerCase().includes(q)
        );
      });

      if (matchingItems.length === 0) return null;

      return {
        ...group,
        items: matchingItems,
      };
    }).filter(Boolean) as typeof NAVIGATION_GROUPS;
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Launch Hero Command Banner */}
      <div className="bg-gradient-to-br from-[#14213D] via-[#1A2C52] to-[#0F8B8D] text-white p-5 sm:p-7 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/[0.08] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 text-[11px] font-mono uppercase tracking-wider mb-2 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Plant 01 &bull; Injection Molding Unit (Hosūr) &bull; Shift A
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-['Space_Grotesk'] text-white">
              Reboot ERP &mdash; Workspace Home
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              Unified operating command for plastics manufacturing &mdash; from resin intake, mold tooling, and press execution to multi-tier finance, supply chain, and compliance.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/10">
              <div className="text-lg sm:text-xl font-bold text-white font-mono">92.4%</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium">OEE Today</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/10">
              <div className="text-lg sm:text-xl font-bold text-cyan-300 font-mono">{activeWOCount}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium">Active WOs</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/10">
              <div className="text-lg sm:text-xl font-bold text-amber-300 font-mono">{lowStockCount}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium">Low Stock</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/10">
              <div className="text-lg sm:text-xl font-bold text-emerald-300 font-mono">{openPOCount}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium">Open POs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Angular Guide Highlight & System Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#E8622C]/10 via-[#0F8B8D]/10 to-white bg-white border border-[#E8622C]/30 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8622C] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Angular 18+ Architecture Specification</h3>
              <p className="text-xs text-slate-500">Standalone modules, Signals state, OnPush migration guide.</p>
            </div>
          </div>
          <button
            onClick={openAngularGuide}
            className="px-3 py-1.5 rounded-lg bg-[#E8622C] hover:bg-[#D45320] text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
          >
            <span>Open Spec</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-teal-500/10 to-white bg-white border border-indigo-200 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Human Resources &amp; Line Staffing</h3>
              <p className="text-xs text-slate-500">128 active personnel, biometric punches, IATF skill matrix.</p>
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

      {/* Module Finder & Category Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
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

          <div className="text-xs text-slate-500 font-medium self-end md:self-center">
            Showing <b>{filteredGroups.reduce((acc, g) => acc + g.items.length, 0)}</b> of <b>{allItems.length}</b> screens
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
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
        <div className="space-y-8">
          {filteredGroups.map((group) => (
            <div key={group.id} className="space-y-3">
              {/* Group Title Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E8622C]" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider font-['Space_Grotesk']">
                    {group.title}
                  </h2>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
                    {group.items.length} {group.items.length === 1 ? 'Screen' : 'Screens'}
                  </span>
                </div>
              </div>

              {/* Items Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(item.view, item.params)}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
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
