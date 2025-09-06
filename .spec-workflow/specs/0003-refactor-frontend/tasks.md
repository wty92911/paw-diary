# Tasks Document

- [x] 1. Install React Router dependency
  - File: package.json
  - Add react-router-dom dependency using yarn
  - Purpose: Enable client-side routing for the refactored architecture
  - _Leverage: existing package.json structure_
  - _Requirements: 1.1, 7.1_

- [x] 2. Create router navigation types in src/lib/types.ts
  - File: src/lib/types.ts (extend existing)
  - Add RouterNavigationState, PetProfileParams interfaces
  - Extend existing navigation types for router compatibility
  - Purpose: Establish type safety for router-based navigation
  - _Leverage: existing NavigationState types in src/lib/types.ts_
  - _Requirements: 1.1, 6.1_

- [x] 3. Create usePetProfileNavigation hook in src/hooks/usePetProfileNavigation.ts
  - File: src/hooks/usePetProfileNavigation.ts (enhance existing)
  - Add React Router integration to existing navigation logic
  - Include URL parameter extraction and navigation functions
  - Purpose: Provide router-aware navigation for pet profiles
  - _Leverage: existing usePetProfileNavigation.ts hook_
  - _Requirements: 6.1, 7.1_

- [x] 4. Create enhanced useActivities hook with petId parameter
  - File: src/hooks/useActivities.ts (modify existing)
  - Add petId parameter to filter activities by specific pet
  - Modify existing activity queries to be pet-specific
  - Purpose: Enable pet-bound activity management
  - _Leverage: existing useActivities.ts hook and Activity types_
  - _Requirements: 3.1, 6.1_

- [x] 5. Create HomePage component in src/pages/HomePage.tsx
  - File: src/pages/HomePage.tsx
  - Display pet thumbnail navigation with empty state handling
  - Include redirect logic for no pets scenario
  - Purpose: Provide main landing page for pet selection
  - _Leverage: components/pets/PetThumbnailNavigation.tsx, hooks/usePets.ts_
  - _Requirements: 2.1, 2.2_

- [x] 6. Create AddPetPage component in src/pages/AddPetPage.tsx
  - File: src/pages/AddPetPage.tsx
  - Wrap existing PetForm in full-page layout
  - Add navigation to pet profile after successful creation
  - Purpose: Provide dedicated pet creation interface
  - _Leverage: components/pets/PetForm.tsx, hooks/usePets.ts_
  - _Requirements: 4.1, 4.2_

- [x] 7. Create PetProfilePage component in src/pages/PetProfilePage.tsx
  - File: src/pages/PetProfilePage.tsx
  - Combine pet profile display with activity timeline
  - Handle pet loading and error states
  - Purpose: Provide comprehensive pet detail view
  - _Leverage: components/pets/PetProfile.tsx, components/activities/ActivityTimeline.tsx_
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Create PetProfileHeader component in src/components/pets/PetProfileHeader.tsx
  - File: src/components/pets/PetProfileHeader.tsx
  - Display pet photo, name, and basic information
  - Include edit and action buttons
  - Purpose: Provide consistent pet profile header across views
  - _Leverage: components/pets/PetProfilePhoto.tsx, existing pet display patterns_
  - _Requirements: 3.2_

- [x] 9. Create PetActivityTimeline component in src/components/pets/PetActivityTimeline.tsx
  - File: src/components/pets/PetActivityTimeline.tsx
  - Filter activities by petId parameter
  - Display chronological activity list with add button
  - Purpose: Show pet-specific activity history
  - _Leverage: components/activities/ActivityTimeline.tsx, hooks/useActivities.ts_
  - _Requirements: 3.3, 6.1_

- [x] 10. Create AddActivityButton component in src/components/activities/AddActivityButton.tsx
  - File: src/components/activities/AddActivityButton.tsx
  - Floating action button for adding activities
  - Pre-fill pet context in activity form
  - Purpose: Provide easy activity creation within pet context
  - _Leverage: components/activities/ActivityFAB.tsx styling patterns_
  - _Requirements: 3.3_

- [x] 11. Modify ActivityForm to accept pre-filled pet context
  - File: src/components/activities/ActivityForm.tsx (modify existing)
  - Add petId prop to automatically bind activities to specific pet
  - Update form validation to include pet binding
  - Purpose: Ensure activities are created with proper pet association
  - _Leverage: existing ActivityForm.tsx component and validation_
  - _Requirements: 6.1_

- [x] 12. Create pages directory and export structure
  - File: src/pages/index.ts
  - Create pages directory with proper exports
  - Set up clean import paths for page components
  - Purpose: Organize page-level components with clear structure
  - _Leverage: existing component organization patterns_
  - _Requirements: 1.1_

- [x] 13. Refactor App.tsx to use React Router
  - File: src/App.tsx (major refactor)
  - Replace existing navigation logic with React Router setup
  - Configure routes: /, /pets/new, /pets/:petId
  - Remove manual page switching state management
  - Purpose: Transform App.tsx into clean routing entry point
  - _Leverage: existing initialization and error handling logic_
  - _Requirements: 1.1, 7.1_

- [x] 14. Update useAppState hook to remove page switching logic
  - File: src/hooks/useAppState.ts (modify existing)
  - Remove manual page navigation state management
  - Keep form and dialog state management
  - Purpose: Simplify app state for router-based navigation
  - _Leverage: existing state management patterns_
  - _Requirements: 1.1_

- [ ] 15. Test HomePage navigation and empty states
  - File: src/pages/HomePage.tsx (testing)
  - Verify pet thumbnail display and navigation
  - Test empty state redirect to add pet page
  - Test error handling for pet loading failures
  - Purpose: Ensure homepage functions correctly in all scenarios
  - _Leverage: existing testing patterns and fixtures_
  - _Requirements: 2.1, 2.2_

- [ ] 16. Test AddPetPage form submission and navigation
  - File: src/pages/AddPetPage.tsx (testing)
  - Verify pet creation form functionality
  - Test navigation to pet profile after creation
  - Test form validation and error states
  - Purpose: Ensure pet creation flow works end-to-end
  - _Leverage: existing form testing utilities_
  - _Requirements: 4.1, 4.2_

- [ ] 17. Test PetProfilePage with activity timeline
  - File: src/pages/PetProfilePage.tsx (testing)
  - Verify pet profile display and activity loading
  - Test pet-specific activity filtering
  - Test activity creation from profile page
  - Purpose: Ensure pet profile and activity integration works
  - _Leverage: existing activity testing patterns_
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 18. Test router navigation edge cases
  - File: src/App.tsx (testing)
  - Test invalid pet ID handling and redirects
  - Test browser back/forward button behavior
  - Test direct URL access and bookmarking
  - Purpose: Ensure robust router behavior in all scenarios
  - _Leverage: existing error handling and navigation tests_
  - _Requirements: 7.1_

- [x] 19. Update existing components for router compatibility
  - File: Multiple component files (modify existing)
  - Update components that use manual navigation to use React Router
  - Replace navigation callbacks with router navigation
  - Purpose: Ensure all components work with new routing system
  - _Leverage: existing component structure and navigation patterns_
  - _Requirements: 5.1_

- [x] 20. Clean up unused navigation code and state
  - File: Multiple files (cleanup)
  - Remove manual page switching logic from components
  - Delete unused navigation state and handlers
  - Clean up imports and dependencies
  - Purpose: Remove legacy navigation code after router implementation
  - _Leverage: existing codebase structure_
  - _Requirements: All_