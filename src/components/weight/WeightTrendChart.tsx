import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWeightData, type TimeRange } from '../../hooks/useWeightData';
import type { WeightUnit } from '../../lib/utils/weightUtils';
import { formatWeight } from '../../lib/utils/weightUtils';
import { WeightChartCanvas } from './WeightChartCanvas';
import { TimeRangeSelector } from './TimeRangeSelector';
import { UnitToggle } from './UnitToggle';
import { EmptyStateCard } from './EmptyStateCard';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Alert, AlertDescription } from '../ui/alert';

interface WeightTrendChartProps {
  petId: number;
  petBirthDate: string;
  className?: string;
}

export function WeightTrendChart({
  petId,
  petBirthDate,
  className = '',
}: WeightTrendChartProps) {
  // Load user preference from localStorage or default to kg
  const [displayUnit, setDisplayUnit] = useState<WeightUnit>(() => {
    const saved = localStorage.getItem('preferredWeightUnit');
    return (saved === 'kg' || saved === 'lbs' ? saved : 'kg') as WeightUnit;
  });

  const [timeRange, setTimeRange] = useState<TimeRange>('6M');

  // Fetch weight data
  const { dataPoints, stats, isLoading, error, isEmpty } = useWeightData(petId, {
    range: timeRange,
    displayUnit,
  });

  // Persist unit preference
  useEffect(() => {
    localStorage.setItem('preferredWeightUnit', displayUnit);
  }, [displayUnit]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={`bg-white/60 backdrop-blur-sm border-orange-200 ${className}`}>
        <CardContent className="p-8 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`bg-white/60 backdrop-blur-sm border-orange-200 ${className}`}>
        <CardContent className="p-4">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load weight data: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <EmptyStateCard
        petId={petId}
        className={`bg-white/60 backdrop-blur-sm border-orange-200 ${className}`}
      />
    );
  }

  // Get trend icon
  const getTrendIcon = () => {
    if (stats.trend === 'up') {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    }
    if (stats.trend === 'down') {
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    }
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (stats.trend === 'up') return 'text-green-600';
    if (stats.trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card className={`bg-white/60 backdrop-blur-sm border-orange-200 ${className}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Weight Trend
          </h3>
          <UnitToggle value={displayUnit} onChange={setDisplayUnit} />
        </div>

        {/* Time Range Selector */}
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} className="mb-4" />

        {/* Chart */}
        <div className="h-64 mt-4">
          <WeightChartCanvas
            data={dataPoints}
            unit={displayUnit}
            petBirthDate={petBirthDate}
            className="w-full h-full"
          />
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          {/* Current Weight */}
          <div>
            <p className="text-xs text-orange-600 mb-1">Current</p>
            <p className="text-lg font-bold text-orange-900">
              {stats.current !== undefined
                ? formatWeight(stats.current, displayUnit)
                : 'N/A'}
            </p>
          </div>

          {/* Change */}
          <div>
            <p className="text-xs text-orange-600 mb-1">Change</p>
            <div className="flex items-center justify-center gap-1">
              {getTrendIcon()}
              <p className={`text-lg font-bold ${getTrendColor()}`}>
                {stats.totalChange !== undefined
                  ? `${stats.totalChange >= 0 ? '+' : ''}${formatWeight(Math.abs(stats.totalChange), displayUnit)}`
                  : 'N/A'}
              </p>
            </div>
            {stats.percentageChange !== undefined && (
              <p className={`text-xs ${getTrendColor()}`}>
                {stats.percentageChange >= 0 ? '+' : ''}
                {stats.percentageChange.toFixed(1)}%
              </p>
            )}
          </div>

          {/* Measurements Count */}
          <div>
            <p className="text-xs text-orange-600 mb-1">Records</p>
            <p className="text-lg font-bold text-orange-900">{stats.count}</p>
          </div>
        </div>

        {/* Additional Stats (min/max/average) */}
        <div className="mt-4 pt-4 border-t border-orange-200">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-xs text-orange-600">Min</p>
              <p className="font-semibold text-orange-900">
                {formatWeight(stats.min, displayUnit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-orange-600">Average</p>
              <p className="font-semibold text-orange-900">
                {formatWeight(stats.average, displayUnit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-orange-600">Max</p>
              <p className="font-semibold text-orange-900">
                {formatWeight(stats.max, displayUnit)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
