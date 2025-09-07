import { z } from 'zod';
import type { Pet } from '../types';

// Activity categories and subcategories
export enum ActivityCategory {
  Health = 'Health',
  Growth = 'Growth',
  Diet = 'Diet',
  Lifestyle = 'Lifestyle',
  Expense = 'Expense',
}

// Block type definitions for the unified activity system
export type ActivityBlockType =
  | 'title'
  | 'notes'
  | 'subcategory'
  | 'time'
  | 'measurement'
  | 'rating'
  | 'portion'
  | 'timer'
  | 'location'
  | 'weather'
  | 'checklist'
  | 'attachment'
  | 'cost'
  | 'reminder'
  | 'people'
  | 'recurrence';

// Block definition interface - defines structure of each block
export interface ActivityBlockDef {
  id: string;
  type: ActivityBlockType;
  label?: string;
  required?: boolean;
  config?: Record<string, any>;
}

// Template definition for activity types
export interface ActivityTemplate {
  id: string;
  category: ActivityCategory;
  subcategory: string;
  label: string;
  icon: string;
  blocks: ActivityBlockDef[];
  isQuickLogEnabled: boolean;
  description?: string;
}

// Activity interaction modes
export type ActivityMode = 'quick' | 'guided' | 'advanced';

// Core activity form data structure
export interface ActivityFormData {
  petId: number;
  category: ActivityCategory;
  subcategory: string;
  templateId: string;
  blocks: Record<string, any>;
  
  // Common fields
  title: string;
  description?: string;
  activityDate: Date;
  
  // Optional block-specific data
  measurements?: Record<string, MeasurementData>;
  attachments?: AttachmentData[];
  cost?: CostData;
  reminder?: ReminderData;
  recurrence?: RecurrenceData;
}

// Block-specific data types

// Measurement block configuration and data
export interface MeasurementConfig {
  measurementType: 'weight' | 'height' | 'temperature' | 'custom';
  units: string[];
  defaultUnit?: string;
  min?: number;
  max?: number;
  precision?: number;
}

export interface MeasurementData {
  value: number;
  unit: string;
  measurementType: string;
  notes?: string;
}

// Rating block configuration and data
export interface RatingConfig {
  scale: number; // e.g., 5 for 1-5 scale
  labels?: string[]; // Custom labels for each rating
  showEmojis?: boolean;
  ratingType: 'mood' | 'energy' | 'appetite' | 'behavior' | 'custom';
}

export interface RatingData {
  value: number;
  scale: number;
  ratingType: string;
  notes?: string;
}

// Portion block configuration and data
export interface PortionConfig {
  portionTypes: string[]; // ['cup', 'bowl', 'treat', 'custom']
  units: string[]; // ['g', 'ml', 'cups', 'pieces']
  defaultUnit?: string;
  showBrand?: boolean;
}

export interface PortionData {
  amount: number;
  unit: string;
  portionType: string;
  brand?: string;
  notes?: string;
}

// Timer block configuration and data
export interface TimerConfig {
  timerType: 'duration' | 'stopwatch' | 'start_end';
  showPresets?: boolean;
  presets?: number[]; // Duration presets in minutes
  maxDuration?: number; // Max duration in minutes
}

export interface TimerData {
  type: 'duration' | 'stopwatch' | 'start_end';
  duration?: number; // Duration in minutes
  startTime?: Date;
  endTime?: Date;
  notes?: string;
}

// Location block configuration and data
export interface LocationConfig {
  allowCustomLocation: boolean;
  showMap?: boolean;
  commonLocations?: string[];
}

export interface LocationData {
  name: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  notes?: string;
}

// Weather block configuration and data
export interface WeatherConfig {
  showTemperature: boolean;
  showConditions: boolean;
  temperatureUnit: 'C' | 'F';
}

export interface WeatherData {
  temperature?: number;
  temperatureUnit: 'C' | 'F';
  conditions?: string;
  description?: string;
}

// Checklist block configuration and data
export interface ChecklistConfig {
  checklistType: 'symptoms' | 'training' | 'care' | 'custom';
  predefinedItems?: string[];
  allowCustomItems?: boolean;
  maxItems?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  notes?: string;
}

export interface ChecklistData {
  items: ChecklistItem[];
  checklistType: string;
  notes?: string;
}

// Attachment block configuration and data
export interface AttachmentConfig {
  maxFiles: number;
  allowedTypes: string[];
  maxFileSize: number; // Size in bytes
  showOCR?: boolean;
  allowReordering?: boolean;
}

export interface AttachmentData {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  thumbnailPath?: string;
  uploadedAt: Date;
  description?: string;
  ocrText?: string;
}

// Cost block configuration and data
export interface CostConfig {
  currencies: string[];
  defaultCurrency?: string;
  showCategory?: boolean;
  categories?: string[];
  allowReceipt?: boolean;
}

export interface CostData {
  amount: number;
  currency: string;
  category?: string;
  description?: string;
  receiptPhoto?: string;
  notes?: string;
}

// Reminder block configuration and data
export interface ReminderConfig {
  reminderTypes: string[];
  allowCustom: boolean;
  showTime: boolean;
  showRepeat: boolean;
}

export interface ReminderData {
  type: string;
  title: string;
  description?: string;
  reminderDate: Date;
  reminderTime?: string;
  repeat?: RecurrenceData;
  isEnabled: boolean;
}

// People block configuration and data
export interface PeopleConfig {
  peopleTypes: string[]; // ['vet', 'trainer', 'groomer', 'sitter']
  allowCustomType: boolean;
  showContact?: boolean;
  showRating?: boolean;
}

export interface PersonData {
  id: string;
  name: string;
  type: string;
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  rating?: number;
  notes?: string;
}

export interface PeopleData {
  people: PersonData[];
  notes?: string;
}

// Recurrence block configuration and data
export interface RecurrenceConfig {
  allowCustom: boolean;
  presets: RecurrencePreset[];
  maxEndDate?: Date;
}

export interface RecurrencePreset {
  id: string;
  label: string;
  pattern: RecurrencePattern;
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday=0
  dayOfMonth?: number;
  endDate?: Date;
  maxOccurrences?: number;
}

export interface RecurrenceData {
  pattern: RecurrencePattern;
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  notes?: string;
}

// Time block configuration and data
export interface TimeConfig {
  showDate: boolean;
  showTime: boolean;
  allowFuture: boolean;
  defaultToNow: boolean;
  showPresets?: boolean;
  presets?: TimePreset[];
}

export interface TimePreset {
  id: string;
  label: string;
  offset: number; // Minutes from now
}

export interface TimeData {
  date: Date;
  time?: string;
  timezone?: string;
  notes?: string;
}

// Subcategory block configuration
export interface SubcategoryConfig {
  subcategories: SubcategoryOption[];
  allowCustom?: boolean;
  showDescription?: boolean;
}

export interface SubcategoryOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

// Activity editor component props
export interface ActivityEditorProps {
  mode: ActivityMode;
  templateId?: string;
  activityId?: number; // For editing existing
  petId: number;
  onSave: (activity: ActivityFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ActivityFormData>;
}

// Block renderer component props
export interface BlockRendererProps {
  block: ActivityBlockDef;
  control: any; // React Hook Form control
  errors: any; // React Hook Form errors
  watch: any; // React Hook Form watch
  setValue: any; // React Hook Form setValue
}

// Individual block component props interface
export interface BlockProps<T = any> {
  control: any;
  name: string;
  label?: string;
  required?: boolean;
  config?: T;
  errors?: any;
  watch?: any;
  setValue?: any;
}

// Activity database record interface
export interface ActivityRecord {
  id: number;
  pet_id: number;
  category: string;
  subcategory: string;
  title: string;
  description?: string;
  activity_date: string; // ISO date string
  activity_data: {
    templateId: string;
    blocks: Record<string, any>;
    mode: ActivityMode;
  };
  created_at: string;
  updated_at: string;
}

// Activity draft for auto-save functionality
export interface ActivityDraft {
  id?: number;
  pet_id: number;
  template_id: string;
  activity_data: Partial<ActivityFormData>;
  updated_at: string;
}

// Activity timeline display interfaces
export interface ActivityTimelineItem {
  id: number;
  petId: number;
  category: ActivityCategory;
  subcategory: string;
  title: string;
  description?: string;
  activityDate: Date;
  keyFacts: string[];
  attachmentCount: number;
  thumbnails: string[];
  hasHealthFlag: boolean;
  isPinned: boolean;
}

// Activity summary for cards and lists
export interface ActivitySummary {
  id: number;
  title: string;
  category: ActivityCategory;
  subcategory: string;
  date: Date;
  keyFacts: string[];
  thumbnail?: string;
  hasAttachments: boolean;
  isHealthCritical: boolean;
}

// Quick log specific interfaces
export interface QuickLogTemplate {
  templateId: string;
  category: ActivityCategory;
  subcategory: string;
  label: string;
  icon: string;
  blocks: ActivityBlockDef[];
}

// Recent templates for smart defaults
export interface RecentTemplate {
  templateId: string;
  lastUsed: Date;
  usageCount: number;
  petId: number;
}

// Activity statistics and insights
export interface ActivityStats {
  totalActivities: number;
  activitiesByCategory: Record<ActivityCategory, number>;
  recentActivity: Date;
  mostUsedTemplate: string;
  averageActivitiesPerWeek: number;
}

// Template registry interfaces
export interface TemplateRegistry {
  templates: ActivityTemplate[];
  categories: ActivityCategory[];
  getTemplate(id: string): ActivityTemplate | undefined;
  getTemplatesByCategory(category: ActivityCategory): ActivityTemplate[];
  getQuickLogTemplates(): QuickLogTemplate[];
}

// Form validation schemas
export const measurementSchema = z.object({
  value: z.number().min(0, 'Value must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  measurementType: z.string().min(1, 'Measurement type is required'),
  notes: z.string().optional(),
});

export const ratingSchema = z.object({
  value: z.number().min(1).max(5),
  scale: z.number().min(1).max(10),
  ratingType: z.string().min(1, 'Rating type is required'),
  notes: z.string().optional(),
});

export const portionSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  portionType: z.string().min(1, 'Portion type is required'),
  brand: z.string().optional(),
  notes: z.string().optional(),
});

export const costSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  category: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const activityFormSchema = z.object({
  petId: z.number().min(1, 'Pet is required'),
  category: z.nativeEnum(ActivityCategory, {
    required_error: 'Category is required',
  }),
  subcategory: z.string().min(1, 'Subcategory is required'),
  templateId: z.string().min(1, 'Template is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  activityDate: z.date({
    required_error: 'Activity date is required',
  }),
  blocks: z.record(z.any()).default({}),
  measurements: z.record(measurementSchema).optional(),
  attachments: z.array(z.any()).optional(),
  cost: costSchema.optional(),
  reminder: z.any().optional(),
  recurrence: z.any().optional(),
});

export type ActivityFormSchemaType = z.infer<typeof activityFormSchema>;

// Error types for activity operations
export interface ActivityError {
  code: string;
  message: string;
  field?: string;
  details?: string;
}

// API response wrapper for activity operations
export interface ActivityResponse<T> {
  success: boolean;
  data?: T;
  error?: ActivityError;
}

// Hook return types for activity management
export interface UseActivitiesReturn {
  activities: ActivityTimelineItem[];
  isLoading: boolean;
  error?: string;
  createActivity: (data: ActivityFormData) => Promise<ActivityResponse<ActivityRecord>>;
  updateActivity: (id: number, data: Partial<ActivityFormData>) => Promise<ActivityResponse<ActivityRecord>>;
  deleteActivity: (id: number) => Promise<ActivityResponse<void>>;
  getActivity: (id: number) => Promise<ActivityResponse<ActivityRecord>>;
}

export interface UseActivityDraftReturn {
  draft: ActivityDraft | null;
  isLoading: boolean;
  error?: string;
  saveDraft: (data: Partial<ActivityFormData>) => Promise<void>;
  loadDraft: (petId: number, templateId: string) => Promise<ActivityDraft | null>;
  deleteDraft: (id: number) => Promise<void>;
  hasDraft: boolean;
}

export interface UseRecentTemplatesReturn {
  recentTemplates: RecentTemplate[];
  isLoading: boolean;
  error?: string;
  recordTemplateUsage: (templateId: string, petId: number) => Promise<void>;
  getRecentForPet: (petId: number) => RecentTemplate[];
}

// Constants for activity system
export const ACTIVITY_CATEGORIES = Object.values(ActivityCategory);

export const BLOCK_TYPES = [
  'title', 'notes', 'subcategory', 'time', 'measurement',
  'rating', 'portion', 'timer', 'location', 'weather',
  'checklist', 'attachment', 'cost', 'reminder', 'people', 'recurrence'
] as const;

export const MAX_ATTACHMENTS = 10;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_ATTACHMENT_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'application/pdf', 'text/plain'
];

export const DRAFT_AUTO_SAVE_INTERVAL = 3000; // 3 seconds
export const UNDO_TIMEOUT = 6000; // 6 seconds

// Default configurations for blocks
export const DEFAULT_MEASUREMENT_CONFIG: MeasurementConfig = {
  measurementType: 'weight',
  units: ['kg', 'g', 'lbs'],
  defaultUnit: 'kg',
  min: 0.1,
  max: 200,
  precision: 1,
};

export const DEFAULT_RATING_CONFIG: RatingConfig = {
  scale: 5,
  showEmojis: true,
  ratingType: 'mood',
};

export const DEFAULT_PORTION_CONFIG: PortionConfig = {
  portionTypes: ['cup', 'bowl', 'treat', 'meal'],
  units: ['g', 'ml', 'cups', 'pieces'],
  defaultUnit: 'g',
  showBrand: true,
};

export const DEFAULT_ATTACHMENT_CONFIG: AttachmentConfig = {
  maxFiles: MAX_ATTACHMENTS,
  allowedTypes: SUPPORTED_ATTACHMENT_TYPES,
  maxFileSize: MAX_FILE_SIZE,
  showOCR: false,
  allowReordering: true,
};

// =============================================================================
// ACTIVITY PAGES ROUTING AND NAVIGATION INTERFACES
// =============================================================================

/**
 * URL parameter extraction for pet-contextual routing in Activity Pages.
 * Used by React Router to type-safely access route parameters.
 * 
 * @example
 * ```typescript
 * // Usage in page components with React Router
 * const { petId, activityId } = useParams<PetActivityRouteParams>();
 * 
 * // Navigation with typed parameters
 * navigate(`/pets/${petId}/activities`);
 * navigate(`/pets/${petId}/activities/${activityId}/edit`);
 * ```
 */
export interface PetActivityRouteParams {
  /** Pet ID from URL path - always required for activity pages */
  petId: string;
  /** Activity ID from URL path - only present when editing existing activity */
  activityId?: string;
}

/**
 * Query parameters for activity editor configuration via URL.
 * Enables direct navigation to specific editor modes and templates.
 * 
 * @example
 * ```typescript
 * // URL examples:
 * // /pets/123/activities/new?template=feeding&mode=quick
 * // /pets/123/activities/new?mode=guided
 * // /pets/123/activities/456/edit?mode=advanced
 * 
 * const searchParams = new URLSearchParams(location.search);
 * const queryParams: ActivityEditorQueryParams = {
 *   template: searchParams.get('template') || undefined,
 *   mode: searchParams.get('mode') as ActivityMode || 'guided'
 * };
 * ```
 */
export interface ActivityEditorQueryParams {
  /** Template ID to pre-populate editor with specific activity template */
  template?: string;
  /** Editor interaction mode - determines UI complexity and guidance level */
  mode?: ActivityMode;
}

/**
 * State management for activities list page with filtering and sorting.
 * Manages the complete state of the activities list view including filters,
 * search, and pagination state.
 * 
 * @example
 * ```typescript
 * const [listState, setListState] = useState<ActivitiesListState>({
 *   activities: [],
 *   filteredActivities: [],
 *   selectedFilters: {
 *     categories: [ActivityCategory.Health, ActivityCategory.Diet],
 *     dateRange: { start: new Date('2024-01-01'), end: new Date() },
 *     hasAttachments: true
 *   },
 *   sortOrder: 'desc',
 *   isLoading: false
 * });
 * 
 * // Apply filters
 * const applyFilters = (filters: ActivitiesListState['selectedFilters']) => {
 *   setListState(prev => ({
 *     ...prev,
 *     selectedFilters: filters,
 *     filteredActivities: filterActivities(prev.activities, filters)
 *   }));
 * };
 * ```
 */
export interface ActivitiesListState {
  /** All activities for the current pet (unfiltered) */
  activities: ActivityTimelineItem[];
  /** Activities after applying current filters and search */
  filteredActivities: ActivityTimelineItem[];
  /** Current filter selections applied to the list */
  selectedFilters: {
    /** Filter by activity categories (multi-select) */
    categories: ActivityCategory[];
    /** Filter by date range (optional) */
    dateRange?: { start: Date; end: Date };
    /** Filter activities that have attachments */
    hasAttachments?: boolean;
  };
  /** Sort order for activities (newest first by default) */
  sortOrder: 'desc' | 'asc';
  /** Loading state for activities list */
  isLoading: boolean;
  /** Error message if activities failed to load */
  error?: string;
}

/**
 * Shared pet context state across activity pages.
 * Provides centralized pet and activity data management for all
 * activity-related pages with proper loading and error states.
 * 
 * @example
 * ```typescript
 * // Custom hook usage
 * const usePetActivityContext = (petId: string): PetActivityContext => {
 *   const { data: pet, isLoading: isLoadingPet, error: petError } = usePet(petId);
 *   const { data: activities, isLoading: isLoadingActivities, error: activitiesError } = useActivities(petId);
 *   
 *   return {
 *     currentPet: pet,
 *     isLoadingPet,
 *     petError,
 *     activities: activities || [],
 *     isLoadingActivities,
 *     activitiesError
 *   };
 * };
 * 
 * // Usage in page components
 * const context = usePetActivityContext(petId);
 * if (context.isLoadingPet) return <LoadingSpinner />;
 * if (context.petError) return <ErrorMessage message={context.petError} />;
 * ```
 */
export interface PetActivityContext {
  /** Current pet data for context display */
  currentPet: Pet;
  /** Loading state for pet data */
  isLoadingPet: boolean;
  /** Error message if pet failed to load */
  petError?: string;
  /** All activities for the current pet */
  activities: ActivityTimelineItem[];
  /** Loading state for activities data */
  isLoadingActivities: boolean;
  /** Error message if activities failed to load */
  activitiesError?: string;
}

// =============================================================================
// PAGE COMPONENT INTERFACES
// =============================================================================

/**
 * Props interface for ActivitiesListPage component.
 * Displays paginated list of activities for a specific pet with filtering,
 * searching, and navigation to activity editor.
 * 
 * @example
 * ```typescript
 * const ActivitiesListPage: React.FC<ActivitiesListPageProps> = ({ petId }) => {
 *   const { activities, isLoading } = useActivities(petId);
 *   const navigate = useNavigate();
 * 
 *   const handleCreateActivity = () => {
 *     navigate(`/pets/${petId}/activities/new`);
 *   };
 * 
 *   const handleEditActivity = (activityId: number) => {
 *     navigate(`/pets/${petId}/activities/${activityId}/edit`);
 *   };
 * 
 *   return (
 *     <div className="activities-list-page">
 *       <PetContextHeader petId={petId} showBackButton />
 *       <ActivityTimeline activities={activities} onActivityClick={handleEditActivity} />
 *       <FloatingActionButton onClick={handleCreateActivity} />
 *     </div>
 *   );
 * };
 * ```
 */
export interface ActivitiesListPageProps {
  /** Pet ID extracted from URL route parameters */
  petId: string;
}

/**
 * Props interface for ActivityEditorPage component.
 * Full-screen activity creation and editing with pet context header.
 * Handles both new activity creation and existing activity editing.
 * 
 * @example
 * ```typescript
 * const ActivityEditorPage: React.FC<ActivityEditorPageProps> = ({
 *   petId,
 *   activityId,
 *   mode = 'guided',
 *   templateId
 * }) => {
 *   const navigate = useNavigate();
 *   const isEditing = !!activityId;
 * 
 *   const handleSave = async (activity: ActivityFormData) => {
 *     if (isEditing) {
 *       await updateActivity(parseInt(activityId!), activity);
 *     } else {
 *       await createActivity(activity);
 *     }
 *     navigate(`/pets/${petId}/activities`);
 *   };
 * 
 *   const handleCancel = () => {
 *     navigate(`/pets/${petId}/activities`);
 *   };
 * 
 *   return (
 *     <div className="activity-editor-page">
 *       <PetContextHeader petId={petId} showBackButton />
 *       <ActivityEditor
 *         mode={mode}
 *         templateId={templateId}
 *         activityId={activityId ? parseInt(activityId) : undefined}
 *         petId={parseInt(petId)}
 *         onSave={handleSave}
 *         onCancel={handleCancel}
 *       />
 *     </div>
 *   );
 * };
 * ```
 */
export interface ActivityEditorPageProps {
  /** Pet ID extracted from URL route parameters */
  petId: string;
  /** Activity ID for editing existing activity (undefined for new activity) */
  activityId?: string;
  /** Editor interaction mode from query parameters */
  mode?: ActivityMode;
  /** Template ID from query parameters for pre-populating editor */
  templateId?: string;
}

/**
 * Props interface for the pet context header component.
 * Displays current pet information and navigation controls consistently
 * across all activity pages to maintain context clarity.
 * 
 * @example
 * ```typescript
 * const PetContextHeader: React.FC<PetContextHeaderProps> = ({
 *   pet,
 *   showBackButton = false,
 *   backAction,
 *   title
 * }) => {
 *   const navigate = useNavigate();
 *   
 *   const handleBack = () => {
 *     if (backAction) {
 *       backAction();
 *     } else {
 *       navigate(-1);
 *     }
 *   };
 * 
 *   return (
 *     <div className="pet-context-header">
 *       {showBackButton && (
 *         <Button variant="ghost" onClick={handleBack}>
 *           <ArrowLeft size={20} />
 *         </Button>
 *       )}
 *       <PetProfilePhoto pet={pet} size="sm" />
 *       <div className="pet-info">
 *         <h1>{title || `${pet.name}'s Activities`}</h1>
 *         <span className="pet-breed">{pet.breed}</span>
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 */
export interface PetContextHeaderProps {
  /** Pet object for display in header */
  pet: Pet;
  /** Whether to show back navigation button */
  showBackButton?: boolean;
  /** Custom back navigation action (defaults to browser back) */
  backAction?: () => void;
  /** Optional custom title (defaults to "{pet.name}'s Activities") */
  title?: string;
}

/**
 * Props interface for activity preview section in pet profile.
 * Shows limited number of recent activities with navigation to full list.
 * Used in the simplified PetProfilePage to provide activity previews.
 * 
 * @example
 * ```typescript
 * const ActivityPreviewSection: React.FC<ActivityPreviewSectionProps> = ({
 *   activities,
 *   petId,
 *   maxPreviewItems = 3
 * }) => {
 *   const navigate = useNavigate();
 *   const recentActivities = activities.slice(0, maxPreviewItems);
 * 
 *   const handleViewAll = () => {
 *     navigate(`/pets/${petId}/activities`);
 *   };
 * 
 *   return (
 *     <div className="activity-preview-section">
 *       <div className="section-header">
 *         <h3>Recent Activities</h3>
 *         <Button variant="outline" onClick={handleViewAll}>
 *           View All ({activities.length})
 *         </Button>
 *       </div>
 *       <div className="activity-preview-cards">
 *         {recentActivities.map(activity => (
 *           <ActivityCard
 *             key={activity.id}
 *             activity={activity}
 *             variant="compact"
 *             onClick={() => navigate(`/pets/${petId}/activities/${activity.id}/edit`)}
 *           />
 *         ))}
 *       </div>
 *       {activities.length === 0 && (
 *         <div className="empty-state">
 *           <p>No activities recorded yet</p>
 *           <Button onClick={() => navigate(`/pets/${petId}/activities/new`)}>
 *             Record First Activity
 *           </Button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */
export interface ActivityPreviewSectionProps {
  /** Activities to show in preview (typically recent activities) */
  activities: ActivityTimelineItem[];
  /** Pet ID for navigation to full activities list */
  petId: string;
  /** Maximum number of activities to show in preview */
  maxPreviewItems?: number;
}

// =============================================================================
// NAVIGATION AND ROUTING UTILITIES
// =============================================================================

/**
 * Navigation helper functions for activity pages.
 * Provides type-safe navigation utilities for activity-related routes.
 * 
 * @example
 * ```typescript
 * // Usage in components
 * const navigate = useNavigate();
 * const activityNavigation = useActivityNavigation(navigate);
 * 
 * // Navigate to activities list
 * activityNavigation.toActivitiesList('123');
 * 
 * // Navigate to new activity editor with template
 * activityNavigation.toNewActivity('123', {
 *   template: 'feeding',
 *   mode: 'quick'
 * });
 * 
 * // Navigate to edit existing activity
 * activityNavigation.toEditActivity('123', '456', { mode: 'advanced' });
 * 
 * // Navigate back to pet profile
 * activityNavigation.toPetProfile('123');
 * ```
 */
export interface ActivityNavigationHelpers {
  /** Navigate to activities list page for a pet */
  toActivitiesList: (petId: string) => void;
  /** Navigate to new activity editor with optional query parameters */
  toNewActivity: (petId: string, params?: ActivityEditorQueryParams) => void;
  /** Navigate to edit existing activity with optional query parameters */
  toEditActivity: (petId: string, activityId: string, params?: Pick<ActivityEditorQueryParams, 'mode'>) => void;
  /** Navigate back to pet profile page */
  toPetProfile: (petId: string) => void;
  /** Navigate to home page */
  toHome: () => void;
}

/**
 * Breadcrumb navigation item for activity pages.
 * Used to build breadcrumb navigation showing current location.
 * 
 * @example
 * ```typescript
 * // Usage in breadcrumb component
 * const ActivityBreadcrumbs: React.FC<{ petId: string; activityId?: string }> = ({
 *   petId,
 *   activityId
 * }) => {
 *   const { data: pet } = usePet(petId);
 *   
 *   const breadcrumbs: ActivityNavigationItem[] = [
 *     { label: 'Home', path: '/', isClickable: true },
 *     { label: pet?.name || 'Pet', path: `/pets/${petId}`, isClickable: true },
 *     { label: 'Activities', path: `/pets/${petId}/activities`, isClickable: !activityId },
 *   ];
 * 
 *   if (activityId) {
 *     breadcrumbs.push({
 *       label: 'Edit Activity',
 *       path: `/pets/${petId}/activities/${activityId}/edit`,
 *       isClickable: false
 *     });
 *   }
 * 
 *   return (
 *     <nav className="breadcrumbs">
 *       {breadcrumbs.map((item, index) => (
 *         <span key={index}>
 *           {item.isClickable ? (
 *             <Link to={item.path}>{item.label}</Link>
 *           ) : (
 *             <span className="current">{item.label}</span>
 *           )}
 *           {index < breadcrumbs.length - 1 && <span className="separator"> / </span>}
 *         </span>
 *       ))}
 *     </nav>
 *   );
 * };
 * ```
 */
export interface ActivityNavigationItem {
  /** Display label for the navigation item */
  label: string;
  /** URL path for the navigation item */
  path: string;
  /** Whether the item should be clickable (false for current page) */
  isClickable: boolean;
}

// =============================================================================
// ACTIVITY PAGES SPECIFIC HOOK INTERFACES
// =============================================================================

/**
 * Return type for useActivitiesList hook.
 * Manages activities list page state including filtering, searching, and pagination.
 * 
 * @example
 * ```typescript
 * const useActivitiesList = (petId: string): UseActivitiesListReturn => {
 *   const [state, setState] = useState<ActivitiesListState>({
 *     activities: [],
 *     filteredActivities: [],
 *     selectedFilters: { categories: [] },
 *     sortOrder: 'desc',
 *     isLoading: true
 *   });
 * 
 *   const applyFilters = useCallback((filters: ActivitiesListState['selectedFilters']) => {
 *     const filtered = state.activities.filter(activity => {
 *       if (filters.categories.length > 0 && !filters.categories.includes(activity.category)) {
 *         return false;
 *       }
 *       if (filters.hasAttachments && !activity.attachmentCount) {
 *         return false;
 *       }
 *       return true;
 *     });
 * 
 *     setState(prev => ({
 *       ...prev,
 *       selectedFilters: filters,
 *       filteredActivities: filtered
 *     }));
 *   }, [state.activities]);
 * 
 *   return { ...state, applyFilters, clearFilters, toggleSortOrder };
 * };
 * ```
 */
export interface UseActivitiesListReturn {
  /** All activities for the current pet */
  activities: ActivityTimelineItem[];
  /** Activities after applying filters and search */
  filteredActivities: ActivityTimelineItem[];
  /** Current filter selections */
  selectedFilters: ActivitiesListState['selectedFilters'];
  /** Current sort order */
  sortOrder: 'desc' | 'asc';
  /** Loading state for activities */
  isLoading: boolean;
  /** Error message if loading failed */
  error?: string;
  /** Apply new filters to the activities list */
  applyFilters: (filters: ActivitiesListState['selectedFilters']) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Toggle sort order between ascending and descending */
  toggleSortOrder: () => void;
  /** Search activities by text */
  searchActivities: (query: string) => void;
}

/**
 * Return type for usePetActivityContext hook.
 * Provides centralized pet and activity context for activity pages.
 * 
 * @example
 * ```typescript
 * const usePetActivityContext = (petId: string): UsePetActivityContextReturn => {
 *   const { data: pet, isLoading: isLoadingPet, error: petError } = usePet(petId);
 *   const { data: activities, isLoading: isLoadingActivities, error: activitiesError } = useActivities(petId);
 * 
 *   const contextValue: PetActivityContext = {
 *     currentPet: pet,
 *     isLoadingPet,
 *     petError,
 *     activities: activities || [],
 *     isLoadingActivities,
 *     activitiesError
 *   };
 * 
 *   const isLoading = isLoadingPet || isLoadingActivities;
 *   const hasError = !!petError || !!activitiesError;
 * 
 *   return {
 *     context: contextValue,
 *     isLoading,
 *     hasError,
 *     refresh: () => {
 *       queryClient.invalidateQueries(['pet', petId]);
 *       queryClient.invalidateQueries(['activities', petId]);
 *     }
 *   };
 * };
 * ```
 */
export interface UsePetActivityContextReturn {
  /** Combined pet and activity context */
  context: PetActivityContext;
  /** Overall loading state (pet or activities loading) */
  isLoading: boolean;
  /** Whether any errors occurred */
  hasError: boolean;
  /** Refresh pet and activity data */
  refresh: () => void;
}

/**
 * Return type for useActivityNavigation hook.
 * Provides type-safe navigation utilities for activity pages.
 * 
 * @example
 * ```typescript
 * const useActivityNavigation = (): UseActivityNavigationReturn => {
 *   const navigate = useNavigate();
 * 
 *   const navigationHelpers: ActivityNavigationHelpers = {
 *     toActivitiesList: (petId: string) => {
 *       navigate(`/pets/${petId}/activities`);
 *     },
 *     toNewActivity: (petId: string, params?: ActivityEditorQueryParams) => {
 *       const searchParams = new URLSearchParams();
 *       if (params?.template) searchParams.set('template', params.template);
 *       if (params?.mode) searchParams.set('mode', params.mode);
 *       
 *       const query = searchParams.toString();
 *       navigate(`/pets/${petId}/activities/new${query ? `?${query}` : ''}`);
 *     },
 *     // ... other navigation methods
 *   };
 * 
 *   return {
 *     ...navigationHelpers,
 *     canGoBack: window.history.length > 1,
 *     goBack: () => navigate(-1)
 *   };
 * };
 * ```
 */
export interface UseActivityNavigationReturn extends ActivityNavigationHelpers {
  /** Whether browser back navigation is available */
  canGoBack: boolean;
  /** Navigate back in browser history */
  goBack: () => void;
}