/**
 * iOS Header Container Component
 * 
 * Provides iOS-style header container with safe area support, blur effects,
 * and smooth scroll-based animations. Acts as a wrapper for all header variants.
 */

import React, { forwardRef, useMemo } from 'react';
import { cn } from '../../../lib/utils';
import { 
  type ScrollState, 
  type IOSHeaderBehavior, 
  ElevationLevel, 
  ColorScheme 
} from '../types';
import { 
  generateHeaderStyles, 
  getSafeAreaInsets,
  HEADER_TRANSITIONS 
} from '../utils/layoutUtils';
import { useIOSLayout } from '../hooks/useIOSLayout';

// ============================================================================
// Style Constants
// ============================================================================

const BASE_HEADER_STYLES = `
  fixed left-0 right-0 z-[100]
  transition-all duration-300 ease-out
  will-change-transform
`;

const BLUR_STYLES = `
  backdrop-blur-xl backdrop-saturate-150
  supports-[backdrop-filter]:bg-white/70
  supports-[backdrop-filter]:border-b
  supports-[backdrop-filter]:border-black/5
`;

const COLOR_SCHEMES = {
  [ColorScheme.LIGHT]: {
    base: 'bg-gradient-to-r from-cream-50 to-yellow-50 text-orange-900',
    blur: 'bg-white/80 text-orange-900',
    border: 'border-orange-100/60',
    safeArea: 'bg-gradient-to-r from-cream-50 to-yellow-50' // Solid background for safe area
  },
  [ColorScheme.DARK]: {
    base: 'bg-gradient-to-r from-orange-900 to-yellow-900 text-cream-50',
    blur: 'bg-gray-900/80 text-cream-50',
    border: 'border-orange-700/60',
    safeArea: 'bg-gradient-to-r from-orange-900 to-yellow-900'
  },
  [ColorScheme.AUTO]: {
    base: 'bg-gradient-to-r from-cream-50 to-yellow-50 text-orange-900 dark:from-orange-900 dark:to-yellow-900 dark:text-cream-50',
    blur: 'bg-white/80 text-orange-900 dark:bg-gray-900/80 dark:text-cream-50',
    border: 'border-orange-100/60 dark:border-orange-700/60',
    safeArea: 'bg-gradient-to-r from-cream-50 to-yellow-50 dark:from-orange-900 dark:to-yellow-900'
  }
};

const ELEVATION_STYLES = {
  [ElevationLevel.NONE]: '',
  [ElevationLevel.LOW]: 'shadow-lg shadow-orange-200/20',
  [ElevationLevel.MEDIUM]: 'shadow-xl shadow-orange-200/30',
  [ElevationLevel.HIGH]: 'shadow-2xl shadow-orange-200/40',
  [ElevationLevel.BLUR]: 'shadow-sm shadow-black/5'
};

// ============================================================================
// Component Props
// ============================================================================

interface IOSHeaderContainerProps {
  children: React.ReactNode;
  scrollState: ScrollState;
  behavior: IOSHeaderBehavior;
  colorScheme: ColorScheme;
  elevation: ElevationLevel;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const IOSHeaderContainer = forwardRef<HTMLElement, IOSHeaderContainerProps>(
  ({ children, scrollState, behavior, colorScheme, elevation, className }, ref) => {
    const { safeAreaTop, headerHeight, isCompact } = useIOSLayout({
      enableSafeArea: behavior.safeAreaInsets
    });

    // ========================================================================
    // Style Calculations
    // ========================================================================

    const containerStyles = useMemo(() => {
      const dynamicStyles = generateHeaderStyles(scrollState, behavior, elevation);

      return {
        ...dynamicStyles,
        top: behavior.safeAreaInsets ? `${safeAreaTop}px` : '0',
        height: `${headerHeight}px`,
        paddingTop: '0',
      };
    }, [scrollState, behavior, elevation, headerHeight, safeAreaTop]);

    const shouldUseBlur = useMemo(() => {
      return behavior.enableBlur && scrollState.isScrolled;
    }, [behavior.enableBlur, scrollState.isScrolled]);

    const colorSchemeStyles = useMemo(() => {
      const scheme = COLOR_SCHEMES[colorScheme];
      return shouldUseBlur ? scheme.blur : scheme.base;
    }, [colorScheme, shouldUseBlur]);

    const containerClasses = useMemo(() => {
      return cn(
        BASE_HEADER_STYLES,
        colorSchemeStyles,
        COLOR_SCHEMES[colorScheme].border,
        ELEVATION_STYLES[elevation],
        shouldUseBlur && BLUR_STYLES,
        isCompact && 'text-sm',
        className
      );
    }, [colorSchemeStyles, colorScheme, elevation, shouldUseBlur, isCompact, className]);

    // ========================================================================
    // Safe Area CSS Variables
    // ========================================================================

    const cssVariables = useMemo(() => {
      const insets = getSafeAreaInsets();
      // Total offset = safe area + header height
      const totalOffset = (behavior.safeAreaInsets ? safeAreaTop : 0) + headerHeight;

      return {
        '--safe-area-inset-top': `${safeAreaTop}px`,
        '--safe-area-inset-bottom': `${insets.bottom}px`,
        '--safe-area-inset-left': `${insets.left}px`,
        '--safe-area-inset-right': `${insets.right}px`,
        '--header-height': `${headerHeight}px`,
        '--header-total-offset': `${totalOffset}px`,
        '--header-transition': HEADER_TRANSITIONS.show,
      } as React.CSSProperties;
    }, [headerHeight, safeAreaTop, behavior.safeAreaInsets]);

    // ========================================================================
    // Render
    // ========================================================================

    return (
      <>
        {/* Safe area background - fills the status bar area with solid color */}
        {behavior.safeAreaInsets && safeAreaTop > 0 && (
          <div
            className={cn(
              "fixed top-0 left-0 right-0 z-[99]",
              COLOR_SCHEMES[colorScheme].safeArea
            )}
            style={{ height: `${safeAreaTop}px` }}
            aria-hidden="true"
          />
        )}

        <header
          ref={ref}
          className={containerClasses}
          style={{ ...containerStyles, ...cssVariables }}
          role="banner"
          aria-label="Application header"
        >
          {/* Background blur effect overlay for enhanced glass effect */}
          {shouldUseBlur && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 pointer-events-none"
              aria-hidden="true"
            />
          )}

          {/* Main content container with proper spacing */}
          <div className="relative z-10 h-full max-w-screen-2xl mx-auto">
            <div className={cn(
              "h-full flex items-center",
              isCompact ? "px-4" : "px-6"
            )}>
              {children}
            </div>
          </div>

          {/* Paw print decorative element (subtle) */}
          <div
            className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-5 pointer-events-none"
            aria-hidden="true"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-orange-400"
            >
              <path d="M12 2C10.9 2 10 2.9 10 4s.9 2 2 2 2-.9 2-2-.9-2-2-2zM21 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM3 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM18 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM16 12c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-1.66.67-3.16 1.76-4.24l-1.42-1.42C2.93 7.75 2 9.79 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-2.21-.93-4.25-2.34-5.66l-1.42 1.42C19.33 8.84 20 10.34 20 12z"/>
            </svg>
          </div>
        </header>
      </>
    );
  }
);

IOSHeaderContainer.displayName = 'IOSHeaderContainer';