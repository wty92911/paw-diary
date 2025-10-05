import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { type BlockProps } from '../../../lib/types/activities';
import { timeBlockSchema } from '../../../lib/validation/activityBlocks';


interface TimeBlockConfig {
  showDate?: boolean;
  showTime?: boolean;
  allowFuture?: boolean;
  defaultToNow?: boolean;
}

// TimeBlock component for handling date and time input
const TimeBlock: React.FC<BlockProps<TimeBlockConfig>> = ({
  control,
  name,
  label = 'Date & Time',
  required = false,
  config = {},
}) => {
  const {
    showDate = false,
    showTime = false,
    allowFuture = false,
    defaultToNow = true,
  } = config;

  // Helper function to format date for input (保持本地时间)
  const formatDateForInput = (date: Date): string => {
    if (!showDate && !showTime) return '';

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (showDate && showTime) {
      // YYYY-MM-DDTHH:mm format (本地时间)
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } else if (showDate) {
      // YYYY-MM-DD format (本地时间)
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      return `${year}-${month}-${day}`;
    } else if (showTime) {
      // HH:mm format (本地时间)
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      return `${hours}:${minutes}`;
    }

    return '';
  };

  // Helper function to parse input value back to Date (保持本地时间)
  const parseInputToDate = (value: string): Date => {
    if (!value) return new Date();

    if (showDate && showTime) {
      // 解析 YYYY-MM-DDTHH:mm 格式 (作为本地时间)
      const [datePart, timePart] = value.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, 0, 0);
    } else if (showDate) {
      // 解析 YYYY-MM-DD 格式 (作为本地时间)
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    } else if (showTime) {
      // 解析 HH:mm 格式 (作为本地时间)
      const today = new Date();
      const [hours, minutes] = value.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      return today;
    }

    return new Date();
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
          const dateValue = value instanceof Date ? value : (typeof value === 'string' || typeof value === 'number' ? new Date(value) : new Date());
          const result = timeBlockSchema.safeParse({
            date: dateValue,
            time: showTime ? (value instanceof Date ? value.toTimeString().slice(0, 5) : undefined) : undefined,
          });
          if (!result.success && (required || value)) {
            return result.error.errors[0]?.message || 'Invalid date/time';
          }
          return validateDateTime(typeof value === 'string' || value instanceof Date ? value : '');
        },
      }}
      render={({ field, fieldState }) => {
        const inputValue = field.value 
          ? formatDateForInput(field.value instanceof Date ? field.value : (typeof field.value === 'string' ? new Date(field.value) : new Date()))
          : '';

        const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          const inputValue = event.target.value;
          if (inputValue) {
            const parsedDate = parseInputToDate(inputValue);
            field.onChange(parsedDate);
          } else {
            // Don't set to null if required, use undefined for optional fields
            field.onChange(required ? new Date() : undefined);
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
          <div className="space-y-2">
            {/* Human readable hint */}
            {field.value && (
              <p className="text-xs text-muted-foreground">
                {humanReadableDate}
              </p>
            )}
            
            {/* Main date/time input */}
            <Input
              type={getInputType()}
              value={inputValue}
              onChange={handleInputChange}
              max={allowFuture ? undefined : formatDateForInput(new Date())}
              aria-invalid={fieldState.error ? 'true' : 'false'}
            />

            {/* Current timezone info */}
            {showTime && (
              <div className="flex justify-end">
                <Badge variant="secondary" className="text-xs">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </Badge>
              </div>
            )}
            
            {/* Error message */}
            {fieldState.error && (
              <p className="text-sm text-destructive" role="alert">
                {fieldState.error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
};

export default TimeBlock;