import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Pet, PetCreateRequest, PetUpdateRequest, ViewType } from './lib/types';
import { usePets } from './hooks/usePets';
import { PetCardList, EmptyPetList } from './components/pets/PetCardList';
import { PetForm } from './components/pets/PetForm';
import { PetFormPage } from './components/pets/PetFormPage';
import { PetDetailView } from './components/pets/PetDetailView';
import { PetManagement } from './components/pets/PetManagement';
import { PetProfileNavigation } from './components/pets/PetProfileNavigation';
import { PetProfile } from './components/pets/PetProfile';
import { AddPetProfile } from './components/pets/AddPetProfile';
import { ActivityForm } from './components/activities/ActivityForm';
import { PetProfileNavigationErrorBoundary } from './components/pets/PetProfileNavigationErrorBoundary';
import { useResponsiveNavigation } from './hooks/useResponsiveNavigation';
import { usePreloadPetPhotos } from './hooks/usePhotoCache';
import { Button } from './components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';
import { Settings, Heart, Loader2 } from 'lucide-react';
import './App.css';

function App() {
  // App state
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.PetList);
  const [activePetId, setActivePetId] = useState<number>();
  const [selectedPet, setSelectedPet] = useState<Pet>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string>();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet>();
  const [pendingDeletePet, setPendingDeletePet] = useState<Pet>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Activity form states
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [selectedPetForActivity, setSelectedPetForActivity] = useState<Pet>();
  const [isActivitySubmitting, setIsActivitySubmitting] = useState(false);

  // Mobile view state
  const [showMobileFormPage, setShowMobileFormPage] = useState(false);

  // Hooks
  const { pets, isLoading, error, refetch, createPet, updatePet, deletePet, reorderPets } =
    usePets();
  const { isMobile } = useResponsiveNavigation();

  // Preload all pet photos for instant display
  usePreloadPetPhotos(pets);

  // Helper functions for pet navigation
  const getCurrentPetIndex = (): number => {
    if (!activePetId) return -1;
    const activePets = pets.filter(p => !p.is_archived);
    return activePets.findIndex(p => p.id === activePetId);
  };

  // Initialize the app
  useEffect(() => {
    // Prevent multiple initialization attempts
    if (isInitializing || isInitialized) {
      return;
    }

    const initializeApp = async () => {
      console.log('=== FRONTEND INITIALIZATION START ===');

      try {
        console.log('Setting isInitializing to true');
        setIsInitializing(true);
        setInitError(undefined);

        console.log('Calling initialize_app command...');
        const result = await invoke('initialize_app');
        console.log('initialize_app result:', result);

        setIsInitialized(true);
        console.log('Initialization successful, fetching pets...');
        // Fetch pets after initialization
        await refetch();
        console.log('Pets fetched successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize application');
      } finally {
        console.log('Setting isInitializing to false');
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [isInitialized, isInitializing, refetch]); // Include all dependencies

  // Intelligent homepage routing and pet selection
  useEffect(() => {
    if (isLoading) return;

    const activePets = pets.filter(p => !p.is_archived);

    // Intelligent routing based on pet state
    if (activePets.length === 0) {
      // No pets: navigate to PetProfile view (will show AddPetProfile)
      if (currentView !== ViewType.PetProfile) {
        setCurrentView(ViewType.PetProfile);
      }
      setActivePetId(undefined);
    } else {
      // Pets exist: ensure we're in PetProfile view and have an active pet
      if (currentView === ViewType.PetList) {
        setCurrentView(ViewType.PetProfile);
      }

      // Auto-select first pet if none selected or selected pet is archived
      if (!activePetId || !activePets.find(p => p.id === activePetId)) {
        setActivePetId(activePets[0].id);
      }
    }
  }, [pets, activePetId, currentView, isLoading]);

  // Error handling and recovery for navigation state inconsistencies
  useEffect(() => {
    if (isLoading) return;

    const activePets = pets.filter(p => !p.is_archived);

    // Recovery: if activePetId is set but pet doesn't exist, clear it
    if (activePetId && !pets.find(p => p.id === activePetId)) {
      console.warn(`Active pet ${activePetId} no longer exists, clearing selection`);
      setActivePetId(undefined);
    }

    // Recovery: if we're in PetProfile view but no valid pets and not showing add form
    if (
      currentView === ViewType.PetProfile &&
      activePets.length > 0 &&
      getCurrentPetIndex() === -1
    ) {
      console.warn('PetProfile view with pets but no valid active pet, selecting first pet');
      setActivePetId(activePets[0].id);
    }

    // Recovery: if selectedPet is inconsistent with activePetId in PetDetail view
    if (currentView === ViewType.PetDetail && selectedPet && selectedPet.id !== activePetId) {
      console.warn('Selected pet inconsistent with active pet, syncing state');
      setActivePetId(selectedPet.id);
    }
  }, [pets, activePetId, currentView, selectedPet, isLoading, getCurrentPetIndex]);

  // Navigation handlers
  const handlePetClick = (pet: Pet) => {
    setSelectedPet(pet);
    setActivePetId(pet.id);
    setCurrentView(ViewType.PetDetail);
  };

  const handleBackToPetList = () => {
    setCurrentView(ViewType.PetList);
    setSelectedPet(undefined);
  };

  // Pet profile navigation handlers
  const handlePetProfileChange = (index: number) => {
    const activePets = pets.filter(p => !p.is_archived);
    if (index >= 0 && index < activePets.length) {
      const selectedPet = activePets[index];
      setActivePetId(selectedPet.id);
    }
  };

  // Form handlers
  const handleAddPet = () => {
    setEditingPet(undefined);
    if (isMobile) {
      setShowMobileFormPage(true);
    } else {
      setIsFormOpen(true);
    }
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    if (isMobile) {
      setShowMobileFormPage(true);
    } else {
      setIsFormOpen(true);
    }
  };

  const handleBackFromMobileForm = () => {
    setShowMobileFormPage(false);
    setEditingPet(undefined);
  };

  const handleFormSubmit = async (data: PetCreateRequest | PetUpdateRequest) => {
    try {
      setIsSubmitting(true);

      if (editingPet) {
        // Update existing pet
        const updatedPet = await updatePet(editingPet.id, data as PetUpdateRequest);
        if (selectedPet?.id === editingPet.id) {
          setSelectedPet(updatedPet);
        }
      } else {
        // Create new pet
        const newPet = await createPet(data as PetCreateRequest);
        setActivePetId(newPet.id);
        // Navigate to PetProfile view if first pet or if we were in AddPetProfile
        if (pets.filter(p => !p.is_archived).length === 0 || currentView === ViewType.PetProfile) {
          setCurrentView(ViewType.PetProfile);
        }
      }

      // Close appropriate form interface
      if (isMobile) {
        setShowMobileFormPage(false);
      } else {
        setIsFormOpen(false);
      }
      setEditingPet(undefined);
    } catch (error) {
      console.error('Failed to save pet:', error);
      // Error handling is done by the form component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Management handlers
  const handleArchivePet = async (pet: Pet) => {
    try {
      await updatePet(pet.id, { is_archived: true });
      if (activePetId === pet.id) {
        // Switch to another pet if the current one was archived
        const activePets = pets.filter(p => !p.is_archived && p.id !== pet.id);
        setActivePetId(activePets.length > 0 ? activePets[0].id : undefined);
      }
    } catch (error) {
      console.error('Failed to archive pet:', error);
    }
  };

  const handleRestorePet = async (pet: Pet) => {
    try {
      await updatePet(pet.id, { is_archived: false });
    } catch (error) {
      console.error('Failed to restore pet:', error);
    }
  };

  const handleDeletePet = async (pet: Pet) => {
    try {
      setIsDeleting(true);
      await deletePet(pet.id);
      if (activePetId === pet.id) {
        // Switch to another pet if the current one was deleted
        const activePets = pets.filter(p => !p.is_archived && p.id !== pet.id);
        setActivePetId(activePets.length > 0 ? activePets[0].id : undefined);
      }
      setPendingDeletePet(undefined);
    } catch (error) {
      console.error('Failed to delete pet:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (pendingDeletePet) {
      handleDeletePet(pendingDeletePet);
    }
  };

  // Activity handlers
  const handleAddActivity = (pet: Pet) => {
    setSelectedPetForActivity(pet);
    setIsActivityFormOpen(true);
  };

  const handleActivitySubmit = async (activityData: any) => {
    try {
      setIsActivitySubmitting(true);
      // TODO: Implement activity creation with backend
      console.log('Creating activity for pet:', selectedPetForActivity?.name, activityData);

      // Mock success - in real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success feedback
      console.log('Activity created successfully');

      // Close form and refresh pet data if needed
      setIsActivityFormOpen(false);
      setSelectedPetForActivity(undefined);
    } catch (error) {
      console.error('Failed to create activity:', error);
      // Error handling would be done by the form component
    } finally {
      setIsActivitySubmitting(false);
    }
  };

  // Loading and error states
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-orange-700">
            {isInitializing ? 'Initializing Paw Diary...' : 'Starting up...'}
          </p>
          {initError && <p className="text-red-600 text-sm mt-2">{initError}</p>}
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-900">Paw Diary</h1>
                <p className="text-xs text-orange-600 -mt-1">刨刨日记</p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2">
              {pets.length > 0 && (
                <>
                  {currentView === ViewType.PetProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentView(ViewType.PetList)}
                      className="text-orange-700 hover:text-orange-800 hover:bg-orange-100"
                    >
                      View All Pets
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsManagementOpen(true)}
                    className="text-orange-700 hover:text-orange-800 hover:bg-orange-100"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Manage Pets
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* View rendering */}
        {currentView === ViewType.PetList && (
          <>
            {pets.filter(p => !p.is_archived).length === 0 ? (
              <EmptyPetList onAddPet={handleAddPet} />
            ) : (
              <div className="space-y-8">
                {/* Welcome message */}
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-orange-900 mb-2">Welcome back! 🐾</h2>
                  <p className="text-orange-600">
                    Select a pet to view their profile or add a new furry friend to your family.
                  </p>
                </div>

                {/* Pet cards */}
                <PetCardList
                  pets={pets}
                  activePetId={activePetId}
                  onPetClick={handlePetClick}
                  onAddPet={handleAddPet}
                  onEditPet={handleEditPet}
                  onDeletePet={pet => setPendingDeletePet(pet)}
                />
              </div>
            )}
          </>
        )}

        {currentView === ViewType.PetDetail && selectedPet && (
          <PetDetailView pet={selectedPet} onBack={handleBackToPetList} onEdit={handleEditPet} />
        )}

        {currentView === ViewType.PetProfile && (
          <div className="fixed inset-0 z-30 bg-gradient-to-br from-orange-50 to-yellow-50">
            {pets.filter(p => !p.is_archived).length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <AddPetProfile
                  onSubmit={handleFormSubmit}
                  isSubmitting={isSubmitting}
                  onBack={() => setCurrentView(ViewType.PetList)}
                />
              </div>
            ) : (
              <PetProfileNavigationErrorBoundary
                pets={pets.filter(p => !p.is_archived)}
                onNavigateToView={view => {
                  if (view === 'pet-list') {
                    setCurrentView(ViewType.PetList);
                  }
                }}
              >
                <PetProfileNavigation
                  pets={pets.filter(p => !p.is_archived)}
                  activePetIndex={getCurrentPetIndex()}
                  onPetChange={handlePetProfileChange}
                >
                  {(pet, index) => (
                    <PetProfile
                      key={pet.id}
                      pet={pet}
                      onEdit={handleEditPet}
                      onAddActivity={() => handleAddActivity(pet)}
                      currentIndex={index}
                      totalPets={pets.filter(p => !p.is_archived).length}
                      className="h-full"
                    />
                  )}
                </PetProfileNavigation>
              </PetProfileNavigationErrorBoundary>
            )}
          </div>
        )}
      </main>

      {/* Responsive form rendering */}
      {!isMobile && (
        <PetForm
          pet={editingPet}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Activity form */}
      {selectedPetForActivity && (
        <ActivityForm
          pet={selectedPetForActivity}
          open={isActivityFormOpen}
          onOpenChange={setIsActivityFormOpen}
          onSubmit={handleActivitySubmit}
          isSubmitting={isActivitySubmitting}
        />
      )}

      {/* Mobile form page overlay */}
      {isMobile && showMobileFormPage && (
        <div className="fixed inset-0 z-50">
          <PetFormPage
            pet={editingPet}
            onSubmit={handleFormSubmit}
            onBack={handleBackFromMobileForm}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      <PetManagement
        pets={pets}
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        onReorder={reorderPets}
        onArchive={handleArchivePet}
        onRestore={handleRestorePet}
        onDelete={async pet => setPendingDeletePet(pet)}
        onView={handlePetClick}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!pendingDeletePet}
        onOpenChange={open => !open && setPendingDeletePet(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDeletePet?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {pendingDeletePet?.name}'s
              profile and all associated data from your device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Forever'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
