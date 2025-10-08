import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useActivity, useCreateActivity, useUpdateActivity } from '../hooks/useActivities';
import { usePets } from '../hooks/usePets';
import {
  type ActivityFormData,
  type ActivityMode,
  type ActivityCategory,
  type ActivityBlockData,
} from '../lib/types/activities';
import { RouteValidator, RouteBuilder } from '../lib/types/routing';
import { PetContextHeaderSkeleton } from '../components/pets/PetContextHeader';
import {
  UniversalHeader,
  HeaderVariant,
  BackActionType,
  DEFAULT_HEADER_CONFIG,
  IOSContentLayout,
} from '../components/header';
import ActivityEditorCore from '../components/activities/ActivityEditorCore';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
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
 *
 * Integration:
 * - Uses existing ActivityEditor component without Dialog wrapper
 * - Integrates with React Query for data management
 * - Follows established routing patterns and error handling
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

  return <ActivityEditorPageContent activityId={activityId} numericPetId={numericPetId} />;
}

/**
 * Main ActivityEditorPage content
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
  // Both create and edit modes start with 'quick' mode to hide fields by default
  const mode = (searchParams.get('mode') as ActivityMode) || 'quick';
  const templateId = searchParams.get('template') || undefined;

  // Fetch pet data
  // Fetch pets data using hook
  const { pets, isLoading: isPetLoading, error: petError } = usePets();

  // Find the specific pet from the list
  const pet = pets.find(p => p.id === numericPetId) || null;

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
        category: activity.category as ActivityCategory, // Category conversion from database
        subcategory: activity.subcategory,
        blocks: convertBlocksFromDatabase(activity.activity_data || {}),
      }
    : undefined;

  // Convert blocks from database format to form format
  // Database stores time as { date: "ISO string", time: "", timezone: "" }
  // Form expects Date objects
  function convertBlocksFromDatabase(
    blocks: Record<string, ActivityBlockData>,
  ): Record<string, ActivityBlockData> {
    const converted: Record<string, ActivityBlockData> = {};
    for (const [key, value] of Object.entries(blocks)) {
      if (value && typeof value === 'object' && 'date' in value && typeof value.date === 'string') {
        // Convert time block from database format to Date object
        converted[key] = new Date(value.date);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }

  // Convert blocks from form format to database format
  // Form uses Date objects, database expects { date: "ISO string", time: "", timezone: "" }
  function convertBlocksToDatabase(
    blocks: Record<string, ActivityBlockData>,
  ): Record<string, ActivityBlockData> {
    const converted: Record<string, ActivityBlockData> = {};
    for (const [key, value] of Object.entries(blocks)) {
      if (value instanceof Date) {
        // Convert Date object to database format, preserving local time
        // Format: YYYY-MM-DDTHH:mm:ss (no Z suffix = local time)
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        const hours = String(value.getHours()).padStart(2, '0');
        const minutes = String(value.getMinutes()).padStart(2, '0');
        const seconds = String(value.getSeconds()).padStart(2, '0');
        const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

        converted[key] = {
          date: localTimeString,
          time: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        } as unknown as ActivityBlockData;
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }

  // Event handlers
  const handleSave = async (formData: ActivityFormData) => {
    try {
      // Convert Date objects in blocks back to database format
      const convertedFormData = {
        ...formData,
        blocks: convertBlocksToDatabase(formData.blocks || {}),
      };

      console.log('🔍 Original formData.blocks:', formData.blocks);
      console.log('🔍 Converted blocks:', convertedFormData.blocks);

      if (isEditMode && numericActivityId) {
        console.log('🔍 Calling updateActivityMutation with:', {
          activityId: numericActivityId,
          petId: numericPetId,
          updates: convertedFormData,
        });

        await updateActivityMutation.mutateAsync({
          activityId: numericActivityId,
          petId: numericPetId,
          updates: convertedFormData,
        });

        // Delay navigation to show success message in ActivityEditorCore
        setTimeout(() => {
          navigate(RouteBuilder.activitiesList(numericPetId));
        }, 1500);
      } else {
        await createActivityMutation.mutateAsync({
          petId: numericPetId,
          activityData: convertedFormData,
        });

        // Navigate back immediately for new activities
        navigate(RouteBuilder.activitiesList(numericPetId));
      }
    } catch (error) {
      console.error('Failed to save activity:', error);
      // Error handling could be improved with toast notifications
    }
  };

  const handleCancel = () => {
    navigate(RouteBuilder.activitiesList(numericPetId));
  };

  // Generate header title
  const headerTitle = isEditMode ? 'Edit Activity' : 'New Activity';
  const headerSubtitle = pet.name;

  return (
    <>
      {/* Activity Editor Header */}
      <UniversalHeader
        configuration={{
          ...DEFAULT_HEADER_CONFIG,
          variant: HeaderVariant.FORM,
          title: headerTitle,
          subtitle: headerSubtitle,
          showBackButton: true,
          backAction: {
            type: BackActionType.CUSTOM_HANDLER,
            handler: handleCancel,
            label: 'Cancel',
          },
        }}
      />

      <IOSContentLayout
        enableHeaderPadding={true}
        enableSafeArea={true}
        className="bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen"
      >
        {/* Activity Editor Error State */}
        {isEditMode && activityError && (
          <div className="max-w-4xl mx-auto px-4">
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load activity. Please refresh the page or try again later.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Direct Activity Editor - No wrapper cards */}
        <main className="max-w-4xl mx-auto px-4 pb-6">
          <ActivityEditorCore
            mode={mode}
            templateId={templateId}
            activityId={numericActivityId}
            petId={numericPetId}
            onSave={handleSave}
            initialData={initialData}
            className=""
          />
        </main>
      </IOSContentLayout>
    </>
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
