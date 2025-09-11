import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert } from './ui/alert';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  // Activity-specific props
  petId?: number;
  activityContext?: string;
  showRecovery?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context information
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      petId: this.props.petId,
      activityContext: this.props.activityContext,
      errorId: this.state.errorId,
    });

    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to logging service (if available)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, this would send to an error tracking service like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      petId: this.props.petId,
      activityContext: this.props.activityContext,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.log('Error Report:', errorReport);

    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorReport });
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>

            <p className="text-gray-600 mb-4">
              {this.isActivityError()
                ? this.getActivityErrorMessage()
                : "We're sorry, but an unexpected error occurred. Please try again."}
            </p>

            {/* Error ID for support */}
            {this.state.errorId && (
              <div className="mb-4">
                <Alert className="text-left">
                  <p className="text-sm text-gray-500">
                    Error ID: <code className="font-mono">{this.state.errorId}</code>
                  </p>
                </Alert>
              </div>
            )}

            {/* Recovery actions */}
            <div className="space-y-2">
              {this.props.showRecovery !== false && (
                <Button onClick={this.handleRetry} className="w-full" variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleGoBack} variant="outline" className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>

                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </div>
            </div>

            {/* Development error details */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                  <p className="font-semibold text-red-600 mb-2">{this.state.error.message}</p>
                  <pre className="whitespace-pre-wrap text-gray-700">{this.state.error.stack}</pre>
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <p className="font-semibold mb-1">Component Stack:</p>
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }

  private isActivityError(): boolean {
    const error = this.state.error;
    if (!error) return false;

    // Check for activity-specific error patterns
    return (
      error.message.includes('pet') ||
      error.message.includes('activity') ||
      error.message.includes('not found') ||
      error.message.includes('unauthorized') ||
      this.props.petId !== undefined ||
      this.props.activityContext !== undefined
    );
  }

  private getActivityErrorMessage(): string {
    const error = this.state.error;
    if (!error) return 'An error occurred in the activity system.';

    // Provide user-friendly messages for common activity errors
    if (error.message.includes('pet not found') || error.message.includes('Pet not found')) {
      return 'The selected pet could not be found. Please check if the pet still exists.';
    }

    if (
      error.message.includes('activity not found') ||
      error.message.includes('Activity not found')
    ) {
      return 'The requested activity could not be found. It may have been deleted.';
    }

    if (error.message.includes('unauthorized') || error.message.includes('permission')) {
      return "You don't have permission to access this activity or pet data.";
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Unable to load activity data. Please check your connection and try again.';
    }

    // Default activity error message
    return `An error occurred while ${this.props.activityContext || 'loading activity data'}. Please try again.`;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for throwing errors to be caught by ErrorBoundary
export function useErrorHandler() {
  const throwError = React.useCallback((error: Error) => {
    throw error;
  }, []);

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

  return { throwError, throwActivityError };
}

// Utility function for creating activity-specific error boundaries
export function ActivityErrorBoundary({
  children,
  petId,
  activityContext,
  onError,
}: {
  children: ReactNode;
  petId?: number;
  activityContext?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary
      petId={petId}
      activityContext={activityContext}
      onError={onError}
      showRecovery={true}
    >
      {children}
    </ErrorBoundary>
  );
}
