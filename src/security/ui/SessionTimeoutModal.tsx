import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { sessionManager } from '../auth/SessionManager';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

export const SessionTimeoutModal: React.FC = () => {
  const { logout, refreshSessionToken, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false);
      return;
    }

    const unsubscribeWarn = sessionManager.onWarning((seconds) => {
      setSecondsRemaining(seconds);
      setIsOpen(true);
    });

    const unsubscribeTimeout = sessionManager.onTimeout(() => {
      setIsOpen(false);
      logout('SESSION_EXPIRED');
    });

    return () => {
      unsubscribeWarn();
      unsubscribeTimeout();
    };
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleExtend = async () => {
    sessionManager.recordActivity();
    await refreshSessionToken();
    setIsOpen(false);
  };

  const handleLogoutNow = () => {
    setIsOpen(false);
    logout('USER_LOGOUT');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Ambient warning halo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Session Inactivity Warning</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Your ERP session is about to expire due to inactivity.
            </p>
          </div>
        </div>

        {/* Circular / Large countdown display */}
        <div className="my-6 flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800 rounded-xl p-5">
          <Clock className="w-8 h-8 text-amber-400 mb-2 animate-pulse" />
          <div className="text-4xl font-extrabold font-mono tracking-wider text-amber-400">
            00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
          </div>
          <span className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            Seconds remaining
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-6 text-center leading-relaxed">
          For your security and compliance with enterprise data policies, inactive sessions are automatically terminated.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogoutNow}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            Logout Now
          </button>
          <button
            type="button"
            onClick={handleExtend}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            Keep Session Active
          </button>
        </div>
      </div>
    </div>
  );
};
