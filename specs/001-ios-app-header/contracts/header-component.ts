/**
 * Header Component API Contracts
 * 
 * Defines TypeScript interfaces and component APIs for the Universal Header Component
 * These contracts ensure type safety and consistent integration across the application
 */

import { ReactNode, ComponentType } from 'react';

// ============================================================================
// Core Enums
// ============================================================================

export enum HeaderVariant {
  APP = 'app',
  PET_CONTEXT = 'pet-context',
  FORM = 'form'
}

export enum BackActionType {
  ROUTER_BACK = 'router-back',
  CUSTOM_HANDLER = 'custom-handler', 
  NAVIGATE_TO_URL = 'navigate-to-url'
}

export enum PetPhotoSize {
  SMALL = 'small',    // 32px
  MEDIUM = 'medium',  // 48px  
  LARGE = 'large'     // 64px
}

export enum ActionVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  GHOST = 'ghost',
  DESTRUCTIVE = 'destructive'
}

export enum ActionPosition {
  LEADING = 'leading',
  TRAILING = 'trailing'
}

export enum ColorScheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

export enum ElevationLevel {
  NONE = 'none',
  LOW = 'low', 
  MEDIUM = 'medium',
  HIGH = 'high'
}

// ============================================================================
// Core Interfaces
// ============================================================================

export interface BackAction {
  type: BackActionType;
  handler?: () => void;
  url?: string;
  label?: string;
  disabled?: boolean;
}

export interface Pet {
  id: number;
  name: string;
  species: string;
  photo_path?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active: boolean;
}

export interface PetContext {
  pet: Pet;
  breadcrumbs?: BreadcrumbItem[];
  showPetPhoto: boolean;
  photoSize: PetPhotoSize;
  showSpecies: boolean;
}

export interface HeaderAction {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  handler: () => void;
  variant: ActionVariant;
  position: ActionPosition;
  disabled?: boolean;
  visible?: boolean;
}

export interface SpacingScale {
  padding: {
    x: string;
    y: string;
  };
  gap: string;
}

export interface TypographyScale {
  title: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
  subtitle: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
}

export interface HeaderTheme {
  colorScheme: ColorScheme;
  spacing: SpacingScale;
  typography: TypographyScale;
  elevation: ElevationLevel;
}

export interface HeaderConfiguration {
  variant: HeaderVariant;
  title?: string;
  showBackButton: boolean;
  backAction?: BackAction;
  sticky: boolean;
  className?: string;
  petContext?: PetContext;
  actions?: HeaderAction[];
  theme?: Partial<HeaderTheme>;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

export interface UniversalHeaderProps {
  configuration: HeaderConfiguration;
  children?: ReactNode;
  onConfigurationChange?: (config: HeaderConfiguration) => void;
}

export interface AppHeaderProps {
  title: string;
  actions?: HeaderAction[];
  sticky?: boolean;
  className?: string;
}

export interface PetContextHeaderProps {
  pet: Pet;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  backAction?: BackAction;
  showPetPhoto?: boolean;
  photoSize?: PetPhotoSize;
  showSpecies?: boolean;
  sticky?: boolean;
  className?: string;
}

export interface FormHeaderProps {
  title: string;
  showBackButton?: boolean;
  backAction?: BackAction;
  subtitle?: string;
  sticky?: boolean;
  className?: string;
}

export interface HeaderBrandProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}

export interface HeaderNavigationProps {
  showBackButton: boolean;
  backAction?: BackAction;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export interface HeaderActionsProps {
  actions: HeaderAction[];
  className?: string;
}

// ============================================================================
// Context Interfaces
// ============================================================================

export interface HeaderContextState {
  configuration: HeaderConfiguration;
  theme: HeaderTheme;
  isLoading: boolean;
  error: string | null;
}

export type HeaderContextAction =
  | { type: 'SET_CONFIGURATION'; payload: HeaderConfiguration }
  | { type: 'SET_THEME'; payload: HeaderTheme }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

export interface HeaderContextType {
  state: HeaderContextState;
  dispatch: React.Dispatch<HeaderContextAction>;
  updateConfiguration: (config: Partial<HeaderConfiguration>) => void;
  updateTheme: (theme: Partial<HeaderTheme>) => void;
  resetHeader: () => void;
}

// ============================================================================
// Hook Interfaces
// ============================================================================

export interface UseHeaderConfigReturn {
  configuration: HeaderConfiguration;
  updateConfiguration: (config: Partial<HeaderConfiguration>) => void;
  resetConfiguration: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface UseHeaderThemeReturn {
  theme: HeaderTheme;
  updateTheme: (theme: Partial<HeaderTheme>) => void;
  resetTheme: () => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

export interface UseHeaderNavigationReturn {
  goBack: () => void;
  canGoBack: boolean;
  navigateTo: (url: string) => void;
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
}

// ============================================================================
// Utility Type Definitions
// ============================================================================

export type HeaderVariantProps<T extends HeaderVariant> = 
  T extends HeaderVariant.APP ? AppHeaderProps :
  T extends HeaderVariant.PET_CONTEXT ? PetContextHeaderProps :
  T extends HeaderVariant.FORM ? FormHeaderProps :
  never;

export type RequiredConfiguration = Pick<HeaderConfiguration, 'variant' | 'showBackButton' | 'sticky'>;
export type OptionalConfiguration = Omit<HeaderConfiguration, keyof RequiredConfiguration>;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_HEADER_THEME: HeaderTheme = {
  colorScheme: ColorScheme.AUTO,
  spacing: {
    padding: {
      x: 'px-4',
      y: 'py-3'
    },
    gap: 'gap-3'
  },
  typography: {
    title: {
      fontSize: 'text-xl',
      fontWeight: 'font-bold',
      lineHeight: 'leading-6'
    },
    subtitle: {
      fontSize: 'text-sm',
      fontWeight: 'font-medium',
      lineHeight: 'leading-4'
    }
  },
  elevation: ElevationLevel.LOW
};

export const DEFAULT_PET_PHOTO_SIZE = PetPhotoSize.MEDIUM;
export const DEFAULT_BACK_LABEL = 'Back';
export const MAX_BREADCRUMBS = 5;
export const MAX_TITLE_LENGTH = 50;
export const MAX_ACTION_LABEL_LENGTH = 15;

// ============================================================================
// Error Types
// ============================================================================

export class HeaderConfigurationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'HeaderConfigurationError';
  }
}

export class HeaderValidationError extends Error {
  constructor(message: string, public errors: Record<string, string>) {
    super(message);
    this.name = 'HeaderValidationError';
  }
}