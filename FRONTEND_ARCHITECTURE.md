# Frontend Architecture Documentation

## Overview

The Paw Diary frontend is built as a modern React application using TypeScript, designed specifically for a Tauri 2.x desktop environment. The application follows a component-driven architecture with centralized state management, focusing on pet growth tracking and activity recording.

## Technology Stack

### Core Framework
- **React 19.1.0** - Modern React with hooks and functional components
- **TypeScript 5.8.3** - Type-safe development with strict typing
- **Vite 7.0.4** - Build tool and development server
- **Tauri 2.x** - Desktop app framework with Rust backend integration

### State Management & Data
- **React Reducer Pattern** - Centralized app state via `useAppState` hook
- **Custom Hooks** - Modular data fetching and state management
- **Zod** - Runtime type validation and schema definitions
- **React Hook Form** - Form state management with validation

### UI & Styling
- **TailwindCSS 3.4.1** - Utility-first CSS framework
- **Shadcn/UI Components** - Modern component library with Radix UI primitives
- **Lucide React** - Icon library
- **Class Variance Authority** - Type-safe variant styling

### Development & Testing
- **Vitest** - Unit testing framework
- **Testing Library** - React component testing utilities
- **ESLint & Prettier** - Code linting and formatting
- **TypeScript ESLint** - TypeScript-specific linting rules

## Project Structure

```
src/
├── components/
│   ├── activities/           # Activity recording components
│   │   ├── forms/           # Category-specific activity forms
│   │   ├── __tests__/       # Activity component tests
│   │   ├── ActivityCard.tsx
│   │   ├── ActivityFAB.tsx
│   │   ├── ActivityForm.tsx
│   │   ├── ActivityTimeline.tsx
│   │   └── ...
│   ├── pets/                # Pet management components
│   │   ├── PetForm.tsx
│   │   ├── PetManagement.tsx
│   │   ├── PetProfile.tsx
│   │   ├── PetThumbnail.tsx
│   │   └── ...
│   └── ui/                  # Reusable UI components (Shadcn/UI)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
├── hooks/                   # Custom React hooks
│   ├── useAppState.ts       # Central app state management
│   ├── usePets.ts           # Pet data operations
│   ├── useActivities.ts     # Activity data operations
│   ├── usePhotos.ts         # Photo management
│   └── ...
├── lib/                     # Utilities and types
│   ├── types.ts             # TypeScript type definitions
│   ├── utils.ts             # Utility functions
│   └── activityUtils.ts     # Activity-specific utilities
├── test/                    # Test utilities and setup
├── App.tsx                  # Root application component
├── main.tsx                 # Application entry point
└── index.css                # Global styles
```

## Architecture Patterns

### Component Architecture

#### 1. Container-Presenter Pattern
- **Container Components**: Handle state management and business logic (e.g., `App.tsx`)
- **Presentation Components**: Focus on UI rendering and user interactions
- **Custom Hooks**: Encapsulate data fetching and state management logic

#### 2. Composition-Based Design
- Components use composition over inheritance
- Reusable UI components in `src/components/ui/`
- Higher-order components for cross-cutting concerns

#### 3. Feature-Based Organization
- Components grouped by domain: `pets/`, `activities/`
- Each feature has its own components, hooks, and types
- Clear separation between business logic and UI

### State Management Architecture

#### Central App State (`useAppState`)
```typescript
interface AppState {
  initialization: InitializationState;
  dialogs: DialogState;
  pets: PetManagementState;
  activities: ActivityNavigationState;
  loading: LoadingState;
}
```

**Key Features:**
- **Reducer Pattern**: Predictable state updates with typed actions
- **Dialog Management**: Centralized control of modals and overlays
- **Loading States**: Granular loading indicators for different operations
- **Pet Focus**: Auto-focus system for newly created pets
- **Activity Navigation**: Timeline and filter state management

#### Data Layer Hooks

**usePets Hook:**
- CRUD operations for pet management
- Tauri command integration
- Local state synchronization
- Error handling and loading states

**useActivities Hook:**
- Activity data fetching and management
- Category-based filtering
- Timeline navigation support

**Photo Management:**
- `usePhotos`: Photo CRUD operations
- `usePhotoCache`: Intelligent photo preloading
- `usePreloadPetPhotos`: Optimized pet photo caching

### Form Architecture

#### React Hook Form Integration
- **Zod Schema Validation**: Runtime type checking with `petFormSchema`
- **Type-Safe Forms**: Full TypeScript integration
- **Error Handling**: Comprehensive validation error display
- **File Upload**: Photo handling with size and type validation

#### Activity Form System
- **Category-Specific Forms**: Specialized forms for different activity types
- **Dynamic Subcategories**: Context-aware subcategory selection
- **Attachment Management**: File upload and preview functionality
- **Form State Persistence**: Draft saving capabilities

### Styling Architecture

#### TailwindCSS Design System
- **Custom Theme**: Brand-specific color palette with pet-themed colors
- **Component Variants**: Class Variance Authority for type-safe styling
- **Responsive Design**: Mobile-first approach with responsive utilities
- **Animation System**: Custom animations for enhanced UX

**Key Design Tokens:**
```javascript
colors: {
  cream: { /* 50-900 scale */ },
  yellow: { /* Brand yellow palette */ },
  blue: { /* Brand blue palette */ },
  paw: { light: '#FEF7CD', dark: '#B68C16' },
  fur: { /* Pet-specific colors */ }
}
```

#### Component Styling Patterns
- **Shadcn/UI Base**: Consistent component styling foundation
- **Variant-Based Components**: Type-safe component variations
- **Utility-First**: TailwindCSS utility classes for styling
- **Custom Animations**: Pet-themed animations (`paw-wiggle`, etc.)

## Integration Architecture

### Tauri Integration Layer

#### Command Interface
```typescript
// Pet Operations
await invoke<Pet[]>('get_pets', { includeArchived });
await invoke<Pet>('create_pet', { petData });
await invoke<Pet>('update_pet', { id, petData });

// Activity Operations
await invoke<Activity[]>('get_activities', filters);
await invoke<Activity>('create_activity', { activityData });

// System Operations
await invoke('initialize_app');
```

#### File System Integration
- **Photo Storage**: Local file system management through Tauri
- **Data Persistence**: SQLite database via Rust backend
- **File Upload**: Native file selection and storage

#### Platform-Specific Features
- **Desktop Optimization**: Fixed window sizing and desktop UX patterns
- **Native Dialogs**: File selection and system dialogs
- **Performance**: Rust backend for data-intensive operations

### Error Handling & Resilience

#### Error Boundaries
- **Component-Level**: Error boundaries for graceful degradation
- **Hook-Level**: Error state management in custom hooks
- **User Feedback**: Consistent error messaging and recovery options

#### Loading States
- **Granular Loading**: Separate loading states for different operations
- **Optimistic Updates**: Immediate UI feedback with rollback capabilities
- **Skeleton Loading**: Progressive loading indicators

## Component Relationships

### Core Application Flow
```
App.tsx (Root Container)
├── PetThumbnailNavigation (Pet Selection)
├── PetForm/PetFormPage (Pet CRUD)
├── ActivityForm (Activity Creation)
├── ActivityTimelinePage (Activity Management)
├── PetManagement (Bulk Pet Operations)
└── Various Dialogs (Confirmations, etc.)
```

### Data Flow Patterns
1. **User Action** → Component Event Handler
2. **Event Handler** → Custom Hook Method
3. **Hook Method** → Tauri Command
4. **Tauri Response** → Hook State Update
5. **State Update** → Component Re-render

### Navigation Architecture
- **Single Page Application**: All views managed through state
- **Dialog-Based**: Modal overlays for forms and management
- **Mobile Responsive**: Adaptive layouts for different screen sizes
- **Deep Linking**: Support for direct navigation to specific pets/activities

## Performance Optimizations

### Image Management
- **Selective Preloading**: Intelligent photo caching strategy
- **Priority Loading**: Load first 3 pet photos immediately
- **Lazy Loading**: Deferred loading for non-critical images
- **Cache Management**: Efficient memory usage for photo storage

### State Optimization
- **Memoized Callbacks**: useCallback for event handlers
- **Selective Updates**: Targeted state updates to minimize re-renders
- **Reducer Pattern**: Predictable state changes with minimal overhead

### Bundle Optimization
- **Tree Shaking**: Unused code elimination
- **Code Splitting**: Dynamic imports for non-critical features
- **Dependency Management**: Minimal dependency footprint

## Testing Strategy

### Unit Testing
- **Component Testing**: React Testing Library for component behavior
- **Hook Testing**: Custom hook testing with React Testing Library
- **Utility Testing**: Pure function testing with Vitest

### Test Structure
```
src/
├── components/
│   └── __tests__/           # Component tests
├── lib/
│   └── __tests__/           # Utility tests
└── test/
    ├── setup.ts             # Test environment setup
    ├── global.d.ts          # Global test types
    └── activity-test-utils.tsx # Test utilities
```

### Testing Patterns
- **Mocking Strategy**: Tauri command mocking for isolated testing
- **User-Centric Testing**: Focus on user interactions over implementation
- **Snapshot Testing**: UI regression prevention

## Development Workflow

### Build Process
1. **Development**: `yarn dev` - Vite dev server with HMR
2. **Type Checking**: `tsc` - TypeScript compilation
3. **Linting**: ESLint for code quality
4. **Testing**: Vitest for unit tests
5. **Building**: `yarn build` for production builds

### Code Quality
- **TypeScript Strict Mode**: Maximum type safety
- **ESLint Rules**: Comprehensive linting configuration
- **Prettier**: Consistent code formatting
- **Pre-commit Hooks**: Quality gates before commits

## Future Refactoring Opportunities

### Architectural Improvements

#### 1. State Management Evolution
- **Consider React Query/SWR**: For server state management and caching
- **Context API**: For deeply nested prop drilling scenarios
- **State Machine**: For complex form workflows and navigation states

#### 2. Component System Enhancements
- **Design System**: Formalize component library with Storybook
- **Compound Components**: More flexible component APIs
- **Render Props Pattern**: For complex data sharing scenarios

#### 3. Performance Optimizations
- **React.memo**: Strategic memoization for expensive components
- **Virtual Scrolling**: For large activity lists
- **Service Worker**: For offline functionality and background sync

#### 4. Developer Experience
- **Hot Module Replacement**: Enhanced development workflow
- **Error Reporting**: Production error tracking and reporting
- **Analytics**: User behavior tracking for UX improvements

### Code Organization Improvements

#### 1. Feature-Based Structure
```
src/
├── features/
│   ├── pets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── activities/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/
└── core/
    ├── store/
    ├── api/
    └── types/
```

#### 2. Service Layer
- **API Abstraction**: Dedicated service layer for Tauri commands
- **Repository Pattern**: Data access layer abstraction
- **Cache Management**: Centralized caching strategy

#### 3. Type System Improvements
- **Branded Types**: Stronger type safety for IDs and specific values
- **Utility Types**: More sophisticated type utilities
- **Runtime Validation**: Enhanced Zod schema integration

## Conclusion

The current frontend architecture provides a solid foundation for the Paw Diary application with clear separation of concerns, type safety, and modern React patterns. The architecture supports the current feature set while providing flexibility for future enhancements and scaling. Key strengths include the centralized state management, comprehensive type system, and integration with the Tauri desktop framework.

The suggested refactoring opportunities focus on enhancing developer experience, improving performance, and preparing for feature expansion while maintaining the current architectural principles.
