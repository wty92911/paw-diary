import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { ActivityCategory } from '../../lib/types/activities';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';

export interface ActivityFilters {
  categories: ActivityCategory[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  searchQuery: string;
  hasAttachments?: boolean;
  costRange?: {
    min?: number;
    max?: number;
  };
}

interface FilterBarProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  mode?: 'full' | 'simplified';
  className?: string;
  petId?: number; // For filter persistence
}

const CATEGORY_OPTIONS = [
  { value: ActivityCategory.Health, label: 'Health', color: 'bg-red-100 text-red-800' },
  { value: ActivityCategory.Growth, label: 'Growth', color: 'bg-green-100 text-green-800' },
  { value: ActivityCategory.Diet, label: 'Diet', color: 'bg-yellow-100 text-yellow-800' },
  { value: ActivityCategory.Lifestyle, label: 'Lifestyle', color: 'bg-blue-100 text-blue-800' },
  { value: ActivityCategory.Expense, label: 'Expense', color: 'bg-purple-100 text-purple-800' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'Last 3 Months' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

/**
 * FilterBar - Independent component for activity filtering and search
 * 
 * Features:
 * - Category filtering with multi-select
 * - Date range filtering with presets
 * - Text search functionality
 * - Attachment and cost filtering
 * - Filter persistence per pet context
 * - Full and simplified modes for different use cases
 * 
 * Modes:
 * - full: Complete filtering interface for ActivitiesListPage
 * - simplified: Basic filtering for PetProfile activity preview
 */
export function FilterBar({
  filters,
  onFiltersChange,
  mode = 'full',
  className,
  petId,
}: FilterBarProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Load persisted filters on mount
  useEffect(() => {
    if (petId && mode === 'full') {
      const stored = localStorage.getItem(`activity-filters-${petId}`);
      if (stored) {
        try {
          const storedFilters = JSON.parse(stored);
          // Only apply non-search filters to avoid overriding current search
          onFiltersChange({
            ...storedFilters,
            searchQuery: filters.searchQuery,
          });
        } catch (error) {
          console.warn('Failed to load stored filters:', error);
        }
      }
    }
  }, [petId, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist filters when they change
  useEffect(() => {
    if (petId && mode === 'full') {
      localStorage.setItem(`activity-filters-${petId}`, JSON.stringify(filters));
    }
  }, [filters, petId, mode]);

  // Update search query
  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchQuery: value,
    });
  };

  // Update category filters
  const handleCategoryToggle = (category: ActivityCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({
      ...filters,
      categories: newCategories,
    });
  };

  // Update date range
  const handleDateRangeChange = (value: string) => {
    let dateRange: { start?: Date; end?: Date } | undefined;
    const now = new Date();

    switch (value) {
      case 'today':
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
        };
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        dateRange = { start: weekStart, end: now };
        break;
      case 'month':
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: now,
        };
        break;
      case 'quarter':
        const quarterStart = new Date(now);
        quarterStart.setMonth(now.getMonth() - 3);
        dateRange = { start: quarterStart, end: now };
        break;
      case 'year':
        dateRange = {
          start: new Date(now.getFullYear(), 0, 1),
          end: now,
        };
        break;
      case 'all':
        dateRange = undefined;
        break;
    }

    onFiltersChange({
      ...filters,
      dateRange,
    });
  };

  // Toggle attachment filter
  const handleAttachmentsToggle = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      hasAttachments: checked ? true : undefined,
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    onFiltersChange({
      categories: [],
      searchQuery: '',
      dateRange: undefined,
      hasAttachments: undefined,
      costRange: undefined,
    });
  };

  // Count active filters
  const activeFilterCount = 
    filters.categories.length +
    (filters.dateRange ? 1 : 0) +
    (filters.hasAttachments ? 1 : 0) +
    (filters.costRange ? 1 : 0);

  return (
    <Card className={cn('border-orange-200 bg-orange-50/30', className)}>
      <CardContent className="p-4 space-y-4">
        {/* Search Bar - Always visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search activities..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-400"
          />
          {filters.searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        {mode === 'full' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DropdownMenu open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-orange-300">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-orange-200 text-orange-800">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-4 space-y-4">
                  {/* Category Filter */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Categories</h4>
                    <div className="space-y-2">
                      {CATEGORY_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${option.value}`}
                            checked={filters.categories.includes(option.value)}
                            onCheckedChange={() => handleCategoryToggle(option.value)}
                          />
                          <label
                            htmlFor={`category-${option.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            <Badge variant="outline" className={cn('text-xs', option.color)}>
                              {option.label}
                            </Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Date Range</h4>
                    <Select onValueChange={handleDateRangeChange}>
                      <SelectTrigger className="w-full">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_RANGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Additional Filters */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has-attachments"
                        checked={!!filters.hasAttachments}
                        onCheckedChange={handleAttachmentsToggle}
                      />
                      <label
                        htmlFor="has-attachments"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Has attachments
                      </label>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

            </div>

            {/* Active Filter Display */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span>{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Quick Date Range - Simplified Mode */}
        {mode === 'simplified' && (
          <div className="flex items-center gap-2">
            <Select onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.slice(0, 4).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Active Category Pills */}
        {filters.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.categories.map((category) => {
              const option = CATEGORY_OPTIONS.find(opt => opt.value === category);
              return option ? (
                <Badge
                  key={category}
                  variant="secondary"
                  className={cn('text-xs cursor-pointer hover:opacity-80', option.color)}
                  onClick={() => handleCategoryToggle(category)}
                >
                  {option.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FilterBar;