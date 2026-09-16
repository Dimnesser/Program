import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Changing this value resets the boundary — used to recover on navigation. */
  resetKey?: string;
  fallbackTitle: string;
  fallbackText: string;
  reloadLabel: string;
}

interface State {
  error: Error | null;
}

/** Keeps a failing tool from taking the whole app down. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(previous: Props) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('NOVA tool error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-danger/25 bg-danger/[0.04] px-6 py-16 text-center">
        <p className="text-base font-semibold text-ink">{this.props.fallbackTitle}</p>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted">{this.props.fallbackText}</p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg transition hover:brightness-110"
        >
          <RotateCw className="h-4 w-4" />
          {this.props.reloadLabel}
        </button>
      </div>
    );
  }
}
