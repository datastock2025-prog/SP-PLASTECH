import React from 'react';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  RotateCcw,
  Layers,
  Users,
  AlertTriangle,
  ChevronRight,
  Home,
} from 'lucide-react';
import { AuthUser } from '../../types';
import { WORKSPACE_ROLES, normalizeRoleKey } from '../../services/workspaceRbacService';
import { ROLE_DEFAULT_VIEW } from '../../data/roleDefaultViews';
import { NAVIGATION_GROUPS } from '../../data/sidebarNavigationData';

interface UnauthorizedScreenProps {
  currentView: string;
  currentUser: AuthUser | null;
  onNavigate: (view: string, param?: any) => void;
  onSwitchUser?: () => void;
}

export const UnauthorizedScreen: React.FC<UnauthorizedScreenProps> = ({
  currentView,
  currentUser,
  onNavigate,
  onSwitchUser,
}) => {
  const canonicalRole = normalizeRoleKey(currentUser?.role || currentUser?.roleType);
  const currentRoleDef = WORKSPACE_ROLES.find((r) => r.id === canonicalRole);

  // Find screen title from NAVIGATION_GROUPS
  let screenTitle = currentView;
  let screenGroup = 'System Module';
  for (const group of NAVIGATION_GROUPS) {
    const item = group.items.find((it) => it.view === currentView);
    if (item) {
      screenTitle = item.label;
      screenGroup = group.title;
      break;
    }
  }

  // Find which roles ARE permitted for this screen
  const permittedRoles = WORKSPACE_ROLES.filter((role) => {
    if (role.id === 'admin') return true;
    // Check if role is authorized
    const roleMap: Record<string, string[]> = {
      operator: ['shopFloor', 'woList', 'prodEntryGrid', 'scrapDowntime', 'changeover', 'materialIssuing', 'barcodePrinting', 'wipOperations'],
      planner: ['jitBoard', 'woList', 'prodEntryGrid', 'createWoGrid', 'mrpRun', 'procurementMrp', 'bomList', 'bomBuilder', 'bomVersions', 'itemList', 'stockList', 'scmDemandPlanning', 'scmSOP', 'salesForecast'],
      plant_manager: ['jitBoard', 'woList', 'mfgDash', 'oeeDash', 'scrapDowntime', 'genealogy', 'traceabilityQR', 'stockList', 'qualityDash', 'ncrList', 'capaList', 'mepDash', 'machineList', 'toolMolds', 'hrShiftRoster', 'analyticsDash', 'maintenanceReports', 'wipOperations'],
      warehouse: ['stockList', 'grnList', 'putaway', 'picking', 'stockTransfer', 'cycleCount', 'quarantine', 'barcodePrinting', 'subcontractList', 'itemList', 'scmReplenishment', 'deliverySchedule', 'gatePass', 'wipOperations'],
      quality: ['qualityDash', 'inspectionPlanList', 'ncrList', 'capaList', 'qcoaList', 'qualityHolds', 'sqaAuditList', 'spcMonitor', 'labEquipmentList', 'qualityReports', 'traceabilityQR', 'genealogy', 'wipOperations'],
      maintenance: ['mepDash', 'machineList', 'toolMolds', 'pmSchedules', 'sparesInventory', 'calibrationTracker', 'energyTelemetry', 'maintenanceReports', 'scrapDowntime'],
      finance: ['financeDash', 'unifiedLedger', 'coaList', 'jeList', 'apDash', 'arDash', 'billingStatus', 'paymentRun', 'productCosting', 'budgetList', 'finReports', 'assetRegister', 'taxWorkbench', 'creditControl', 'pricingMgmt'],
      hr: ['hrCommandCenter', 'hrEmployeeList', 'hrAttendance', 'hrShiftRoster', 'hrLeaveOvertime', 'hrSkillsTraining', 'hrSafetyPpe', 'hrPayroll', 'hrCompliance', 'hrReports'],
      sales: ['salesDash', 'quoteList', 'soList', 'monthlyPlanOrders', 'monthlyReconciliation', 'deliverySchedule', 'gatePass', 'eWayBillMgmt', 'complianceDashboard', 'rmaList', 'pricingMgmt', 'creditControl', 'customerList', 'contractList', 'orderTracking', 'backorderMgmt', 'crmLeads', 'crmOpportunities', 'crmAccounts', 'crmContacts', 'crmFeedback'],
      procurement: ['supplierList', 'purchaseReqList', 'rfqList', 'rfqCompare', 'poList', 'poApprovals', 'grnList', 'purchaseReturns', 'supplierScorecard', 'supplierRisk', 'supplierContracts', 'supplierPriceList', 'itemList', 'procurementMrp'],
      scm: ['scmControlTower', 'scmReplenishment', 'scmInboundLogistics', 'scmOutboundLogistics', 'scmSupplierCollaboration', 'scmTrackTrace', 'scmSupplierRisk', 'scmDemandPlanning', 'scmSOP', 'scmInventoryAging', 'scmReports', 'scmSustainability', 'stockTransfer'],
    };
    return roleMap[role.id]?.includes(currentView);
  });

  const defaultUserLanding = ROLE_DEFAULT_VIEW[canonicalRole] || 'home';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-rose-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-[#14213D] text-white p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
              <ShieldAlert className="w-6 h-6 text-rose-200" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/40 text-white font-bold border border-rose-400/40">
                HTTP 403 &bull; Authorization Gate
              </span>
              <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
                Access Restricted: Role Unauthorized
              </h2>
            </div>
          </div>
          <p className="text-xs text-rose-100/90 leading-relaxed mt-1">
            Zero-Trust Industrial RBAC has blocked access to this screen based on your active security role.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Target Screen vs Current User Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10.5px] uppercase font-semibold text-slate-500 mb-1">
                Requested Module
              </div>
              <div className="font-bold text-slate-900 text-sm">{screenTitle}</div>
              <div className="text-xs text-slate-500 mt-0.5">Category: {screenGroup}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="text-[10.5px] uppercase font-semibold text-amber-800 mb-1">
                Active User & Role
              </div>
              <div className="font-bold text-slate-900 text-sm truncate">
                {currentUser?.name || 'Current User'}
              </div>
              <div className="text-xs text-amber-700 font-medium truncate mt-0.5">
                {currentUser?.role || currentRoleDef?.name || 'Assigned Role'}
              </div>
            </div>
          </div>

          {/* Permitted Roles Pill List */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Roles authorized to access this module:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {permittedRoles.length > 0 ? (
                permittedRoles.map((r) => (
                  <span
                    key={r.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium"
                  >
                    {r.name}
                  </span>
                ))
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                  Admin / Plant Operations Director Only
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate(defaultUserLanding)}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#0F8B8D] hover:bg-[#0D7A7C] text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return to My Role Dashboard</span>
            </button>

            {onSwitchUser && (
              <button
                type="button"
                onClick={onSwitchUser}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Switch Role / Re-login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
