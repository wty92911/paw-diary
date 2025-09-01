# Product Steering Document

# Paw Diary (刨刨日记 Pawdiary)

## Product Vision

**Mission**: Provide pet owners with a lightweight, warm, and structured application for recording their pets' complete life journey, transforming scattered photos and notes into meaningful visual data and insights.

**Slogan**: "记录每一爪的温馨时光" (Recording every paw's warm moments)

## Target Market

### Primary Users

- Pet owners with 1 or multiple pets (initially cats and dogs)
- Users who currently use scattered methods (photos, notes, chat logs) for pet tracking
- Pet enthusiasts seeking structured growth and health tracking

### User Personas

1. **Multi-Pet Parent**: Manages 2-5 pets, needs organized switching and comparison
2. **Health-Conscious Owner**: Focuses on medical records, weight tracking, vaccination schedules
3. **Memory Keeper**: Values timeline and photo documentation of pet's life journey
4. **Data-Driven Pet Owner**: Wants insights from feeding, expenses, and growth trends

## Core Value Propositions

1. **Multi-Pet Management**: Seamless switching between pet profiles with structured data
2. **Structured Recording**: Transform daily observations into categorized, searchable records
3. **Visual Timeline**: Complete chronological view of pet's life with rich media
4. **Data Insights**: Automated charts and trends for weight, diet, expenses, health
5. **Warm Experience**: Diary-like interface with pet-themed, emotional design
6. **Local Privacy**: All data stored locally with optional cloud sync

## Key Features by Milestone

### M1: Foundation Framework (Current)

- **Pet Management**: Complete pet profiles with photos, basic info, multi-pet switching
- **Activity Recording**: Structured logging for health, growth, diet, lifestyle, expenses
- **Timeline View**: Chronological activity display with category filtering
- **Basic UI**: Warm, card-based interface with paw print branding elements

### M2: Data Visualization (Next)

- **Weight Trends**: Line charts showing growth patterns over time
- **Diet Analysis**: Brand/flavor statistics and intake trend visualization
- **Health Records**: Vaccination schedules and medical history timeline
- **Expense Analytics**: Category breakdown and monthly/yearly spending curves

### M3: Cloud Sync & Reminders (Future)

- **Account System**: Email/phone registration and login
- **Multi-Device Sync**: Data synchronization across devices
- **Smart Reminders**: Vaccination, checkup, and feeding notifications

### M4: AI Assistance (Future)

- **Natural Language Processing**: "今天吃了30g皇家猫粮" → structured diet record
- **Health Insights**: Automated analysis of weight changes and health patterns
- **Personalized Reports**: Custom diet and expense recommendations

## Success Metrics

### User Experience

- **Ease of Use**: Complete activity recording in ≤3 steps
- **Performance**: Data display and charts render in <1 second
- **Engagement**: Daily active recording by 70% of users
- **Retention**: 80% monthly active user retention

### Technical Performance

- **Speed**: Pet switching experience <500ms on desktop
- **Reliability**: 99.9% data integrity, zero data loss
- **Storage**: Efficient local photo storage with compression
- **Cross-Platform**: Consistent experience across all supported platforms

## Platform Strategy

### Primary Platform: Desktop (Tauri)

- **macOS**: Native Apple ecosystem integration
- **Windows**: Broad user base coverage
- **Linux**: Developer and enthusiast users

### Future Expansion

- **iOS**: Primary mobile target with native app experience
- **Android**: Secondary mobile platform
- **Web**: Browser-based access for universal compatibility

## Design Philosophy

### Visual Identity

- **Color Palette**: Cream white (#FEF9F3), Light yellow (#FEF7CD), Light blue (#E0F2FE)
- **Brand Elements**: Paw prints, diary aesthetic, warm rounded corners
- **Typography**: Clean, readable fonts (Inter, Poppins) with proper hierarchy
- **Photography**: Consistent pet photo treatment with warm filters

### User Experience Principles

1. **Warmth Over Efficiency**: Prioritize emotional connection over pure productivity
2. **Simplicity First**: Hide complexity behind intuitive, progressive disclosure
3. **Pet-Centric Design**: Every interaction should feel like caring for the pet
4. **Memory Preservation**: Design for long-term sentimental value
5. **Gentle Reminders**: Helpful without being intrusive or demanding

## Product Constraints

### Technical Limitations

- **Local-First**: Primary data storage must be local for privacy
- **Cross-Platform**: Single codebase must work across all target platforms
- **Performance**: Must work smoothly on older hardware (5+ year old computers)
- **Offline-First**: Core functionality must work without internet connection

### User Experience Requirements

- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Data Export**: Users must be able to export their complete data
- **Privacy**: No telemetry or tracking without explicit user consent
- **Localization**: Support for both English and Chinese languages

## Competitive Positioning

### Direct Competitors

- Pet tracking mobile apps (PetDesk, Pet First Aid, 11Pets)
- Generic diary and note-taking applications
- Veterinary clinic software with limited home use

### Unique Differentiators

1. **Desktop-First Experience**: Optimized for detailed data entry and visualization
2. **Warm, Emotional Design**: Diary aesthetic vs. clinical/medical interfaces
3. **Local Privacy**: Complete data ownership vs. cloud-dependent services
4. **Multi-Pet Focus**: Purpose-built for households with multiple pets
5. **Visual Timeline**: Rich multimedia timeline vs. simple record lists

## Future Vision (2+ Years)

### Advanced Features

- **AI Health Monitoring**: Automated health alerts from photo analysis
- **Community Features**: Safe sharing of pet milestones with other pet parents
- **Veterinarian Integration**: Direct sharing of health records with vets
- **Insurance Integration**: Automated expense reporting to pet insurance
- **Breeding Records**: Advanced tracking for breeders and show animals

### Platform Expansion

- **Smart Device Integration**: Automatic weight tracking, activity monitors
- **Voice Recording**: Audio diary entries with transcription
- **Wearable Integration**: Health data from pet fitness trackers
- **IoT Integration**: Automatic feeding, litter box usage tracking
