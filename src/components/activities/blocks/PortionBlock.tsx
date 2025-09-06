import React from 'react';
import { Control, FieldError } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Plus, Minus, Package } from 'lucide-react';
import { ActivityFormData, ActivityBlockDef } from '../../../lib/types/activities';
import { Field } from './Field';
import { useFormContext } from './FormContext';

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

// Mock brand memory - would be replaced with actual brand memory hook
const getMockBrandMemory = (_petId?: number): Array<{ brand: string; product: string; lastUsed: Date }> => [
  { brand: 'Hill\'s Science Diet', product: 'Adult Dry Food', lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { brand: 'Royal Canin', product: 'Small Breed Adult', lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { brand: 'Blue Buffalo', product: 'Life Protection Formula', lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
];

// Portion block specific props
interface PortionBlockProps {
  block: ActivityBlockDef & { type: 'portion' };
  control?: Control<ActivityFormData>;
  error?: FieldError;
}

// PortionBlock component for food portion tracking with units and brand memory
const PortionBlock: React.FC<PortionBlockProps> = ({
  block,
  error,
}) => {
  const { watch, setValue, petId } = useFormContext();
  const fieldName = `blocks.${block.id}` as const;
  const currentValue: PortionValue | undefined = watch(fieldName);

  // State for brand/product selection
  const [showBrandSelector, setShowBrandSelector] = React.useState(false);
  const [customBrand, setCustomBrand] = React.useState('');
  const [customProduct, setCustomProduct] = React.useState('');

  // Mock brand memory
  const brandMemory = React.useMemo(() => getMockBrandMemory(petId), [petId]);

  // Initialize default value
  React.useEffect(() => {
    if (!currentValue) {
      const defaultUnit = block.config?.defaultUnit || 'cup';
      setValue(fieldName, {
        amount: 0,
        unit: defaultUnit,
      });
    }
  }, [currentValue, fieldName, setValue, block.config?.defaultUnit]);

  // Handle amount change
  const handleAmountChange = React.useCallback((newAmount: number) => {
    const updatedValue: PortionValue = {
      ...currentValue,
      amount: Math.max(0, newAmount), // Ensure non-negative
      unit: currentValue?.unit || 'cup',
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue]);

  // Handle unit change
  const handleUnitChange = React.useCallback((newUnit: string) => {
    const updatedValue: PortionValue = {
      ...currentValue,
      amount: currentValue?.amount || 0,
      unit: newUnit,
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue]);

  // Handle brand/product selection
  const handleBrandSelect = React.useCallback((brand: string, product: string) => {
    const updatedValue: PortionValue = {
      ...currentValue,
      amount: currentValue?.amount || 0,
      unit: currentValue?.unit || 'cup',
      brand,
      product,
    };
    setValue(fieldName, updatedValue);
    setShowBrandSelector(false);
  }, [currentValue, fieldName, setValue]);

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
    const step = block.config?.step || 0.25;
    handleAmountChange((currentValue?.amount || 0) + step);
  };

  const decrementAmount = () => {
    const step = block.config?.step || 0.25;
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
    <Field
      label={block.label}
      required={block.required}
      error={error?.message}
      hint={block.config?.hint || 'Enter the portion amount and select appropriate unit'}
      blockType="portion"
      id={`portion-${block.id}`}
    >
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
              step={block.config?.step || 0.25}
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
              onClick={() => setShowBrandSelector(!showBrandSelector)}
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
                  setValue(fieldName, updatedValue);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </Button>
            </div>
          )}

          {/* Brand selector */}
          {showBrandSelector && (
            <div className="space-y-3 p-3 border rounded-md bg-muted/30">
              <div className="text-sm font-medium">Recent Brands</div>
              
              {/* Brand memory list */}
              {brandMemory.length > 0 && (
                <div className="space-y-2">
                  {brandMemory.slice(0, 3).map((item, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleBrandSelect(item.brand, item.product)}
                      className="w-full justify-start text-left"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.brand}</div>
                        <div className="text-xs text-muted-foreground">{item.product}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.floor((Date.now() - item.lastUsed.getTime()) / (24 * 60 * 60 * 1000))}d ago
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
                      onClick={() => setShowBrandSelector(false)}
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
        {block.config?.presetAmounts && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Quick Amounts</div>
            <div className="flex flex-wrap gap-2">
              {block.config.presetAmounts.map((amount: number) => (
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
    </Field>
  );
};

export default PortionBlock;