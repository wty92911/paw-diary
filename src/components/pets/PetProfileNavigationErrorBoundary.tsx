import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pet } from '../../lib/types';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  children: ReactNode;
  pets: Pet[];
  onNavigateToView: (view: string, petId?: number) => void;
  className?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error boundary for PetProfileNavigation component
 * Provides graceful fallback to pet list view when navigation fails
 */
export class PetProfileNavigationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('PetProfileNavigation Error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // In a production app, you would log this to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleFallbackToPetList = () => {
    this.props.onNavigateToView('pet-list');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            'min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4',
            this.props.className,
          )}
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Error Message */}
            <h2 className="text-xl font-bold text-gray-900 mb-3">Navigation Error</h2>
            <p className="text-gray-600 mb-6">
              We encountered an issue while loading the pet profiles. This might be due to a
              temporary problem with the data or navigation system.
            </p>

            {/* Error Details (Development only) */}
            {typeof window !== 'undefined' &&
              window.location.hostname === 'localhost' &&
              this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <Button
                onClick={this.handleFallbackToPetList}
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Pet List
              </Button>
            </div>

            {/* Pet Count Info */}
            {this.props.pets.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  You have {this.props.pets.length} pet{this.props.pets.length !== 1 ? 's' : ''} in
                  your diary
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error boundary state management
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error('Navigation Error:', error, errorInfo);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
}

// Component for displaying navigation loading errors
export function NavigationErrorFallback({
  onRetry,
  onFallback,
  pets,
  className,
}: {
  onRetry: () => void;
  onFallback: () => void;
  pets: Pet[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4',
        className,
      )}
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* Error Message */}
        <h2 className="text-xl font-bold text-gray-900 mb-3">Loading Error</h2>
        <p className="text-gray-600 mb-6">
          We couldn't load the pet profiles. This might be due to a network issue or data problem.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={onRetry} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Button
            onClick={onFallback}
            variant="outline"
            className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Pet List
          </Button>
        </div>

        {/* Pet Count Info */}
        {pets.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              You have {pets.length} pet{pets.length !== 1 ? 's' : ''} in your diary
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
