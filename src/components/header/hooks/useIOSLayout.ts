/**
 * iOS-Style Layout Management Hook
 * 
 * Provides iOS-style safe area management, dynamic layout calculations,
 * and responsive behavior similar to iOS native apps.
 */

import { useState, useEffect, useCallback } from 'react';
import { type UseIOSLayoutReturn } from '../types';

interface UseIOSLayoutOptions {
  enableSafeArea?: boolean;
  headerHeightDesktop?: number;
  headerHeightMobile?: number;
  compactBreakpoint?: number;
}

export function useIOSLayout(options: UseIOSLayoutOptions = {}): UseIOSLayoutReturn {
  const {
    enableSafeArea = true,
    headerHeightDesktop = 72,
    headerHeightMobile = 64,
    compactBreakpoint = 768
  } = options;

  // State management
  const [safeAreaTop, setSafeAreaTop] = useState(0);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);
  const [isCompact, setIsCompact] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(headerHeightDesktop);

  // Safe area detection
  const detectSafeArea = useCallback(() => {
    if (!enableSafeArea) return;

    try {
      // Get CSS environment variables for safe area
      const safeAreaTopValue = getComputedStyle(document.documentElement)
        .getPropertyValue('env(safe-area-inset-top)');
      const safeAreaBottomValue = getComputedStyle(document.documentElement)
        .getPropertyValue('env(safe-area-inset-bottom)');

      // Parse values (fallback to 0 if not supported)
      const topInset = safeAreaTopValue ? parseInt(safeAreaTopValue.replace('px', ''), 10) : 0;
      const bottomInset = safeAreaBottomValue ? parseInt(safeAreaBottomValue.replace('px', ''), 10) : 0;

      setSafeAreaTop(Math.max(0, topInset));
      setSafeAreaBottom(Math.max(0, bottomInset));
    } catch {
      // Fallback for browsers that don't support env() variables
      setSafeAreaTop(0);
      setSafeAreaBottom(0);
    }
  }, [enableSafeArea]);

  // Responsive layout calculations
  const updateLayout = useCallback(() => {
    const windowWidth = window.innerWidth;
    const isCurrentlyCompact = windowWidth < compactBreakpoint;
    
    setIsCompact(isCurrentlyCompact);
    setHeaderHeight(isCurrentlyCompact ? headerHeightMobile : headerHeightDesktop);
  }, [compactBreakpoint, headerHeightDesktop, headerHeightMobile]);

  // Setup resize and orientation change listeners
  useEffect(() => {
    // Initial calculations
    detectSafeArea();
    updateLayout();

    // Event listeners
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', () => {
      // Delay to allow orientation change to complete
      setTimeout(() => {
        detectSafeArea();
        updateLayout();
      }, 100);
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
    };
  }, [detectSafeArea, updateLayout]);

  // Watch for changes in CSS environment variables
  useEffect(() => {
    // Check for safe area changes periodically
    const interval = setInterval(detectSafeArea, 1000);
    return () => clearInterval(interval);
  }, [detectSafeArea]);

  // Calculate total content offset including safe area and header
  const contentOffset = safeAreaTop + headerHeight;

  return {
    safeAreaTop,
    safeAreaBottom,
    headerHeight,
    contentOffset,
    isCompact
  };
}