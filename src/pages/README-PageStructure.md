# Page Structure and Organization Guide

This document outlines the structure and organization of page components in the Paw Diary application.

## Overview

Pages in the Paw Diary application are organized following React Router best practices with clear separation of concerns, consistent patterns, and comprehensive documentation.

## Page Categories

### Core Application Pages
Primary pages that form the main application flow:

- **HomePage**: Landing page and pet selection
- **AddPetPage**: Pet creation wizard  
- **PetProfilePage**: Individual pet dashboard
- **EditPetPage**: Pet information editing

### Activity Management Pages
Specialized pages for activity-related functionality:

- **ActivitiesListPage**: Comprehensive activity browsing
- **ActivityEditorPage**: Activity creation and editing
- **ActivitiesPage**: Legacy activity interface (deprecated)

## Page Structure Standards

### File Organization
```
src/pages/
├── index.ts                 # Centralized exports with JSDoc
├── README-Routing.md        # Routing documentation
├── README-PageStructure.md  # This file
├── HomePage.tsx
├── AddPetPage.tsx
├── PetProfilePage.tsx
├── EditPetPage.tsx
├── ActivitiesListPage.tsx
├── ActivityEditorPage.tsx
└── ActivitiesPage.tsx       # Deprecated
```

### Page Component Pattern
Each page follows this consistent structure:

```typescript
/**
 * PageName - Brief description
 * 
 * Route: /path/to/page
 * Purpose: Main functionality description
 * 
 * Features:
 * - Feature list
 * - With details
 * 
 * Navigation:
 * - Where it leads
 * - How to get here
 */
export function PageName() {
  // 1. Hooks (routing, data, state)
  const navigate = useNavigate();
  const { param } = useParams();
  const { data, isLoading } = useQuery(...);

  // 2. Event handlers
  const handleAction = () => { ... };

  // 3. Loading states
  if (isLoading) return <LoadingSkeleton />;

  // 4. Error states  
  if (error) return <ErrorDisplay />;

  // 5. Main render
  return (
    <div className="page-container">
      <header>...</header>
      <main>...</main>
      <footer>...</footer>
    </div>
  );
}
```

### JSDoc Standards
All pages must include comprehensive JSDoc comments:

```typescript
/**
 * ComponentName - Brief description
 * 
 * @route /path/to/page - Primary route
 * @purpose Main functionality description
 * 
 * @features
 * - Feature 1 with description
 * - Feature 2 with description
 * 
 * @navigation
 * - Entry: How users reach this page
 * - Exit: Where users go from here
 * 
 * @params
 * @param {string} param1 - Description
 * @param {number} param2 - Description
 * 
 * @query
 * @param {string} filter - Optional filter parameter
 * @param {string} view - Display mode selection
 * 
 * @example
 * // Basic usage
 * <Route path="/pets/:petId" element={<PetProfilePage />} />
 * 
 * @since 1.0.0
 */
```

## Page Responsibilities

### HomePage
**Core Responsibility**: Application entry point and pet selection

**Features**:
- Pet grid display with thumbnails
- Empty state handling
- Navigation to pet profiles
- Quick access to pet creation

**Dependencies**:
- `usePets` hook for pet data
- `PetThumbnailNavigation` component
- Router navigation utilities

**Testing Focus**:
- Pet selection navigation
- Empty state display
- Loading state handling

### AddPetPage  
**Core Responsibility**: New pet creation workflow

**Features**:
- Multi-step pet creation form
- Photo upload integration
- Species and breed selection
- Form validation and error handling

**Dependencies**:
- Pet creation mutation
- Form validation schemas
- Photo upload service
- Breed/species data

**Testing Focus**:
- Form validation
- Photo upload flow
- Navigation after creation

### PetProfilePage
**Core Responsibility**: Individual pet dashboard and activity overview

**Features**:
- Pet information display
- Recent activity timeline
- Quick statistics
- Navigation to detailed views
- Quick log functionality

**Dependencies**:
- `usePets` hook for pet data
- Activity timeline component
- Quick log sheet
- Statistics calculations

**Testing Focus**:
- Pet data loading
- Activity timeline display
- Quick log functionality
- Navigation to activities

### EditPetPage
**Core Responsibility**: Pet information modification

**Features**:
- Editable pet profile form
- Photo management
- Delete pet confirmation
- Form validation

**Dependencies**:
- Pet update mutation
- Form validation
- Photo management
- Delete confirmation dialogs

**Testing Focus**:
- Form pre-population
- Update functionality
- Delete confirmation flow
- Navigation handling

### ActivitiesListPage
**Core Responsibility**: Comprehensive activity browsing and management

**Features**:
- Activity timeline/list view
- Advanced filtering and sorting  
- Search functionality
- Bulk operations
- Export capabilities

**Dependencies**:
- Activity list hook
- Filtering components
- Timeline components
- Export utilities

**Testing Focus**:
- Activity loading and display
- Filtering functionality
- Search capabilities
- Bulk operations

### ActivityEditorPage
**Core Responsibility**: Activity creation and editing with rich editor

**Features**:
- Multi-mode editing interface
- Block-based content editor
- Draft management
- Auto-save functionality
- Template system

**Dependencies**:
- Activity editor core
- Draft management hooks
- Template system
- Auto-save functionality

**Testing Focus**:
- Editor mode switching
- Draft functionality
- Auto-save behavior
- Template loading

## Common Patterns

### Loading States
All pages implement consistent loading patterns:

```typescript
if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
```

### Error States
Standardized error handling across all pages:

```typescript
if (error) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-96">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive mb-3">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-semibold">Error</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || 'Something went wrong'}
          </p>
          <Button onClick={retry} variant="outline" className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Navigation Patterns
Consistent navigation handling:

```typescript
// Back navigation with fallback
const handleBack = () => {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate('/');
  }
};

// Route building with parameters
const navigateToEdit = (petId: number) => {
  navigate(`/pets/${petId}/edit`);
};
```

### Pet Context Header
Pet-related pages use consistent header pattern:

```typescript
<PetContextHeader
  petId={petId}
  title="Page Title"
  subtitle="Page description"
  onBack={handleBack}
  actions={[
    <Button key="action" onClick={handleAction}>
      Action
    </Button>
  ]}
/>
```

## Performance Considerations

### Code Splitting
Pages are lazy-loaded for optimal performance:

```typescript
// In router configuration
const HomePage = lazy(() => import('./HomePage'));
const ActivityEditorPage = lazy(() => import('./ActivityEditorPage'));
```

### Data Prefetching
Pages prefetch related data:

```typescript
// Prefetch pet data on home page
const prefetchPet = (petId: number) => {
  queryClient.prefetchQuery(['pet', petId], () => fetchPet(petId));
};
```

### Memory Management
Pages clean up resources on unmount:

```typescript
useEffect(() => {
  return () => {
    // Cleanup subscriptions, timers, etc.
    clearInterval(autoSaveTimer);
    connection?.close();
  };
}, []);
```

## Testing Guidelines

### Page Component Tests
Each page should have comprehensive tests:

```typescript
describe('HomePage', () => {
  it('displays pet selection when pets exist', () => {
    render(<HomePage />, { 
      wrappers: [RouterWrapper, QueryWrapper],
      initialEntries: ['/']
    });
    
    expect(screen.getByText('Select a Pet')).toBeInTheDocument();
  });

  it('shows empty state when no pets exist', () => {
    // Test empty state
  });

  it('navigates to pet profile on selection', () => {
    // Test navigation
  });
});
```

### Integration Tests
Test page-to-page navigation flows:

```typescript
describe('Pet Profile Flow', () => {
  it('navigates from home to profile to activities', async () => {
    const { user } = setup('/');
    
    // Select pet from home page
    await user.click(screen.getByText('Buddy'));
    expect(location.pathname).toBe('/pets/1');
    
    // Navigate to activities
    await user.click(screen.getByText('View All Activities'));
    expect(location.pathname).toBe('/pets/1/activities');
  });
});
```

## Migration Guidelines

### Adding New Pages
1. Create page component following structure standards
2. Add comprehensive JSDoc documentation
3. Export from `pages/index.ts` with documentation
4. Add route configuration in `App.tsx`
5. Update routing documentation
6. Add tests for the page
7. Consider performance implications

### Deprecating Pages
1. Mark as deprecated in JSDoc
2. Add migration path documentation
3. Update routing to redirect old routes
4. Plan removal timeline
5. Communicate changes to team

## Future Considerations

### Planned Pages
- Health tracking dashboard
- Growth metrics and charts  
- Nutrition planning interface
- Expense tracking and budgets
- Settings and preferences
- Data import/export wizards

### Architecture Evolution
- Consider page composition patterns
- Evaluate micro-frontend approach
- Plan for internationalization
- Consider offline functionality