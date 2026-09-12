import { useState, useEffect } from 'react';
import {
  workspaceRbacService,
  WORKSPACE_ROLES,
  normalizeRoleKey,
} from '../services/workspaceRbacService';
import { QuarantinedScreenRecord, ScreenSyncReport } from '../types/workspaceRbac';

export function useWorkspaceRbac() {
  const [, setTick] = useState(0);

  useEffect(() => {
    // Subscribe to changes in the RBAC service
    const unsubscribe = workspaceRbacService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  return {
    roles: WORKSPACE_ROLES,
    normalizeRoleKey,
    visibilityMatrix: workspaceRbacService.getVisibilityMatrix(),
    workspaceMatrix: workspaceRbacService.getWorkspaceMatrix(),
    sidebarMatrix: workspaceRbacService.getSidebarMatrix(),
    quarantinedScreens: workspaceRbacService.getQuarantinedScreens(),
    pendingCount: workspaceRbacService.getPendingCount(),
    auditLog: workspaceRbacService.getAuditLog(),
    config: workspaceRbacService.getConfig(),
    syncReport: workspaceRbacService.getSyncReport(),

    // Screen visibility checks
    isScreenVisible: (roleId: string, screenView: string) =>
      workspaceRbacService.isScreenVisible(roleId, screenView),
    isWorkspaceVisible: (roleId: string, screenView: string) =>
      workspaceRbacService.isWorkspaceVisible(roleId, screenView),
    isSidebarVisible: (roleId: string, screenView: string) =>
      workspaceRbacService.isSidebarVisible(roleId, screenView),

    // Toggles
    setScreenVisibility: (roleId: string, screenView: string, isVisible: boolean) =>
      workspaceRbacService.setScreenVisibility(roleId, screenView, isVisible),
    setWorkspaceVisibility: (roleId: string, screenView: string, isVisible: boolean) =>
      workspaceRbacService.setWorkspaceVisibility(roleId, screenView, isVisible),
    setSidebarVisibility: (roleId: string, screenView: string, isVisible: boolean) =>
      workspaceRbacService.setSidebarVisibility(roleId, screenView, isVisible),
    setDualVisibility: (roleId: string, screenView: string, inWorkspace: boolean, inSidebar: boolean) =>
      workspaceRbacService.setDualVisibility(roleId, screenView, inWorkspace, inSidebar),

    // Bulk actions
    bulkSetScreens: (roleId: string, screenViews: string[], isVisible: boolean) =>
      workspaceRbacService.bulkSetScreens(roleId, screenViews, isVisible),
    bulkSetWorkspace: (roleId: string, screenViews: string[], isVisible: boolean) =>
      workspaceRbacService.bulkSetWorkspace(roleId, screenViews, isVisible),
    bulkSetSidebar: (roleId: string, screenViews: string[], isVisible: boolean) =>
      workspaceRbacService.bulkSetSidebar(roleId, screenViews, isVisible),
    bulkSetDual: (roleId: string, screenViews: string[], inWorkspace: boolean, inSidebar: boolean) =>
      workspaceRbacService.bulkSetDual(roleId, screenViews, inWorkspace, inSidebar),

    // Syncing between Home and Sidebar
    syncSidebarToWorkspace: (roleId: string) =>
      workspaceRbacService.syncSidebarToWorkspace(roleId),
    syncWorkspaceToSidebar: (roleId: string) =>
      workspaceRbacService.syncWorkspaceToSidebar(roleId),

    // Auto-Discovery & Sync Engine
    syncAndDiscoverScreens: (triggerSource?: string) =>
      workspaceRbacService.syncAndDiscoverScreens(triggerSource),

    // Preset management
    resetRoleToDefaults: (roleId: string) =>
      workspaceRbacService.resetRoleToDefaults(roleId),
    copyRolePermissions: (srcRole: string, tgtRole: string) =>
      workspaceRbacService.copyRolePermissions(srcRole, tgtRole),

    // Quarantined approval flow
    approveQuarantinedScreen: (
      screenId: string,
      allowedRoles: string[],
      options?: {
        showInSidebarRoles?: string[];
        showInWorkspaceRoles?: string[];
        approvedBy?: string;
      }
    ) => workspaceRbacService.approveQuarantinedScreen(screenId, allowedRoles, options),
    rejectQuarantinedScreen: (screenId: string, reason?: string, rejectedBy?: string) =>
      workspaceRbacService.rejectQuarantinedScreen(screenId, reason, rejectedBy),
    registerNewScreen: (data: Parameters<typeof workspaceRbacService.registerNewScreen>[0]) =>
      workspaceRbacService.registerNewScreen(data),
    updateConfig: (newConfig: Partial<Parameters<typeof workspaceRbacService.updateConfig>[0]>) =>
      workspaceRbacService.updateConfig(newConfig),
  };
}
