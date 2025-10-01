/**
 * Header Brand Component
 * 
 * Displays app or page title with optional subtitle and icon
 * Provides consistent branding across all header variants
 */

import { cn } from '../../../lib/utils';
import { HeaderBrandProps, MAX_TITLE_LENGTH } from '../types';

// ============================================================================
// Component Styles
// ============================================================================

const BRAND_CONTAINER_STYLES = 'flex items-center gap-3 min-w-0';
const BRAND_CONTENT_STYLES = 'flex flex-col min-w-0';
const TITLE_STYLES = 'text-xl font-bold leading-6 truncate text-orange-900 drop-shadow-sm';
const SUBTITLE_STYLES = 'text-sm font-medium leading-4 text-orange-600/80 truncate';
const ICON_STYLES = 'h-8 w-8 flex-shrink-0 text-orange-600';

// ============================================================================
// Helper Functions
// ============================================================================

function truncateTitle(title: string, maxLength: number = MAX_TITLE_LENGTH): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// Main Component
// ============================================================================

export function HeaderBrand({
  title,
  subtitle,
  icon: Icon,
  className
}: HeaderBrandProps) {
  
  const displayTitle = truncateTitle(title);
  
  return (
    <div className={cn(BRAND_CONTAINER_STYLES, className)}>
      {/* Icon */}
      {Icon && (
        <Icon className={ICON_STYLES} />
      )}
      
      {/* Brand Content */}
      <div className={BRAND_CONTENT_STYLES}>
        <h1 className={TITLE_STYLES} title={title}>
          {displayTitle}
        </h1>
        
        {subtitle && (
          <p className={SUBTITLE_STYLES} title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Display Name for DevTools
// ============================================================================

HeaderBrand.displayName = 'HeaderBrand';