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
    isManagementOpen: boolean;
    isActivityFormOpen: boolean;
    showMobileFormPage: boolean;
    showActivityTimeline: boolean;
  };

  // Pet management state
  pets: {
    autoFocusPetId: number | null;
    editingPet?: Pet;
    pendingDeletePet?: Pet;
    selectedPetForActivity?: Pet;
  };

  // Activity navigation state
  activities: {
    selectedPetId?: number;
    selectedActivityId?: number;
    showFilters: boolean;
  };

  // Loading states
  loading: {
    isSubmitting: boolean;
    isDeleting: boolean;
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
  | { type: 'OPEN_MANAGEMENT' }
  | { type: 'CLOSE_MANAGEMENT' }
  | { type: 'OPEN_ACTIVITY_FORM'; payload: Pet }
  | { type: 'CLOSE_ACTIVITY_FORM' }
  | { type: 'SHOW_MOBILE_FORM_PAGE'; payload?: Pet }
  | { type: 'HIDE_MOBILE_FORM_PAGE' }
  | { type: 'SHOW_ACTIVITY_TIMELINE'; payload?: { petId?: number; activityId?: number } }
  | { type: 'HIDE_ACTIVITY_TIMELINE' }

  // Pet management actions
  | { type: 'SET_AUTO_FOCUS_PET'; payload: number }
  | { type: 'CLEAR_AUTO_FOCUS_PET' }
  | { type: 'SET_EDITING_PET'; payload?: Pet }
  | { type: 'SET_PENDING_DELETE_PET'; payload?: Pet }
  | { type: 'SET_SELECTED_PET_FOR_ACTIVITY'; payload?: Pet }

  // Activity navigation actions
  | { type: 'SET_ACTIVITY_PET_FILTER'; payload: number }
  | { type: 'CLEAR_ACTIVITY_PET_FILTER' }
  | { type: 'SET_SELECTED_ACTIVITY'; payload: number }
  | { type: 'CLEAR_SELECTED_ACTIVITY' }
  | { type: 'TOGGLE_ACTIVITY_FILTERS' }

  // Loading actions
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_DELETING'; payload: boolean }
  | { type: 'SET_ACTIVITY_SUBMITTING'; payload: boolean }

  // Combined actions for common workflows
  | { type: 'RESET_ALL_FORMS' }
  | { type: 'COMPLETE_PET_CREATION'; payload: Pet }
  | { type: 'COMPLETE_PET_UPDATE' }
  | { type: 'COMPLETE_PET_DELETION' };

// Initial State
const initialState: AppState = {
  initialization: {
    isInitialized: false,
    isInitializing: false,
  },
  dialogs: {
    isFormOpen: false,
    isManagementOpen: false,
    isActivityFormOpen: false,
    showMobileFormPage: false,
    showActivityTimeline: false,
  },
  pets: {
    autoFocusPetId: null,
  },
  activities: {
    showFilters: false,
  },
  loading: {
    isSubmitting: false,
    isDeleting: false,
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

    case 'OPEN_MANAGEMENT':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          isManagementOpen: true,
        },
      };

    case 'CLOSE_MANAGEMENT':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          isManagementOpen: false,
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

    case 'SHOW_MOBILE_FORM_PAGE':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          showMobileFormPage: true,
        },
        pets: {
          ...state.pets,
          editingPet: action.payload,
        },
      };

    case 'HIDE_MOBILE_FORM_PAGE':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          showMobileFormPage: false,
        },
        pets: {
          ...state.pets,
          editingPet: undefined,
        },
      };

    case 'SHOW_ACTIVITY_TIMELINE':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          showActivityTimeline: true,
        },
        activities: {
          ...state.activities,
          selectedPetId: action.payload?.petId,
          selectedActivityId: action.payload?.activityId,
        },
      };

    case 'HIDE_ACTIVITY_TIMELINE':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          showActivityTimeline: false,
        },
        activities: {
          ...state.activities,
          selectedPetId: undefined,
          selectedActivityId: undefined,
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

    case 'SET_PENDING_DELETE_PET':
      return {
        ...state,
        pets: {
          ...state.pets,
          pendingDeletePet: action.payload,
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
    case 'SET_ACTIVITY_PET_FILTER':
      return {
        ...state,
        activities: {
          ...state.activities,
          selectedPetId: action.payload,
        },
      };

    case 'CLEAR_ACTIVITY_PET_FILTER':
      return {
        ...state,
        activities: {
          ...state.activities,
          selectedPetId: undefined,
        },
      };

    case 'SET_SELECTED_ACTIVITY':
      return {
        ...state,
        activities: {
          ...state.activities,
          selectedActivityId: action.payload,
        },
      };

    case 'CLEAR_SELECTED_ACTIVITY':
      return {
        ...state,
        activities: {
          ...state.activities,
          selectedActivityId: undefined,
        },
      };

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

    case 'SET_DELETING':
      return {
        ...state,
        loading: {
          ...state.loading,
          isDeleting: action.payload,
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
          isManagementOpen: false,
          isActivityFormOpen: false,
          showMobileFormPage: false,
          showActivityTimeline: false,
        },
        pets: {
          ...state.pets,
          editingPet: undefined,
          selectedPetForActivity: undefined,
        },
        loading: {
          isSubmitting: false,
          isDeleting: false,
          isActivitySubmitting: false,
        },
      };

    case 'COMPLETE_PET_CREATION':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          isFormOpen: false,
          showMobileFormPage: false,
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
          showMobileFormPage: false,
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

    case 'COMPLETE_PET_DELETION':
      return {
        ...state,
        pets: {
          ...state.pets,
          pendingDeletePet: undefined,
        },
        loading: {
          ...state.loading,
          isDeleting: false,
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
    openManagement: useCallback(() => dispatch({ type: 'OPEN_MANAGEMENT' }), []),
    closeManagement: useCallback(() => dispatch({ type: 'CLOSE_MANAGEMENT' }), []),
    openActivityForm: useCallback(
      (pet: Pet) => dispatch({ type: 'OPEN_ACTIVITY_FORM', payload: pet }),
      [],
    ),
    closeActivityForm: useCallback(() => dispatch({ type: 'CLOSE_ACTIVITY_FORM' }), []),
    showMobileFormPage: useCallback(
      (pet?: Pet) => dispatch({ type: 'SHOW_MOBILE_FORM_PAGE', payload: pet }),
      [],
    ),
    hideMobileFormPage: useCallback(() => dispatch({ type: 'HIDE_MOBILE_FORM_PAGE' }), []),
    showActivityTimeline: useCallback(
      (options?: { petId?: number; activityId?: number }) =>
        dispatch({ type: 'SHOW_ACTIVITY_TIMELINE', payload: options }),
      [],
    ),
    hideActivityTimeline: useCallback(() => dispatch({ type: 'HIDE_ACTIVITY_TIMELINE' }), []),

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
    setPendingDeletePet: useCallback(
      (pet?: Pet) => dispatch({ type: 'SET_PENDING_DELETE_PET', payload: pet }),
      [],
    ),
    setSelectedPetForActivity: useCallback(
      (pet?: Pet) => dispatch({ type: 'SET_SELECTED_PET_FOR_ACTIVITY', payload: pet }),
      [],
    ),

    // Activity navigation
    setActivityPetFilter: useCallback(
      (petId: number) => dispatch({ type: 'SET_ACTIVITY_PET_FILTER', payload: petId }),
      [],
    ),
    clearActivityPetFilter: useCallback(() => dispatch({ type: 'CLEAR_ACTIVITY_PET_FILTER' }), []),
    setSelectedActivity: useCallback(
      (activityId: number) => dispatch({ type: 'SET_SELECTED_ACTIVITY', payload: activityId }),
      [],
    ),
    clearSelectedActivity: useCallback(() => dispatch({ type: 'CLEAR_SELECTED_ACTIVITY' }), []),
    toggleActivityFilters: useCallback(() => dispatch({ type: 'TOGGLE_ACTIVITY_FILTERS' }), []),

    // Loading states
    setSubmitting: useCallback(
      (isSubmitting: boolean) => dispatch({ type: 'SET_SUBMITTING', payload: isSubmitting }),
      [],
    ),
    setDeleting: useCallback(
      (isDeleting: boolean) => dispatch({ type: 'SET_DELETING', payload: isDeleting }),
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
    completePetDeletion: useCallback(() => dispatch({ type: 'COMPLETE_PET_DELETION' }), []),
  };

  return { state, actions };
}
