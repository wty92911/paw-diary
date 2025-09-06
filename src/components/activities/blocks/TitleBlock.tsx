import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Field } from './Field';
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
        <Field
          label={label}
          required={required}
          error={fieldState.error?.message}
          hint={showCounter ? `${currentLength}/${maxLength} characters` : undefined}
          blockType="title"
        >
          <div className="space-y-1">
            <Input
              {...field}
              type="text"
              placeholder={placeholder}
              maxLength={maxLength}
              autoComplete="off"
              list={autocomplete.length > 0 ? `${name}-suggestions` : undefined}
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
        </Field>
      )}
    />
  );
};

export default TitleBlock;