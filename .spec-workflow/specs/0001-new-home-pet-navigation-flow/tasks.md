# Implementation Plan

## Task Overview

This implementation transforms the current pet list interface into an iPhone-style horizontal navigation system with dedicated pet profile pages. The approach leverages existing components heavily while introducing new navigation patterns, consolidated into 5 comprehensive tasks that cover the complete feature.

## Steering Document Compliance

**Structure.md Compliance**: All new components follow `src/components/pets/` organization with PascalCase naming. Hook extensions follow `use[Feature].ts` pattern. TypeScript interfaces extend existing patterns in `src/lib/types.ts`.

**Tech.md Patterns**: Implementation maintains Tauri + React + TypeScript architecture, uses existing Shadcn/ui components, follows established photo:// protocol patterns, and preserves local-first SQLite data model.

## Consolidated Task Requirements

**Comprehensive Scope**: Each task covers multiple related files and components
**Complete Functionality**: Each task delivers working end-to-end functionality
**No Testing**: Testing tasks removed as requested
**Agent-Friendly**: Clear input/output with minimal context switching between major functional areas

## Implementation Tasks

- [x] 1. Create all core pet profile components and type definitions
  - **Files**:
    - `src/lib/types.ts` - Add PetProfile ViewType and NavigationState interface
    - `src/components/pets/PetProfilePhoto.tsx` - Large photo display with blur background
    - `src/components/pets/PetActivityPreview.tsx` - Activity preview and Add Activity button
    - `src/components/pets/PetProfile.tsx` - Full-screen pet profile layout
    - `src/components/pets/AddPetProfile.tsx` - Add pet interface for navigation
    - `src/components/pets/EmptyStateHandler.tsx` - First-time user routing
  - **Implementation Details**:
    - Add PetProfile = 'pet-profile' to ViewType enum and NavigationState interface
    - Create PetProfilePhoto with size variants ('large', 'hero'), blur effects, progressive loading states
    - Build PetActivityPreview with placeholder UI, "Add Activity" button, and future activity display hooks
    - Develop PetProfile component integrating PetProfilePhoto and PetActivityPreview with responsive layout
    - Create AddPetProfile that integrates PetForm into navigation flow
    - Build EmptyStateHandler for intelligent homepage routing
  - **Purpose**: Establish complete component foundation for pet profile navigation
  - _Requirements: 1.1, 3.1-3.6, 4.1, 4.4, 5.1-5.5_
  - _Leverage: PetCard/PetDetailView photo loading, PetForm patterns, EmptyPetList styling, UI components_

- [x] 2. Implement horizontal navigation system and state management
  - **Files**:
    - `src/components/pets/PetProfileNavigation.tsx` - Main navigation container
    - `src/hooks/usePetProfileNavigation.ts` - Navigation state management hook
    - `src/hooks/usePets.ts` - Update with activePetId support and navigation integration
  - **Implementation Details**:
    - Create PetProfileNavigation with horizontal scrolling, navigation arrows, touch gesture support
    - Implement CSS transform hardware acceleration, pre-loading adjacent profiles, debouncing for gestures
    - Build usePetProfileNavigation hook extending useResponsiveNavigation patterns
    - Add navigation state management, pet index tracking, transition states, swipe detection
    - Update usePets hook with activePetId state, pet ordering, and navigation synchronization
    - Include error boundaries and graceful degradation for navigation failures
  - **Purpose**: Complete horizontal navigation system with performance optimization
  - _Requirements: 2.1-2.7, 6.1-6.5, 7.1-7.5_
  - _Leverage: PetCardList scrolling logic, useResponsiveNavigation patterns, existing pet state management_

- [x] 3. Integrate navigation system into main app with intelligent routing
  - **Files**:
    - `src/App.tsx` - Complete app integration with PetProfile view support
  - **Implementation Details**:
    - Add PetProfile view case to existing ViewType rendering logic
    - Integrate PetProfileNavigation component with existing state management
    - Implement intelligent homepage routing: empty pet state → AddPet, existing pets → PetProfile
    - Update pet selection logic to work with navigation system and EmptyStateHandler
    - Ensure navigation handlers work with new profile system and maintain backward compatibility
    - Add error handling for navigation state inconsistencies and automatic recovery
  - **Purpose**: Complete app-level integration with intelligent routing behavior
  - _Requirements: 1.1-1.4, 2.6_
  - _Leverage: App.tsx existing ViewType handling, pet loading, and state management patterns_

- [x] 4. Implement activity management and user interaction features
  - **Files**:
    - `src/components/pets/PetProfile.tsx` - Add Activity button functionality
    - `src/components/pets/PetActivityPreview.tsx` - Enhanced activity display
  - **Implementation Details**:
    - Connect "Add Activity" button to existing form systems with current pet pre-population
    - Add proper callback handling for activity creation and profile refresh
    - Enhance PetActivityPreview with recent activity display using card patterns
    - Implement activity overview with timestamps, descriptions, and click handlers for viewing/editing
    - Add responsive behavior for mobile/desktop layouts with proper touch target sizing
    - Ensure WCAG 2.1 AA compliance with ARIA labels and keyboard navigation support
  - **Purpose**: Complete activity integration and responsive user interaction
  - _Requirements: 4.1-4.5, 6.3-6.5, Accessibility requirements_
  - _Leverage: PetForm patterns, Card components, date formatting utilities, accessibility patterns_

- [x] 5. Implement performance optimizations, error handling, and accessibility features
  - **Files**:
    - `src/components/pets/PetProfileNavigation.tsx` - Final performance optimizations
    - `src/components/pets/PetProfilePhoto.tsx` - Progressive loading and error handling
    - `src/components/pets/PetProfile.tsx` - Accessibility and responsive enhancements
    - `src/components/pets/PetProfileNavigationErrorBoundary.tsx` - Comprehensive error boundaries
  - **Implementation Details**:
    - Fine-tune CSS transforms for hardware acceleration and 300ms transition targets
    - Implement React.lazy pre-loading for adjacent pet profiles with memory management (max 3 mounted)
    - Add progressive photo loading with skeleton states, 200ms delay, and comprehensive error recovery
    - Implement complete accessibility features: ARIA labels, screen reader support, keyboard navigation
    - Add error boundary component with graceful fallback to existing pet list view
    - Ensure cross-platform gesture handling and viewport-specific optimizations
    - Add comprehensive loading states and error feedback mechanisms
  - **Purpose**: Production-ready performance, accessibility, and error resilience
  - _Requirements: 7.1-7.5, Error handling requirements, Accessibility requirements_
  - _Leverage: Performance patterns, photo loading from PetCard, accessibility patterns, error handling from App.tsx_

## Implementation Notes

**Performance Targets**: Each navigation transition must complete in <300ms with 60fps animations
**Memory Management**: Maximum 3 mounted pet profiles at once to prevent memory issues
**Accessibility**: All interactive elements must meet 44px minimum touch target size with WCAG 2.1 AA compliance
**Error Recovery**: Navigation must gracefully handle missing photos, corrupted pet data, and state inconsistencies
**Backward Compatibility**: Existing pet management functionality must remain unaffected during implementation
**No Tests**: Testing implementation removed as requested - focus on production functionality
