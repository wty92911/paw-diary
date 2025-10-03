/**
 * Error helper utilities - separated from ErrorBoundary for Fast Refresh
 */

import React, { lazy } from 'react';

/**
 * Higher-order component for wrapping components with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: { fallback?: React.ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void },
) {
  // Import dynamically to avoid circular dependency
  const ErrorBoundary = lazy(() =>
    import('../ErrorBoundary').then(module => ({ default: module.ErrorBoundary }))
  );

  return function WrappedComponent(props: P) {
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <ErrorBoundary {...errorBoundaryProps}>
          <Component {...props} />
        </ErrorBoundary>
      </React.Suspense>
    );
  };
}

/**
 * Hook for throwing errors to be caught by ErrorBoundary
 */
export function useErrorHandler() {
  const throwError = React.useCallback((error: Error) => {
    throw error;
  }, []);

  const throwActivityError = React.useCallback(
    (message: string, petId?: number, context?: string) => {
      const error = new Error(message);
      error.name = 'ActivityError';
      (error as Error & { petId?: number; context?: string }).petId = petId;
      (error as Error & { petId?: number; context?: string }).context = context;
      throw error;
    },
    [],
  );

  return { throwError, throwActivityError };
}
