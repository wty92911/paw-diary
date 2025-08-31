import React from 'react';
import { Pet } from '../../lib/types';
import { cn } from '../../lib/utils';
import { Calendar, Heart } from 'lucide-react';
import { usePhotoState } from '../../hooks/usePhotoCache';
interface PetThumbnailProps {
  pet: Pet;
  isActive?: boolean;
  onClick?: () => void;
  onTapToDetail?: (pet: Pet) => void;
  className?: string;
}

/**
 * PetThumbnail provides an immersive full-screen photo experience for pets
 * Similar to iOS Photos app with blurred background and overlay information
 *
 * Features:
 * - Full-screen photo with blurred backdrop
 * - Pet information overlay (name, age, breed)
 * - Smooth touch interactions
 * - Progressive loading states
 * - Accessibility support
 */
export function PetThumbnail({
  pet,
  isActive = false,
  onClick,
  onTapToDetail,
  className,
}: PetThumbnailProps) {
  const { photoUrl, isLoading } = usePhotoState(pet.photo_path);

  // Calculate pet age using native Date methods
  const getAgeString = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();

    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    if (years > 0) {
      return `${years}y${months > 0 ? ` ${months}m` : ''}`;
    }
    return `${months}m`;
  };

  const handleClick = () => {
    if (isLoading) return;

    // Priority: onTapToDetail for navigation to detail page, then onClick for other actions
    if (onTapToDetail) {
      onTapToDetail(pet);
    } else if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
      e.preventDefault();
      if (onTapToDetail) {
        onTapToDetail(pet);
      } else if (onClick) {
        onClick();
      }
    }
  };

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden',
        'cursor-pointer select-none',
        'transform-gpu will-change-transform transition-transform duration-150 ease-out',
        'active:scale-95 hover:scale-[1.02]',
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View ${pet.name}'s profile`}
      aria-describedby={`pet-${pet.id}-info`}
    >
      {/* Full-screen blurred background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${photoUrl})`,
          filter: 'blur(40px) brightness(0.3) saturate(1.2)',
          transform: 'scale(1.1)', // Prevent blur edge artifacts
        }}
        aria-hidden="true"
      />

      {/* Gradient overlays for better text readability */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"
        aria-hidden="true"
      />

      {/* Loading state with enhanced animation */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center text-white">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium opacity-90">Loading photo...</p>
          </div>
        </div>
      )}

      {/* Main pet photo */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        {pet.photo_path ? (
          <img
            src={photoUrl}
            alt={`Photo of ${pet.name}, a ${pet.breed || pet.species.toLowerCase()}`}
            className={cn(
              'max-w-full max-h-full object-cover rounded-3xl shadow-2xl',
              'border-4 border-white/20 backdrop-blur-sm',
              'transform-gpu transition-all duration-300 ease-out',
              isActive && 'scale-105',
              isLoading && 'opacity-0 scale-95 blur-sm',
              !isLoading && 'opacity-100 scale-100 blur-0',
            )}
            loading="eager" // Prioritize loading for thumbnails
            decoding="async"
            style={{
              transition: 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
            }}
          />
        ) : (
          // Placeholder for pets without photos
          <div
            className={cn(
              'w-80 h-80 bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl',
              'border-4 border-white/20 flex items-center justify-center',
              'transform-gpu transition-all duration-500',
              isActive && 'scale-105',
            )}
            role="img"
            aria-label={`No photo available for ${pet.name}`}
          >
            <div className="text-center text-white/80">
              <Heart className="w-16 h-16 mx-auto mb-4 fill-current" aria-hidden="true" />
              <p className="text-xl font-medium">No Photo</p>
              <p className="text-sm opacity-75 mt-1">Tap to add one</p>
            </div>
          </div>
        )}
      </div>

      {/* Pet information overlay */}
      <div id={`pet-${pet.id}-info`} className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="space-y-3">
          {/* Pet name */}
          <h2 className="text-3xl font-bold tracking-tight drop-shadow-lg">{pet.name}</h2>

          {/* Pet details */}
          <div className="flex items-center gap-4 text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 opacity-75" aria-hidden="true" />
              <span className="font-medium">{getAgeString(pet.birth_date)}</span>
            </div>

            {pet.breed && (
              <>
                <div className="w-1 h-1 rounded-full bg-white/60" aria-hidden="true" />
                <span className="opacity-90">{pet.breed}</span>
              </>
            )}
          </div>

          {/* Additional pet info */}
          <div className="flex items-center gap-4 text-base opacity-80">
            <span className="capitalize">{pet.species.toLowerCase()}</span>

            {pet.gender && (
              <>
                <div className="w-1 h-1 rounded-full bg-white/60" aria-hidden="true" />
                <span>{pet.gender}</span>
              </>
            )}

            {pet.color && (
              <>
                <div className="w-1 h-1 rounded-full bg-white/60" aria-hidden="true" />
                <span>{pet.color}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {pet.is_archived && (
          <div
            className="bg-gray-800/80 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full"
            role="status"
            aria-label={`${pet.name} is archived`}
          >
            Archived
          </div>
        )}
      </div>

      {/* Decorative paw print - positioned differently for thumbnail */}
      <div className="absolute top-4 right-4 text-white/20" aria-hidden="true">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="drop-shadow-lg"
        >
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C22.1 9 23 9.9 23 11C23 12.1 22.1 13 21 13C19.9 13 19 12.1 19 11C19 9.9 19.9 9 21 9ZM3 9C4.1 9 5 9.9 5 11C5 12.1 4.1 13 3 13C1.9 13 1 12.1 1 11C1 9.9 1.9 9 3 9ZM15 7C16.1 7 17 7.9 17 9C17 10.1 16.1 11 15 11C13.9 11 13 10.1 13 9C13 7.9 13.9 7 15 7ZM9 7C10.1 7 11 7.9 11 9C11 10.1 10.1 11 9 11C7.9 11 7 10.1 7 9C7 7.9 7.9 7 9 7ZM12 15C15.9 15 19 17.6 19 20.5C19 21.3 18.3 22 17.5 22H6.5C5.7 22 5 21.3 5 20.5C5 17.6 8.1 15 12 15Z" />
        </svg>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div
          className="absolute inset-0 border-4 border-white/40 rounded-2xl pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Touch ripple effect for iOS-like feedback */}
      <div
        className="absolute inset-0 bg-white/0 hover:bg-white/5 active:bg-white/10 transition-colors duration-150"
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Loading skeleton for pet thumbnails
 */
export function PetThumbnailSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse',
        className,
      )}
      role="status"
      aria-label="Loading pet thumbnail"
    >
      {/* Background shimmer effect */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
        style={{
          backgroundSize: '200% 100%',
        }}
        aria-hidden="true"
      />

      {/* Content placeholders */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="space-y-3">
          {/* Name placeholder */}
          <div className="h-8 bg-white/30 rounded-lg w-32" />

          {/* Details placeholder */}
          <div className="flex gap-4">
            <div className="h-6 bg-white/20 rounded w-16" />
            <div className="h-6 bg-white/20 rounded w-20" />
          </div>

          {/* Additional info placeholder */}
          <div className="flex gap-4">
            <div className="h-5 bg-white/15 rounded w-12" />
            <div className="h-5 bg-white/15 rounded w-16" />
          </div>
        </div>
      </div>

      {/* Icon placeholders */}
      <div className="absolute top-4 right-4">
        <div className="w-7 h-7 bg-white/20 rounded-full" />
      </div>
    </div>
  );
}
