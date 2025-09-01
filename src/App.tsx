import { useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Pet, PetCreateRequest, PetUpdateRequest } from './lib/types';
import { usePets } from './hooks/usePets';
import { useAppState } from './hooks/useAppState';
import { PetThumbnailNavigation } from './components/pets/PetThumbnailNavigation';
import { PetForm } from './components/pets/PetForm';
import { PetFormPage } from './components/pets/PetFormPage';
import { PetManagement } from './components/pets/PetManagement';
import { ActivityForm } from './components/activities/ActivityForm';
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
  // Hooks
  const { pets, isLoading, error, refetch, createPet, updatePet, deletePet, reorderPets } =
    usePets();
  const { isMobile } = useResponsiveNavigation();
  const { state, actions } = useAppState();

  // Optimized selective photo preloading - only preload first 5 pets immediately
  usePreloadPetPhotos(pets, {
    maxPreload: 8, // Maximum 8 photos to preload
    priorityCount: 3, // Load first 3 immediately, rest with delay
    preloadAll: false, // Use intelligent selective preloading
  });

  // Clear auto-focus after timeout
  const handleAutoFocusComplete = useCallback(() => {
    actions.clearAutoFocusPet();
  }, [actions]);

  // Initialize the app
  useEffect(() => {
    // Prevent multiple initialization attempts
    if (state.initialization.isInitializing || state.initialization.isInitialized) {
      return;
    }

    const initializeApp = async () => {
      console.log('=== FRONTEND INITIALIZATION START ===');

      try {
        console.log('Setting isInitializing to true');
        actions.startInitialization();

        console.log('Calling initialize_app command...');
        const result = await invoke('initialize_app');
        console.log('initialize_app result:', result);

        actions.completeInitialization();
        console.log('Initialization successful, fetching pets...');
        // Fetch pets after initialization
        await refetch();
        console.log('Pets fetched successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
        actions.setInitializationError(
          error instanceof Error ? error.message : 'Failed to initialize application',
        );
      }
    };

    initializeApp();
  }, [state.initialization.isInitialized, state.initialization.isInitializing, refetch, actions]); // Include all dependencies

  // Form handlers
  const handleAddPet = useCallback(() => {
    if (isMobile) {
      actions.showMobileFormPage();
    } else {
      actions.openForm();
    }
  }, [isMobile, actions]);

  const handleEditPet = useCallback(
    (pet: Pet) => {
      if (isMobile) {
        actions.showMobileFormPage(pet);
      } else {
        actions.openForm(pet);
      }
    },
    [isMobile, actions],
  );

  const handleBackFromMobileForm = useCallback(() => {
    actions.hideMobileFormPage();
  }, [actions]);

  const handleFormSubmit = useCallback(
    async (data: PetCreateRequest | PetUpdateRequest) => {
      try {
        actions.setSubmitting(true);

        if (state.pets.editingPet) {
          // Update existing pet
          await updatePet(state.pets.editingPet.id, data as PetUpdateRequest);
          actions.completePetUpdate();
        } else {
          // Create new pet and auto-focus on it
          const newPet = await createPet(data as PetCreateRequest);
          actions.completePetCreation(newPet);
        }
      } catch (error) {
        console.error('Failed to save pet:', error);
        actions.setSubmitting(false);
        // Error handling is done by the form component
      }
    },
    [state.pets.editingPet, updatePet, createPet, actions],
  );

  // Management handlers
  const handleArchivePet = useCallback(
    async (pet: Pet) => {
      try {
        await updatePet(pet.id, { is_archived: true });
      } catch (error) {
        console.error('Failed to archive pet:', error);
      }
    },
    [updatePet],
  );

  const handleRestorePet = useCallback(
    async (pet: Pet) => {
      try {
        await updatePet(pet.id, { is_archived: false });
      } catch (error) {
        console.error('Failed to restore pet:', error);
      }
    },
    [updatePet],
  );

  const handleDeletePet = useCallback(
    async (pet: Pet) => {
      try {
        actions.setDeleting(true);
        await deletePet(pet.id);
        actions.completePetDeletion();
      } catch (error) {
        console.error('Failed to delete pet:', error);
        actions.setDeleting(false);
      }
    },
    [deletePet, actions],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (state.pets.pendingDeletePet) {
      handleDeletePet(state.pets.pendingDeletePet);
    }
  }, [state.pets.pendingDeletePet, handleDeletePet]);

  // Activity handlers
  const handleActivitySubmit = useCallback(
    async (activityData: Record<string, unknown>) => {
      try {
        actions.setActivitySubmitting(true);
        // TODO: Implement activity creation with backend
        console.log(
          'Creating activity for pet:',
          state.pets.selectedPetForActivity?.name,
          activityData,
        );

        // Mock success - in real implementation, this would call the backend
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success feedback
        console.log('Activity created successfully');

        // Close form and refresh pet data if needed
        actions.closeActivityForm();
      } catch (error) {
        console.error('Failed to create activity:', error);
        actions.setActivitySubmitting(false);
        // Error handling would be done by the form component
      }
    },
    [state.pets.selectedPetForActivity, actions],
  );

  // Loading and error states
  if (!state.initialization.isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-orange-700">
            {state.initialization.isInitializing ? 'Initializing Paw Diary...' : 'Starting up...'}
          </p>
          {state.initialization.error && (
            <p className="text-red-600 text-sm mt-2">{state.initialization.error}</p>
          )}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actions.openManagement}
                  className="text-orange-700 hover:text-orange-800 hover:bg-orange-100"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Manage Pets
                </Button>
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

        {/* Immersive Thumbnail Navigation - Default View */}
        <div className="fixed inset-0 z-30 bg-gradient-to-br from-orange-50 to-yellow-50 overflow-hidden">
          <PetThumbnailNavigation
            pets={pets.filter(p => !p.is_archived)}
            onPetSelect={undefined}
            onAddPet={handleAddPet}
            onEditPet={handleEditPet}
            onAddActivity={() => console.log('Add activity clicked')}
            autoFocusPetId={state.pets.autoFocusPetId}
            onAutoFocusComplete={handleAutoFocusComplete}
            className="h-full"
            showAddPetCard={true}
            enableElasticFeedback={true}
            autoPlay={false}
          />
        </div>
      </main>

      {/* Responsive form rendering */}
      {!isMobile && (
        <PetForm
          pet={state.pets.editingPet}
          open={state.dialogs.isFormOpen}
          onOpenChange={open => (open ? actions.openForm() : actions.closeForm())}
          onSubmit={handleFormSubmit}
          isSubmitting={state.loading.isSubmitting}
        />
      )}

      {/* Activity form */}
      {state.pets.selectedPetForActivity && (
        <ActivityForm
          pet={state.pets.selectedPetForActivity}
          open={state.dialogs.isActivityFormOpen}
          onOpenChange={open =>
            open
              ? actions.openActivityForm(state.pets.selectedPetForActivity!)
              : actions.closeActivityForm()
          }
          onSubmit={handleActivitySubmit}
          isSubmitting={state.loading.isActivitySubmitting}
        />
      )}

      {/* Mobile form page overlay */}
      {isMobile && state.dialogs.showMobileFormPage && (
        <div className="fixed inset-0 z-50">
          <PetFormPage
            pet={state.pets.editingPet}
            onSubmit={handleFormSubmit}
            onBack={handleBackFromMobileForm}
            isSubmitting={state.loading.isSubmitting}
          />
        </div>
      )}

      <PetManagement
        pets={pets}
        isOpen={state.dialogs.isManagementOpen}
        onClose={actions.closeManagement}
        onReorder={reorderPets}
        onArchive={handleArchivePet}
        onRestore={handleRestorePet}
        onDelete={async (pet: Pet) => actions.setPendingDeletePet(pet)}
        onView={pet => console.log('View pet:', pet.name)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!state.pets.pendingDeletePet}
        onOpenChange={open => !open && actions.setPendingDeletePet(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {state.pets.pendingDeletePet?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              {state.pets.pendingDeletePet?.name}'s profile and all associated data from your
              device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={state.loading.isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={state.loading.isDeleting}
            >
              {state.loading.isDeleting ? (
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
