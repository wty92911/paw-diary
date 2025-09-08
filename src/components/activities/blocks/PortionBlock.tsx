import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Plus, Minus, Package } from 'lucide-react';
import { BlockProps } from '../../../lib/types/activities';
import { useBrandSuggestions } from '../../../hooks/useBrandMemory';

// Portion value interface
interface PortionValue {
  amount: number;
  unit: string;
  brand?: string; // Optional brand/product name
  product?: string; // Specific product name
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
    showBrandSelector = true,
    petId,
    category = 'food', // Default to 'food' if not specified
  } = config;

  return (
    <Controller
      control={control}
      name={fieldName}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field, fieldState: { error } }) => {
        const currentValue: PortionValue | undefined = field.value;
        
        // State for brand/product selection
        const [showBrandSelectorState, setShowBrandSelectorState] = React.useState(showBrandSelector);
        const [customBrand, setCustomBrand] = React.useState('');
        const [customProduct, setCustomProduct] = React.useState('');
        
        // Brand memory integration
        const { suggestions: brandSuggestions, recordUsage } = useBrandSuggestions(
          petId || 0, 
          category // Use configurable category (food, treats, medication, grooming, toys)
        );

        // Initialize default value
        React.useEffect(() => {
          if (!currentValue) {
            field.onChange({
              amount: 0,
              unit: defaultUnit,
            });
          }
        }, [currentValue, field, defaultUnit]);

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

        // Handle brand/product selection
        const handleBrandSelect = React.useCallback((brand: string, product: string) => {
          const updatedValue: PortionValue = {
            ...currentValue,
            amount: currentValue?.amount || 0,
            unit: currentValue?.unit || defaultUnit,
            brand,
            product,
          };
          field.onChange(updatedValue);
          setShowBrandSelectorState(false);
          // Record usage for learning
          recordUsage(brand, product);
        }, [currentValue, field, defaultUnit, recordUsage]);

        // Handle custom brand/product
        const handleCustomBrandSubmit = React.useCallback(() => {
          if (customBrand.trim()) {
            handleBrandSelect(customBrand.trim(), customProduct.trim() || 'Custom Product');
            setCustomBrand('');
            setCustomProduct('');
          }
        }, [customBrand, customProduct, handleBrandSelect]);

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
            
            {/* Error message */}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error.message}
              </p>
            )}
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
              value={displayAmount}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
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

        {/* Amount display with unit */}
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {formatAmount(displayAmount)}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentUnit?.label && displayAmount !== 1 
              ? currentUnit.plural 
              : currentUnit?.label || 'Units'}
          </div>
        </div>

        {/* Brand/Product section */}
        <div className="space-y-3 border-t pt-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Brand & Product</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBrandSelectorState(!showBrandSelectorState)}
              className="text-xs"
            >
              <Package className="w-3 h-3 mr-1" />
              {currentValue?.brand ? 'Change' : 'Add Brand'}
            </Button>
          </div>

          {/* Current brand/product display */}
          {currentValue?.brand && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <Package className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 text-sm">
                <div className="font-medium">{currentValue.brand}</div>
                {currentValue.product && (
                  <div className="text-muted-foreground">{currentValue.product}</div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const updatedValue = { ...currentValue };
                  delete updatedValue.brand;
                  delete updatedValue.product;
                  field.onChange(updatedValue);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </Button>
            </div>
          )}

          {/* Brand selector */}
          {showBrandSelectorState && (
            <div className="space-y-3 p-3 border rounded-md bg-muted/30">
              <div className="text-sm font-medium">Recent Brands</div>
              
              {/* Brand memory suggestions */}
              {brandSuggestions.length > 0 && (
                <div className="space-y-2">
                  {brandSuggestions.slice(0, 5).map((suggestion) => (
                    <Button
                      key={suggestion.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleBrandSelect(suggestion.brand, suggestion.product || 'Generic Product')}
                      className={`w-full justify-start text-left ${
                        suggestion.isFrequent ? 'border-blue-300 bg-blue-50 hover:bg-blue-100' : ''
                      } ${
                        suggestion.isRecent ? 'border-green-300 bg-green-50 hover:bg-green-100' : ''
                      }`}
                      title={`Used ${suggestion.usageCount} times, last used ${suggestion.lastUsed.toLocaleDateString()}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <div className="font-medium text-sm">{suggestion.brand}</div>
                          {suggestion.isFrequent && <span className="text-blue-600 text-xs">★</span>}
                          {suggestion.isRecent && <span className="text-green-600 text-xs">●</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{suggestion.product || 'Generic Product'}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.floor((Date.now() - suggestion.lastUsed.getTime()) / (24 * 60 * 60 * 1000))}d ago
                      </Badge>
                    </Button>
                  ))}
                </div>
              )}

              {/* Custom brand input */}
              <div className="space-y-2 border-t pt-2">
                <div className="text-sm font-medium">Add New Brand</div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Brand name (e.g., Hill's Science Diet)"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    type="text"
                    placeholder="Product name (optional)"
                    value={customProduct}
                    onChange={(e) => setCustomProduct(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCustomBrandSubmit}
                      disabled={!customBrand.trim()}
                      className="flex-1"
                    >
                      Add Brand
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBrandSelectorState(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
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