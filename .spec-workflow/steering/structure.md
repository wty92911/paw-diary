# Project Structure Steering Document

# Paw Diary File Organization & Conventions

## Directory Structure

### Root Level Organization

```
paw-diary/
├── .claude/                    # Claude Code configuration
│   ├── specs/                  # Feature specifications
│   ├── steering/               # Steering documents (this file)
│   └── templates/              # Spec templates
├── src/                        # Frontend React application
├── src-tauri/                  # Tauri Rust backend
├── public/                     # Static frontend assets
├── dist/                       # Frontend build output (generated)
├── specs/                      # Product and epic documentation
├── fixtures/                   # Test data and sample files
├── scripts/                    # Development and build scripts
└── [config files]             # package.json, vite.config.ts, etc.
```

### Frontend Structure (`src/`)

```
src/
├── components/                 # React components
│   ├── ui/                     # Base UI components (Shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── [other-ui-components].tsx
│   └── pets/                   # Pet-specific feature components
│       ├── PetCard.tsx         # Individual pet display card
│       ├── PetCardList.tsx     # Pet navigation carousel
│       ├── PetDetailView.tsx   # Detailed pet information
│       ├── PetForm.tsx         # Pet creation/editing form
│       └── PetManagement.tsx   # Bulk pet operations
├── hooks/                      # Custom React hooks
│   ├── usePets.ts             # Pet data management hook
│   ├── usePhotos.ts           # Photo handling hook
│   └── [other-hooks].ts
├── lib/                        # Shared utilities and types
│   ├── types.ts               # TypeScript type definitions
│   └── utils.ts               # Utility functions (cn, formatters, etc.)
├── assets/                     # Static assets
│   └── [images, icons]
├── styles/                     # Global styles
│   └── globals.css            # Global CSS and variables
├── App.tsx                     # Root application component
├── main.tsx                    # React application entry point
└── vite-env.d.ts              # Vite type definitions
```

### Backend Structure (`src-tauri/`)

```
src-tauri/
├── src/
│   ├── main.rs                # Application entry point
│   ├── lib.rs                 # Library exports and Tauri setup
│   ├── commands.rs            # Tauri command definitions
│   ├── database.rs            # Database models and operations
│   ├── photo.rs               # Photo handling and storage
│   └── errors.rs              # Error types and handling
├── migrations/                # Database schema migrations
│   └── [timestamp]_[description].sql
├── capabilities/              # Tauri security capabilities
├── icons/                     # Application icons for different platforms
├── gen/                       # Generated platform-specific code
├── Cargo.toml                 # Rust dependencies and configuration
├── tauri.conf.json           # Tauri application configuration
└── build.rs                   # Rust build script
```

## Naming Conventions

### Files and Directories

- **Components**: PascalCase for React components (`PetCard.tsx`, `PetForm.tsx`)
- **Hooks**: camelCase starting with `use` (`usePets.ts`, `usePhotos.ts`)
- **Utilities**: camelCase for functions and files (`utils.ts`, `types.ts`)
- **Directories**: kebab-case for multi-word directories (`src-tauri`)
- **Feature Directories**: Use noun-based names (`pets/`, `activities/`, `analytics/`)

### Code Naming Standards

#### TypeScript/React

```typescript
// Interfaces: PascalCase with descriptive names
interface Pet {
  id: number;
  name: string;
}

// Components: PascalCase, descriptive, avoid abbreviations
export function PetDetailView({ pet }: PetDetailViewProps) {}

// Hooks: camelCase starting with "use"
export function usePets() {}
export function usePhotoUpload() {}

// Functions: camelCase, verb-based
function calculateAge(birthDate: string): string {}
function formatCurrency(amount: number): string {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_FORMATS = ['jpeg', 'png', 'webp'];
```

#### Rust Backend

```rust
// Structs: PascalCase
pub struct Pet {
    pub id: i64,
    pub name: String,
}

// Functions: snake_case
pub async fn create_pet(pet_data: PetCreateRequest) -> Result<Pet, PetError> { }
pub fn calculate_age(birth_date: NaiveDate) -> String { }

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE: usize = 10_485_760;
const DB_CONNECTION_TIMEOUT: u64 = 30;

// Enums: PascalCase for enum and variants
pub enum PetSpecies {
    Cat,
    Dog,
}
```

## Feature Organization Pattern

### Component Architecture

Each major feature should follow this structure:

```
components/[feature]/
├── [Feature]Card.tsx          # Display component
├── [Feature]Form.tsx          # Create/edit form
├── [Feature]List.tsx          # Collection display
├── [Feature]DetailView.tsx    # Detailed view
├── [Feature]Management.tsx    # Bulk operations
└── types.ts                   # Feature-specific types (if needed)
```

### Hook Organization

```
hooks/
├── use[Feature].ts            # Main data hook
├── use[Feature]Form.ts        # Form-specific hook
├── use[Feature]Upload.ts      # Upload-specific hook
└── use[Feature]Mutations.ts   # Mutation operations
```

## Code Organization Standards

### Import Order

```typescript
// 1. React and external libraries
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal utilities and types
import { Pet, PetFormData } from '../../lib/types';
import { cn, calculateAge } from '../../lib/utils';

// 3. Components (UI first, then feature-specific)
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { PetCard } from './PetCard';

// 4. Hooks
import { usePets } from '../../hooks/usePets';
```

### Component Structure Template

```typescript
// Component props interface
interface PetCardProps {
  pet: Pet;
  isActive: boolean;
  onClick: () => void;
  onEdit?: () => void;
}

// Component implementation
export function PetCard({
  pet,
  isActive,
  onClick,
  onEdit
}: PetCardProps) {
  // 1. Hooks
  const [isLoading, setIsLoading] = useState(false);

  // 2. Computed values
  const age = calculateAge(pet.birth_date);

  // 3. Event handlers
  const handleClick = () => {
    onClick();
  };

  // 4. Effects (if any)
  useEffect(() => {
    // Side effects
  }, []);

  // 5. Render
  return (
    <Card className={cn("pet-card", isActive && "active")}>
      {/* Component JSX */}
    </Card>
  );
}
```

## Database Organization

### Migration Naming

```
migrations/
├── 20250827151006_create_pets_table.sql
├── 20250828143022_add_activities_table.sql
├── 20250829091234_add_photo_metadata.sql
└── 20250830154501_create_reminders_table.sql
```

### Migration Format

```sql
-- Up migration
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('health', 'growth', 'diet', 'lifestyle', 'expense')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    metadata JSON, -- Store type-specific data
    photo_paths TEXT, -- JSON array of photo filenames
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE
);

CREATE INDEX idx_activities_pet_date ON activities (pet_id, date DESC);
CREATE INDEX idx_activities_type ON activities (activity_type);
```

## Testing Organization

### Test File Placement

- **Frontend**: `src/components/pets/__tests__/PetCard.test.tsx`
- **Hooks**: `src/hooks/__tests__/usePets.test.ts`
- **Backend**: `src-tauri/src/commands.rs` (inline tests with `#[cfg(test)]`)

### Test Naming

```typescript
// Test suites: describe the component/function being tested
describe('PetCard', () => {
  // Test cases: describe the behavior being tested
  it('should display pet name and age', () => {});
  it('should call onClick when card is clicked', () => {});
  it('should show active state when isActive is true', () => {});
});
```

## Documentation Standards

### Code Documentation

```typescript
/**
 * Calculates the age of a pet based on birth date
 * @param birthDate - ISO date string (YYYY-MM-DD)
 * @returns Human-readable age string (e.g., "2 years, 3 months")
 */
export function calculateAge(birthDate: string): string {
  // Implementation...
}
```

### Component Documentation

```typescript
/**
 * PetCard displays a pet's basic information in a card layout
 *
 * Features:
 * - Shows pet photo, name, age, and species
 * - Supports active/inactive visual states
 * - Handles click interactions for selection
 * - Optional edit functionality
 *
 * @example
 * <PetCard
 *   pet={selectedPet}
 *   isActive={true}
 *   onClick={() => selectPet(pet.id)}
 *   onEdit={() => openEditForm(pet)}
 * />
 */
export function PetCard({ pet, isActive, onClick, onEdit }: PetCardProps) {
  // Component implementation...
}
```

## Configuration File Organization

### Root Level Config Files

```
├── package.json              # Frontend dependencies and scripts
├── yarn.lock                # Dependency lock file
├── tsconfig.json            # TypeScript compiler configuration
├── tsconfig.node.json       # TypeScript config for Node.js tools
├── vite.config.ts           # Vite build configuration
├── tailwind.config.js       # TailwindCSS configuration
├── postcss.config.js        # PostCSS configuration
└── .gitignore               # Git ignore rules
```

### Tauri Configuration

- **tauri.conf.json**: Main Tauri application configuration
- **Cargo.toml**: Rust dependencies and package metadata
- **build.rs**: Custom build script for Rust compilation

## Asset Organization

### Static Assets

```
public/
├── icons/                   # App icons and favicons
├── images/                  # Static images
└── fonts/                   # Custom fonts (if any)
```

### Generated Assets

```
src/assets/
├── react.svg               # Framework logos and brand assets
└── [other-assets]
```

## Git Organization

### Branch Naming

- **Features**: `feature/pet-activity-recording`
- **Bug Fixes**: `bugfix/photo-upload-validation`
- **Documentation**: `docs/api-documentation`
- **Refactoring**: `refactor/database-layer`

### Commit Message Format

```
feat(pets): add photo upload to pet creation form

- Add drag-and-drop photo upload component
- Implement image validation and resizing
- Update pet form to handle photo data
- Add photo preview functionality

Closes #123
```

## Future Structure Considerations

### Planned Feature Additions

```
components/
├── activities/             # Activity recording components
├── analytics/             # Data visualization components
├── reminders/             # Reminder and notification components
└── settings/              # Application settings

hooks/
├── useActivities.ts       # Activity data management
├── useAnalytics.ts        # Chart data and statistics
└── useReminders.ts        # Reminder system hooks
```

### Scalability Patterns

- **Lazy Loading**: Components organized for code splitting
- **Feature Flags**: Structure supports feature toggle implementation
- **Plugin Architecture**: Component design allows for future plugin system
- **Internationalization**: File structure ready for i18n implementation
