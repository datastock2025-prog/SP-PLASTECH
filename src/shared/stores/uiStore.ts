import React from 'react';
import { create } from 'zustand';

export interface DrawerState {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  content: React.ReactNode | null;
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

interface UiState {
  // Navigation & Layout
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  activePlant: string;
  activeShift: string;
  theme: 'light' | 'dark';
  searchQuery: string;

  // Modals & Panels
  isQuickActionOpen: boolean;
  drawerState: DrawerState;
  confirmModalState: ConfirmModalState;
  toastMessage: string | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setActivePlant: (plant: string) => void;
  setActiveShift: (shift: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSearchQuery: (query: string) => void;

  setQuickActionOpen: (open: boolean) => void;
  openDrawer: (drawer: Omit<DrawerState, 'isOpen'>) => void;
  closeDrawer: () => void;
  openConfirmModal: (modal: Omit<ConfirmModalState, 'isOpen'>) => void;
  closeConfirmModal: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
  activePlant: 'Unit 1: Blow & Injection Molding',
  activeShift: 'Shift A (06:00 - 14:00)',
  theme: 'light',
  searchQuery: '',

  isQuickActionOpen: false,
  drawerState: {
    isOpen: false,
    title: '',
    content: null,
  },
  confirmModalState: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  },
  toastMessage: null,

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
  setActivePlant: (plant) => set({ activePlant: plant }),
  setActiveShift: (shift) => set({ activeShift: shift }),
  setTheme: (theme) => set({ theme }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  setQuickActionOpen: (open) => set({ isQuickActionOpen: open }),
  openDrawer: (drawer) => set({ drawerState: { ...drawer, isOpen: true } }),
  closeDrawer: () => set((state) => ({ drawerState: { ...state.drawerState, isOpen: false, content: null } })),
  openConfirmModal: (modal) => set({ confirmModalState: { ...modal, isOpen: true } }),
  closeConfirmModal: () => set((state) => ({ confirmModalState: { ...state.confirmModalState, isOpen: false } })),
  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => {
      set((state) => (state.toastMessage === message ? { toastMessage: null } : {}));
    }, 3500);
  },
  clearToast: () => set({ toastMessage: null }),
}));
