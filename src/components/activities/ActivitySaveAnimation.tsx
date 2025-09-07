import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, Save, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

// Types for save feedback state
export type SaveState = 'idle' | 'saving' | 'success' | 'error';

export interface SaveFeedbackOptions {
  duration?: number; // Animation duration in ms
  showToast?: boolean;
  scrollToElement?: boolean;
  highlightElement?: boolean;
}

interface ActivitySaveAnimationProps {
  saveState: SaveState;
  children: React.ReactNode;
  options?: SaveFeedbackOptions;
  className?: string;
  onAnimationComplete?: () => void;
}

const defaultOptions: SaveFeedbackOptions = {
  duration: 2000,
  showToast: true,
  scrollToElement: true,
  highlightElement: true,
};

export function ActivitySaveAnimation({
  saveState,
  children,
  options = {},
  className,
  onAnimationComplete,
}: ActivitySaveAnimationProps) {
  const mergedOptions = { ...defaultOptions, ...options };
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (saveState === 'success') {
      startSuccessAnimation();
    } else if (saveState === 'error') {
      startErrorAnimation();
    }
  }, [saveState, mergedOptions]);

  const startSuccessAnimation = async () => {
    setIsAnimating(true);
    
    // Highlight animation
    if (mergedOptions.highlightElement) {
      setShowHighlight(true);
    }

    // Scroll to element
    if (mergedOptions.scrollToElement && elementRef.current) {
      scrollToElement(elementRef.current);
    }

    // Show toast notification
    if (mergedOptions.showToast) {
      showSuccessToast();
    }

    // Reset after duration
    setTimeout(() => {
      setShowHighlight(false);
      setIsAnimating(false);
      onAnimationComplete?.();
    }, mergedOptions.duration);
  };

  const startErrorAnimation = () => {
    setIsAnimating(true);
    
    if (mergedOptions.showToast) {
      showErrorToast();
    }

    // Brief error highlight
    if (mergedOptions.highlightElement) {
      setShowHighlight(true);
      setTimeout(() => {
        setShowHighlight(false);
        setIsAnimating(false);
        onAnimationComplete?.();
      }, 1000);
    }
  };

  const scrollToElement = (element: HTMLElement) => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  };

  const showSuccessToast = () => {
    // Create and show success toast
    createToast('success', 'Activity saved successfully!');
  };

  const showErrorToast = () => {
    // Create and show error toast
    createToast('error', 'Failed to save activity. Please try again.');
  };

  const createToast = (type: 'success' | 'error', message: string) => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = cn(
      'fixed top-4 right-4 z-toast flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg',
      'transform translate-x-0 transition-all duration-300 ease-out',
      'text-white font-medium',
      {
        'bg-green-500': type === 'success',
        'bg-red-500': type === 'error',
      }
    );

    const icon = type === 'success' 
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3l8-8"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9s4.03-9 9-9c1.513 0 2.929.375 4.176 1.037"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    toast.innerHTML = `
      ${icon}
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Remove after delay
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const getAnimationClasses = () => {
    if (!isAnimating) return '';

    const baseClasses = 'transition-all duration-300 ease-out';
    
    if (saveState === 'success' && showHighlight) {
      return cn(
        baseClasses,
        'ring-2 ring-green-400 ring-opacity-75',
        'bg-gradient-to-r from-green-50 to-transparent',
        'shadow-lg shadow-green-100',
        'animate-pulse-slow'
      );
    }

    if (saveState === 'error' && showHighlight) {
      return cn(
        baseClasses,
        'ring-2 ring-red-400 ring-opacity-75',
        'bg-gradient-to-r from-red-50 to-transparent',
        'shadow-lg shadow-red-100',
        'animate-pulse'
      );
    }

    if (saveState === 'saving') {
      return cn(
        baseClasses,
        'ring-1 ring-blue-300 ring-opacity-50',
        'bg-gradient-to-r from-blue-50 to-transparent'
      );
    }

    return baseClasses;
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        'relative',
        getAnimationClasses(),
        className
      )}
    >
      {children}
      
      {/* Save state indicator */}
      {isAnimating && (
        <div className="absolute -top-2 -right-2 z-10">
          {saveState === 'saving' && (
            <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full animate-pulse">
              <Save className="w-3 h-3 text-white" />
            </div>
          )}
          
          {saveState === 'success' && showHighlight && (
            <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full animate-bounce-soft">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
          
          {saveState === 'error' && showHighlight && (
            <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full animate-pulse">
              <AlertCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for managing save state and animations
export function useSaveAnimation(initialState: SaveState = 'idle') {
  const [saveState, setSaveState] = useState<SaveState>(initialState);
  const [isAnimating, setIsAnimating] = useState(false);

  const startSaving = () => {
    setSaveState('saving');
    setIsAnimating(true);
  };

  const markSuccess = () => {
    setSaveState('success');
  };

  const markError = () => {
    setSaveState('error');
  };

  const reset = () => {
    setSaveState('idle');
    setIsAnimating(false);
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

  return {
    saveState,
    isAnimating,
    startSaving,
    markSuccess,
    markError,
    reset,
    handleAnimationComplete,
  };
}

// Higher-order component for easy integration
export function withSaveAnimation<P extends object>(
  Component: React.ComponentType<P>,
  options?: SaveFeedbackOptions
) {
  return function SaveAnimationWrapper(props: P & { saveState?: SaveState }) {
    const { saveState = 'idle', ...componentProps } = props;

    return (
      <ActivitySaveAnimation
        saveState={saveState}
        options={options}
      >
        <Component {...componentProps as P} />
      </ActivitySaveAnimation>
    );
  };
}

// Utility function for smooth scrolling to activity
export function scrollToActivity(activityId: number, behavior: ScrollBehavior = 'smooth') {
  const element = document.querySelector(`[data-activity-id="${activityId}"]`);
  if (element) {
    element.scrollIntoView({
      behavior,
      block: 'center',
      inline: 'nearest',
    });
  }
}

// Flash animation for newly created/updated activities
export function flashActivity(activityId: number, type: 'success' | 'update' = 'success') {
  const element = document.querySelector(`[data-activity-id="${activityId}"]`);
  if (!element) return;

  const flashClass = type === 'success' 
    ? 'animate-pulse bg-gradient-to-r from-green-50 to-transparent ring-2 ring-green-400 ring-opacity-75'
    : 'animate-pulse bg-gradient-to-r from-blue-50 to-transparent ring-2 ring-blue-400 ring-opacity-75';

  element.classList.add(...flashClass.split(' '));

  setTimeout(() => {
    element.classList.remove(...flashClass.split(' '));
  }, 2000);
}

// Batch animation for multiple activities (useful for bulk operations)
export function batchActivityAnimation(
  activityIds: number[], 
  type: 'success' | 'error',
  staggerDelay: number = 100
) {
  activityIds.forEach((id, index) => {
    setTimeout(() => {
      flashActivity(id, type === 'error' ? 'update' : 'success');
    }, index * staggerDelay);
  });
}

// Timeline-specific save animation
export interface TimelineSaveAnimationProps {
  children: React.ReactNode;
  newActivityId?: number;
  updatedActivityId?: number;
  className?: string;
}

export function TimelineSaveAnimation({
  children,
  newActivityId,
  updatedActivityId,
  className,
}: TimelineSaveAnimationProps) {
  useEffect(() => {
    if (newActivityId) {
      // Scroll to and highlight new activity
      setTimeout(() => {
        scrollToActivity(newActivityId);
        flashActivity(newActivityId, 'success');
      }, 100);
    } else if (updatedActivityId) {
      // Highlight updated activity
      flashActivity(updatedActivityId, 'update');
    }
  }, [newActivityId, updatedActivityId]);

  return (
    <div className={cn('relative', className)}>
      {children}
    </div>
  );
}