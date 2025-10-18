import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import type { WeightDataPoint } from '../../hooks/useWeightData';
import type { WeightUnit } from '../../lib/utils/weightUtils';
import { calculateWeightChange, formatWeight } from '../../lib/utils/weightUtils';
import { calculateAge } from '../../lib/utils';

// Simple date formatting helper (since date-fns may not be installed)
function formatDate(date: Date, formatStr: string): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();

  if (formatStr === 'MMM d, yyyy') {
    return `${month} ${day}, ${year}`;
  }
  if (formatStr === 'MMM d') {
    return `${month} ${day}`;
  }
  return date.toLocaleDateString();
}

interface WeightChartCanvasProps {
  data: WeightDataPoint[];
  unit: WeightUnit;
  petBirthDate: string;
  className?: string;
}

interface ChartDataPoint {
  date: number; // timestamp for sorting
  dateStr: string; // formatted date for display
  value: number;
  original: WeightDataPoint;
}

/**
 * Custom tooltip for weight chart
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
  unit: WeightUnit;
  petBirthDate: string;
  allData: ChartDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  unit,
  petBirthDate,
  allData,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  const currentValue = data.value;
  const currentDate = new Date(data.date);

  // Calculate age at measurement
  const age = calculateAge(petBirthDate);

  // Find previous measurement for delta
  const currentIndex = allData.findIndex((d) => d.date === data.date);
  const previousData = currentIndex > 0 ? allData[currentIndex - 1] : null;

  let deltaInfo: ReturnType<typeof calculateWeightChange> | null = null;
  if (previousData) {
    deltaInfo = calculateWeightChange(currentValue, previousData.value, unit);
  }

  return (
    <div className="bg-white border border-orange-200 rounded-lg shadow-lg p-3 max-w-xs">
      {/* Date */}
      <p className="text-sm font-semibold text-orange-900 mb-1">
        {formatDate(currentDate, 'MMM d, yyyy')}
      </p>

      {/* Weight */}
      <p className="text-lg font-bold text-orange-700 mb-1">
        {formatWeight(currentValue, unit)}
      </p>

      {/* Age */}
      <p className="text-xs text-orange-600 mb-2">{age}</p>

      {/* Delta from previous */}
      {deltaInfo && (
        <div className="flex items-center gap-1 text-xs">
          <span className="text-orange-600">Change:</span>
          <span
            className={`font-semibold ${
              deltaInfo.direction === 'up'
                ? 'text-green-600'
                : deltaInfo.direction === 'down'
                  ? 'text-red-600'
                  : 'text-gray-600'
            }`}
          >
            {deltaInfo.formatted}
          </span>
        </div>
      )}

      {/* Notes (if any) */}
      {data.original.notes && (
        <p className="text-xs text-orange-600 mt-2 italic border-t border-orange-100 pt-2">
          {data.original.notes}
        </p>
      )}
    </div>
  );
}

/**
 * Custom dot component for data points
 */
interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
}

function CustomDot({ cx, cy }: CustomDotProps) {
  if (cx === undefined || cy === undefined) return null;

  return (
    <Dot
      cx={cx}
      cy={cy}
      r={5}
      fill="white"
      stroke="#EA580C"
      strokeWidth={2}
      className="cursor-pointer transition-transform hover:scale-125"
    />
  );
}

export function WeightChartCanvas({
  data,
  unit,
  petBirthDate,
  className = '',
}: WeightChartCanvasProps) {
  // Transform data for recharts
  const chartData: ChartDataPoint[] = React.useMemo(
    () =>
      data.map((point) => ({
        date: point.date.getTime(),
        dateStr: formatDate(point.date, 'MMM d'),
        value: point.value,
        original: point,
      })),
    [data]
  );

  // Calculate Y-axis domain with 10% padding
  const { minY, maxY } = React.useMemo(() => {
    if (chartData.length === 0) return { minY: 0, maxY: 10 };

    const values = chartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 1; // At least 1 unit padding

    return {
      minY: Math.max(0, min - padding),
      maxY: max + padding,
    };
  }, [chartData]);

  // Format tick for X-axis
  const formatXAxis = (timestamp: number) => {
    return formatDate(new Date(timestamp), 'MMM d');
  };

  // Format tick for Y-axis
  const formatYAxis = (value: number) => {
    return value.toFixed(1);
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        >
          {/* Grid */}
          <CartesianGrid strokeDasharray="3 3" stroke="#FED7AA" opacity={0.3} />

          {/* X Axis */}
          <XAxis
            dataKey="date"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatXAxis}
            stroke="#EA580C"
            tick={{ fill: '#9A3412', fontSize: 12 }}
            tickLine={{ stroke: '#EA580C' }}
          />

          {/* Y Axis */}
          <YAxis
            domain={[minY, maxY]}
            tickFormatter={formatYAxis}
            stroke="#EA580C"
            tick={{ fill: '#9A3412', fontSize: 12 }}
            tickLine={{ stroke: '#EA580C' }}
            label={{
              value: unit,
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#9A3412', fontSize: 12, fontWeight: 600 },
            }}
          />

          {/* Tooltip */}
          <Tooltip
            content={
              <CustomTooltip
                unit={unit}
                petBirthDate={petBirthDate}
                allData={chartData}
              />
            }
            cursor={{ stroke: '#EA580C', strokeWidth: 1, strokeDasharray: '5 5' }}
          />

          {/* Line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#EA580C"
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 7, fill: '#EA580C' }}
            animationDuration={800}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
