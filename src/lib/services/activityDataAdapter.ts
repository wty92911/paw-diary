/**
 * ActivityDataAdapter - Frontend/Backend Data Conversion Layer
 *
 * Provides bidirectional conversion between:
 * - Frontend: Block-based form data (Record<string, ActivityBlockData>)
 * - Backend: Typed ActivityData enum (Rust serde-compatible format)
 *
 * This adapter maintains backward compatibility while enabling type-safe backend operations.
 */

import type { ActivityBlockData } from '../types/activities';
import type {
  ActivityData,
  WeightActivityData,
  HeightActivityData,
  FeedingActivityData,
  WaterIntakeActivityData,
  CustomActivityData,
} from '../types/activityData';

export class ActivityDataAdapter {
  /**
   * Convert frontend blocks to backend typed ActivityData
   *
   * @param blocks - Block-based form data from frontend
   * @param subcategory - Activity subcategory for context (e.g., "Weight", "Feeding")
   * @returns Typed ActivityData for backend
   *
   * @example
   * ```ts
   * const blocks = {
   *   weight: { value: 5.2, unit: 'kg', measurementType: 'weight' },
   *   notes: 'Healthy weight'
   * };
   * const typedData = ActivityDataAdapter.toBackendFormat(blocks, 'Weight');
   * // Returns: { type: 'Weight', data: { value: 5.2, unit: 'kg', ... } }
   * ```
   */
  static toBackendFormat(
    blocks: Record<string, ActivityBlockData>,
    subcategory?: string
  ): ActivityData {
    // Pattern 1: Weight measurement (from MeasurementBlock)
    if (blocks.weight && typeof blocks.weight === 'object' && 'value' in blocks.weight) {
      const weightBlock = blocks.weight as {
        value: number;
        unit: string;
        measurementType: string;
        notes?: string;
      };

      const weightData: WeightActivityData = {
        type: 'Weight',
        data: {
          value: weightBlock.value,
          unit: weightBlock.unit,
          measurement_type: weightBlock.measurementType,
          notes: typeof blocks.notes === 'string' ? blocks.notes : undefined,
        },
      };

      return weightData;
    }

    // Pattern 2: Height measurement (from MeasurementBlock)
    if (blocks.height && typeof blocks.height === 'object' && 'value' in blocks.height) {
      const heightBlock = blocks.height as {
        value: number;
        unit: string;
        measurementType: string;
        notes?: string;
      };

      const heightData: HeightActivityData = {
        type: 'Height',
        data: {
          value: heightBlock.value,
          unit: heightBlock.unit,
          measurement_type: heightBlock.measurementType,
          notes: typeof blocks.notes === 'string' ? blocks.notes : undefined,
        },
      };

      return heightData;
    }

    // Pattern 3: Feeding (from PortionBlock)
    if (blocks.portion && typeof blocks.portion === 'object' && 'amount' in blocks.portion) {
      const portionBlock = blocks.portion as {
        amount: number;
        unit: string;
        portionType: string;
        brand?: string;
        notes?: string;
      };

      // Check if this is water intake based on subcategory or portion type
      const isWater =
        subcategory?.toLowerCase() === 'water' ||
        ['bowl', 'bottle', 'fountain'].includes(portionBlock.portionType.toLowerCase());

      if (isWater) {
        const waterData: WaterIntakeActivityData = {
          type: 'WaterIntake',
          data: {
            amount: portionBlock.amount,
            unit: portionBlock.unit,
            source: portionBlock.portionType,
            notes: typeof blocks.notes === 'string' ? blocks.notes : undefined,
          },
        };

        return waterData;
      }

      // Regular feeding
      const feedingData: FeedingActivityData = {
        type: 'Feeding',
        data: {
          portion_type: portionBlock.portionType,
          amount: portionBlock.amount,
          unit: portionBlock.unit,
          brand: portionBlock.brand,
          notes: typeof blocks.notes === 'string' ? blocks.notes : undefined,
        },
      };

      return feedingData;
    }

    // Fallback: Custom data (preserves all blocks as-is)
    const customData: CustomActivityData = {
      type: 'Custom',
      data: blocks as Record<string, unknown>,
    };

    return customData;
  }

  /**
   * Convert backend typed ActivityData to frontend blocks
   *
   * @param activityData - Typed ActivityData from backend
   * @returns Block-based data for frontend rendering
   *
   * @example
   * ```ts
   * const typedData = { type: 'Weight', data: { value: 5.2, unit: 'kg', ... } };
   * const blocks = ActivityDataAdapter.toFrontendFormat(typedData);
   * // Returns: { weight: { value: 5.2, unit: 'kg', measurementType: 'weight' }, notes: '...' }
   * ```
   */
  static toFrontendFormat(activityData: ActivityData): Record<string, ActivityBlockData> {
    switch (activityData.type) {
      case 'Weight': {
        const blocks: Record<string, ActivityBlockData> = {
          weight: {
            value: activityData.data.value,
            unit: activityData.data.unit,
            measurementType: activityData.data.measurement_type,
          },
        };

        if (activityData.data.notes) {
          blocks.notes = activityData.data.notes;
        }

        return blocks;
      }

      case 'Height': {
        const blocks: Record<string, ActivityBlockData> = {
          height: {
            value: activityData.data.value,
            unit: activityData.data.unit,
            measurementType: activityData.data.measurement_type,
          },
        };

        if (activityData.data.notes) {
          blocks.notes = activityData.data.notes;
        }

        return blocks;
      }

      case 'Feeding': {
        const blocks: Record<string, ActivityBlockData> = {
          portion: {
            amount: activityData.data.amount,
            unit: activityData.data.unit,
            portionType: activityData.data.portion_type,
            brand: activityData.data.brand,
          },
        };

        if (activityData.data.notes) {
          blocks.notes = activityData.data.notes;
        }

        return blocks;
      }

      case 'WaterIntake': {
        const blocks: Record<string, ActivityBlockData> = {
          portion: {
            amount: activityData.data.amount,
            unit: activityData.data.unit,
            portionType: activityData.data.source || 'bowl',
          },
        };

        if (activityData.data.notes) {
          blocks.notes = activityData.data.notes;
        }

        return blocks;
      }

      case 'Vaccination':
      case 'CheckUp':
        // TODO: Implement when VaccinationBlock and CheckUpBlock are created
        // For now, return as custom data
        return {
          custom: activityData.data as unknown as ActivityBlockData,
        };

      case 'Custom':
        return activityData.data as Record<string, ActivityBlockData>;

      default: {
        // Exhaustive type check - should never happen
        const _exhaustive: never = activityData;
        console.warn('Unknown ActivityData type:', _exhaustive);
        return {};
      }
    }
  }

  /**
   * Check if blocks can be converted to a specific typed variant
   * Useful for validation before sending to backend
   */
  static canConvertToTyped(blocks: Record<string, ActivityBlockData>): boolean {
    // Check for weight pattern
    if (blocks.weight && typeof blocks.weight === 'object' && 'value' in blocks.weight) {
      return true;
    }

    // Check for height pattern
    if (blocks.height && typeof blocks.height === 'object' && 'value' in blocks.height) {
      return true;
    }

    // Check for portion pattern (feeding/water)
    if (blocks.portion && typeof blocks.portion === 'object' && 'amount' in blocks.portion) {
      return true;
    }

    // Otherwise will be Custom
    return false;
  }

  /**
   * Get the expected typed variant name from blocks
   * Useful for debugging and logging
   */
  static getVariantName(blocks: Record<string, ActivityBlockData>): string {
    if (blocks.weight) return 'Weight';
    if (blocks.height) return 'Height';
    if (blocks.portion) return 'Feeding/WaterIntake';
    if (blocks.vaccination) return 'Vaccination';
    if (blocks.checkup) return 'CheckUp';
    return 'Custom';
  }
}
