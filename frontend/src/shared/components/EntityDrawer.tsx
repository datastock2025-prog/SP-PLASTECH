import React, { useEffect } from 'react';
import { X, Check, Save, Trash2, AlertCircle, Loader2 } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface EntityDrawerProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  entityCode?: string;
  statusBadge?: {
    label: string;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  children: React.ReactNode;
  // Footer actions
  onSave?: () => void | Promise<void>;
  isSaving?: boolean;
  saveLabel?: string;
  saveDisabled?: boolean;
  onDelete?: () => void | Promise<void>;
  isDeleting?: boolean;
  deleteLabel?: string;
  customActions?: React.ReactNode;
  footer?: React.ReactNode;
  isDirty?: boolean;
}

const WIDTH_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-full',
};

const STATUS_CLASSES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  info: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export function EntityDrawer<T = any>({
  isOpen,
  onClose,
  title,
  subtitle,
  entityCode,
  statusBadge,
  tabs,
  activeTab,
  onTabChange,
  width = 'lg',
  children,
  onSave,
  isSaving = false,
  saveLabel = 'Save Changes',
  saveDisabled = false,
  onDelete,
  isDeleting = false,
  deleteLabel = 'Delete',
  customActions,
  footer,
  isDirty = false,
}: EntityDrawerProps<T>) {
  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (!isSaving && !isDeleting) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, isDeleting, onClose]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClass = WIDTH_CLASSES[width] || WIDTH_CLASSES.lg;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ease-out"
        onClick={() => {
          if (!isSaving && !isDeleting) onClose();
        }}
      />

      {/* Slide-over Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          className={`w-screen ${widthClass} bg-white dark:bg-slate-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out border-l border-slate-200 dark:border-slate-800`}
        >
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {entityCode && (
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {entityCode}
                    </span>
                  )}
                  {statusBadge && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${
                        STATUS_CLASSES[statusBadge.variant || 'neutral']
                      }`}
                    >
                      {statusBadge.label}
                    </span>
                  )}
                  {isDirty && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Unsaved changes
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                )}
              </div>

              <button
                onClick={onClose}
                disabled={isSaving || isDeleting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                title="Close drawer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            {tabs && tabs.length > 0 && (
              <div className="flex items-center gap-2 mt-4 -mb-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange && onTabChange(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all shrink-0 ${
                        isActive
                          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      {tab.badge !== undefined && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
            {children}
          </div>

          {/* Drawer Footer */}
          {footer ? (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
              {footer}
            </div>
          ) : onSave || onDelete || customActions ? (
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-2">
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting || isSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    {deleteLabel}
                  </button>
                )}
                {customActions}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving || isDeleting}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>

                {onSave && (
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving || saveDisabled}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {saveLabel}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
