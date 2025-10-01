import { Heart, Plus } from 'lucide-react';
import { usePets } from '../hooks/usePets';
import { useRouterNavigation } from '../hooks/usePetProfileNavigation';
import { PetCard, PetCardSkeleton } from '../components/pets/PetCard';
import { Button } from '../components/ui/button';
import {
  UniversalHeader,
  HeaderVariant,
  ColorScheme,
  ElevationLevel,
  IOSContentLayout,
} from '../components/header';

/**
 * HomePage - Main landing page with pet selection
 *
 * Features:
 * - Displays pets in a clean card grid layout
 * - Shows welcoming empty state with add pet button
 * - Responsive design (2 columns desktop, 1 column mobile)
 * - Provides access to pet profiles and pet creation
 * - Manages loading and error states
 */
export function HomePage() {
  const { pets, isLoading, error, refetch } = usePets();
  const { navigateToPetProfile, navigateToAddPet } = useRouterNavigation();

  // Handle pet selection - navigate to pet profile page
  const handlePetSelect = (petId: number) => {
    navigateToPetProfile(petId);
  };

  // Handle add pet action
  const handleAddPet = () => {
    navigateToAddPet();
  };

  // Filter out archived pets
  const activePets = pets.filter(p => !p.is_archived);

  // Loading state
  if (isLoading && activePets.length === 0) {
    return (
      <>
        <UniversalHeader
          configuration={{
            variant: HeaderVariant.APP,
            title: 'Paw Diary',
            showBackButton: false,
            sticky: true,
            theme: {
              colorScheme: ColorScheme.LIGHT,
              elevation: ElevationLevel.BLUR,
            },
          }}
        />
        <IOSContentLayout
          enableHeaderPadding={true}
          enableSafeArea={true}
          className="bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen"
        >
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <PetCardSkeleton />
              <PetCardSkeleton />
              <PetCardSkeleton />
              <PetCardSkeleton />
            </div>
          </div>
        </IOSContentLayout>
      </>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <>
        <UniversalHeader
          configuration={{
            variant: HeaderVariant.APP,
            title: 'Paw Diary',
            showBackButton: false,
            sticky: true,
            theme: {
              colorScheme: ColorScheme.LIGHT,
              elevation: ElevationLevel.BLUR,
            },
          }}
        />
        <IOSContentLayout
          enableHeaderPadding={true}
          enableSafeArea={true}
          className="bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen"
        >
          <div className="container mx-auto px-4 py-8">
            <div className="text-center max-w-md mx-auto">
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
              <Button
                onClick={handleAddPet}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Add Your First Pet
              </Button>
            </div>
          </div>
        </IOSContentLayout>
      </>
    );
  }

  // Empty state - show welcoming message with add pet button
  if (activePets.length === 0) {
    return (
      <>
        <UniversalHeader
          configuration={{
            variant: HeaderVariant.APP,
            title: 'Paw Diary',
            showBackButton: false,
            sticky: true,
            theme: {
              colorScheme: ColorScheme.LIGHT,
              elevation: ElevationLevel.BLUR,
            },
          }}
        />
        <IOSContentLayout
          enableHeaderPadding={true}
          enableSafeArea={true}
          className="bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen"
        >
          <div className="container mx-auto px-4 py-8">
            <div className="text-center max-w-md mx-auto">
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
        </IOSContentLayout>
      </>
    );
  }

  // Main state with pets
  return (
    <>
      {/* iOS-Style Universal Header */}
      <UniversalHeader
        configuration={{
          variant: HeaderVariant.APP,
          title: 'Paw Diary',
          showBackButton: false,
          sticky: true,
          scrollBehavior: 'auto',
          contentPadding: false,
          theme: {
            colorScheme: ColorScheme.LIGHT,
            elevation: ElevationLevel.BLUR,
            iosBehavior: {
              enableBlur: true,
              autoHide: false,
              stickyBehavior: 'fixed',
              safeAreaInsets: true,
              scrollThreshold: 100,
            },
          },
        }}
      />

      {/* iOS Content Layout with proper spacing */}
      <IOSContentLayout
        enableHeaderPadding={true}
        enableSafeArea={true}
        className="bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen"
      >
        {/* Pet Cards Grid */}
        <div className="container mx-auto px-4 py-8 pb-32">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activePets.map(pet => (
              <PetCard key={pet.id} pet={pet} onClick={() => handlePetSelect(pet.id)} />
            ))}
          </div>
        </div>

        {/* Floating Add Pet Button - Fixed at Bottom */}
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            size="lg"
            onClick={handleAddPet}
            className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white transition-all duration-300 hover:scale-110"
            aria-label="Add New Pet"
          >
            <Plus className="w-8 h-8" />
          </Button>
        </div>
      </IOSContentLayout>
    </>
  );
}

export default HomePage;
