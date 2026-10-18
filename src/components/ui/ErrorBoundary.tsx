import { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[System Crash Barrier] Caught unhandled rendering error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-white border border-[#D0D9DE] shadow-card text-center my-4 space-y-4 animate-fadeIn">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>Crash Barrier Active • System Protected</span>
            </div>
            <h3 className="text-base font-bold text-[#09104D]">
              {this.props.fallbackTitle || 'Component Protected from Crash'}
            </h3>
            <p className="text-xs text-[#393A50]">
              An isolated telemetry or rendering anomaly was intercepted safely. The rest of the logistics platform remains fully operational.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 bg-[#F4F7F9] rounded-xl text-left max-w-lg mx-auto text-[11px] font-mono text-[#393A50] border border-[#D0D9DE] overflow-x-auto">
              <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Intercepted Fault: {this.state.error.name}</span>
              </div>
              <p className="text-gray-700">{this.state.error.message}</p>
            </div>
          )}

          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Recover & Restore Live Feed
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
