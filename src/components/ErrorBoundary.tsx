'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console — Sentry integration placeholder
    console.error('[ErrorBoundary]', error, info.componentStack);

    // TODO: Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-8 text-center">
          <div className="text-3xl">&#9888;</div>
          <h3 className="text-sm font-medium text-ck-text">
            Something went wrong
          </h3>
          <p className="max-w-md text-xs text-ck-text-muted">
            An unexpected error occurred while rendering this section.
            Please try again or contact support if the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-2 max-w-full overflow-x-auto rounded-lg bg-ck-surface-2 p-3 text-left text-[11px] text-red-400">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="rounded-lg bg-ck-red px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-ck-red/90"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
