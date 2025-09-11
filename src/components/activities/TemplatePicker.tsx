import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Search, Clock } from 'lucide-react';
import { ActivityTemplate, ActivityCategory } from '../../lib/types/activities';
import { templateRegistry } from '../../lib/activityTemplates';
import { updateActivityTemplate } from '../../utils/activityEditorParams';
import { cn } from '../../lib/utils';

export interface TemplatePickerProps {
  /** Currently selected template ID */
  selectedTemplateId?: string;
  /** Callback when template is selected */
  onTemplateSelect?: (template: ActivityTemplate | null) => void;
  /** Whether to sync with URL parameters (default: true) */
  syncWithUrl?: boolean;
  /** Pet ID for context-aware template suggestions */
  petId?: number;
  /** Show only templates for specific category */
  categoryFilter?: ActivityCategory;
  /** Custom className */
  className?: string;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Maximum number of recent templates to show */
  maxRecentTemplates?: number;
}

/**
 * TemplatePicker - Template selection component for new activities
 * 
 * Provides an interface for selecting activity templates with features like:
 * - Category-based filtering with chips
 * - Search functionality
 * - Recent templates for quick access
 * - Popular/recommended templates
 * - URL synchronization for navigation state
 * 
 * Layout matches specification requirements:
 * - Category chips for filtering
 * - Recent templates row for quick access
 * - Grid of available templates with icons and descriptions
 * - Search input for finding specific templates
 * 
 * Usage:
 * ```tsx
 * <TemplatePicker 
 *   selectedTemplateId={templateId}
 *   onTemplateSelect={handleTemplateSelect}
 *   petId={petId}
 *   syncWithUrl={true}
 * />
 * ```
 */
export function TemplatePicker({
  selectedTemplateId,
  onTemplateSelect,
  syncWithUrl = true,
  categoryFilter,
  className,
  compact = false,
  maxRecentTemplates = 4,
}: TemplatePickerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');

  // Get all templates
  const allTemplates = useMemo(() => templateRegistry.getAllTemplates(), []);

  // Get categories with counts
  const categoriesWithCounts = useMemo(() => {
    const counts = allTemplates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<ActivityCategory, number>);

    return Object.entries(counts).map(([category, count]) => ({
      category: category as ActivityCategory,
      count,
    }));
  }, [allTemplates]);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let filtered = allTemplates;

    // Apply category filter (either from props or state)
    const activeCategory = categoryFilter || (selectedCategory === 'all' ? undefined : selectedCategory);
    if (activeCategory) {
      filtered = filtered.filter(template => template.category === activeCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(template =>
        template.label.toLowerCase().includes(query) ||
        (template.description && template.description.toLowerCase().includes(query)) ||
        template.subcategory.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allTemplates, categoryFilter, selectedCategory, searchQuery]);

  // Recent templates (mock implementation - in real app this would come from user data)
  const recentTemplates = useMemo(() => {
    return allTemplates
      .slice(0, maxRecentTemplates)
      .filter(template => template.category !== ActivityCategory.Health); // Vary the selection
  }, [allTemplates, maxRecentTemplates]);

  // Handle template selection
  const handleTemplateSelect = (template: ActivityTemplate | null) => {
    // Call external callback
    onTemplateSelect?.(template);

    // Update URL parameters if sync is enabled
    if (syncWithUrl) {
      const updatedParams = updateActivityTemplate(searchParams, template?.id || null);
      setSearchParams(updatedParams, { replace: true });
    }
  };

  // Handle category selection
  const handleCategorySelect = (category: ActivityCategory | 'all') => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when changing category
  };

  if (compact) {
    return (
      <CompactTemplatePicker
        selectedTemplateId={selectedTemplateId}
        onTemplateSelect={handleTemplateSelect}
        className={className}
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus={false}
              tabIndex={-1}
              onFocus={(e) => {
                // Re-enable tabIndex when user manually focuses
                e.target.tabIndex = 0;
              }}
            />
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      {!categoryFilter && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategorySelect('all')}
            className="h-8"
          >
            All Templates
            <Badge variant="secondary" className="ml-2 text-xs">
              {allTemplates.length}
            </Badge>
          </Button>
          
          {categoriesWithCounts.map(({ category, count }) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategorySelect(category)}
              className="h-8"
            >
              {category}
              <Badge variant="secondary" className="ml-2 text-xs">
                {count}
              </Badge>
            </Button>
          ))}
        </div>
      )}

      {/* Recent Templates Section */}
      {!searchQuery && selectedCategory === 'all' && recentTemplates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="w-4 h-4" />
            Recent Templates
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {recentTemplates.map((template) => (
              <TemplateCard
                key={`recent-${template.id}`}
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={handleTemplateSelect}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">
          {searchQuery ? (
            `Search Results (${filteredTemplates.length})`
          ) : selectedCategory === 'all' ? (
            'All Templates'
          ) : (
            `${selectedCategory} Templates (${filteredTemplates.length})`
          )}
        </div>

        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={handleTemplateSelect}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? (
                  <>No templates found for "{searchQuery}"</>
                ) : (
                  <>No templates available in this category</>
                )}
              </p>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * Individual template card component
 */
interface TemplateCardProps {
  template: ActivityTemplate;
  isSelected: boolean;
  onSelect: (template: ActivityTemplate) => void;
  compact?: boolean;
}

function TemplateCard({ template, isSelected, onSelect, compact = false }: TemplateCardProps) {
  const handleSelect = () => {
    onSelect(template);
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md border-2',
        isSelected
          ? 'border-orange-300 bg-orange-50 shadow-sm'
          : 'border-gray-200 hover:border-orange-200',
        compact ? 'p-2' : 'p-3'
      )}
      onClick={handleSelect}
    >
      <CardContent className={cn('p-0', compact ? 'space-y-1' : 'space-y-2')}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('text-lg', compact && 'text-base')}>
              {template.icon}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'font-medium text-gray-900 truncate',
                compact ? 'text-sm' : 'text-base'
              )}>
                {template.label}
              </h4>
              {!compact && template.description && (
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {template.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Popular indicator could be added based on usage stats */}
        </div>

        {!compact && (
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {template.category}
            </Badge>
            
            <span className="text-xs text-gray-500">
              {template.blocks.length} field{template.blocks.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for use in headers or small spaces
 */
function CompactTemplatePicker({
  selectedTemplateId,
  onTemplateSelect,
  className,
}: Pick<TemplatePickerProps, 'selectedTemplateId' | 'onTemplateSelect' | 'className'>) {
  const templates = useMemo(() => templateRegistry.getAllTemplates(), []);
  const [isOpen, setIsOpen] = useState(false);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleTemplateSelect = (template: ActivityTemplate) => {
    onTemplateSelect?.(template);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="justify-between min-w-48"
      >
        <div className="flex items-center gap-2">
          {selectedTemplate ? (
            <>
              <span>{selectedTemplate.icon}</span>
              <span className="truncate">{selectedTemplate.label}</span>
            </>
          ) : (
            <span className="text-gray-500">Select template...</span>
          )}
        </div>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1">
          <Card className="shadow-lg border-2 border-gray-200">
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                <div className="p-2 space-y-1">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100',
                        selectedTemplateId === template.id && 'bg-orange-100'
                      )}
                    >
                      <span className="text-sm">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {template.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {template.category}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default TemplatePicker;