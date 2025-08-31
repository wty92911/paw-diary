import React, { useEffect } from 'react';
import { Pet, ViewType, PetCreateRequest } from '../../lib/types';
import { AddPetProfile } from './AddPetProfile';
import { EmptyPetList } from './EmptyPetList';
import { cn } from '../../lib/utils';
import { useEmptyStateNavigation } from '../../hooks/useEmptyStateNavigation';

interface EmptyStateHandlerProps {
  pets: Pet[];
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onAddPet: () => void;
  isLoading?: boolean;
  className?: string;
  // Profile-specific props
  onAddPetProfileSubmit?: (data: PetCreateRequest) => Promise<void>;
  isSubmitting?: boolean;
}

export function EmptyStateHandler({
  pets,
  currentView,
  onNavigate,
  onAddPet,
  isLoading = false,
  className,
  onAddPetProfileSubmit,
  isSubmitting = false,
}: EmptyStateHandlerProps) {
  const activePets = pets.filter(pet => !pet.is_archived);
  const hasNoPets = activePets.length === 0;

  // Auto-navigate based on current state and view - Enhanced onboarding flow
  useEffect(() => {
    if (isLoading) return;

    // First app launch - automatically redirect to AddPet flow
    if (hasNoPets && pets.length === 0) {
      // Direct to AddPetProfile for immediate onboarding
      if (currentView !== ViewType.PetProfile && onAddPetProfileSubmit) {
        onNavigate(ViewType.PetProfile);
        return;
      }

      // Fallback to traditional add pet flow
      if (currentView !== ViewType.PetForm) {
        onNavigate(ViewType.PetForm);
        return;
      }
    }

    // If no active pets exist but some archived pets exist, show EmptyPetList
    if (hasNoPets && pets.length > 0 && currentView === ViewType.PetList) {
      return;
    }

    // If no pets exist and we're in PetProfile view, show AddPetProfile
    if (hasNoPets && currentView === ViewType.PetProfile) {
      return;
    }

    // If pets exist but we're viewing empty state, navigate to first pet profile
    if (!hasNoPets && (currentView === ViewType.PetList || currentView === ViewType.PetProfile)) {
      return;
    }
  }, [hasNoPets, currentView, isLoading, onNavigate, pets.length, onAddPetProfileSubmit]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center',
          className,
        )}
      >
        <EmptyStateLoadingSkeleton />
      </div>
    );
  }

  // No pets - render appropriate empty state based on current view
  if (hasNoPets) {
    if (currentView === ViewType.PetProfile && onAddPetProfileSubmit) {
      // Show the AddPetProfile component for profile-style navigation
      return (
        <AddPetProfile
          onSubmit={onAddPetProfileSubmit}
          isSubmitting={isSubmitting}
          currentIndex={0}
          totalPets={0}
          className={className}
        />
      );
    }

    // Default to traditional EmptyPetList for PetList view
    return (
      <div className={cn('min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50', className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyPetList onAddPet={onAddPet} />
        </div>
      </div>
    );
  }

  // This component should not render when pets exist
  // The parent component should handle pet display logic
  return null;
}

// Welcome message for first-time users
export function WelcomeMessage({
  userName,
  petCount,
  className,
}: {
  userName?: string;
  petCount: number;
  className?: string;
}) {
  const getWelcomeMessage = () => {
    if (petCount === 0) {
      return {
        title: userName ? `Welcome, ${userName}! 🎉` : 'Welcome to Paw Diary! 🎉',
        subtitle: "Let's start by adding your first furry friend",
      };
    }

    if (petCount === 1) {
      return {
        title: 'Great start! 🐾',
        subtitle: 'Your pet profile is ready. Add more pets or start tracking activities.',
      };
    }

    return {
      title: `Welcome back! 🏠`,
      subtitle: `You have ${petCount} pets in your family. Select one to view their profile.`,
    };
  };

  const { title, subtitle } = getWelcomeMessage();

  return (
    <div className={cn('text-center py-8', className)}>
      <h2 className="text-2xl font-bold text-orange-900 mb-2">{title}</h2>
      <p className="text-orange-600 text-lg">{subtitle}</p>
    </div>
  );
}

// Loading skeleton for empty state
function EmptyStateLoadingSkeleton() {
  return (
    <div className="text-center animate-pulse">
      <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6" />
      <div className="space-y-3">
        <div className="w-48 h-6 bg-gray-200 rounded mx-auto" />
        <div className="w-64 h-4 bg-gray-200 rounded mx-auto" />
        <div className="w-32 h-10 bg-gray-200 rounded mx-auto mt-6" />
      </div>
    </div>
  );
}

// Smart routing component that handles all navigation logic
export function SmartPetRouter({
  pets,
  currentView,
  children,
  onNavigateToView,
  onAddPet,
  className,
}: {
  pets: Pet[];
  currentView: ViewType;
  children: React.ReactNode;
  onNavigateToView: (view: ViewType, petId?: number) => void;
  onAddPet: () => void;
  className?: string;
}) {
  const { shouldShowEmptyState, firstAvailablePet, activePetCount } = useEmptyStateNavigation(pets);

  // Auto-navigate to first pet if no specific pet is selected
  useEffect(() => {
    if (!shouldShowEmptyState && firstAvailablePet && currentView === ViewType.PetList) {
      // Auto-switch to profile view with first pet selected
      onNavigateToView(ViewType.PetProfile, firstAvailablePet.id);
    }
  }, [shouldShowEmptyState, firstAvailablePet, currentView, onNavigateToView]);

  if (shouldShowEmptyState) {
    return (
      <div className={cn('min-h-screen', className)}>
        <WelcomeMessage petCount={activePetCount} />
        <EmptyStateHandler
          pets={pets}
          currentView={currentView}
          onNavigate={view => onNavigateToView(view)}
          onAddPet={onAddPet}
        />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}
