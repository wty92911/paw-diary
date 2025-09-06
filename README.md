# 🐾 Paw Diary (刨刨日记)

A modern pet growth tracking application built with Tauri 2.x, combining React/TypeScript frontend with Rust backend. Help pet owners record their pets' growth, health, diet, and daily activities with data visualization and smart insights.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux%20%7C%20iOS%20%7C%20Android-lightgrey.svg)

## ✨ Features

### 🐶 Multi-Pet Management
- **Pet Profiles**: Photos, names, breeds, birth dates, and detailed information
- **Pet Switching**: Intuitive card-based interface for managing multiple pets
- **Context Awareness**: Pet-specific activity tracking and intelligent defaults

### 📝 Modern Activity Recording
- **Block-Based Architecture**: Reusable, composable input blocks for consistent UX
- **Three Interaction Modes**:
  - **Quick Log**: Record activities in ≤3 taps
  - **Guided Flow**: Template-driven recording with smart suggestions
  - **Advanced Edit**: Full customization with rich media support
- **15+ Block Types**: Title, Time, Measurements, Attachments, Location, Weather, Cost, and more

### 📊 Data Visualization & Analytics
- **Growth Tracking**: Weight trends, height measurements, milestone tracking
- **Health Records**: Vaccination schedules, medical history, symptom tracking
- **Diet Analysis**: Portion tracking, brand preferences, feeding patterns
- **Expense Monitoring**: Cost categorization, spending trends, budget insights
- **Activity Timeline**: Chronological view with smart filtering and grouping

### 🎨 Polished User Experience
- **Category Theming**: Color-coded system for Health (red), Growth (blue), Diet (green), Lifestyle (purple), Expense (orange)
- **Smooth Animations**: 60fps transitions powered by Framer Motion
- **Virtualized Performance**: Handle thousands of activities with TanStack Virtual
- **Smart Search**: Full-text search with intelligent filtering
- **Responsive Design**: Mobile-first with cross-platform compatibility

### 🚀 Smart Features
- **Auto-save Drafts**: Background persistence with recovery
- **Intelligent Defaults**: Pet-specific suggestions and remembered preferences
- **Rich Media Support**: Photo/video attachments with preview and management
- **Export & Sharing**: Activity summaries and health reports

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 19+ with TypeScript
- **UI Library**: Shadcn UI components with Radix UI primitives
- **Styling**: TailwindCSS with responsive design system
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion for smooth transitions
- **Virtualization**: TanStack React Virtual for performance
- **Routing**: React Router DOM for navigation
- **State Management**: TanStack Query for server state

### Backend Stack
- **Runtime**: Tauri 2.x with Rust backend
- **Database**: SQLite for local storage (PostgreSQL ready for cloud sync)
- **Search**: Full-text search (FTS) integration
- **API**: Tauri commands for frontend-backend communication
- **Plugins**: System integration with tauri-plugin-opener

### Development Tools
- **Build Tool**: Vite with optimized dev server (port 1420)
- **Package Manager**: Yarn with lock file for consistency
- **Testing**: Vitest with React Testing Library
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Version Control**: Git with pre-commit hooks

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **Rust** (latest stable)
- **Yarn** package manager
- **Platform-specific tools**:
  - macOS: Xcode Command Line Tools
  - Windows: Microsoft Visual Studio C++ Build tools
  - Linux: Build essentials

### Installation

```bash
# Clone the repository
git clone https://github.com/wty92911/paw-diary.git
cd paw-diary

# Install dependencies
yarn install

# Start development server
yarn tauri dev
```

### Development Commands

```bash
# Frontend Development
yarn dev          # Start frontend dev server (port 1420)
yarn build        # Build frontend for production
yarn preview      # Preview production build

# Desktop Application
yarn tauri dev    # Start Tauri development mode
yarn tauri build  # Build desktop application
yarn tauri icon   # Generate app icons

# Mobile Development (iOS)
yarn ios:dev      # Start iOS development mode

# Code Quality
yarn format       # Format code with Prettier
yarn lint         # Run ESLint checks
yarn test         # Run tests with Vitest
yarn test:ui      # Run tests with UI
yarn test:coverage # Generate coverage report
```

## 📁 Project Structure

```
paw-diary/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   │   ├── activities/         # Activity recording system
│   │   │   ├── ActivityCard.tsx       # Timeline activity cards
│   │   │   ├── ActivityTimeline.tsx   # Virtualized timeline
│   │   │   ├── BlockRenderer.tsx      # Block-based renderer
│   │   │   └── blocks/               # Individual block components
│   │   ├── ui/                 # Reusable UI components
│   │   └── layout/             # Layout components
│   ├── lib/                    # Utilities and helpers
│   │   ├── types/              # TypeScript definitions
│   │   ├── ui/                 # UI utilities
│   │   ├── summary/            # Smart fact extraction
│   │   └── utils/              # General utilities
│   ├── App.tsx                 # Root component
│   └── main.tsx               # Application entry point
├── src-tauri/                  # Tauri Rust backend
│   ├── src/
│   │   ├── database/          # Database operations
│   │   ├── lib.rs             # Tauri commands
│   │   └── main.rs            # Application entry point
│   └── tauri.conf.json        # Tauri configuration
├── specs/                      # Product specifications
│   ├── 0001-prd.md           # Product Requirements Document
│   └── 0002-activity-prd.md  # Activity System PRD
└── .spec-workflow/            # Implementation specifications
    └── specs/refactor-activity/
        ├── requirements.md     # Technical requirements
        ├── design.md          # System design
        └── tasks.md           # Implementation tasks
```

## 🎯 Development Milestones

### ✅ M1: Foundation (Completed)
- [x] Basic Tauri + React + TypeScript setup
- [x] Pet management system (CRUD operations)
- [x] Activity recording with block-based architecture
- [x] Modern React patterns with hooks and TypeScript

### ✅ M2: Activity System Refactor (Completed)
- [x] 39 implementation tasks completed across 5 phases
- [x] Block-based activity recording system
- [x] Three interaction modes (Quick Log, Guided Flow, Advanced Edit)
- [x] Virtualized timeline with animations and filtering
- [x] Category theming and visual design system
- [x] Performance optimizations and polish

### 🔄 M3: Data Visualization (Next)
- [ ] Interactive charts for growth, health, and diet trends
- [ ] Statistical insights and pattern recognition
- [ ] Export functionality for reports and summaries
- [ ] Dashboard with key metrics and alerts

### 📅 M4: Cloud Sync & Reminders (Future)
- [ ] User accounts and authentication
- [ ] Multi-device synchronization
- [ ] Smart reminders for vaccinations and health checks
- [ ] Backup and restore functionality

### 🤖 M5: AI Integration (Future)
- [ ] Natural language processing for quick entry
- [ ] Smart health insights and recommendations
- [ ] Automated activity categorization
- [ ] Predictive health monitoring

## 🧪 Testing Strategy

### Unit Testing
- **Framework**: Vitest with jsdom environment
- **Coverage**: Components, utilities, and business logic
- **Patterns**: React Testing Library best practices

### Integration Testing
- **Tauri Commands**: Backend integration testing
- **Database Operations**: SQLite query validation
- **UI Workflows**: End-to-end user journeys

### Performance Testing
- **Timeline Virtualization**: Large dataset handling
- **Animation Performance**: 60fps validation
- **Bundle Size**: Optimization monitoring

## 🔧 Configuration

### Environment Variables
```bash
TAURI_DEV_HOST=0.0.0.0    # Development host for mobile
```

### Key Configuration Files
- **`tauri.conf.json`**: App metadata, permissions, build settings
- **`vite.config.ts`**: Frontend build configuration
- **`tsconfig.json`**: TypeScript compiler options
- **`tailwind.config.js`**: Design system configuration

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m '✨ Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with React and accessibility rules
- **Prettier**: Consistent code formatting
- **Commits**: Conventional commit format with emojis

## 📱 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **macOS** | ✅ Primary | Native app with system integration |
| **Windows** | ✅ Supported | Full feature parity |
| **Linux** | ✅ Supported | AppImage distribution |
| **iOS** | 🚧 Beta | React Native wrapper planned |
| **Android** | 📅 Planned | Future mobile expansion |

## 🌟 Key Features Showcase

### Modern Activity Recording
```typescript
// Block-based architecture example
<ActivityEditor>
  <BlockRenderer 
    blocks={[
      { type: 'title', label: 'Activity Title' },
      { type: 'time', label: 'Date & Time' },
      { type: 'measurement', label: 'Weight', config: { unit: 'kg' } },
      { type: 'notes', label: 'Notes' }
    ]} 
  />
</ActivityEditor>
```

### Smart Timeline with Virtualization
```typescript
// Handle thousands of activities smoothly
const virtualizer = useVirtualizer({
  count: activities.length,
  estimateSize: () => 120,
  overscan: 5
});
```

### Category Theming System
```typescript
// Consistent visual identity
const healthTheme = getCategoryTheme(ActivityCategory.Health);
// Returns: colors, stripe, icon, cssVars for consistent styling
```

## 📊 Performance Metrics

- **Timeline Rendering**: <100ms for 1000+ activities
- **Bundle Size**: <500KB initial, <2MB total
- **Animation Performance**: 60fps on modern devices
- **Database Queries**: <50ms average response time
- **Search Performance**: <200ms full-text search

## 🛡️ Security & Privacy

- **Local-First**: All data stored locally by default
- **No Tracking**: No analytics or user tracking
- **Data Encryption**: Sensitive data protected
- **Open Source**: Transparent and auditable code

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri Team**: For the excellent cross-platform framework
- **Shadcn**: For the beautiful UI component library
- **React Team**: For the robust frontend framework
- **Rust Community**: For the fast and safe backend language

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/wty92911/paw-diary/issues)
- **Discussions**: [GitHub Discussions](https://github.com/wty92911/paw-diary/discussions)
- **Email**: [Support Email](mailto:support@pawdiary.com)

---

<div align="center">

**Made with ❤️ for pet parents everywhere**

*Keep track of every paw print on your pet's journey* 🐾

</div>