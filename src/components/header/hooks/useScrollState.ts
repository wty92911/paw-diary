/**
 * iOS-Style Scroll State Management Hook
 * 
 * Tracks scroll position, direction, and provides smart header behavior
 * similar to iOS native apps with smooth transitions and performance optimization.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { type UseScrollStateReturn, type ScrollState } from '../types';

interface UseScrollStateOptions {
  threshold?: number;
  hideOnScrollDown?: boolean;
  element?: HTMLElement | null;
}

export function useScrollState(options: UseScrollStateOptions = {}): UseScrollStateReturn {
  const {
    threshold = 100,
    hideOnScrollDown = false,
    element = null
  } = options;

  // State management
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollY: 0,
    isScrolled: false,
    direction: 'none',
    isNearTop: true
  });

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [headerHeight] = useState(64); // Standard iOS header height
  
  // Refs for performance optimization
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Optimized scroll handler with requestAnimationFrame
  const updateScrollState = useCallback(() => {
    const scrollY = element ? element.scrollTop : window.scrollY;
    const deltaY = scrollY - lastScrollY.current;
    
    // Determine scroll direction
    let direction: ScrollState['direction'] = 'none';
    if (Math.abs(deltaY) > 1) {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    // Update scroll state
    const newScrollState: ScrollState = {
      scrollY,
      isScrolled: scrollY > threshold,
      direction,
      isNearTop: scrollY < 20
    };

    setScrollState(newScrollState);

    // Handle header visibility for auto-hide behavior
    if (hideOnScrollDown) {
      if (direction === 'down' && scrollY > threshold) {
        setIsHeaderVisible(false);
      } else if (direction === 'up' || scrollY < threshold) {
        setIsHeaderVisible(true);
      }
    }

    lastScrollY.current = scrollY;
    ticking.current = false;
  }, [element, threshold, hideOnScrollDown]);

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScrollState);
      ticking.current = true;
    }
  }, [updateScrollState]);

  // Setup scroll listeners
  useEffect(() => {
    const targetElement = element || window;
    
    // Initial state
    updateScrollState();
    
    // Add scroll listener
    targetElement.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup
    return () => {
      targetElement.removeEventListener('scroll', handleScroll);
    };
  }, [element, handleScroll, updateScrollState]);

  // Calculate content padding top based on header visibility
  const contentPaddingTop = isHeaderVisible ? headerHeight : 0;

  return {
    scrollState,
    isHeaderVisible,
    headerHeight,
    contentPaddingTop
  };
}