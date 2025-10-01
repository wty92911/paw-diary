# Quickstart: Universal Header Component Integration

**Feature**: Universal Header Component for iOS App  
**Target**: React + TailwindCSS + Shadcn UI developers  
**Estimated Time**: 30 minutes setup + 15 minutes per page migration  

## Overview

This guide walks you through integrating the Universal Header Component into the Paw Diary app, replacing existing inconsistent header implementations with a unified, configurable solution.

## Prerequisites

- ✅ React 18+ with TypeScript
- ✅ TailwindCSS configured
- ✅ Shadcn UI components installed
- ✅ React Router for navigation
- ✅ Existing Paw Diary codebase structure

## Quick Setup (5 minutes)

### 1. Install Component Files

```bash
# Copy component files to your project
mkdir -p src/components/header
cp contracts/header-component.ts src/components/header/types.ts
```

### 2. Add HeaderProvider to App Root

```tsx
// src/App.tsx
import { HeaderProvider } from './components/header/HeaderProvider';

function App() {
  return (
    <HeaderProvider>
      <BrowserRouter>
        {/* Your existing routes */}
      </BrowserRouter>
    </HeaderProvider>
  );
}
```

### 3. Verify Installation

```tsx
// Test component renders without errors
import { UniversalHeader } from './components/header';

const testConfig = {
  variant: 'app' as const,
  title: 'Paw Diary',
  showBackButton: false,
  sticky: true
};

// Should render without errors
<UniversalHeader configuration={testConfig} />
```

## Component Usage Examples

### App Header (Home Page)

Replace the existing home page header:

```tsx
// Before: Custom header in HomePage.tsx
<div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-b border-orange-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Complex custom header code */}
  </div>
</div>

// After: Unified component
import { AppHeader } from './components/header';

<AppHeader 
  title="Paw Diary"
  actions={[
    {
      id: 'add-pet',
      label: 'Add Pet',
      handler: () => navigateToAddPet(),
      variant: 'primary',
      position: 'trailing'
    }
  ]}
  sticky={true}
/>
```

### Pet Context Header (Pet Profile, Activities)

Replace PetContextHeader component:

```tsx
// Before: Custom PetContextHeader
<PetContextHeader 
  pet={pet}
  showBackButton={true}
  breadcrumbs={breadcrumbs}
/>

// After: Unified component
import { PetContextHeader } from './components/header';

<PetContextHeader
  pet={pet}
  showBackButton={true}
  breadcrumbs={[
    { label: 'Profile', href: `/pets/${pet.id}`, active: false },
    { label: 'Activities', active: true }
  ]}
  backAction={{
    type: 'router-back',
    label: 'Back'
  }}
  showPetPhoto={true}
  photoSize="medium"
  showSpecies={true}
/>
```

### Form Header (Add Pet, Edit Pet)

Replace form page headers:

```tsx
// Before: Custom form header in AddPetPage.tsx
<header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 flex-shrink-0">
  {/* Complex form header implementation */}
</header>

// After: Unified component
import { FormHeader } from './components/header';

<FormHeader
  title="Add New Pet"
  subtitle="Create your pet's profile"
  showBackButton={true}
  backAction={{
    type: 'navigate-to-url',
    url: '/',
    label: 'Cancel'
  }}
  sticky={false}
/>
```

## Step-by-Step Migration Guide

### Step 1: HomePage Migration (5 minutes)

1. **Remove existing header code** from `src/pages/HomePage.tsx` (lines 106-135)
2. **Add AppHeader import** and usage
3. **Move navigation actions** to header actions array
4. **Test navigation** works correctly

```tsx
// src/pages/HomePage.tsx
import { AppHeader } from '../components/header';

export function HomePage() {
  // ... existing code ...

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <AppHeader 
        title="Paw Diary"
        actions={[
          {
            id: 'add-pet',
            label: 'Add Pet', 
            handler: handleAddPet,
            variant: 'primary',
            position: 'trailing'
          }
        ]}
        sticky={true}
      />
      
      {/* Rest of HomePage content with pt-16 for fixed header */}
      <div className="pt-16">
        <PetThumbnailNavigation {...props} />
      </div>
    </div>
  );
}
```

### Step 2: AddPetPage Migration (5 minutes)

1. **Replace header section** in `src/pages/AddPetPage.tsx` (lines 160-188)
2. **Use FormHeader component**
3. **Update layout** to work with new header

```tsx
// src/pages/AddPetPage.tsx
import { FormHeader } from '../components/header';

export function AddPetPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col">
      <FormHeader
        title="Add New Pet"
        subtitle="Create your pet's profile"
        showBackButton={true}
        backAction={{
          type: 'custom-handler',
          handler: handleBack,
          label: 'Back'
        }}
        sticky={false}
      />
      
      {/* Main content remains the same */}
      <main className="flex-1 overflow-y-auto">
        {/* Existing form content */}
      </main>
    </div>
  );
}
```

### Step 3: PetProfilePage Migration (10 minutes)

1. **Replace existing header** with PetContextHeader
2. **Update breadcrumb generation** logic
3. **Ensure pet context** is properly passed

```tsx
// src/pages/PetProfilePage.tsx
import { PetContextHeader } from '../components/header';

export function PetProfilePage() {
  const { pet } = usePet(petId);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <PetContextHeader
        pet={pet}
        showBackButton={true}
        backAction={{
          type: 'router-back',
          label: 'Home'
        }}
        showPetPhoto={true}
        photoSize="medium"
        showSpecies={true}
        sticky={true}
      />
      
      {/* Rest of page content */}
    </div>
  );
}
```

### Step 4: ActivitiesListPage Migration (10 minutes)

1. **Replace PetContextHeader import** with unified component
2. **Update breadcrumb configuration**
3. **Test navigation flow**

```tsx
// src/pages/ActivitiesListPage.tsx
import { PetContextHeader } from '../components/header';

export function ActivitiesListPage() {
  const { pet } = usePet(petId);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <PetContextHeader
        pet={pet}
        breadcrumbs={[
          { label: 'Profile', href: `/pets/${pet.id}`, active: false },
          { label: 'Activities', active: true }
        ]}
        showBackButton={true}
        backAction={{
          type: 'navigate-to-url',
          url: `/pets/${pet.id}`,
          label: 'Back to Profile'
        }}
        showPetPhoto={true}
        photoSize="small"
        showSpecies={false}
        sticky={true}
      />
      
      {/* Activities content */}
    </div>
  );
}
```

### Step 5: Cleanup (5 minutes)

1. **Remove old header components**:
   - `src/components/pets/PetContextHeader.tsx`
   - `src/components/pets/PetProfileHeader.tsx` (if used in headers)

2. **Update imports** across the codebase

3. **Run tests** to ensure everything works

## Testing Your Integration

### 1. Visual Consistency Test

Navigate through these pages and verify consistent styling:
- ✅ Home page header matches app branding
- ✅ Pet profile header shows pet context
- ✅ Activities page shows breadcrumbs
- ✅ Add pet page shows form context
- ✅ All headers have consistent spacing and colors

### 2. Navigation Test

Test all back navigation scenarios:
- ✅ Back from pet profile goes to home
- ✅ Back from activities goes to pet profile  
- ✅ Cancel from add pet goes to home
- ✅ Back from edit pet goes to pet profile

### 3. Responsive Test

Test on different screen sizes:
- ✅ Mobile (320px): Headers adapt without overflow
- ✅ Tablet (768px): Breadcrumbs display properly
- ✅ Desktop (1024px+): Full header features visible

### 4. Accessibility Test

Verify accessibility compliance:
- ✅ Screen reader navigation works
- ✅ Keyboard navigation functions
- ✅ Focus management is proper
- ✅ ARIA labels are present

## Performance Considerations

### Bundle Size Impact
- ✅ **Expected increase**: <5KB gzipped
- ✅ **Reduction from consolidation**: -2KB (removing duplicate code)
- ✅ **Net impact**: ~3KB increase for major UX improvement

### Runtime Performance
- ✅ **Render time**: <16ms for 60fps interactions
- ✅ **Memory usage**: Minimal increase with component memoization
- ✅ **Navigation speed**: Improved with consistent state management

## Troubleshooting

### Common Issues

**Headers not showing up**
```tsx
// Check HeaderProvider is wrapping your app
<HeaderProvider>
  <BrowserRouter>
    <Routes>...</Routes>
  </BrowserRouter>
</HeaderProvider>
```

**Styling inconsistencies**
```tsx
// Ensure TailwindCSS classes are available
// Check parent container doesn't override header styles
className="relative" // Instead of fixed positioning conflicts
```

**Navigation not working**
```tsx
// Verify back actions are properly configured
backAction={{
  type: 'router-back', // or 'custom-handler', 'navigate-to-url'
  handler: () => navigate(-1), // for custom handlers
  url: '/target-path' // for URL navigation
}}
```

**Pet context missing**
```tsx
// Ensure pet data is loaded before rendering
{pet && (
  <PetContextHeader pet={pet} {...otherProps} />
)}
```

## Next Steps

1. **Implement remaining pages** (EditPetPage, ActivityEditorPage)
2. **Add custom themes** if needed for specific sections
3. **Implement advanced features** like search in header
4. **Add analytics tracking** for header interactions
5. **Consider animations** for smooth transitions

## Support

For implementation questions:
- Check `contracts/header-component.ts` for TypeScript definitions
- Review `contracts/header-component.test.ts` for usage examples
- Test your implementation against the provided test contracts

Your Universal Header Component integration is now complete! 🎉