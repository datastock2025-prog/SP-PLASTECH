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
import { CrmDashboardView } from '../components/CrmDashboardView';
import { CrmLeadListView } from '../components/CrmLeadListView';
import { CrmLeadDetailView } from '../components/CrmLeadDetailView';
import { CrmOpportunityPipelineView } from '../components/CrmOpportunityPipelineView';
import { CrmOpportunityDetailView } from '../components/CrmOpportunityDetailView';
import { CrmAccountListView } from '../components/CrmAccountListView';
import { CrmCustomer360View } from '../components/CrmCustomer360View';
import { CrmContactListView } from '../components/CrmContactListView';
import { CrmActivityManagementView } from '../components/CrmActivityManagementView';
import { CrmInquiryCostingView } from '../components/CrmInquiryCostingView';
import { CrmQuotationManagementView } from '../components/CrmQuotationManagementView';
import { CrmSampleRequestView } from '../components/CrmSampleRequestView';
import { CrmComplaintManagementView } from '../components/CrmComplaintManagementView';
import { CrmDocumentCenterView } from '../components/CrmDocumentCenterView';
import { CrmCustomerSegmentationView } from '../components/CrmCustomerSegmentationView';
import { CrmAnalyticsReportsView } from '../components/CrmAnalyticsReportsView';
import { useCustomers } from '@/src/hooks/useMasterData';
import { useQuotations } from '@/src/hooks/useSales';

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
  // TanStack Query SSOT (Rule 1 & Rule 3)
  const { data: _queryCustomers } = useCustomers();
  const { data: _queryQuotes } = useQuotations();

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
    if (currentView === 'crmLeadDetail' || currentView === 'crmLeads' || currentView === 'leads') return 'crmLeadList';
    if (currentView === 'crmOpportunityDetail' || currentView === 'crmOpportunities' || currentView === 'crmOpps' || currentView === 'opportunities') return 'crmOpportunityPipeline';
    if (currentView === 'crmCustomer360' || currentView === 'crmAccounts' || currentView === 'accounts') return 'crmAccountList';
    if (currentView === 'crmContacts' || currentView === 'contacts') return 'crmContactList';
    if (currentView === 'crmFeedback' || currentView === 'crmComplaints' || currentView === 'claims') return 'crmComplaintManagement';
    if (currentView === 'crmActivities') return 'crmActivityManagement';
    if (currentView === 'crmCosting') return 'crmInquiryCosting';
    if (currentView === 'crmQuotes') return 'crmQuotationManagement';
    if (currentView === 'crmSamples') return 'crmSampleRequest';
    if (currentView === 'crmDocs') return 'crmDocumentCenter';
    if (currentView === 'crmSegmentation') return 'crmCustomerSegmentation';
    if (currentView === 'crmAnalytics' || currentView === 'crmReports') return 'crmAnalyticsReports';
    return currentView;
  };

  const activeTabId = getActiveTabId();

  const renderContent = () => {
    switch (currentView) {
      case 'crmDashboard':
      case 'crm':
        return <CrmDashboardView onNavigate={onNavigate} showToast={showToast} />;

      case 'crmLeadList':
      case 'crmLeads':
      case 'leads':
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
      case 'crmOpportunities':
      case 'crmOpps':
      case 'opportunities':
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
      case 'crmAccounts':
      case 'accounts':
        return (
          <CrmAccountListView
            onNavigate={onNavigate}
            showToast={showToast}
            initialFilter={viewParams?.filter}
          />
        );

      case 'crmCustomer360':
      case 'customer360':
        return (
          <CrmCustomer360View
            accountId={viewParams?.accountId || 'ACC-1001'}
            onNavigate={onNavigate}
            showToast={showToast}
          />
        );

      case 'crmContactList':
      case 'crmContacts':
      case 'contacts':
        return (
          <CrmContactListView
            onNavigate={onNavigate}
            showToast={showToast}
            initialAccountId={viewParams?.accountId}
          />
        );

      case 'crmActivityManagement':
      case 'crmActivities':
      case 'activities':
        return <CrmActivityManagementView onNavigate={onNavigate} showToast={showToast} />;

      case 'crmInquiryCosting':
      case 'crmCosting':
      case 'costing':
        return <CrmInquiryCostingView onNavigate={onNavigate} showToast={showToast} />;

      case 'crmQuotationManagement':
      case 'crmQuotes':
        return (
          <CrmQuotationManagementView
            onNavigate={onNavigate}
            showToast={showToast}
            initialAccountId={viewParams?.accountId}
            createFromOpp={viewParams?.createFromOpp}
          />
        );

      case 'crmSampleRequest':
      case 'crmSamples':
      case 'sampleRequests':
        return (
          <CrmSampleRequestView
            onNavigate={onNavigate}
            showToast={showToast}
            initialAccountId={viewParams?.accountId}
            createFromOpp={viewParams?.createFromOpp}
          />
        );

      case 'crmComplaintManagement':
      case 'crmFeedback':
      case 'crmComplaints':
      case 'claims':
        return (
          <CrmComplaintManagementView
            onNavigate={onNavigate}
            showToast={showToast}
            initialAccountId={viewParams?.accountId}
          />
        );

      case 'crmDocumentCenter':
      case 'crmDocs':
        return (
          <CrmDocumentCenterView
            onNavigate={onNavigate}
            showToast={showToast}
            initialAccountId={viewParams?.accountId}
          />
        );

      case 'crmCustomerSegmentation':
      case 'crmSegmentation':
        return <CrmCustomerSegmentationView onNavigate={onNavigate} showToast={showToast} />;

      case 'crmAnalyticsReports':
      case 'crmAnalytics':
      case 'crmReports':
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

export default CrmViews;
