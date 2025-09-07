import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { AlertCircle } from 'lucide-react';
import { Pet } from '../lib/types';
import { useActivity, useCreateActivity, useUpdateActivity } from '../hooks/useActivities';
import { ActivityFormData, ActivityMode } from '../lib/types/activities';
import { RouteValidator, RouteBuilder, BreadcrumbBuilder } from '../lib/types/routing';
import { PetContextHeader, PetContextHeaderSkeleton } from '../components/pets/PetContextHeader';
import ActivityEditorCore from '../components/activities/ActivityEditorCore';
import {
  DraftProvider,
  DraftOverview,
  useDraftRecovery,
  useAutoSaveDraft,
} from '../components/activities/DraftManager';
import { PageTitleDraftIndicator, AutoSaveStatus } from '../components/activities/DraftIndicator';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';

/**
 * ActivityEditorPage - Full-screen activity creation and editing page
 *
 * Routes:
 * - /pets/:petId/activities/new?mode=quick|guided|advanced&template=xxx
 * - /pets/:petId/activities/:activityId/edit
 *
 * Features:
 * - Pet context header with back navigation
 * - Full-screen activity editor without modal wrapper
 * - Support for create and edit modes
 * - Query parameter support for editor mode and template
 * - Error handling for invalid pet IDs or activities
 * - Loading states with skeleton UI
 * - Optimistic updates and proper navigation
 * - Draft auto-save and recovery functionality
 * - Draft status indicators in UI
 *
 * Integration:
 * - Uses existing ActivityEditor component without Dialog wrapper
 * - Integrates with React Query for data management
 * - Follows established routing patterns and error handling
 * - Integrates DraftManager and DraftIndicator components
 */
export function ActivityEditorPage() {
  const { petId, activityId } = useParams<{ petId: string; activityId?: string }>();

  // Validate and convert petId first
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

  // Return validation error if present
  if (validationError) {
    return <InvalidPetIdError message={validationError} />;
  }

  // Wrap with DraftProvider for draft functionality
  return (
    <DraftProvider petId={numericPetId}>
      <ActivityEditorPageContent activityId={activityId} numericPetId={numericPetId} />
    </DraftProvider>
  );
}

/**
 * Main ActivityEditorPage content wrapped with draft functionality
 */
function ActivityEditorPageContent({
  activityId,
  numericPetId,
}: {
  activityId?: string;
  numericPetId: number;
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parse route parameters
  const isEditMode = !!activityId;
  const numericActivityId = activityId ? parseInt(activityId, 10) : undefined;

  // Parse query parameters with proper defaults
  const mode = (searchParams.get('mode') as ActivityMode) || (isEditMode ? 'advanced' : 'quick');
  const templateId = searchParams.get('template') || undefined;

  // Draft recovery hook
  const { RecoveryDialog } = useDraftRecovery();

  // Auto-save draft hook
  const { lastSaved, isSaving, isDirty } = useAutoSaveDraft(numericPetId);

  // Fetch pet data
  const {
    data: pet,
    isLoading: isPetLoading,
    error: petError,
  } = useQuery<Pet>({
    queryKey: ['pet', numericPetId],
    queryFn: async () => {
      const result = await invoke('get_pet', { petId: numericPetId });
      return result as Pet;
    },
  });

  // Fetch activity data if editing using hook
  const {
    data: activity,
    isLoading: isActivityLoading,
    error: activityError,
  } = useActivity(numericActivityId || 0);

  // Use appropriate mutation hooks
  const createActivityMutation = useCreateActivity();
  const updateActivityMutation = useUpdateActivity();

  // Loading states
  if (isPetLoading || (isEditMode && isActivityLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <PetContextHeaderSkeleton />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-32 bg-gray-200 rounded" />
                <div className="flex justify-end gap-2">
                  <div className="h-10 bg-gray-200 rounded w-20" />
                  <div className="h-10 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error states
  if (petError || !pet) {
    return <PetNotFoundError petId={numericPetId} />;
  }

  if (isEditMode && (activityError || (!activity && !isActivityLoading))) {
    return <ActivityNotFoundError petId={numericPetId} activityId={numericActivityId!} />;
  }

  // Convert ActivityRecord to ActivityFormData if editing
  const initialData: Partial<ActivityFormData> | undefined = activity
    ? {
        petId: activity.pet_id,
        category: activity.category as any, // Category will need proper conversion
        subcategory: activity.subcategory,
        templateId: activity.activity_data?.templateId || '',
        title: activity.title,
        description: activity.description || '',
        activityDate: new Date(activity.activity_date),
        blocks: activity.activity_data?.blocks || {},
      }
    : undefined;

  // Event handlers
  const handleSave = async (formData: ActivityFormData) => {
    try {
      if (isEditMode && numericActivityId) {
        await updateActivityMutation.mutateAsync({
          activityId: numericActivityId,
          petId: numericPetId,
          updates: formData,
        });
      } else {
        await createActivityMutation.mutateAsync({
          petId: numericPetId,
          activityData: formData,
        });
      }

      // Navigate back to activities list
      navigate(RouteBuilder.activitiesList(numericPetId));
    } catch (error) {
      console.error('Failed to save activity:', error);
      // Error handling could be improved with toast notifications
    }
  };

  const handleCancel = () => {
    navigate(RouteBuilder.activitiesList(numericPetId));
  };

  const handleNavigationAttempt = (hasUnsavedChanges: boolean) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave without saving?',
      );
      if (confirmed) {
        navigate(RouteBuilder.activitiesList(numericPetId));
      }
    } else {
      navigate(RouteBuilder.activitiesList(numericPetId));
    }
  };

  // Generate breadcrumbs
  const breadcrumbs = isEditMode
    ? [
        {
          label: 'Profile',
          href: RouteBuilder.petProfile(numericPetId),
          active: false,
        },
        {
          label: 'Activities',
          href: RouteBuilder.activitiesList(numericPetId),
          active: false,
        },
        {
          label: activity?.title || 'Edit Activity',
          active: true,
        },
      ]
    : BreadcrumbBuilder.forNewActivity(pet.name, numericPetId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Pet Context Header */}
      <PetContextHeader
        pet={pet}
        showBackButton={true}
        breadcrumbs={breadcrumbs}
        backAction={handleCancel}
      />

      {/* Page Title with Draft Indicator */}
      <div className="max-w-4xl mx-auto px-4 pt-2">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-xl font-semibold text-gray-800">
            {isEditMode ? activity?.title || 'Edit Activity' : 'New Activity'}
          </h1>
          <PageTitleDraftIndicator
            hasDraft={isDirty || isSaving}
            isDirty={isDirty}
            isAutoSaving={isSaving}
            lastSaved={lastSaved || undefined}
          />
        </div>
      </div>

      {/* Draft Overview - Shows if there are any drafts */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <DraftOverview petId={numericPetId} className="mb-4" />
      </div>

      {/* Full-screen Activity Editor */}
      <main className="max-w-4xl mx-auto px-4 pb-6">
        {/* Activity Editor Error State */}
        {isEditMode && activityError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load activity. Please refresh the page or try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Full-screen Activity Editor using ActivityEditorCore */}
        <Card className="shadow-lg border-orange-200">
          <CardContent className="p-6">
            {/* Auto-save Status Bar */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-orange-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {isEditMode ? 'Edit Activity' : 'Create Activity'}
              </h2>
              <AutoSaveStatus
                isEnabled={true}
                lastSaved={lastSaved || undefined}
                isSaving={isSaving}
                hasError={false}
                className="text-sm"
              />
            </div>

            <ActivityEditorCore
              mode={mode}
              templateId={templateId}
              activityId={numericActivityId}
              petId={numericPetId}
              onSave={handleSave}
              onCancel={handleCancel}
              onNavigationAttempt={handleNavigationAttempt}
              initialData={initialData}
              showHeader={false} // We have our own header now
              className=""
            />
          </CardContent>
        </Card>
      </main>

      {/* Draft Recovery Dialog */}
      <RecoveryDialog
        onRecover={draft => {
          // Handle draft recovery
          console.log('Recovering draft:', draft);
          // TODO: Populate form with draft data
        }}
      />
    </div>
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
function PetNotFoundError({ petId }: { petId: number }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
      <Card className="max-w-md mx-4">
        <CardContent className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pet Not Found</h2>
          <p className="text-gray-600 mb-6">
            The pet with ID {petId} could not be found. It may have been deleted or the ID is
            incorrect.
          </p>
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

/**
 * Error component for activity not found
 */
function ActivityNotFoundError({ petId, activityId }: { petId: number; activityId: number }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
      <Card className="max-w-md mx-4">
        <CardContent className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Activity Not Found</h2>
          <p className="text-gray-600 mb-6">
            The activity with ID {activityId} could not be found. It may have been deleted or the ID
            is incorrect.
          </p>
          <div className="space-x-3">
            <Button onClick={() => navigate(RouteBuilder.activitiesList(petId))} variant="outline">
              View Activities
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

export default ActivityEditorPage;
