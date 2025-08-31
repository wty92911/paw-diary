import React, { useRef, useEffect, useCallback } from 'react';
import { Pet } from '../../lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface PetProfileNavigationProps {
  pets: Pet[];
  activePetIndex: number;
  onPetChange: (index: number) => void;
  children: (pet: Pet, index: number) => React.ReactNode;
  className?: string;
  disableGestures?: boolean;
}

/**
 * PetProfileNavigation provides horizontal navigation between pet profiles
 * with smooth transitions, touch gestures, and keyboard navigation
 *
 * Features:
 * - Horizontal scrolling with CSS transforms for performance
 * - Touch gesture support with swipe detection
 * - Navigation arrows for desktop interaction
 * - Hardware acceleration with transform3d
 * - Pre-loading of adjacent profiles for smooth UX
 * - Debounced gesture handling to prevent rapid changes
 */
export function PetProfileNavigation({
  pets,
  activePetIndex,
  onPetChange,
  children,
  className,
  disableGestures = false,
}: PetProfileNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const profilesRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useRef(false);
  const gestureStartRef = useRef<{ x: number; time: number } | null>(null);

  // Navigation functions
  const navigateToPrevious = useCallback(() => {
    if (activePetIndex > 0 && !isTransitioning.current) {
      onPetChange(activePetIndex - 1);
    }
  }, [activePetIndex, onPetChange]);

  const navigateToNext = useCallback(() => {
    if (activePetIndex < pets.length - 1 && !isTransitioning.current) {
      onPetChange(activePetIndex + 1);
    }
  }, [activePetIndex, pets.length, onPetChange]);

  // Transform profiles container to show active pet
  const updateTransform = useCallback(() => {
    if (!profilesRef.current) return;

    const containerWidth = containerRef.current?.clientWidth || 0;
    const translateX = -activePetIndex * containerWidth;

    // Use transform3d for hardware acceleration
    profilesRef.current.style.transform = `translate3d(${translateX}px, 0, 0)`;
  }, [activePetIndex]);

  // Handle touch gestures
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disableGestures || isTransitioning.current) return;

      const touch = e.touches[0];
      gestureStartRef.current = {
        x: touch.clientX,
        time: Date.now(),
      };
    },
    [disableGestures],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disableGestures || !gestureStartRef.current || isTransitioning.current) return;

      const touch = e.changedTouches[0];
      const gestureStart = gestureStartRef.current;
      const deltaX = touch.clientX - gestureStart.x;
      const deltaTime = Date.now() - gestureStart.time;
      const velocity = Math.abs(deltaX) / deltaTime;

      // Swipe detection thresholds
      const MIN_SWIPE_DISTANCE = 50;
      const MIN_SWIPE_VELOCITY = 0.3;

      const isValidSwipe = Math.abs(deltaX) > MIN_SWIPE_DISTANCE || velocity > MIN_SWIPE_VELOCITY;

      if (isValidSwipe) {
        if (deltaX > 0) {
          // Swipe right - go to previous pet
          navigateToPrevious();
        } else {
          // Swipe left - go to next pet
          navigateToNext();
        }
      }

      gestureStartRef.current = null;
    },
    [disableGestures, navigateToPrevious, navigateToNext],
  );

  // Handle mouse wheel navigation (desktop)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disableGestures || isTransitioning.current) return;

      // Prevent default scrolling
      e.preventDefault();

      const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = isHorizontalScroll ? e.deltaX : e.deltaY;

      if (Math.abs(delta) < 10) return; // Ignore small movements

      if (delta > 0) {
        navigateToNext();
      } else {
        navigateToPrevious();
      }
    },
    [disableGestures, navigateToNext, navigateToPrevious],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning.current) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigateToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToPrevious, navigateToNext]);

  // Update transform when active pet changes
  useEffect(() => {
    isTransitioning.current = true;
    updateTransform();

    // Reset transition flag after animation completes
    const timeout = setTimeout(() => {
      isTransitioning.current = false;
    }, 300); // Match CSS transition duration

    return () => clearTimeout(timeout);
  }, [updateTransform]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateTransform();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateTransform]);

  // Navigation button states
  const canNavigatePrevious = activePetIndex > 0;
  const canNavigateNext = activePetIndex < pets.length - 1;

  // Error boundary for navigation failures
  if (pets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No pets available for navigation
      </div>
    );
  }

  if (activePetIndex < 0 || activePetIndex >= pets.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Invalid pet index: {activePetIndex}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden w-full h-full',
        'touch-pan-x', // Allow horizontal panning
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute left-4 top-1/2 -translate-y-1/2 z-20',
          'bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white/95',
          'transition-all duration-200',
          !canNavigatePrevious && 'opacity-50 cursor-not-allowed',
        )}
        onClick={navigateToPrevious}
        disabled={!canNavigatePrevious}
        aria-label="Previous pet"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute right-4 top-1/2 -translate-y-1/2 z-20',
          'bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white/95',
          'transition-all duration-200',
          !canNavigateNext && 'opacity-50 cursor-not-allowed',
        )}
        onClick={navigateToNext}
        disabled={!canNavigateNext}
        aria-label="Next pet"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Pet Profiles Container */}
      <div
        ref={profilesRef}
        className="flex h-full transition-transform duration-300 ease-out"
        style={{
          width: `${pets.length * 100}%`,
          willChange: 'transform', // Optimize for animations
        }}
      >
        {pets.map((pet, index) => (
          <div
            key={pet.id}
            className="w-full h-full flex-shrink-0"
            style={{
              width: `${100 / pets.length}%`,
            }}
          >
            {/* Pre-load content for current and adjacent pets for smooth UX */}
            {Math.abs(index - activePetIndex) <= 1 && children(pet, index)}
          </div>
        ))}
      </div>

      {/* Pet Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-white text-sm">
          <span className="font-medium">{activePetIndex + 1}</span>
          <span className="text-white/70">of</span>
          <span className="font-medium">{pets.length}</span>
        </div>
      </div>

      {/* Dots Indicator (for small number of pets) */}
      {pets.length <= 5 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2">
            {pets.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === activePetIndex
                    ? 'bg-white shadow-sm scale-125'
                    : 'bg-white/50 hover:bg-white/75',
                )}
                onClick={() => onPetChange(index)}
                aria-label={`Go to pet ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
