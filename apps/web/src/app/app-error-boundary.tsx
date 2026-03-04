import { logger } from '@movable-madness/logging/frontend';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.errorWithException('React rendering error caught by error boundary', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <span className="text-2xl font-bold text-destructive">!</span>
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-card-foreground">
              Something went wrong
            </h1>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              We're sorry, but an unexpected error occurred. Please try reloading the page or return
              to the home page.
            </p>
            {this.state.error && (
              <p className="mb-4 break-words rounded bg-destructive/10 p-3 font-mono text-xs text-destructive">
                {this.state.error.message}
              </p>
            )}
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="rounded-md border bg-card px-4 py-2 text-sm font-medium text-card-foreground hover:bg-accent"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
