import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  ActivityCategory,
  ActivityFilters as ActivityFiltersType,
  ACTIVITY_CATEGORIES,
  ACTIVITY_CATEGORY_OPTIONS,
} from '../../lib/types';
import {
  Filter,
  Search,
  Calendar,
  DollarSign,
  Paperclip,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ActivityFiltersProps {
  filters: ActivityFiltersType;
  onFiltersChange: (filters: ActivityFiltersType) => void;
  totalCount?: number;
  filteredCount?: number;
  className?: string;
}

// Debounce hook for search input
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Quick date range options
const DATE_RANGE_PRESETS = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    },
  },
  {
    label: 'This Week',
    getValue: () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0],
      };
    },
  },
  {
    label: 'This Month',
    getValue: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    },
  },
  {
    label: 'Last 30 Days',
    getValue: () => {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      const end = new Date(today);
      end.setDate(end.getDate() + 1);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    },
  },
];

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  filters,
  onFiltersChange,
  totalCount = 0,
  filteredCount = 0,
  className = '',
}) => {
  const [searchInput, setSearchInput] = useState(filters.search_query || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [costMin, setCostMin] = useState(filters.cost_range?.min?.toString() || '');
  const [costMax, setCostMax] = useState(filters.cost_range?.max?.toString() || '');

  // Debounce search query
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== (filters.search_query || '')) {
      onFiltersChange({
        ...filters,
        search_query: debouncedSearch || undefined,
      });
    }
  }, [debouncedSearch, filters, onFiltersChange]);

  // Handle category filter changes
  const handleCategoryChange = useCallback(
    (category: ActivityCategory, checked: boolean) => {
      const currentCategories = filters.category || [];
      const newCategories = checked
        ? [...currentCategories, category]
        : currentCategories.filter(c => c !== category);

      onFiltersChange({
        ...filters,
        category: newCategories.length > 0 ? newCategories : undefined,
      });
    },
    [filters, onFiltersChange],
  );

  // Handle date range changes
  const handleDateRangeChange = useCallback(
    (start?: string, end?: string) => {
      onFiltersChange({
        ...filters,
        date_range: start && end ? { start, end } : undefined,
      });
    },
    [filters, onFiltersChange],
  );

  // Handle date range preset selection
  const handleDatePreset = useCallback(
    (preset: (typeof DATE_RANGE_PRESETS)[0]) => {
      const { start, end } = preset.getValue();
      handleDateRangeChange(start, end);
    },
    [handleDateRangeChange],
  );

  // Handle cost range changes
  const handleCostRangeChange = useCallback(() => {
    const min = costMin ? parseFloat(costMin) : undefined;
    const max = costMax ? parseFloat(costMax) : undefined;

    // Only set cost_range if both values are provided
    const costRange = min !== undefined && max !== undefined ? { min, max } : undefined;

    onFiltersChange({
      ...filters,
      cost_range: costRange,
    });
  }, [costMin, costMax, filters, onFiltersChange]);

  // Handle cost input changes with validation
  const handleCostMinChange = useCallback((value: string) => {
    // Allow empty, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCostMin(value);
    }
  }, []);

  const handleCostMaxChange = useCallback((value: string) => {
    // Allow empty, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCostMax(value);
    }
  }, []);

  // Handle attachment filter toggle
  const handleAttachmentFilter = useCallback(
    (hasAttachments: boolean) => {
      onFiltersChange({
        ...filters,
        has_attachments: hasAttachments ? true : undefined,
      });
    },
    [filters, onFiltersChange],
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    setCostMin('');
    setCostMax('');
    onFiltersChange({});
  }, [onFiltersChange]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search_query) count++;
    if (filters.category && filters.category.length > 0) count++;
    if (filters.date_range) count++;
    if (filters.cost_range) count++;
    if (filters.has_attachments) count++;
    if (filters.subcategory && filters.subcategory.length > 0) count++;
    return count;
  }, [filters]);

  // Check if any category is selected
  const selectedCategories = filters.category || [];

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-base">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter results summary */}
            {totalCount > 0 && (
              <span className="text-sm text-gray-600">
                {filteredCount} of {totalCount}
              </span>
            )}

            {/* Clear filters */}
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="h-8 px-3">
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}

            {/* Expand/collapse toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Search Input - Always visible */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="search">Search Activities</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              id="search"
              type="text"
              placeholder="Search by title, description, or notes..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Expanded filters */}
        {isExpanded && (
          <div className="space-y-6">
            {/* Category Filters */}
            <div className="space-y-3">
              <Label>Categories</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ACTIVITY_CATEGORY_OPTIONS.map(option => {
                  const isSelected = selectedCategories.includes(option.value);
                  const categoryConfig = ACTIVITY_CATEGORIES[option.value];

                  return (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Checkbox
                        id={`category-${option.value}`}
                        checked={isSelected}
                        onCheckedChange={checked =>
                          handleCategoryChange(option.value, checked === true)
                        }
                      />
                      <label
                        htmlFor={`category-${option.value}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full`}
                            style={{
                              backgroundColor:
                                categoryConfig.color === 'red'
                                  ? '#ef4444'
                                  : categoryConfig.color === 'green'
                                    ? '#10b981'
                                    : categoryConfig.color === 'orange'
                                      ? '#f59e0b'
                                      : categoryConfig.color === 'blue'
                                        ? '#3b82f6'
                                        : categoryConfig.color === 'purple'
                                          ? '#8b5cf6'
                                          : '#6b7280',
                            }}
                          />
                          {option.label}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="space-y-3">
              <Label>Date Range</Label>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mb-3">
                {DATE_RANGE_PRESETS.map(preset => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDatePreset(preset)}
                    className="h-8 px-3 text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Custom date range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="date-start" className="text-xs">
                    From
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="date-start"
                      type="date"
                      value={filters.date_range?.start || ''}
                      onChange={e => handleDateRangeChange(e.target.value, filters.date_range?.end)}
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="date-end" className="text-xs">
                    To
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="date-end"
                      type="date"
                      value={filters.date_range?.end || ''}
                      onChange={e =>
                        handleDateRangeChange(filters.date_range?.start, e.target.value)
                      }
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Clear date range */}
              {filters.date_range && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateRangeChange()}
                  className="h-7 px-3 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Date Range
                </Button>
              )}
            </div>

            {/* Cost Range Filters */}
            <div className="space-y-3">
              <Label>Cost Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cost-min" className="text-xs">
                    Minimum
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="cost-min"
                      type="text"
                      placeholder="0.00"
                      value={costMin}
                      onChange={e => handleCostMinChange(e.target.value)}
                      onBlur={handleCostRangeChange}
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cost-max" className="text-xs">
                    Maximum
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="cost-max"
                      type="text"
                      placeholder="999.99"
                      value={costMax}
                      onChange={e => handleCostMaxChange(e.target.value)}
                      onBlur={handleCostRangeChange}
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="space-y-3">
              <Label>Additional Filters</Label>

              {/* Has attachments filter */}
              <div className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200">
                <Checkbox
                  id="has-attachments"
                  checked={filters.has_attachments || false}
                  onCheckedChange={checked => handleAttachmentFilter(checked === true)}
                />
                <label
                  htmlFor="has-attachments"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <Paperclip className="h-4 w-4 text-gray-500" />
                  Has Attachments
                </label>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
