/**
 * iOS-Style App Header Component
 * 
 * Header variant for the main application pages with iOS-style design
 * Features: App title, action buttons, brand consistency, iOS animations
 */

import { cn } from '../../../lib/utils';
import { AppHeaderProps } from '../types';
import { HeaderBrand } from '../components/HeaderBrand';
import { HeaderActions } from '../components/HeaderActions';
import { PawPrint, Sparkles } from 'lucide-react';

// ============================================================================
// Component Styles
// ============================================================================

const APP_HEADER_STYLES = `
  flex items-center justify-between w-full h-full
  transition-all duration-300 ease-out
`;

const BRAND_CONTAINER_STYLES = `
  flex items-center flex-1 min-w-0
  transition-all duration-300 ease-out
`;

const ACTION_CONTAINER_STYLES = `
  flex items-center flex-shrink-0 ml-4
  transition-all duration-300 ease-out
`;

// ============================================================================
// Main Component
// ============================================================================

export function AppHeader({
  title,
  actions = [],
  sticky: _sticky = true,
  className
}: AppHeaderProps) {
  
  // Filter visible actions and group by position
  const visibleActions = actions.filter(action => action.visible !== false);
  
  return (
    <div className={cn(APP_HEADER_STYLES, className)}>
      {/* Brand Section with iOS-style branding */}
      <div className={BRAND_CONTAINER_STYLES}>
        {/* App icon with subtle animation */}
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
        
        {/* Title with iOS typography */}
        <HeaderBrand 
          title={title}
          className="flex-1 min-w-0"
        />
      </div>
      
      {/* Actions Section with iOS-style spacing */}
      {visibleActions.length > 0 && (
        <div className={ACTION_CONTAINER_STYLES}>
          <HeaderActions 
            actions={visibleActions}
            className=""
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Display Name for DevTools
// ============================================================================

AppHeader.displayName = 'AppHeader';