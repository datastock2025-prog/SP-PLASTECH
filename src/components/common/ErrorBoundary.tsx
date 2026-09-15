import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  key?: React.Key;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300 m-4">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {this.props.fallbackTitle || 'Display Interruption Recovered'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                An unexpected data irregularity occurred while rendering this view. The application intercepted the interruption to prevent screen crash.
              </p>
              {this.state.error && (
                <div className="mt-3 p-2 bg-gray-50 rounded-lg text-left font-mono text-[10px] text-gray-600 max-h-20 overflow-y-auto border border-gray-200">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reload View
              </button>
              <button
                onClick={() => {
                  window.location.hash = '';
                  window.location.reload();
                }}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Home className="w-3.5 h-3.5 text-gray-500" /> Refresh Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
