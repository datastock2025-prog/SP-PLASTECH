import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { AdminTransportMasterView } from './admin/AdminTransportMasterView';
import { Truck } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

  const allAdminTabs = [
    { id: 'adminGlobalSearchConfig', label: 'Global Config Search', icon: Search, category: 'General' },
    { id: 'adminDashboard', label: 'Overview & Health', icon: LayoutDashboard, category: 'General' },
    { id: 'adminReasonCodes', label: 'Reason Code Setup', icon: AlertOctagon, category: 'Production & Taxonomy' },
    { id: 'adminMachines', label: 'Machine / Work Centers', icon: Cpu, category: 'Production & Taxonomy' },
    { id: 'adminShifts', label: 'Shift & Calendar', icon: Calendar, category: 'Production & Taxonomy' },
    { id: 'itemList', label: 'Item Master Catalog', icon: Boxes, category: 'Production & Taxonomy' },
    { id: 'adminWarehouseLocations', label: 'Warehouse & Bins', icon: Boxes, category: 'Production & Taxonomy' },
    { id: 'adminMasterData', label: 'Master Data Governance', icon: Database, category: 'Production & Taxonomy' },
    { id: 'adminTransportMaster', label: 'Transporter Master (Fleet)', icon: Truck, category: 'Production & Taxonomy' },
    { id: 'adminCompanySettings', label: 'Company Settings', icon: Building2, category: 'Org & Workflow' },
    { id: 'adminPlantSettings', label: 'Plant / Branches', icon: Building2, category: 'Org & Workflow' },
    { id: 'adminUserGroups', label: 'User Groups & Crews', icon: Users, category: 'Org & Workflow' },
    { id: 'adminUsers', label: 'User Directory', icon: Users, category: 'Org & Workflow' },
    { id: 'adminRoles', label: 'RBAC Matrix & Simulator', icon: ShieldCheck, category: 'Org & Workflow' },
    { id: 'adminWorkspaceRbac', label: 'Workspace RBAC & Screen Approvals', icon: Sliders, category: 'Org & Workflow' },
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

  const categoryTabs = activeCategory === 'ALL'
    ? allAdminTabs
    : allAdminTabs.filter(t => t.category === activeCategory);
  const visibleTabs = categoryTabs.filter((tab) =>
    tab.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );
  const activeTab = allAdminTabs.find((tab) => tab.id === currentView)
    ?? allAdminTabs.find((tab) => tab.id === 'adminDashboard');

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
        return <AdminCompanySettingsView onNavigate={onNavigate} showToast={showToast} />;

      // 7. Plant / Branch Settings Screen
      case 'adminPlantSettings':
      case 'adminBranchSettings':
        return <AdminPlantBranchSettingsView onNavigate={onNavigate} showToast={showToast} />;

      // 8. Warehouse and Location Code Settings Screen
      case 'adminWarehouseLocations':
      case 'adminLocationCodes':
        return <AdminWarehouseLocationsView showToast={showToast} />;

      // 9. Machine / Work Center Settings Screen
      case 'adminMachines':
      case 'adminWorkCenters':
      case 'adminMachineSettings':
        return <AdminMasterDataView showToast={showToast} />;

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

      // Transporter Master Directory
      case 'adminTransportMaster':
      case 'adminTransporters':
      case 'adminTransporterMaster':
        return <AdminTransportMasterView showToast={showToast} />;

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
        return <AdminRolesView showToast={showToast} onNavigate={onNavigate} />;
      case 'adminWorkspaceRbac':
      case 'adminWorkspaceVisibility':
        return <AdminRolesView showToast={showToast} initialTab="workspace_access" onNavigate={onNavigate} />;
      case 'adminPlants':
      case 'adminPlantBranches':
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
    <section className="space-y-4" aria-label="Administration">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#0F8B8D]">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Administration
          </div>
          <h1 className="text-xl font-bold text-slate-900">Workspace settings</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Manage people, workflows, security, and system configuration.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => onNavigate('adminGlobalSearchConfig')}
          className="w-full shrink-0 border-teal-200 text-[#0F8B8D] hover:bg-teal-50 sm:w-auto"
        >
          <Search aria-hidden="true" />
          Global settings search
          <span className="ml-2 hidden rounded border border-current/20 px-1.5 py-0.5 text-[10px] font-medium sm:inline">Ctrl K</span>
        </Button>
      </header>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <aside className="min-w-0" aria-label="Administration navigation">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Find a setting</span>
              <span className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-2.5 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/15">
                <Search className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search settings"
                  aria-label="Search administration settings"
                  className="h-full border-0 bg-transparent px-0 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0"
                />
              </span>
            </label>

            <nav className="hidden space-y-1 border-t border-slate-100 pt-3 lg:block" aria-label="Setting categories">
              {categories.map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={activeCategory === category ? 'secondary' : 'ghost'}
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={`h-8 w-full justify-between px-2.5 text-left text-xs ${
                    activeCategory === category
                      ? 'bg-teal-50 font-semibold text-[#0F8B8D] hover:bg-teal-50'
                      : 'text-slate-600'
                  }`}
                >
                  <span className="truncate">{category === 'ALL' ? 'All settings' : category}</span>
                  <span className="ml-2 text-[10px] text-slate-400">
                    {category === 'ALL'
                      ? allAdminTabs.length
                      : allAdminTabs.filter((tab) => tab.category === category).length}
                  </span>
                </Button>
              ))}
            </nav>

            <div className="flex gap-1 overflow-x-auto border-t border-slate-100 pt-3 pb-1 lg:hidden" aria-label="Setting categories">
              {categories.map((category) => (
                <Button
                  key={category}
                  type="button"
                  size="sm"
                  variant={activeCategory === category ? 'secondary' : 'ghost'}
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={`h-7 shrink-0 px-2.5 text-xs ${
                    activeCategory === category
                      ? 'bg-teal-50 font-semibold text-[#0F8B8D] hover:bg-teal-50'
                      : 'text-slate-600'
                  }`}
                >
                  {category === 'ALL' ? 'All' : category}
                </Button>
              ))}
            </div>

            <div className="hidden max-h-[min(60vh,38rem)] space-y-1 overflow-y-auto border-t border-slate-100 pt-3 lg:block">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentView === tab.id;

                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant={isActive ? 'secondary' : 'ghost'}
                    onClick={() => onNavigate(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`h-auto min-h-9 w-full justify-start gap-2 whitespace-normal px-2.5 py-2 text-left text-xs ${
                      isActive
                        ? 'bg-[#0F8B8D] font-semibold text-white hover:bg-[#0c7274] hover:text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1">{tab.label}</span>
                  </Button>
                );
              })}
              {visibleTabs.length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-slate-500">No settings match this search.</p>
              )}
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {activeTab?.category ?? 'Administration'}
              </p>
              <h2 className="truncate text-base font-semibold text-slate-900">{activeTab?.label ?? 'Settings'}</h2>
            </div>
            <Badge variant="outline" className="hidden shrink-0 border-slate-200 text-slate-500 sm:inline-flex">
              {allAdminTabs.length} settings
            </Badge>
          </div>

          <Select value={currentView} onValueChange={(view) => onNavigate(view)}>
            <SelectTrigger className="h-10 w-full border-slate-200 bg-white lg:hidden" aria-label="Choose administration screen">
              <SelectValue placeholder="Choose a setting" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[min(60vh,24rem)]">
              {visibleTabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.label}
                </SelectItem>
              ))}
              {visibleTabs.length === 0 && (
                <SelectItem value="no-settings" disabled>No settings match this search</SelectItem>
              )}
            </SelectContent>
          </Select>

          <div className="min-w-0">{renderActiveView()}</div>
        </main>
      </div>
    </section>
  );
};
