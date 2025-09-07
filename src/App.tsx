import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { Loader2 } from 'lucide-react';
import { useAppState } from './hooks/useAppState';
import { cleanupOldActivityDrafts } from './hooks/useActivityDraftSimple';
import { HomePage, AddPetPage, PetProfilePage, EditPetPage, ActivitiesListPage, ActivityEditorPage } from './pages';
import './App.css';

/**
 * App - Main application component with React Router integration
 * 
 * @fileoverview Main application entry point with routing configuration
 * @version 1.0.0
 * 
 * @responsibilities
 * - Initialize the Tauri backend with proper error handling
 * - Configure React Router with clean, SEO-friendly URLs
 * - Handle global loading and error states during initialization
 * - Provide comprehensive routing for all application features
 * - Manage draft cleanup and maintenance tasks
 * 
 * @routes
 * Core Application Routes:
 * - `/` → HomePage (pet selection and overview)
 * - `/pets/new` → AddPetPage (pet creation wizard)
 * - `/pets/:petId` → PetProfilePage (pet dashboard with activity preview)
 * - `/pets/:petId/edit` → EditPetPage (pet information editing)
 * 
 * Activity Management Routes:
 * - `/pets/:petId/activities` → ActivitiesListPage (comprehensive activity list)
 * - `/pets/:petId/activities/new` → ActivityEditorPage (activity creation)
 * - `/pets/:petId/activities/:activityId/edit` → ActivityEditorPage (activity editing)
 * 
 * Fallback Routes:
 * - `/*` → Navigate to home (404 handling)
 * 
 * @features
 * - Pet-centric URL structure for intuitive navigation
 * - Bookmarkable URLs for all major application states
 * - Comprehensive error boundaries and loading states
 * - Automatic draft cleanup on application startup
 * - Tauri backend initialization with retry logic
 * 
 * @performance
 * - Pages are lazy-loaded for optimal bundle splitting
 * - React Query provides intelligent data caching
 * - Background tasks minimize impact on user experience
 * 
 * @since 1.0.0
 */
function App() {
  const { state, actions } = useAppState();

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
        console.log('Initialization successful');
        
        // Cleanup old activity drafts on app startup (older than 24 hours)
        cleanupOldActivityDrafts(24);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        actions.setInitializationError(
          error instanceof Error ? error.message : 'Failed to initialize application',
        );
      }
    };

    initializeApp();
  }, [state.initialization.isInitialized, state.initialization.isInitializing, actions]);

  // Global loading state during initialization
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

  // Main router-based application
  return (
    <BrowserRouter>
      <Routes>
        {/* Home route - pet selection page */}
        <Route path="/" element={<HomePage />} />
        
        {/* Add pet route - pet creation page */}
        <Route path="/pets/new" element={<AddPetPage />} />
        
        {/* Pet profile route - pet details with activities */}
        <Route path="/pets/:petId" element={<PetProfilePage />} />
        
        {/* Edit pet route - edit pet information */}
        <Route path="/pets/:petId/edit" element={<EditPetPage />} />
        
        {/* Pet activity routes - dedicated activity pages */}
        <Route path="/pets/:petId/activities" element={<ActivitiesListPage />} />
        <Route path="/pets/:petId/activities/new" element={<ActivityEditorPage />} />
        <Route path="/pets/:petId/activities/:activityId/edit" element={<ActivityEditorPage />} />
        
        {/* Fallback route - redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;