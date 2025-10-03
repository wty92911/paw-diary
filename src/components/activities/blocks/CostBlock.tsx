 
 
/* TODO: Refactor to move hooks outside Controller render function */

import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Receipt, Plus } from 'lucide-react';
import { type BlockProps } from '../../../lib/types/activities';
import { Field } from './Field';

// Cost value interface
interface CostValue {
  amount: number;
  currency: string;
  category?: string; // Expense category
  description?: string; // Optional description
  isRecurring?: boolean; // If this is a recurring cost
  taxIncluded?: boolean; // Whether tax is included
}

// Currency configurations with symbols and formatting
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-EU' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won', locale: 'ko-KR' },
] as const;

// Expense categories for pet-related costs
const EXPENSE_CATEGORIES = {
  medical: {
    label: 'Medical & Health',
    icon: '🏥',
    subcategories: ['Vet Visit', 'Surgery', 'Medication', 'Vaccination', 'Emergency Care', 'Dental Care'],
  },
  food: {
    label: 'Food & Nutrition',
    icon: '🍽️',
    subcategories: ['Dry Food', 'Wet Food', 'Treats', 'Supplements', 'Special Diet'],
  },
  grooming: {
    label: 'Grooming & Care',
    icon: '✂️',
    subcategories: ['Professional Grooming', 'Nail Trim', 'Bath Products', 'Grooming Tools'],
  },
  supplies: {
    label: 'Supplies & Equipment',
    icon: '🛍️',
    subcategories: ['Toys', 'Bedding', 'Leash & Collar', 'Carrier', 'Feeding Bowls', 'Cleaning Supplies'],
  },
  services: {
    label: 'Services',
    icon: '🏃',
    subcategories: ['Dog Walking', 'Pet Sitting', 'Training', 'Boarding', 'Insurance'],
  },
  other: {
    label: 'Other',
    icon: '📋',
    subcategories: ['License & Registration', 'Travel', 'Miscellaneous'],
  },
} as const;

// Cost block configuration
interface CostBlockConfig {
  defaultCurrency?: string;
  allowedCurrencies?: string[];
  showCategories?: boolean;
  requireCategory?: boolean;
  showAdvanced?: boolean;
  quickAmounts?: number[];
  hint?: string;
}

// CostBlock component for expense tracking with currency and categories
const CostBlock: React.FC<BlockProps<CostBlockConfig>> = ({
  control,
  name,
  label = 'Cost',
  required = false,
  config = {},
}) => {
  const fieldName = name;
  const {
    defaultCurrency = 'USD',
    showAdvanced = false,
  } = config;

  return (
    <Controller
      control={control}
      name={fieldName}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field, fieldState: { error } }) => {
        const currentValue: CostValue | undefined = field.value as unknown as CostValue | undefined;
        
        // State management
        const [, setShowAdvanced] = React.useState(showAdvanced);
        const [customCategory, setCustomCategory] = React.useState('');

        // Initialize default value
        React.useEffect(() => {
          if (!currentValue) {
            field.onChange({
              amount: 0,
              currency: defaultCurrency,
            });
          }
        }, [currentValue, field, defaultCurrency]);

        // Handle amount change
        const handleAmountChange = React.useCallback((newAmount: number) => {
          const updatedValue: CostValue = {
            ...currentValue,
            amount: Math.max(0, newAmount), // Ensure non-negative
            currency: currentValue?.currency || defaultCurrency,
          };
          field.onChange(updatedValue);
        }, [currentValue, field, defaultCurrency]);

        // Handle currency change
        const handleCurrencyChange = React.useCallback((newCurrency: string) => {
          const updatedValue: CostValue = {
            ...currentValue,
            amount: currentValue?.amount || 0,
            currency: newCurrency,
          };
          field.onChange(updatedValue);
        }, [currentValue, field]);

        // Handle category change
        const handleCategoryChange = React.useCallback((newCategory: string) => {
          const updatedValue: CostValue = {
            ...currentValue,
            amount: currentValue?.amount || 0,
            currency: currentValue?.currency || defaultCurrency,
            category: newCategory,
          };
          field.onChange(updatedValue);
        }, [currentValue, field, defaultCurrency]);

        // Handle description change
        const handleDescriptionChange = React.useCallback((description: string) => {
          const updatedValue: CostValue = {
            ...currentValue,
            amount: currentValue?.amount || 0,
            currency: currentValue?.currency || defaultCurrency,
            description: description || undefined,
          };
          field.onChange(updatedValue);
        }, [currentValue, field, defaultCurrency]);

        // Handle advanced options
        const handleAdvancedToggle = React.useCallback((fieldKey: 'isRecurring' | 'taxIncluded', value: boolean) => {
          const updatedValue: CostValue = {
            ...currentValue,
            amount: currentValue?.amount || 0,
            currency: currentValue?.currency || defaultCurrency,
            [fieldKey]: value,
          };
          field.onChange(updatedValue);
        }, [currentValue, field, defaultCurrency]);

        // Add custom category
        const handleAddCustomCategory = React.useCallback(() => {
          if (customCategory.trim()) {
            handleCategoryChange(customCategory.trim());
            setCustomCategory('');
          }
        }, [customCategory, handleCategoryChange]);

        // Format currency amount
        const formatCurrency = (amount: number, currencyCode: string): string => {
          const currency = CURRENCIES.find(c => c.code === currencyCode);
          if (!currency) return `${amount}`;

          try {
            return new Intl.NumberFormat(currency.locale, {
              style: 'currency',
              currency: currencyCode,
            }).format(amount);
          } catch {
            return `${currency.symbol}${amount.toFixed(2)}`;
          }
        };

        // Get currency info
        const getCurrentCurrency = () => {
          return CURRENCIES.find(c => c.code === currentValue?.currency) || CURRENCIES[0];
        };

        // Quick amount presets
        const quickAmounts = config?.quickAmounts || [5, 10, 25, 50, 100];

        const currentCurrency = getCurrentCurrency();
        const displayAmount = currentValue?.amount || 0;

        return (
          <Field
            label={label}
            required={required}
            error={error?.message}
            hint={config?.hint || 'Enter the cost amount and select currency'}
            blockType="cost"
            id={`cost-${fieldName}`}
          >
            <div className="space-y-4">
              {/* Amount and currency input */}
              <div className="flex items-center gap-2">
                {/* Currency selector */}
                <Select 
            value={currentValue?.currency || 'USD'} 
            onValueChange={handleCurrencyChange}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-2">
                    <span>{currency.symbol}</span>
                    <span className="text-xs text-muted-foreground">{currency.code}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Amount input */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {currentCurrency.symbol}
            </div>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={displayAmount}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              className="pl-8 text-lg font-medium"
              placeholder="0.00"
              aria-label="Cost amount"
            />
          </div>
        </div>

        {/* Formatted amount display */}
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(displayAmount, currentValue?.currency || 'USD')}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentCurrency.name}
          </div>
        </div>

        {/* Quick amount buttons */}
        {quickAmounts.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Quick Amounts</div>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amount: number) => (
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
                  {currentCurrency.symbol}{amount}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Expense category */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Category</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              More Options
            </Button>
          </div>

          <Select 
            value={currentValue?.category || ''} 
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select expense category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EXPENSE_CATEGORIES).map(([key, category]) => (
                <div key={key}>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <span>{category.icon}</span>
                    {category.label}
                  </div>
                  {category.subcategories.map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>

          {/* Custom category input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Custom category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomCategory}
              disabled={!customCategory.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Advanced options */}
        {showAdvanced && (
          <div className="space-y-4 border-t pt-4">
            <div className="text-sm font-medium">Additional Details</div>
            
            {/* Description */}
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                type="text"
                placeholder="Add notes about this expense..."
                value={currentValue?.description || ''}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentValue?.isRecurring || false}
                  onChange={(e) => handleAdvancedToggle('isRecurring', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">This is a recurring expense</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentValue?.taxIncluded || false}
                  onChange={(e) => handleAdvancedToggle('taxIncluded', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Tax included in amount</span>
              </label>
            </div>
          </div>
        )}

        {/* Current selection summary */}
        {(currentValue?.category || currentValue?.description) && (
          <div className="bg-muted/30 rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Expense Details</span>
            </div>

            {currentValue.category && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {currentValue.category}
                </Badge>
                {currentValue.isRecurring && (
                  <Badge variant="secondary" className="text-xs">
                    Recurring
                  </Badge>
                )}
                {currentValue.taxIncluded && (
                  <Badge variant="secondary" className="text-xs">
                    Tax Included
                  </Badge>
                )}
              </div>
            )}

            {currentValue.description && (
              <p className="text-sm text-muted-foreground">
                {currentValue.description}
              </p>
            )}
          </div>
        )}
          </div>
          </Field>
        );
      }}
    />
  );
};

export default CostBlock;