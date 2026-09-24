import React from 'react';
import {
  BarChart3,
  PieChart,
  ShieldAlert,
  Boxes,
  Truck,
  Leaf,
  Wrench,
  FileCode,
  Sparkles,
} from 'lucide-react';
import {
  ModernAnalyticsDashboard,
  OeeAnalyticsView,
  QualityDefectReportsView,
  InventoryAgingView,
  ScmPerformanceView,
  EsgSustainabilityView,
  MaintenanceMtbfView,
  CustomDocumentBuilder,
} from './analytics';

interface AnalyticsViewsProps {
  currentView: string;
  viewParams?: any;
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
}

export const AnalyticsViews: React.FC<AnalyticsViewsProps> = ({
  currentView,
  viewParams,
  onNavigate,
  showToast,
}) => {
  const analyticsNavTabs = [
    { id: 'analyticsDash', label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'oeeDash', label: 'OEE & Loss Pareto', icon: PieChart },
    { id: 'qualityReports', label: 'Quality & PPM', icon: ShieldAlert },
    { id: 'scmInventoryAging', label: 'Inventory Aging & SLOB', icon: Boxes },
    { id: 'scmReports', label: 'SCM & OTIF', icon: Truck },
    { id: 'scmSustainability', label: 'ESG & Carbon', icon: Leaf },
    { id: 'maintenanceReports', label: 'MTBF & MTTR', icon: Wrench },
    { id: 'customDocBuilder', label: 'Document Builder', icon: FileCode },
  ];

  return (
    <div className="space-y-4">
      {/* Top Module Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200 text-teal-800 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
            <span>Document Intelligence</span>
          </div>

          {analyticsNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View Container */}
      <div>
        {currentView === 'analyticsDash' && (
          <ModernAnalyticsDashboard onNavigate={onNavigate} showToast={showToast} />
        )}
        {currentView === 'oeeDash' && (
          <OeeAnalyticsView onNavigate={onNavigate} showToast={showToast} />
        )}
        {currentView === 'qualityReports' && (
          <QualityDefectReportsView onNavigate={onNavigate} showToast={showToast} />
        )}
        {currentView === 'scmInventoryAging' && (
          <InventoryAgingView onNavigate={onNavigate} showToast={showToast} />
        )}
        {currentView === 'scmReports' && (
          <ScmPerformanceView onNavigate={onNavigate} showToast={showToast} />
        )}
        {currentView === 'scmSustainability' && (
          <EsgSustainabilityView onNavigate={onNavigate} showToast={showToast} />
        )}
        {currentView === 'maintenanceReports' && (
          <MaintenanceMtbfView onNavigate={onNavigate} showToast={showToast} />
        )}
        {currentView === 'customDocBuilder' && (
          <CustomDocumentBuilder onNavigate={onNavigate} showToast={showToast} />
        )}
      </div>
    </div>
  );
};

export default AnalyticsViews;
