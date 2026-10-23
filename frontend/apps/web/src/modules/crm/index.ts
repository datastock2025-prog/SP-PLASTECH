// ============================================================================
// CRM MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/crm/index.ts
// ============================================================================

export { CrmViews } from './screens/CrmViews';

export {
  useCrm,
  useLeads,
  useSaveLead,
  useOpportunities,
  useSaveOpportunity,
  useAccounts,
  useContacts,
  useActivities,
} from './api/useCrm';

export { crmApi } from './api/crmApi';
export { crmRoutes } from './routes';

export {
  LeadSchema,
  CreateLeadInputSchema,
  UpdateLeadInputSchema,
  OpportunitySchema,
  CreateOpportunityInputSchema,
  UpdateOpportunityInputSchema,
  CustomerInquirySchema,
  ComplaintSchema,
  LeadStatusEnum,
  OpportunityStageEnum,
  leadFormSchema,
} from './model/crmSchemas';

export type {
  LeadContract,
  CreateLeadContract,
  UpdateLeadContract,
  OpportunityContract,
  CreateOpportunityContract,
  UpdateOpportunityContract,
  CustomerInquiryContract,
  ComplaintContract,
  LeadFormValues,
  Lead,
  Opportunity,
  Account,
  Contact,
  Activity,
  CustomerInquiry,
  Quotation,
  SampleRequest,
  CustomerComplaint,
  CustomerDocument,
  CustomerSegmentation,
  CrmReportTemplate,
  CrmSettingsConfig,
  CrmRolePermission,
  LeadStatus,
  OpportunityStage,
  ProductInterestType,
  ActivityType,
  ActivityStatus,
  CustomerDocumentType,
  Complaint,
  ComplaintSeverity,
  ComplaintStatus,
  QuotationStatus,
  SampleApprovalStatus,
} from './model/crmSchemas';

// CRM Sub-components
export { CrmDashboardView } from './components/CrmDashboardView';
export { CrmLeadListView } from './components/CrmLeadListView';
export { CrmLeadDetailView } from './components/CrmLeadDetailView';
export { CrmOpportunityPipelineView } from './components/CrmOpportunityPipelineView';
export { CrmOpportunityDetailView } from './components/CrmOpportunityDetailView';
export { CrmAccountListView } from './components/CrmAccountListView';
export { CrmCustomer360View } from './components/CrmCustomer360View';
export { CrmContactListView } from './components/CrmContactListView';
export { CrmActivityManagementView } from './components/CrmActivityManagementView';
export { CrmInquiryCostingView } from './components/CrmInquiryCostingView';
export { CrmQuotationManagementView } from './components/CrmQuotationManagementView';
export { CrmSampleRequestView } from './components/CrmSampleRequestView';
export { CrmComplaintManagementView } from './components/CrmComplaintManagementView';
export { CrmDocumentCenterView } from './components/CrmDocumentCenterView';
export { CrmCustomerSegmentationView } from './components/CrmCustomerSegmentationView';
export { CrmAnalyticsReportsView } from './components/CrmAnalyticsReportsView';
