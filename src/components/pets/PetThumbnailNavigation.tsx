import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Pet } from '../../lib/types';
import { cn } from '../../lib/utils';
import { PetThumbnail, AddPetThumbnail, PetThumbnailSkeleton } from './PetThumbnail';
import {
  useTouchThumbnailNavigation,
  useThumbnailSwipeGestures,
} from '../../hooks/usePetThumbnailNavigation';

interface PetThumbnailNavigationProps {
  pets: Pet[];
  onPetSelect?: (pet: Pet) => void;
  onAddPet?: () => void;
  className?: string;
  showAddPetCard?: boolean;
  enableElasticFeedback?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

/**
 * PetThumbnailNavigation provides an immersive iOS-like gallery experience
 * with horizontal-only swiping and smooth GPU-accelerated transitions
 *
 * Features:
 * - Horizontal-only navigation (prevents vertical scroll conflicts)
 * - Smooth transitions <300ms with 60fps target
 * - Elastic edge feedback when swiping beyond bounds
 * - "Add Pet" card at the far right
 * - Touch gesture optimization for mobile
 * - Progressive image loading
 * - Memory management (max 3 mounted thumbnails)
 */
export function PetThumbnailNavigation({
  pets,
  onPetSelect,
  onAddPet,
  className,
  showAddPetCard = true,
  enableElasticFeedback = true,
  autoPlay = false,
  autoPlayInterval = 5000,
}: PetThumbnailNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<number | null>(null);

  // Navigation state
  const navigation = useTouchThumbnailNavigation(pets, {
    showAddPetCard,
    elasticEdges: enableElasticFeedback,
  });

  // Swipe gesture handling
  const swipeGestures = useThumbnailSwipeGestures();
  const [elasticOffset, setElasticOffset] = useState(0);

  // Current translate position
  const currentTranslateX = useRef(0);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || navigation.isTransitioning || navigation.totalCards <= 1) {
      return;
    }

    autoPlayTimerRef.current = window.setInterval(() => {
      // Skip auto-advance if on "Add Pet" card
      if (navigation.activePetIndex === navigation.totalPets) {
        return;
      }

      if (navigation.canNavigateNext) {
        navigation.goToNext();
      } else {
        navigation.resetToFirst();
      }
    }, autoPlayInterval);

    return () => {
      if (autoPlayTimerRef.current) {
        window.clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, navigation]);

  // Clear auto-play on user interaction
  const clearAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      window.clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, []);

  // Transform thumbnails container with hardware acceleration
  const updateTransform = useCallback(
    (translateX?: number, immediate = false) => {
      if (!thumbnailsRef.current || !containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const targetTranslateX =
        translateX !== undefined
          ? translateX
          : -navigation.activePetIndex * containerWidth + elasticOffset;

      currentTranslateX.current = targetTranslateX;

      // Use transform3d for hardware acceleration
      thumbnailsRef.current.style.transform = `translate3d(${targetTranslateX}px, 0, 0)`;
      thumbnailsRef.current.style.willChange = swipeGestures.swipeState.isDragging
        ? 'transform'
        : 'auto';

      // Update transition based on interaction state
      thumbnailsRef.current.style.transition =
        swipeGestures.swipeState.isDragging || immediate
          ? 'none'
          : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    },
    [navigation.activePetIndex, elasticOffset, swipeGestures.swipeState.isDragging],
  );

  // Handle touch gestures with elastic feedback
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      clearAutoPlay();
      swipeGestures.handleTouchStart(e);
    },
    [swipeGestures, clearAutoPlay],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      swipeGestures.handleTouchMove(e);

      if (!swipeGestures.swipeState.isHorizontalGesture || !containerRef.current) {
        return;
      }

      const containerWidth = containerRef.current.clientWidth;
      const baseTranslateX = -navigation.activePetIndex * containerWidth;
      let deltaX = swipeGestures.swipeState.deltaX;

      // Apply elastic resistance at edges
      if (enableElasticFeedback) {
        const resistance = 0.3;

        // At first thumbnail, resist right swipe
        if (navigation.activePetIndex === 0 && deltaX > 0) {
          deltaX *= resistance;
        }
        // At last thumbnail (including Add Pet card), resist left swipe
        else if (navigation.activePetIndex === navigation.totalCards - 1 && deltaX < 0) {
          deltaX *= resistance;
        }
      }

      const newTranslateX = baseTranslateX + deltaX;
      updateTransform(newTranslateX, true);
    },
    [
      swipeGestures,
      navigation.activePetIndex,
      navigation.totalCards,
      enableElasticFeedback,
      updateTransform,
    ],
  );

  const handleTouchEnd = useCallback(() => {
    swipeGestures.handleTouchEnd();

    if (!swipeGestures.swipeState.isHorizontalGesture) {
      return;
    }

    const deltaX = swipeGestures.swipeState.deltaX;
    const containerWidth = containerRef.current?.clientWidth || 0;
    const swipeThreshold = containerWidth * 0.25; // 25% of container width
    const velocityThreshold = 0.5;

    // Calculate swipe velocity
    const swipeTime = Date.now() - (performance.now() - 200); // Approximate
    const velocity = Math.abs(deltaX) / Math.max(swipeTime, 1);

    const shouldSwipe = Math.abs(deltaX) > swipeThreshold || velocity > velocityThreshold;

    if (shouldSwipe) {
      if (deltaX > 0 && navigation.canNavigatePrevious) {
        // Swipe right - go to previous
        navigation.goToPrevious();
      } else if (deltaX < 0 && navigation.canNavigateNext) {
        // Swipe left - go to next
        navigation.goToNext();
      } else {
        // Bounce back to current position
        setElasticOffset(0);
        updateTransform();
      }
    } else {
      // Bounce back to current position
      setElasticOffset(0);
      updateTransform();
    }
  }, [swipeGestures, navigation, updateTransform]);

  // Update transform when active index changes
  useEffect(() => {
    setElasticOffset(0);
    updateTransform();
  }, [navigation.activePetIndex, updateTransform]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateTransform(undefined, true);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateTransform]);

  // Handle pet selection
  const handlePetClick = useCallback(
    (pet: Pet) => {
      clearAutoPlay();
      if (onPetSelect) {
        onPetSelect(pet);
      }
    },
    [onPetSelect, clearAutoPlay],
  );

  // Handle add pet click
  const handleAddPetClick = useCallback(() => {
    clearAutoPlay();
    if (onAddPet) {
      onAddPet();
    }
  }, [onAddPet, clearAutoPlay]);

  // Empty state
  if (navigation.totalCards === 0) {
    return (
      <div
        className={cn(
          'w-full h-full flex items-center justify-center',
          'bg-gradient-to-br from-orange-50 to-yellow-50',
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <div className="text-center text-orange-600">
          <p className="text-lg font-medium mb-2">No pets yet</p>
          <p className="text-sm opacity-75">Add your first pet to get started</p>
        </div>
      </div>
    );
  }

  // Error state
  if (navigation.activePetIndex < -1 || navigation.activePetIndex >= navigation.totalCards) {
    return (
      <div
        className={cn(
          'w-full h-full flex items-center justify-center',
          'bg-gradient-to-br from-red-50 to-orange-50',
          className,
        )}
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center text-red-600">
          <p className="text-lg font-medium mb-2">Navigation Error</p>
          <p className="text-sm opacity-75">Invalid thumbnail index: {navigation.activePetIndex}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full overflow-hidden',
        'touch-pan-x', // Allow horizontal panning only
        'select-none', // Prevent text selection during swipes
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Pet thumbnail gallery"
      aria-live="polite"
    >
      {/* Thumbnails Container */}
      <div
        ref={thumbnailsRef}
        className="flex h-full"
        style={{
          width: `${navigation.totalCards * 100}%`,
          willChange: swipeGestures.swipeState.isDragging ? 'transform' : 'auto',
        }}
      >
        {/* Pet Thumbnails */}
        {pets.map((pet, index) => (
          <div
            key={pet.id}
            className="w-full h-full flex-shrink-0"
            style={{
              width: `${100 / navigation.totalCards}%`,
            }}
          >
            {/* Only render thumbnails that are currently visible or adjacent */}
            {Math.abs(index - navigation.activePetIndex) <= 1 ? (
              <PetThumbnail
                pet={pet}
                isActive={index === navigation.activePetIndex}
                onClick={() => handlePetClick(pet)}
                className="w-full h-full"
              />
            ) : (
              <PetThumbnailSkeleton className="w-full h-full" />
            )}
          </div>
        ))}

        {/* Add Pet Thumbnail */}
        {showAddPetCard && (
          <div
            className="w-full h-full flex-shrink-0"
            style={{
              width: `${100 / navigation.totalCards}%`,
            }}
          >
            <AddPetThumbnail onClick={handleAddPetClick} className="w-full h-full" />
          </div>
        )}
      </div>

      {/* Navigation Indicators */}
      {navigation.totalCards > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-full">
            {Array.from({ length: navigation.totalCards }, (_, index) => (
              <button
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === navigation.activePetIndex
                    ? 'bg-white shadow-sm scale-125'
                    : 'bg-white/40 hover:bg-white/60',
                )}
                onClick={() => {
                  clearAutoPlay();
                  if (index === navigation.totalPets) {
                    navigation.goToAddPetCard();
                  } else {
                    navigation.goToPetIndex(index);
                  }
                }}
                aria-label={
                  index === navigation.totalPets
                    ? 'Go to add pet card'
                    : `Go to ${pets[index]?.name || `pet ${index + 1}`}`
                }
                disabled={navigation.isTransitioning}
              />
            ))}
          </div>
        </div>
      )}

      {/* Card Counter */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
          {navigation.activePetIndex === navigation.totalPets
            ? 'Add Pet'
            : `${navigation.activePetIndex + 1} of ${navigation.totalPets}`}
        </div>
      </div>

      {/* Loading indicator for transitions */}
      {navigation.isTransitioning && (
        <div
          className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30"
          role="status"
          aria-live="polite"
        >
          <div className="bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs">
            Transitioning...
          </div>
        </div>
      )}

      {/* Instructions for first-time users */}
      {navigation.totalPets === 1 && navigation.activePetIndex === 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 max-w-xs">
          <div className="text-center text-white text-sm bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
            <p className="opacity-90">Swipe left to add more pets</p>
          </div>
        </div>
      )}

      {/* Auto-play indicator */}
      {autoPlay && !navigation.isTransitioning && (
        <div className="absolute top-6 right-6 z-10">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}

/**
 * Simplified thumbnail navigation for basic use cases
 */
export function SimplePetThumbnailNavigation({
  pets,
  onPetSelect,
  className,
}: {
  pets: Pet[];
  onPetSelect?: (pet: Pet) => void;
  className?: string;
}) {
  return (
    <PetThumbnailNavigation
      pets={pets}
      onPetSelect={onPetSelect}
      className={className}
      showAddPetCard={false}
      enableElasticFeedback={false}
      autoPlay={false}
    />
  );
}

/**
 * Loading skeleton for thumbnail navigation
 */
export function PetThumbnailNavigationSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse',
        className,
      )}
      role="status"
      aria-label="Loading pet thumbnail gallery"
    >
      {/* Single skeleton thumbnail */}
      <PetThumbnailSkeleton className="w-full h-full" />

      {/* Skeleton indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-2 px-4 py-2 bg-gray-300 rounded-full">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="w-2 h-2 bg-gray-400 rounded-full" />
          ))}
        </div>
      </div>

      {/* Skeleton counter */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
        <div className="px-3 py-1.5 bg-gray-300 rounded-full">
          <div className="w-12 h-4 bg-gray-400 rounded" />
        </div>
      </div>
    </div>
  );
}
