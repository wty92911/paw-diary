import { Pet, ViewType } from '../lib/types';

// Hook for smart navigation logic
export function useEmptyStateNavigation(pets: Pet[]) {
  const activePets = pets.filter(pet => !pet.is_archived);
  const hasNoPets = activePets.length === 0;

  // Determine what view should be shown
  const getRecommendedView = (): ViewType => {
    if (hasNoPets) {
      // For empty states, prefer profile-style navigation on mobile
      // and traditional list on desktop
      return ViewType.PetProfile;
    }

    // If pets exist, show profile view by default for mobile-first experience
    return ViewType.PetProfile;
  };

  // Determine if we should show empty state handler
  const shouldShowEmptyState = hasNoPets;

  // Get first available pet for navigation
  const getFirstAvailablePet = () => {
    return activePets.length > 0 ? activePets[0] : null;
  };

  return {
    hasNoPets,
    shouldShowEmptyState,
    recommendedView: getRecommendedView(),
    firstAvailablePet: getFirstAvailablePet(),
    activePetCount: activePets.length,
  };
}
