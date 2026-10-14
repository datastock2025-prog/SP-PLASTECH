// ============================================================================
// DOMAIN MODULE: CRM (CUSTOMER RELATIONSHIP MANAGEMENT & PIPELINE)
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export {
  CrmViews,
  useCrm,
  useLeads,
  useSaveLead,
  useOpportunities,
  useSaveOpportunity,
  crmApi,
  crmRoutes,
  CrmDashboardView,
  CrmLeadListView,
  CrmLeadDetailView,
  CrmOpportunityPipelineView,
  CrmOpportunityDetailView,
  CrmAccountListView,
  CrmCustomer360View,
  CrmContactListView,
  CrmActivityManagementView,
  CrmInquiryCostingView,
  CrmQuotationManagementView,
  CrmSampleRequestView,
  CrmComplaintManagementView,
  CrmDocumentCenterView,
  CrmCustomerSegmentationView,
  CrmAnalyticsReportsView,
} from '../../../apps/web/src/modules/crm';

export {
  mockLeads,
  mockOpportunities,
  mockAccounts,
  mockContacts,
  mockActivities,
  mockCustomerInquiries,
  mockQuotations,
  mockSampleRequests,
  mockCustomerComplaints,
  mockCustomerDocuments,
  mockCustomerSegmentations,
  mockCrmReports,
  mockCrmSettings,
  mockCrmRbac,
  mockComplaints,
  mockSalesOrders,
} from '../../data/mockCrmData';

export type {
  Lead,
  Opportunity,
  Account as CrmAccount,
  Contact,
  Activity,
  CustomerInquiry,
  Quotation as CrmQuotation,
  SampleRequest,
  CustomerComplaint,
  CustomerDocument,
  CustomerSegmentation,
  CrmReportTemplate,
  CrmSettingsConfig,
  CrmRolePermission,
} from '../../types/crm';
