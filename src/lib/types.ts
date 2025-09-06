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
  PetProfile = 'pet-profile',
}

export interface NavigationState {
  currentView: ViewType;
  activePetId?: number;
  isEditMode?: boolean;
  petIndex?: number; // For horizontal navigation between pets
  totalPets?: number; // Total number of pets for navigation
}

// Router-based navigation state (React Router integration)
export interface RouterNavigationState {
  currentPath: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  canGoBack: boolean;
  isLoading?: boolean;
}

// Route parameters for pet profile pages
export interface PetProfileParams {
  petId: string;
}

// Page state interfaces for router-based pages
export interface HomePageState {
  pets: Pet[];
  isLoading: boolean;
  hasEmptyState: boolean;
}

export interface PetProfilePageState {
  pet: Pet | null;
  isLoadingPet: boolean;
  error?: string;
}

export interface AddPetPageState {
  isSubmitting: boolean;
  error?: string;
  redirectToPetId?: number;
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
