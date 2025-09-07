/**
 * Page-level components for the Paw Diary application
 *
 * This module provides centralized exports for all page components used in the
 * React Router-based architecture. Each page represents a complete UI state
 * with its own URL route and navigation context.
 *
 * @fileoverview Page exports and routing documentation for Paw Diary
 * @version 1.0.0
 */

// === Core Application Pages ===

/**
 * HomePage - Landing page with pet selection and overview
 * Route: /
 * Purpose: Main entry point, pet selection, app overview
 */
export { HomePage } from './HomePage';

/**
 * AddPetPage - Pet creation and onboarding flow
 * Route: /pets/new
 * Purpose: Add new pets with profile setup and photo upload
 */
export { AddPetPage } from './AddPetPage';

/**
 * PetProfilePage - Individual pet profile with activity preview
 * Route: /pets/:petId
 * Purpose: Pet dashboard, recent activities, quick stats
 */
export { PetProfilePage } from './PetProfilePage';

/**
 * EditPetPage - Pet information editing interface
 * Route: /pets/:petId/edit
 * Purpose: Update pet details, photos, and settings
 */
export { EditPetPage } from './EditPetPage';

// === Activity Management Pages ===

/**
 * ActivitiesListPage - Comprehensive activity list with filtering
 * Route: /pets/:petId/activities
 * Purpose: Browse, filter, and manage all activities for a pet
 * Features: Advanced filtering, sorting, bulk operations, timeline view
 */
export { ActivitiesListPage } from './ActivitiesListPage';

/**
 * ActivityEditorPage - Activity creation and editing interface
 * Routes:
 * - /pets/:petId/activities/new (create)
 * - /pets/:petId/activities/:activityId/edit (edit)
 * Purpose: Create and edit activities with rich block-based editor
 * Features: Multi-mode editing, draft management, validation, auto-save
 */
export { ActivityEditorPage } from './ActivityEditorPage';

/**
 * ActivitiesPage - Legacy activity management (deprecated)
 * Route: Not currently routed (legacy)
 * Purpose: Original activity interface, maintained for migration
 * Status: Deprecated - use ActivitiesListPage instead
 */
export { ActivitiesPage } from './ActivitiesPage';

// === Default Exports for Dynamic Imports ===

export { default as HomePageDefault } from './HomePage';
export { default as AddPetPageDefault } from './AddPetPage';
export { default as PetProfilePageDefault } from './PetProfilePage';
export { default as EditPetPageDefault } from './EditPetPage';
export { default as ActivitiesPageDefault } from './ActivitiesPage';
export { default as ActivitiesListPageDefault } from './ActivitiesListPage';
export { default as ActivityEditorPageDefault } from './ActivityEditorPage';
