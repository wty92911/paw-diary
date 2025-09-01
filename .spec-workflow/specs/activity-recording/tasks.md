# Tasks Document

- [x] 1. Create Activity Type Definitions
  - File: src/lib/types.ts (extend existing)
  - Add ActivityCategory enum and Activity interfaces
  - Define category-specific data interfaces (HealthActivityData, GrowthActivityData, etc.)
  - Add ActivityFormData and ActivityAttachment interfaces
  - Purpose: Establish type safety for activity system
  - _Leverage: existing Pet interfaces and validation patterns_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Create Activity Database Schema Migration
  - File: src-tauri/migrations/[timestamp]_create_activities_table.sql
  - Create activities table with foreign key to pets
  - Create activity_attachments table for photos/documents
  - Create activities_fts virtual table for full-text search
  - Add indexes for performance optimization
  - Purpose: Extend database schema for activity storage
  - _Leverage: existing migration patterns and pet table structure_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 3. Create Activity Error Types
  - File: src-tauri/src/errors.rs (extend existing)
  - Add ActivityError enum variants to existing PetError
  - Include category validation, attachment, and search errors
  - Purpose: Comprehensive error handling for activity operations
  - _Leverage: existing PetError patterns and error handling_
  - _Requirements: All (error handling)_

- [x] 4. Implement Activity Database Operations
  - File: src-tauri/src/database.rs (extend existing)
  - Add Activity struct and CRUD operations
  - Implement category-specific data handling with JSON
  - Add search and filtering functionality with FTS
  - Add attachment relationship management
  - Purpose: Core database layer for activity management
  - _Leverage: existing PetDatabase patterns and SQLite integration_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 5. Create Activity Tauri Commands
  - File: src-tauri/src/commands.rs (extend existing)
  - Add create_activity, get_activities, update_activity, delete_activity commands
  - Add search_activities and filter_activities commands
  - Include comprehensive input validation
  - Purpose: Expose activity operations to frontend
  - _Leverage: existing command patterns, validation, and error handling_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 6. Create Activity Attachment Commands
  - File: src-tauri/src/commands.rs (extend existing)
  - Add upload_activity_attachment and delete_activity_attachment commands
  - Integrate with existing PhotoService for file management
  - Add attachment metadata handling
  - Purpose: Handle photo and document attachments for activities
  - _Leverage: existing photo upload commands and PhotoService_
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6 (photo attachments)_

- [ ] 7. Create Activity Form Schema Validation
  - File: src/components/activities/ActivityForm.tsx (new)
  - Create Zod schemas for each activity category
  - Add category-specific validation rules and error messages
  - Implement dynamic form validation based on selected category
  - Purpose: Client-side validation for activity creation
  - _Leverage: existing petFormSchema patterns and Zod validation_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 8. Implement Base Activity Form Component
  - File: src/components/activities/ActivityForm.tsx (continue from task 7)
  - Create main ActivityForm dialog with category selection
  - Add common fields (title, date, time, description, location)
  - Implement category switching and subcategory selection
  - Add form submission and error handling
  - Purpose: Main form component for activity creation/editing
  - _Leverage: existing form patterns from PetForm, Dialog, and form utilities_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 9. Create Health Activity Form Component
  - File: src/components/activities/forms/HealthActivityForm.tsx
  - Implement health-specific fields (vet info, symptoms, medications)
  - Add critical health event flagging and priority indicators
  - Include cost tracking integration for medical expenses
  - Purpose: Specialized form for health activity recording
  - _Leverage: medical subcategories from ActivityForm and input components_
  - _Requirements: 1.2_

- [ ] 10. Create Growth Activity Form Component
  - File: src/components/activities/forms/GrowthActivityForm.tsx
  - Add weight/height entry with unit conversion (kg/lbs, cm/in)
  - Implement milestone tracking and development stage selection
  - Add photo comparison functionality for progress documentation
  - Purpose: Specialized form for growth tracking
  - _Leverage: number inputs, photo upload, and measurement utilities_
  - _Requirements: 1.3_

- [ ] 11. Create Diet Activity Form Component
  - File: src/components/activities/forms/DietActivityForm.tsx
  - Implement food brand/product database integration
  - Add portion size tracking with visual serving guides
  - Include food preference rating system (1-5 stars)
  - Add allergic reaction tracking and food correlation
  - Purpose: Specialized form for diet and nutrition logging
  - _Leverage: rating components, search inputs, and number validation_
  - _Requirements: 1.4_

- [ ] 12. Create Lifestyle Activity Form Component
  - File: src/components/activities/forms/LifestyleActivityForm.tsx
  - Add duration tracking with start/stop timer functionality
  - Implement mood and energy level indicators (1-5 scale with emojis)
  - Include location tagging and weather condition recording
  - Add social interaction and training progress tracking
  - Purpose: Specialized form for lifestyle and behavior tracking
  - _Leverage: timer utilities, emoji selectors, and location inputs_
  - _Requirements: 1.5_

- [ ] 13. Create Expense Activity Form Component
  - File: src/components/activities/forms/ExpenseActivityForm.tsx
  - Implement receipt photo upload with OCR placeholder
  - Add expense categorization and vendor tracking
  - Include recurring expense setup and budget integration
  - Add tax-deductible flag for service animal expenses
  - Purpose: Specialized form for expense tracking and management
  - _Leverage: photo upload, currency formatting, and date/recurring inputs_
  - _Requirements: 1.6_

- [ ] 14. Create Activity Card Component
  - File: src/components/activities/ActivityCard.tsx
  - Display activity with category-specific styling and icons
  - Show key information (title, date, category, attachments preview)
  - Add quick actions (edit, delete) and expand/collapse functionality
  - Include attachment thumbnail display and lightbox integration
  - Purpose: Individual activity display in timeline
  - _Leverage: Card component, photo display patterns, and button styling_
  - _Requirements: 1.7_

- [ ] 15. Create Activity Timeline Component
  - File: src/components/activities/ActivityTimeline.tsx
  - Implement infinite scroll with virtual scrolling for performance
  - Add chronological activity display with date grouping
  - Include loading states and error handling
  - Add pull-to-refresh functionality for mobile experience
  - Purpose: Main timeline view for activity history
  - _Leverage: scroll utilities, loading components, and error boundaries_
  - _Requirements: 1.7_

- [ ] 16. Create Activity Filters Component
  - File: src/components/activities/ActivityFilters.tsx
  - Add category filtering with checkbox selection
  - Implement date range picker for temporal filtering
  - Include search input with debounced queries
  - Add cost range and attachment filters
  - Purpose: Filtering interface for activity timeline
  - _Leverage: input components, date pickers, and filter state management_
  - _Requirements: 1.7_

- [ ] 17. Create Attachment Manager Component
  - File: src/components/activities/AttachmentManager.tsx
  - Implement drag-and-drop photo/document upload
  - Add thumbnail grid display with delete functionality
  - Include file type validation and size limit enforcement
  - Add lightbox gallery for full-size attachment viewing
  - Purpose: Photo and document management for activities
  - _Leverage: existing photo upload patterns and drag-drop utilities_
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6 (attachment support)_

- [ ] 18. Create Category Selector Component
  - File: src/components/activities/CategorySelector.tsx
  - Add visual category selection with icons and colors
  - Include recent activity suggestions and quick templates
  - Implement one-tap category selection for rapid entry
  - Add category-specific color coding and visual indicators
  - Purpose: Quick category selection interface
  - _Leverage: button variants, icon system, and category constants_
  - _Requirements: 1.1_

- [ ] 19. Create useActivities Custom Hook
  - File: src/hooks/useActivities.ts
  - Implement React Query integration for activity data management
  - Add CRUD operations (create, read, update, delete) with optimistic updates
  - Include search and filtering with caching strategies
  - Add error handling and retry logic
  - Purpose: Activity data management and state synchronization
  - _Leverage: existing usePets patterns and React Query setup_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 20. Create useActivityForm Custom Hook
  - File: src/hooks/useActivityForm.ts
  - Handle category-specific form state and validation
  - Implement dynamic schema switching based on category selection
  - Add form persistence and draft saving functionality
  - Include photo attachment handling and upload progress
  - Purpose: Activity form state management and validation
  - _Leverage: React Hook Form patterns and form utilities_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 21. Create Activity Search Utilities
  - File: src/lib/activityUtils.ts
  - Implement client-side search and filtering logic
  - Add date formatting and time utilities for activities
  - Include category-specific data formatting functions
  - Add export/import utilities for activity data
  - Purpose: Activity data processing and utility functions
  - _Leverage: existing utility patterns and date/time formatting_
  - _Requirements: 1.7 (search functionality)_

- [ ] 22. Integrate Activities with Pet Profile
  - File: src/components/pets/PetProfile.tsx (extend existing)
  - Add activity section to pet profile display
  - Include recent activities preview and quick add button
  - Add activity count and statistics display
  - Link to full activity timeline from pet profile
  - Purpose: Connect activities to pet management system
  - _Leverage: existing PetProfile component and navigation patterns_
  - _Requirements: Integration with existing pet system_

- [ ] 23. Add Activity Navigation to App
  - File: src/App.tsx (extend existing)
  - Add activity timeline view to main navigation
  - Include activity creation FAB (Floating Action Button)
  - Add activity search and filter accessibility
  - Implement deep linking for specific activities
  - Purpose: Main app integration and navigation
  - _Leverage: existing navigation patterns and routing_
  - _Requirements: Main app integration_

- [ ] 24. Create Activity System Tests
  - File: src/components/activities/__tests__/ActivityForm.test.tsx
  - Write unit tests for all activity form components
  - Test category switching and validation logic
  - Include accessibility testing and keyboard navigation
  - Add performance testing for large datasets
  - Purpose: Comprehensive testing coverage for activity system
  - _Leverage: existing test patterns and testing utilities_
  - _Requirements: All (testing requirements)_

- [ ] 25. Create Activity Backend Tests
  - File: src-tauri/src/database.rs (extend tests section)
  - Add tests for activity CRUD operations and data integrity
  - Test search functionality and performance with large datasets
  - Include attachment handling and file management tests
  - Add migration testing and schema validation
  - Purpose: Backend testing for activity system reliability
  - _Leverage: existing database test patterns and fixtures_
  - _Requirements: All (backend reliability)_

- [ ] 26. Add Activity Performance Optimizations
  - File: src/components/activities/ActivityTimeline.tsx (optimize existing)
  - Implement virtual scrolling for large activity lists
  - Add memoization for expensive computations and renders
  - Optimize search with debouncing and caching
  - Add lazy loading for activity attachments
  - Purpose: Ensure performance with large activity datasets
  - _Leverage: React performance patterns and optimization utilities_
  - _Requirements: Performance requirements (1s timeline load)_

- [ ] 27. Create Activity Data Migration Utilities
  - File: src-tauri/src/database.rs (add migration utilities)
  - Add utilities for migrating existing data to activity system
  - Include data validation and consistency checks
  - Add rollback functionality for failed migrations
  - Create data export/import tools for user data portability
  - Purpose: Data migration and backup functionality
  - _Leverage: existing database utilities and validation patterns_
  - _Requirements: Data reliability and user data protection_

- [ ] 28. Final Integration and Polish
  - File: Multiple files (polish existing implementation)
  - Add loading animations and smooth transitions
  - Implement comprehensive error handling and user feedback
  - Add accessibility attributes and keyboard navigation
  - Include tooltips, help text, and user onboarding
  - Polish visual design and responsive behavior
  - Purpose: Final user experience polish and accessibility
  - _Leverage: existing UI patterns, animations, and accessibility utilities_
  - _Requirements: Usability and accessibility requirements_