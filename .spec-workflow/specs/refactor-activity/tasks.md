```markdown
# Activity System Refactor - Tasks Document

## Phase 1: Core Block Infrastructure

- [x] 1. Create activity type definitions in src/lib/types/activities.ts
  - File: src/lib/types/activities.ts
  - Define ActivityBlockDef, ActivityBlockType, ActivityFormData interfaces
  - Add block configuration types for each block type
  - Purpose: Establish type safety for block-based activity system
  - _Leverage: src/lib/types.ts (existing Pet types)_
  - _Requirements: 1.1, 3.1_

- [x] 2. Create common form field wrapper and form context
  - File: src/components/activities/blocks/Field.tsx, FormContext.tsx
  - Purpose: Standardize label, help, error presentation across all blocks
  - _Leverage: React Hook Form, Shadcn/ui_
  - _Requirements: 1.1_

- [x] 3. Create Zod validation schemas for core blocks
  - File: src/lib/validation/activityBlocks.ts
  - Purpose: Provide block-level validation, ensure consistent typing
  - _Leverage: Zod_
  - _Requirements: 1.1_

- [x] 4. Create template registry in src/lib/activityTemplates.ts
  - File: src/lib/activityTemplates.ts
  - Define ActivityTemplate interface and template configurations
  - Create 5 initial templates (diet.feeding, growth.weight, health.checkup, lifestyle.walk, expense.purchase)
  - Purpose: Provide declarative template definitions for activities
  - _Leverage: None (pure configuration)_
  - _Requirements: 3.1, 3.2_

- [x] 5. Create BlockRenderer component in src/components/activities/BlockRenderer.tsx
  - File: src/components/activities/BlockRenderer.tsx
  - Implement dynamic block rendering based on block type
  - Add props interface and error boundary
  - Purpose: Core component for rendering blocks dynamically
  - _Leverage: src/components/ui/* (Shadcn components)_
  - _Requirements: 1.2, 1.3_

- [x] 6. Create TitleBlock component in src/components/activities/blocks/TitleBlock.tsx
  - File: src/components/activities/blocks/TitleBlock.tsx
  - Implement title input with React Hook Form integration
  - Add validation and error display
  - Purpose: First essential block for activity titles
  - _Leverage: src/components/ui/input.tsx, src/components/ui/label.tsx_
  - _Requirements: 1.1_

- [x] 7. Create TimeBlock component in src/components/activities/blocks/TimeBlock.tsx
  - File: src/components/activities/blocks/TimeBlock.tsx
  - Implement date/time picker with default to current time
  - Add timezone handling and formatting
  - Purpose: Essential block for activity timing
  - _Leverage: src/components/ui/input.tsx_
  - _Requirements: 1.1, 6.1_

- [x] 8. Create NotesBlock component in src/components/activities/blocks/NotesBlock.tsx
  - File: src/components/activities/blocks/NotesBlock.tsx
  - Implement rich text input with textarea
  - Add character counter and formatting options
  - Purpose: Essential block for activity descriptions
  - _Leverage: src/components/ui/textarea.tsx_
  - _Requirements: 1.1_

- [x] 9. Create MeasurementBlock component in src/components/activities/blocks/MeasurementBlock.tsx
  - File: src/components/activities/blocks/MeasurementBlock.tsx
  - Implement value input with unit selector
  - Add unit conversion and validation
  - Purpose: Essential block for weight/height measurements
  - _Leverage: src/components/ui/input.tsx, src/components/ui/select.tsx_
  - _Requirements: 1.1, 6.3_

- [x] 10. Create SubcategoryBlock component in src/components/activities/blocks/SubcategoryBlock.tsx
  - File: src/components/activities/blocks/SubcategoryBlock.tsx
  - Implement chip-based subcategory selection
  - Add category-specific options and validation
  - Purpose: Essential block for activity subcategorization
  - _Leverage: src/components/ui/badge.tsx_
  - _Requirements: 1.1, 3.2_

## Phase 2: Activity Editor Modes

- [ ] 11. Create ActivityEditor component in src/components/activities/ActivityEditor.tsx
  - File: src/components/activities/ActivityEditor.tsx
  - Implement main controller with mode switching
  - Add React Hook Form setup and pet context management
  - Purpose: Main orchestrator for activity creation/editing
  - _Leverage: React Hook Form, Zod validation_
  - _Requirements: 2.1, 4.1_

- [ ] 12. Create mapper utilities for serialization/deserialization
  - File: src/lib/activities/mapper.ts
  - Functions: toActivityRecord(formData), toFormData(activityRecord)
  - Purpose: Ensure editor can handle both create and edit modes consistently
  - _Leverage: Activity types, templates_
  - _Requirements: 2.1_

- [ ] 13. Create QuickLogSheet component in src/components/activities/QuickLogSheet.tsx
  - File: src/components/activities/QuickLogSheet.tsx
  - Implement bottom sheet with 1-2 blocks maximum
  - Add save in ≤3 interactions logic
  - Purpose: Quick activity recording mode
  - _Leverage: src/components/ui/dialog.tsx (Sheet variant)_
  - _Requirements: 2.1, 2.4_

- [ ] 14. Create GuidedFlowWizard component in src/components/activities/GuidedFlowWizard.tsx
  - File: src/components/activities/GuidedFlowWizard.tsx
  - Implement step-by-step wizard with progress indicator
  - Add navigation between blocks and validation
  - Purpose: Guided activity recording mode
  - _Leverage: src/components/ui/card.tsx, src/components/ui/button.tsx_
  - _Requirements: 2.2_

- [ ] 15. Create AdvancedEditTabs component in src/components/activities/AdvancedEditTabs.tsx
  - File: src/components/activities/AdvancedEditTabs.tsx
  - Implement tabbed interface (Summary, Details, Attachments, etc.)
  - Add tab visibility based on block presence
  - Purpose: Advanced activity editing mode
  - _Leverage: Shadcn Tabs component (to be added)_
  - _Requirements: 2.3_

- [ ] 16. Implement lazy-loading in Tabs component
  - File: src/components/ui/tabs.tsx
  - Purpose: Prevent performance issues in Advanced Edit
  - _Leverage: Shadcn Tabs component_
  - _Requirements: 2.3_

- [ ] 17. Create CategoryPicker component in src/components/activities/CategoryPicker.tsx
  - File: src/components/activities/CategoryPicker.tsx
  - Implement 5-category chip selector
  - Add recent templates row per pet
  - Purpose: Initial category selection interface
  - _Leverage: src/components/ui/badge.tsx_
  - _Requirements: 3.2, 6.4_

## Phase 3: Extended Blocks

- [ ] 18. Create RatingBlock component in src/components/activities/blocks/RatingBlock.tsx
  - File: src/components/activities/blocks/RatingBlock.tsx
  - Implement 1-5 star rating with emoji support
  - Add accessibility labels and keyboard navigation
  - Purpose: Rating input for mood, satisfaction, etc.
  - _Leverage: src/components/ui/button.tsx_
  - _Requirements: 1.1_

- [ ] 19. Create PortionBlock component in src/components/activities/blocks/PortionBlock.tsx
  - File: src/components/activities/blocks/PortionBlock.tsx
  - Implement amount input with unit selector
  - Add brand/product memory per pet
  - Purpose: Food portion tracking
  - _Leverage: src/components/ui/input.tsx, src/components/ui/select.tsx_
  - _Requirements: 1.1, 6.2_

- [ ] 20. Create AttachmentBlock component in src/components/activities/blocks/AttachmentBlock.tsx
  - File: src/components/activities/blocks/AttachmentBlock.tsx
  - Implement drag-and-drop file upload
  - Add thumbnail generation and preview
  - Purpose: Photo and document attachments
  - _Leverage: src/components/pets/PetProfilePhoto.tsx patterns_
  - _Requirements: 1.1, 8.1, 8.2_

- [ ] 21. Add attachment validation and photos:// protocol integration
  - Files: src/components/activities/blocks/AttachmentBlock.tsx, src-tauri/src/photo/*
  - Purpose: Validate file size/MIME, handle retry, integrate photos://
  - _Leverage: Existing PhotoService_
  - _Requirements: 8.1, 8.2_

- [ ] 22. Create CostBlock component in src/components/activities/blocks/CostBlock.tsx
  - File: src/components/activities/blocks/CostBlock.tsx
  - Implement amount input with currency selector
  - Add expense category selection
  - Purpose: Cost tracking for activities
  - _Leverage: src/components/ui/input.tsx, src/components/ui/select.tsx_
  - _Requirements: 1.1_

- [ ] 23. Create ReminderBlock component in src/components/activities/blocks/ReminderBlock.tsx
  - File: src/components/activities/blocks/ReminderBlock.tsx
  - Implement date/time picker for reminders
  - Add recurrence pattern selection
  - Purpose: Setting activity reminders
  - _Leverage: src/components/ui/input.tsx_
  - _Requirements: 1.1_

- [ ] 24. Create remaining blocks (Timer, Location, Weather, Checklist, People, Recurrence)
  - Files: src/components/activities/blocks/[BlockName].tsx
  - Implement each block following established patterns
  - Add block-specific configurations and validations
  - Purpose: Complete the 15+ block library
  - _Leverage: Existing block patterns and UI components_
  - _Requirements: 1.1_

- [ ] 25. Add centralized subcategory options and caching per pet
  - File: src/lib/catalogs/subcategories.ts
  - Purpose: Provide per-category subcategory options, cache recent selections
  - _Leverage: useQuickDefaults_
  - _Requirements: 3.2_

- [ ] 26. Add unit conversion and brand memory utilities
  - Files: src/lib/utils/units.ts, src/lib/utils/brandMemory.ts
  - Purpose: Support Measurement/Portion conversions, remember last brand/product
  - _Leverage: localStorage, useQuickDefaults_  
  - _Requirements: 6.2, 6.3_

## Phase 4: Smart Features & Data Management

- [ ] 27. Create useActivities hook in src/hooks/useActivities.ts
  - File: src/hooks/useActivities.ts
  - Implement activity CRUD operations with React Query
  - Add filtering, pagination, and search
  - Purpose: Main data management hook for activities
  - _Leverage: src/hooks/usePets.ts patterns_
  - _Requirements: 5.1, 5.2_

- [ ] 28. Create useActivityDraft hook in src/hooks/useActivityDraft.ts
  - File: src/hooks/useActivityDraft.ts
  - Implement auto-save with 2-second debounce
  - Add draft recovery and management
  - Purpose: Draft management for interrupted editing
  - _Leverage: React Hook Form, localStorage_
  - _Requirements: 7.1, 7.2_

- [ ] 29. Create useRecentTemplates hook in src/hooks/useRecentTemplates.ts
  - File: src/hooks/useRecentTemplates.ts
  - Implement template usage tracking per pet
  - Add localStorage persistence for recent templates
  - Purpose: Smart template suggestions
  - _Leverage: localStorage API_
  - _Requirements: 6.4_

- [ ] 30. Create useQuickDefaults hook in src/hooks/useQuickDefaults.ts
  - File: src/hooks/useQuickDefaults.ts
  - Implement intelligent default values per pet/category
  - Add unit/brand/subcategory memory
  - Purpose: Smart default value system
  - _Leverage: localStorage API_
  - _Requirements: 6.2, 6.3_

- [ ] 31. Create activity Tauri commands in src-tauri/src/commands/activities.rs
  - File: src-tauri/src/commands/activities.rs
  - Implement create_activity, update_activity, get_activities commands
  - Add validation and error handling
  - Purpose: Backend API for activity operations
  - _Leverage: Existing command patterns in lib.rs_
  - _Requirements: All backend operations_

- [ ] 32. Create unified error types and activity telemetry logs
  - Files: src-tauri/src/errors.rs, src-tauri/src/telemetry/activity_events.rs
  - Purpose: Centralized error handling and logging of key events
  - _Leverage: thiserror, tracing_
  - _Requirements: All backend operations_

- [ ] 33. Create activity database operations in src-tauri/src/database/activities.rs
  - File: src-tauri/src/database/activities.rs
  - Implement SQLite operations for activities table
  - Add attachment handling and FTS integration
  - Purpose: Database layer for activity persistence
  - _Leverage: Existing database patterns_
  - _Requirements: Database operations_

- [ ] 34. Add FTS synchronization utilities
  - File: src-tauri/src/database/activities.rs
  - Purpose: Keep activities_fts updated on create/update/delete
  - _Leverage: SQLite FTS5_
  - _Requirements: 5.2, 7.2_

## Phase 5: Timeline Integration & Polish

- [ ] 35. Create ActivityCard component in src/components/activities/ActivityCard.tsx
  - File: src/components/activities/ActivityCard.tsx
  - Implement card with category stripe, title, facts, thumbnails
  - Add inline editing and long-press actions
  - Purpose: Timeline display of activities
  - _Leverage: src/components/ui/card.tsx_
  - _Requirements: 5.3, 5.4_

- [ ] 36. Add category color themes and summary line utilities
  - Files: src/lib/ui/categoryTheme.ts, src/lib/summary/summaryLine.ts
  - Purpose: Provide consistent category colors and timeline summary facts
  - _Leverage: Category definitions, activity blocks_
  - _Requirements: 5.3_

- [ ] 37. Create ActivityTimeline component in src/components/activities/ActivityTimeline.tsx
  - File: src/components/activities/ActivityTimeline.tsx
  - Implement reverse chronological display with virtualization
  - Add filtering, grouping, and search
  - Purpose: Main timeline view for activities
  - _Leverage: React virtual scrolling libraries_
  - _Requirements: 5.1, 5.2_

- [ ] 38. Integrate virtualization library and grouping logic
  - File: src/components/activities/ActivityTimeline.tsx
  - Purpose: Ensure smooth scrolling and daily/weekly/month grouping
  - _Leverage: @tanstack/react-virtual_
  - _Requirements: 5.2_

- [ ] 39. Add undo functionality in src/hooks/useActivityUndo.ts
  - File: src/hooks/useActivityUndo.ts
  - Implement 6-second undo window with toast
  - Add soft delete and recovery logic
  - Purpose: Undo capability for saved activities
  - _Leverage: Toast notification system_
  - _Requirements: 5.5, 7.3_

- [ ] 40. Add animations and transitions
  - Files: Various component files
  - Implement smooth transitions for mode switching
  - Add activity insertion animations in timeline
  - Purpose: Polish user experience with animations
  - _Leverage: Framer Motion or CSS transitions_
  - _Requirements: 5.2_

- [ ] 41. Implement keyboard navigation and accessibility
  - Files: All block and editor components
  - Add ARIA labels and keyboard shortcuts
  - Implement focus management and screen reader support
  - Purpose: WCAG 2.1 AA compliance
  - _Leverage: React accessibility patterns_
  - _Requirements: NFR - Usability_

## Testing Tasks

- [ ] 42. Write unit tests for all block components
  - Files: src/components/activities/blocks/__tests__/*.test.tsx
  - Test each block with various configurations
  - Test validation and error states
  - Purpose: Ensure block reliability
  - _Leverage: Jest, React Testing Library_
  - _Requirements: Testing Strategy_

- [ ] 43. Write integration tests for activity editor modes
  - Files: src/components/activities/__tests__/*.test.tsx
  - Test form submission flows
  - Test mode switching and data preservation
  - Purpose: Ensure editor functionality
  - _Leverage: Jest, React Testing Library_
  - _Requirements: Testing Strategy_

- [ ] 44. Write E2E tests for complete activity workflows
  - Files: e2e/activities/*.test.ts
  - Test Quick Log, Guided Flow, and Advanced Edit journeys
  - Test timeline integration and error recovery
  - Purpose: Ensure end-to-end functionality
  - _Leverage: Playwright or Cypress_
  - _Requirements: Testing Strategy_
```
