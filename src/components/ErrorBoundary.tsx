import { Component, type ReactNode } from 'react';
import { logError } from '../services/errorService';
import { AlertTriangle, Copy, RefreshCw } from 'lucide-react';

interface IErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
  errorId: string;
  copying: boolean;
}

/**
 * Global error boundary that catches React rendering errors,
 * logs them to Supabase, and shows a friendly crash screen.
 */
export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorId: '', copying: false };
  }

  static getDerivedStateFromError(): Partial<IErrorBoundaryState> {
    return { hasError: true };
  }

  async componentDidCatch(error: Error) {
    const errorId = await logError(error.message, error.stack);
    this.setState({ errorId });
  }

  handleCopy = async () => {
    this.setState({ copying: true });
    await navigator.clipboard.writeText(this.state.errorId);
    setTimeout(() => this.setState({ copying: false }), 1500);
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-dvh flex items-center justify-center p-6 relative overflow-hidden">
          <div className="ambient-glow w-full h-full" />
          
          <div className="glass-card p-10 max-w-sm w-full text-center animate-scale-in relative z-10 border-danger/20">
            <div className="mx-auto w-20 h-20 rounded-[2rem] bg-danger/10 flex items-center justify-center mb-8 shadow-2xl shadow-danger/20 border border-danger/20 relative group">
              <div className="absolute inset-0 bg-danger/20 blur-2xl rounded-full opacity-50" />
              <AlertTriangle className="w-10 h-10 text-danger relative z-10" />
            </div>

            <h1 className="text-2xl font-black text-surface-50 tracking-tight mb-3">
              Oops! Something went wrong
            </h1>
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest leading-relaxed mb-8">
              An error occurred. Please provide this ID to support to help resolve the issue.
            </p>

            {this.state.errorId && (
              <div className="bg-surface-900/50 px-4 py-4 rounded-2xl text-[10px] font-black text-brand-primary mb-8 select-all border border-brand-primary/10 tracking-widest">
                {this.state.errorId}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={this.handleCopy}
                className="w-full h-12 rounded-xl bg-white/5 text-surface-100 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-white/10 active:scale-95 border border-white/5"
              >
                <Copy className="w-4 h-4" />
                {this.state.copying ? 'Copied!' : 'Copy Error ID'}
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full h-12 rounded-xl bg-danger text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-danger/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
