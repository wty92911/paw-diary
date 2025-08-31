import { useState, useCallback, useEffect, useRef } from 'react';
import { Pet } from '../lib/types';
import { useResponsiveNavigation } from './useResponsiveNavigation';

/**
 * Navigation state for pet thumbnail gallery navigation
 */
export interface PetThumbnailNavigationState {
  activePetIndex: number;
  activePetId: number | null;
  activePet: Pet | null;
  totalPets: number;
  totalCards: number; // includes "Add Pet" card
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  isTransitioning: boolean;
  showAddPetCard: boolean;
}

/**
 * Actions for pet thumbnail navigation
 */
export interface PetThumbnailNavigationActions {
  goToPet: (petId: number) => void;
  goToPetIndex: (index: number) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  goToAddPetCard: () => void;
  setActivePetId: (petId: number | null) => void;
  resetToFirst: () => void;
}

/**
 * Options for thumbnail navigation behavior
 */
export interface PetThumbnailNavigationOptions {
  autoSelectFirst?: boolean;
  enableWrapping?: boolean;
  transitionDuration?: number;
  preloadAdjacent?: boolean;
  showAddPetCard?: boolean;
  elasticEdges?: boolean;
}

/**
 * Hook for managing pet thumbnail gallery navigation
 * Optimized for horizontal-only swiping with smooth iOS-like transitions
 *
 * Features:
 * - Horizontal-only navigation (no vertical scroll)
 * - GPU-accelerated smooth transitions (<300ms)
 * - "Add Pet" card at the far right
 * - Elastic edge feedback when swiping beyond bounds
 * - Responsive behavior for different screen sizes
 * - Preloading for adjacent thumbnails
 */
export function usePetThumbnailNavigation(
  pets: Pet[],
  options: PetThumbnailNavigationOptions = {},
): PetThumbnailNavigationState & PetThumbnailNavigationActions {
  const {
    autoSelectFirst = true,
    enableWrapping = false,
    transitionDuration = 250,
    preloadAdjacent = true,
    showAddPetCard = true,
    elasticEdges = true,
  } = options;

  const responsiveNav = useResponsiveNavigation();
  const transitionTimeoutRef = useRef<number | null>(null);

  // Core navigation state
  const [activePetIndex, setActivePetIndex] = useState<number>(() => {
    if (autoSelectFirst && pets.length > 0) return 0;
    return -1;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Computed state
  const activePet =
    activePetIndex >= 0 && activePetIndex < pets.length ? pets[activePetIndex] : null;

  const activePetId = activePet?.id || null;
  const totalPets = pets.length;
  const totalCards = totalPets + (showAddPetCard ? 1 : 0);

  // Navigation bounds
  const canNavigatePrevious = enableWrapping ? totalCards > 1 : activePetIndex > 0;
  const canNavigateNext = enableWrapping ? totalCards > 1 : activePetIndex < totalCards - 1;

  // Check if currently on "Add Pet" card (reserved for future use)
  // const isOnAddPetCard = activePetIndex === totalPets;

  // Navigation with optimized transition management
  const performNavigation = useCallback(
    (newIndex: number, immediate = false) => {
      // Validate bounds
      const maxIndex = totalCards - 1;
      if (newIndex < 0 || newIndex > maxIndex) {
        if (elasticEdges) {
          // Allow temporary elastic movement beyond bounds
          // but don't actually change the active index
          console.log(`Elastic feedback: attempted index ${newIndex}, bounds: 0-${maxIndex}`);
        }
        return;
      }

      if (newIndex === activePetIndex) return;

      // Clear existing timeout
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      // Set transitioning state
      if (!immediate) {
        setIsTransitioning(true);
      }

      // Update active index
      setActivePetIndex(newIndex);

      // Reset transition state after animation
      if (!immediate) {
        const duration = responsiveNav.isMobile ? transitionDuration * 0.8 : transitionDuration;
        transitionTimeoutRef.current = window.setTimeout(() => {
          setIsTransitioning(false);
          transitionTimeoutRef.current = null;
        }, duration);
      }
    },
    [activePetIndex, totalCards, transitionDuration, elasticEdges, responsiveNav.isMobile],
  );

  // Navigation actions
  const goToPetIndex = useCallback(
    (index: number) => {
      performNavigation(index);
    },
    [performNavigation],
  );

  const goToPet = useCallback(
    (petId: number) => {
      const petIndex = pets.findIndex(pet => pet.id === petId);
      if (petIndex === -1) {
        console.warn(`Pet with ID ${petId} not found in pets list`);
        return;
      }
      performNavigation(petIndex);
    },
    [pets, performNavigation],
  );

  const goToNext = useCallback(() => {
    let nextIndex = activePetIndex + 1;

    if (nextIndex >= totalCards) {
      if (enableWrapping) {
        nextIndex = 0;
      } else {
        // At the last card - can't go further
        return;
      }
    }

    performNavigation(nextIndex);
  }, [activePetIndex, totalCards, enableWrapping, performNavigation]);

  const goToPrevious = useCallback(() => {
    let previousIndex = activePetIndex - 1;

    if (previousIndex < 0) {
      if (enableWrapping) {
        previousIndex = totalCards - 1;
      } else {
        // At the first card - can't go back
        return;
      }
    }

    performNavigation(previousIndex);
  }, [activePetIndex, totalCards, enableWrapping, performNavigation]);

  const goToAddPetCard = useCallback(() => {
    if (showAddPetCard) {
      performNavigation(totalPets); // "Add Pet" card is at pets.length index
    }
  }, [totalPets, showAddPetCard, performNavigation]);

  const setActivePetId = useCallback(
    (petId: number | null) => {
      if (petId === null) {
        setActivePetIndex(-1);
        return;
      }
      goToPet(petId);
    },
    [goToPet],
  );

  const resetToFirst = useCallback(() => {
    if (totalCards > 0) {
      performNavigation(0, true);
    }
  }, [totalCards, performNavigation]);

  // Auto-select first pet when pets list changes
  useEffect(() => {
    if (autoSelectFirst && totalPets > 0 && activePetIndex === -1) {
      resetToFirst();
    }
  }, [autoSelectFirst, totalPets, activePetIndex, resetToFirst]);

  // Handle pets list changes
  useEffect(() => {
    // If current index is beyond available cards, navigate to a valid position
    if (activePetIndex >= totalCards && totalCards > 0) {
      performNavigation(Math.min(activePetIndex, totalCards - 1), true);
    } else if (totalCards === 0) {
      setActivePetIndex(-1);
    }
  }, [activePetIndex, totalCards, performNavigation]);

  // Preload adjacent thumbnails for performance
  useEffect(() => {
    if (!preloadAdjacent || totalPets === 0) return;

    const preloadIndexes = [];

    // Add previous pet (if exists)
    if (activePetIndex > 0 && activePetIndex <= totalPets) {
      preloadIndexes.push(activePetIndex - 1);
    } else if (enableWrapping && totalPets > 1 && activePetIndex === 0) {
      preloadIndexes.push(totalPets - 1);
    }

    // Add next pet (if exists)
    if (activePetIndex >= 0 && activePetIndex < totalPets - 1) {
      preloadIndexes.push(activePetIndex + 1);
    } else if (enableWrapping && totalPets > 1 && activePetIndex === totalPets - 1) {
      preloadIndexes.push(0);
    }

    // Preload images for adjacent pets
    preloadIndexes.forEach(index => {
      const pet = pets[index];
      if (pet?.photo_path) {
        const img = new Image();
        img.src = pet.photo_path;
        // Optional: Add to cache or handle loading state
      }
    });
  }, [activePetIndex, pets, totalPets, enableWrapping, preloadAdjacent]);

  // Cleanup transition timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    activePetIndex,
    activePetId,
    activePet,
    totalPets,
    totalCards,
    canNavigatePrevious,
    canNavigateNext,
    isTransitioning,
    showAddPetCard,

    // Actions
    goToPet,
    goToPetIndex,
    goToNext,
    goToPrevious,
    goToAddPetCard,
    setActivePetId,
    resetToFirst,
  };
}

/**
 * Simplified hook for thumbnail navigation without advanced features
 * Useful for basic gallery functionality
 */
export function useSimpleThumbnailNavigation(pets: Pet[], showAddPetCard = true) {
  return usePetThumbnailNavigation(pets, {
    autoSelectFirst: pets.length > 0,
    enableWrapping: false,
    preloadAdjacent: false,
    showAddPetCard,
    elasticEdges: false,
  });
}

/**
 * Hook for touch-optimized thumbnail navigation
 * Includes all mobile optimizations and gesture support
 */
export function useTouchThumbnailNavigation(
  pets: Pet[],
  options: PetThumbnailNavigationOptions = {},
) {
  const responsiveNav = useResponsiveNavigation();

  return usePetThumbnailNavigation(pets, {
    ...options,
    enableWrapping: false, // Better UX for thumbnails
    preloadAdjacent: true,
    elasticEdges: true,
    transitionDuration: responsiveNav.isMobile ? 200 : 250, // Faster on mobile
    showAddPetCard: true,
  });
}

/**
 * Hook for detecting swipe gestures optimized for thumbnail navigation
 * Returns gesture state and handlers
 */
export function useThumbnailSwipeGestures() {
  const [swipeState, setSwipeState] = useState({
    isDragging: false,
    startX: 0,
    currentX: 0,
    deltaX: 0,
    isHorizontalGesture: false,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeState(prev => ({
      ...prev,
      isDragging: true,
      startX: touch.clientX,
      currentX: touch.clientX,
      deltaX: 0,
      isHorizontalGesture: false,
    }));
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeState.isDragging) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeState.startX;
      const deltaY = touch.clientY - (e.touches[0]?.clientY || 0);

      // Determine if this is a horizontal gesture
      const isHorizontalGesture = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

      if (isHorizontalGesture) {
        e.preventDefault(); // Prevent vertical scrolling
      }

      setSwipeState(prev => ({
        ...prev,
        currentX: touch.clientX,
        deltaX,
        isHorizontalGesture,
      }));
    },
    [swipeState.isDragging, swipeState.startX],
  );

  const handleTouchEnd = useCallback(() => {
    setSwipeState(prev => ({
      ...prev,
      isDragging: false,
      startX: 0,
      currentX: 0,
      deltaX: 0,
      isHorizontalGesture: false,
    }));
  }, []);

  return {
    swipeState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
