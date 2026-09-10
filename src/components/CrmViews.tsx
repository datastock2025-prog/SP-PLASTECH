import React from 'react';
import {
  Users,
  Target,
  Building2,
  PhoneCall,
  Calculator,
  FileText,
  FlaskConical,
  AlertOctagon,
  FileCheck,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { CrmDashboardView } from './crm/CrmDashboardView';
import { CrmLeadListView } from './crm/CrmLeadListView';
import { CrmLeadDetailView } from './crm/CrmLeadDetailView';
import { CrmOpportunityPipelineView } from './crm/CrmOpportunityPipelineView';
import { CrmOpportunityDetailView } from './crm/CrmOpportunityDetailView';
import { CrmAccountListView } from './crm/CrmAccountListView';
import { CrmCustomer360View } from './crm/CrmCustomer360View';
import { CrmContactListView } from './crm/CrmContactListView';
import { CrmActivityManagementView } from './crm/CrmActivityManagementView';
import { CrmInquiryCostingView } from './crm/CrmInquiryCostingView';
import { CrmQuotationManagementView } from './crm/CrmQuotationManagementView';
import { CrmSampleRequestView } from './crm/CrmSampleRequestView';
import { CrmComplaintManagementView } from './crm/CrmComplaintManagementView';
import { CrmDocumentCenterView } from './crm/CrmDocumentCenterView';
import { CrmCustomerSegmentationView } from './crm/CrmCustomerSegmentationView';
import { CrmAnalyticsReportsView } from './crm/CrmAnalyticsReportsView';

interface CrmViewsProps {
  currentView: string;
  viewParams?: any;
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
}

export const CrmViews: React.FC<CrmViewsProps> = ({
  currentView,
  viewParams,
  onNavigate,
  showToast,
}) => {
  const crmNavTabs = [
    { id: 'crmDashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'crmLeadList', label: 'Leads', icon: Users },
    { id: 'crmOpportunityPipeline', label: 'Pipeline & Deals', icon: Target },
    { id: 'crmAccountList', label: 'Accounts / 360', icon: Building2 },
    { id: 'crmContactList', label: 'Contacts', icon: PhoneCall },
    { id: 'crmActivityManagement', label: 'Activities', icon: Layers },
    { id: 'crmInquiryCosting', label: 'Costing Modeler', icon: Calculator },
    { id: 'crmQuotationManagement', label: 'Quotations', icon: FileText },
    { id: 'crmSampleRequest', label: 'Sample Trials', icon: FlaskConical },
    { id: 'crmComplaintManagement', label: '8D Complaints', icon: AlertOctagon },
    { id: 'crmDocumentCenter', label: 'Documents & COAs', icon: FileCheck },
    { id: 'crmCustomerSegmentation', label: 'Tiers & RFM', icon: PieChartIcon },
    { id: 'crmAnalyticsReports', label: 'Analytics', icon: BarChart3 },
  ];

  // Derive active top tab
  const getActiveTabId = () => {
    if (currentView === 'crmLeadDetail') return 'crmLeadList';
    if (currentView === 'crmOpportunityDetail') return 'crmOpportunityPipeline';
    if (currentView === 'crmCustomer360') return 'crmAccountList';
    return currentView;
  };

  const activeTabId = getActiveTabId();

  const renderContent = () => {
    switch (currentView) {
      case 'crmDashboard':
        return <CrmDashboardView onNavigate={onNavigate} showToast={showToast} />;

      case 'crmLeadList':
        return (
          <CrmLeadListView
            onNavigate={onNavigate}
            showToast={showToast}
            initialFilter={viewParams?.filter}
          />
        );

      case 'crmLeadDetail':
        return (
          <CrmLeadDetailView
            leadId={viewParams?.leadId || 'LEAD-2026-001'}
            onNavigate={onNavigate}
            showToast={showToast}
            initialConvert={viewParams?.convert}
          />
        );

      case 'crmOpportunityPipeline':
        return (
          <CrmOpportunityPipelineView
            onNavigate={onNavigate}
            showToast={showToast}
            initialFilter={viewParams?.filter}
          />
        );

      case 'crmOpportunityDetail':
        return (
          <CrmOpportunityDetailView
            oppId={viewParams?.oppId || 'OPP-2026-001'}
            isNew={viewParams?.isNew}
            onNavigate={onNavigate}
            showToast={showToast}
          />
        );

      case 'crmAccountList':
        return (
          <CrmAccountListView
            onNavigate={onNavigate}
            showToast={showToast}
            initialFilter={viewParams?.filter}
          />
        );

      case 'crmCustomer360':
        return (
          <CrmCustomer360View
            accountId={viewParams?.accountId || 'ACC-1001'}
            onNavigate={onNavigate}
            showToast={showToast}
          />
        );

      case 'crmContactList':
        return (
          <CrmContactListView
            onNavigate={onNavigate}
            showToast={showToast}
            initialAccountId={viewParams?.accountId}
          />
        );

      case 'crmActivityManagement':
        return <CrmActivityManagementView onNavigate={onNavigate} showToast={showToast} />;

      case 'crmInquiryCosting':
        return <CrmInquiryCostingView onNavigate={onNavigate} showToast={showToast} />;

      case 'crmQuotationManagement':
        return (
          <CrmQuotationManagementView
            onNavigate={onNavigate}
            showToast={showToast}
            initialAccountId={viewParams?.accountId}
            createFromOpp={viewParams?.createFromOpp}
          />
        );

      case 'crmSampleRequest':
        return (
          <CrmSampleRequestView
            onNavigate={onNavigate}
            showToast={showToast}
            initialAccountId={viewParams?.accountId}
            createFromOpp={viewParams?.createFromOpp}
          />
        );

      case 'crmComplaintManagement':
        return (
          <CrmComplaintManagementView
            onNavigate={onNavigate}
            showToast={showToast}
            initialAccountId={viewParams?.accountId}
          />
        );

      case 'crmDocumentCenter':
        return (
          <CrmDocumentCenterView
            onNavigate={onNavigate}
            showToast={showToast}
            initialAccountId={viewParams?.accountId}
          />
        );

      case 'crmCustomerSegmentation':
        return <CrmCustomerSegmentationView onNavigate={onNavigate} showToast={showToast} />;

      case 'crmAnalyticsReports':
        return <CrmAnalyticsReportsView onNavigate={onNavigate} showToast={showToast} />;

      default:
        return <CrmDashboardView onNavigate={onNavigate} showToast={showToast} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* CRM Sub-Navigation Quick Bar */}
      <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {crmNavTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main CRM View Container */}
      <div>{renderContent()}</div>
    </div>
  );
};
