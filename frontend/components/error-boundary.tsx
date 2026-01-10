'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: string | number; // Change this to reset the error boundary
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // TODO: Send to error tracking service (Sentry, etc.)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state if resetKey changes
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Default fallback component
interface DefaultErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
  variant?: 'full' | 'inline' | 'minimal';
}

export function DefaultErrorFallback({
  error,
  onReset,
  variant = 'full',
}: DefaultErrorFallbackProps) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 p-2 text-sm text-red-600 bg-red-50 rounded">
        <span>Something went wrong</span>
        <button
          onClick={onReset}
          className="underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-red-500 text-xl">⚠️</div>
          <div className="flex-1">
            <h4 className="font-medium text-red-800 dark:text-red-200">
              Something went wrong
            </h4>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={onReset}
              className="mt-3 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We encountered an unexpected error. Please try again.
        </p>
        {error?.message && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
            {error.message}
          </p>
        )}
        <button
          onClick={onReset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          🔄 Try Again
        </button>
        <p className="text-xs text-gray-400 mt-4">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
