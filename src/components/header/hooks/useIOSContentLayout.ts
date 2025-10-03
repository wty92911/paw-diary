import { useIOSLayout } from '../hooks/useIOSLayout';

/**
 * Convenience hook for iOS content layout
 * Returns content offset and safe area values for layout calculations
 */
export function useIOSContentLayout() {
  const { contentOffset, safeAreaTop, safeAreaBottom, headerHeight } = useIOSLayout();

  return {
    contentOffset,
    safeAreaTop,
    safeAreaBottom,
    headerHeight,
    generateContentStyles: (customOffset?: number) => ({
      paddingTop: `${customOffset || contentOffset}px`,
      paddingBottom: safeAreaBottom > 0 ? `${safeAreaBottom}px` : undefined,
      minHeight: `calc(100vh - ${customOffset || contentOffset}px)`
    })
  };
}
