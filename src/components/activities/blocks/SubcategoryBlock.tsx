import React from 'react';
import { Controller } from 'react-hook-form';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Card } from '../../ui/card';
import { Field } from './Field';
import { BlockProps, SubcategoryConfig, SubcategoryOption, ActivityCategory } from '../../../lib/types/activities';
import { subcategoryBlockSchema } from '../../../lib/validation/activityBlocks';
import { useFormContext } from './FormContext';

// Default subcategory options for each activity category
const DEFAULT_SUBCATEGORIES: Record<ActivityCategory, SubcategoryOption[]> = {
  [ActivityCategory.Diet]: [
    { value: 'feeding', label: 'Feeding', description: 'Meals and regular feeding', icon: '🍽️' },
    { value: 'water', label: 'Water', description: 'Water intake tracking', icon: '💧' },
    { value: 'treats', label: 'Treats', description: 'Snacks and treats', icon: '🍪' },
    { value: 'supplements', label: 'Supplements', description: 'Vitamins and supplements', icon: '💊' },
  ],
  [ActivityCategory.Health]: [
    { value: 'checkup', label: 'Checkup', description: 'Regular health examinations', icon: '🏥' },
    { value: 'medication', label: 'Medication', description: 'Medicine administration', icon: '💊' },
    { value: 'symptoms', label: 'Symptoms', description: 'Health symptoms or concerns', icon: '🌡️' },
    { value: 'vaccination', label: 'Vaccination', description: 'Immunization records', icon: '💉' },
  ],
  [ActivityCategory.Growth]: [
    { value: 'weight', label: 'Weight', description: 'Weight measurements', icon: '⚖️' },
    { value: 'height', label: 'Height', description: 'Height measurements', icon: '📏' },
    { value: 'milestone', label: 'Milestone', description: 'Development milestones', icon: '🎯' },
    { value: 'photos', label: 'Photos', description: 'Growth comparison photos', icon: '📸' },
  ],
  [ActivityCategory.Lifestyle]: [
    { value: 'walk', label: 'Walk', description: 'Walking and outdoor time', icon: '🚶' },
    { value: 'play', label: 'Play', description: 'Playtime activities', icon: '🎾' },
    { value: 'training', label: 'Training', description: 'Training sessions', icon: '🎓' },
    { value: 'sleep', label: 'Sleep', description: 'Rest and sleep tracking', icon: '😴' },
    { value: 'grooming', label: 'Grooming', description: 'Grooming and hygiene', icon: '✂️' },
  ],
  [ActivityCategory.Expense]: [
    { value: 'food', label: 'Food', description: 'Food and treats purchases', icon: '🛒' },
    { value: 'veterinary', label: 'Veterinary', description: 'Medical expenses', icon: '🏥' },
    { value: 'supplies', label: 'Supplies', description: 'Toys, accessories, supplies', icon: '🎾' },
    { value: 'grooming', label: 'Grooming', description: 'Grooming services', icon: '✂️' },
    { value: 'insurance', label: 'Insurance', description: 'Insurance payments', icon: '🛡️' },
  ],
};

// SubcategoryBlock component for handling activity subcategory selection
const SubcategoryBlock: React.FC<BlockProps<SubcategoryConfig>> = ({
  control,
  name,
  label = 'Subcategory',
  required = false,
  config = {},
}) => {
  const { getValues } = useFormContext();
  const [customValue, setCustomValue] = React.useState<string>('');
  const [showCustomInput, setShowCustomInput] = React.useState<boolean>(false);

  // Get activity category from form to provide relevant subcategories
  const activityCategory = getValues('category') as ActivityCategory;
  
  const {
    subcategories = DEFAULT_SUBCATEGORIES[activityCategory] || [],
    allowCustom = true,
    showDescription = true,
  } = config;

  const handleCustomAdd = (value: string, onChange: (value: string) => void) => {
    if (value.trim()) {
      onChange(value.trim());
      setCustomValue('');
      setShowCustomInput(false);
    }
  };

  const renderChipSelection = (
    currentValue: string,
    onChange: (value: string) => void,
    error?: string
  ) => (
    <div className="space-y-3">
      {/* Predefined subcategory chips */}
      <div className="flex flex-wrap gap-2">
        {subcategories.map((option) => {
          const isSelected = currentValue === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={`h-auto py-2 px-3 ${isSelected ? '' : 'hover:border-primary'}`}
              onClick={() => onChange(option.value)}
            >
              <div className="flex items-center gap-2">
                {option.icon && <span className="text-sm">{option.icon}</span>}
                <div className="text-left">
                  <div className="text-sm font-medium">{option.label}</div>
                  {showDescription && option.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          );
        })}

        {/* Custom subcategory option */}
        {allowCustom && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto py-2 px-3 border-dashed hover:border-primary"
            onClick={() => setShowCustomInput(true)}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">➕</span>
              <span className="text-sm font-medium">Custom</span>
            </div>
          </Button>
        )}
      </div>

      {/* Custom input */}
      {showCustomInput && allowCustom && (
        <Card className="p-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Add Custom Subcategory</div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter custom subcategory..."
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                maxLength={50}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomAdd(customValue, onChange);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleCustomAdd(customValue, onChange)}
                disabled={!customValue.trim()}
              >
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomValue('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Current selection display */}
      {currentValue && (
        <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-md">
          <span className="text-sm text-muted-foreground">Selected:</span>
          <Badge variant="secondary" className="text-sm">
            {subcategories.find(s => s.value === currentValue)?.icon}{' '}
            {subcategories.find(s => s.value === currentValue)?.label || currentValue}
          </Badge>
        </div>
      )}

      {/* Error display */}
      {error && (
        <p className="text-sm text-destructive mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );

  const renderDropdownSelection = (
    currentValue: string,
    onChange: (value: string) => void
  ) => (
    <div className="space-y-2">
      <Select value={currentValue} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a subcategory..." />
        </SelectTrigger>
        <SelectContent>
          {subcategories.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon && <span>{option.icon}</span>}
                <div>
                  <div className="font-medium">{option.label}</div>
                  {showDescription && option.description && (
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
          
          {allowCustom && (
            <SelectItem value="__custom__">
              <div className="flex items-center gap-2">
                <span>➕</span>
                <span>Add custom...</span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {/* Custom input for dropdown */}
      {currentValue === '__custom__' && allowCustom && (
        <Input
          placeholder="Enter custom subcategory..."
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onBlur={() => {
            if (customValue.trim()) {
              onChange(customValue.trim());
            } else {
              onChange('');
            }
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && customValue.trim()) {
              onChange(customValue.trim());
            }
          }}
        />
      )}
    </div>
  );

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        required: required ? `${label} is required` : false,
        validate: (value) => {
          // Use Zod validation
          const result = subcategoryBlockSchema.safeParse({ value: value || '' });
          if (!result.success && (required || value)) {
            return result.error.errors[0]?.message || 'Invalid subcategory';
          }
          return true;
        },
      }}
      render={({ field, fieldState }) => {
        const handleChange = (value: string) => {
          if (value === '__custom__') {
            setShowCustomInput(true);
          } else {
            field.onChange(value);
          }
        };

        // Determine display mode based on number of options
        const useChipMode = subcategories.length <= 8;

        return (
          <Field
            label={label}
            required={required}
            error={fieldState.error?.message}
            blockType="subcategory"
          >
            <div className="space-y-2">
              {/* Category context display */}
              {activityCategory && (
                <div className="text-xs text-muted-foreground">
                  Category: <Badge variant="outline" className="text-xs ml-1">
                    {activityCategory}
                  </Badge>
                </div>
              )}

              {/* Selection interface */}
              {useChipMode ? (
                renderChipSelection(field.value || '', handleChange, fieldState.error?.message)
              ) : (
                renderDropdownSelection(field.value || '', handleChange)
              )}

              {/* Help text */}
              <div className="text-xs text-muted-foreground">
                {allowCustom ? (
                  'Select from common options or add your own custom subcategory.'
                ) : (
                  'Select from the available subcategory options.'
                )}
              </div>
            </div>
          </Field>
        );
      }}
    />
  );
};

export default SubcategoryBlock;