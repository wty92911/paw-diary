/**
 * Pet Photo Component
 * 
 * Displays pet profile photo with different sizes and fallback
 * Provides consistent pet photo rendering across header variants
 */

import { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Pet, PetPhotoSize } from '../types';

// ============================================================================
// Component Props
// ============================================================================

interface PetPhotoProps {
  pet: Pet;
  size: PetPhotoSize;
  className?: string;
}

// ============================================================================
// Size Constants
// ============================================================================

const PHOTO_SIZES = {
  [PetPhotoSize.SMALL]: 'h-8 w-8',
  [PetPhotoSize.MEDIUM]: 'h-12 w-12', 
  [PetPhotoSize.LARGE]: 'h-16 w-16'
};

const ICON_SIZES = {
  [PetPhotoSize.SMALL]: 'h-4 w-4',
  [PetPhotoSize.MEDIUM]: 'h-6 w-6',
  [PetPhotoSize.LARGE]: 'h-8 w-8'
};

// ============================================================================
// Component Styles
// ============================================================================

const BASE_PHOTO_STYLES = 'rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-background shadow-sm';
const FALLBACK_STYLES = 'text-muted-foreground';

// ============================================================================
// Main Component
// ============================================================================

export function PetPhoto({ pet, size, className }: PetPhotoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };
  
  // Handle image load success
  const handleImageLoad = () => {
    setImageLoading(false);
  };
  
  // Determine photo source
  const hasValidPhoto = pet.photo_path && !imageError;
  
  const photoClasses = cn(
    BASE_PHOTO_STYLES,
    PHOTO_SIZES[size],
    className
  );
  
  return (
    <div 
      className={photoClasses}
      role="img"
      aria-label={`${pet.name}'s profile photo`}
    >
      {hasValidPhoto ? (
        <>
          {imageLoading && (
            <div className={cn(FALLBACK_STYLES, 'animate-pulse')}>
              <User className={ICON_SIZES[size]} />
            </div>
          )}
          <img
            src={pet.photo_path}
            alt={`${pet.name}'s profile photo`}
            className={cn(
              'h-full w-full object-cover',
              imageLoading ? 'opacity-0' : 'opacity-100'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        </>
      ) : (
        // Fallback icon when no photo or error
        <User className={cn(ICON_SIZES[size], FALLBACK_STYLES)} />
      )}
    </div>
  );
}

// ============================================================================
// Display Name for DevTools
// ============================================================================

PetPhoto.displayName = 'PetPhoto';