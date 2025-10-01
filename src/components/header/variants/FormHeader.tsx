/**
 * iOS-Style Form Header Component
 * 
 * Header variant for form and modal pages with iOS-style design
 * Features: Form title, back navigation, subtitle support, iOS typography
 */

import { cn } from '../../../lib/utils';
import { FormHeaderProps } from '../types';
import { HeaderNavigation } from '../components/HeaderNavigation';
import { PawPrint, Sparkles } from 'lucide-react';

// ============================================================================
// Component Styles
// ============================================================================

const FORM_HEADER_STYLES = `
  flex items-center justify-between w-full h-full
  transition-all duration-300 ease-out
`;

const TITLE_CONTAINER_STYLES = `
  flex items-center flex-1 min-w-0 mx-4
  transition-all duration-300 ease-out
`;

const TITLE_STYLES = `
  font-semibold text-orange-900 text-lg
  transition-colors duration-200
`;

const SUBTITLE_STYLES = `
  text-sm text-orange-700/70 mt-0.5
  transition-colors duration-200
`;

// ============================================================================
// Main Component
// ============================================================================

export function FormHeader({
  title,
  showBackButton = true,
  backAction,
  subtitle,
  sticky: _sticky = true,
  className
}: FormHeaderProps) {

  return (
    <div className={cn(FORM_HEADER_STYLES, className)}>
      {/* Navigation Section */}
      {showBackButton && (
        <HeaderNavigation
          showBackButton={showBackButton}
          backAction={backAction}
          breadcrumbs={[]}
          className="flex-shrink-0"
        />
      )}

      {/* Title Section with App Logo */}
      <div className={TITLE_CONTAINER_STYLES}>
        {/* App Logo - consistent with HomePage */}
        <div className="flex items-center mr-3">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-sm">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            {/* Subtle sparkle effect */}
            <div className="absolute -top-1 -right-1 w-3 h-3 opacity-60">
              <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="flex-1 min-w-0">
          <div className={TITLE_STYLES}>
            <span className="truncate block">{title}</span>
          </div>
          {subtitle && (
            <div className={SUBTITLE_STYLES}>
              <span className="truncate block">{subtitle}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Display Name for DevTools
// ============================================================================

FormHeader.displayName = 'FormHeader';