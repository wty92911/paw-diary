import { Button } from '../ui/button';
import type { TimeRange } from '../../hooks/useWeightData';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const TIME_RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'All' },
];

export function TimeRangeSelector({
  value,
  onChange,
  className = '',
}: TimeRangeSelectorProps) {
  return (
    <div className={`flex gap-1 ${className}`} role="group" aria-label="Time range selector">
      {TIME_RANGES.map((range) => {
        const isActive = value === range.value;
        return (
          <Button
            key={range.value}
            onClick={() => onChange(range.value)}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={`flex-1 ${
              isActive
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'
            }`}
            aria-pressed={isActive}
            aria-label={`Show ${range.label === 'All' ? 'all time' : `last ${range.label}`}`}
          >
            {range.label}
          </Button>
        );
      })}
    </div>
  );
}
