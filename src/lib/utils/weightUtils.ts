/**
 * Weight conversion utilities
 * Handles conversion between kg and lbs
 */

export type WeightUnit = 'kg' | 'lbs';

const KG_TO_LBS = 2.20462;

/**
 * Convert weight value from one unit to another
 * @param value - Weight value to convert
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Converted weight value
 * @throws Error if conversion is not supported
 */
export function convertWeight(
  value: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit
): number {
  if (fromUnit === toUnit) return value;

  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return value * KG_TO_LBS;
  }
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return value / KG_TO_LBS;
  }

  throw new Error(`Unsupported conversion: ${fromUnit} -> ${toUnit}`);
}

/**
 * Format weight value for display with unit
 * @param value - Weight value
 * @param unit - Weight unit
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "5.2 kg"
 */
export function formatWeight(
  value: number,
  unit: WeightUnit,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Calculate weight change between two values
 * @param current - Current weight
 * @param previous - Previous weight
 * @param unit - Weight unit
 * @returns Object with delta value, percentage, and direction
 */
export function calculateWeightChange(
  current: number,
  previous: number,
  unit: WeightUnit
) {
  const delta = current - previous;
  const percentage = previous > 0 ? (delta / previous) * 100 : 0;
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable';
  const icon = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';

  return {
    delta,
    percentage,
    direction,
    icon,
    formatted: `${delta >= 0 ? '+' : ''}${formatWeight(Math.abs(delta), unit)} ${icon}`,
  };
}

/**
 * Normalize weight unit string to standard format
 * Handles variations like "kg", "Kg", "KG", "kilograms", etc.
 * @param unit - Unit string to normalize
 * @returns Normalized WeightUnit or null if invalid
 */
export function normalizeWeightUnit(unit: string): WeightUnit | null {
  const normalized = unit.toLowerCase().trim();

  if (normalized === 'kg' || normalized === 'kilogram' || normalized === 'kilograms') {
    return 'kg';
  }
  if (
    normalized === 'lb' ||
    normalized === 'lbs' ||
    normalized === 'pound' ||
    normalized === 'pounds'
  ) {
    return 'lbs';
  }

  return null;
}
