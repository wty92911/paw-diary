/**
 * Header Component Constants
 *
 * Centralized configuration for consistent header behavior across all pages
 */

import { DEFAULT_HEADER_THEME } from './types';

/**
 * Common header configuration defaults
 * Shared by all header instances for consistency
 */
export const DEFAULT_HEADER_CONFIG = {
  sticky: true,
  scrollBehavior: 'auto' as const,
  contentPadding: false,
  theme: DEFAULT_HEADER_THEME,
};
