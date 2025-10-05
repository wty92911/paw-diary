/**
 * TypeScript type definitions for typed ActivityData
 * Mirrors the Rust ActivityData enum for type-safe backend communication
 */

/**
 * Tagged union type matching Rust's ActivityData enum
 * Uses discriminated union pattern for type safety
 */
export type ActivityData =
  | WeightActivityData
  | HeightActivityData
  | FeedingActivityData
  | WaterIntakeActivityData
  | VaccinationActivityData
  | CheckUpActivityData
  | CustomActivityData;

/**
 * Weight measurement activity (Growth category)
 * Automatically updates Pet.weight_kg when created
 */
export interface WeightActivityData {
  type: 'Weight';
  data: {
    value: number;
    unit: string;
    measurement_type: string;
    notes?: string;
  };
}

/**
 * Height/Length measurement activity (Growth category)
 */
export interface HeightActivityData {
  type: 'Height';
  data: {
    value: number;
    unit: string;
    measurement_type: string;
    notes?: string;
  };
}

/**
 * Feeding activity (Diet category)
 */
export interface FeedingActivityData {
  type: 'Feeding';
  data: {
    portion_type: string;
    amount: number;
    unit: string;
    brand?: string;
    notes?: string;
  };
}

/**
 * Water intake activity (Diet category)
 */
export interface WaterIntakeActivityData {
  type: 'WaterIntake';
  data: {
    amount: number;
    unit: string;
    source?: string;
    notes?: string;
  };
}

/**
 * Vaccination record (Health category)
 */
export interface VaccinationActivityData {
  type: 'Vaccination';
  data: {
    vaccine_name: string;
    vet_name?: string;
    next_due_date?: string; // ISO 8601 datetime string
    batch_number?: string;
    notes?: string;
  };
}

/**
 * Health check-up (Health category)
 */
export interface CheckUpActivityData {
  type: 'CheckUp';
  data: {
    diagnosis?: string;
    temperature?: number;
    heart_rate?: number;
    notes?: string;
  };
}

/**
 * Fallback for unknown or custom activity data
 * Used for backward compatibility and new templates
 */
export interface CustomActivityData {
  type: 'Custom';
  data: Record<string, unknown>;
}

/**
 * Type guard to check if ActivityData is a specific variant
 */
export function isWeightActivity(data: ActivityData): data is WeightActivityData {
  return data.type === 'Weight';
}

export function isHeightActivity(data: ActivityData): data is HeightActivityData {
  return data.type === 'Height';
}

export function isFeedingActivity(data: ActivityData): data is FeedingActivityData {
  return data.type === 'Feeding';
}

export function isWaterIntakeActivity(data: ActivityData): data is WaterIntakeActivityData {
  return data.type === 'WaterIntake';
}

export function isVaccinationActivity(data: ActivityData): data is VaccinationActivityData {
  return data.type === 'Vaccination';
}

export function isCheckUpActivity(data: ActivityData): data is CheckUpActivityData {
  return data.type === 'CheckUp';
}

export function isCustomActivity(data: ActivityData): data is CustomActivityData {
  return data.type === 'Custom';
}
