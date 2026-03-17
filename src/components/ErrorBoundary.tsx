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
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface-900">
          <div className="glass-card p-8 max-w-md w-full text-center animate-scale-in">
            <div className="mx-auto w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>

            <h1 className="text-xl font-bold text-surface-100 mb-2">
              Что-то пошло не так
            </h1>
            <p className="text-surface-400 text-sm mb-6">
              Произошла непредвиденная ошибка. Пожалуйста, отправьте этот ID в поддержку.
            </p>

            {this.state.errorId && (
              <div className="glass-input px-4 py-3 text-xs font-mono text-surface-300 mb-6 text-center select-all">
                {this.state.errorId}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={this.handleCopy}
                className="btn btn-secondary btn-md flex-1"
                aria-label="Скопировать ID ошибки"
              >
                <Copy className="w-4 h-4" />
                {this.state.copying ? 'Скопировано!' : 'Скопировать ID'}
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary btn-md flex-1"
                aria-label="Перезагрузить страницу"
              >
                <RefreshCw className="w-4 h-4" />
                Перезагрузить
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
