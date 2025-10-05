/**
 * Example usage of ActivityDataAdapter
 *
 * This file demonstrates how to use the adapter to convert between
 * frontend block data and backend typed ActivityData.
 */

import { ActivityDataAdapter } from './activityDataAdapter';
import type { ActivityFormData } from '../types/activities';
import { ActivityCategory } from '../types/activities';

// ============================================================================
// Example 1: Creating a Weight Activity (Frontend → Backend)
// ============================================================================

export function createWeightActivityExample() {
  // Frontend form data (from MeasurementBlock)
  const formData: ActivityFormData = {
    petId: 1,
    category: ActivityCategory.Growth,
    subcategory: 'Weight',
    blocks: {
      weight: {
        value: 5.2,
        unit: 'kg',
        measurementType: 'weight',
      },
      notes: 'Healthy weight after vaccination',
    },
  };

  // Convert to typed backend format (optional - backend also handles blocks)
  const typedData = ActivityDataAdapter.toBackendFormat(formData.blocks, formData.subcategory);

  console.log('Typed ActivityData:', typedData);
  // Output: { type: 'Weight', data: { value: 5.2, unit: 'kg', measurement_type: 'weight', notes: '...' } }

  return typedData;
}

// ============================================================================
// Example 2: Creating a Feeding Activity (Frontend → Backend)
// ============================================================================

export function createFeedingActivityExample() {
  const formData: ActivityFormData = {
    petId: 1,
    category: ActivityCategory.Diet,
    subcategory: 'Feeding',
    blocks: {
      portion: {
        amount: 200,
        unit: 'g',
        portionType: 'meal',
        brand: 'Royal Canin',
      },
      notes: 'Morning meal, ate everything',
    },
  };

  const typedData = ActivityDataAdapter.toBackendFormat(formData.blocks);

  console.log('Feeding ActivityData:', typedData);
  // Output: { type: 'Feeding', data: { portion_type: 'meal', amount: 200, unit: 'g', brand: 'Royal Canin', notes: '...' } }

  return typedData;
}

// ============================================================================
// Example 3: Displaying Activity Data (Backend → Frontend)
// ============================================================================

export function displayActivityExample() {
  // Backend response (typed ActivityData)
  const backendData = {
    type: 'Weight' as const,
    data: {
      value: 5.2,
      unit: 'kg',
      measurement_type: 'weight',
      notes: 'Healthy weight',
    },
  };

  // Convert to frontend blocks for display
  const blocks = ActivityDataAdapter.toFrontendFormat(backendData);

  console.log('Frontend blocks:', blocks);
  // Output: { weight: { value: 5.2, unit: 'kg', measurementType: 'weight' }, notes: 'Healthy weight' }

  return blocks;
}

// ============================================================================
// Example 4: Water Intake Activity with Auto-Detection
// ============================================================================

export function createWaterIntakeExample() {
  const formData: ActivityFormData = {
    petId: 1,
    category: ActivityCategory.Diet,
    subcategory: 'Water', // Important: subcategory helps detection
    blocks: {
      portion: {
        amount: 250,
        unit: 'ml',
        portionType: 'bowl',
      },
      notes: 'Drank all water',
    },
  };

  // Adapter auto-detects water based on subcategory
  const typedData = ActivityDataAdapter.toBackendFormat(formData.blocks, formData.subcategory);

  console.log('WaterIntake ActivityData:', typedData);
  // Output: { type: 'WaterIntake', data: { amount: 250, unit: 'ml', source: 'bowl', notes: '...' } }

  return typedData;
}

// ============================================================================
// Example 5: Validation Before Sending
// ============================================================================

export function validateBeforeSendExample() {
  const blocks = {
    weight: {
      value: 5.2,
      unit: 'kg',
      measurementType: 'weight',
    },
  };

  // Check if can be converted to typed variant
  const canConvert = ActivityDataAdapter.canConvertToTyped(blocks);
  console.log('Can convert to typed:', canConvert); // true

  // Get variant name for logging
  const variantName = ActivityDataAdapter.getVariantName(blocks);
  console.log('Variant name:', variantName); // 'Weight'

  return { canConvert, variantName };
}

// ============================================================================
// Example 6: Complete Flow - Create Activity with Adapter
// ============================================================================

export async function completeFlowExample() {
  // Step 1: User fills form (handled by ActivityEditor)
  const formData: ActivityFormData = {
    petId: 1,
    category: ActivityCategory.Growth,
    subcategory: 'Weight',
    blocks: {
      weight: {
        value: 5.2,
        unit: 'kg',
        measurementType: 'weight',
      },
      notes: 'Monthly check',
    },
  };

  // Step 2: Convert to typed data (optional, backend handles both)
  const typedData = ActivityDataAdapter.toBackendFormat(formData.blocks, formData.subcategory);

  // Step 3: Send to backend (using existing useCreateActivity hook)
  // The hook sends blocks, backend converts automatically via from_legacy_json()
  // No changes needed to existing code!

  console.log('Form data blocks:', formData.blocks);
  console.log('Typed data (backend auto-converts):', typedData);

  // Step 4: Backend automatically updates Pet.weight_kg = 5.2 kg
  // This happens in create_activity_with_side_effects() transaction

  return {
    formData,
    typedData,
    message: 'Backend will auto-convert blocks → typed data and update pet weight',
  };
}

// ============================================================================
// Usage Notes
// ============================================================================

/**
 * IMPORTANT: Frontend Migration Strategy
 *
 * Current (Phase 1): ✅ Working
 * - Frontend continues sending blocks format
 * - Backend auto-converts via from_legacy_json()
 * - Zero code changes needed in useCreateActivity
 * - Pet profile auto-updates work seamlessly
 *
 * Optional (Phase 2): Future optimization
 * - Frontend can send typed ActivityData directly
 * - Use adapter.toBackendFormat() before invoke()
 * - Slightly better type safety and performance
 * - But not required - current approach works perfectly
 *
 * Example of future direct typed approach:
 * ```ts
 * const typedData = ActivityDataAdapter.toBackendFormat(blocks, subcategory);
 * await invoke('create_activity', {
 *   activityData: {
 *     pet_id: petId,
 *     category,
 *     subcategory,
 *     activity_data: typedData, // Send typed instead of blocks
 *   }
 * });
 * ```
 */
