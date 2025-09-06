import { useReducer, useCallback } from 'react';

// App State Interface
export interface AppState {
  // Initialization state
  initialization: {
    isInitialized: boolean;
    isInitializing: boolean;
    error?: string;
  };
}

// Action Types
export type AppAction =
  // Initialization actions
  | { type: 'START_INITIALIZATION' }
  | { type: 'COMPLETE_INITIALIZATION' }
  | { type: 'SET_INITIALIZATION_ERROR'; payload: string }
  | { type: 'RESET_INITIALIZATION_ERROR' };

// Initial State
const initialState: AppState = {
  initialization: {
    isInitialized: false,
    isInitializing: false,
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
  };

  return { state, actions };
}
