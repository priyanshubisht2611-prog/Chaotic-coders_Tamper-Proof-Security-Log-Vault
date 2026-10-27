import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-[#e11d2e] mb-2 uppercase">
            System Failure
          </h1>
          <p className="text-vault-muted text-sm max-w-md mb-6 font-sans">
            {this.state.error?.message || 'An unexpected runtime error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-lg bg-[#2f6bff] text-white font-heading text-xs tracking-wider uppercase font-bold"
          >
            Reboot Vault
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
