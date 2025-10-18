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

  // Safe area detection - compatible with iOS and Android
  const detectSafeArea = useCallback(() => {
    if (!enableSafeArea) return;

    try {
      // Method 1: Try CSS.supports() for env() (most reliable)
      if (typeof CSS !== 'undefined' && CSS.supports) {
        const supportsEnv = CSS.supports('padding-top: env(safe-area-inset-top)');

        if (supportsEnv) {
          // Create a temporary element to measure actual safe area
          const testDiv = document.createElement('div');
          testDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 1px;
            height: env(safe-area-inset-top, 0px);
            visibility: hidden;
            pointer-events: none;
          `;
          document.body.appendChild(testDiv);

          const topRect = testDiv.getBoundingClientRect();
          const topInset = topRect.height;

          // Test bottom inset
          testDiv.style.height = 'env(safe-area-inset-bottom, 0px)';
          const bottomRect = testDiv.getBoundingClientRect();
          const bottomInset = bottomRect.height;

          document.body.removeChild(testDiv);

          setSafeAreaTop(Math.max(0, Math.round(topInset)));
          setSafeAreaBottom(Math.max(0, Math.round(bottomInset)));
          return;
        }
      }

      // Method 2: Fallback - detect based on viewport characteristics
      // This helps on Android where env() might not be supported in older WebViews
      const isLandscape = window.innerWidth > window.innerHeight;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      // iOS specific detection
      if (isIOS) {
        // iPhone X and newer have notch in portrait mode
        const hasNotch = window.screen.height >= 812 && window.screen.width >= 375;
        if (hasNotch && !isLandscape) {
          setSafeAreaTop(44); // Typical iOS notch height
          setSafeAreaBottom(34); // Typical iOS home indicator
        } else {
          setSafeAreaTop(20); // Standard iOS status bar
          setSafeAreaBottom(0);
        }
        return;
      }

      // Android specific detection
      if (isAndroid) {
        // Android status bar is typically 24dp (varies by device)
        // At standard density (mdpi), 24dp = 24px
        // We'll use a reasonable default
        const density = window.devicePixelRatio || 1;
        const statusBarHeight = Math.round(24 * density);
        setSafeAreaTop(statusBarHeight);
        setSafeAreaBottom(0); // Android typically has software buttons or gestures
        return;
      }

      // Desktop/Other - no safe area
      setSafeAreaTop(0);
      setSafeAreaBottom(0);
    } catch (error) {
      console.warn('Safe area detection failed:', error);
      // Fallback for any errors
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