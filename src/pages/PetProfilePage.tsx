import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Calendar,
  Edit,
  Activity,
} from 'lucide-react';
import { usePets } from '../hooks/usePets';
import { useRouterNavigation } from '../hooks/usePetProfileNavigation';
import { PetProfilePhoto } from '../components/pets/PetProfilePhoto';
import ActivityTimeline from '../components/activities/ActivityTimeline';
import QuickLogSheet from '../components/activities/QuickLogSheet';
import { calculateAge } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useState } from 'react';

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
  const [showQuickLog, setShowQuickLog] = useState(false);

  // Get pet ID from URL
  const petId = getCurrentPetIdFromUrl();

  // Find the current pet
  const currentPet = petId ? pets.find(p => p.id === petId) : null;

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToHome}
                className="text-orange-700 hover:bg-orange-100"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-900">{currentPet.name}</h1>
                <p className="text-xs text-orange-600 -mt-1">Pet Profile</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pet Profile Section */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                {/* Pet Photo and Name */}
                <div className="text-center mb-6">
                  <PetProfilePhoto pet={currentPet} size="large" className="mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-orange-900 mb-2">{currentPet.name}</h2>
                  <div className="flex items-center justify-center gap-2 text-orange-700 mb-2">
                    <Heart className="w-4 h-4 fill-current" />
                    <span className="capitalize font-medium">
                      {currentPet.species.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-lg text-orange-600">{calculateAge(currentPet.birth_date)}</p>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      onClick={() => setShowQuickLog(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Log Activity
                    </Button>
                    <Button
                      onClick={() => navigate(`/pets/${currentPet.id}/edit`)}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>

                {/* Pet Details */}
                <div className="space-y-4">
                  {currentPet.breed && (
                    <div className="flex items-center justify-between py-2 border-b border-orange-100">
                      <span className="text-sm font-medium text-orange-700">Breed</span>
                      <span className="text-sm text-orange-900">{currentPet.breed}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2 border-b border-orange-100">
                    <span className="text-sm font-medium text-orange-700">Gender</span>
                    <span className="text-sm text-orange-900 capitalize">
                      {currentPet.gender.toLowerCase()}
                    </span>
                  </div>

                  {currentPet.color && (
                    <div className="flex items-center justify-between py-2 border-b border-orange-100">
                      <span className="text-sm font-medium text-orange-700">Color</span>
                      <span className="text-sm text-orange-900">{currentPet.color}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2 border-b border-orange-100">
                    <span className="text-sm font-medium text-orange-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Born
                    </span>
                    <span className="text-sm text-orange-900">
                      {new Date(currentPet.birth_date).toLocaleDateString()}
                    </span>
                  </div>

                  {currentPet.weight_kg && (
                    <div className="flex items-center justify-between py-2 border-b border-orange-100">
                      <span className="text-sm font-medium text-orange-700">Weight</span>
                      <span className="text-sm text-orange-900">{currentPet.weight_kg} kg</span>
                    </div>
                  )}

                  {/* Notes */}
                  {currentPet.notes && (
                    <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                      <h3 className="text-sm font-semibold text-orange-900 mb-2">Notes</h3>
                      <p className="text-sm text-orange-800 whitespace-pre-wrap">
                        {currentPet.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activities Section */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg h-full">
              <CardContent className="p-0 h-full">
                <Tabs defaultValue="timeline" className="h-full flex flex-col">
                  <div className="px-6 pt-6 pb-0">
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="timeline" className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Timeline
                      </TabsTrigger>
                      <TabsTrigger value="stats" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Statistics
                      </TabsTrigger>
                      <TabsTrigger value="health" className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Health
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="timeline" className="flex-1 px-6 pb-6 mt-4">
                    <div className="h-full">
                      <ActivityTimeline
                        activities={[]} // TODO: Implement activities loading
                        petId={currentPet.id}
                        className="h-full"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="stats" className="flex-1 px-6 pb-6 mt-4">
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">Statistics Coming Soon</p>
                        <p className="text-sm">Growth charts, health trends, and insights</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="health" className="flex-1 px-6 pb-6 mt-4">
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">Health Dashboard Coming Soon</p>
                        <p className="text-sm">
                          Vaccination schedules, medical records, and reminders
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Log Sheet */}
        {showQuickLog && (
          <QuickLogSheet
            isOpen={showQuickLog}
            petId={currentPet.id}
            onClose={() => setShowQuickLog(false)}
            onSave={async activity => {
              // TODO: Implement activity saving
              console.log('Saving activity:', activity);
              setShowQuickLog(false);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default PetProfilePage;
