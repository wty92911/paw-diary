/**
 * iOS Content Layout Component
 * 
 * Provides proper content spacing and layout for iOS-style headers.
 * Handles safe areas, header overlap prevention, and responsive behavior.
 */

import React, { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { useIOSLayout } from '../hooks/useIOSLayout';
// import { useScrollState } from '../hooks/useScrollState';

// ============================================================================
// Component Props
// ============================================================================

interface IOSContentLayoutProps {
  children: React.ReactNode;
  enableHeaderPadding?: boolean;
  enableSafeArea?: boolean;
  className?: string;
  // scrollElement?: HTMLElement | null;
}

// ============================================================================
// Main Component
// ============================================================================

export const IOSContentLayout = forwardRef<HTMLDivElement, IOSContentLayoutProps>(
  ({ 
    children, 
    enableHeaderPadding = true, 
    enableSafeArea = true, 
    className,
    // scrollElement = null
  }, ref) => {
    const { contentOffset, safeAreaBottom, isCompact } = useIOSLayout({
      enableSafeArea
    });

    // Note: contentPaddingTop could be used for dynamic spacing
    // const { contentPaddingTop } = useScrollState({
    //   element: scrollElement
    // });

    // ========================================================================
    // Style Calculations
    // ========================================================================

    const contentStyles = React.useMemo(() => {
      const styles: React.CSSProperties = {};

      if (enableHeaderPadding) {
        styles.paddingTop = `${contentOffset}px`;
      }

      if (enableSafeArea && safeAreaBottom > 0) {
        styles.paddingBottom = `${safeAreaBottom}px`;
      }

      return styles;
    }, [enableHeaderPadding, enableSafeArea, contentOffset, safeAreaBottom]);

    const containerClasses = React.useMemo(() => {
      return cn(
        'min-h-screen w-full',
        'transition-all duration-300 ease-out',
        isCompact ? 'text-sm' : 'text-base',
        className
      );
    }, [isCompact, className]);

    // ========================================================================
    // Render
    // ========================================================================

    return (
      <div
        ref={ref}
        className={containerClasses}
        style={contentStyles}
      >
        {/* Main content area */}
        <div className="relative z-0">
          {children}
        </div>

        {/* Safe area spacer for bottom */}
        {enableSafeArea && safeAreaBottom > 0 && (
          <div 
            className="w-full bg-transparent pointer-events-none"
            style={{ height: `${safeAreaBottom}px` }}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

IOSContentLayout.displayName = 'IOSContentLayout';

// ============================================================================
// Exports
// ============================================================================

// Convenience hook moved to: ../hooks/useIOSContentLayout
// Import with: import { useIOSContentLayout } from '../hooks/useIOSContentLayout';