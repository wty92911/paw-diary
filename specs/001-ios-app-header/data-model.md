# Data Model: Universal Header Component

**Feature**: Universal Header Component for iOS App  
**Date**: 2025-09-20  
**Phase**: 1 - Design & Contracts  

## Entity Definitions

### 1. HeaderConfiguration

**Purpose**: Main configuration entity that defines header appearance and behavior

```typescript
interface HeaderConfiguration {
  variant: HeaderVariant;
  title?: string;
  showBackButton: boolean;
  backAction?: BackAction;
  sticky: boolean;
  className?: string;
  children?: React.ReactNode;
}

enum HeaderVariant {
  APP = 'app',
  PET_CONTEXT = 'pet-context', 
  FORM = 'form'
}
```

**Validation Rules**:
- `variant` is required and must be one of the defined enum values
- `title` is optional, max 50 characters when provided
- `showBackButton` defaults to true for non-app variants
- `backAction` is required when `showBackButton` is true
- `sticky` defaults to false for form variant, true for others

**Relationships**:
- One-to-one with BackAction when back navigation is enabled
- One-to-one with PetContext when variant is PET_CONTEXT
- One-to-many with HeaderAction for custom actions

### 2. BackAction

**Purpose**: Defines back navigation behavior and appearance

```typescript
interface BackAction {
  type: BackActionType;
  handler?: () => void;
  url?: string;
  label?: string;
  disabled?: boolean;
}

enum BackActionType {
  ROUTER_BACK = 'router-back',
  CUSTOM_HANDLER = 'custom-handler',
  NAVIGATE_TO_URL = 'navigate-to-url'
}
```

**Validation Rules**:
- `type` is required and must be one of the defined enum values
- `handler` is required when type is CUSTOM_HANDLER
- `url` is required when type is NAVIGATE_TO_URL
- `label` defaults to "Back" if not provided, max 20 characters
- `disabled` defaults to false

**State Transitions**:
- disabled: false ↔ true (based on app state)
- type transitions follow navigation context changes

### 3. PetContext

**Purpose**: Pet-specific information displayed in pet context headers

```typescript
interface PetContext {
  pet: Pet;
  breadcrumbs?: BreadcrumbItem[];
  showPetPhoto: boolean;
  photoSize: PetPhotoSize;
  showSpecies: boolean;
}

interface Pet {
  id: number;
  name: string;
  species: string;
  photo_path?: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  active: boolean;
}

enum PetPhotoSize {
  SMALL = 'small',    // 32px
  MEDIUM = 'medium',  // 48px
  LARGE = 'large'     // 64px
}
```

**Validation Rules**:
- `pet` is required and must be a valid Pet entity
- `pet.name` max 30 characters for display purposes
- `breadcrumbs` array max 5 items to prevent overflow
- Only one breadcrumb item can have `active: true`
- `photoSize` defaults to MEDIUM

**Relationships**:
- Many-to-one with Pet entity (existing in app)
- One-to-many with BreadcrumbItem

### 4. HeaderAction

**Purpose**: Custom action buttons displayed in header (future extensibility)

```typescript
interface HeaderAction {
  id: string;
  label: string;
  icon?: React.ComponentType;
  handler: () => void;
  variant: ActionVariant;
  position: ActionPosition;
  disabled?: boolean;
  visible?: boolean;
}

enum ActionVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  GHOST = 'ghost',
  DESTRUCTIVE = 'destructive'
}

enum ActionPosition {
  LEADING = 'leading',
  TRAILING = 'trailing'
}
```

**Validation Rules**:
- `id` is required and must be unique within header
- `label` is required, max 15 characters for mobile compatibility
- `handler` is required and must be a valid function
- `variant` defaults to SECONDARY
- `position` defaults to TRAILING
- `disabled` and `visible` default to false and true respectively

### 5. HeaderTheme

**Purpose**: Theme configuration for consistent styling

```typescript
interface HeaderTheme {
  colorScheme: ColorScheme;
  spacing: SpacingScale;
  typography: TypographyScale;
  elevation: ElevationLevel;
}

enum ColorScheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

interface SpacingScale {
  padding: {
    x: string; // horizontal padding
    y: string; // vertical padding
  };
  gap: string; // gap between elements
}

interface TypographyScale {
  title: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
  subtitle: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
}

enum ElevationLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}
```

**Validation Rules**:
- All theme values must be valid CSS values
- `colorScheme` defaults to AUTO (follows system preference)
- Spacing values must be valid Tailwind spacing tokens
- Typography values must be valid Tailwind font scales
- `elevation` defaults to LOW for subtle shadow

## Entity Relationships

```
HeaderConfiguration
├── BackAction (0..1)
├── PetContext (0..1)
├── HeaderAction[] (0..n)
└── HeaderTheme (1)

PetContext
├── Pet (1)
└── BreadcrumbItem[] (0..5)

HeaderTheme
├── ColorScheme (1)
├── SpacingScale (1)
├── TypographyScale (1)
└── ElevationLevel (1)
```

## State Management

### HeaderProvider Context

```typescript
interface HeaderContextState {
  configuration: HeaderConfiguration;
  theme: HeaderTheme;
  isLoading: boolean;
  error: string | null;
}

type HeaderAction = 
  | { type: 'SET_CONFIGURATION'; payload: HeaderConfiguration }
  | { type: 'SET_THEME'; payload: HeaderTheme }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };
```

### State Transitions

```
IDLE → LOADING (configuration change)
LOADING → CONFIGURED (successful configuration)
LOADING → ERROR (configuration failure)
ERROR → LOADING (retry configuration)
CONFIGURED → LOADING (theme change)
ANY → IDLE (reset)
```

## Validation Schema

All entities include runtime validation using Zod schemas:

```typescript
const HeaderConfigurationSchema = z.object({
  variant: z.nativeEnum(HeaderVariant),
  title: z.string().max(50).optional(),
  showBackButton: z.boolean(),
  backAction: BackActionSchema.optional(),
  sticky: z.boolean(),
  className: z.string().optional(),
});

const PetContextSchema = z.object({
  pet: PetSchema,
  breadcrumbs: z.array(BreadcrumbItemSchema).max(5).optional(),
  showPetPhoto: z.boolean(),
  photoSize: z.nativeEnum(PetPhotoSize),
  showSpecies: z.boolean(),
});
```

## Performance Considerations

- Entity objects are memoized to prevent unnecessary re-renders
- Pet photo loading is lazy with placeholder fallbacks
- Breadcrumb calculations are cached based on route params
- Theme changes trigger batched updates to minimize layout thrash
- Configuration validation runs only on prop changes, not on every render