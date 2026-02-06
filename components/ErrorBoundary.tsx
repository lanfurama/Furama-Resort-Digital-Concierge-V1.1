import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches JavaScript errors in child component tree and displays a fallback UI
 * instead of crashing the whole app. Used for Guest and Driver portals.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-600" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 mb-4">
              The app encountered an error. Please try refreshing the page.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw size={18} />
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
