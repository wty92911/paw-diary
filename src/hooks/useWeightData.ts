import { useMemo } from 'react';
import { useActivitiesList } from './useActivitiesList';
import { convertWeight, normalizeWeightUnit, type WeightUnit } from '../lib/utils/weightUtils';

/**
 * Subtract months from a date
 */
function subMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

/**
 * Subtract years from a date
 */
function subYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() - years);
  return result;
}

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export interface WeightDataPoint {
  date: Date;
  value: number;
  unit: WeightUnit;
  activityId: number;
  notes?: string;
  originalValue: number;
  originalUnit: WeightUnit;
}

export interface WeightStats {
  current?: number;
  min: number;
  max: number;
  average: number;
  count: number;
  totalChange?: number;
  percentageChange?: number;
  trend: 'up' | 'down' | 'stable';
}

export interface WeightDataOptions {
  range?: TimeRange;
  displayUnit?: WeightUnit;
}

export interface UseWeightDataResult {
  dataPoints: WeightDataPoint[];
  stats: WeightStats;
  isLoading: boolean;
  error?: string;
  isEmpty: boolean;
}

/**
 * Helper to check if an activity has weight measurement data
 */
function hasWeightData(activityData: Record<string, any>): boolean {
  return !!(activityData.weight || activityData.measurement);
}

/**
 * Helper to extract weight value and unit from activity data
 */
function extractWeightData(
  activityData: Record<string, any>,
): { value: number; unit: string } | null {
  // Try weight block first
  if (activityData.weight && typeof activityData.weight === 'object') {
    const weightBlock = activityData.weight as any;
    if (typeof weightBlock.value === 'number' && weightBlock.unit) {
      return { value: weightBlock.value, unit: weightBlock.unit };
    }
  }

  // Try measurement block
  if (activityData.measurement && typeof activityData.measurement === 'object') {
    const measurementBlock = activityData.measurement as any;
    if (typeof measurementBlock.value === 'number' && measurementBlock.unit) {
      return { value: measurementBlock.value, unit: measurementBlock.unit };
    }
  }

  return null;
}

/**
 * Calculate date range based on TimeRange selection
 */
function getDateRangeStart(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case '1M':
      return subMonths(now, 1);
    case '3M':
      return subMonths(now, 3);
    case '6M':
      return subMonths(now, 6);
    case '1Y':
      return subYears(now, 1);
    case 'ALL':
      return null;
    default:
      return subMonths(now, 6); // Default to 6 months
  }
}

/**
 * Filter data points by date range
 */
function filterByDateRange(points: WeightDataPoint[], range: TimeRange): WeightDataPoint[] {
  const rangeStart = getDateRangeStart(range);
  if (!rangeStart) return points; // Show all for 'ALL'

  return points.filter(point => point.date >= rangeStart);
}

/**
 * Calculate statistics from weight data points
 */
function calculateWeightStats(points: WeightDataPoint[]): WeightStats {
  if (points.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      count: 0,
      trend: 'stable',
    };
  }

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const current = points[points.length - 1]?.value;
  const first = points[0]?.value;

  let totalChange: number | undefined;
  let percentageChange: number | undefined;
  let trend: 'up' | 'down' | 'stable' = 'stable';

  if (points.length >= 2 && current !== undefined && first !== undefined) {
    totalChange = current - first;
    percentageChange = first > 0 ? (totalChange / first) * 100 : 0;

    // Determine trend (consider < 2% change as stable)
    if (Math.abs(percentageChange) < 2) {
      trend = 'stable';
    } else {
      trend = totalChange > 0 ? 'up' : 'down';
    }
  }

  return {
    current,
    min,
    max,
    average,
    count: points.length,
    totalChange,
    percentageChange,
    trend,
  };
}

/**
 * Hook to fetch and process weight data for a pet
 * @param petId - Pet ID to fetch weight data for
 * @param options - Options for filtering and display
 * @returns Weight data points and statistics
 */
export function useWeightData(petId: number, options?: WeightDataOptions): UseWeightDataResult {
  const { range = '6M', displayUnit = 'kg' } = options || {};

  // Fetch all activities for the pet (will filter by category in useMemo)
  const { activities = [], isLoading, error: errorMessage } = useActivitiesList(petId);

  const result = useMemo(() => {
    // Debug logging
    console.log('[useWeightData] Processing activities:', {
      petId,
      totalActivities: activities.length,
      range,
      displayUnit,
    });

    // Filter for Growth category activities with weight data
    const weightActivities = activities.filter(
      a => a.category === 'Growth' && hasWeightData(a.activity_data),
    );

    console.log('[useWeightData] Filtered weight activities:', weightActivities.length);

    // Transform to data points
    const dataPoints: WeightDataPoint[] = weightActivities
      .map((activity): WeightDataPoint | null => {
        const weightData = extractWeightData(activity.activity_data);
        if (!weightData) return null;

        const originalUnit = normalizeWeightUnit(weightData.unit);
        if (!originalUnit) {
          console.warn(`Invalid weight unit: ${weightData.unit} for activity ${activity.id}`);
          return null;
        }

        const originalValue = weightData.value;

        // Convert to display unit if needed
        const value =
          originalUnit === displayUnit
            ? originalValue
            : convertWeight(originalValue, originalUnit, displayUnit);

        // Extract date from created_at timestamp
        const date = new Date(activity.created_at);

        // Extract notes if available
        const notes = (activity.activity_data.notes as any)?.value || undefined;

        return {
          date,
          value,
          unit: displayUnit,
          activityId: activity.id,
          notes,
          originalValue,
          originalUnit,
        };
      })
      .filter((point): point is WeightDataPoint => point !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date ascending

    // Apply time range filter
    const filteredPoints = filterByDateRange(dataPoints, range);

    // Calculate statistics
    const stats = calculateWeightStats(filteredPoints);

    return {
      dataPoints: filteredPoints,
      stats,
      isLoading,
      error: errorMessage || undefined,
      isEmpty: filteredPoints.length === 0,
    };
  }, [activities, isLoading, errorMessage, range, displayUnit]);

  return result;
}
