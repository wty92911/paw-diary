# Activity System Overview

This document provides a comprehensive overview of how the refactored activity recording system works in Paw Diary, including component relationships, user flows, and technical architecture.

## System Architecture

The activity system follows a **block-based composable architecture** that replaced the previous "one giant form per category" approach. This enables flexible, scalable activity recording with three distinct interaction modes.

### Core Design Principles

1. **Progressive Disclosure**: Start simple, reveal complexity as needed
2. **Template-Driven**: Activity structure defined by reusable templates
3. **Block Composition**: Activities built from composable, reusable blocks
4. **Pet-Context Aware**: All activities tied to specific pets
5. **Mode Flexibility**: Three interaction modes for different use cases

## Component Architecture

```
ActivityEditor (Main Orchestrator)
├── CategoryPicker (Initial Selection)
├── QuickLogSheet (≤3 Interactions)
├── GuidedFlowWizard (Step-by-Step)
└── AdvancedEditTabs (Full Editor)
    ├── Summary Tab
    ├── Details Tab  
    ├── Attachments Tab
    ├── Reminders Tab
    ├── Costs Tab
    └── History Tab

Block System
├── BlockRenderer (Multi-block orchestrator)
├── Field (Common wrapper)
├── FormContext (Shared state)
└── Individual Blocks
    ├── TitleBlock
    ├── TimeBlock
    ├── NotesBlock
    ├── MeasurementBlock
    ├── SubcategoryBlock
    └── ... (16+ block types)
```

## User Journey & Component Flow

### 1. Activity Initiation
**Component**: `CategoryPicker`

When users want to record an activity, they start with the CategoryPicker component which provides:

- **Recent Templates**: Shows 6 most-used activity templates for the current pet
- **5-Category Selector**: Health, Growth, Diet, Lifestyle, Expense
- **Template Browser**: All available templates organized by category
- **Smart Defaults**: Templates ranked by usage frequency

```typescript
// Usage in app
<CategoryPicker
  petId={currentPet.id}
  onCategoryChange={setSelectedCategory}
  onTemplateSelect={handleTemplateSelection}
/>
```

### 2. Mode Selection & Recording

Based on user choice and template configuration, the system routes to one of three modes:

#### Quick Log Mode
**Component**: `QuickLogSheet`
**Target**: ≤3 interactions to save
**Use Case**: Frequent, routine activities

- Bottom sheet interface
- Maximum 2 blocks displayed
- Interaction counter to ensure ≤3 taps
- Immediate save on completion
- Perfect for: daily meals, walks, medications

```typescript
<QuickLogSheet
  isOpen={showQuickLog}
  templateId={selectedTemplate}
  petId={currentPet.id}
  onSave={handleQuickSave}
  onUpgrade={() => setMode('guided')} // Upgrade to guided flow
/>
```

#### Guided Flow Mode
**Component**: `GuidedFlowWizard`
**Target**: Template-driven step-by-step recording
**Use Case**: Structured activities with multiple data points

- Wizard interface with progress indicator
- 2-4 blocks per step
- Step validation before proceeding
- Template-specific flow
- Perfect for: vet visits, grooming, training sessions

```typescript
<GuidedFlowWizard
  isOpen={showGuidedFlow}
  templateId={selectedTemplate}
  petId={currentPet.id}
  onSave={handleGuidedSave}
  onClose={closeGuidedFlow}
/>
```

#### Advanced Edit Mode
**Component**: `AdvancedEditTabs`
**Target**: Comprehensive editing with all features
**Use Case**: Detailed recording, editing existing activities

- Tabbed interface with 6 categories
- All blocks available based on template
- Full editing capabilities
- Perfect for: detailed health records, expense tracking, comprehensive logging

```typescript
<AdvancedEditTabs
  isOpen={showAdvancedEdit}
  templateId={selectedTemplate}
  petId={currentPet.id}
  activityId={editingActivity?.id} // For editing existing
  onSave={handleAdvancedSave}
/>
```

## Block System Deep Dive

### Block Types & Usage

The system supports 16+ block types, each handling specific data types:

| Block Type | Purpose | Example Usage |
|------------|---------|---------------|
| `title` | Activity name | "Morning Walk", "Vet Checkup" |
| `notes` | Free text description | Detailed observations |
| `time` | Date/time selection | When activity occurred |
| `measurement` | Numeric values | Weight: 15.2 kg |
| `rating` | 1-5 star ratings | Energy level, mood |
| `portion` | Food quantities | 1 cup dry food |
| `subcategory` | Activity classification | "Breakfast" for Diet |
| `location` | Where it happened | "Central Park" |
| `cost` | Financial tracking | $45.00 vet visit |
| `attachment` | Photos/videos | Progress photos |
| `reminder` | Future notifications | Next vaccination |
| `checklist` | Task completion | Pre-surgery checklist |

### Block Composition in Templates

Templates define which blocks appear for each activity type:

```typescript
// Example: Vet Visit Template
{
  id: 'health.vet_visit',
  category: ActivityCategory.Health,
  label: 'Vet Visit',
  blocks: [
    { type: 'title', required: true },
    { type: 'time', required: true },
    { type: 'notes', required: false },
    { type: 'cost', required: false },
    { type: 'reminder', required: false }, // Next appointment
    { type: 'attachment', required: false } // Medical records
  ]
}
```

### Form State Management

All modes use the same underlying form system:

```typescript
// Shared form structure
interface ActivityFormData {
  petId: number;
  category: ActivityCategory;
  templateId: string;
  title: string;
  activityDate: Date;
  blocks: Record<string, any>; // Dynamic block data
}

// Unified validation
const form = useForm<ActivityFormData>({
  resolver: zodResolver(activityFormValidationSchema),
  mode: 'onChange'
});
```

## Real-World Usage Scenarios

### Scenario 1: Daily Feeding (Quick Log)
1. User taps FAB (Floating Action Button)
2. CategoryPicker shows recent templates
3. User taps "Breakfast" (1st interaction)
4. QuickLogSheet opens with Title and Portion blocks
5. User selects "1 cup dry food" (2nd interaction)
6. User taps Save (3rd interaction)
7. Activity saved automatically

### Scenario 2: Weekly Grooming (Guided Flow)
1. User selects "Lifestyle" category
2. Chooses "Grooming Session" template
3. GuidedFlowWizard opens with 3 steps:
   - Step 1: Title, Time blocks
   - Step 2: Notes, Rating blocks
   - Step 3: Cost, Attachments blocks
4. Progress indicator shows completion
5. Validation ensures required fields completed
6. Auto-draft saves every 2 seconds

### Scenario 3: Comprehensive Health Record (Advanced Edit)
1. User edits existing vet visit activity
2. AdvancedEditTabs opens with 6 tabs
3. Summary: Basic info (Title, Time, Notes)
4. Details: Measurements, ratings, specific health data
5. Attachments: Medical photos, documents
6. Reminders: Next appointment, medication schedule
7. Costs: Visit fees, medication costs
8. History: Previous related activities
9. Tab visibility based on template blocks
10. Lazy loading prevents performance issues

## Data Flow & Persistence

### Form to Database Pipeline

```typescript
// 1. User inputs data in blocks
ActivityFormData → 

// 2. Validation occurs in real-time
zodResolver(activityFormValidationSchema) →

// 3. Data serialization for storage
mapper.toActivityRecord(formData) →

// 4. Database persistence
ActivityRecord → SQLite/PostgreSQL
```

### Auto-Save & Draft Management

- **Quick Log**: No auto-save (too fast to need it)
- **Guided Flow**: Auto-save every 2 seconds when dirty
- **Advanced Edit**: Auto-save every 2 seconds when dirty
- **Draft Recovery**: Offered when returning to unfinished activities

## Integration Points

### Pet Context Management
```typescript
// Pet switching disabled per user feedback
// Single pet selection on activity creation
const currentPet: PetContext = {
  id: petId,
  name: 'Current Pet',
  photo: undefined,
};
```

### Timeline Integration
Activities flow into the main timeline view:
- Saved activities appear immediately
- Filtered by category, date, pet
- Key facts extracted for timeline display
- Thumbnails from attachments

### Statistics & Insights
Activity data powers analytics:
- Health trends from measurements
- Expense tracking from cost blocks
- Activity frequency analysis
- Template usage patterns

## Performance Optimizations

### Lazy Loading
- Tabs in Advanced Edit load content only when viewed
- Block components loaded on demand
- Template registry cached for session

### Form Optimization
- Real-time validation with debouncing
- Minimal re-renders with React Hook Form
- Efficient state management with FormContext

### Memory Management
- Component cleanup on unmount
- Draft cleanup after successful save
- Template registry memory limits

## Future Extensibility

### Adding New Block Types
1. Define block type in `ActivityBlockType`
2. Create block component in `blocks/` directory
3. Add to `blockRegistry` for rendering
4. Update validation schema
5. Add to appropriate templates

### Creating New Templates
1. Define in category-specific template file
2. Specify blocks and configuration
3. Add to template registry
4. Configure Quick Log eligibility
5. Test across all three modes

### Mode Extensions
The architecture supports additional modes:
- **Bulk Entry**: Multiple activities at once
- **Voice Recording**: Audio-to-activity conversion
- **Template Designer**: User-created templates
- **Collaborative**: Multi-user activity recording

## Technical Benefits

### Scalability
- Add new activity types without code changes
- Extend with new blocks independently
- Template-driven reduces maintenance

### Consistency
- Shared validation across all modes
- Unified styling through Field wrapper
- Common error handling patterns

### User Experience
- Progressive disclosure reduces cognitive load
- Mode switching based on complexity needs
- Consistent patterns across the app

### Developer Experience
- Type-safe throughout with TypeScript
- Testable component isolation
- Clear separation of concerns
- Comprehensive error handling

---

*This activity system represents a complete overhaul from category-specific forms to a flexible, block-based architecture that scales with user needs while maintaining simplicity for common tasks.*