import React from 'react';

// Enhanced hook for error boundary state management
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Application Error:', error, errorInfo);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by nearest ErrorBoundary
  const throwError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    throw errorObj;
  }, []);

  // Activity-specific error thrower
  const throwActivityError = React.useCallback(
    (message: string, petId?: number, context?: string) => {
      const error = new Error(message);
      error.name = 'ActivityError';
      (error as any).petId = petId;
      (error as any).context = context;
      throw error;
    },
    [],
  );

  return {
    error,
    handleError,
    clearError,
    throwError,
    throwActivityError,
  };
}

// Hook for handling async errors that might not be caught by ErrorBoundary
export function useAsyncError() {
  const [, setError] = React.useState();

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
