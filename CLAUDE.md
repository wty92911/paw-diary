# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Paw Diary (刨刨日记)** is a pet growth tracking application built with Tauri 2.x, combining React/TypeScript frontend with Rust backend. The app helps pet owners record their pets' growth, health, diet, and daily activities with data visualization and smart insights.

## Architecture

### Frontend (React + TypeScript + Vite)

- **Entry Point**: `src/main.tsx` - React app initialization
- **Main App**: `src/App.tsx` - Root component with basic Tauri integration demo
- **Build Tool**: Vite with React plugin and Tauri-specific configurations
- **Port**: Development server runs on port 1420 (fixed for Tauri)

### Backend (Rust + Tauri 2.x)

- **Entry Point**: `src-tauri/src/main.rs` - Launches the Tauri application
- **Library**: `src-tauri/src/lib.rs` - Contains Tauri commands and application logic
- **Current Commands**: `greet` - Basic demo command that formats a greeting message
- **Plugins**: `tauri-plugin-opener` for system operations

### Configuration Files

- **Tauri Config**: `src-tauri/tauri.conf.json` - App metadata, build settings, window config
- **Cargo Config**: `src-tauri/Cargo.toml` - Rust dependencies and build configuration
- **Frontend Config**: `vite.config.ts`, `tsconfig.json` - Vite and TypeScript configurations

## Development Commands

### Frontend Development

```bash
# Start frontend dev server (port 1420)
yarn dev

# Build frontend for production
yarn build

# Preview production build
yarn preview
```

### Tauri Development

```bash
# Start Tauri development mode (auto-launches frontend)
yarn tauri dev

# Build desktop application
yarn tauri build

# Generate Tauri icons
yarn tauri icon [path-to-icon]
```

### Package Management

- **Package Manager**: Yarn (lock file: `yarn.lock`)
- **Install Dependencies**: `yarn install`

## Project-Specific Implementation Guidelines

### Product Requirements (PRD)

The PRD located in `specs/0001-prd.md` outlines the complete product vision:

**Core Features to Implement:**

1. **Pet Management**: Multi-pet profiles with photos, basic info, and switching interface
2. **Activity Recording**: Structured logging for health, growth, diet, lifestyle, and expenses
3. **Data Visualization**: Weight trends, diet analysis, health records, expense tracking
4. **Timeline View**: Chronological activity display with category filtering

**Technical Stack Specified:**

- Frontend: React, TypeScript, TailwindCSS, Shadcn UI
- Backend: Rust (Axum framework planned)
- Database: SQLite (local), PostgreSQL (future cloud sync)
- Storage: Local file system, AWS S3/OSS (future)

### Development Milestones

- **M1 (Current)**: Basic framework - pet management and activity recording
- **M2**: Data visualization with charts and statistics
- **M3**: Cloud sync and reminder system
- **M4**: AI integration for natural language processing

### Code Organization Patterns

- Tauri commands should be defined in `src-tauri/src/lib.rs`
- Frontend components will use modern React patterns (hooks, functional components)
- Database operations should be handled in Rust backend
- Cross-platform considerations for desktop app deployment

### Universal Header Component System

The app uses a unified header component system for consistent navigation across all screens:

**Component Structure:**
- `src/components/header/` - Universal header component system
- Variants: AppHeader (home), PetContextHeader (pet pages), FormHeader (forms)
- Supports iOS HIG patterns, responsive design, and accessibility compliance

**Usage Patterns:**
- Replace existing custom headers with unified components
- Configure via HeaderConfiguration interface with type safety
- Use HeaderProvider context for state management across routes
- Follow contracts in `specs/001-ios-app-header/contracts/` for implementation

**Migration Status:**
- ✅ Specification and contracts complete
- 🔄 Implementation in progress (see `specs/001-ios-app-header/`)
- 📋 Planned pages: HomePage, AddPetPage, PetProfilePage, ActivitiesListPage

### UI/UX Guidelines

- Visual style: Warm, fresh, with pet-themed elements (paw prints, diary aesthetics)
- Color scheme: Cream white, light yellow, light blue
- Interaction: Intuitive 3-step activity recording, card-based pet switching

## Database Schema Planning

The app will need tables for:

- `pets` - Pet profiles and basic information
- `activities` - Timeline entries with categories (health, growth, diet, lifestyle, expenses)
- `attachments` - Photos and videos linked to activities
- `reminders` - Vaccination and health check schedules (future)
