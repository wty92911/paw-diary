import React from 'react';
import { Controller } from 'react-hook-form';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { BlockProps } from '../../../lib/types/activities';
import { Field } from './Field';

// Rating value interface
interface RatingValue {
  rating: number; // 1-5
  emoji?: string; // Optional emoji to accompany rating
  label?: string; // Optional text label for the rating
}

// Rating block configuration
interface RatingBlockConfig {
  scale?: number;
  labels?: string[];
  showEmojis?: boolean;
  ratingType?: 'mood' | 'energy' | 'appetite' | 'behavior' | 'custom';
  showContext?: boolean;
  contextDescription?: string[];
}

// Predefined rating configurations for different contexts
const RATING_CONFIGS = {
  default: {
    labels: ['Poor', 'Fair', 'Good', 'Great', 'Excellent'],
    emojis: ['😞', '😐', '🙂', '😊', '😍'],
    colors: ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-green-600'],
  },
  mood: {
    labels: ['Upset', 'Sad', 'Neutral', 'Happy', 'Joyful'],
    emojis: ['😢', '😔', '😐', '😊', '😄'],
    colors: ['text-red-500', 'text-orange-500', 'text-gray-500', 'text-green-500', 'text-green-600'],
  },
  energy: {
    labels: ['Exhausted', 'Tired', 'Normal', 'Energetic', 'Hyperactive'],
    emojis: ['😴', '😪', '🙂', '⚡', '🤸'],
    colors: ['text-gray-500', 'text-orange-500', 'text-blue-500', 'text-green-500', 'text-red-500'],
  },
  appetite: {
    labels: ['No appetite', 'Low', 'Normal', 'Good', 'Excellent'],
    emojis: ['🚫', '😑', '🙂', '😋', '🤤'],
    colors: ['text-red-500', 'text-orange-500', 'text-gray-500', 'text-green-500', 'text-green-600'],
  },
  satisfaction: {
    labels: ['Terrible', 'Poor', 'Average', 'Good', 'Amazing'],
    emojis: ['😤', '😞', '😐', '😊', '🤩'],
    colors: ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-purple-500'],
  },
} as const;

type RatingConfigType = keyof typeof RATING_CONFIGS;

// RatingBlock component for 1-5 star ratings with emoji and accessibility support
const RatingBlock: React.FC<BlockProps<RatingBlockConfig>> = ({
  control,
  name,
  label = 'Rating',
  required = false,
  config = {},
}) => {
  const fieldName = name;
  
  // Extract configuration
  const {
    scale = 5,
    ratingType = 'default',
  } = config;

  // Get rating configuration based on block config or default
  const configType: RatingConfigType = ratingType as RatingConfigType || 'default';
  const ratingConfig = RATING_CONFIGS[configType];

  return (
    <Controller
      control={control}
      name={fieldName}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field, fieldState: { error } }) => {
        const currentValue: RatingValue | undefined = field.value;

        // Handle rating selection
        const handleRatingSelect = React.useCallback((rating: number) => {
          const newValue: RatingValue = {
            rating,
            emoji: ratingConfig.emojis[rating - 1],
            label: ratingConfig.labels[rating - 1],
          };
          field.onChange(newValue);
        }, [field, ratingConfig]);

        // Handle keyboard navigation
        const handleKeyDown = React.useCallback((event: React.KeyboardEvent, rating: number) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleRatingSelect(rating);
          } else if (event.key === 'ArrowLeft' && rating > 1) {
            event.preventDefault();
            handleRatingSelect(rating - 1);
          } else if (event.key === 'ArrowRight' && rating < scale) {
            event.preventDefault();
            handleRatingSelect(rating + 1);
          } else if (event.key >= '1' && event.key <= scale.toString()) {
            event.preventDefault();
            handleRatingSelect(parseInt(event.key));
          }
        }, [handleRatingSelect, scale]);

        // Clear rating handler
        const handleClear = React.useCallback(() => {
          field.onChange(undefined);
        }, [field]);

        // Generate accessible description
        const getAriaLabel = (rating: number) => {
          const ratingLabel = ratingConfig.labels[rating - 1];
          const emoji = ratingConfig.emojis[rating - 1];
          return `Rate ${rating} out of ${scale} stars - ${ratingLabel}. ${emoji}`;
        };

        return (
          <Field
            label={label}
            required={required}
            error={error?.message}
            hint={`Rate from 1 to ${scale} stars. Current: ${currentValue?.label || 'None'}`}
            blockType="rating"
            id={`rating-${fieldName}`}
          >
      <div className="space-y-4">
        {/* Rating buttons */}
        <div 
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label={`${label} rating`}
          aria-describedby={`rating-${fieldName}-hint`}
        >
          {Array.from({ length: scale }, (_, i) => i + 1).map((rating) => {
            const isSelected = currentValue?.rating === rating;
            const emoji = ratingConfig.emojis[rating - 1];
            // const label = ratingConfig.labels[rating - 1];
            const color = ratingConfig.colors[rating - 1];

            return (
              <Button
                key={rating}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="lg"
                onClick={() => handleRatingSelect(rating)}
                onKeyDown={(e) => handleKeyDown(e, rating)}
                className={`relative h-12 w-12 p-0 transition-all ${
                  isSelected 
                    ? 'ring-2 ring-primary ring-offset-2 shadow-lg' 
                    : 'hover:scale-110 hover:shadow-md'
                }`}
                aria-label={getAriaLabel(rating)}
                aria-pressed={isSelected}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
              >
                <span className={`text-xl ${color}`} role="img" aria-hidden="true">
                  {emoji}
                </span>
                
                {/* Star overlay for visual feedback */}
                <div 
                  className={`absolute inset-0 rounded-md border-2 transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-transparent'
                  }`}
                />
              </Button>
            );
          })}
        </div>

        {/* Rating display and controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentValue && (
              <>
                <Badge variant="secondary" className="text-sm">
                  {currentValue.rating}/5
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currentValue.label}
                </span>
                {currentValue.emoji && (
                  <span className="text-lg" role="img" aria-label={currentValue.label}>
                    {currentValue.emoji}
                  </span>
                )}
              </>
            )}
            {!currentValue && (
              <span className="text-sm text-muted-foreground">
                No rating selected
              </span>
            )}
          </div>

          {currentValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear rating"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Additional context if provided */}
        {config?.showContext && currentValue && (
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
            <strong>{ratingConfig.labels[currentValue.rating - 1]}</strong>
            {config?.contextDescription && (
              <div className="mt-1">
                {config.contextDescription[currentValue.rating - 1]}
              </div>
            )}
          </div>
        )}

        {/* Keyboard navigation hint */}
        <div 
          id={`rating-${fieldName}-hint`} 
          className="text-xs text-muted-foreground"
        >
          Use arrow keys, number keys (1-5), or click to rate. Press Enter or Space to select.
        </div>
          </div>
        </Field>
        );
      }}
    />
  );
};

export default RatingBlock;