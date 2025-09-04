import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'accent';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const colorClasses = {
  primary: 'border-blue-600 border-t-transparent',
  secondary: 'border-gray-600 border-t-transparent',
  accent: 'border-orange-500 border-t-transparent',
};

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  color = 'primary' 
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'border-2 rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

// Loading state for larger areas
export function LoadingState({ 
  message = 'Loading...', 
  className 
}: { 
  message?: string; 
  className?: string; 
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-8', className)}>
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-600 animate-pulse">{message}</p>
    </div>
  );
}

// Loading overlay for forms and interactive elements
export function LoadingOverlay({ 
  isVisible = true, 
  message = 'Processing...', 
  className 
}: { 
  isVisible?: boolean; 
  message?: string; 
  className?: string; 
}) {
  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        'absolute inset-0 bg-white/80 backdrop-blur-sm z-50',
        'flex items-center justify-center',
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}