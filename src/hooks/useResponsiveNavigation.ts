import { useState, useEffect } from 'react';

/**
 * Hook for detecting mobile viewport and managing responsive navigation patterns
 * Follows the project's mobile-first responsive design approach
 */
export interface UseResponsiveNavigationState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewportWidth: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UseResponsiveNavigationActions {
  // Currently no actions needed, but structure allows for future expansion
}

// Breakpoints following TailwindCSS conventions
const BREAKPOINTS = {
  mobile: 768, // max-width for mobile
  tablet: 1024, // max-width for tablet
} as const;

export function useResponsiveNavigation(): UseResponsiveNavigationState &
  UseResponsiveNavigationActions {
  const [state, setState] = useState<UseResponsiveNavigationState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      const isMobile = width < BREAKPOINTS.mobile;
      const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
      const isDesktop = width >= BREAKPOINTS.tablet;

      setState({
        isMobile,
        isTablet,
        isDesktop,
        viewportWidth: width,
      });
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...state,
    // Future actions can be added here
  };
}

/**
 * Custom hook for media query matching
 * Provides a more specific hook for common responsive patterns
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
