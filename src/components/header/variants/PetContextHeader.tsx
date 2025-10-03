/**
 * iOS-Style Pet Context Header Component
 * 
 * Header variant for pet-specific pages with iOS-style design
 * Features: Pet photo, name, breadcrumbs, iOS navigation patterns
 */

import React from 'react';
import { cn } from '../../../lib/utils';
import { type PetContextHeaderProps, PetPhotoSize } from '../types';
import { HeaderNavigation } from '../components/HeaderNavigation';
import { PetPhoto } from '../components/PetPhoto';
import { ChevronRight, Heart } from 'lucide-react';

// ============================================================================
// Component Styles
// ============================================================================

const PET_HEADER_STYLES = `
  flex items-center justify-between w-full h-full
  transition-all duration-300 ease-out
`;

const PET_INFO_CONTAINER_STYLES = `
  flex items-center flex-1 min-w-0 mx-4
  transition-all duration-300 ease-out
`;

const BREADCRUMB_STYLES = `
  flex items-center text-sm text-orange-600/80
  transition-colors duration-200
`;

const PET_NAME_STYLES = `
  font-semibold text-orange-900 text-lg
  transition-colors duration-200
`;

const PET_SPECIES_STYLES = `
  text-sm text-orange-700/70 mt-0.5
  transition-colors duration-200
`;

// ============================================================================
// Main Component
// ============================================================================

export function PetContextHeader({
  pet,
  breadcrumbs = [],
  showBackButton = true,
  backAction,
  showPetPhoto = true,
  photoSize = PetPhotoSize.MEDIUM,
  showSpecies = true,
  sticky: _sticky = true,
  className
}: PetContextHeaderProps) {

  // ========================================================================
  // Photo Size Mapping
  // ========================================================================

  const photoSizeMap = {
    [PetPhotoSize.SMALL]: 'w-8 h-8',
    [PetPhotoSize.MEDIUM]: 'w-10 h-10',
    [PetPhotoSize.LARGE]: 'w-12 h-12'
  };

  const photoClasses = photoSizeMap[photoSize];

  // ========================================================================
  // Render Breadcrumbs
  // ========================================================================

  const renderBreadcrumbs = () => {
    if (!breadcrumbs.length) return null;

    return (
      <div className={BREADCRUMB_STYLES}>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 mx-1 text-orange-500/60" />
            )}
            <span className={cn(
              "transition-colors duration-200",
              crumb.active 
                ? "text-orange-800 font-medium" 
                : "text-orange-600/70 hover:text-orange-700"
            )}>
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className={cn(PET_HEADER_STYLES, className)}>
      {/* Navigation Section */}
      {showBackButton && (
        <HeaderNavigation
          showBackButton={showBackButton}
          backAction={backAction}
          breadcrumbs={[]}
          className="flex-shrink-0"
        />
      )}

      {/* Pet Information Section */}
      <div className={PET_INFO_CONTAINER_STYLES}>
        {/* Pet Photo with iOS-style styling */}
        {showPetPhoto && (
          <div className="flex-shrink-0 mr-3">
            <div className="relative">
              <div className={cn(
                photoClasses,
                "rounded-full overflow-hidden shadow-sm border-2 border-white",
                "transition-all duration-300 ease-out",
                "hover:shadow-md hover:scale-105"
              )}>
                <PetPhoto
                  pet={pet}
                  size={photoSize}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Heart indicator for active pet */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center shadow-sm">
                <Heart className="w-2.5 h-2.5 text-white fill-current" />
              </div>
            </div>
          </div>
        )}

        {/* Pet Name and Info */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumbs */}
          {renderBreadcrumbs()}

          {/* Pet Name */}
          <div className={PET_NAME_STYLES}>
            <span className="truncate block">{pet.name}</span>
          </div>

          {/* Pet Species */}
          {showSpecies && (
            <div className={PET_SPECIES_STYLES}>
              <span className="truncate block">{pet.species}</span>
            </div>
          )}
        </div>
      </div>

      {/* Empty trailing section for balance */}
      <div className="flex-shrink-0 w-12" aria-hidden="true" />
    </div>
  );
}

// ============================================================================
// Display Name for DevTools
// ============================================================================

PetContextHeader.displayName = 'PetContextHeader';