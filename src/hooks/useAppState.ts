import { useReducer, useCallback } from 'react';
import { Pet } from '../lib/types';

// App State Interface
export interface AppState {
  // Initialization state
  initialization: {
    isInitialized: boolean;
    isInitializing: boolean;
    error?: string;
  };

  // Dialog states
  dialogs: {
    isFormOpen: boolean;
    isActivityFormOpen: boolean;
  };

  // Pet management state
  pets: {
    autoFocusPetId: number | null;
    editingPet?: Pet;
    selectedPetForActivity?: Pet;
  };

  // Activity navigation state
  activities: {
    showFilters: boolean;
  };

  // Loading states
  loading: {
    isSubmitting: boolean;
    isActivitySubmitting: boolean;
  };
}

// Action Types
export type AppAction =
  // Initialization actions
  | { type: 'START_INITIALIZATION' }
  | { type: 'COMPLETE_INITIALIZATION' }
  | { type: 'SET_INITIALIZATION_ERROR'; payload: string }
  | { type: 'RESET_INITIALIZATION_ERROR' }

  // Dialog actions
  | { type: 'OPEN_FORM'; payload?: Pet }
  | { type: 'CLOSE_FORM' }
  | { type: 'OPEN_ACTIVITY_FORM'; payload: Pet }
  | { type: 'CLOSE_ACTIVITY_FORM' }

  // Pet management actions
  | { type: 'SET_AUTO_FOCUS_PET'; payload: number }
  | { type: 'CLEAR_AUTO_FOCUS_PET' }
  | { type: 'SET_EDITING_PET'; payload?: Pet }
  | { type: 'SET_SELECTED_PET_FOR_ACTIVITY'; payload?: Pet }

  // Activity navigation actions
  | { type: 'TOGGLE_ACTIVITY_FILTERS' }

  // Loading actions
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ACTIVITY_SUBMITTING'; payload: boolean }

  // Combined actions for common workflows
  | { type: 'RESET_ALL_FORMS' }
  | { type: 'COMPLETE_PET_CREATION'; payload: Pet }
  | { type: 'COMPLETE_PET_UPDATE' };

// Initial State
const initialState: AppState = {
  initialization: {
    isInitialized: false,
    isInitializing: false,
  },
  dialogs: {
    isFormOpen: false,
    isActivityFormOpen: false,
  },
  pets: {
    autoFocusPetId: null,
  },
  activities: {
    showFilters: false,
  },
  loading: {
    isSubmitting: false,
    isActivitySubmitting: false,
  },
};

// Reducer Function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // Initialization actions
    case 'START_INITIALIZATION':
      return {
        ...state,
        initialization: {
          ...state.initialization,
          isInitializing: true,
          error: undefined,
        },
      };

    case 'COMPLETE_INITIALIZATION':
      return {
        ...state,
        initialization: {
          isInitialized: true,
          isInitializing: false,
          error: undefined,
        },
      };

    case 'SET_INITIALIZATION_ERROR':
      return {
        ...state,
        initialization: {
          ...state.initialization,
          isInitializing: false,
          error: action.payload,
        },
      };

    case 'RESET_INITIALIZATION_ERROR':
      return {
        ...state,
        initialization: {
          ...state.initialization,
          error: undefined,
        },
      };

    // Dialog actions
    case 'OPEN_FORM':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          isFormOpen: true,
        },
        pets: {
          ...state.pets,
          editingPet: action.payload,
        },
      };

    case 'CLOSE_FORM':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          isFormOpen: false,
        },
        pets: {
          ...state.pets,
          editingPet: undefined,
        },
      };

    case 'OPEN_ACTIVITY_FORM':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          isActivityFormOpen: true,
        },
        pets: {
          ...state.pets,
          selectedPetForActivity: action.payload,
        },
      };

    case 'CLOSE_ACTIVITY_FORM':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          isActivityFormOpen: false,
        },
        pets: {
          ...state.pets,
          selectedPetForActivity: undefined,
        },
      };

    // Pet management actions
    case 'SET_AUTO_FOCUS_PET':
      return {
        ...state,
        pets: {
          ...state.pets,
          autoFocusPetId: action.payload,
        },
      };

    case 'CLEAR_AUTO_FOCUS_PET':
      return {
        ...state,
        pets: {
          ...state.pets,
          autoFocusPetId: null,
        },
      };

    case 'SET_EDITING_PET':
      return {
        ...state,
        pets: {
          ...state.pets,
          editingPet: action.payload,
        },
      };

    case 'SET_SELECTED_PET_FOR_ACTIVITY':
      return {
        ...state,
        pets: {
          ...state.pets,
          selectedPetForActivity: action.payload,
        },
      };

    // Activity navigation actions

    case 'TOGGLE_ACTIVITY_FILTERS':
      return {
        ...state,
        activities: {
          ...state.activities,
          showFilters: !state.activities.showFilters,
        },
      };

    // Loading actions
    case 'SET_SUBMITTING':
      return {
        ...state,
        loading: {
          ...state.loading,
          isSubmitting: action.payload,
        },
      };

    case 'SET_ACTIVITY_SUBMITTING':
      return {
        ...state,
        loading: {
          ...state.loading,
          isActivitySubmitting: action.payload,
        },
      };

    // Combined actions for common workflows
    case 'RESET_ALL_FORMS':
      return {
        ...state,
        dialogs: {
          isFormOpen: false,
          isActivityFormOpen: false,
        },
        pets: {
          ...state.pets,
          editingPet: undefined,
          selectedPetForActivity: undefined,
        },
        loading: {
          isSubmitting: false,
          isActivitySubmitting: false,
        },
      };

    case 'COMPLETE_PET_CREATION':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          isFormOpen: false,
        },
        pets: {
          ...state.pets,
          editingPet: undefined,
          autoFocusPetId: action.payload.id,
        },
        loading: {
          ...state.loading,
          isSubmitting: false,
        },
      };

    case 'COMPLETE_PET_UPDATE':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          isFormOpen: false,
        },
        pets: {
          ...state.pets,
          editingPet: undefined,
        },
        loading: {
          ...state.loading,
          isSubmitting: false,
        },
      };

    default:
      return state;
  }
}

// Custom Hook
export function useAppState() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators for common operations
  const actions = {
    // Initialization
    startInitialization: useCallback(() => dispatch({ type: 'START_INITIALIZATION' }), []),
    completeInitialization: useCallback(() => dispatch({ type: 'COMPLETE_INITIALIZATION' }), []),
    setInitializationError: useCallback(
      (error: string) => dispatch({ type: 'SET_INITIALIZATION_ERROR', payload: error }),
      [],
    ),
    resetInitializationError: useCallback(
      () => dispatch({ type: 'RESET_INITIALIZATION_ERROR' }),
      [],
    ),

    // Dialog management
    openForm: useCallback((pet?: Pet) => dispatch({ type: 'OPEN_FORM', payload: pet }), []),
    closeForm: useCallback(() => dispatch({ type: 'CLOSE_FORM' }), []),
    openActivityForm: useCallback(
      (pet: Pet) => dispatch({ type: 'OPEN_ACTIVITY_FORM', payload: pet }),
      [],
    ),
    closeActivityForm: useCallback(() => dispatch({ type: 'CLOSE_ACTIVITY_FORM' }), []),

    // Pet management
    setAutoFocusPet: useCallback(
      (petId: number) => dispatch({ type: 'SET_AUTO_FOCUS_PET', payload: petId }),
      [],
    ),
    clearAutoFocusPet: useCallback(() => dispatch({ type: 'CLEAR_AUTO_FOCUS_PET' }), []),
    setEditingPet: useCallback(
      (pet?: Pet) => dispatch({ type: 'SET_EDITING_PET', payload: pet }),
      [],
    ),
    setSelectedPetForActivity: useCallback(
      (pet?: Pet) => dispatch({ type: 'SET_SELECTED_PET_FOR_ACTIVITY', payload: pet }),
      [],
    ),

    // Activity navigation
    toggleActivityFilters: useCallback(() => dispatch({ type: 'TOGGLE_ACTIVITY_FILTERS' }), []),

    // Loading states
    setSubmitting: useCallback(
      (isSubmitting: boolean) => dispatch({ type: 'SET_SUBMITTING', payload: isSubmitting }),
      [],
    ),
    setActivitySubmitting: useCallback(
      (isSubmitting: boolean) =>
        dispatch({ type: 'SET_ACTIVITY_SUBMITTING', payload: isSubmitting }),
      [],
    ),

    // Combined workflows
    resetAllForms: useCallback(() => dispatch({ type: 'RESET_ALL_FORMS' }), []),
    completePetCreation: useCallback(
      (pet: Pet) => dispatch({ type: 'COMPLETE_PET_CREATION', payload: pet }),
      [],
    ),
    completePetUpdate: useCallback(() => dispatch({ type: 'COMPLETE_PET_UPDATE' }), []),
  };

  return { state, actions };
}
