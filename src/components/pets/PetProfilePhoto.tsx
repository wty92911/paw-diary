import { useState, useEffect } from 'react';
import { type Pet } from '../../lib/types';
import { cn } from '../../lib/utils';
import { Camera, Loader2 } from 'lucide-react';
import { usePhotoState } from '../../hooks/usePhotoCache';

interface PetProfilePhotoProps {
  pet: Pet;
  size?: 'medium' | 'large' | 'hero';
  className?: string;
  showPlaceholder?: boolean;
}

export function PetProfilePhoto({
  pet,
  size = 'large',
  className,
  showPlaceholder = true,
}: PetProfilePhotoProps) {
  const { photoUrl, isLoading } = usePhotoState(pet.photo_path);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Show skeleton after 200ms delay to prevent flash
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowSkeleton(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [isLoading]);

  const sizeClasses = {
    medium: {
      container: 'w-24 h-24',
      image: 'w-20 h-20',
    },
    large: {
      container: 'w-80 h-80',
      image: 'w-72 h-72',
    },
    hero: {
      container: 'w-full h-96 md:h-[28rem]',
      image: 'w-80 h-80 md:w-96 md:h-96',
    },
  };

  const currentSizeClasses = sizeClasses[size];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl',
        currentSizeClasses.container,
        className,
      )}
    >
      {/* Blur background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${photoUrl})`,
          filter: 'blur(20px) brightness(0.7)',
          transform: 'scale(1.1)', // Prevent blur edges
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

      {/* Loading state with skeleton */}
      {showSkeleton && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-100/80">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-orange-600">Loading photo...</p>
          </div>
        </div>
      )}

      {/* Main photo */}
      <div className="absolute inset-0 flex items-center justify-center">
        {pet.photo_path || !showPlaceholder ? (
          <img
            src={photoUrl}
            alt={`Photo of ${pet.name}, a ${pet.species.toLowerCase()}`}
            className={cn(
              'object-cover rounded-2xl shadow-2xl border-4 border-white/20 backdrop-blur-sm',
              currentSizeClasses.image,
              isLoading && 'opacity-0',
              !isLoading && 'opacity-100 transition-opacity duration-300',
            )}
            loading="lazy"
            decoding="async"
          />
        ) : (
          showPlaceholder && (
            <div
              className={cn(
                'bg-orange-100/80 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-white/20 flex items-center justify-center',
                currentSizeClasses.image,
              )}
              role="img"
              aria-label={`No photo available for ${pet.name}`}
            >
              <div className="text-center text-orange-500">
                <Camera className="w-16 h-16 mx-auto mb-4" aria-hidden="true" />
                <p className="text-lg font-medium">No photo</p>
                <p className="text-sm opacity-75">Add a photo of {pet.name}</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Pet status indicator */}
      {pet.is_archived && (
        <div
          className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full"
          role="status"
          aria-label={`${pet.name} is archived`}
        >
          Archived
        </div>
      )}

      {/* Decorative paw print watermark */}
      <div className="absolute bottom-4 right-4 text-white/20" aria-hidden="true">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="drop-shadow-lg"
        >
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C22.1 9 23 9.9 23 11C23 12.1 22.1 13 21 13C19.9 13 19 12.1 19 11C19 9.9 19.9 9 21 9ZM3 9C4.1 9 5 9.9 5 11C5 12.1 4.1 13 3 13C1.9 13 1 12.1 1 11C1 9.9 1.9 9 3 9ZM15 7C16.1 7 17 7.9 17 9C17 10.1 16.1 11 15 11C13.9 11 13 10.1 13 9C13 7.9 13.9 7 15 7ZM9 7C10.1 7 11 7.9 11 9C11 10.1 10.1 11 9 11C7.9 11 7 10.1 7 9C7 7.9 7.9 7 9 7ZM12 15C15.9 15 19 17.6 19 20.5C19 21.3 18.3 22 17.5 22H6.5C5.7 22 5 21.3 5 20.5C5 17.6 8.1 15 12 15Z" />
        </svg>
      </div>
    </div>
  );
}

// Loading skeleton for photo
export function PetProfilePhotoSkeleton({
  size = 'large',
  className,
}: {
  size?: 'medium' | 'large' | 'hero';
  className?: string;
}) {
  const sizeClasses = {
    medium: 'w-24 h-24',
    large: 'w-80 h-80',
    hero: 'w-full h-96 md:h-[28rem]',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-100 to-yellow-100 animate-pulse',
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label="Loading pet photo"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-orange-400">
          <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin" aria-hidden="true" />
          <p className="text-sm">Loading photo...</p>
        </div>
      </div>
    </div>
  );
}
