# Epic 0001: Pet Management System (宠物管理系统)

## Overview

**Epic Title**: Pet Management System
**Chinese Name**: 宠物管理系统
**Milestone**: M1 (Foundation Framework)
**Priority**: P0 (Critical)
**Estimated Effort**: 8-10 story points
**Dependencies**: None (Foundation epic)

## Epic Description

The Pet Management System forms the core foundation of Paw Diary, enabling users to create, manage, and switch between multiple pet profiles. This epic establishes the fundamental data model and user interface patterns that all other features will build upon.
Focus on the MVP, do not try to add "user" or "login" or "register".

## Success Criteria

- Users can add unlimited pet profiles with complete information
- Intuitive swipe-based navigation between pet profiles on the main interface
- Comprehensive pet detail views with key information at a glance
- Seamless pet profile editing and management capabilities
- Fast (<500ms) pet switching experience on desktop

## User Stories

### Story 1.1: Add New Pet Profile

**As a** pet owner
**I want to** create a detailed profile for my pet
**So that** I can start tracking their growth and activities

**Acceptance Criteria:**

- ✅ User can access "Add Pet" interface from main screen's rightmost card
- ✅ Required fields: pet name, birth date, species (cat/dog), gender
- ✅ Optional fields: breed, color, weight, photo, personal notes
- ✅ Photo upload supports common formats (JPEG, PNG, HEIC) with auto-resize to 512x512
- ✅ Form validation prevents submission of incomplete required data
- ✅ Success confirmation displays after pet creation
- ✅ New pet automatically becomes the active pet view

**Technical Notes:**

- Use Tauri's file system APIs for photo storage in local app directory
- Implement form validation using React Hook Form with Zod schema
- Store pet data in SQLite with proper indexing for fast retrieval
- Image processing handled by Rust backend for performance

**UI/UX Considerations:**

- Clean, card-based form layout with progressive disclosure
- Photo upload with drag-drop and click-to-browse options
- Warm visual feedback with paw print loading animations
- Auto-save draft functionality to prevent data loss

### Story 1.2: Pet Profile Card Navigation

**As a** multi-pet owner
**I want to** easily switch between my pets' profiles
**So that** I can manage all my pets from a single interface

**Acceptance Criteria:**

- ✅ Main screen displays pet profiles as horizontally scrollable cards
- ✅ Each card shows pet photo, name, age, and key stats preview
- ✅ Smooth swipe/drag navigation between pet cards
- ✅ Rightmost card is always "+" button for adding new pets
- ✅ Active pet card is visually highlighted with subtle animation
- ✅ Support for 1-20 pets without performance degradation
- ✅ Cards maintain consistent spacing and sizing across different screen sizes

**Technical Notes:**

- Use React horizontal scroll component with momentum scrolling
- Implement virtualization for performance with many pets
- Cache pet preview data for instant card updates
- Use CSS transforms for smooth animations

**UI/UX Considerations:**

- Card design reflects diary/scrapbook aesthetic with rounded corners
- Subtle shadows and warm color palette (cream white, light yellow)
- Pet cards show personality through photos and color coding
- Visual indicators for active pet and navigation state

### Story 1.3: Pet Detail View

**As a** pet owner
**I want to** view comprehensive information about my selected pet
**So that** I can see their profile and key metrics at a glance

**Acceptance Criteria:**

- ✅ Tapping pet card navigates to detailed pet view
- ✅ Profile section displays: full photo, name, birth date, age calculation, breed, gender, color
- ✅ Quick stats section shows: latest weight, last vet visit, recent activity count
- ✅ Recent activities preview (3-5 most recent entries)
- ✅ Navigation breadcrumb to return to main pet selection
- ✅ "Edit Profile" button accessible from detail view
- ✅ Data loads within 300ms for smooth user experience

**Technical Notes:**

- Implement optimistic UI updates for fast navigation
- Query recent activities with LIMIT for performance
- Use React Query for caching and background updates
- Calculate age dynamically from birth date

**UI/UX Considerations:**

- Hero section with large pet photo and essential info
- Card-based layout for different information sections
- Consistent spacing and typography hierarchy
- Subtle animations for section reveals and data updates

### Story 1.4: Edit Pet Profile

**As a** pet owner
**I want to** modify my pet's profile information
**So that** I can keep their data current and accurate

**Acceptance Criteria:**

- ✅ "Edit Profile" accessible from pet detail view
- ✅ Pre-populated form with current pet information
- ✅ All fields editable except creation date (shown as read-only)
- ✅ Photo replacement with preview of new image
- ✅ "Save Changes" and "Cancel" options clearly visible
- ✅ Confirmation dialog for destructive actions (delete pet)
- ✅ Changes reflected immediately in all views after save
- ✅ Form validation prevents invalid data submission

**Technical Notes:**

- Use same form component as pet creation with edit mode
- Implement optimistic updates for instant UI feedback
- Handle photo replacement with old file cleanup
- Use SQLite transactions for data consistency

**UI/UX Considerations:**

- Same visual design as creation form for consistency
- Clear visual feedback for unsaved changes
- Confirmation dialogs for destructive actions
- Auto-save functionality to prevent accidental data loss

### Story 1.5: Pet Profile Management

**As a** pet owner
**I want to** organize and manage multiple pet profiles
**So that** I can maintain accurate records for all my pets

**Acceptance Criteria:**

- ✅ Ability to archive pets (hide without deleting data)
- ✅ Reorder pets by drag and drop on main screen
- ✅ Delete pet profile with confirmation and data cleanup
- ✅ Duplicate pet profile for similar pets (siblings, same breed)
- ✅ Export pet data as JSON for backup purposes
- ✅ Search/filter pets by name when managing many profiles
- ✅ Bulk operations available when managing 5+ pets

**Technical Notes:**

- Implement soft delete with archive flag
- Use drag-and-drop library compatible with Tauri
- Export functionality using Tauri's file system APIs
- Cascade delete relationships for data integrity

**UI/UX Considerations:**

- Management mode toggle for advanced operations
- Confirmation patterns for all destructive actions
- Progress indicators for bulk operations
- Clear visual distinction between active and archived pets

## Technical Implementation Details

### Database Schema

```sql
CREATE TABLE pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    species VARCHAR(20) NOT NULL CHECK (species IN ('cat', 'dog')),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'unknown')),
    breed VARCHAR(100),
    color VARCHAR(50),
    weight_kg DECIMAL(5,2),
    photo_path VARCHAR(255),
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints (Tauri Commands)

- `create_pet(pet_data: PetCreateRequest) -> Result<Pet, PetError>`
- `get_pets(include_archived: bool) -> Result<Vec<Pet>, PetError>`
- `get_pet_by_id(id: i64) -> Result<Pet, PetError>`
- `update_pet(id: i64, pet_data: PetUpdateRequest) -> Result<Pet, PetError>`
- `delete_pet(id: i64) -> Result<(), PetError>`
- `reorder_pets(pet_ids: Vec<i64>) -> Result<(), PetError>`

### Component Architecture

```
components/
├── pets/
│   ├── PetCard.tsx           # Individual pet card display
│   ├── PetCardList.tsx       # Horizontal scrolling container
│   ├── PetDetailView.tsx     # Comprehensive pet information
│   ├── PetForm.tsx           # Create/edit pet form
│   ├── PetManagement.tsx     # Bulk operations interface
│   └── types.ts              # TypeScript type definitions
```

## UI/UX Design Requirements

### Visual Design System

- **Color Palette**: Cream white (#FEF9F3), Light yellow (#FEF7CD), Light blue (#E0F2FE)
- **Typography**: Clean, readable fonts with proper hierarchy
- **Iconography**: Paw prints, heart shapes, diary elements
- **Photography**: Rounded corners, consistent aspect ratios, warm filters

### Responsive Design

- **Desktop**: Card-based layout with sidebar navigation
- **Tablet**: Optimized card sizing for touch interaction
- **Mobile**: Full-width cards with gesture-based navigation

### Accessibility

- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Keyboard Navigation**: Tab order and focus management
- **Color Contrast**: WCAG 2.1 AA compliance for all text
- **Touch Targets**: Minimum 44px touch targets for interactive elements

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] Unit tests written with >80% code coverage
- [ ] Integration tests for all API endpoints
- [ ] UI components tested with React Testing Library
- [ ] Performance benchmarks meet targets (<300ms data loading)
- [ ] Accessibility audit passed
- [ ] Code review completed and approved
- [ ] Documentation updated with API specifications
- [ ] End-to-end testing scenarios validated

## Future Enhancements (Out of Scope)

- Multi-user pet sharing capabilities
- Pet social features and community integration
- Advanced pet health scoring algorithms
- Integration with veterinary clinic systems
- Pet insurance integration and claims management
