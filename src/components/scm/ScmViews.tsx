import React, { useState } from 'react';
import {
  Compass,
  TrendingUp,
  Activity,
  Package,
  Layers,
  Building,
  Truck,
  Ship,
  MapPin,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Leaf,
  FileSpreadsheet,
  Settings,
  Shield,
  Search,
  ChevronRight,
  Sliders,
  DollarSign,
  AlertTriangle,
  Menu,
} from 'lucide-react';

import { ScmControlTowerView } from './ScmControlTowerView';
import { ScmDemandPlanningView } from './ScmDemandPlanningView';
import { ScmSalesForecastView } from './ScmSalesForecastView';
import { ScmSopView } from './ScmSopView';
import { ScmInventoryPlanningView } from './ScmInventoryPlanningView';
import { ScmMrpView } from './ScmMrpView';
import { ScmReplenishmentView } from './ScmReplenishmentView';
import { ScmSupplierCollaborationView } from './ScmSupplierCollaborationView';
import { ScmInboundLogisticsView } from './ScmInboundLogisticsView';
import { ScmOutboundLogisticsView } from './ScmOutboundLogisticsView';
import { ScmFreightTransportView } from './ScmFreightTransportView';
import { ScmTrackTraceView } from './ScmTrackTraceView';
import { ScmSupplierRiskView } from './ScmSupplierRiskView';
import { ScmInventoryAgingView } from './ScmInventoryAgingView';
import { ScmOrderTimelineView } from './ScmOrderTimelineView';
import { ScmExceptionsView } from './ScmExceptionsView';
import { ScmSustainabilityView } from './ScmSustainabilityView';
import { ScmReportsView } from './ScmReportsView';
import { ScmSettingsView } from './ScmSettingsView';
import { ScmRbacView } from './ScmRbacView';

interface ScmViewsProps {
  activeSubView?: string;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmViews: React.FC<ScmViewsProps> = ({
  activeSubView = 'scmControlTower',
  onNavigate,
  showToast,
}) => {
  const [currentView, setCurrentView] = useState<string>(activeSubView);

  // Sync internal state if prop changes
  React.useEffect(() => {
    if (activeSubView) {
      setCurrentView(activeSubView);
    }
  }, [activeSubView]);

  const handleSubNavigate = (view: string, param?: any) => {
    setCurrentView(view);
    onNavigate(view, param);
  };

  const navGroups = [
    {
      group: 'Command & Planning',
      items: [
        { id: 'scmControlTower', label: 'Control Tower', icon: Compass },
        { id: 'scmDemandPlanning', label: 'Demand Planning', icon: TrendingUp },
        { id: 'scmSalesForecast', label: 'Sales Forecast', icon: Activity },
        { id: 'scmSOP', label: 'S&OP Alignment', icon: Sliders },
        { id: 'scmMRP', label: 'MRP Workbench', icon: Layers },
      ],
    },
    {
      group: 'Inventory & Procurement',
      items: [
        { id: 'scmInventoryPlanning', label: 'Inventory Planning', icon: Package },
        { id: 'scmReplenishment', label: 'Replenishment Rules', icon: RefreshCwIcon },
        { id: 'scmInventoryAging', label: 'Aging & FEFO', icon: Clock },
        { id: 'scmSupplierCollaboration', label: 'Supplier Portal & ASN', icon: Building },
        { id: 'scmSupplierRisk', label: 'Supplier Risk', icon: ShieldAlert },
      ],
    },
    {
      group: 'Logistics & Execution',
      items: [
        { id: 'scmInboundLogistics', label: 'Inbound & Port Customs', icon: Ship },
        { id: 'scmOutboundLogistics', label: 'Outbound Milk Runs', icon: Truck },
        { id: 'scmFreight', label: 'Freight & TMS', icon: Truck },
        { id: 'scmTrackTrace', label: '360° Traceability', icon: MapPin },
        { id: 'scmOrderTimeline', label: '16-Stage Pipeline', icon: CheckCircle2 },
      ],
    },
    {
      group: 'Control & Intelligence',
      items: [
        { id: 'scmExceptions', label: 'Exceptions & CAPA', icon: AlertTriangle, badge: '4 Active' },
        { id: 'scmSustainability', label: 'Circular ESG', icon: Leaf },
        { id: 'scmReports', label: 'SCM Reports', icon: FileSpreadsheet },
        { id: 'scmSettings', label: 'Planning Policies', icon: Settings },
        { id: 'scmRbac', label: 'RBAC Security', icon: Shield },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* SCM Sub-Navigation Hub Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <div className="flex items-center gap-1.5 min-w-max">
            {navGroups.flatMap((g) => g.items).map((tab) => {
              const Icon = tab.icon;
              const isActive = currentView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSubNavigate(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#14213D] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0F8B8D]' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Render Active View Component */}
      <div>
        {currentView === 'scmControlTower' && (
          <ScmControlTowerView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmDemandPlanning' && (
          <ScmDemandPlanningView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmSalesForecast' && (
          <ScmSalesForecastView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmSOP' && (
          <ScmSopView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmInventoryPlanning' && (
          <ScmInventoryPlanningView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmMRP' && (
          <ScmMrpView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmReplenishment' && (
          <ScmReplenishmentView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmSupplierCollaboration' && (
          <ScmSupplierCollaborationView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmInboundLogistics' && (
          <ScmInboundLogisticsView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmOutboundLogistics' && (
          <ScmOutboundLogisticsView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmFreight' && (
          <ScmFreightTransportView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmTrackTrace' && (
          <ScmTrackTraceView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmSupplierRisk' && (
          <ScmSupplierRiskView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmInventoryAging' && (
          <ScmInventoryAgingView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmOrderTimeline' && (
          <ScmOrderTimelineView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmExceptions' && (
          <ScmExceptionsView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmSustainability' && (
          <ScmSustainabilityView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmReports' && (
          <ScmReportsView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmSettings' && (
          <ScmSettingsView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
        {currentView === 'scmRbac' && (
          <ScmRbacView onNavigate={handleSubNavigate} showToast={showToast} />
        )}
      </div>
    </div>
  );
};

// Helper icon component
const RefreshCwIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);
