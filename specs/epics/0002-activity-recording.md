# Epic 0002: Activity Recording System (动态记录系统)

## Overview

**Epic Title**: Activity Recording System
**Chinese Name**: 动态记录系统
**Milestone**: M1 (Foundation Framework)
**Priority**: P0 (Critical)
**Estimated Effort**: 12-15 story points
**Dependencies**: Epic 0001 (Pet Management System)

## Epic Description

The Activity Recording System enables pet owners to log structured activities across five core categories: Health, Growth, Diet, Lifestyle, and Expenses. This epic establishes the timeline-based recording interface and categorization system that forms the heart of daily pet tracking functionality.

## Success Criteria

- Users can record activities in under 3 steps for any category
- Comprehensive timeline view displays all activities chronologically
- Rich media support for photos and videos in activity entries
- Flexible filtering and search capabilities across activity categories
- Data validation ensures consistent, high-quality activity records
- Performance maintains <1s load times for timeline with 1000+ entries

## User Stories

### Story 2.1: Quick Activity Creation

**As a** pet owner
**I want to** quickly record a pet activity
**So that** I can capture moments without interrupting my daily routine

**Acceptance Criteria:**

- ✅ "Add Activity" button prominently placed and always accessible
- ✅ One-tap category selection from 5 main types: Health, Growth, Diet, Lifestyle, Expenses
- ✅ Smart defaults: current date/time, active pet selection
- ✅ Quick-entry templates for common activities (weight check, meal, walk)
- ✅ Auto-complete suggestions based on historical entries
- ✅ Save and continue option for rapid multiple entries
- ✅ Activity creation completed in maximum 3 user interactions

**Technical Notes:**

- Use React context for active pet and current date state
- Implement activity templates as JSON configurations
- Autocomplete powered by SQLite FTS (Full-Text Search)
- Background save with optimistic UI updates

**UI/UX Considerations:**

- Floating action button (FAB) with paw print icon
- Bottom sheet modal for quick category selection
- Progressive form with smart field ordering
- Haptic feedback for successful saves (via Tauri)

### Story 2.2: Structured Health Activity Recording

**As a** pet owner
**I want to** record detailed health-related activities
**So that** I can maintain comprehensive medical records for my pet

**Acceptance Criteria:**

- ✅ Health subcategories: Birth, Vaccination, Checkup, Surgery, Illness, Medication
- ✅ Required fields: activity type, date, veterinarian/clinic name
- ✅ Optional fields: symptoms, diagnosis, treatment, medication dosage, next appointment
- ✅ Photo attachments for medical documents, prescription labels, wound progress
- ✅ Cost tracking field for medical expenses
- ✅ Reminder setup for follow-up appointments or medication schedules
- ✅ Critical health events marked with priority flags

**Technical Notes:**

- Structured data schema for each health subcategory
- Integration with expense tracking for medical costs
- Medication reminder system foundation (expanded in M3)
- Photo OCR capabilities for prescription parsing (future enhancement)

**UI/UX Considerations:**

- Medical form styling with clear section separations
- Color coding: red for critical, yellow for follow-up, green for routine
- Quick-add buttons for common vet clinics and medications
- Visual timeline markers for vaccination schedules

### Story 2.3: Growth Tracking and Measurement Recording

**As a** pet owner
**I want to** track my pet's physical development over time
**So that** I can monitor their health and growth patterns

**Acceptance Criteria:**

- ✅ Growth subcategories: Weight, Height, Photos, Milestones
- ✅ Weight entry with unit conversion (kg/lbs) and measurement context
- ✅ Progress photos with comparison view (side-by-side previous photos)
- ✅ Milestone tracking: first steps, first words, behavioral changes
- ✅ Measurement trends visible immediately after entry
- ✅ Photo series organization for growth documentation
- ✅ Export capability for sharing with veterinarians

**Technical Notes:**

- Weight data stored with precision for accurate trend analysis
- Photo series linked with chronological ordering
- Automatic growth curve calculations
- Integration with data visualization components (Epic 0003)

**UI/UX Considerations:**

- Camera integration with before/after photo comparison
- Weight entry with large, touch-friendly number input
- Visual growth indicators with percentile charts
- Celebration animations for milestone achievements

### Story 2.4: Diet and Nutrition Logging

**As a** pet owner
**I want to** log my pet's food intake and dietary preferences
**So that** I can maintain optimal nutrition and track feeding patterns

**Acceptance Criteria:**

- ✅ Diet subcategories: Regular Feeding, Treats, Special Diet, Food Changes
- ✅ Food database with brand, product name, and nutritional information
- ✅ Portion size tracking with visual serving guides
- ✅ Feeding schedule and frequency recording
- ✅ Preference tracking (liked/disliked foods) with rating system
- ✅ Allergic reaction recording and food correlation analysis
- ✅ Cost per meal calculation and budget tracking

**Technical Notes:**

- Local food database with extensible product catalog
- Portion calculation algorithms for different food types
- Preference scoring system with machine learning potential
- Integration with expense tracking for food costs

**UI/UX Considerations:**

- Visual portion guide with pet-sized serving examples
- Swipe rating system for food preferences
- Quick-select for frequently fed items
- Photo capture for meal documentation

### Story 2.5: Lifestyle and Behavior Tracking

**As a** pet owner
**I want to** record my pet's daily activities and behavioral patterns
**So that** I can understand their personality and happiness levels

**Acceptance Criteria:**

- ✅ Lifestyle subcategories: Exercise, Play, Training, Grooming, Social Activities
- ✅ Activity duration tracking with start/stop timer functionality
- ✅ Mood and energy level indicators (1-5 scale with emoji)
- ✅ Location tagging for activities (park, home, beach)
- ✅ Weather conditions recording for outdoor activities
- ✅ Social interaction logging (other pets, humans, strangers)
- ✅ Training progress tracking with achievement milestones

**Technical Notes:**

- Timer functionality with background operation support
- Location services integration for activity mapping
- Weather API integration for environmental context
- Behavior pattern analysis foundation for future AI features

**UI/UX Considerations:**

- Fun, game-like interface with achievement badges
- Large timer display with paw print animation
- Emoji-based mood selection for intuitive input
- Map integration for activity location visualization

### Story 2.6: Expense Tracking and Financial Management

**As a** pet owner
**I want to** track all pet-related expenses
**So that** I can budget effectively and understand the cost of pet ownership

**Acceptance Criteria:**

- ✅ Expense categories: Medical, Food, Toys, Grooming, Training, Insurance, Other
- ✅ Receipt photo capture with automatic OCR text extraction
- ✅ Recurring expense setup (monthly food, annual insurance)
- ✅ Budget alerts when spending exceeds predefined limits
- ✅ Expense sharing capability for multi-owner households
- ✅ Tax-deductible expense flagging for service animals
- ✅ Cost-per-day and monthly spending summaries

**Technical Notes:**

- OCR integration for receipt processing
- Recurring expense scheduling system
- Budget calculation and alert mechanisms
- Multi-currency support for international users

**UI/UX Considerations:**

- Receipt camera with auto-crop and enhancement
- Clear expense categorization with color coding
- Budget dashboard with visual spending indicators
- Export functionality for accounting software integration

### Story 2.7: Activity Timeline and History View

**As a** pet owner
**I want to** view all recorded activities in chronological order
**So that** I can see my pet's complete history and track patterns over time

**Acceptance Criteria:**

- ✅ Reverse chronological timeline with infinite scroll
- ✅ Activity filtering by category, date range, and keywords
- ✅ Search functionality across all activity text and metadata
- ✅ Daily/weekly/monthly grouping options
- ✅ Rich media preview with lightbox for full-screen viewing
- ✅ Activity editing and deletion with change history
- ✅ Export timeline as PDF report or JSON data

**Technical Notes:**

- Virtual scrolling for performance with large datasets
- Full-text search implementation with SQLite FTS
- Efficient pagination and lazy loading
- Activity audit trail for edit tracking

**UI/UX Considerations:**

- Card-based timeline design with clear temporal grouping
- Smooth scroll animations with momentum
- Filter chips with active state indicators
- Rich media gallery view with swipe navigation

## Technical Implementation Details

### Database Schema

```sql
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('health', 'growth', 'diet', 'lifestyle', 'expenses')),
    subcategory VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    activity_date DATETIME NOT NULL,
    data JSON, -- Structured data specific to activity type
    cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    location VARCHAR(200),
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE TABLE activity_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_size INTEGER,
    thumbnail_path VARCHAR(500),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- Full-text search index
CREATE VIRTUAL TABLE activities_fts USING fts5(
    title, description, category, subcategory,
    content='activities', content_rowid='id'
);
```

### Activity Data Structures

```typescript
interface BaseActivity {
  id: string;
  petId: string;
  category: ActivityCategory;
  subcategory: string;
  title: string;
  description?: string;
  activityDate: Date;
  cost?: number;
  currency?: string;
  location?: string;
  moodRating?: 1 | 2 | 3 | 4 | 5;
  attachments: ActivityAttachment[];
}

interface HealthActivity extends BaseActivity {
  category: 'health';
  data: {
    veterinarianName?: string;
    clinicName?: string;
    symptoms?: string[];
    diagnosis?: string;
    treatment?: string;
    medications?: Medication[];
    nextAppointment?: Date;
    isCritical?: boolean;
  };
}

interface GrowthActivity extends BaseActivity {
  category: 'growth';
  data: {
    weight?: { value: number; unit: 'kg' | 'lbs' };
    height?: { value: number; unit: 'cm' | 'in' };
    milestoneType?: string;
    comparisonPhotos?: string[];
  };
}
```

### API Endpoints (Tauri Commands)

- `create_activity(activity_data: ActivityCreateRequest) -> Result<Activity, ActivityError>`
- `get_activities(pet_id: i64, filters: ActivityFilters) -> Result<PaginatedActivities, ActivityError>`
- `get_activity_by_id(id: i64) -> Result<Activity, ActivityError>`
- `update_activity(id: i64, activity_data: ActivityUpdateRequest) -> Result<Activity, ActivityError>`
- `delete_activity(id: i64) -> Result<(), ActivityError>`
- `search_activities(query: String, pet_id: Option<i64>) -> Result<Vec<Activity>, ActivityError>`
- `upload_attachment(activity_id: i64, file_data: Vec<u8>, metadata: AttachmentMetadata) -> Result<Attachment, ActivityError>`

### Component Architecture

```
components/
├── activities/
│   ├── ActivityCard.tsx          # Individual activity display
│   ├── ActivityForm.tsx          # Create/edit activity form
│   ├── ActivityTimeline.tsx      # Main timeline view
│   ├── CategorySelector.tsx      # Quick category selection
│   ├── AttachmentManager.tsx     # Photo/video upload and display
│   ├── ActivityFilters.tsx       # Filtering and search interface
│   ├── QuickActions.tsx          # Template-based quick entry
│   └── forms/
│       ├── HealthActivityForm.tsx
│       ├── GrowthActivityForm.tsx
│       ├── DietActivityForm.tsx
│       ├── LifestyleActivityForm.tsx
│       └── ExpenseActivityForm.tsx
```

## UI/UX Design Requirements

### Visual Design System

- **Timeline Design**: Card-based entries with clear temporal grouping
- **Category Colors**: Health (red), Growth (green), Diet (orange), Lifestyle (blue), Expenses (purple)
- **Typography**: Clear hierarchy with readable body text for descriptions
- **Iconography**: Category-specific icons with consistent style

### Form Design Patterns

- **Progressive Disclosure**: Show relevant fields based on category selection
- **Smart Defaults**: Auto-populate common fields and recent entries
- **Validation**: Real-time validation with helpful error messages
- **Media Upload**: Drag-and-drop with progress indicators and preview

### Performance Optimization

- **Virtual Scrolling**: Efficient rendering of large activity lists
- **Image Optimization**: Automatic resizing and compression for attachments
- **Offline Support**: Local storage with sync capabilities for future cloud features
- **Search Performance**: Indexed search with sub-100ms response times

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] Comprehensive form validation for all activity types
- [ ] Media upload and management functionality tested
- [ ] Timeline performance benchmarks met (1000+ activities)
- [ ] Search functionality with <100ms response times
- [ ] Offline functionality for core activity recording
- [ ] Unit and integration tests with >85% coverage
- [ ] Accessibility compliance for all form elements
- [ ] End-to-end testing scenarios for each activity type
- [ ] API documentation and error handling specifications

## Future Enhancements (Out of Scope)

- Advanced OCR for receipt and document processing
- Integration with fitness trackers and IoT pet devices
- Automatic activity suggestions based on behavior patterns
- Voice recording for quick activity notes
- Multi-pet activity correlation and comparison features
