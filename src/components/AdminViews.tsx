import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  Hash,
  GitFork,
  Lock,
  ShieldAlert,
  Cpu,
  Database,
  Bell,
  Sliders,
  Boxes,
  Calendar,
  AlertOctagon,
  FileText,
  KeyRound,
  ArrowUpDown,
  Search,
  Layers,
  ChevronDown,
  Zap,
} from 'lucide-react';

import { AdminDashboardView } from './admin/AdminDashboardView';
import { AdminUsersView } from './admin/AdminUsersView';
import { AdminRolesView } from './admin/AdminRolesView';
import { AdminCompanyPlantsView } from './admin/AdminCompanyPlantsView';
import { AdminNumberingView } from './admin/AdminNumberingView';
import { AdminWorkflowsView } from './admin/AdminWorkflowsView';
import { AdminSecurityView } from './admin/AdminSecurityView';
import { AdminAuditLogsView } from './admin/AdminAuditLogsView';
import { AdminIntegrationsView } from './admin/AdminIntegrationsView';
import { AdminBackupsView } from './admin/AdminBackupsView';
import { AdminNotificationsView } from './admin/AdminNotificationsView';
import { AdminSystemParametersView } from './admin/AdminSystemParametersView';

// Newly implemented comprehensive Admin screens
import { AdminUserGroupsView } from './admin/AdminUserGroupsView';
import { AdminApprovalWorkflowConfigView } from './admin/AdminApprovalWorkflowConfigView';
import { AdminCompanySettingsView } from './admin/AdminCompanySettingsView';
import { AdminPlantBranchSettingsView } from './admin/AdminPlantBranchSettingsView';
import { AdminWarehouseLocationsView } from './admin/AdminWarehouseLocationsView';
import { AdminMachineWorkCentersView } from './admin/AdminMachineWorkCentersView';
import { AdminShiftCalendarView } from './admin/AdminShiftCalendarView';
import { AdminReasonCodesView } from './admin/AdminReasonCodesView';
import { AdminMasterDataView } from './admin/AdminMasterDataView';
import { AdminDocumentSettingsView } from './admin/AdminDocumentSettingsView';
import { AdminLoginSecurityAuditView } from './admin/AdminLoginSecurityAuditView';
import { AdminIntegrationManagementView } from './admin/AdminIntegrationManagementView';
import { AdminDataImportExportView } from './admin/AdminDataImportExportView';
import { AdminBackupRetentionPrivacyView } from './admin/AdminBackupRetentionPrivacyView';
import { AdminLicenseSubscriptionView } from './admin/AdminLicenseSubscriptionView';
import { AdminGlobalSearchConfigView } from './admin/AdminGlobalSearchConfigView';
import { AdminQuickActionsConfigView } from './admin/AdminQuickActionsConfigView';
import { AdminRbacSecurityMultiContextView } from './admin/AdminRbacSecurityMultiContextView';

interface AdminViewsProps {
  currentView: string;
  viewParams?: any;
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
}

export const AdminViews: React.FC<AdminViewsProps> = ({
  currentView,
  viewParams,
  onNavigate,
  showToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const allAdminTabs = [
    { id: 'adminGlobalSearchConfig', label: 'Global Config Search', icon: Search, category: 'General' },
    { id: 'adminDashboard', label: 'Overview & Health', icon: LayoutDashboard, category: 'General' },
    { id: 'adminReasonCodes', label: 'Reason Code Setup', icon: AlertOctagon, category: 'Production & Taxonomy' },
    { id: 'adminMachines', label: 'Machine / Work Centers', icon: Cpu, category: 'Production & Taxonomy' },
    { id: 'adminShifts', label: 'Shift & Calendar', icon: Calendar, category: 'Production & Taxonomy' },
    { id: 'adminWarehouseLocations', label: 'Warehouse & Bins', icon: Boxes, category: 'Production & Taxonomy' },
    { id: 'adminMasterData', label: 'Master Data Governance', icon: Database, category: 'Production & Taxonomy' },
    { id: 'adminCompanySettings', label: 'Company Settings', icon: Building2, category: 'Org & Workflow' },
    { id: 'adminPlantSettings', label: 'Plant / Branches', icon: Building2, category: 'Org & Workflow' },
    { id: 'adminUserGroups', label: 'User Groups & Crews', icon: Users, category: 'Org & Workflow' },
    { id: 'adminUsers', label: 'User Directory', icon: Users, category: 'Org & Workflow' },
    { id: 'adminRoles', label: 'RBAC Matrix & Simulator', icon: ShieldCheck, category: 'Org & Workflow' },
    { id: 'adminMultiContextSecurity', label: 'RBAC Security & Multi-Context', icon: ShieldAlert, category: 'Security & Integrations' },
    { id: 'adminApprovalWorkflowConfig', label: 'Approval Workflows', icon: GitFork, category: 'Org & Workflow' },
    { id: 'adminNumbering', label: 'Numbering Series', icon: Hash, category: 'Org & Workflow' },
    { id: 'adminLoginSecurityAudit', label: 'Login & Security Audit', icon: ShieldAlert, category: 'Security & Integrations' },
    { id: 'adminSecurity', label: 'Security & MFA', icon: Lock, category: 'Security & Integrations' },
    { id: 'adminAuditLogs', label: 'System Audit Trail', icon: ShieldAlert, category: 'Security & Integrations' },
    { id: 'adminIntegrationsConfig', label: 'Integration Management', icon: Cpu, category: 'Security & Integrations' },
    { id: 'adminDataImportExport', label: 'Data Import / Export', icon: ArrowUpDown, category: 'Data & Governance' },
    { id: 'adminDocumentSettings', label: 'Document Settings', icon: FileText, category: 'Data & Governance' },
    { id: 'adminBackupRetentionPrivacy', label: 'Backup, Retention & DPDP', icon: Database, category: 'Data & Governance' },
    { id: 'adminLicense', label: 'License & Subscription', icon: KeyRound, category: 'Data & Governance' },
    { id: 'adminQuickActionsConfig', label: 'Quick Actions Config', icon: Zap, category: 'General' },
    { id: 'adminCustomFields', label: 'Parameters & UDF', icon: Sliders, category: 'General' },
    { id: 'adminNotifications', label: 'Notification Rules', icon: Bell, category: 'General' },
  ];

  const categories = ['ALL', 'General', 'Production & Taxonomy', 'Org & Workflow', 'Security & Integrations', 'Data & Governance'];

  const visibleTabs = activeCategory === 'ALL'
    ? allAdminTabs
    : allAdminTabs.filter(t => t.category === activeCategory);

  const renderActiveView = () => {
    switch (currentView) {
      // 25. Global Search
      case 'adminGlobalSearchConfig':
        return <AdminGlobalSearchConfigView onNavigateTab={onNavigate} showToast={showToast} />;

      // Multi-Context RBAC & Security Screen
      case 'adminMultiContextSecurity':
      case 'adminMultiContextRbac':
      case 'adminRbacSecurity':
        return <AdminRbacSecurityMultiContextView showToast={showToast} />;

      // 4. User Groups Screen
      case 'adminUserGroups':
        return <AdminUserGroupsView showToast={showToast} />;

      // 5. Approval Workflow Configuration Screen
      case 'adminApprovalWorkflowConfig':
      case 'adminWorkflowsConfig':
        return <AdminApprovalWorkflowConfigView showToast={showToast} />;

      // 6. Company / Organization Settings Screen
      case 'adminCompanySettings':
      case 'adminOrganizationSettings':
        return <AdminCompanySettingsView showToast={showToast} />;

      // 7. Plant / Branch Settings Screen
      case 'adminPlantSettings':
      case 'adminBranchSettings':
        return <AdminPlantBranchSettingsView showToast={showToast} />;

      // 8. Warehouse and Location Code Settings Screen
      case 'adminWarehouseLocations':
      case 'adminLocationCodes':
        return <AdminWarehouseLocationsView showToast={showToast} />;

      // 9. Machine / Work Center Settings Screen
      case 'adminMachines':
      case 'adminWorkCenters':
      case 'adminMachineSettings':
        return <AdminMachineWorkCentersView showToast={showToast} />;

      // 10. Shift and Working Calendar Settings Screen
      case 'adminShifts':
      case 'adminCalendarSettings':
      case 'adminShiftCalendar':
        return <AdminShiftCalendarView showToast={showToast} />;

      // 11. Reason Code Setup Screen
      case 'adminReasonCodes':
      case 'adminReasonCodeSetup':
        return <AdminReasonCodesView showToast={showToast} />;

      // 13. Master Data Management Screen
      case 'adminMasterData':
      case 'adminMasterDataManagement':
        return <AdminMasterDataView showToast={showToast} />;

      // 16. Document Management Settings Screen
      case 'adminDocumentSettings':
      case 'adminDocumentManagement':
        return <AdminDocumentSettingsView showToast={showToast} />;

      // 18. Login and Security Audit Screen
      case 'adminLoginSecurityAudit':
      case 'adminSecurityAudit':
        return <AdminLoginSecurityAuditView showToast={showToast} />;

      // 19. Integration Management Screen
      case 'adminIntegrationsConfig':
      case 'adminIntegrationManagement':
        return <AdminIntegrationManagementView showToast={showToast} />;

      // 21. Data Import / Export Center Screen
      case 'adminDataImportExport':
      case 'adminImportExportCenter':
        return <AdminDataImportExportView showToast={showToast} />;

      // 22. Backup, Retention, and Data Privacy Screen
      case 'adminBackupRetentionPrivacy':
      case 'adminDataPrivacy':
        return <AdminBackupRetentionPrivacyView showToast={showToast} />;

      // 24. License / Subscription Settings Screen
      case 'adminLicense':
      case 'adminSubscriptionSettings':
        return <AdminLicenseSubscriptionView showToast={showToast} />;

      // Legacy / Existing Admin Views
      case 'adminDashboard':
        return <AdminDashboardView onNavigate={onNavigate} showToast={showToast} />;
      case 'adminUsers':
        return <AdminUsersView showToast={showToast} />;
      case 'adminRoles':
        return <AdminRolesView showToast={showToast} />;
      case 'adminPlants':
        return <AdminCompanyPlantsView showToast={showToast} />;
      case 'adminNumbering':
        return <AdminNumberingView showToast={showToast} />;
      case 'adminWorkflows':
        return <AdminWorkflowsView showToast={showToast} />;
      case 'adminSecurity':
        return <AdminSecurityView showToast={showToast} />;
      case 'adminAuditLogs':
        return <AdminAuditLogsView showToast={showToast} />;
      case 'adminIntegrations':
        return <AdminIntegrationsView showToast={showToast} />;
      case 'adminBackups':
        return <AdminBackupsView showToast={showToast} />;
      case 'adminNotifications':
        return <AdminNotificationsView showToast={showToast} />;
      case 'adminCustomFields':
      case 'adminSystemParameters':
        return <AdminSystemParametersView showToast={showToast} />;
      case 'adminQuickActionsConfig':
        return <AdminQuickActionsConfigView showToast={showToast} />;
      default:
        return <AdminDashboardView onNavigate={onNavigate} showToast={showToast} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Pills & Spotlight Search bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-[#0F8B8D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => onNavigate('adminGlobalSearchConfig')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-[#0F8B8D] text-xs font-bold hover:bg-teal-100 transition-colors w-full sm:w-auto justify-center shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Global Settings Search (Ctrl+K)</span>
        </button>
      </div>

      {/* Horizontal Sub-Navigation Tab Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#0F8B8D] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Sub-view */}
      <div>{renderActiveView()}</div>
    </div>
  );
};
