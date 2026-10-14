export type SecurityClassification = 'Standard' | 'Elevated' | 'Restricted / Sovereign';

export type GovernanceStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'RESTRICTED';

export interface QuarantinedScreenRecord {
  id: string;
  title: string;
  view: string;
  groupId: string;
  groupTitle: string;
  subGroup?: string;
  route: string;
  status: GovernanceStatus;
  detectedAt: string;
  detectedTrigger: string;
  securityLevel: SecurityClassification;
  description: string;
  allowedRoles: string[];
  showInSidebarForRoles?: string[];
  showInWorkspaceForRoles?: string[];
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface ScreenApprovalAuditEntry {
  id: string;
  screenId: string;
  screenTitle: string;
  action: 'APPROVED' | 'REJECTED' | 'RESTRICTED' | 'ROLES_UPDATED' | 'REGISTERED' | 'SYNCED' | 'SIDEBAR_UPDATED' | 'WORKSPACE_UPDATED';
  performedBy: string;
  timestamp: string;
  details: string;
}

export interface WorkspaceRbacConfig {
  strictZeroTrustQuarantine: boolean;
  notifyAdminsOnNewRoute: boolean;
  defaultApprovalVisibility: 'ADMINS_ONLY' | 'ALL_ROLES' | 'CUSTOM_SELECTION';
  autoSyncDiscoveredScreens: boolean;
  linkSidebarWithWorkspaceByDefault: boolean;
}

export interface ScreenSyncReport {
  totalDiscovered: number;
  newScreensCount: number;
  updatedCount: number;
  quarantinedCount: number;
  lastSyncTime: string;
  screens: Array<{
    id: string;
    view: string;
    title: string;
    groupId: string;
    groupTitle: string;
    subGroup?: string;
    isQuarantined: boolean;
    route: string;
  }>;
}
