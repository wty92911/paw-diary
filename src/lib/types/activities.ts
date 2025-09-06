import { z } from 'zod';

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