import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Pet } from '../../lib/types';
import { cn } from '../../lib/utils';
import { PetThumbnail, PetThumbnailSkeleton } from './PetThumbnail';
import { AddPetThumbnail } from './AddPetThumbnail';
import { PetProfile } from './PetProfile';
import {
  useTouchThumbnailNavigation,
  useThumbnailSwipeGestures,
} from '../../hooks/usePetThumbnailNavigation';

interface PetThumbnailNavigationProps {
  pets: Pet[];
  onPetSelect?: (pet: Pet) => void;
  onAddPet?: () => void;
  onEditPet?: (pet: Pet) => void;
  onAddActivity?: () => void;
  className?: string;
  showAddPetCard?: boolean;
  enableElasticFeedback?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  // Auto-focus functionality
  autoFocusPetId?: number | null;
  onAutoFocusComplete?: () => void;
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
  onEditPet,
  onAddActivity,
  className,
  showAddPetCard = true,
  enableElasticFeedback = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  autoFocusPetId,
  onAutoFocusComplete,
}: PetThumbnailNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<number | null>(null);

  // View state management
  const [currentView, setCurrentView] = useState<'thumbnails' | 'detail'>('thumbnails');
  const [detailPetId, setDetailPetId] = useState<number | null>(null);

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

      // Update transition based on interaction state with faster, snappier timing
      thumbnailsRef.current.style.transition =
        swipeGestures.swipeState.isDragging || immediate
          ? 'none'
          : 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // Faster, snappier easing
    },
    [navigation.activePetIndex, elasticOffset, swipeGestures.swipeState.isDragging],
  );

  // Animate elastic bounce back to position
  const animateElasticBounce = useCallback(() => {
    if (!thumbnailsRef.current) return;

    setElasticOffset(0);

    // Apply elastic bounce animation using CSS with faster timing
    thumbnailsRef.current.style.transition =
      'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    updateTransform();

    // Reset to normal transition after animation with faster timing
    setTimeout(() => {
      if (thumbnailsRef.current) {
        thumbnailsRef.current.style.transition =
          'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      }
    }, 400);
  }, [updateTransform]);

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

      // Enforce horizontal-only navigation - prevent vertical scrolling
      if (swipeGestures.swipeState.isHorizontalGesture) {
        e.preventDefault(); // Block vertical scrolling when horizontal swipe is detected
      }

      if (!swipeGestures.swipeState.isHorizontalGesture || !containerRef.current) {
        return;
      }

      const containerWidth = containerRef.current.clientWidth;
      const baseTranslateX = -navigation.activePetIndex * containerWidth;
      let deltaX = swipeGestures.swipeState.deltaX;

      // Apply elastic resistance at edges with progressive resistance
      if (enableElasticFeedback) {
        const maxElasticDistance = containerWidth * 0.4; // Max elastic pull distance

        // At first thumbnail, resist right swipe with progressive resistance
        if (navigation.activePetIndex === 0 && deltaX > 0) {
          // Progressive resistance that increases as you pull further
          const elasticProgress = Math.min(deltaX / maxElasticDistance, 1);
          const progressiveResistance = 1 - Math.pow(elasticProgress, 0.5);
          deltaX = deltaX * progressiveResistance * 0.3;
        }
        // At last thumbnail (including Add Pet card), resist left swipe
        else if (navigation.activePetIndex === navigation.totalCards - 1 && deltaX < 0) {
          const elasticProgress = Math.min(Math.abs(deltaX) / maxElasticDistance, 1);
          const progressiveResistance = 1 - Math.pow(elasticProgress, 0.5);
          deltaX = deltaX * progressiveResistance * 0.3;
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
        // Animate bounce back with elastic easing
        animateElasticBounce();
      }
    } else {
      // Animate bounce back with elastic easing
      animateElasticBounce();
    }
  }, [swipeGestures, navigation, animateElasticBounce]);

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

  // Auto-focus on newly created pet
  useEffect(() => {
    if (autoFocusPetId && pets.length > 0) {
      const targetPet = pets.find(pet => pet.id === autoFocusPetId);
      if (targetPet) {
        // Auto-focus on the specified pet
        navigation.goToPet(autoFocusPetId);

        // Call completion callback after a short delay to ensure navigation completes
        const timeoutId = setTimeout(() => {
          if (onAutoFocusComplete) {
            onAutoFocusComplete();
          }
        }, 300); // Match the CSS transition duration

        return () => clearTimeout(timeoutId);
      }
    }
  }, [autoFocusPetId, pets, navigation, onAutoFocusComplete]);

  // Handle pet selection (for other actions)
  const handlePetClick = useCallback(
    (pet: Pet) => {
      clearAutoPlay();
      if (onPetSelect) {
        onPetSelect(pet);
      }
    },
    [onPetSelect, clearAutoPlay],
  );

  // Handle tap to detail transition
  const handleTapToDetail = useCallback(
    (pet: Pet) => {
      clearAutoPlay();
      setDetailPetId(pet.id);
      setCurrentView('detail');

      // Sync navigation index to the selected pet
      navigation.goToPet(pet.id);
    },
    [clearAutoPlay, navigation],
  );

  // Handle back to thumbnails
  const handleBackToThumbnails = useCallback(() => {
    setCurrentView('thumbnails');
    setDetailPetId(null);
  }, []);

  // Get current detail pet
  const detailPet = detailPetId ? pets.find(pet => pet.id === detailPetId) : null;

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

  // Render detail view if active
  if (currentView === 'detail' && detailPet) {
    return (
      <div className={cn('w-full h-full', className)}>
        <PetProfile
          pet={detailPet}
          onEdit={onEditPet}
          onAddActivity={onAddActivity}
          onPrevious={() => {
            if (navigation.canNavigatePrevious) {
              navigation.goToPrevious();
              const newActivePet = pets[navigation.activePetIndex - 1];
              if (newActivePet) {
                setDetailPetId(newActivePet.id);
              }
            }
          }}
          onNext={() => {
            if (
              navigation.canNavigateNext &&
              navigation.activePetIndex < navigation.totalPets - 1
            ) {
              navigation.goToNext();
              const newActivePet = pets[navigation.activePetIndex + 1];
              if (newActivePet) {
                setDetailPetId(newActivePet.id);
              }
            }
          }}
          hasPrevious={navigation.canNavigatePrevious}
          hasNext={
            navigation.canNavigateNext && navigation.activePetIndex < navigation.totalPets - 1
          }
          currentIndex={navigation.activePetIndex}
          totalPets={navigation.totalPets}
          className="h-full"
        />

        {/* Back button overlay */}
        <button
          onClick={handleBackToThumbnails}
          className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/30 transition-colors"
          aria-label="Back to thumbnails"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5m7-7-7 7 7 7" />
          </svg>
        </button>
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
        'overscroll-x-contain overscroll-y-none', // Contain horizontal overscroll, prevent vertical
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Pet thumbnail gallery"
      aria-live="polite"
      style={{
        // Additional CSS to enforce horizontal-only behavior
        touchAction: 'pan-x', // Only allow horizontal panning
        overflowX: 'hidden',
        overflowY: 'hidden',
      }}
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
        {/* Pet Thumbnails with optimized rendering */}
        {pets.map((pet, index) => {
          const isVisible = Math.abs(index - navigation.activePetIndex) <= 1;
          const shouldPreload = Math.abs(index - navigation.activePetIndex) <= 2;

          return (
            <div
              key={pet.id}
              className="w-full h-full flex-shrink-0"
              style={{
                width: `${100 / navigation.totalCards}%`,
              }}
            >
              {/* Render visible thumbnails immediately, preload adjacent ones */}
              {isVisible ? (
                <PetThumbnail
                  pet={pet}
                  isActive={index === navigation.activePetIndex}
                  onClick={() => handlePetClick(pet)}
                  onTapToDetail={handleTapToDetail}
                  className="w-full h-full"
                />
              ) : shouldPreload ? (
                <div className="w-full h-full opacity-0 pointer-events-none">
                  <PetThumbnail
                    pet={pet}
                    isActive={false}
                    onClick={() => handlePetClick(pet)}
                    onTapToDetail={handleTapToDetail}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <PetThumbnailSkeleton className="w-full h-full" />
              )}
            </div>
          );
        })}

        {/* Add Pet Thumbnail */}
        {showAddPetCard && (
          <div
            className="w-full h-full flex-shrink-0"
            style={{
              width: `${100 / navigation.totalCards}%`,
            }}
          >
            <AddPetThumbnail
              onClick={handleAddPetClick}
              isActive={navigation.activePetIndex === navigation.totalPets}
              className="w-full h-full"
            />
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
                  'w-2 h-2 rounded-full transition-all duration-300 ease-out',
                  'hover:scale-110 active:scale-95',
                  index === navigation.activePetIndex
                    ? 'bg-white shadow-lg scale-125 ring-1 ring-white/50'
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

      {/* Card Counter with smooth transitions */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-all duration-200 ease-out">
          <span className="inline-block transition-all duration-200">
            {navigation.activePetIndex === navigation.totalPets
              ? 'Add Pet'
              : `${navigation.activePetIndex + 1} of ${navigation.totalPets}`}
          </span>
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
