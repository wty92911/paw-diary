/**
 * Header Navigation Component
 * 
 * Handles back button and breadcrumb navigation
 * Provides consistent navigation patterns across all header variants
 */

import { ChevronLeft } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { type HeaderNavigationProps, DEFAULT_BACK_LABEL, MAX_BREADCRUMBS } from '../types';
import { useBackActionHandler } from '../hooks/useHeaderNavigation';

// ============================================================================
// Component Styles
// ============================================================================

const NAVIGATION_CONTAINER_STYLES = 'flex items-center gap-2 min-w-0';
const BACK_BUTTON_STYLES = 'h-9 w-9 p-0 flex-shrink-0';
const BREADCRUMB_CONTAINER_STYLES = 'flex items-center gap-1 min-w-0 overflow-hidden';
const BREADCRUMB_ITEM_STYLES = 'text-sm text-muted-foreground hover:text-foreground transition-colors';
const BREADCRUMB_ACTIVE_STYLES = 'text-sm font-medium text-foreground';
const BREADCRUMB_SEPARATOR_STYLES = 'text-muted-foreground mx-1';

// ============================================================================
// Main Component
// ============================================================================

export function HeaderNavigation({
  showBackButton,
  backAction,
  breadcrumbs,
  className
}: HeaderNavigationProps) {
  
  const { handleBackAction } = useBackActionHandler();
  
  // Limit breadcrumbs to prevent overflow
  const displayBreadcrumbs = breadcrumbs?.slice(-MAX_BREADCRUMBS) || [];
  
  // Handle back button click
  const onBackClick = () => {
    handleBackAction(backAction);
  };
  
  return (
    <nav className={cn(NAVIGATION_CONTAINER_STYLES, className)} aria-label="Navigation">
      {/* Back Button */}
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackClick}
          disabled={backAction?.disabled}
          className={BACK_BUTTON_STYLES}
          aria-label={backAction?.label || DEFAULT_BACK_LABEL}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      
      {/* Breadcrumbs */}
      {displayBreadcrumbs.length > 0 && (
        <ol className={BREADCRUMB_CONTAINER_STYLES} aria-label="Breadcrumb">
          {displayBreadcrumbs.map((breadcrumb, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className={BREADCRUMB_SEPARATOR_STYLES} aria-hidden="true">
                  /
                </span>
              )}
              
              {breadcrumb.active ? (
                <span 
                  className={BREADCRUMB_ACTIVE_STYLES}
                  aria-current="page"
                >
                  {breadcrumb.label}
                </span>
              ) : (
                <a 
                  href={breadcrumb.href}
                  className={BREADCRUMB_ITEM_STYLES}
                >
                  {breadcrumb.label}
                </a>
              )}
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}

// ============================================================================
// Display Name for DevTools
// ============================================================================

HeaderNavigation.displayName = 'HeaderNavigation';