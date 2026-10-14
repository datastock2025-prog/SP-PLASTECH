import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from '../../components/Topbar';
import { Sidebar } from '../../components/Sidebar';
import { Drawer } from '../../components/Drawer';
import { ConfirmModal } from '../../components/ConfirmModal';
import { QuickActionModal } from '../../components/common/QuickActionModal';
import { RequireAuth } from '../components/RequireAuth';
import { useUiStore } from '../stores/uiStore';
import { AuthUser } from '../../types';

interface AppLayoutProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onSwitchUser?: () => void;
  onRoleChange?: (role: string) => void;
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
  breadcrumbs: string[];
  children?: React.ReactNode;
  activeWOCount?: number;
  lowStockCount?: number;
  openPOCount?: number;
}

/**
 * Protected Layout Wrapper
 * Houses enterprise ERP navigation shell (Topbar, Sidebar, Modals, Drawers)
 * Role-protected via RequireAuth.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  onRoleChange,
  currentView,
  onNavigate,
  breadcrumbs,
  children,
  activeWOCount = 5,
  lowStockCount = 3,
  openPOCount = 2,
}) => {
  const {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    searchQuery,
    setSearchQuery,
    isQuickActionOpen,
    setQuickActionOpen,
    drawerState,
    closeDrawer,
    confirmModalState,
    closeConfirmModal,
    toastMessage,
    showToast,
  } = useUiStore();

  return (
    <RequireAuth
      currentUser={currentUser}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F6F4EF] p-4 text-center">
          <div className="bg-white p-6 rounded-xl border border-[#E4E0D6] shadow-sm max-w-md">
            <h2 className="text-lg font-bold text-[#14213D] mb-2">Authentication Required</h2>
            <p className="text-xs text-slate-500 mb-4">Please log in with your plant operator credentials to access SP-PLASTECH ERP.</p>
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 bg-[#E8622C] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#D45320]"
            >
              Go to Login
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen flex flex-col bg-[#F6F4EF] text-[#14213D] font-sans antialiased selection:bg-[#E8622C] selection:text-white">
        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="bg-[#14213D] text-white px-4 py-2.5 rounded-lg shadow-xl border border-white/10 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Global Topbar */}
        <Topbar
          breadcrumbs={breadcrumbs}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentView={currentView}
          onNavigate={onNavigate}
          openArchitectureGuide={() => onNavigate('architectureGuide')}
          currentUser={currentUser}
          onLogout={onLogout}
          onSwitchUser={onSwitchUser}
          onRoleChange={onRoleChange}
          showToast={showToast}
        />

        {/* Main Shell with Sidebar and Viewport */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            currentView={currentView}
            onNavigate={onNavigate}
            openArchitectureGuide={() => onNavigate('architectureGuide')}
            currentUser={currentUser}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            activeWOCount={activeWOCount}
            lowStockCount={lowStockCount}
            openPOCount={openPOCount}
          />

          <main
            id="main-content"
            tabIndex={-1}
            className={`flex-1 overflow-y-auto outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0F8B8D] p-4 lg:p-6 transition-all duration-300 ${
              isSidebarCollapsed ? 'ml-0 md:ml-16' : 'ml-0 md:ml-64'
            }`}
          >
            {children || <Outlet />}
          </main>
        </div>

        {/* Ephemeral Drawers & Modals Managed Globally */}
        <Drawer
          isOpen={drawerState.isOpen}
          onClose={closeDrawer}
          title={drawerState.title}
        >
          {drawerState.content}
        </Drawer>

        <ConfirmModal
          isOpen={confirmModalState.isOpen}
          onClose={closeConfirmModal}
          onConfirm={confirmModalState.onConfirm}
          title={confirmModalState.title}
          message={confirmModalState.message}
          confirmLabel={confirmModalState.confirmLabel}
          isDanger={confirmModalState.variant === 'danger'}
        />

        {isQuickActionOpen && (
          <QuickActionModal
            isOpen={isQuickActionOpen}
            onClose={() => setQuickActionOpen(false)}
            action={null}
            onSuccess={(msg) => {
              setQuickActionOpen(false);
              showToast(msg);
            }}
            currentUser={currentUser}
          />
        )}
      </div>
    </RequireAuth>
  );
};

export default AppLayout;
