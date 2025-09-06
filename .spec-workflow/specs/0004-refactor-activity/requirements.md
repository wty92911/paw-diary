# Activity System Refactor - Requirements Document

## Introduction

This specification defines the refactoring of Paw Diary's activity recording system to transition from category-specific forms to a unified, block-based architecture. The refactor addresses scalability issues with the current "one giant, ever-mutating form per category" approach while maintaining the intuitive user experience for pet activity recording.

The new system will implement a composable block architecture that enables three distinct interaction modes: Quick Log (≤3 taps), Guided Flow (template-driven), and Advanced Edit (full editor), all while maintaining pet-context awareness and progressive disclosure principles.

## Alignment with Product Vision

This refactor directly supports the core product vision of providing structured, intuitive pet activity recording by:

- **Structured Recording**: Transforming daily observations into categorized, searchable records through composable blocks
- **Multi-Pet Management**: Maintaining seamless pet context switching while recording activities
- **Warm Experience**: Preserving the diary-like interface with progressive disclosure and intelligent defaults
- **Local Privacy**: Ensuring all data remains stored locally with efficient SQLite operations
- **Performance**: Meeting the <1 second data display requirement through optimized component reuse

## Requirements

### Requirement 1: Block-Based Activity Architecture

**User Story:** As a pet owner recording activities, I want a unified interface that adapts to different activity types, so that I can quickly log any type of pet activity without learning different forms.

#### Acceptance Criteria

1. WHEN the system loads THEN it SHALL provide a unified Block Library with 15+ reusable input types (Title, Notes, Time, Measurement, Rating, Portion, Timer, Location, Weather, Checklist, Attachment, Cost, Reminder, People, Recurrence)
2. WHEN I select an activity category THEN the system SHALL dynamically render appropriate blocks based on the selected template
3. WHEN I switch between activity subcategories THEN the system SHALL update only the block stack without full page reloads
4. IF an activity template requires specific blocks THEN the system SHALL mark those blocks as required and validate accordingly

### Requirement 2: Three-Mode Interaction System

**User Story:** As a pet owner with varying time constraints, I want different levels of detail when recording activities, so that I can choose between quick logging and comprehensive recording based on my current needs.

#### Acceptance Criteria

1. WHEN I tap the FAB THEN the system SHALL present Quick Log mode with 1-2 blocks maximum for common activities
2. WHEN I select "More details" in Quick Log THEN the system SHALL transition to Guided Flow mode with 2-4 template-specific blocks
3. WHEN I choose "Open full editor" or edit existing activity THEN the system SHALL open Advanced Edit mode with tabbed interface (Summary, Details, Attachments, Reminders, Costs, History)
4. WHEN completing Quick Log THEN the system SHALL save the activity in ≤3 interactions
5. IF I'm in any mode THEN the system SHALL preserve pet context and allow explicit pet switching with confirmation

### Requirement 3: Template-Driven Activity Forms

**User Story:** As a pet owner recording different types of activities, I want the system to provide intelligent defaults and appropriate input fields for each activity type, so that I can record comprehensive information efficiently.

#### Acceptance Criteria

1. WHEN the system initializes THEN it SHALL provide 15+ predefined templates across 5 categories (Health, Growth, Diet, Lifestyle, Expense)
2. WHEN I select a template THEN the system SHALL pre-populate blocks with intelligent defaults (time=now, remembered units, last used values per pet)
3. WHEN I complete an activity using a template THEN the system SHALL remember my preferences (last subcategory, units, brands) per pet per category
4. IF a template includes measurement blocks THEN the system SHALL remember the last used unit per pet
5. WHEN I create a recurring activity THEN the system SHALL use template-based recurrence patterns

### Requirement 4: Pet Context Management

**User Story:** As a multi-pet owner, I want all activity recording to maintain clear pet context, so that I can confidently record activities for the correct pet without confusion.

#### Acceptance Criteria

1. WHEN I start activity recording THEN the system SHALL inherit the currently active pet context
2. WHEN the pet context is displayed THEN it SHALL show the pet's photo, name, and allow switching with confirmation dialog
3. WHEN I switch pets during activity creation THEN the system SHALL prompt for confirmation and maintain compatible block data
4. IF I switch pets mid-flow THEN the system SHALL preserve shared blocks (Title, Time, Notes) and reset pet-specific blocks after confirmation

### Requirement 5: Timeline Integration and Feedback

**User Story:** As a pet owner tracking my pet's activities over time, I want saved activities to appear immediately in the timeline with visual feedback, so that I can see the complete record of my pet's activities.

#### Acceptance Criteria

1. WHEN I save an activity THEN the system SHALL display "Saved • Undo" toast notification for 6 seconds
2. WHEN an activity is saved THEN the system SHALL animate the new activity card into the correct chronological position
3. WHEN displaying activity cards THEN the system SHALL show category color stripe, title, key facts, and micro-thumbnails
4. IF an activity has critical health information THEN the system SHALL display red badge and pin to top of day group
5. WHEN I use the Undo functionality THEN the system SHALL reverse the last save operation within the 6-second window

### Requirement 6: Progressive Enhancement and Smart Defaults

**User Story:** As a pet owner who regularly records similar activities, I want the system to learn my patterns and provide intelligent suggestions, so that I can record activities more efficiently over time.

#### Acceptance Criteria

1. WHEN I access activity recording THEN the system SHALL auto-fill date/time with current timestamp
2. WHEN I select a category THEN the system SHALL remember and suggest the last used subcategory per pet
3. WHEN entering measurements THEN the system SHALL default to the last used unit per measurement type per pet
4. IF I have recent templates used THEN the system SHALL display them as quick access options in the category picker
5. WHEN I expand "More details" THEN the system SHALL reveal additional blocks inline without page navigation

### Requirement 7: Draft Management and Data Persistence

**User Story:** As a pet owner creating detailed activity records, I want my work to be saved automatically, so that I don't lose information if interrupted or if the application closes unexpectedly.

#### Acceptance Criteria

1. WHEN I start a Guided Flow or Advanced Edit session THEN the system SHALL create an auto-save draft every 2 seconds or on blur
2. WHEN I return to an unfinished activity THEN the system SHALL offer to restore the draft
3. WHEN drafts exist THEN the system SHALL provide a dedicated Activity History tab for draft management
4. IF the application closes unexpectedly THEN the system SHALL preserve drafts and offer recovery on restart
5. WHEN I complete and save an activity THEN the system SHALL remove the associated draft

### Requirement 8: Attachment and Media Management

**User Story:** As a pet owner documenting activities with photos and files, I want seamless media management integrated into the block system, so that I can attach relevant documentation to any activity.

#### Acceptance Criteria

1. WHEN I use the Attachment block THEN the system SHALL support drag-and-drop for photos, documents, and videos
2. WHEN multiple attachments are added THEN the system SHALL use the first image as cover and allow reordering via drag
3. WHEN attachment upload fails THEN the system SHALL show per-file status, allow retry, and save activity without failed files
4. IF activities include photos THEN the system SHALL generate thumbnails and support lightbox viewing with swipe navigation
5. WHEN offline THEN the system SHALL gracefully disable OCR features with appropriate messaging

## Non-Functional Requirements

### Code Architecture and Modularity

- **Block Component Pattern**: Each block type SHALL be implemented as an isolated React component with consistent props interface
- **Template Registry**: Activity templates SHALL be defined in declarative JSON/TypeScript configuration, separate from UI components
- **State Management**: Activity drafts SHALL use React Hook Form for form state and React Query for server state management
- **Component Reusability**: Block components SHALL be framework-agnostic and reusable across different activity types
- **Clean Separation**: UI rendering logic SHALL be separated from business logic and data validation

### Performance

- **Block Rendering**: Block components SHALL render in <100ms with lazy loading for heavy components
- **Form State**: Template switching SHALL update only affected blocks without remounting the entire form
- **Memory Management**: Draft auto-save SHALL use efficient batching to avoid memory leaks during long editing sessions
- **Timeline Updates**: New activity insertion SHALL animate smoothly without blocking the UI thread
- **Photo Processing**: Image thumbnail generation SHALL occur asynchronously without blocking activity saves

### Security

- **Input Validation**: All block inputs SHALL be validated both client-side (Zod schemas) and server-side (Rust validation)
- **File Upload Security**: Attachment blocks SHALL implement strict MIME type checking and file size limits (10MB max)
- **Data Sanitization**: User input in notes and text blocks SHALL be sanitized to prevent XSS attacks
- **Draft Security**: Auto-saved drafts SHALL be stored securely in SQLite with user-only access permissions

### Reliability

- **Offline Capability**: All three interaction modes SHALL function fully offline with local SQLite storage
- **Error Recovery**: Block-level errors SHALL not crash the entire activity form, with graceful fallback UI
- **Data Consistency**: Activity saves SHALL be atomic operations with rollback capability on failure
- **Validation Feedback**: Form validation errors SHALL be displayed clearly at both block and form levels

### Usability

- **Accessibility**: All blocks SHALL support keyboard navigation, screen readers, and WCAG 2.1 AA compliance
- **Mobile Experience**: Block layouts SHALL be responsive with touch-optimized interactions
- **Visual Consistency**: All blocks SHALL follow the established design system with consistent spacing, colors, and typography
- **Progressive Disclosure**: Complex blocks SHALL reveal advanced options through expand/collapse interactions
- **Loading States**: All async operations SHALL provide appropriate loading indicators and skeleton screens