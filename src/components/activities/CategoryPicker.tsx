import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  ActivityCategory,
  ActivityTemplate,
  RecentTemplate 
} from '../../lib/types/activities';
import { templateRegistry } from '../../lib/activityTemplates';

// Category picker props interface
interface CategoryPickerProps {
  petId: number;
  selectedCategory?: ActivityCategory;
  selectedTemplateId?: string;
  onCategoryChange: (category: ActivityCategory) => void;
  onTemplateSelect: (templateId: string) => void;
  onClose?: () => void;
}

// Category configuration with colors and icons
interface CategoryConfig {
  category: ActivityCategory;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}

// Category configurations with pet-themed styling
const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    category: ActivityCategory.Diet,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    icon: '🍽️',
    description: 'Meals, treats, and feeding',
  },
  {
    category: ActivityCategory.Health,
    color: 'text-red-700',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
    icon: '🏥',
    description: 'Vet visits, medicine, symptoms',
  },
  {
    category: ActivityCategory.Growth,
    color: 'text-green-700',
    bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
    icon: '📏',
    description: 'Weight, height, measurements',
  },
  {
    category: ActivityCategory.Lifestyle,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    icon: '🎾',
    description: 'Exercise, play, walks',
  },
  {
    category: ActivityCategory.Expense,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    icon: '💰',
    description: 'Purchases, bills, costs',
  },
];

// Mock recent templates data - would be loaded from useRecentTemplates hook
const getMockRecentTemplates = (petId: number): RecentTemplate[] => [
  { templateId: 'diet.feeding', lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000), usageCount: 15, petId },
  { templateId: 'lifestyle.walk', lastUsed: new Date(Date.now() - 8 * 60 * 60 * 1000), usageCount: 12, petId },
  { templateId: 'growth.weight', lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000), usageCount: 8, petId },
  { templateId: 'health.checkup', lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), usageCount: 5, petId },
];

// CategoryPicker component for initial category and template selection
const CategoryPicker: React.FC<CategoryPickerProps> = ({
  petId,
  selectedCategory,
  selectedTemplateId,
  onCategoryChange,
  onTemplateSelect,
  onClose,
}) => {
  // State for managing template visibility
  const [showAllTemplates, setShowAllTemplates] = React.useState(false);

  // Mock recent templates - would use useRecentTemplates(petId) hook
  const recentTemplates = React.useMemo(() => 
    getMockRecentTemplates(petId), [petId]
  );

  // Get templates for selected category
  const categoryTemplates = React.useMemo(() => {
    if (!selectedCategory) return [];
    return templateRegistry.getTemplatesByCategory(selectedCategory);
  }, [selectedCategory]);

  // Get recent template details with category grouping
  const recentTemplateDetails = React.useMemo(() => {
    const templateDetails = recentTemplates
      .map(rt => {
        const template = templateRegistry.getTemplate(rt.templateId);
        return template ? { ...template, ...rt } : null;
      })
      .filter(Boolean)
      .slice(0, 6); // Limit to 6 recent templates

    // Group by category for better organization
    return templateDetails.reduce((acc, template) => {
      if (!template) return acc;
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<ActivityCategory, (ActivityTemplate & RecentTemplate)[]>);
  }, [recentTemplates]);

  // Handle category selection
  const handleCategorySelect = (category: ActivityCategory) => {
    onCategoryChange(category);
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect(templateId);
  };

  // Format relative time for recent templates
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">What did you do together?</h2>
        <p className="text-sm text-muted-foreground">
          Choose a category to start recording your pet's activity
        </p>
      </div>

      {/* Recent Templates Section */}
      {Object.keys(recentTemplateDetails).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-lg">⭐</span>
              Recent Activities
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your most used activities for this pet
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(recentTemplateDetails)
                .flatMap(([, templates]) => templates)
                .slice(0, 6)
                .map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    className={`h-auto p-3 flex flex-col items-center gap-2 transition-all ${
                      template.id === selectedTemplateId
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <span className="text-xl">{template.icon}</span>
                    <div className="text-center">
                      <div className="text-xs font-medium">{template.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(template.lastUsed)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {template.usageCount} uses
                    </Badge>
                  </Button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Choose Category</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select the type of activity you want to record
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CATEGORY_CONFIGS.map((config) => {
              const isSelected = config.category === selectedCategory;
              const categoryTemplateCount = templateRegistry
                .getTemplatesByCategory(config.category).length;

              return (
                <Button
                  key={config.category}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-center gap-3 transition-all ${
                    config.bgColor
                  } ${
                    isSelected
                      ? 'ring-2 ring-primary shadow-md'
                      : 'hover:shadow-sm'
                  }`}
                  onClick={() => handleCategorySelect(config.category)}
                >
                  <span className="text-3xl" role="img">
                    {config.icon}
                  </span>
                  <div className="text-center space-y-1">
                    <div className={`font-medium ${config.color}`}>
                      {config.category}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {config.description}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {categoryTemplateCount} templates
                    </Badge>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Templates */}
      {selectedCategory && categoryTemplates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>
                {selectedCategory} Activities
              </span>
              <Badge variant="outline">
                {categoryTemplates.length} available
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose a specific activity type to start recording
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(showAllTemplates ? categoryTemplates : categoryTemplates.slice(0, 8))
                .map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className={`h-auto p-3 flex flex-col items-center gap-2 transition-all ${
                      template.id === selectedTemplateId
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <span className="text-xl">{template.icon}</span>
                    <div className="text-center">
                      <div className="text-xs font-medium">{template.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.subcategory}
                      </div>
                    </div>
                    {template.isQuickLogEnabled && (
                      <Badge variant="secondary" className="text-xs">
                        Quick Log
                      </Badge>
                    )}
                  </Button>
                ))}
            </div>

            {/* Show more button */}
            {categoryTemplates.length > 8 && (
              <div className="text-center mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTemplates(!showAllTemplates)}
                >
                  {showAllTemplates 
                    ? 'Show Less' 
                    : `Show ${categoryTemplates.length - 8} More Templates`
                  }
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
        )}
        {selectedTemplateId && (
          <Button
            onClick={() => {
              // Would trigger next step - opening appropriate mode
              console.log('Continue with template:', selectedTemplateId);
            }}
          >
            Continue with {templateRegistry.getTemplate(selectedTemplateId)?.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CategoryPicker;