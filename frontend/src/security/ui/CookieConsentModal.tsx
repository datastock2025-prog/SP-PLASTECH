import React, { useEffect, useState } from 'react';
import { GdprService } from '../compliance/GdprService';
import { Shield, Settings, Check, X } from 'lucide-react';

export const CookieConsentModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [functional, setFunctional] = useState(true);

  useEffect(() => {
    const existing = GdprService.getConsent();
    if (!existing) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    GdprService.saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    });
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    GdprService.saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    GdprService.saveConsent({
      essential: true,
      analytics,
      marketing,
      functional,
    });
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside aria-label="Cookie consent banner" className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-lg z-50 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-slate-100 animate-slideUp">
      <div className="flex items-start gap-3.5 mb-3">
        <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100">Cookie & Privacy Preferences</h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            We use essential cookies to maintain secure sessions and strictly protected telemetry for tenant isolation and audit logging.
          </p>
        </div>
      </div>

      {showPreferences && (
        <div className="my-4 space-y-2.5 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200">Strictly Essential Cookies</span>
              <p className="text-[11px] text-slate-500">Required for authentication, CSRF & RBAC</p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
              ALWAYS ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div>
              <span className="font-semibold text-slate-200">Functional State Cookies</span>
              <p className="text-[11px] text-slate-500">Remember grid filters & tenant state</p>
            </div>
            <input
              type="checkbox"
              checked={functional}
              onChange={(e) => setFunctional(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div>
              <span className="font-semibold text-slate-200">Security Telemetry & Analytics</span>
              <p className="text-[11px] text-slate-500">Anonymous performance & intrusion telemetry</p>
            </div>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={() => setShowPreferences(!showPreferences)}
          className="text-xs text-slate-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          {showPreferences ? 'Hide Preferences' : 'Customize Settings'}
        </button>

        <div className="flex items-center gap-2">
          {showPreferences ? (
            <button
              type="button"
              onClick={handleSaveCustom}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Save Choices
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20"
              >
                Accept All
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
