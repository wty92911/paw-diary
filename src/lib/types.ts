import { z } from 'zod';

// Enums matching the Rust backend
export enum PetSpecies {
  Cat = 'Cat',
  Dog = 'Dog',
}

export enum PetGender {
  Male = 'Male',
  Female = 'Female',
  Unknown = 'Unknown',
}

// Core Pet interface matching the Rust Pet struct
export interface Pet {
  id: number;
  name: string;
  birth_date: string; // ISO date string
  species: PetSpecies;
  gender: PetGender;
  breed?: string;
  color?: string;
  weight_kg?: number;
  photo_path?: string;
  notes?: string;
  display_order: number;
  is_archived: boolean;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

// Request interfaces for Tauri commands
export interface PetCreateRequest {
  name: string;
  birth_date: string; // ISO date string
  species: PetSpecies;
  gender: PetGender;
  breed?: string;
  color?: string;
  weight_kg?: number;
  photo_path?: string;
  notes?: string;
  display_order?: number;
}

export interface PetUpdateRequest {
  name?: string;
  birth_date?: string;
  species?: PetSpecies;
  gender?: PetGender;
  breed?: string;
  color?: string;
  weight_kg?: number;
  photo_path?: string;
  notes?: string;
  display_order?: number;
  is_archived?: boolean;
}

// Photo-related interfaces
export interface PhotoInfo {
  filename: string;
  size: number;
  width: number;
  height: number;
  created_at: string;
}

export interface StorageStats {
  photo_count: number;
  total_size: number;
  storage_dir: string;
}

// App info interface
export interface AppInfo {
  total_pets: number;
  active_pets: number;
  archived_pets: number;
  total_photos: number;
  storage_size: number;
  storage_path: string;
  version: string;
}

// Form schemas using Zod for validation
export const petFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Pet name is required')
    .max(100, 'Pet name must be less than 100 characters')
    .trim(),
  birth_date: z
    .string()
    .min(1, 'Birth date is required')
    .refine(date => {
      const parsed = new Date(date);
      const now = new Date();
      return parsed <= now;
    }, 'Birth date cannot be in the future'),
  species: z.nativeEnum(PetSpecies, {
    required_error: 'Please select a species',
  }),
  gender: z.nativeEnum(PetGender, {
    required_error: 'Please select a gender',
  }),
  breed: z.string().max(100, 'Breed must be less than 100 characters').optional(),
  color: z.string().max(50, 'Color must be less than 50 characters').optional(),
  weight_kg: z
    .number()
    .min(0.1, 'Weight must be at least 0.1 kg')
    .max(200, 'Weight must be less than 200 kg')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  photo: z
    .instanceof(File)
    .refine(file => {
      if (!file) return true;
      return file.size <= 10 * 1024 * 1024; // 10MB
    }, 'Photo must be smaller than 10MB')
    .refine(file => {
      if (!file) return true;
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
      return allowedTypes.includes(file.type);
    }, 'Photo must be a valid image format (JPEG, PNG, WebP, BMP)')
    .optional(),
});

export type PetFormData = z.infer<typeof petFormSchema>;

// UI state interfaces
export interface PetCardViewProps {
  pet: Pet;
  isActive: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface PetListState {
  pets: Pet[];
  activePetId?: number;
  isLoading: boolean;
  error?: string;
}

// Error types for better error handling
export interface PetError {
  code: string;
  message: string;
  details?: string;
}

// Common response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: PetError;
}

// Form state types
export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
}

// Upload state for photo handling
export interface UploadState {
  isUploading: boolean;
  progress?: number;
  error?: string;
  preview?: string;
}

// Navigation state
export enum ViewType {
  PetList = 'pet-list',
  PetDetail = 'pet-detail',
  PetForm = 'pet-form',
  PetManagement = 'pet-management',
  PetProfile = 'pet-profile',
}

export interface NavigationState {
  currentView: ViewType;
  activePetId?: number;
  isEditMode?: boolean;
  petIndex?: number; // For horizontal navigation between pets
  totalPets?: number; // Total number of pets for navigation
}

// Utility types for common operations
export type PetId = Pet['id'];
export type PetWithoutTimestamps = Omit<Pet, 'created_at' | 'updated_at'>;
export type RequiredPetFields = Required<Pick<Pet, 'name' | 'birth_date' | 'species' | 'gender'>>;

// Constants for validation and UI
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_PETS_DISPLAY = 20;
export const DEFAULT_PET_PHOTO = '/default-pet.jpg';

// Species and Gender options for forms
export const SPECIES_OPTIONS = [
  { value: PetSpecies.Cat, label: 'Cat' },
  { value: PetSpecies.Dog, label: 'Dog' },
];

export const GENDER_OPTIONS = [
  { value: PetGender.Male, label: 'Male' },
  { value: PetGender.Female, label: 'Female' },
  { value: PetGender.Unknown, label: 'Unknown' },
];

// Common breed options (can be extended)
export const COMMON_CAT_BREEDS = [
  'Persian',
  'Maine Coon',
  'Siamese',
  'Ragdoll',
  'British Shorthair',
  'Abyssinian',
  'Scottish Fold',
  'Sphynx',
  'Russian Blue',
  'Bengal',
  'American Shorthair',
  'Oriental',
  'Mixed Breed',
];

export const COMMON_DOG_BREEDS = [
  'Labrador Retriever',
  'Golden Retriever',
  'German Shepherd',
  'Bulldog',
  'Poodle',
  'Beagle',
  'Rottweiler',
  'Yorkshire Terrier',
  'Boxer',
  'Siberian Husky',
  'Border Collie',
  'Chihuahua',
  'Mixed Breed',
];

// Common colors
export const COMMON_PET_COLORS = [
  'Black',
  'White',
  'Brown',
  'Gray',
  'Orange',
  'Cream',
  'Golden',
  'Silver',
  'Calico',
  'Tabby',
  'Spotted',
  'Striped',
  'Mixed',
];

// ============================================================================
// ACTIVITY RECORDING SYSTEM TYPES
// ============================================================================

// Activity Categories enum matching Rust backend
export enum ActivityCategory {
  Health = 'health',
  Growth = 'growth',
  Diet = 'diet',
  Lifestyle = 'lifestyle',
  Expense = 'expense',
}

// Activity attachment types
export interface ActivityAttachment {
  id: number;
  activity_id: number;
  file_path: string;
  file_type: 'photo' | 'document' | 'video';
  file_size: number;
  thumbnail_path?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Base Activity interface matching the Rust Activity struct
export interface Activity {
  id: number;
  pet_id: number;
  category: ActivityCategory;
  subcategory: string;
  title: string;
  description?: string;
  activity_date: string; // ISO datetime string
  activity_data?: Record<string, unknown>; // JSON field for category-specific data
  cost?: number;
  currency?: string;
  location?: string;
  mood_rating?: 1 | 2 | 3 | 4 | 5;
  attachments: ActivityAttachment[];
  created_at: string;
  updated_at: string;
}

// Category-specific data interfaces
export interface HealthActivityData {
  veterinarian_name?: string;
  clinic_name?: string;
  symptoms?: string[];
  diagnosis?: string;
  treatment?: string;
  medications?: Medication[];
  next_appointment?: string; // ISO date
  is_critical?: boolean;
  weight_check?: WeightMeasurement;
}

export interface GrowthActivityData {
  weight?: { value: number; unit: 'kg' | 'lbs'; context?: string };
  height?: { value: number; unit: 'cm' | 'in' };
  milestone_type?: string;
  milestone_description?: string;
  comparison_photos?: string[]; // Array of photo filenames
  development_stage?: string;
}

export interface DietActivityData {
  food_brand?: string;
  food_product?: string;
  portion_size?: { amount: number; unit: string };
  feeding_schedule?: string;
  food_rating?: 1 | 2 | 3 | 4 | 5;
  allergic_reaction?: boolean;
  ingredients?: string[];
  nutritional_info?: NutritionInfo;
}

export interface LifestyleActivityData {
  duration_minutes?: number;
  start_time?: string;
  end_time?: string;
  energy_level?: 1 | 2 | 3 | 4 | 5;
  weather_conditions?: string;
  activity_type?: string;
  social_interactions?: SocialInteraction[];
  training_progress?: TrainingProgress;
}

export interface ExpenseActivityData {
  receipt_photo?: string;
  expense_category?: string;
  vendor?: string;
  tax_deductible?: boolean;
  recurring_schedule?: RecurringSchedule;
  budget_category?: string;
  payment_method?: string;
}

// Supporting interfaces for activity data
export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface WeightMeasurement {
  value: number;
  unit: 'kg' | 'lbs';
  measurement_context?: string;
  body_condition_score?: number;
}

export interface NutritionInfo {
  calories_per_serving?: number;
  protein_percentage?: number;
  fat_percentage?: number;
  carb_percentage?: number;
  ingredients?: string[];
}

export interface SocialInteraction {
  type: 'pet' | 'human' | 'stranger';
  description?: string;
  duration_minutes?: number;
  reaction?: string;
}

export interface TrainingProgress {
  skill?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'mastered';
  success_rate?: number;
  notes?: string;
}

export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number; // e.g., every 2 weeks = interval: 2, frequency: weekly
  end_date?: string;
}

// Activity request interfaces for Tauri commands
export interface ActivityCreateRequest {
  pet_id: number;
  category: ActivityCategory;
  subcategory: string;
  title: string;
  description?: string;
  activity_date: string;
  activity_data?: Record<string, unknown>;
  cost?: number;
  currency?: string;
  location?: string;
  mood_rating?: 1 | 2 | 3 | 4 | 5;
}

export interface ActivityUpdateRequest {
  title?: string;
  subcategory?: string;
  description?: string;
  activity_date?: string;
  activity_data?: Record<string, unknown>;
  cost?: number;
  currency?: string;
  location?: string;
  mood_rating?: 1 | 2 | 3 | 4 | 5;
}

// Activity filtering and search interfaces
export interface ActivityFilters {
  category?: ActivityCategory[];
  date_range?: { start: string; end: string };
  search_query?: string;
  pet_id?: number;
  has_attachments?: boolean;
  cost_range?: { min: number; max: number };
  subcategory?: string[];
}

export interface ActivitySearchResult {
  activities: Activity[];
  total_count: number;
  has_more: boolean;
  next_cursor?: string;
}

// Activity form data interface
export interface ActivityFormData {
  title: string;
  category: ActivityCategory;
  subcategory: string;
  description?: string;
  date: string;
  time: string;
  cost?: number;
  currency?: string;
  location?: string;
  mood_rating?: number;
  activity_data?: Record<string, unknown>;
  attachments?: File[];
}

// Activity UI state interfaces
export interface ActivityListState {
  activities: Activity[];
  isLoading: boolean;
  error?: string;
  hasMore: boolean;
  filters: ActivityFilters;
}

export interface ActivityFormState extends FormState {
  selectedCategory?: ActivityCategory;
  isDraftSaved: boolean;
  uploadProgress?: Record<string, number>; // filename -> progress percentage
}

// Activity constants and options
export const ACTIVITY_CATEGORIES = {
  [ActivityCategory.Health]: {
    label: 'Health',
    color: 'red',
    subcategories: [
      'Birth',
      'Vaccination',
      'Checkup',
      'Surgery',
      'Illness',
      'Medication',
      'Dental Care',
      'Weight Check',
      'Other',
    ],
  },
  [ActivityCategory.Growth]: {
    label: 'Growth',
    color: 'green',
    subcategories: [
      'Weight',
      'Height',
      'Photos',
      'Milestones',
      'Development Stage',
      'Size Comparison',
      'Other',
    ],
  },
  [ActivityCategory.Diet]: {
    label: 'Diet',
    color: 'orange',
    subcategories: [
      'Regular Feeding',
      'Treats',
      'Special Diet',
      'Food Changes',
      'Water Intake',
      'Supplements',
      'Other',
    ],
  },
  [ActivityCategory.Lifestyle]: {
    label: 'Lifestyle',
    color: 'blue',
    subcategories: [
      'Exercise',
      'Play',
      'Training',
      'Grooming',
      'Social Activities',
      'Rest',
      'Travel',
      'Other',
    ],
  },
  [ActivityCategory.Expense]: {
    label: 'Expenses',
    color: 'purple',
    subcategories: [
      'Medical',
      'Food',
      'Toys',
      'Grooming',
      'Training',
      'Insurance',
      'Accessories',
      'Other',
    ],
  },
} as const;

// Activity category options for forms
export const ACTIVITY_CATEGORY_OPTIONS = Object.entries(ACTIVITY_CATEGORIES).map(
  ([value, config]) => ({
    value: value as ActivityCategory,
    label: config.label,
    color: config.color,
  }),
);

// Mood rating options
export const MOOD_RATING_OPTIONS = [
  { value: 1, label: '😞', description: 'Very Low' },
  { value: 2, label: '😐', description: 'Low' },
  { value: 3, label: '🙂', description: 'Normal' },
  { value: 4, label: '😊', description: 'Good' },
  { value: 5, label: '🤩', description: 'Excellent' },
] as const;

// Energy level options for lifestyle activities
export const ENERGY_LEVEL_OPTIONS = [
  { value: 1, label: '😴', description: 'Very Low' },
  { value: 2, label: '😌', description: 'Low' },
  { value: 3, label: '🙂', description: 'Moderate' },
  { value: 4, label: '😄', description: 'High' },
  { value: 5, label: '🤸', description: 'Very High' },
] as const;

// Common currencies
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: '$', symbol: '$' },
  { value: 'CNY', label: '¥', symbol: '¥' },
  { value: 'EUR', label: '€', symbol: '€' },
  { value: 'GBP', label: '£', symbol: '£' },
] as const;

// Utility types for activities
export type ActivityId = Activity['id'];
export type ActivityWithoutTimestamps = Omit<Activity, 'created_at' | 'updated_at'>;
export type RequiredActivityFields = Required<
  Pick<Activity, 'pet_id' | 'category' | 'subcategory' | 'title' | 'activity_date'>
>;
export type CategorySpecificData =
  | HealthActivityData
  | GrowthActivityData
  | DietActivityData
  | LifestyleActivityData
  | ExpenseActivityData;
