/**
 * iOS-Style Layout Utilities
 * 
 * Utility functions for iOS-style layout calculations, safe area handling,
 * and responsive design patterns.
 */

import { type ScrollState, type IOSHeaderBehavior, ElevationLevel } from '../types';

// ============================================================================
// Safe Area Utilities
// ============================================================================

export function getSafeAreaInsets() {
  try {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)').replace('px', ''), 10) || 0,
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)').replace('px', ''), 10) || 0,
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)').replace('px', ''), 10) || 0,
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)').replace('px', ''), 10) || 0,
    };
  } catch {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
}

export function applySafeAreaInsets(element: HTMLElement | null) {
  if (!element) return;
  
  const insets = getSafeAreaInsets();
  element.style.paddingTop = `${insets.top}px`;
  element.style.paddingBottom = `${insets.bottom}px`;
  element.style.paddingLeft = `${insets.left}px`;
  element.style.paddingRight = `${insets.right}px`;
}

// ============================================================================
// Scroll Behavior Utilities
// ============================================================================

export function calculateHeaderVisibility(
  scrollState: ScrollState,
  behavior: IOSHeaderBehavior
): boolean {
  const { scrollY, direction, isNearTop } = scrollState;
  const { autoHide, scrollThreshold } = behavior;

  if (!autoHide) return true;
  if (isNearTop) return true;
  
  if (scrollY > scrollThreshold) {
    return direction !== 'down';
  }
  
  return true;
}

export function getHeaderOpacity(
  scrollState: ScrollState,
  behavior: IOSHeaderBehavior
): number {
  const { scrollY } = scrollState;
  const { scrollThreshold } = behavior;
  
  if (scrollY < scrollThreshold) {
    return Math.max(0.5, 1 - (scrollY / scrollThreshold) * 0.5);
  }
  
  return 0.5;
}

export function shouldUseBlur(
  scrollState: ScrollState,
  behavior: IOSHeaderBehavior
): boolean {
  const { isScrolled } = scrollState;
  const { enableBlur } = behavior;
  
  return enableBlur && isScrolled;
}

// ============================================================================
// Style Generation Utilities
// ============================================================================

export function generateHeaderStyles(
  scrollState: ScrollState,
  behavior: IOSHeaderBehavior,
  elevation: ElevationLevel
) {
  const isVisible = calculateHeaderVisibility(scrollState, behavior);
  const opacity = getHeaderOpacity(scrollState, behavior);
  const useBlur = shouldUseBlur(scrollState, behavior);
  
  const baseStyles = {
    transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
    opacity: isVisible ? 1 : 0,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const blurStyles = useBlur ? {
    backdropFilter: 'blur(20px) saturate(180%)',
    backgroundColor: `rgba(255, 255, 255, ${opacity})`
  } : {};

  const elevationStyles = getElevationStyles(elevation, scrollState.isScrolled);

  return { ...baseStyles, ...blurStyles, ...elevationStyles };
}

function getElevationStyles(elevation: ElevationLevel, isScrolled: boolean) {
  if (!isScrolled && elevation !== ElevationLevel.BLUR) {
    return { boxShadow: 'none' };
  }

  switch (elevation) {
    case ElevationLevel.NONE:
      return { boxShadow: 'none' };
    case ElevationLevel.LOW:
      return { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' };
    case ElevationLevel.MEDIUM:
      return { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' };
    case ElevationLevel.HIGH:
      return { boxShadow: '0 10px 15px rgba(0, 0, 0, 0.15)' };
    case ElevationLevel.BLUR:
      return { 
        boxShadow: isScrolled ? '0 1px 0 rgba(0, 0, 0, 0.1)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.05)' : 'none'
      };
    default:
      return { boxShadow: 'none' };
  }
}

// ============================================================================
// Content Spacing Utilities
// ============================================================================

export function calculateContentSpacing(
  headerHeight: number,
  safeAreaTop: number,
  behavior: IOSHeaderBehavior
): number {
  const { stickyBehavior, safeAreaInsets } = behavior;
  
  let spacing = headerHeight;
  
  if (safeAreaInsets) {
    spacing += safeAreaTop;
  }
  
  if (stickyBehavior === 'static') {
    spacing = 0;
  }
  
  return spacing;
}

export function generateContentStyles(
  headerHeight: number,
  safeAreaTop: number,
  behavior: IOSHeaderBehavior
) {
  const paddingTop = calculateContentSpacing(headerHeight, safeAreaTop, behavior);
  
  return {
    paddingTop: `${paddingTop}px`,
    minHeight: `calc(100vh - ${paddingTop}px)`
  };
}

// ============================================================================
// Responsive Utilities
// ============================================================================

export function getResponsiveHeaderHeight(isCompact: boolean): number {
  return isCompact ? 64 : 72;
}

export function getResponsiveFontSize(isCompact: boolean, baseSize: 'sm' | 'md' | 'lg' | 'xl'): string {
  const sizeMap = {
    sm: isCompact ? 'text-sm' : 'text-base',
    md: isCompact ? 'text-base' : 'text-lg',
    lg: isCompact ? 'text-lg' : 'text-xl',
    xl: isCompact ? 'text-xl' : 'text-2xl'
  };
  
  return sizeMap[baseSize];
}

export function getResponsivePadding(isCompact: boolean): string {
  return isCompact ? 'px-4 py-3' : 'px-6 py-4';
}

// ============================================================================
// Animation Utilities
// ============================================================================

export const HEADER_TRANSITIONS = {
  show: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  hide: 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.6, 1)',
  blur: 'backdrop-filter 0.2s ease-out, background-color 0.2s ease-out',
  elevation: 'box-shadow 0.15s ease-out, border-bottom 0.15s ease-out'
} as const;

export function createSpringTransition(property: string, stiffness: number = 300, damping: number = 30): string {
  const duration = Math.sqrt(stiffness / damping) * 0.1;
  return `${property} ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1)`;
}