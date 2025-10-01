/**
 * iOS-Style Activities Header Component
 * 
 * Header variant for activity list and timeline pages with iOS-style design
 * Features: Pet avatar, activity context, search/filter actions, iOS layout
 */

import { cn } from '../../../lib/utils';
import { ActivitiesHeaderProps, PetPhotoSize, ActionVariant, ActionPosition } from '../types';
import { HeaderNavigation } from '../components/HeaderNavigation';
import { HeaderActions } from '../components/HeaderActions';
import { PetPhoto } from '../components/PetPhoto';
import { Calendar, Filter, Search } from 'lucide-react';

// ============================================================================
// Component Styles
// ============================================================================

const ACTIVITIES_HEADER_STYLES = `
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

export function ActivitiesHeader({
  pet,
  title = 'Activities',
  showBackButton = true,
  backAction,
  showPetAvatar = true,
  actions = [],
  sticky: _sticky = true,
  className
}: ActivitiesHeaderProps) {

  // ========================================================================
  // Default Actions for Activities
  // ========================================================================

  const defaultActions = [
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      handler: () => {
        // Search implementation
      },
      variant: ActionVariant.IOS_SECONDARY,
      position: ActionPosition.TRAILING,
      visible: true
    },
    {
      id: 'filter',
      label: 'Filter',
      icon: Filter,
      handler: () => {
        // Filter implementation
      },
      variant: ActionVariant.IOS_SECONDARY,
      position: ActionPosition.TRAILING,
      visible: true
    }
  ];

  // Merge provided actions with defaults
  const allActions = [...actions, ...defaultActions.filter(
    defaultAction => !actions.some(action => action.id === defaultAction.id)
  )];

  const visibleActions = allActions.filter(action => action.visible !== false);

  // ========================================================================
  // Generate Subtitle
  // ========================================================================

  const generateSubtitle = () => {
    if (pet) {
      return `${pet.name}'s Timeline`;
    }
    return 'Pet Activities & Memories';
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className={cn(ACTIVITIES_HEADER_STYLES, className)}>
      {/* Navigation Section */}
      {showBackButton && (
        <HeaderNavigation
          showBackButton={showBackButton}
          backAction={backAction}
          breadcrumbs={[]}
          className="flex-shrink-0"
        />
      )}

      {/* Title and Pet Info Section */}
      <div className={TITLE_CONTAINER_STYLES}>
        {/* Pet Avatar (if provided and enabled) */}
        {showPetAvatar && pet && (
          <div className="flex-shrink-0 mr-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm border-2 border-white transition-all duration-300 ease-out hover:shadow-md hover:scale-105">
                <PetPhoto
                  pet={pet}
                  size={PetPhotoSize.SMALL}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Activity indicator dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border border-white shadow-sm">
                <Calendar className="w-1.5 h-1.5 text-white m-auto mt-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* Title and Subtitle */}
        <div className="flex-1 min-w-0">
          <div className={TITLE_STYLES}>
            <span className="truncate block">{title}</span>
          </div>
          <div className={SUBTITLE_STYLES}>
            <span className="truncate block">{generateSubtitle()}</span>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      {visibleActions.length > 0 && (
        <div className="flex items-center flex-shrink-0">
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

ActivitiesHeader.displayName = 'ActivitiesHeader';