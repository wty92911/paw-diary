import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { Loader2 } from 'lucide-react';
import { useAppState } from './hooks/useAppState';
import { HomePage, AddPetPage, PetProfilePage, EditPetPage, ActivitiesPage } from './pages';
import './App.css';

/**
 * App - Main application with React Router integration
 * 
 * Responsibilities:
 * - Initialize the Tauri backend
 * - Configure React Router with clean URL structure
 * - Handle global loading and error states
 * - Provide error boundaries for page-level components
 * 
 * Routes:
 * - / → HomePage (pet selection)
 * - /pets/new → AddPetPage (pet creation)
 * - /pets/:petId → PetProfilePage (pet profile with activities)
 * - /pets/:petId/edit → EditPetPage (edit pet information)
 * - /activities → ActivitiesPage (activity management)
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
        
        {/* Activities route - activity management */}
        <Route path="/activities" element={<ActivitiesPage />} />
        
        {/* Fallback route - redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;