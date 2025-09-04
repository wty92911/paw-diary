import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { Activity, ActivityCategory, Pet, PetSpecies, PetGender } from '../lib/types';

// Create a new QueryClient for each test to avoid cross-test pollution
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data generators
export const createMockPet = (overrides: Partial<Pet> = {}): Pet => ({
  id: 1,
  name: 'Test Pet',
  species: PetSpecies.Dog,
  breed: 'Golden Retriever',
  gender: PetGender.Male,
  birth_date: '2020-01-01',
  weight_kg: 25.5,
  color: 'Golden',
  notes: 'Test pet for unit tests',
  photo_path: undefined,
  is_archived: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  display_order: 1,
  ...overrides,
});

export const createMockActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 1,
  pet_id: 1,
  category: ActivityCategory.Health,
  subcategory: 'Vaccination',
  title: 'Annual Vaccination',
  description: 'Annual vaccination at the vet clinic',
  activity_date: '2024-01-15',
  // activity_time: '10:30', // Removed as this field doesn't exist
  cost: 150.0,
  currency: 'USD',
  location: 'Pet Care Clinic',
  mood_rating: 3,
  activity_data: undefined,
  attachments: [],
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  ...overrides,
});

export const createMockHealthActivity = (overrides: Partial<Activity> = {}): Activity =>
  createMockActivity({
    category: ActivityCategory.Health,
    subcategory: 'Veterinary Visit',
    activity_data: {
      veterinarian_name: 'Dr. Smith',
      clinic_name: 'Pet Care Clinic',
      symptoms: ['Routine checkup'],
      diagnosis: 'Healthy',
      treatment_plan: 'Continue regular care',
      medications: [],
      follow_up_date: '2024-07-15',
      is_critical: false,
    },
    ...overrides,
  });

export const createMockGrowthActivity = (overrides: Partial<Activity> = {}): Activity =>
  createMockActivity({
    category: ActivityCategory.Growth,
    subcategory: 'Weight Tracking',
    activity_data: {
      weight: { value: 25.5, unit: 'kg' },
      height: { value: 65, unit: 'cm' },
      milestone_type: 'Weight Check',
      development_stage: 'Adult',
      growth_notes: 'Maintaining healthy weight',
      comparison_photos: [],
    },
    ...overrides,
  });

export const createMockDietActivity = (overrides: Partial<Activity> = {}): Activity =>
  createMockActivity({
    category: ActivityCategory.Diet,
    subcategory: 'Regular Feeding',
    activity_data: {
      food_brand: 'Premium Pet Food',
      food_product: 'Adult Dog Formula',
      portion_size: { amount: 2, unit: 'cups' },
      feeding_schedule: 'Morning',
      food_rating: 5,
      allergic_reaction: false,
      food_preferences: ['Chicken', 'Rice'],
      dietary_notes: 'Enjoys this food, good digestion',
    },
    ...overrides,
  });

export const createMockLifestyleActivity = (overrides: Partial<Activity> = {}): Activity =>
  createMockActivity({
    category: ActivityCategory.Lifestyle,
    subcategory: 'Exercise',
    activity_data: {
      activity_type: 'Walk',
      duration_minutes: 30,
      energy_level: 4,
      mood_level: 5,
      weather_conditions: 'Sunny',
      location_details: 'Central Park',
      social_interactions: [{ type: 'Other Dogs', description: 'Played with 2 friendly dogs' }],
      training_progress: 'Good recall',
      behavior_notes: 'Very energetic and social',
    },
    ...overrides,
  });

export const createMockExpenseActivity = (overrides: Partial<Activity> = {}): Activity =>
  createMockActivity({
    category: ActivityCategory.Expense,
    subcategory: 'Veterinary',
    activity_data: {
      expense_category: 'Medical',
      vendor: 'Pet Care Clinic',
      receipt_number: 'REC-001',
      payment_method: 'Credit Card',
      budget_category: 'Healthcare',
      tax_deductible: false,
      recurring: false,
      receipt_photo: null,
      expense_notes: 'Annual vaccination cost',
    },
    ...overrides,
  });

// Mock API responses
export const mockApiResponses = {
  activities: [
    createMockHealthActivity({ id: 1, pet_id: 1 }),
    createMockGrowthActivity({ id: 2, pet_id: 1 }),
    createMockDietActivity({ id: 3, pet_id: 1 }),
    createMockLifestyleActivity({ id: 4, pet_id: 1 }),
    createMockExpenseActivity({ id: 5, pet_id: 1 }),
  ],
  pets: [
    createMockPet({ id: 1, name: 'Buddy' }),
    createMockPet({ id: 2, name: 'Luna', species: PetSpecies.Cat, breed: 'Persian' }),
  ],
};

// Test helpers
export const waitForLoadingToFinish = () => new Promise(resolve => setTimeout(resolve, 100));

export const mockTauriInvoke = (mockImplementation: any) => {
  const originalInvoke = (window as any).__TAURI__.core.invoke;
  (window as any).__TAURI__.core.invoke = vi.fn().mockImplementation(mockImplementation);
  return () => {
    (window as any).__TAURI__.core.invoke = originalInvoke;
  };
};

export const createFormSubmissionMock = () => {
  const mockSubmit = vi.fn();
  return {
    mockSubmit,
    defaultProps: {
      onSubmit: mockSubmit,
      isSubmitting: false,
    },
  };
};
