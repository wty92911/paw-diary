import { Loader2, Heart, Plus } from 'lucide-react';
import { Pet } from '../lib/types';
import { usePets } from '../hooks/usePets';
import { useRouterNavigation } from '../hooks/usePetProfileNavigation';
import { PetThumbnailNavigation } from '../components/pets/PetThumbnailNavigation';
import { Button } from '../components/ui/button';

/**
 * HomePage - Main landing page with pet selection
 *
 * Features:
 * - Displays pet thumbnails in horizontal navigation
 * - Shows welcoming empty state with add pet button
 * - Provides access to pet profiles and pet creation
 * - Manages loading and error states
 */
export function HomePage() {
  const { pets, isLoading, error, refetch } = usePets();
  const { navigateToPetProfile, navigateToAddPet } = useRouterNavigation();

  // Handle pet selection - navigate to pet profile page
  const handlePetSelect = (pet: Pet) => {
    navigateToPetProfile(pet.id);
  };

  // Handle add pet action
  const handleAddPet = () => {
    navigateToAddPet();
  };

  // Loading state
  if (isLoading && pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-orange-700">Loading your pets...</p>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
          <Button onClick={handleAddPet} className="bg-orange-500 hover:bg-orange-600 text-white">
            Add Your First Pet
          </Button>
        </div>
      </div>
    );
  }

  // Empty state - show welcoming message with add pet button
  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white fill-current" />
            </div>
            <h1 className="text-3xl font-bold text-orange-900 mb-2">Welcome to Paw Diary</h1>
            <p className="text-orange-700 text-lg">
              Start documenting your pet's journey by adding your first furry friend!
            </p>
          </div>

          {/* Add Pet Button */}
          <Button
            onClick={handleAddPet}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Pet
          </Button>

          {/* Helpful Text */}
          <p className="text-orange-600 text-sm mt-4">
            You can add photos, track activities, and create memories for all your pets
          </p>
        </div>
      </div>
    );
  }

  // Main state with pets
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Fixed immersive pet navigation */}
      <div className="fixed inset-0 z-30 bg-gradient-to-br from-orange-50 to-yellow-50 overflow-hidden">
        <PetThumbnailNavigation
          pets={pets.filter(p => !p.is_archived)}
          onPetSelect={handlePetSelect}
          onAddPet={handleAddPet}
          className="h-full"
          showAddPetCard={true}
          enableElasticFeedback={true}
          autoPlay={false}
        />
      </div>
    </div>
  );
}

export default HomePage;
