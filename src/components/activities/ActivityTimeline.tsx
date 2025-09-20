import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, SortDesc } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { ActivityTimelineItem, ActivityCategory } from '../../lib/types/activities';
import { getCategoryIcon } from '../../lib/ui/categoryTheme';
import ActivityCard from './ActivityCard';

interface ActivityTimelineProps {
  activities: ActivityTimelineItem[];
  petId?: number;
  isLoading?: boolean;
  onActivityEdit?: (activityId: number) => void;
  onActivityDelete?: (activityId: number) => void;
  className?: string;
}

interface TimelineFilters {
  categories: ActivityCategory[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  searchQuery: string;
  showPinned: boolean;
  showHealthFlags: boolean;
}

type GroupingMode = 'daily' | 'weekly' | 'monthly' | 'none';

interface TimelineGroup {
  id: string;
  title: string;
  date: string;
  items: ActivityTimelineItem[];
  type: 'header' | 'activity';
}

const DEFAULT_FILTERS: TimelineFilters = {
  categories: [],
  dateRange: {},
  searchQuery: '',
  showPinned: false,
  showHealthFlags: false,
};

export default function ActivityTimeline({
  activities,
  petId,
  isLoading = false,
  onActivityEdit,
  onActivityDelete,
  className,
}: ActivityTimelineProps) {
  const [filters, setFilters] = useState<TimelineFilters>(DEFAULT_FILTERS);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('daily');

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Filter by pet if specified
    if (petId) {
      filtered = filtered.filter(activity => activity.petId === petId);
    }

    // Filter by categories
    if (filters.categories.length > 0) {
      filtered = filtered.filter(activity => 
        filters.categories.includes(activity.category)
      );
    }

    // Filter by date range
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.activityDate);
        const start = filters.dateRange.start;
        const end = filters.dateRange.end;
        
        if (start && activityDate < start) return false;
        if (end && activityDate > end) return false;
        
        return true;
      });
    }

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(query) ||
        activity.description?.toLowerCase().includes(query) ||
        activity.subcategory.toLowerCase().includes(query) ||
        activity.keyFacts.some(fact => fact.toLowerCase().includes(query))
      );
    }

    // Filter by pinned status
    if (filters.showPinned) {
      filtered = filtered.filter(activity => activity.isPinned);
    }

    // Filter by health flags
    if (filters.showHealthFlags) {
      filtered = filtered.filter(activity => activity.hasHealthFlag);
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.activityDate).getTime();
      const dateB = new Date(b.activityDate).getTime();
      
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [activities, petId, filters, sortOrder]);

  // Enhanced grouping logic for different time periods
  const getGroupKey = useCallback((date: Date, mode: GroupingMode): string => {
    switch (mode) {
      case 'daily':
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'weekly': {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek.toISOString().split('T')[0];
      }
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'none':
        return 'all';
      default:
        return date.toISOString().split('T')[0];
    }
  }, []);

  const getGroupTitle = useCallback((key: string, mode: GroupingMode): string => {
    if (mode === 'none') return 'All Activities';
    
    const date = new Date(key + 'T00:00:00');
    const now = new Date();
    
    switch (mode) {
      case 'daily': {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffMs = today.getTime() - targetDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays === -1) return 'Tomorrow';
        
        if (date.getFullYear() === now.getFullYear()) {
          return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        }
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      case 'weekly': {
        const endOfWeek = new Date(date);
        endOfWeek.setDate(date.getDate() + 6);
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return key;
    }
  }, []);

  // Group activities with enhanced logic
  const virtualItems = useMemo(() => {
    const groups = new Map<string, ActivityTimelineItem[]>();
    
    filteredActivities.forEach(activity => {
      const groupKey = getGroupKey(activity.activityDate, groupingMode);
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(activity);
    });

    const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
      return sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
    });

    const items: (TimelineGroup | ActivityTimelineItem)[] = [];

    sortedGroups.forEach(([groupKey, groupActivities]) => {
      // Add group header (unless grouping is 'none')
      if (groupingMode !== 'none') {
        items.push({
          id: `header-${groupKey}`,
          title: getGroupTitle(groupKey, groupingMode),
          date: groupKey,
          items: groupActivities,
          type: 'header'
        } as TimelineGroup);
      }

      // Add activities in the group
      groupActivities.forEach(activity => {
        items.push(activity);
      });
    });

    return items;
  }, [filteredActivities, groupingMode, sortOrder, getGroupKey, getGroupTitle]);

  // Handle filter changes
  const handleCategoryToggle = useCallback((category: ActivityCategory) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleSortToggle = useCallback(() => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  }, []);

  const handleGroupingChange = useCallback((mode: GroupingMode) => {
    setGroupingMode(mode);
  }, []);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = filteredActivities.length;
    const pinned = filteredActivities.filter(a => a.isPinned).length;
    const healthFlags = filteredActivities.filter(a => a.hasHealthFlag).length;
    const categoryCounts = filteredActivities.reduce((acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + 1;
      return acc;
    }, {} as Record<ActivityCategory, number>);

    return { total, pinned, healthFlags, categoryCounts };
  }, [filteredActivities]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.searchQuery.trim() ||
      filters.showPinned ||
      filters.showHealthFlags ||
      filters.dateRange.start ||
      filters.dateRange.end
    );
  }, [filters]);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-32 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 bg-muted rounded w-20 animate-pulse" />
            <div className="h-8 bg-muted rounded w-20 animate-pulse" />
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 bg-muted rounded w-20" />
                    <div className="h-4 bg-muted rounded w-16" />
                  </div>
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with filters and controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Activity Timeline</h2>
          {stats.total > 0 && (
            <Badge variant="secondary" className="text-xs">
              {stats.total} activities
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Grouping control */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Calendar className="h-4 w-4" />
                {groupingMode === 'daily' ? 'Daily' :
                 groupingMode === 'weekly' ? 'Weekly' :
                 groupingMode === 'monthly' ? 'Monthly' : 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Group Activities</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={groupingMode === 'daily'}
                onCheckedChange={() => handleGroupingChange('daily')}
              >
                Daily
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={groupingMode === 'weekly'}
                onCheckedChange={() => handleGroupingChange('weekly')}
              >
                Weekly
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={groupingMode === 'monthly'}
                onCheckedChange={() => handleGroupingChange('monthly')}
              >
                Monthly
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={groupingMode === 'none'}
                onCheckedChange={() => handleGroupingChange('none')}
              >
                No grouping
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSortToggle}
            className="flex items-center gap-1"
          >
            <SortDesc className={cn(
              'h-4 w-4 transition-transform',
              sortOrder === 'asc' && 'rotate-180'
            )} />
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </Button>

          {/* Category filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'flex items-center gap-1',
                  filters.categories.length > 0 && 'bg-primary/10 border-primary/30'
                )}
              >
                <Filter className="h-4 w-4" />
                Categories
                {filters.categories.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {filters.categories.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.values(ActivityCategory).map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm">{getCategoryIcon(category)}</span>
                  <span>{category}</span>
                  {stats.categoryCounts[category] && (
                    <Badge variant="secondary" className="ml-auto h-4 text-xs">
                      {stats.categoryCounts[category]}
                    </Badge>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filters.showPinned}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, showPinned: checked }))
                }
              >
                📌 Pinned only
                {stats.pinned > 0 && (
                  <Badge variant="secondary" className="ml-auto h-4 text-xs">
                    {stats.pinned}
                  </Badge>
                )}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.showHealthFlags}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, showHealthFlags: checked }))
                }
              >
                🚨 Health flags only
                {stats.healthFlags > 0 && (
                  <Badge variant="secondary" className="ml-auto h-4 text-xs">
                    {stats.healthFlags}
                  </Badge>
                )}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search activities, facts, or descriptions..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Active filters indicator */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-sm text-muted-foreground">Filters:</span>
            
            <AnimatePresence>
              {filters.categories.map(category => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer transition-all hover:scale-105"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {getCategoryIcon(category)} {category} ×
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filters.searchQuery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Badge variant="secondary" className="text-xs">
                  "{filters.searchQuery}" ×
                </Badge>
              </motion.div>
            )}
            
            {filters.showPinned && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Badge variant="secondary" className="text-xs">
                  📌 Pinned ×
                </Badge>
              </motion.div>
            )}
            
            {filters.showHealthFlags && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Badge variant="secondary" className="text-xs">
                  🚨 Health flags ×
                </Badge>
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-6 px-2 text-xs transition-all hover:scale-105"
              >
                Clear all
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline content - without virtualization to avoid double scrollbars */}
      {virtualItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {hasActiveFilters ? 'No activities match your filters' : 'No activities yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start recording your pet\'s activities to see them here.'
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {virtualItems.map((item, index) => {
            const isHeader = 'type' in item && item.type === 'header';
            
            return (
              <div key={isHeader ? (item as TimelineGroup).id : (item as ActivityTimelineItem).id}>
                {isHeader ? (
                  // Group header with improved spacing
                  <div className="relative mb-4 mt-8 first:mt-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground whitespace-nowrap bg-background px-2">
                        {(item as TimelineGroup).title}
                      </h3>
                      <div className="flex-1 h-px bg-border" />
                      <Badge variant="outline" className="text-xs bg-background">
                        {(item as TimelineGroup).items.length} {(item as TimelineGroup).items.length === 1 ? 'activity' : 'activities'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  // Activity card with improved alignment
                  <motion.div 
                    className="w-full max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: Math.min(index * 0.02, 0.3) 
                    }}
                  >
                    <ActivityCard
                      activity={item as ActivityTimelineItem}
                      onEdit={onActivityEdit}
                      onDelete={onActivityDelete}
                    />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}