import { useState, useEffect } from 'react';
import { Edit3, Clock, Archive, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

// Types for draft states
export type DraftStatus = 'none' | 'saving' | 'saved' | 'error' | 'stale';

export interface DraftInfo {
  id?: number;
  lastSaved?: Date;
  isStale?: boolean;
  hasUnsavedChanges?: boolean;
  errorMessage?: string;
}

interface DraftIndicatorProps {
  status: DraftStatus;
  draftInfo?: DraftInfo;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DraftIndicator({ 
  status, 
  className,
  showLabel = true,
  size = 'md'
}: DraftIndicatorProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1';
      case 'md':
      default:
        return 'text-xs px-2.5 py-0.5';
    }
  };

  const getIndicatorConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: RefreshCw,
          label: 'Saving...',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          animate: true,
        };
      case 'saved':
        return {
          icon: Edit3,
          label: 'Draft',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          animate: false,
        };
      case 'error':
        return {
          icon: AlertTriangle,
          label: 'Save Error',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          animate: false,
        };
      case 'stale':
        return {
          icon: Clock,
          label: 'Old Draft',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-700 border-gray-300',
          animate: false,
        };
      case 'none':
      default:
        return null;
    }
  };

  const config = getIndicatorConfig();
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        getSizeClasses(),
        config.className,
        config.animate && 'animate-pulse',
        className
      )}
    >
      <IconComponent className={cn(
        'mr-1 flex-shrink-0',
        config.animate && 'animate-spin',
        {
          'h-3 w-3': size === 'sm',
          'h-4 w-4': size === 'md',
          'h-5 w-5': size === 'lg',
        }
      )} />
      {showLabel && config.label}
    </Badge>
  );
}

// Page title draft indicator
interface PageTitleDraftIndicatorProps {
  hasDraft: boolean;
  isDirty?: boolean;
  isAutoSaving?: boolean;
  lastSaved?: Date;
  className?: string;
}

export function PageTitleDraftIndicator({ 
  hasDraft, 
  isDirty = false,
  isAutoSaving = false,
  lastSaved,
  className 
}: PageTitleDraftIndicatorProps) {
  const getStatus = (): DraftStatus => {
    if (isAutoSaving) return 'saving';
    if (isDirty || hasDraft) return 'saved';
    return 'none';
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (!hasDraft && !isDirty) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DraftIndicator 
        status={getStatus()} 
        size="sm"
        draftInfo={{ lastSaved, hasUnsavedChanges: isDirty }}
      />
      {lastSaved && !isAutoSaving && (
        <span className="text-xs text-muted-foreground">
          Last saved {formatLastSaved(lastSaved)}
        </span>
      )}
    </div>
  );
}

// Activity card draft indicator
interface ActivityCardDraftIndicatorProps {
  activityId: number;
  hasDraft: boolean;
  onRecoverDraft?: () => void;
  className?: string;
}

export function ActivityCardDraftIndicator({ 
  hasDraft, 
  onRecoverDraft,
  className 
}: ActivityCardDraftIndicatorProps) {
  if (!hasDraft) return null;

  return (
    <div className={cn('flex items-center justify-between p-2 bg-yellow-50 border-l-2 border-yellow-400', className)}>
      <div className="flex items-center gap-2">
        <DraftIndicator status="saved" size="sm" />
        <span className="text-xs text-yellow-800">
          You have unsaved changes for this activity
        </span>
      </div>
      {onRecoverDraft && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRecoverDraft}
          className="h-6 text-xs text-yellow-800 border-yellow-300 hover:bg-yellow-100"
        >
          Recover
        </Button>
      )}
    </div>
  );
}

// Draft recovery confirmation dialog
interface DraftRecoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRecover: () => void;
  onDiscard: () => void;
  draftInfo: {
    lastModified: Date;
    activityTitle?: string;
    hasSignificantChanges?: boolean;
  };
}

export function DraftRecoveryDialog({
  isOpen,
  onClose,
  onRecover,
  onDiscard,
  draftInfo
}: DraftRecoveryDialogProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-yellow-600" />
            Recover Draft?
          </AlertDialogTitle>
          <AlertDialogDescription>
            We found a draft for {draftInfo.activityTitle ? `"${draftInfo.activityTitle}"` : 'this activity'} 
            {' '}from {formatDate(draftInfo.lastModified)}.
            {draftInfo.hasSignificantChanges && (
              <span className="block mt-2 text-yellow-700 font-medium">
                This draft contains significant changes that would be lost.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            Discard Draft
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onRecover}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Recover Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Auto-save status indicator
interface AutoSaveStatusProps {
  isEnabled: boolean;
  lastSaved?: Date;
  isSaving: boolean;
  hasError: boolean;
  onRetry?: () => void;
  className?: string;
}

export function AutoSaveStatus({ 
  isEnabled, 
  lastSaved, 
  isSaving, 
  hasError,
  onRetry,
  className 
}: AutoSaveStatusProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isEnabled) return null;

  const getStatusText = () => {
    if (hasError) return 'Auto-save failed';
    if (isSaving) return 'Auto-saving...';
    if (lastSaved) {
      const now = new Date();
      const diffMs = now.getTime() - lastSaved.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      
      if (diffSecs < 30) return 'Auto-saved';
      if (diffSecs < 60) return `Auto-saved ${diffSecs}s ago`;
      return `Auto-saved ${Math.floor(diffSecs / 60)}m ago`;
    }
    return 'Auto-save ready';
  };

  const getStatusColor = () => {
    if (hasError) return 'text-red-600';
    if (isSaving) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div 
      className={cn('flex items-center gap-2 text-xs', className)}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <div className={cn('flex items-center gap-1', getStatusColor())}>
        {isSaving && <RefreshCw className="h-3 w-3 animate-spin" />}
        {hasError && <AlertTriangle className="h-3 w-3" />}
        {!isSaving && !hasError && <Edit3 className="h-3 w-3" />}
        <span>{getStatusText()}</span>
      </div>
      
      {hasError && onRetry && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRetry}
          className="h-5 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Retry
        </Button>
      )}
      
      {showDetails && lastSaved && (
        <div className="absolute z-10 mt-6 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
          Last saved: {lastSaved.toLocaleString()}
        </div>
      )}
    </div>
  );
}

// Bulk draft operations indicator
interface BulkDraftIndicatorProps {
  draftCount: number;
  onRecoverAll?: () => void;
  onDiscardAll?: () => void;
  className?: string;
}

export function BulkDraftIndicator({ 
  draftCount, 
  onRecoverAll, 
  onDiscardAll,
  className 
}: BulkDraftIndicatorProps) {
  if (draftCount === 0) return null;

  return (
    <div className={cn(
      'flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg',
      className
    )}>
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Edit3 className="h-3 w-3 mr-1" />
          {draftCount} Draft{draftCount > 1 ? 's' : ''}
        </Badge>
        <span className="text-sm text-yellow-800">
          You have unsaved drafts
        </span>
      </div>
      
      <div className="flex gap-2">
        {onDiscardAll && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDiscardAll}
            className="h-7 text-xs text-yellow-700 hover:bg-yellow-100"
          >
            Discard All
          </Button>
        )}
        {onRecoverAll && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRecoverAll}
            className="h-7 text-xs text-yellow-800 border-yellow-300 hover:bg-yellow-100"
          >
            Recover All
          </Button>
        )}
      </div>
    </div>
  );
}

// Hook for managing draft state
export function useDraftState(initialDraft?: DraftInfo) {
  const [draftInfo, setDraftInfo] = useState<DraftInfo | null>(initialDraft || null);
  const [status, setStatus] = useState<DraftStatus>('none');

  const updateDraftStatus = (newStatus: DraftStatus, info?: Partial<DraftInfo>) => {
    setStatus(newStatus);
    if (info) {
      setDraftInfo(prev => ({ ...prev, ...info }));
    }
  };

  const markAsSaving = () => updateDraftStatus('saving');
  const markAsSaved = (info?: Partial<DraftInfo>) => updateDraftStatus('saved', info);
  const markAsError = (errorMessage: string) => updateDraftStatus('error', { errorMessage });
  const clearDraft = () => {
    setStatus('none');
    setDraftInfo(null);
  };

  const isStale = () => {
    if (!draftInfo?.lastSaved) return false;
    const now = new Date();
    const diffMs = now.getTime() - draftInfo.lastSaved.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 24; // Consider stale after 24 hours
  };

  useEffect(() => {
    if (draftInfo && isStale() && status === 'saved') {
      setStatus('stale');
    }
  }, [draftInfo, status]);

  return {
    draftInfo,
    status,
    markAsSaving,
    markAsSaved,
    markAsError,
    clearDraft,
    isStale: isStale(),
    hasDraft: status !== 'none',
  };
}