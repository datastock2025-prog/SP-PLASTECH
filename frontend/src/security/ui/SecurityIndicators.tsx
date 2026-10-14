import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { sessionManager } from '../auth/SessionManager';
import { useTenant } from '../rbac/TenantContext';
import { AuthSession } from '../types';
import {
  ShieldCheck,
  Lock,
  Clock,
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  X,
  Building2,
} from 'lucide-react';

export const SecurityIndicators: React.FC = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const [remainingTimeFormatted, setRemainingTimeFormatted] = useState('15:00');
  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [activeSessions, setActiveSessions] = useState<AuthSession[]>([]);

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const remainingSecs = sessionManager.getRemainingSeconds();
      const mins = Math.floor(remainingSecs / 60);
      const secs = remainingSecs % 60;
      setRemainingTimeFormatted(
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const openSessionsModal = () => {
    setActiveSessions(sessionManager.getActiveSessions());
    setSessionsModalOpen(true);
  };

  const handleRevokeSession = (sessionId: string) => {
    sessionManager.revokeSession(sessionId);
    setActiveSessions(sessionManager.getActiveSessions());
  };

  const handleRevokeAllOther = () => {
    sessionManager.revokeAllOtherSessions();
    setActiveSessions(sessionManager.getActiveSessions());
  };

  return (
    <>
      {/* Top/Header Security Indicators Bar */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        {/* Session Inactivity Countdown & Modal Trigger */}
        <button
          type="button"
          onClick={openSessionsModal}
          title="Click to view & manage active device sessions"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
        >
          <Clock className="w-3 h-3 text-amber-600" />
          <span className="font-mono text-[11px] font-bold text-amber-600">{remainingTimeFormatted}</span>
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 ml-0.5" />
        </button>
      </div>

      {/* Active Sessions Management Modal */}
      {sessionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Security & Active Sessions</h3>
                  <p className="text-xs text-slate-400">
                    Logged in as <span className="text-slate-200 font-semibold">{user?.email || 'admin@datastock.corp'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSessionsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Session List */}
            <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-1">
              {activeSessions.map((sess) => (
                <div
                  key={sess.sessionId}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                    sess.isCurrent
                      ? 'bg-indigo-950/20 border-indigo-500/40'
                      : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2 rounded-lg ${
                        sess.isCurrent
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {sess.deviceInfo.toLowerCase().includes('phone') || sess.deviceInfo.toLowerCase().includes('ios') ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-200">
                          {sess.deviceInfo}
                        </span>
                        {sess.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Current Device
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Globe className="w-3 h-3 text-slate-500" />
                          {sess.ipAddress}
                        </span>
                        <span>•</span>
                        <span>{sess.location}</span>
                        <span>•</span>
                        <span>Last active: {new Date(sess.lastActiveAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(sess.sessionId)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Revoke Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleRevokeAllOther}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Revoke All Other Sessions
              </button>

              <button
                type="button"
                onClick={() => setSessionsModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
