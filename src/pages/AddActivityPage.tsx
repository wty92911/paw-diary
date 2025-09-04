import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { usePets } from '../hooks/usePets';
import { usePetActivities } from '../hooks/useActivities';
import { ActivityForm } from '../components/activities/ActivityForm';
import { Button } from '../components/ui/button';

/**
 * AddActivityPage - Dedicated page for adding activities to a specific pet
 *
 * Features:
 * - Full page form for activity creation
 * - Pet context display at the top
 * - Form validation and submission
 * - Navigation back to pet profile
 * - Handles loading and error states
 */
export function AddActivityPage() {
  const navigate = useNavigate();
  const { petId } = useParams<{ petId: string }>();
  const { pets, isLoading: petsLoading, error: petsError } = usePets();
  const { createActivity } = usePetActivities(parseInt(petId || '0', 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Find the current pet
  const currentPet = petId ? pets.find(p => p.id === parseInt(petId, 10)) : null;

  // Navigate back to pet profile
  const handleBack = () => {
    if (petId) {
      navigate(`/pets/${petId}`);
    } else {
      navigate('/');
    }
  };

  // Handle form submission
  const handleSubmit = async (activityData: any) => {
    if (!currentPet) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Create the activity - combine date and time into ISO datetime
      const activityDate = new Date(`${activityData.date}T${activityData.time}`).toISOString();

      await createActivity({
        title: activityData.title,
        category: activityData.category,
        subcategory: activityData.subcategory,
        description: activityData.description || '',
        activity_date: activityDate,
        cost: activityData.cost,
        location: activityData.location || '',
      });

      // Navigate back to pet profile after successful creation
      navigate(`/pets/${petId}`);
    } catch (error) {
      console.error('Failed to create activity:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while pets are loading
  if (petsLoading && pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-orange-700">Loading pet information...</p>
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
            The pet you're trying to add an activity for doesn't exist or may have been removed.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
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
            <p className="text-red-600 text-sm">{petsError}</p>
          </div>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back button and title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-orange-700 hover:bg-orange-100"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-900">Add Activity</h1>
                <p className="text-xs text-orange-600 -mt-1">for {currentPet.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Error display */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          )}

          {/* Activity Form in inline mode */}
          <ActivityForm
            pet={currentPet}
            open={true}
            onOpenChange={() => {}} // Not used in inline mode
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            inlineMode={true}
          />
        </div>
      </main>
    </div>
  );
}

export default AddActivityPage;
