import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected application error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F5FA] text-[#18264F] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-[#18264F]/10 p-8 shadow-sm">
            <h1 className="text-2xl font-semibold mb-3">Something went wrong</h1>
            <p className="text-sm text-[#18264F]/75 mb-6 leading-relaxed">
              We ran into an unexpected issue loading this view. You can return home or reload the page.
            </p>
            <pre className="text-xs font-mono bg-[#F5F5FA] p-4 rounded-xl overflow-x-auto mb-6 text-[#18264F]/80">
              {this.state.message}
            </pre>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="px-5 py-2.5 rounded-xl bg-[#304A96] text-white text-sm font-medium hover:bg-[#18264F] transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
