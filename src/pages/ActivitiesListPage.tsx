import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import { useActivitiesList } from '../hooks/useActivitiesList';
import { usePets } from '../hooks/usePets';
{
  /* ActivityTimelineItem import removed - not used in this file */
}
import { RouteValidator, BreadcrumbBuilder, RouteBuilder } from '../lib/types/routing';
import { convertActivitiesToTimelineItems } from '../lib/utils/activityUtils';
import { PetContextHeader, PetContextHeaderSkeleton } from '../components/pets/PetContextHeader';
import ActivityTimeline from '../components/activities/ActivityTimeline';
import FilterBar from '../components/activities/FilterBar';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { cn } from '../lib/utils';

/**
 * ActivitiesListPage - Dedicated page for viewing and managing all activities for a specific pet
 *
 * Route: /pets/:petId/activities
 *
 * Features:
 * - Pet context header with back navigation
 * - Complete activity timeline with filtering
 * - Floating action button for new activity creation
 * - Empty state when no activities exist
 * - Error handling for invalid pet IDs
 *
 * Navigation:
 * - Back: Returns to pet profile page
 * - New Activity: Opens activity editor in new mode
 * - Activity Click: Opens activity editor in edit mode
 */
export function ActivitiesListPage() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();

  // Validate and convert petId first, before any hooks
  let numericPetId: number;
  let validationError: string | null = null;
  try {
    if (!petId) {
      throw new Error('Pet ID is required');
    }
    numericPetId = RouteValidator.validatePetId(petId);
  } catch (error) {
    validationError = (error as Error).message;
    numericPetId = 0; // Fallback value for TypeScript
  }

  // Fetch pets data using hook
  const { pets, isLoading: isPetLoading, error: petError } = usePets();

  // Find the specific pet from the list
  const pet = pets.find(p => p.id === numericPetId) || null;

  // Use activities list hook for better functionality
  const {
    activities = [],
    filteredActivities,
    isLoading: isActivitiesLoading,
    error: activitiesErrorMessage,
    filters,
    updateFilters,
    clearFilters,
    deleteActivity,
    duplicateActivity,
  } = useActivitiesList(validationError ? 0 : numericPetId); // Skip if validation error

  // Convert error message to error object for compatibility
  const activitiesError = activitiesErrorMessage ? new Error(activitiesErrorMessage) : null;

  // Convert activities to timeline items
  const timelineItems = useMemo(() => {
    return convertActivitiesToTimelineItems(activities);
  }, [activities]);

  // Convert filtered activities to timeline items
  const filteredTimelineItems = useMemo(() => {
    return convertActivitiesToTimelineItems(filteredActivities);
  }, [filteredActivities]);

  // Return validation error if present
  if (validationError) {
    return <InvalidPetIdError message={validationError} />;
  }

  // Loading state
  if (isPetLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <PetContextHeaderSkeleton />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (petError) {
    return <PetNotFoundError petId={numericPetId} error={petError} />;
  }

  if (!pet) {
    return <PetNotFoundError petId={numericPetId} error="Pet not found" />;
  }

  // Event handlers
  const handleNewActivity = () => {
    navigate(RouteBuilder.newActivity(numericPetId, { mode: 'quick' }));
  };

  const handleActivityEdit = (activityId: number) => {
    navigate(RouteBuilder.editActivity(numericPetId, activityId));
  };

  const handleActivityDelete = async (activityId: number) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await deleteActivity(activityId);
      } catch (error) {
        console.error('Failed to delete activity:', error);
        alert('Failed to delete activity. Please try again.');
      }
    }
  };

  const handleActivityDuplicate = async (activityId: number) => {
    try {
      await duplicateActivity(activityId);
    } catch (error) {
      console.error('Failed to duplicate activity:', error);
      alert('Failed to duplicate activity. Please try again.');
    }
  };

  // Generate breadcrumbs
  const breadcrumbs = BreadcrumbBuilder.forActivitiesList(pet.name, numericPetId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Pet Context Header */}
      <PetContextHeader
        pet={pet}
        showBackButton={true}
        breadcrumbs={breadcrumbs}
        backAction={() => navigate(RouteBuilder.petProfile(numericPetId))}
      />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Activities Error State */}
        {activitiesError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load activities. Please refresh the page or try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Filter Bar - Show if we have activities or active filters */}
        {(activities.length > 0 || filters.searchQuery || filters.categories.length > 0) && (
          <FilterBar
            filters={filters}
            onFiltersChange={updateFilters}
            mode="full"
            petId={numericPetId}
            className="mb-6"
          />
        )}

        {/* Filter Results Count */}
        {activities.length > 0 && filteredTimelineItems.length !== timelineItems.length && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredTimelineItems.length} of {timelineItems.length} activities
            {filteredTimelineItems.length === 0 && (
              <span className="ml-2 text-orange-600">- Try adjusting your filters</span>
            )}
          </div>
        )}

        {/* Activities Timeline or Empty States */}
        {activities.length > 0 ? (
          filteredTimelineItems.length > 0 ? (
            <ActivityTimeline
              activities={filteredTimelineItems}
              petId={numericPetId}
              isLoading={isActivitiesLoading}
              onActivityEdit={handleActivityEdit}
              onActivityView={handleActivityEdit} // Map view to edit for page navigation
              onActivityDelete={handleActivityDelete}
              onActivityDuplicate={handleActivityDuplicate}
              className="mb-6"
            />
          ) : (
            <NoMatchingActivitiesState
              totalCount={timelineItems.length}
              onClearFilters={clearFilters}
            />
          )
        ) : (
          <EmptyActivitiesState
            petName={pet.name}
            onCreateFirst={handleNewActivity}
            isLoading={isActivitiesLoading}
          />
        )}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleNewActivity} />
    </div>
  );
}

/**
 * Empty state when pet has no activities
 */
function EmptyActivitiesState({
  petName,
  onCreateFirst,
  isLoading,
}: {
  petName: string;
  onCreateFirst: () => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4" />
        <p className="text-gray-500">Loading activities...</p>
      </div>
    );
  }

  return (
    <Card className="border-dashed border-2 border-orange-200 bg-orange-50/50">
      <CardContent className="text-center py-12">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
            <Plus className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No activities yet for {petName}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start recording {petName}'s daily activities, health updates, meals, and special
            moments. Every memory matters!
          </p>
        </div>
        <Button onClick={onCreateFirst} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Record First Activity
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when filters return no matching activities
 */
function NoMatchingActivitiesState({
  totalCount,
  onClearFilters,
}: {
  totalCount: number;
  onClearFilters: () => void;
}) {
  return (
    <Card className="border-dashed border-2 border-orange-200 bg-orange-50/30">
      <CardContent className="text-center py-12">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching activities</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            We found {totalCount} total activities, but none match your current filters. Try
            adjusting your search or filter criteria.
          </p>
        </div>
        <Button onClick={onClearFilters} variant="outline" className="border-orange-300">
          Clear All Filters
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Floating Action Button for creating new activities
 */
function FloatingActionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        'fixed bottom-6 right-6 z-50 rounded-full shadow-lg',
        'bg-orange-600 hover:bg-orange-700 text-white',
        'w-14 h-14 p-0 transition-transform hover:scale-105',
      )}
      aria-label="Create new activity"
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}

/**
 * Error component for invalid pet ID
 */
function InvalidPetIdError({ message }: { message: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
      <Card className="max-w-md mx-4">
        <CardContent className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Pet ID</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Error component for pet not found
 */
function PetNotFoundError({ error }: { petId?: number; error: any }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
      <Card className="max-w-md mx-4">
        <CardContent className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pet Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-3">
            <Button onClick={() => navigate('/')} variant="outline">
              Return Home
            </Button>
            <Button onClick={() => window.history.back()} variant="ghost">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ActivitiesListPage;
