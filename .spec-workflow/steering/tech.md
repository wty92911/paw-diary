# Technology Steering Document

# Paw Diary Technical Architecture & Standards

## Core Architecture

### Application Framework

- **Platform**: Tauri 2.x - Cross-platform desktop apps with web frontends
- **Frontend**: React 19+ with TypeScript for type safety and modern development
- **Backend**: Rust for performance, safety, and cross-platform compatibility
- **Build System**: Vite for frontend, Cargo for Rust backend

### Technology Stack

#### Frontend Technologies

```json
{
  "framework": "React 19+",
  "language": "TypeScript ~5.8",
  "bundler": "Vite ^7.0",
  "styling": "TailwindCSS ^3.4",
  "components": "Shadcn/ui with Radix UI primitives",
  "icons": "Lucide React ^0.312",
  "forms": "React Hook Form ^7.48 + Zod ^3.22",
  "state": "@tanstack/react-query ^5.17",
  "dragdrop": "react-beautiful-dnd ^13.1"
}
```

#### Backend Technologies

```toml
[dependencies]
tauri = "2"
tauri-plugin-opener = "2"
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "sqlite", "chrono", "migrate"] }
chrono = { version = "0.4", features = ["serde"] }
image = "0.25"  # Photo processing and optimization
serde = { version = "1", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }
uuid = { version = "1.10", features = ["v4"] }
thiserror = "1.0"
anyhow = "1.0"
```

## Database Architecture

### Primary Database: SQLite

- **Local Storage**: All user data stored locally in SQLite database
- **Migrations**: SQLx migrations for schema evolution
- **Location**: App data directory (`~/AppData/Roaming/paw-diary/pets.db` on Windows, `~/Library/Application Support/paw-diary/pets.db` on macOS)
- **Backup Strategy**: Regular automated backups to user-chosen locations

### Schema Design Principles

```sql
-- Example: pets table (existing)
CREATE TABLE pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    species VARCHAR(20) NOT NULL CHECK (species IN ('Cat', 'Dog')),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Unknown')),
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

#### Schema Standards

- **Primary Keys**: Always use `INTEGER PRIMARY KEY AUTOINCREMENT`
- **Timestamps**: Include `created_at` and `updated_at` in all data tables
- **Soft Deletes**: Use `is_archived` boolean for non-destructive removal
- **Constraints**: Use CHECK constraints for enum-like values
- **Indexing**: Index frequently queried columns (pet_id, date columns, display_order)

## File Storage Architecture

### Photo Storage

- **Location**: App data directory + `/photos/` subdirectory
- **Format**: Store in original format, generate thumbnails as needed
- **Naming**: UUID-based filenames to avoid conflicts
- **Optimization**: Rust `image` crate for resizing and format conversion
- **Limits**: 10MB max file size, common formats (JPEG, PNG, WebP, BMP, TIFF)

### Directory Structure

```
~/AppData/Roaming/paw-diary/  (Windows)
~/Library/Application Support/paw-diary/  (macOS)
~/.local/share/paw-diary/  (Linux)
├── pets.db                 # SQLite database
├── photos/                 # Pet photos
│   ├── thumbnails/         # Generated thumbnails
│   └── originals/          # Original uploaded photos
├── backups/                # Automatic database backups
└── logs/                   # Application logs
```

## API Architecture (Tauri Commands)

### Command Naming Convention

- **Verb + Noun**: `create_pet`, `get_pets`, `update_pet`, `delete_pet`
- **Async Functions**: All Tauri commands should be async
- **Error Handling**: Return `Result<T, PetError>` for all operations
- **Validation**: Validate input at command boundary

### Error Handling Standards

```rust
#[derive(Debug, thiserror::Error)]
pub enum PetError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("File system error: {message}")]
    FileSystem { message: String },

    #[error("Validation error: {field} - {message}")]
    Validation { field: String, message: String },

    #[error("Not found: {resource} with id {id}")]
    NotFound { resource: String, id: String },
}
```

## Frontend Architecture Standards

### Component Organization

```
src/
├── components/
│   ├── ui/                 # Shadcn/ui base components
│   └── pets/               # Feature-specific components
│       ├── PetCard.tsx
│       ├── PetForm.tsx
│       └── PetManagement.tsx
├── hooks/                  # Custom React hooks
│   ├── usePets.ts
│   └── usePhotos.ts
├── lib/
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions
└── styles/
    └── globals.css        # Global styles and CSS variables
```

### TypeScript Standards

- **Strict Mode**: Enable all strict type checking options
- **Interface over Type**: Prefer interfaces for object shapes
- **Zod Schemas**: Use Zod for runtime validation and type inference
- **Generic Constraints**: Use proper generic constraints for reusable components

### State Management Patterns

- **Server State**: React Query for all server state management
- **Local State**: React useState and useReducer for component state
- **Form State**: React Hook Form for all form handling
- **Global State**: React Context only when necessary (avoid prop drilling)

## Design System Implementation

### TailwindCSS Configuration

- **Custom Colors**: Pet-themed color palette with cream, yellow, blue variants
- **Brand Spacing**: Consistent spacing scale for pet cards and components
- **Custom Animations**: Paw-themed animations (wiggle, bounce-soft, pulse-slow)
- **Component Variants**: Defined variants for buttons, cards, and pet-specific elements

### Design Tokens

```css
:root {
  /* Brand Colors */
  --cream-100: #fef9f3;
  --yellow-100: #fef7cd;
  --blue-100: #e0f2fe;

  /* Pet Card Dimensions */
  --pet-card-width: 16rem;
  --pet-card-height: 20rem;

  /* Brand Shadows */
  --pet-card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --warm-glow: 0 4px 14px 0 rgba(251, 233, 123, 0.15);
}
```

## Performance Standards

### Frontend Performance

- **Bundle Size**: Keep initial bundle < 500KB gzipped
- **Loading Time**: First meaningful paint < 1 second
- **Runtime Performance**: 60fps animations, < 100ms interaction response
- **Memory Usage**: < 100MB RAM for typical usage

### Backend Performance

- **Database Queries**: < 100ms for typical operations
- **Photo Processing**: < 2 seconds for image optimization
- **Startup Time**: < 3 seconds cold start
- **File Operations**: Async I/O for all file system operations

## Security Standards

### Data Protection

- **Local-First**: All sensitive data stored locally by default
- **File Permissions**: Restrict database and photo access to user only
- **Input Validation**: Validate all user inputs at multiple layers
- **SQL Injection**: Use parameterized queries exclusively

### Photo Security

- **File Type Validation**: Strict MIME type checking for uploads
- **Size Limits**: 10MB maximum file size to prevent DoS
- **Path Traversal**: UUID-based filenames prevent directory traversal
- **Metadata Stripping**: Remove EXIF data for privacy (future enhancement)

## Development Standards

### Code Quality

- **Linting**: ESLint for TypeScript, Clippy for Rust
- **Formatting**: Prettier for frontend, rustfmt for backend
- **Testing**: Jest + React Testing Library for frontend, standard Rust testing for backend
- **Coverage**: Maintain >80% code coverage for critical paths

### Git Workflow

- **Branch Naming**: `feature/pet-management`, `bugfix/photo-upload-error`
- **Commit Messages**: Conventional commits format
- **PR Requirements**: All changes require code review
- **Testing**: All PRs must pass automated tests

### Documentation Standards

- **Code Comments**: Document complex business logic and algorithms
- **API Documentation**: Document all Tauri commands with examples
- **README Updates**: Keep installation and development instructions current
- **Architecture Decisions**: Document major technical decisions in ADRs

## Build and Deployment

### Development Environment

- **Node.js**: Latest LTS version (20+)
- **Rust**: Latest stable release (1.70+)
- **Package Manager**: Yarn for frontend dependencies
- **IDE Setup**: VS Code with Tauri, Rust-Analyzer, and TypeScript extensions

### Build Configuration

- **Development**: Hot reload for frontend, auto-restart for backend changes
- **Production**: Optimized bundles, compressed assets, signed executables
- **Testing**: Separate build pipeline with test databases and mock services
- **Cross-Platform**: Automated builds for Windows, macOS, and Linux

### Release Strategy

- **Versioning**: Semantic versioning (MAJOR.MINOR.PATCH)
- **Channels**: Alpha, Beta, Stable release channels
- **Auto-Updates**: Tauri updater for seamless application updates
- **Rollback**: Ability to rollback to previous version if issues detected

## Future Technical Considerations

### Scalability Preparations

- **Database Migration**: Architecture ready for PostgreSQL migration
- **Multi-User**: Database schema supports future user accounts
- **Cloud Sync**: API design compatible with future cloud services
- **Plugin System**: Component architecture allows for future plugins

### Technology Evolution

- **React**: Stay current with React releases and new features
- **Tauri**: Upgrade to new Tauri versions for improved capabilities
- **Rust**: Leverage new Rust language features as they stabilize
- **Web Standards**: Adopt new web APIs that enhance desktop app capabilities
