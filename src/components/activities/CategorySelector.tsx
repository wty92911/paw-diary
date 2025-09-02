import { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ActivityCategory, ACTIVITY_CATEGORIES, ACTIVITY_CATEGORY_OPTIONS } from '../../lib/types';
import {
  Heart,
  TrendingUp,
  UtensilsCrossed,
  Dumbbell,
  Receipt,
  Clock,
  Star,
  Sparkles,
} from 'lucide-react';

interface CategorySelectorProps {
  selectedCategory?: ActivityCategory;
  onCategorySelect: (category: ActivityCategory) => void;
  recentCategories?: ActivityCategory[];
  quickTemplates?: Array<{
    category: ActivityCategory;
    label: string;
    description?: string;
  }>;
  className?: string;
}

// Category icons mapping
const CATEGORY_ICONS = {
  [ActivityCategory.Health]: Heart,
  [ActivityCategory.Growth]: TrendingUp,
  [ActivityCategory.Diet]: UtensilsCrossed,
  [ActivityCategory.Lifestyle]: Dumbbell,
  [ActivityCategory.Expense]: Receipt,
} as const;

// Get category color classes
const getCategoryColorClasses = (category: ActivityCategory, isSelected?: boolean) => {
  const config = ACTIVITY_CATEGORIES[category];
  const colorMap: Record<string, { bg: string; text: string; border: string; selected: string }> = {
    red: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      selected: 'bg-red-100 border-red-400',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      selected: 'bg-green-100 border-green-400',
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      selected: 'bg-orange-100 border-orange-400',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      selected: 'bg-blue-100 border-blue-400',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      selected: 'bg-purple-100 border-purple-400',
    },
  };

  const colors = colorMap[config.color] || colorMap.blue;
  return {
    bg: isSelected ? colors.selected : colors.bg,
    text: colors.text,
    border: isSelected ? colors.selected : colors.border,
  };
};

// Default quick templates for rapid entry
const DEFAULT_QUICK_TEMPLATES = [
  {
    category: ActivityCategory.Health,
    label: 'Quick Checkup',
    description: 'Routine health monitoring',
  },
  {
    category: ActivityCategory.Growth,
    label: 'Weight Update',
    description: 'Record current weight',
  },
  {
    category: ActivityCategory.Diet,
    label: 'Meal Time',
    description: 'Log feeding activity',
  },
  {
    category: ActivityCategory.Lifestyle,
    label: 'Play Time',
    description: 'Record exercise and fun',
  },
  {
    category: ActivityCategory.Expense,
    label: 'Quick Purchase',
    description: 'Log expense with receipt',
  },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategorySelect,
  recentCategories = [],
  quickTemplates = DEFAULT_QUICK_TEMPLATES,
  className = '',
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<ActivityCategory | null>(null);

  // Handle category selection
  const handleCategorySelect = useCallback(
    (category: ActivityCategory) => {
      onCategorySelect(category);
    },
    [onCategorySelect],
  );

  // Note: We show all categories in the main section for comprehensive selection

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Recent Categories Section */}
      {recentCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-gray-600" />
              Recent Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {recentCategories.map(category => {
                const config = ACTIVITY_CATEGORIES[category];
                const CategoryIcon = CATEGORY_ICONS[category];
                const colorClasses = getCategoryColorClasses(
                  category,
                  selectedCategory === category,
                );
                const isSelected = selectedCategory === category;

                return (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    onMouseEnter={() => setHoveredCategory(category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                      colorClasses.bg
                    } ${colorClasses.border} ${
                      isSelected ? 'ring-2 ring-offset-2 ring-blue-400' : ''
                    }`}
                  >
                    <div
                      className={`p-3 rounded-full ${colorClasses.bg} border ${colorClasses.border} mb-2`}
                    >
                      <CategoryIcon className={`h-6 w-6 ${colorClasses.text}`} />
                    </div>
                    <span className={`text-sm font-medium ${colorClasses.text}`}>
                      {config.label}
                    </span>
                    <Badge
                      variant="secondary"
                      className="mt-1 text-xs px-2 py-0.5 bg-white border-gray-200"
                    >
                      Recent
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Templates Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-gray-600" />
            Quick Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickTemplates.map((template, index) => {
              const config = ACTIVITY_CATEGORIES[template.category];
              const CategoryIcon = CATEGORY_ICONS[template.category];
              const colorClasses = getCategoryColorClasses(
                template.category,
                selectedCategory === template.category,
              );
              const isSelected = selectedCategory === template.category;

              return (
                <button
                  key={index}
                  onClick={() => handleCategorySelect(template.category)}
                  onMouseEnter={() => setHoveredCategory(template.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`flex items-center p-3 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                    colorClasses.bg
                  } ${colorClasses.border} ${
                    isSelected ? 'ring-2 ring-offset-2 ring-blue-400' : ''
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${colorClasses.bg} border ${colorClasses.border} mr-3 flex-shrink-0`}
                  >
                    <CategoryIcon className={`h-5 w-5 ${colorClasses.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium ${colorClasses.text} mb-1`}>
                      {template.label}
                    </h4>
                    {template.description && (
                      <p className="text-xs text-gray-600 truncate">{template.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5 bg-white">
                    {config.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All Categories Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-5 w-5 text-gray-600" />
            All Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ACTIVITY_CATEGORY_OPTIONS.map(option => {
              const CategoryIcon = CATEGORY_ICONS[option.value];
              const colorClasses = getCategoryColorClasses(
                option.value,
                selectedCategory === option.value,
              );
              const isSelected = selectedCategory === option.value;
              const isHovered = hoveredCategory === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleCategorySelect(option.value)}
                  onMouseEnter={() => setHoveredCategory(option.value)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`flex flex-col items-center p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
                    colorClasses.bg
                  } ${colorClasses.border} ${
                    isSelected ? 'ring-2 ring-offset-2 ring-blue-400 scale-105' : ''
                  } ${isHovered ? 'scale-102' : ''}`}
                >
                  <div
                    className={`p-4 rounded-full ${colorClasses.bg} border ${colorClasses.border} mb-3 transition-transform duration-200 ${
                      isHovered ? 'scale-110' : ''
                    }`}
                  >
                    <CategoryIcon className={`h-8 w-8 ${colorClasses.text}`} />
                  </div>
                  <span className={`text-base font-semibold ${colorClasses.text} mb-1`}>
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500 text-center">
                    {ACTIVITY_CATEGORIES[option.value].subcategories.length} subcategories
                  </span>
                  {isSelected && (
                    <Badge
                      variant="secondary"
                      className="mt-2 text-xs px-3 py-1 bg-blue-100 text-blue-700 border-blue-200"
                    >
                      Selected
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Details */}
      {(selectedCategory || hoveredCategory) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {(() => {
                const displayCategory = selectedCategory || hoveredCategory!;
                const CategoryIcon = CATEGORY_ICONS[displayCategory];
                return <CategoryIcon className="h-5 w-5" />;
              })()}
              {ACTIVITY_CATEGORIES[selectedCategory || hoveredCategory!].label} Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Available Subcategories</h4>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_CATEGORIES[selectedCategory || hoveredCategory!].subcategories.map(
                    (subcategory, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs px-2 py-1 bg-gray-50 border-gray-300"
                      >
                        {subcategory}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
              {selectedCategory && (
                <div className="pt-2 border-t">
                  <Button onClick={() => handleCategorySelect(selectedCategory)} className="w-full">
                    Continue with {ACTIVITY_CATEGORIES[selectedCategory].label}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
