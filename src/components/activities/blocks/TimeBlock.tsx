import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Field } from './Field';
import { BlockProps, TimeConfig, TimePreset } from '../../../lib/types/activities';
import { timeBlockSchema } from '../../../lib/validation/activityBlocks';

// Default presets for common time selections
const DEFAULT_TIME_PRESETS: TimePreset[] = [
  { id: 'now', label: 'Now', offset: 0 },
  { id: '1h_ago', label: '1 hour ago', offset: -60 },
  { id: '2h_ago', label: '2 hours ago', offset: -120 },
  { id: '3h_ago', label: '3 hours ago', offset: -180 },
  { id: '6h_ago', label: '6 hours ago', offset: -360 },
];

// TimeBlock component for handling date and time input
const TimeBlock: React.FC<BlockProps<TimeConfig>> = ({
  control,
  name,
  label = 'Date & Time',
  required = false,
  config = {},
}) => {
  const {
    showDate = true,
    showTime = true,
    allowFuture = false,
    defaultToNow = true,
    showPresets = false,
    presets = DEFAULT_TIME_PRESETS,
  } = config;

  // Helper function to format date for input
  const formatDateForInput = (date: Date): string => {
    if (!showDate && !showTime) return '';
    
    if (showDate && showTime) {
      return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm format
    } else if (showDate) {
      return date.toISOString().slice(0, 10); // YYYY-MM-DD format
    } else if (showTime) {
      return date.toTimeString().slice(0, 5); // HH:mm format
    }
    
    return '';
  };

  // Helper function to parse input value back to Date
  const parseInputToDate = (value: string): Date => {
    if (!value) return new Date();
    
    if (showDate && showTime) {
      return new Date(value);
    } else if (showDate) {
      return new Date(value + 'T00:00:00');
    } else if (showTime) {
      const today = new Date();
      const [hours, minutes] = value.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      return today;
    }
    
    return new Date();
  };

  // Handle preset selection
  const handlePresetSelect = (preset: TimePreset, onChange: (value: Date) => void) => {
    const now = new Date();
    const presetTime = new Date(now.getTime() + preset.offset * 60000); // offset is in minutes
    onChange(presetTime);
  };

  // Determine input type based on configuration
  const getInputType = (): string => {
    if (showDate && showTime) return 'datetime-local';
    if (showDate) return 'date';
    if (showTime) return 'time';
    return 'datetime-local';
  };

  // Validate date/time input
  const validateDateTime = (value: Date | string): string | boolean => {
    if (!value && required) {
      return `${label} is required`;
    }
    
    if (!value && !required) return true;
    
    const date = typeof value === 'string' ? parseInputToDate(value) : value;
    const now = new Date();
    
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date and time';
    }
    
    if (!allowFuture && date > now) {
      return 'Date and time cannot be in the future';
    }
    
    // Check if date is too far in the past (more than 10 years)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    if (date < tenYearsAgo) {
      return 'Date cannot be more than 10 years ago';
    }
    
    return true;
  };

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultToNow ? new Date() : undefined}
      rules={{
        required: required ? `${label} is required` : false,
        validate: (value) => {
          // Use Zod validation
          const result = timeBlockSchema.safeParse({
            date: value instanceof Date ? value : new Date(value),
            time: showTime ? (value instanceof Date ? value.toTimeString().slice(0, 5) : undefined) : undefined,
          });
          if (!result.success && (required || value)) {
            return result.error.errors[0]?.message || 'Invalid date/time';
          }
          return validateDateTime(value);
        },
      }}
      render={({ field, fieldState }) => {
        const inputValue = field.value 
          ? formatDateForInput(field.value instanceof Date ? field.value : new Date(field.value))
          : '';

        const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          const inputValue = event.target.value;
          if (inputValue) {
            const parsedDate = parseInputToDate(inputValue);
            field.onChange(parsedDate);
          } else {
            field.onChange(null);
          }
        };

        const humanReadableDate = field.value instanceof Date
          ? field.value.toLocaleString(undefined, {
              weekday: showDate ? 'short' : undefined,
              year: showDate ? 'numeric' : undefined,
              month: showDate ? 'short' : undefined,
              day: showDate ? 'numeric' : undefined,
              hour: showTime ? '2-digit' : undefined,
              minute: showTime ? '2-digit' : undefined,
            })
          : '';

        return (
          <Field
            label={label}
            required={required}
            error={fieldState.error?.message}
            hint={field.value ? humanReadableDate : undefined}
            blockType="time"
          >
            <div className="space-y-2">
              {/* Main date/time input */}
              <Input
                type={getInputType()}
                value={inputValue}
                onChange={handleInputChange}
                max={allowFuture ? undefined : formatDateForInput(new Date())}
              />

              {/* Preset buttons */}
              {showPresets && presets.length > 0 && (
                <Card className="p-3">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Quick select:</div>
                    <div className="flex flex-wrap gap-1">
                      {presets.map((preset) => (
                        <Button
                          key={preset.id}
                          variant="outline"
                          size="sm"
                          type="button"
                          className="text-xs h-7 px-2"
                          onClick={() => handlePresetSelect(preset, field.onChange)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Current timezone info */}
              {showTime && (
                <div className="flex justify-end">
                  <Badge variant="secondary" className="text-xs">
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </Badge>
                </div>
              )}
            </div>
          </Field>
        );
      }}
    />
  );
};

export default TimeBlock;