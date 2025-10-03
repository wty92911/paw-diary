/* eslint-disable react-refresh/only-export-components */
// Toast exports both component and utility hooks

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
}

export function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 4000
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toastData,
      id,
      duration: toastData.duration ?? defaultDuration,
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit number of toasts
      return updated.slice(0, maxToasts);
    });

    // Auto-remove after duration (unless duration is 0 for persistent toasts)
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [defaultDuration, maxToasts, removeToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      clearAllToasts,
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-toast space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150); // Wait for exit animation
  };

  const getToastStyles = () => {
    const baseStyles = cn(
      'flex items-start gap-3 p-4 rounded-lg shadow-lg border',
      'transform transition-all duration-150 ease-out',
      'max-w-sm',
      {
        'translate-x-0 opacity-100': isVisible,
        'translate-x-full opacity-0': !isVisible,
      }
    );

    switch (toast.type) {
      case 'success':
        return cn(baseStyles, 'bg-green-50 border-green-200 text-green-900');
      case 'error':
        return cn(baseStyles, 'bg-red-50 border-red-200 text-red-900');
      case 'warning':
        return cn(baseStyles, 'bg-yellow-50 border-yellow-200 text-yellow-900');
      case 'info':
      default:
        return cn(baseStyles, 'bg-blue-50 border-blue-200 text-blue-900');
    }
  };

  const getIcon = () => {
    const iconClass = "h-5 w-5 mt-0.5 flex-shrink-0";
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={cn(iconClass, 'text-green-500')} />;
      case 'error':
        return <AlertCircle className={cn(iconClass, 'text-red-500')} />;
      case 'warning':
        return <AlertCircle className={cn(iconClass, 'text-yellow-500')} />;
      case 'info':
      default:
        return <Info className={cn(iconClass, 'text-blue-500')} />;
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-medium text-sm mb-1">
            {toast.title}
          </div>
        )}
        <div className="text-sm text-current opacity-90">
          {toast.message}
        </div>
        
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={cn(
              'mt-2 text-xs font-medium underline hover:no-underline',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 rounded',
              {
                'text-green-700 focus:ring-green-500': toast.type === 'success',
                'text-red-700 focus:ring-red-500': toast.type === 'error',
                'text-yellow-700 focus:ring-yellow-500': toast.type === 'warning',
                'text-blue-700 focus:ring-blue-500': toast.type === 'info',
              }
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleClose}
        className={cn(
          'flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-5',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'transition-colors duration-150',
          {
            'focus:ring-green-500': toast.type === 'success',
            'focus:ring-red-500': toast.type === 'error',
            'focus:ring-yellow-500': toast.type === 'warning',
            'focus:ring-blue-500': toast.type === 'info',
          }
        )}
      >
        <X className="h-4 w-4 opacity-60 hover:opacity-80" />
      </button>
    </div>
  );
}

// Convenience hooks for different toast types
export function useSuccessToast() {
  const { addToast } = useToast();
  
  return useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'success', message, ...options });
  }, [addToast]);
}

export function useErrorToast() {
  const { addToast } = useToast();
  
  return useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'error', message, ...options });
  }, [addToast]);
}

export function useInfoToast() {
  const { addToast } = useToast();
  
  return useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'info', message, ...options });
  }, [addToast]);
}

export function useWarningToast() {
  const { addToast } = useToast();
  
  return useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'warning', message, ...options });
  }, [addToast]);
}

// Activity-specific toast helpers
export function useActivitySaveToast() {
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();
  
  return {
    showSaveSuccess: useCallback((activityTitle?: string) => {
      const message = activityTitle 
        ? `"${activityTitle}" saved successfully`
        : 'Activity saved successfully';
      return showSuccess(message);
    }, [showSuccess]),
    
    showSaveError: useCallback((error?: string) => {
      const message = error 
        ? `Failed to save activity: ${error}`
        : 'Failed to save activity. Please try again.';
      return showError(message);
    }, [showError]),
    
    showDraftSaved: useCallback(() => {
      return showSuccess('Draft saved automatically', { duration: 2000 });
    }, [showSuccess]),
  };
}