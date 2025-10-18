 
 
/* TODO: Refactor to move hooks outside Controller render function */

import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Plus, Minus } from 'lucide-react';
import { type BlockProps } from '../../../lib/types/activities';
import { EditableSelect } from '../../ui/editable-select';
import { useBrandProductMemory } from '../../../hooks/useBrandProductMemory';

// Portion value interface
interface PortionValue {
  amount: number;
  unit: string;
  brand?: string; // Single brand name
  product?: string; // Single product name
  notes?: string; // Additional portion notes
}

// Unit categories for food portions
const UNIT_CATEGORIES = {
  volume: {
    label: 'Volume',
    units: [
      { value: 'cup', label: 'Cup', plural: 'Cups', symbol: 'c' },
      { value: 'ml', label: 'Milliliter', plural: 'Milliliters', symbol: 'ml' },
      { value: 'l', label: 'Liter', plural: 'Liters', symbol: 'L' },
      { value: 'tbsp', label: 'Tablespoon', plural: 'Tablespoons', symbol: 'tbsp' },
      { value: 'tsp', label: 'Teaspoon', plural: 'Teaspoons', symbol: 'tsp' },
    ],
  },
  weight: {
    label: 'Weight',
    units: [
      { value: 'g', label: 'Gram', plural: 'Grams', symbol: 'g' },
      { value: 'kg', label: 'Kilogram', plural: 'Kilograms', symbol: 'kg' },
      { value: 'oz', label: 'Ounce', plural: 'Ounces', symbol: 'oz' },
      { value: 'lb', label: 'Pound', plural: 'Pounds', symbol: 'lb' },
    ],
  },
  count: {
    label: 'Count',
    units: [
      { value: 'piece', label: 'Piece', plural: 'Pieces', symbol: 'pcs' },
      { value: 'treat', label: 'Treat', plural: 'Treats', symbol: 'treats' },
      { value: 'kibble', label: 'Kibble', plural: 'Kibbles', symbol: 'kibbles' },
      { value: 'scoop', label: 'Scoop', plural: 'Scoops', symbol: 'scoops' },
    ],
  },
  serving: {
    label: 'Serving',
    units: [
      { value: 'portion', label: 'Portion', plural: 'Portions', symbol: 'portions' },
      { value: 'meal', label: 'Meal', plural: 'Meals', symbol: 'meals' },
      { value: 'serving', label: 'Serving', plural: 'Servings', symbol: 'servings' },
      { value: 'bowl', label: 'Bowl', plural: 'Bowls', symbol: 'bowls' },
    ],
  },
} as const;

// Flatten all units for easy lookup
type UnitItem = { value: string; label: string; plural: string; symbol: string };
const ALL_UNITS: UnitItem[] = [
  ...UNIT_CATEGORIES.volume.units,
  ...UNIT_CATEGORIES.weight.units,
  ...UNIT_CATEGORIES.count.units,
  ...UNIT_CATEGORIES.serving.units,
] as UnitItem[];


// Portion block configuration
interface PortionBlockConfig {
  defaultUnit?: string;
  allowedUnits?: string[];
  showBrandSelector?: boolean;
  requireBrand?: boolean;
  petId?: number;
  step?: number;
  hint?: string;
  presetAmounts?: number[];
  showNotes?: boolean;
  category?: 'food' | 'treats' | 'medication' | 'grooming' | 'toys'; // Brand memory category
}

// PortionBlock component for portion tracking with units and brand memory (supports food, treats, medication, etc.)
const PortionBlock: React.FC<BlockProps<PortionBlockConfig>> = ({
  control,
  name,
  label = 'Portion',
  required = false,
  config = {},
}) => {
  const fieldName = name;
  const {
    defaultUnit = 'cup',
    category = 'food', // Default to 'food' if not specified
  } = config;

  return (
    <Controller
      control={control}
      name={fieldName}
      rules={{
        required: required ? `${label} is required` : false,
        validate: (value: unknown) => {
          const typedValue = value as PortionValue | undefined;

          // Check if value exists
          if (!typedValue || typeof typedValue !== 'object') {
            if (required) {
              return `${label} is required`;
            }
            return true;
          }

          const amount = typedValue.amount;

          // Required field validation
          if (required) {
            if (amount === undefined || amount === null || amount === 0) {
              return `${label} is required and must be greater than 0`;
            }
          }

          // Type validation - must be a valid number
          if (typeof amount !== 'number' || isNaN(amount)) {
            return 'Please enter a valid number';
          }

          // Must be greater than 0
          if (amount <= 0) {
            return `${label} must be greater than 0`;
          }

          return true;
        },
      }}
      render={({ field }) => {
        const currentValue: PortionValue | undefined = field.value as unknown as PortionValue | undefined;

        // Brand/Product memory management
        const { brands, products, addBrand, removeBrand, addProduct, removeProduct } = useBrandProductMemory(category);

        // Initialize default value
        React.useEffect(() => {
          if (!currentValue) {
            field.onChange({
              amount: 0,
              unit: defaultUnit,
            });
          }
        }, [currentValue, field, defaultUnit]);

        // Track input state separately for better UX
        const [inputValue, setInputValue] = React.useState<string>('');

        // Sync input value with field value
        React.useEffect(() => {
          if (currentValue?.amount !== undefined) {
            setInputValue(currentValue.amount.toString());
          }
        }, [currentValue?.amount]);

        // Handle amount change
        const handleAmountChange = React.useCallback((newAmount: number) => {
          const updatedValue: PortionValue = {
            ...currentValue,
            amount: Math.max(0, newAmount), // Ensure non-negative
            unit: currentValue?.unit || defaultUnit,
          };
          field.onChange(updatedValue);
        }, [currentValue, field, defaultUnit]);

        // Handle unit change
        const handleUnitChange = React.useCallback((newUnit: string) => {
          const updatedValue: PortionValue = {
            ...currentValue,
            amount: currentValue?.amount || 0,
            unit: newUnit,
          };
          field.onChange(updatedValue);
        }, [currentValue, field]);

        // Handle brand change
        const handleBrandChange = React.useCallback((brand: string) => {
          const updatedValue: PortionValue = {
            ...currentValue,
            amount: currentValue?.amount || 0,
            unit: currentValue?.unit || defaultUnit,
            brand: brand || undefined,
            product: currentValue?.product,
          };
          field.onChange(updatedValue);
        }, [currentValue, field, defaultUnit]);

        // Handle product change
        const handleProductChange = React.useCallback((product: string) => {
          const updatedValue: PortionValue = {
            ...currentValue,
            amount: currentValue?.amount || 0,
            unit: currentValue?.unit || defaultUnit,
            brand: currentValue?.brand,
            product: product || undefined,
          };
          field.onChange(updatedValue);
        }, [currentValue, field, defaultUnit]);

        // Quick increment/decrement
        const incrementAmount = () => {
          const step = config?.step || 0.25;
          handleAmountChange((currentValue?.amount || 0) + step);
        };

        const decrementAmount = () => {
          const step = config?.step || 0.25;
          handleAmountChange(Math.max(0, (currentValue?.amount || 0) - step));
        };

        // Format amount display
        const formatAmount = (amount: number) => {
          return amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
        };

        // Get unit display info
        const getUnitInfo = (unitValue: string) => {
          return ALL_UNITS.find(unit => unit.value === unitValue);
        };

        const currentUnit = currentValue?.unit ? getUnitInfo(currentValue.unit) : null;
        const displayAmount = currentValue?.amount || 0;

        return (
          <div className="space-y-2">
            {/* Hint */}
            <p className="text-xs text-muted-foreground">
              {config?.hint || 'Enter the portion amount and select appropriate unit'}
            </p>

            {/* Error message - Removed: errors shown at form level only */}

            <div className="space-y-4">
              {/* Amount and unit input */}
              <div className="flex items-center gap-2">
                {/* Decrement button */}
                <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={decrementAmount}
            disabled={displayAmount <= 0}
            className="h-10 w-10 p-0"
            aria-label="Decrease amount"
          >
            <Minus className="w-4 h-4" />
          </Button>

          {/* Amount input */}
          <div className="flex-1 relative">
            <Input
              type="number"
              step={config?.step || 0.25}
              min={0}
              value={inputValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setInputValue(newValue); // Update input state immediately for responsive UX

                // Parse and update form value
                if (newValue === '' || newValue === '-') {
                  // Allow empty/negative sign temporarily - don't update form yet
                  return;
                }

                const parsed = parseFloat(newValue);
                if (!isNaN(parsed)) {
                  handleAmountChange(parsed);
                }
              }}
              onBlur={(e) => {
                // On blur, ensure we have a valid value
                const finalValue = e.target.value;
                if (finalValue === '' || finalValue === '-') {
                  handleAmountChange(0);
                  setInputValue('0');
                } else {
                  const parsed = parseFloat(finalValue);
                  if (isNaN(parsed)) {
                    handleAmountChange(0);
                    setInputValue('0');
                  }
                }
              }}
              className="text-center text-lg font-medium"
              placeholder="0"
              aria-label="Portion amount"
            />
          </div>

          {/* Increment button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={incrementAmount}
            className="h-10 w-10 p-0"
            aria-label="Increase amount"
          >
            <Plus className="w-4 h-4" />
          </Button>

          {/* Unit selector */}
          <Select value={currentValue?.unit || 'cup'} onValueChange={handleUnitChange}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(UNIT_CATEGORIES).map(([categoryKey, category]) => (
                <div key={categoryKey}>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    {category.label}
                  </div>
                  {category.units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label} ({unit.symbol})
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>


        {/* Brand/Product section - parallel dropdowns */}
        <div className="space-y-3 border-t pt-3">
          <label className="text-sm font-medium">Brand & Product</label>

          <div className="grid grid-cols-2 gap-3">
            {/* Brand selector */}
            <EditableSelect
              value={currentValue?.brand || ''}
              onValueChange={handleBrandChange}
              options={brands}
              onAddOption={addBrand}
              onRemoveOption={removeBrand}
              placeholder="Select or enter a new brand..."
              className="flex-1"
            />

            {/* Product selector */}
            <EditableSelect
              value={currentValue?.product || ''}
              onValueChange={handleProductChange}
              options={products}
              onAddOption={addProduct}
              onRemoveOption={removeProduct}
              placeholder="Select or enter a new product..."
              className="flex-1"
            />
          </div>
        </div>

        {/* Quick preset amounts if configured */}
        {config?.presetAmounts && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Quick Amounts</div>
            <div className="flex flex-wrap gap-2">
              {config?.presetAmounts?.map((amount: number) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAmountChange(amount)}
                  className={`text-xs ${
                    currentValue?.amount === amount ? 'bg-primary/10 border-primary' : ''
                  }`}
                >
                  {formatAmount(amount)} {currentUnit?.symbol}
                </Button>
              ))}
            </div>
          </div>
        )}
            </div>
          </div>
        );
      }}
    />
  );
};

export default PortionBlock;