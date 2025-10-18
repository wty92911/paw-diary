import { Button } from '../ui/button';
import type { WeightUnit } from '../../lib/utils/weightUtils';

interface UnitToggleProps {
  value: WeightUnit;
  onChange: (unit: WeightUnit) => void;
  className?: string;
}

export function UnitToggle({ value, onChange, className = '' }: UnitToggleProps) {
  return (
    <div
      className={`inline-flex rounded-md border border-orange-300 bg-white ${className}`}
      role="group"
      aria-label="Weight unit toggle"
    >
      <Button
        onClick={() => onChange('kg')}
        variant="ghost"
        size="sm"
        className={`rounded-r-none border-r border-orange-300 px-3 py-1 ${
          value === 'kg'
            ? 'bg-orange-600 text-white hover:bg-orange-700'
            : 'text-orange-700 hover:bg-orange-50'
        }`}
        aria-pressed={value === 'kg'}
        aria-label="Kilograms"
      >
        kg
      </Button>
      <Button
        onClick={() => onChange('lbs')}
        variant="ghost"
        size="sm"
        className={`rounded-l-none px-3 py-1 ${
          value === 'lbs'
            ? 'bg-orange-600 text-white hover:bg-orange-700'
            : 'text-orange-700 hover:bg-orange-50'
        }`}
        aria-pressed={value === 'lbs'}
        aria-label="Pounds"
      >
        lbs
      </Button>
    </div>
  );
}
