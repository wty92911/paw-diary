import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, ArrowLeft, Activity, Plus } from 'lucide-react';
import { usePets } from '../hooks/usePets';
import { useRouterNavigation } from '../hooks/usePetProfileNavigation';
import { useActivitiesList } from '../hooks/useActivitiesList';
import { PetProfileHeader } from '../components/pets/PetProfileHeader';
import { ActivityPreviewSection } from '../components/activities/ActivityPreviewSection';
import { Button } from '../components/ui/button';
import { convertActivitiesToTimelineItems } from '../lib/utils/activityUtils';
import {
  UniversalHeader,
  HeaderVariant,
  BackActionType,
  DEFAULT_HEADER_CONFIG,
  IOSContentLayout,
} from '../components/header';

/**
 * PetProfilePage - Comprehensive pet profile
 *
 * Features:
 * - Displays pet profile information
 * - Handles loading, error, and not found states
 * - Integrates with router for navigation
 */
export function PetProfilePage() {
  const { getCurrentPetIdFromUrl, navigateToHome, navigateToAddPet } = useRouterNavigation();
  const { pets, isLoading: petsLoading, error: petsError, refetch: refetchPets } = usePets();
  const navigate = useNavigate();

  // Get pet ID from URL
  const petId = getCurrentPetIdFromUrl();

  // Find the current pet
  const currentPet = petId ? pets.find(p => p.id === petId) : null;

  // Get activities for preview
  const {
    activities = [],
    isLoading: isActivitiesLoading,
    error: activitiesErrorMessage,
  } = useActivitiesList(petId || 0);

  // Sort activities by date (most recent first) and take the first 3
  const recentActivities = React.useMemo(() => {
    const timelineItems = convertActivitiesToTimelineItems(activities);
    return timelineItems
      .sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime())
      .slice(0, 3);
  }, [activities]);

  // Loading state while pets are loading or pet not found yet
  if (petsLoading && pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-orange-700">Loading pet profile...</p>
        </div>
      </div>
    );
  }

  // Pet not found or invalid ID
  if (!petId || !currentPet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-orange-900 mb-2">Pet Not Found</h2>
          <p className="text-orange-700 mb-6">
            The pet you're looking for doesn't exist or may have been removed.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={navigateToHome} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pets
            </Button>
            <Button onClick={navigateToAddPet} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Add New Pet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (petsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm mb-4">{petsError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchPets()}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
          <Button onClick={navigateToHome}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Main profile page
  return (
    <>
      {/* Universal Header */}
      <UniversalHeader
        configuration={{
          ...DEFAULT_HEADER_CONFIG,
          variant: HeaderVariant.FORM,
          title: 'Pet Profile',
          subtitle: currentPet.name,
          showBackButton: true,
          backAction: {
            type: BackActionType.CUSTOM_HANDLER,
            handler: navigateToHome,
            label: 'Back',
          },
        }}
      />

      <IOSContentLayout
        enableHeaderPadding={true}
        enableSafeArea={true}
        className="bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen"
      >
        {/* Main content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="space-y-6">
            {/* Pet Profile Section - Full Width */}
            <PetProfileHeader
              pet={currentPet}
              onEdit={() => navigate(`/pets/${currentPet.id}/edit`)}
              size="full"
              className="shadow-lg"
            />

            {/* Recent Activities Section */}
            <div className="space-y-4">
              <ActivityPreviewSection
                activities={recentActivities}
                petId={currentPet.id}
                isLoading={isActivitiesLoading}
                error={activitiesErrorMessage || undefined}
                maxActivities={3}
                className="shadow-lg"
                emptyStateMessage={`Start tracking ${currentPet.name}'s activities`}
                showHeader={true}
                showViewAllButton={false}
              />

              {/* View All Activities Button - Below Recent Activities */}
              {activities.length > 0 && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => navigate(`/pets/${currentPet.id}/activities`)}
                    variant="outline"
                    size="lg"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 min-w-[240px]"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    View All Activities
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </IOSContentLayout>
    </>
  );
}

export default PetProfilePage;
