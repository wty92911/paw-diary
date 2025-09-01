import React from 'react';
import { cn } from '../../lib/utils';
import { Heart, Plus, Sparkles } from 'lucide-react';

interface AddPetThumbnailProps {
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
}

/**
 * AddPetThumbnail provides a dedicated thumbnail for adding new pets
 * Styled consistently with pet thumbnails but optimized for the add flow
 *
 * Features:
 * - Consistent styling with PetThumbnail
 * - Large "+" icon with friendly messaging
 * - Gradient background with subtle pattern
 * - Hover and active states
 * - Accessibility support
 */
export function AddPetThumbnail({ onClick, className, isActive = false }: AddPetThumbnailProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden',
        'cursor-pointer select-none',
        'transform-gpu will-change-transform transition-all duration-200',
        isActive && 'scale-105',
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Add new pet"
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-orange-400/25 via-yellow-400/20 to-orange-500/30"
        aria-hidden="true"
      />

      {/* Pattern overlay for texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* Animated sparkles background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <Sparkles className="absolute top-6 right-8 w-4 h-4 text-yellow-400/40 animate-pulse" />
        <Sparkles className="absolute bottom-12 left-6 w-3 h-3 text-orange-400/30 animate-pulse delay-100" />
        <Sparkles className="absolute top-20 left-12 w-2 h-2 text-yellow-300/50 animate-pulse delay-200" />
      </div>

      {/* Main content */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="text-center text-white">
          {/* Add icon container */}
          <div
            className={cn(
              'w-32 h-32 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30',
              'flex items-center justify-center transition-all duration-200',
              'hover:bg-white/25 hover:border-white/40 hover:scale-105 active:scale-95',
              isActive && 'bg-white/30 border-white/50 scale-110',
            )}
          >
            <Plus className="w-16 h-16 drop-shadow-lg" aria-hidden="true" />
          </div>

          {/* Add pet text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight drop-shadow-lg">Add New Pet</h2>
            <p className="text-lg opacity-90 drop-shadow">Welcome your furry friend</p>
          </div>

          {/* Subtle call-to-action */}
          <div className="mt-4 text-sm opacity-75">
            <p>Tap to get started</p>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-4 right-4 text-white/25" aria-hidden="true">
        <Heart className="w-7 h-7 fill-current drop-shadow-lg animate-pulse" />
      </div>

      {/* Bottom decorative paw */}
      <div className="absolute bottom-4 left-4 text-white/25" aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="drop-shadow-lg"
        >
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C22.1 9 23 9.9 23 11C23 12.1 22.1 13 21 13C19.9 13 19 12.1 19 11C19 9.9 19.9 9 21 9ZM3 9C4.1 9 5 9.9 5 11C5 12.1 4.1 13 3 13C1.9 13 1 12.1 1 11C1 9.9 1.9 9 3 9ZM15 7C16.1 7 17 7.9 17 9C17 10.1 16.1 11 15 11C13.9 11 13 10.1 13 9C13 7.9 13.9 7 15 7ZM9 7C10.1 7 11 7.9 11 9C11 10.1 10.1 11 9 11C7.9 11 7 10.1 7 9C7 7.9 7.9 7 9 7ZM12 15C15.9 15 19 17.6 19 20.5C19 21.3 18.3 22 17.5 22H6.5C5.7 22 5 21.3 5 20.5C5 17.6 8.1 15 12 15Z" />
        </svg>
      </div>

      {/* Touch ripple effect for iOS-like feedback */}
      <div
        className="absolute inset-0 bg-white/0 hover:bg-white/5 active:bg-white/10 transition-colors duration-150"
        aria-hidden="true"
      />

      {/* Active state overlay */}
      {isActive && (
        <div
          className="absolute inset-0 bg-white/5 border-2 border-white/40 rounded-xl"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * Loading skeleton for Add Pet thumbnail
 */
export function AddPetThumbnailSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse',
        className,
      )}
      role="status"
      aria-label="Loading add pet option"
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
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          {/* Icon placeholder */}
          <div className="w-32 h-32 bg-white/30 rounded-full mx-auto" />

          {/* Text placeholders */}
          <div className="space-y-2">
            <div className="h-6 bg-white/30 rounded w-32 mx-auto" />
            <div className="h-5 bg-white/20 rounded w-40 mx-auto" />
            <div className="h-4 bg-white/15 rounded w-24 mx-auto" />
          </div>
        </div>
      </div>

      {/* Icon placeholders */}
      <div className="absolute top-4 right-4">
        <div className="w-7 h-7 bg-white/20 rounded-full" />
      </div>

      <div className="absolute bottom-4 left-4">
        <div className="w-6 h-6 bg-white/20 rounded-full" />
      </div>
    </div>
  );
}
