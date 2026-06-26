import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

/**
 * Top-level renderer error boundary (CLAUDE.md §5.7). Catches render-time
 * errors so the operator sees an actionable fallback — never a white screen or
 * a raw stack trace on the projector — and can recover by reloading.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Visible in DevTools (dev) and the renderer console. Forwarding to the
    // main-process logger via the preload bridge lands in a later phase.
    console.error('Renderer error boundary caught:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            The app hit an unexpected error. Reload to continue; if it keeps happening, check the
            application logs.
          </p>
          <button
            onClick={this.handleReload}
            className="rounded bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
