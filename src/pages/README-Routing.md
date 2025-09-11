# Paw Diary - Page Routing Documentation

This document provides comprehensive documentation for the Paw Diary application's routing architecture and page structure.

## Overview

The Paw Diary application uses React Router for client-side routing with a hierarchical URL structure centered around pets and their activities. All routes are designed to be bookmarkable and SEO-friendly.

## Route Architecture

### Core Principles
- **Pet-Centric**: Most functionality is organized around individual pets
- **Hierarchical**: URLs reflect the logical relationship between entities
- **Bookmarkable**: All pages can be directly accessed via URL
- **Clean URLs**: No hash routing, uses browser history API

### URL Structure Pattern
```
/                                  # Home/pet selection
/pets/new                         # Add new pet
/pets/{petId}                     # Pet profile
/pets/{petId}/edit               # Edit pet
/pets/{petId}/activities         # Pet's activities list
/pets/{petId}/activities/new     # Create new activity
/pets/{petId}/activities/{id}/edit # Edit specific activity
```

## Route Definitions

### Core Application Routes

#### `/ (HomePage)`
- **Component**: `HomePage`
- **Purpose**: Landing page with pet selection and overview
- **Features**:
  - Pet selection grid
  - Quick stats overview
  - Navigation to pet profiles
  - Add new pet shortcut
- **Authentication**: None required
- **Parameters**: None
- **Query Parameters**: None

#### `/pets/new (AddPetPage)`
- **Component**: `AddPetPage`
- **Purpose**: Pet creation and onboarding flow
- **Features**:
  - Pet profile form
  - Photo upload
  - Initial setup wizard
  - Breed and species selection
- **Navigation**: Redirects to pet profile after creation
- **Parameters**: None
- **Query Parameters**: 
  - `?step=N` - Multi-step form navigation

#### `/pets/:petId (PetProfilePage)`
- **Component**: `PetProfilePage`
- **Purpose**: Individual pet dashboard with activity preview
- **Features**:
  - Pet information display
  - Recent activity timeline
  - Quick statistics
  - Navigation to detailed views
- **Parameters**:
  - `petId` (number) - Unique pet identifier
- **Query Parameters**:
  - `?tab=activities|health|growth` - Default tab selection
- **Error Handling**: 404 if pet not found

#### `/pets/:petId/edit (EditPetPage)`
- **Component**: `EditPetPage`
- **Purpose**: Edit existing pet information
- **Features**:
  - Editable pet profile form
  - Photo management
  - Settings configuration
  - Delete pet option
- **Parameters**:
  - `petId` (number) - Pet to edit
- **Navigation**: Returns to pet profile after save
- **Permissions**: Only pet owner can edit

### Activity Management Routes

#### `/pets/:petId/activities (ActivitiesListPage)`
- **Component**: `ActivitiesListPage`
- **Purpose**: Comprehensive activity list with filtering and management
- **Features**:
  - Activity timeline/list view
  - Advanced filtering and sorting
  - Bulk operations
  - Search functionality
  - Export capabilities
- **Parameters**:
  - `petId` (number) - Pet whose activities to display
- **Query Parameters**:
  - `?view=list|timeline|calendar` - Display mode
  - `?category=health|growth|diet|lifestyle|expense` - Filter by category
  - `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` - Date range filter
  - `?search=query` - Search activities
  - `?sort=date|category|title` - Sort order
  - `?order=asc|desc` - Sort direction
  - `?page=N&limit=N` - Pagination

#### `/pets/:petId/activities/new (ActivityEditorPage)`
- **Component**: `ActivityEditorPage`
- **Purpose**: Create new activity with rich block-based editor
- **Features**:
  - Multi-mode editing (quick/guided/advanced)
  - Block-based content editor
  - Draft management
  - Auto-save functionality
  - Template system
- **Parameters**:
  - `petId` (number) - Pet for the new activity
- **Query Parameters**:
  - `?mode=quick|guided|advanced` - Editor mode
  - `?template=templateId` - Pre-load template
  - `?category=health|growth|diet|lifestyle|expense` - Pre-select category
  - `?draft=draftId` - Resume from draft
- **Navigation**: Redirects to activities list after creation

#### `/pets/:petId/activities/:activityId/edit (ActivityEditorPage)`
- **Component**: `ActivityEditorPage` (edit mode)
- **Purpose**: Edit existing activity
- **Features**:
  - Same as creation mode but pre-populated
  - Version history
  - Change tracking
  - Deletion capability
- **Parameters**:
  - `petId` (number) - Pet owner of activity
  - `activityId` (number) - Activity to edit
- **Query Parameters**:
  - `?mode=quick|guided|advanced` - Editor mode
- **Navigation**: Returns to activities list after save
- **Error Handling**: 404 if activity not found or permission denied

### Legacy Routes

#### ActivitiesPage (Deprecated)
- **Status**: Deprecated, not currently routed
- **Purpose**: Original activity management interface
- **Migration Path**: Use `ActivitiesListPage` instead
- **Reason**: Replaced by improved pet-centric activity management

## Route Parameters

### Path Parameters
```typescript
interface RouteParams {
  petId: string;        // Pet identifier (parsed to number)
  activityId?: string;  // Activity identifier (parsed to number)
}
```

### Query Parameters
```typescript
interface ActivityListQuery {
  view?: 'list' | 'timeline' | 'calendar';
  category?: ActivityCategory;
  date_from?: string;   // ISO date string
  date_to?: string;     // ISO date string
  search?: string;
  sort?: 'date' | 'category' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface ActivityEditorQuery {
  mode?: 'quick' | 'guided' | 'advanced';
  template?: string;
  category?: ActivityCategory;
  draft?: string;
}

interface PetProfileQuery {
  tab?: 'activities' | 'health' | 'growth';
}
```

## Navigation Patterns

### Programmatic Navigation
```typescript
// Navigate to pet profile
navigate(`/pets/${petId}`);

// Navigate to activities with filters
navigate(`/pets/${petId}/activities?category=health&view=timeline`);

// Navigate to activity editor with template
navigate(`/pets/${petId}/activities/new?template=${templateId}&mode=guided`);

// Navigate back with state preservation
navigate(-1);
```

### Link Components
```tsx
// Pet profile link
<Link to={`/pets/${petId}`}>View Profile</Link>

// Activity creation link
<Link 
  to={`/pets/${petId}/activities/new`} 
  state={{ category: 'health' }}
>
  Add Health Activity
</Link>

// Activities with filters
<Link to={`/pets/${petId}/activities?category=health`}>
  Health Activities
</Link>
```

## Error Handling

### 404 - Not Found
- Invalid pet IDs redirect to home page
- Invalid activity IDs redirect to pet's activities list
- Unknown routes redirect to home page

### 403 - Forbidden
- Attempting to edit pets not owned by user
- Accessing activities for pets without permission

### Route Guards
```typescript
// Pet ownership validation
const validatePetAccess = (petId: number) => {
  // Check if user owns pet
  // Redirect if unauthorized
};

// Activity ownership validation  
const validateActivityAccess = (petId: number, activityId: number) => {
  // Check pet ownership and activity existence
  // Redirect if unauthorized
};
```

## Performance Optimizations

### Code Splitting
```typescript
// Lazy load pages for better performance
const HomePage = lazy(() => import('./HomePage'));
const ActivityEditorPage = lazy(() => import('./ActivityEditorPage'));
```

### Preloading
- Pet data preloaded on home page
- Activity summaries preloaded on pet profiles
- Next/previous activities preloaded in editor

### Caching Strategy
- Pet information cached across navigation
- Activity lists cached with invalidation
- Route-based cache keys for React Query

## SEO and Bookmarking

### Meta Tags
Each page dynamically sets:
- Page title (e.g., "Buddy's Activities - Paw Diary")
- Meta description based on content
- Open Graph tags for social sharing

### Bookmark-Friendly URLs
All URLs are designed to be:
- Human-readable
- Descriptive of content
- Stable over time
- Shareable

## Development Guidelines

### Adding New Pages
1. Create page component in `/src/pages/`
2. Add to `/src/pages/index.ts` with JSDoc
3. Define route in `/src/App.tsx`
4. Update this documentation
5. Add route parameters type definitions
6. Implement error boundaries

### Route Testing
```typescript
// Test route rendering
render(<App />, { route: '/pets/123/activities' });

// Test navigation
fireEvent.click(screen.getByText('View Activities'));
expect(window.location.pathname).toBe('/pets/123/activities');

// Test query parameters
expect(searchParams.get('category')).toBe('health');
```

### URL Design Best Practices
- Use nouns for resources (`/pets`, `/activities`)
- Use verbs for actions (`/new`, `/edit`)
- Maintain hierarchy (`/pets/:id/activities`)
- Keep URLs short but descriptive
- Use kebab-case for multi-word segments

## Migration Notes

### From Legacy Routes
- Old `/activities` route → `/pets/:petId/activities`
- Hash-based routes → Clean URLs
- Query-based navigation → Path-based navigation

### Breaking Changes
- Pet ID now required for activity pages
- Activity URLs changed structure
- Some query parameters renamed for consistency

## Future Considerations

### Planned Routes
- `/pets/:petId/health` - Dedicated health tracking
- `/pets/:petId/growth` - Growth chart and metrics
- `/pets/:petId/diet` - Nutrition planning
- `/pets/:petId/expenses` - Cost tracking
- `/settings` - Application settings
- `/import` - Data import wizard
- `/export` - Data export options

### Internationalization
- Route localization planned
- URL structure will accommodate language prefixes
- Example: `/en/pets/:petId` vs `/es/mascotas/:petId`