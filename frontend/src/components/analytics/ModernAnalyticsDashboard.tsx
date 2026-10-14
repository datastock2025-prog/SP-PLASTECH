import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Download,
  RefreshCw,
  Sliders,
  DollarSign,
  Activity,
  Award,
  Truck,
  Layers,
  FileText,
  AlertCircle,
  Building2,
  Shield,
} from 'lucide-react';
import { analyticsApi } from '../../services/analytics/analytics.api';
import { ExecutiveKpiSummary } from '../../types/analyticsTypes';
import { KpiCard } from './KpiCard';
import { FilterPanel } from './FilterPanel';
import { ExportModal } from './ExportModal';
import { ChatAssistantModal } from './ChatAssistantModal';
import { FixedBottomChatWidget } from './FixedBottomChatWidget';
import { AdminDomainRbacControl, DomainPermissionConfig } from './AdminDomainRbacControl';

interface ModernAnalyticsDashboardProps {
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const ModernAnalyticsDashboard: React.FC<ModernAnalyticsDashboardProps> = ({
  onNavigate,
  showToast = (_m: string) => {},
}) => {
  const [data, setData] = useState<ExecutiveKpiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: 'last_30_days',
    plantId: 'ALL',
    shift: 'ALL',
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showRbacModal, setShowRbacModal] = useState(false);

  // User Domain RBAC State
  const activeRole = localStorage.getItem('userRole') || 'ADMIN';
  const [allowedDomains, setAllowedDomains] = useState<Record<string, boolean>>({
    FINANCIAL: true,
    PRODUCTION: true,
    QUALITY: true,
    SUPPLY_CHAIN: true,
    SUSTAINABILITY: true,
    MAINTENANCE: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getExecutiveKpis(filters);
      setData(res);
    } catch {
      showToast('Error loading executive KPI dataset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Load RBAC matrix if stored
    try {
      const saved = localStorage.getItem('sp_domain_rbac_matrix');
      if (saved) {
        const matrix: DomainPermissionConfig[] = JSON.parse(saved);
        const userPerm = matrix.find((m) => m.role === activeRole) || matrix[0];
        if (userPerm) {
          setAllowedDomains({
            FINANCIAL: userPerm.canViewFinancial,
            PRODUCTION: userPerm.canViewProductionOee,
            QUALITY: userPerm.canViewQualityPpm,
            SUPPLY_CHAIN: userPerm.canViewScmOtif,
            SUSTAINABILITY: userPerm.canViewEsgCarbon,
            MAINTENANCE: userPerm.canViewMaintenanceMtbf,
          });
        }
      }
    } catch {
      // default open
    }
  }, [filters, activeRole]);

  // Filter KPI scorecards based on domain RBAC
  const filteredKpis = data?.kpis?.filter((kpi) => {
    if (kpi.kpiCategory === 'FINANCIAL' && !allowedDomains.FINANCIAL) return false;
    if (kpi.kpiCategory === 'PRODUCTION' && !allowedDomains.PRODUCTION) return false;
    if (kpi.kpiCategory === 'QUALITY' && !allowedDomains.QUALITY) return false;
    if (kpi.kpiCategory === 'SUPPLY_CHAIN' && !allowedDomains.SUPPLY_CHAIN) return false;
    if (kpi.kpiCategory === 'SUSTAINABILITY' && !allowedDomains.SUSTAINABILITY) return false;
    if (kpi.kpiCategory === 'MAINTENANCE' && !allowedDomains.MAINTENANCE) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto relative pb-20">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#14213D] to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold tracking-wide uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E8622C]" />
            <span>Executive Command Tower &bull; Enterprise Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Executive KPI Dashboard &amp; Plant Scorecard
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time synthesis across 4 manufacturing plants, OEE telemetry, PPM quality, and EBITDA rollup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowChatModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0F8B8D] to-[#0D787A] text-white hover:opacity-90 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Ask AI Assistant</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Brief</span>
          </button>
          <button
            onClick={() => setShowRbacModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Admin Domain RBAC Data Controls"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Domain RBAC</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
            title="Refresh Real-Time Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <FilterPanel
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters({ dateRange: 'last_30_days', plantId: 'ALL', shift: 'ALL' })}
      />

      {/* Top Executive Scorecard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {allowedDomains.FINANCIAL && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Revenue YTD</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">₹2.84 Cr</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> +5.4% vs Target
              </div>
            </div>
          </div>
        )}

        {allowedDomains.PRODUCTION && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Plant OEE</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">84.6%</div>
              <div className="text-[10px] text-teal-600 font-bold flex items-center gap-0.5 mt-0.5">
                Target 85.0% (99.5% Adherence)
              </div>
            </div>
          </div>
        )}

        {allowedDomains.QUALITY && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">First Pass Yield (FPY)</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">98.2%</div>
              <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 mt-0.5">
                240 PPM (Six Sigma 4.82)
              </div>
            </div>
          </div>
        )}

        {allowedDomains.SUPPLY_CHAIN && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#E8622C] flex items-center justify-center font-bold shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">On-Time Delivery (OTIF)</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">96.4%</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> +1.5% MoM
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Modular KPI Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Operational Dimension Scorecards ({filteredKpis?.length || 0} Visible Domain Metrics)
          </h2>
          <button
            onClick={() => setShowRbacModal(true)}
            className="text-xs font-bold text-[#0F8B8D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Scorecard &rarr;</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKpis?.map((kpi) => (
            <KpiCard
              key={kpi.id}
              kpi={kpi}
              onDrillDown={(id) => {
                showToast(`Drilling down into ${kpi.kpiName}`);
                if (kpi.kpiCategory === 'PRODUCTION') onNavigate?.('oeeDash');
                else if (kpi.kpiCategory === 'QUALITY') onNavigate?.('qualityReports');
                else if (kpi.kpiCategory === 'SUPPLY_CHAIN') onNavigate?.('scmReports');
                else if (kpi.kpiCategory === 'MAINTENANCE') onNavigate?.('maintenanceReports');
                else if (kpi.kpiCategory === 'SUSTAINABILITY') onNavigate?.('scmSustainability');
              }}
            />
          ))}
        </div>
      </div>

      {/* Direct Module Fast-Jumps */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Specialized Analytics Dashboards
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'OEE & Losses', route: 'oeeDash', color: 'hover:bg-teal-50 hover:text-teal-900 border-slate-200' },
            { label: 'Quality PPM', route: 'qualityReports', color: 'hover:bg-indigo-50 hover:text-indigo-900 border-slate-200' },
            { label: 'Stock Aging', route: 'scmInventoryAging', color: 'hover:bg-amber-50 hover:text-amber-900 border-slate-200' },
            { label: 'SCM & OTIF', route: 'scmReports', color: 'hover:bg-blue-50 hover:text-blue-900 border-slate-200' },
            { label: 'ESG & Carbon', route: 'scmSustainability', color: 'hover:bg-emerald-50 hover:text-emerald-900 border-slate-200' },
            { label: 'MTBF & MTTR', route: 'maintenanceReports', color: 'hover:bg-purple-50 hover:text-purple-900 border-slate-200' },
          ].map((item) => (
            <button
              key={item.route}
              onClick={() => onNavigate?.(item.route)}
              className={`p-2.5 rounded-xl border bg-white text-xs font-bold text-slate-700 text-center transition-all cursor-pointer shadow-2xs ${item.color}`}
            >
              {item.label} &rarr;
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        reportTitle="Executive KPI Dashboard Brief"
        filters={filters}
        showToast={showToast}
      />
      <ChatAssistantModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        showToast={showToast}
      />
      <AdminDomainRbacControl
        isOpen={showRbacModal}
        onClose={() => setShowRbacModal(false)}
        showToast={showToast}
        onPermissionsUpdated={(configs) => {
          const userPerm = configs.find((m) => m.role === activeRole) || configs[0];
          if (userPerm) {
            setAllowedDomains({
              FINANCIAL: userPerm.canViewFinancial,
              PRODUCTION: userPerm.canViewProductionOee,
              QUALITY: userPerm.canViewQualityPpm,
              SUPPLY_CHAIN: userPerm.canViewScmOtif,
              SUSTAINABILITY: userPerm.canViewEsgCarbon,
              MAINTENANCE: userPerm.canViewMaintenanceMtbf,
            });
          }
        }}
      />

      {/* Floating Bottom-Right AI Assistant Chat Widget */}
      <FixedBottomChatWidget showToast={showToast} />
    </div>
  );
};
