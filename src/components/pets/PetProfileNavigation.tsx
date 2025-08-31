import React, { useRef, useEffect, useCallback, useTransition } from 'react';
import { Pet } from '../../lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { PetProfileNavigationErrorBoundary } from './PetProfileNavigationErrorBoundary';

interface PetProfileNavigationProps {
  pets: Pet[];
  activePetIndex: number;
  onPetChange: (index: number) => void;
  children: (pet: Pet, index: number, disableVerticalScroll: boolean) => React.ReactNode;
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
  const gestureStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const currentTranslateX = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalGesture = useRef(false);
  const [isPending, startTransition] = useTransition();

  // Navigation functions with performance optimization
  const navigateToPrevious = useCallback(() => {
    if (activePetIndex > 0 && !isTransitioning.current) {
      startTransition(() => {
        onPetChange(activePetIndex - 1);
      });
    }
  }, [activePetIndex, onPetChange, startTransition]);

  const navigateToNext = useCallback(() => {
    if (activePetIndex < pets.length - 1 && !isTransitioning.current) {
      startTransition(() => {
        onPetChange(activePetIndex + 1);
      });
    }
  }, [activePetIndex, pets.length, onPetChange, startTransition]);

  // Transform profiles container to show active pet with hardware acceleration
  const updateTransform = useCallback(
    (translateX?: number) => {
      if (!profilesRef.current) return;

      const containerWidth = containerRef.current?.clientWidth || 0;
      const targetTranslateX =
        translateX !== undefined ? translateX : -activePetIndex * containerWidth;

      currentTranslateX.current = targetTranslateX;

      // Use transform3d for hardware acceleration and will-change for optimization
      profilesRef.current.style.transform = `translate3d(${targetTranslateX}px, 0, 0)`;
      profilesRef.current.style.willChange = 'transform';

      // Update transition style based on dragging state
      if (profilesRef.current) {
        profilesRef.current.style.transition = isDragging.current
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      }
    },
    [activePetIndex],
  );

  // Handle touch gestures
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disableGestures || isTransitioning.current) return;

      const touch = e.touches[0];
      gestureStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      isDragging.current = false;
      isHorizontalGesture.current = false;
    },
    [disableGestures],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disableGestures || !gestureStartRef.current || isTransitioning.current) return;

      const touch = e.touches[0];
      const gestureStart = gestureStartRef.current;
      const deltaX = touch.clientX - gestureStart.x;
      const deltaY = touch.clientY - gestureStart.y;

      // Check if this is a horizontal gesture
      const isHorizontalGestureCheck = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

      if (!isHorizontalGestureCheck) return;

      // Set horizontal gesture flag and prevent default scrolling
      isHorizontalGesture.current = true;
      e.preventDefault();

      isDragging.current = true;

      // Calculate the new translate position
      const containerWidth = containerRef.current?.clientWidth || 0;
      const baseTranslateX = -activePetIndex * containerWidth;
      const newTranslateX = baseTranslateX + deltaX;

      // Apply the transform with resistance at edges
      const resistance = 0.3;
      let finalTranslateX = newTranslateX;

      // Add resistance at the edges
      if (activePetIndex === 0 && deltaX > 0) {
        // At first pet, resist right swipe
        finalTranslateX = baseTranslateX + deltaX * resistance;
      } else if (activePetIndex === pets.length - 1 && deltaX < 0) {
        // At last pet, resist left swipe
        finalTranslateX = baseTranslateX + deltaX * resistance;
      }

      updateTransform(finalTranslateX);
    },
    [disableGestures, activePetIndex, pets.length, updateTransform],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disableGestures || !gestureStartRef.current || isTransitioning.current) return;

      const touch = e.changedTouches[0];
      const gestureStart = gestureStartRef.current;
      const deltaX = touch.clientX - gestureStart.x;
      const deltaY = touch.clientY - gestureStart.y;
      const deltaTime = Date.now() - gestureStart.time;

      // Calculate swipe angle and distance
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI));
      const velocity = distance / deltaTime;

      // Swipe detection thresholds
      const MIN_SWIPE_DISTANCE = 80;
      const MIN_SWIPE_VELOCITY = 0.5;
      const MAX_VERTICAL_ANGLE = 30;

      // Check if it's a valid horizontal swipe
      const isHorizontalSwipe = angle < MAX_VERTICAL_ANGLE || angle > 180 - MAX_VERTICAL_ANGLE;
      const hasMinimumDistance = Math.abs(deltaX) > MIN_SWIPE_DISTANCE;
      const hasMinimumVelocity = velocity > MIN_SWIPE_VELOCITY;

      const isValidSwipe = isHorizontalSwipe && (hasMinimumDistance || hasMinimumVelocity);

      // If we were dragging, animate to final position
      if (isDragging.current) {
        if (isValidSwipe) {
          // Complete the transition
          if (deltaX > 0 && activePetIndex > 0) {
            // Swipe right - go to previous pet
            startTransition(() => {
              onPetChange(activePetIndex - 1);
            });
          } else if (deltaX < 0 && activePetIndex < pets.length - 1) {
            // Swipe left - go to next pet
            startTransition(() => {
              onPetChange(activePetIndex + 1);
            });
          } else {
            // Bounce back to current position
            updateTransform();
          }
        } else {
          // Bounce back to current position
          updateTransform();
        }
      }

      // Reset state
      isDragging.current = false;
      isHorizontalGesture.current = false;
      gestureStartRef.current = null;
    },
    [
      disableGestures,
      activePetIndex,
      pets.length,
      navigateToPrevious,
      navigateToNext,
      updateTransform,
      startTransition,
      onPetChange,
    ],
  );

  // Handle mouse wheel navigation (desktop)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disableGestures || isTransitioning.current) return;

      // Only handle horizontal scroll or when horizontal scroll is significantly larger
      const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 2;

      if (!isHorizontalScroll) return; // Allow vertical scrolling to pass through

      // Prevent default scrolling only for horizontal movements
      e.preventDefault();

      const delta = e.deltaX;

      if (Math.abs(delta) < 20) return; // Increased threshold for mouse wheel

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
      <div
        className="flex items-center justify-center h-64 text-gray-500"
        role="status"
        aria-live="polite"
      >
        <p>No pets available for navigation</p>
      </div>
    );
  }

  if (activePetIndex < 0 || activePetIndex >= pets.length) {
    return (
      <div
        className="flex items-center justify-center h-64 text-gray-500"
        role="alert"
        aria-live="assertive"
      >
        <p>Invalid pet index: {activePetIndex}</p>
      </div>
    );
  }

  return (
    <PetProfileNavigationErrorBoundary
      pets={pets}
      onNavigateToView={view => {
        // This would be passed from parent component
        console.log('Navigate to view:', view);
      }}
    >
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden w-full h-full',
          'touch-pan-x', // Allow horizontal panning
          className,
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        role="region"
        aria-label="Pet profile navigation"
        aria-live="polite"
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
            isPending && 'opacity-75',
          )}
          onClick={navigateToPrevious}
          disabled={!canNavigatePrevious || isPending}
          aria-label="Previous pet"
          aria-describedby={isPending ? 'navigation-loading' : undefined}
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
            isPending && 'opacity-75',
          )}
          onClick={navigateToNext}
          disabled={!canNavigateNext || isPending}
          aria-label="Next pet"
          aria-describedby={isPending ? 'navigation-loading' : undefined}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Pet Profiles Container */}
        <div
          ref={profilesRef}
          className="flex h-full"
          style={{
            width: `${pets.length * 100}%`,
            willChange: 'transform', // Optimize for animations
            transition: isDragging.current
              ? 'none'
              : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
              {Math.abs(index - activePetIndex) <= 1 &&
                children(pet, index, isHorizontalGesture.current)}
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

        {/* Loading indicator for transitions */}
        {isPending && (
          <div
            id="navigation-loading"
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30"
            role="status"
            aria-live="polite"
          >
            <div className="bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm">
              Loading...
            </div>
          </div>
        )}

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
                  disabled={isPending}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PetProfileNavigationErrorBoundary>
  );
}
