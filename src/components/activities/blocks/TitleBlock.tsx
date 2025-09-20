import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../../ui/input';
import { useFormContext } from './FormContext';
import { BlockProps } from '../../../lib/types/activities';
import { titleBlockSchema } from '../../../lib/validation/activityBlocks';

// Configuration interface for TitleBlock
interface TitleBlockConfig {
  placeholder?: string;
  maxLength?: number;
  showCounter?: boolean;
  autocomplete?: string[];
}

// TitleBlock component for handling activity titles
const TitleBlock: React.FC<BlockProps<TitleBlockConfig>> = ({
  control,
  name,
  label = 'Title',
  required = false,
  config = {},
}) => {
  const {
    placeholder = 'Enter activity title...',
    maxLength = 200,
    showCounter = true,
    autocomplete = [],
  } = config;

  const { watch } = useFormContext();

  // Watch current value for character count
  const currentValue = watch ? (watch as any)(name) : '';
  const currentLength = typeof currentValue === 'string' ? currentValue.length : 0;

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        required: required ? `${label} is required` : false,
        maxLength: maxLength ? {
          value: maxLength,
          message: `${label} must be less than ${maxLength} characters`,
        } : undefined,
        validate: (value) => {
          // Use Zod validation
          const result = titleBlockSchema.safeParse({ value });
          if (!result.success && required) {
            return result.error.errors[0]?.message || 'Invalid title';
          }
          if (!value && !required) return true;
          return true;
        },
      }}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          {/* Character count hint */}
          {showCounter && (
            <p className="text-xs text-muted-foreground">
              {currentLength}/{maxLength} characters
            </p>
          )}
          
          {/* Input field */}
          <div className="space-y-1">
            <Input
              {...field}
              type="text"
              placeholder={placeholder}
              maxLength={maxLength}
              autoComplete="off"
              list={autocomplete.length > 0 ? `${name}-suggestions` : undefined}
              aria-invalid={fieldState.error ? 'true' : 'false'}
            />

            {/* Autocomplete suggestions */}
            {autocomplete.length > 0 && (
              <datalist id={`${name}-suggestions`}>
                {autocomplete.map((suggestion, index) => (
                  <option key={index} value={suggestion} />
                ))}
              </datalist>
            )}
          </div>
          
          {/* Error message */}
          {fieldState.error && (
            <p className="text-sm text-destructive" role="alert">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

export default TitleBlock;