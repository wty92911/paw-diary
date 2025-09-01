import { useState, useCallback, useEffect } from 'react';
import { Pet } from '../lib/types';
import { useResponsiveNavigation } from './useResponsiveNavigation';

/**
 * Navigation state for pet profile horizontal navigation
 */
export interface PetProfileNavigationState {
  activePetIndex: number;
  activePetId: number | null;
  activePet: Pet | null;
  totalPets: number;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  isTransitioning: boolean;
}

/**
 * Actions for pet profile navigation
 */
export interface PetProfileNavigationActions {
  goToPet: (petId: number) => void;
  goToPetIndex: (index: number) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  setActivePetId: (petId: number | null) => void;
  resetToFirst: () => void;
}

/**
 * Options for navigation behavior
 */
export interface PetProfileNavigationOptions {
  autoSelectFirst?: boolean;
  enableWrapping?: boolean;
  transitionDuration?: number;
  preloadAdjacent?: boolean;
}

/**
 * Hook for managing pet profile navigation state and actions
 * Extends useResponsiveNavigation patterns with pet-specific logic
 *
 * Features:
 * - Pet index and ID synchronization
 * - Navigation state management
 * - Touch gesture integration
 * - Transition state tracking
 * - Error handling and validation
 * - Responsive behavior adaptation
 */
export function usePetProfileNavigation(
  pets: Pet[],
  options: PetProfileNavigationOptions = {},
): PetProfileNavigationState & PetProfileNavigationActions {
  const {
    autoSelectFirst = true,
    enableWrapping = false,
    transitionDuration = 300,
    preloadAdjacent = true,
  } = options;

  // const responsiveNav = useResponsiveNavigation();

  // Core navigation state
  const [activePetIndex, setActivePetIndex] = useState<number>(() => {
    // Initialize with first pet if available and auto-select is enabled
    if (autoSelectFirst && pets.length > 0) return 0;
    return -1;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTimeoutId, setTransitionTimeoutId] = useState<number | null>(null);

  // Computed state
  const activePet =
    activePetIndex >= 0 && activePetIndex < pets.length ? pets[activePetIndex] : null;

  const activePetId = activePet?.id || null;
  const totalPets = pets.length;
  const canNavigatePrevious = enableWrapping ? totalPets > 1 : activePetIndex > 0;
  const canNavigateNext = enableWrapping ? totalPets > 1 : activePetIndex < totalPets - 1;

  // Navigation with transition management
  const performNavigation = useCallback(
    (newIndex: number, immediate = false) => {
      if (newIndex < 0 || newIndex >= totalPets) {
        console.warn(`Invalid pet index: ${newIndex}. Valid range: 0-${totalPets - 1}`);
        return;
      }

      if (newIndex === activePetIndex) return;

      // Clear existing transition timeout
      if (transitionTimeoutId) {
        window.clearTimeout(transitionTimeoutId);
      }

      // Set transitioning state
      if (!immediate) {
        setIsTransitioning(true);
      }

      // Update active index
      setActivePetIndex(newIndex);

      // Reset transition state after animation
      if (!immediate) {
        const timeoutId = window.setTimeout(() => {
          setIsTransitioning(false);
          setTransitionTimeoutId(null);
        }, transitionDuration);

        setTransitionTimeoutId(timeoutId);
      }
    },
    [activePetIndex, totalPets, transitionDuration, transitionTimeoutId],
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

    if (nextIndex >= totalPets) {
      if (enableWrapping) {
        nextIndex = 0;
      } else {
        return; // Can't navigate beyond last pet
      }
    }

    performNavigation(nextIndex);
  }, [activePetIndex, totalPets, enableWrapping, performNavigation]);

  const goToPrevious = useCallback(() => {
    let previousIndex = activePetIndex - 1;

    if (previousIndex < 0) {
      if (enableWrapping) {
        previousIndex = totalPets - 1;
      } else {
        return; // Can't navigate before first pet
      }
    }

    performNavigation(previousIndex);
  }, [activePetIndex, totalPets, enableWrapping, performNavigation]);

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
    if (totalPets > 0) {
      performNavigation(0, true); // Immediate navigation for reset
    }
  }, [totalPets, performNavigation]);

  // Auto-select first pet when pets list changes
  useEffect(() => {
    if (autoSelectFirst && totalPets > 0 && activePetIndex === -1) {
      resetToFirst();
    }
  }, [autoSelectFirst, totalPets, activePetIndex, resetToFirst]);

  // Handle pets list changes
  useEffect(() => {
    // If current pet no longer exists, navigate to a valid pet
    if (activePetIndex >= totalPets && totalPets > 0) {
      performNavigation(totalPets - 1, true);
    } else if (totalPets === 0) {
      setActivePetIndex(-1);
    }
  }, [activePetIndex, totalPets, performNavigation]);

  // Cleanup transition timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutId) {
        window.clearTimeout(transitionTimeoutId);
      }
    };
  }, [transitionTimeoutId]);

  // Preload adjacent pets for performance (if enabled)
  useEffect(() => {
    if (!preloadAdjacent || !activePet) return;

    const preloadIndexes = [];

    // Add previous pet
    if (activePetIndex > 0) {
      preloadIndexes.push(activePetIndex - 1);
    } else if (enableWrapping && totalPets > 1) {
      preloadIndexes.push(totalPets - 1);
    }

    // Add next pet
    if (activePetIndex < totalPets - 1) {
      preloadIndexes.push(activePetIndex + 1);
    } else if (enableWrapping && totalPets > 1) {
      preloadIndexes.push(0);
    }

    // Preload images for adjacent pets
    preloadIndexes.forEach(index => {
      const pet = pets[index];
      if (pet?.photo_path) {
        const img = new Image();
        img.src = pet.photo_path;
      }
    });
  }, [activePetIndex, activePet, pets, totalPets, enableWrapping, preloadAdjacent]);

  // Touch gesture integration based on device type
  // const gesturesEnabled = responsiveNav.isMobile || responsiveNav.isTablet;

  return {
    // State
    activePetIndex,
    activePetId,
    activePet,
    totalPets,
    canNavigatePrevious,
    canNavigateNext,
    isTransitioning,

    // Actions
    goToPet,
    goToPetIndex,
    goToNext,
    goToPrevious,
    setActivePetId,
    resetToFirst,
  };
}

/**
 * Simplified hook for basic pet navigation without advanced features
 * Useful for components that just need basic next/previous functionality
 */
export function useSimplePetNavigation(pets: Pet[], initialPetId?: number) {
  const initialIndex = initialPetId ? pets.findIndex(pet => pet.id === initialPetId) : 0;

  return usePetProfileNavigation(pets, {
    autoSelectFirst: initialIndex === -1,
    enableWrapping: false,
    preloadAdjacent: false,
  });
}

/**
 * Hook for touch-optimized pet navigation
 * Includes gesture support and mobile-specific optimizations
 */
export function useTouchPetNavigation(pets: Pet[], options: PetProfileNavigationOptions = {}) {
  const responsiveNav = useResponsiveNavigation();

  return usePetProfileNavigation(pets, {
    ...options,
    enableWrapping: responsiveNav.isMobile, // Enable wrapping on mobile
    preloadAdjacent: true, // Always preload for smooth swiping
    transitionDuration: responsiveNav.isMobile ? 250 : 300, // Faster on mobile
  });
}
