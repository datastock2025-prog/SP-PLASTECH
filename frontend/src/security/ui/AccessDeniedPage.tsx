import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, HelpCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

interface AccessDeniedPageProps {
  requiredPermission?: string;
  requiredRole?: string;
  onNavigateHome?: () => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  requiredPermission,
  requiredRole,
  onNavigateHome,
}) => {
  const { user } = useAuth();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
            HTTP 403 &middot; Access Denied
          </span>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-2">
            Insufficient Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            You do not have the required role or authorization level to access this confidential ERP module.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left space-y-1.5 font-mono">
          <div className="flex justify-between text-slate-500">
            <span>Current Role:</span>
            <strong className="text-slate-800">{user?.role || 'Unauthenticated'}</strong>
          </div>
          {requiredPermission && (
            <div className="flex justify-between text-rose-700">
              <span>Required Permission:</span>
              <strong className="font-bold">{requiredPermission}</strong>
            </div>
          )}
          {requiredRole && (
            <div className="flex justify-between text-rose-700">
              <span>Required Role:</span>
              <strong className="font-bold">{requiredRole}</strong>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-[#14213D] hover:bg-[#1f3158] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Workspace
            </button>
          )}
          <a
            href="mailto:security-admin@rebooterp.com?subject=Access%20Request"
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Request Access
          </a>
        </div>
      </div>
    </div>
  );
};
