import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SecurityEventLogger } from './SecurityEventLogger';
import { ShieldAlert, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  incidentId: string | null;
  errorMessage: string | null;
  copied: boolean;
  showDetails: boolean;
}

export class SecurityErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    incidentId: null,
    errorMessage: null,
    copied: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const incidentId = `INC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return {
      hasError: true,
      incidentId,
      errorMessage: error?.message || 'An unexpected client-side error occurred.',
      copied: false,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const incidentId = this.state.incidentId || 'INC-UNKNOWN';

    // Log the error securely to the event log without leaking secrets on UI
    SecurityEventLogger.log(
      'UNHANDLED_REACT_EXCEPTION',
      {
        incidentId,
        message: error.message,
        componentStack: errorInfo.componentStack,
      },
      'CRITICAL'
    );

    console.error(`[Security Incident: ${incidentId}]`, error);
  }

  private handleCopyIncidentId = () => {
    if (this.state.incidentId) {
      navigator.clipboard.writeText(this.state.incidentId);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndRecover = () => {
    try {
      localStorage.removeItem('reboot_erp_item_draft_auto');
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = window.location.origin;
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
            {/* Ambient Security Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 mb-6 border border-rose-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
              Application Security Notice
            </h1>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              An unexpected system anomaly was intercepted and neutralized to safeguard your session data and active tenant state.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-4 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Incident Reference ID</span>
                <button
                  type="button"
                  onClick={this.handleCopyIncidentId}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-sm font-semibold text-rose-400 mt-1 tracking-wider select-all">
                {this.state.incidentId}
              </p>
            </div>

            {this.state.errorMessage && (
              <div className="mb-6 text-left">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1 underline mb-2 cursor-pointer"
                >
                  {this.state.showDetails ? 'Hide Diagnostics' : 'Show Error Diagnostics'}
                </button>
                {this.state.showDetails && (
                  <div className="p-3 bg-slate-950 border border-rose-950/80 rounded-lg text-rose-300/90 font-mono text-[11px] break-all max-h-24 overflow-y-auto">
                    {this.state.errorMessage}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleResetAndRecover}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700 cursor-pointer"
              >
                Reset &amp; Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
