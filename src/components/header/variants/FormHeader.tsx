/**
 * iOS-Style Form Header Component
 * 
 * Header variant for form and modal pages with iOS-style design
 * Features: Form title, back navigation, subtitle support, iOS typography
 */

import { cn } from '../../../lib/utils';
import { FormHeaderProps } from '../types';
import { HeaderNavigation } from '../components/HeaderNavigation';
import { Edit3, Save } from 'lucide-react';

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

      {/* Title Section with Form Icon */}
      <div className={TITLE_CONTAINER_STYLES}>
        {/* Form Icon */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
            <Edit3 className="w-4 h-4 text-white" />
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

      {/* Save Indicator (placeholder for form state) */}
      <div className="flex-shrink-0 mr-2">
        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center opacity-60">
          <Save className="w-3 h-3 text-green-600" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Display Name for DevTools
// ============================================================================

FormHeader.displayName = 'FormHeader';