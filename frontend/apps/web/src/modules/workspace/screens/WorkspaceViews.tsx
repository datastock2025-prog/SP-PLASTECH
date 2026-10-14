import React from 'react';
import { HomeView } from '../components/HomeView';
import {
  WorkspaceTasksView,
  WorkspaceApprovalsView,
  WorkspaceNotificationsView,
  WorkspaceSavedViewsView,
  WorkspaceRecentRecordsView,
} from '../components/WorkspaceHomeTools';

interface WorkspaceViewsProps {
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
  openArchitectureGuide?: () => void;
  showToast?: (msg: string) => void;
  activeWOCount?: number;
  lowStockCount?: number;
  openPOCount?: number;
  currentUser?: any;
}

export const WorkspaceViews: React.FC<WorkspaceViewsProps> = ({
  currentView,
  onNavigate,
  openArchitectureGuide,
  showToast,
  activeWOCount = 0,
  lowStockCount = 0,
  openPOCount = 0,
  currentUser = null,
}) => {
  switch (currentView) {
    case 'tasks':
      return <WorkspaceTasksView onNavigate={onNavigate} showToast={showToast} />;
    case 'approvals':
      return <WorkspaceApprovalsView onNavigate={onNavigate} showToast={showToast} />;
    case 'notifications':
      return <WorkspaceNotificationsView onNavigate={onNavigate} showToast={showToast} />;
    case 'savedViews':
      return <WorkspaceSavedViewsView onNavigate={onNavigate} showToast={showToast} />;
    case 'recentRecords':
      return <WorkspaceRecentRecordsView onNavigate={onNavigate} showToast={showToast} />;
    case 'home':
    default:
      return (
        <HomeView
          onNavigate={onNavigate}
          openArchitectureGuide={openArchitectureGuide}
          activeWOCount={activeWOCount}
          lowStockCount={lowStockCount}
          openPOCount={openPOCount}
          currentUser={currentUser}
        />
      );
  }
};
