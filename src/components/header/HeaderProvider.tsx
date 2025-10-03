/* eslint-disable react-refresh/only-export-components */
// HeaderProvider exports both context and related hooks

/**
 * Header Provider Component
 * 
 * React Context provider for header state management
 * Manages configuration, theme, loading states, and error handling
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import {
  type HeaderContextState,
  type HeaderContextAction,
  type HeaderContextType,
  type HeaderConfiguration,
  type HeaderTheme,
  HeaderVariant,
  type ColorScheme,
  DEFAULT_HEADER_THEME
} from './types';

// ============================================================================
// Default State
// ============================================================================

const DEFAULT_CONFIGURATION: HeaderConfiguration = {
  variant: HeaderVariant.APP,
  showBackButton: false,
  sticky: true,
  title: ''
};

const INITIAL_STATE: HeaderContextState = {
  configuration: DEFAULT_CONFIGURATION,
  theme: DEFAULT_HEADER_THEME,
  isLoading: false,
  error: null
};

// ============================================================================
// Context Creation
// ============================================================================

const HeaderContext = createContext<HeaderContextType | null>(null);

// ============================================================================
// Reducer Function
// ============================================================================

function headerReducer(state: HeaderContextState, action: HeaderContextAction): HeaderContextState {
  switch (action.type) {
    case 'SET_CONFIGURATION':
      return {
        ...state,
        configuration: action.payload,
        error: null
      };
    
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case 'RESET':
      return INITIAL_STATE;
    
    default:
      return state;
  }
}

// ============================================================================
// Provider Component Props
// ============================================================================

interface HeaderProviderProps {
  children: React.ReactNode;
  initialConfiguration?: Partial<HeaderConfiguration>;
  initialTheme?: Partial<HeaderTheme>;
}

// ============================================================================
// Provider Component
// ============================================================================

export function HeaderProvider({
  children,
  initialConfiguration,
  initialTheme
}: HeaderProviderProps) {
  // Merge initial props with defaults
  const mergedInitialState = useMemo((): HeaderContextState => ({
    configuration: {
      ...DEFAULT_CONFIGURATION,
      ...initialConfiguration
    },
    theme: {
      ...DEFAULT_HEADER_THEME,
      ...initialTheme
    },
    isLoading: false,
    error: null
  }), [initialConfiguration, initialTheme]);

  const [state, dispatch] = useReducer(headerReducer, mergedInitialState);

  // ============================================================================
  // Action Creators
  // ============================================================================

  const updateConfiguration = useCallback((config: Partial<HeaderConfiguration>) => {
    const newConfiguration = {
      ...state.configuration,
      ...config
    };
    
    dispatch({
      type: 'SET_CONFIGURATION',
      payload: newConfiguration
    });
  }, [state.configuration]);

  const updateTheme = useCallback((theme: Partial<HeaderTheme>) => {
    const newTheme = {
      ...state.theme,
      ...theme
    };
    
    dispatch({
      type: 'SET_THEME',
      payload: newTheme
    });
  }, [state.theme]);

  const resetHeader = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue = useMemo((): HeaderContextType => ({
    state,
    dispatch,
    updateConfiguration,
    updateTheme,
    resetHeader
  }), [state, updateConfiguration, updateTheme, resetHeader]);

  return (
    <HeaderContext.Provider value={contextValue}>
      {children}
    </HeaderContext.Provider>
  );
}

// ============================================================================
// Hook for Using Header Context
// ============================================================================

export function useHeaderContext(): HeaderContextType {
  const context = useContext(HeaderContext);
  
  if (!context) {
    throw new Error('useHeaderContext must be used within a HeaderProvider');
  }
  
  return context;
}

// ============================================================================
// Additional Hooks for Specific Use Cases
// ============================================================================

export function useHeaderConfiguration() {
  const { state, updateConfiguration } = useHeaderContext();
  
  return {
    configuration: state.configuration,
    updateConfiguration,
    isLoading: state.isLoading,
    error: state.error
  };
}

export function useHeaderTheme() {
  const { state, updateTheme } = useHeaderContext();
  
  const setColorScheme = useCallback((scheme: ColorScheme) => {
    updateTheme({ colorScheme: scheme });
  }, [updateTheme]);

  return {
    theme: state.theme,
    updateTheme,
    colorScheme: state.theme.colorScheme,
    setColorScheme
  };
}

// ============================================================================
// Export Types for External Use
// ============================================================================

export type { HeaderContextType, HeaderContextState, HeaderContextAction };