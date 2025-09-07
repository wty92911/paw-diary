# Tasks Document

## Phase 1: Routing & Navigation Setup

- [ ] 1. Update React Router configuration in App.tsx
  - File: src/App.tsx
  - Add new activity page routes: `/pets/:petId/activities`, `/pets/:petId/activities/new`, `/pets/:petId/activities/:activityId/edit`
  - Update imports for new page components
  - Purpose: Enable navigation to dedicated activity pages
  - _Leverage: Existing BrowserRouter setup, Navigate component_
  - _Requirements: 2.1, 5.1_

- [ ] 2. Create PetContextHeader component
  - File: src/components/pets/PetContextHeader.tsx
  - Implement header showing pet name, photo, and back navigation
  - Add breadcrumb-style navigation indicators
  - Purpose: Provide consistent pet context across activity pages
  - _Leverage: src/components/pets/PetProfilePhoto.tsx, src/components/ui/button.tsx_
  - _Requirements: 5.1_

- [ ] 3. Create activity page routing types
  - File: src/lib/types/routing.ts
  - Define PetActivityRouteParams and ActivityEditorQueryParams interfaces
  - Add route parameter validation utilities
  - Purpose: Type-safe routing for activity pages
  - _Leverage: Existing type definitions in src/lib/types.ts_
  - _Requirements: 1.1, 2.1_

## Phase 2: Activities List Page

- [ ] 4. Create ActivitiesListPage component
  - File: src/pages/ActivitiesListPage.tsx
  - Implement main activities list page with pet context header
  - Add floating action button for new activity creation
  - Handle pet ID parameter extraction and validation
  - Purpose: Dedicated page for viewing all activities for a specific pet
  - _Leverage: src/components/activities/ActivityTimeline.tsx, src/components/pets/PetContextHeader.tsx_
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 5. Create FilterBar component
  - File: src/components/activities/FilterBar.tsx
  - Implement activity filtering by category, date range, attachments
  - Support both full-featured and simplified filter modes
  - Add filter persistence per pet context
  - Purpose: Enable activity filtering and search functionality
  - _Leverage: src/components/ui/select.tsx, src/components/ui/input.tsx, src/components/ui/checkbox.tsx_
  - _Requirements: 2.2_

- [ ] 6. Enhance ActivityTimeline for page context
  - File: src/components/activities/ActivityTimeline.tsx (modify existing)
  - Add click navigation to activity editor page
  - Implement long-press context menu (edit, delete, copy)
  - Add empty state when no activities exist
  - Purpose: Integrate timeline with new page-based navigation
  - _Leverage: Existing ActivityTimeline component, src/components/ui/dropdown-menu.tsx_
  - _Requirements: 2.2, 2.3_

- [ ] 7. Add activities list state management
  - File: src/hooks/useActivitiesList.ts
  - Create hook for activities list page state (filters, sort, pagination)
  - Implement filter persistence using localStorage per pet
  - Add optimistic updates for activity operations
  - Purpose: Manage complex list page state and user preferences
  - _Leverage: Existing useAppState hook patterns, React Query patterns_
  - _Requirements: 2.2, 2.3_

## Phase 3: Activity Editor Page

- [ ] 8. Create ActivityEditorPage component
  - File: src/pages/ActivityEditorPage.tsx
  - Implement full-screen activity editor with pet context
  - Handle route parameters (petId, activityId) and query params (mode, template)
  - Add save/cancel navigation back to activities list
  - Purpose: Dedicated full-screen activity editing experience
  - _Leverage: src/components/activities/ActivityEditor.tsx, src/components/pets/PetContextHeader.tsx_
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 9. Enhance ActivityEditor for page context
  - File: src/components/activities/ActivityEditor.tsx (modify existing)
  - Remove dialog wrapper, adapt for full-screen page usage
  - Add pet context validation and error handling
  - Implement return navigation with unsaved changes confirmation
  - Purpose: Adapt existing editor for page-based usage
  - _Leverage: Existing ActivityEditor component, all activity blocks_
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 10. Implement draft auto-save system
  - File: src/hooks/useActivityDraft.ts
  - Create hook for automatic draft saving every 30 seconds
  - Add draft recovery on page reload or navigation return
  - Implement draft cleanup after successful save
  - Purpose: Prevent data loss during activity editing
  - _Leverage: localStorage patterns, existing form hooks_
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 11. Add activity editor query parameter handling
  - File: src/utils/activityEditorParams.ts
  - Create utilities for parsing mode and template query parameters
  - Handle URL state synchronization with editor mode switching
  - Add parameter validation and defaults
  - Purpose: Support different editor modes via URL parameters
  - _Leverage: React Router useSearchParams, existing validation utilities_
  - _Requirements: 3.1, 3.2_

## Phase 4: Pet Profile Simplification

- [ ] 12. Simplify PetProfile component
  - File: src/components/pets/PetProfile.tsx (modify existing)
  - Remove full activity timeline display
  - Add recent activities preview (1-3 activities)
  - Implement "View All Activities" button navigation
  - Purpose: Focus pet profile on pet information with activity preview
  - _Leverage: Existing PetProfile component, src/components/activities/ActivityCard.tsx_
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 13. Create ActivityPreviewSection component
  - File: src/components/activities/ActivityPreviewSection.tsx
  - Display 1-3 most recent activities with simplified cards
  - Add "View All Activities" call-to-action button
  - Handle empty state when no activities exist
  - Purpose: Provide activity preview without full timeline complexity
  - _Leverage: src/components/activities/ActivityCard.tsx, src/components/ui/card.tsx_
  - _Requirements: 4.2, 4.3_

## Phase 5: Backend Integration

- [ ] 14. Update Tauri commands for pet context validation
  - File: src-tauri/src/commands.rs (modify existing)
  - Add pet_id validation to all activity CRUD commands
  - Implement PetError::PetNotFound error type
  - Add database constraints validation
  - Purpose: Ensure all activity operations are pet-bound
  - _Leverage: Existing activity commands, error handling patterns_
  - _Requirements: 1.1, 1.4, 6.1_

- [ ] 15. Enhance activity database schema
  - File: src-tauri/migrations/add_activity_drafts.sql
  - Create activity_drafts table with pet_id and activity_id support
  - Add indexes for efficient draft queries
  - Implement draft cleanup procedures
  - Purpose: Support draft functionality at database level
  - _Leverage: Existing migration patterns, activities table schema_
  - _Requirements: 7.1, 7.2_

- [ ] 16. Add draft management Tauri commands
  - File: src-tauri/src/commands.rs (add to existing)
  - Implement save_activity_draft, get_activity_draft, delete_activity_draft commands
  - Add automatic draft cleanup for old drafts (7+ days)
  - Handle both new activity and edit activity draft scenarios
  - Purpose: Enable frontend draft functionality
  - _Leverage: Existing command patterns, database connection handling_
  - _Requirements: 7.1, 7.2, 7.4_

## Phase 6: Error Handling & User Experience

- [ ] 17. Implement unified error boundary system
  - File: src/components/ErrorBoundary.tsx (enhance existing)
  - Add activity-specific error handling and recovery options
  - Implement error state UI for invalid pet context
  - Add error reporting with context information
  - Purpose: Provide consistent error handling across activity pages
  - _Leverage: Existing error handling patterns, React error boundaries_
  - _Requirements: 1.2, 4.1, 4.2_

- [ ] 18. Add save feedback animation system
  - File: src/components/activities/ActivitySaveAnimation.tsx
  - Implement highlight/flash animation for newly saved activities
  - Add smooth scroll to updated activity in timeline
  - Create toast notification coordination with visual feedback
  - Purpose: Provide immediate visual confirmation of save operations
  - _Leverage: CSS animations, scroll utilities, existing toast system_
  - _Requirements: 2.3, 3.3_

- [ ] 19. Implement draft state visual indicators
  - File: src/components/activities/DraftIndicator.tsx
  - Add "• Draft" indicator to editor page title
  - Create visual cues for activity cards with pending drafts
  - Implement draft recovery confirmation dialogs
  - Purpose: Make draft state clearly visible to users
  - _Leverage: src/components/ui/badge.tsx, src/components/ui/alert-dialog.tsx_
  - _Requirements: 7.2, 7.3_

## Phase 7: Performance & Optimization

- [ ] 20. Implement React Query optimization
  - File: src/hooks/useActivities.ts (enhance existing)
  - Add pet-scoped cache keys to prevent cross-pet data leakage
  - Implement automatic cache invalidation on mutations
  - Add optimistic updates for activity creation/editing
  - Purpose: Optimize data fetching and caching for activity pages
  - _Leverage: Existing React Query setup, cache patterns_
  - _Requirements: 2.1, 3.3_

- [ ] 21. Add virtual scrolling for large activity lists
  - File: src/components/activities/VirtualizedActivityTimeline.tsx
  - Implement virtual scrolling for 500+ activity lists
  - Maintain scroll position during optimistic updates
  - Add loading skeleton states for smooth experience
  - Purpose: Handle large activity lists without performance degradation
  - _Leverage: React Virtual or similar virtualization library_
  - _Requirements: 2.2_

- [ ] 22. Implement lazy loading for activity images
  - File: src/components/activities/LazyActivityImage.tsx
  - Add intersection observer-based image loading
  - Implement placeholder states and loading indicators
  - Add error handling for failed image loads
  - Purpose: Improve page load performance with many activity images
  - _Leverage: Intersection Observer API, existing image components_
  - _Requirements: 2.2, 3.2_

## Phase 8: Testing & Quality Assurance

- [ ] 23. Create activities list page tests
  - File: src/pages/__tests__/ActivitiesListPage.test.tsx
  - Test pet context loading and error states
  - Test activity filtering and sorting functionality
  - Test navigation to activity editor
  - Purpose: Ensure activities list page reliability
  - _Leverage: React Testing Library, existing test utilities_
  - _Requirements: 2.1, 2.2_

- [ ] 24. Create activity editor page tests
  - File: src/pages/__tests__/ActivityEditorPage.test.tsx
  - Test route parameter handling and validation
  - Test activity creation and editing workflows
  - Test draft save and recovery functionality
  - Purpose: Ensure activity editor page reliability
  - _Leverage: React Testing Library, existing test patterns_
  - _Requirements: 3.1, 3.2, 7.1_

- [ ] 25. Add navigation flow integration tests
  - File: src/__tests__/ActivityNavigation.integration.test.tsx
  - Test complete user journey: pet profile → activities list → editor → save → return
  - Test pet switching scenarios and context preservation
  - Test browser back/forward button behavior
  - Purpose: Ensure seamless navigation across activity pages
  - _Leverage: React Testing Library, React Router testing utilities_
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 26. Create end-to-end activity workflow tests
  - File: tests/e2e/activity-workflow.spec.ts
  - Test complete activity creation workflow across pages
  - Test multi-pet activity management scenarios
  - Test offline draft recovery scenarios
  - Purpose: Validate complete user workflows work correctly
  - _Leverage: Playwright or similar E2E testing framework_
  - _Requirements: All requirements_

## Phase 9: Documentation & Polish

- [ ] 27. Update page exports and routing documentation
  - File: src/pages/index.ts (modify existing)
  - Add exports for new activity pages
  - Update routing documentation with new page patterns
  - Add JSDoc comments for page components
  - Purpose: Maintain clean page organization and documentation
  - _Leverage: Existing page export patterns_
  - _Requirements: All requirements_

- [ ] 28. Add TypeScript interface documentation
  - File: src/lib/types/activities.ts (enhance existing)
  - Document new routing and page-specific interfaces
  - Add JSDoc examples for complex type usage
  - Update interface exports for new page components
  - Purpose: Provide clear API documentation for activity pages
  - _Leverage: Existing TypeScript patterns, JSDoc standards_
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 29. Create activity pages usage documentation
  - File: docs/activity-pages.md
  - Document new routing patterns and page relationships
  - Add user workflow diagrams and navigation explanations
  - Include troubleshooting guide for common issues
  - Purpose: Provide comprehensive documentation for the new feature
  - _Leverage: Existing documentation patterns, markdown standards_
  - _Requirements: All requirements_

- [ ] 30. Final integration testing and bug fixes
  - Files: Various (based on integration testing results)
  - Perform comprehensive testing of all activity page interactions
  - Fix any discovered bugs or edge cases
  - Validate performance meets requirements (1s load time, 500ms transitions)
  - Purpose: Ensure production-ready quality
  - _Leverage: All implemented components and utilities_
  - _Requirements: All requirements_