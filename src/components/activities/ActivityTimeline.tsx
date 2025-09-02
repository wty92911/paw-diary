import { useState, useEffect, useCallback, useMemo } from 'react';
import { ActivityCard } from './ActivityCard';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Activity,
  ActivityFilters,
  ActivitySearchResult,
  type ActivityAttachment,
} from '../../lib/types';
import { RefreshCw, AlertCircle, Calendar, ChevronDown, Loader2, Inbox } from 'lucide-react';

interface ActivityTimelineProps {
  petId?: number;
  activities?: Activity[];
  filters?: ActivityFilters;
  onLoadMore?: (offset: number, limit: number) => Promise<ActivitySearchResult>;
  onRefresh?: () => Promise<void>;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityId: number) => void;
  onAttachmentClick?: (attachment: ActivityAttachment) => void;
  isLoading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  className?: string;
}

// Group activities by date
interface ActivityGroup {
  date: string;
  displayDate: string;
  activities: Activity[];
}

const groupActivitiesByDate = (activities: Activity[]): ActivityGroup[] => {
  const groups = new Map<string, Activity[]>();

  activities.forEach(activity => {
    const date = new Date(activity.activity_date);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)?.push(activity);
  });

  // Sort groups by date (newest first) and activities within each group
  const sortedGroups = Array.from(groups.entries())
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, activities]) => {
      const displayDate = formatGroupDate(date);
      const sortedActivities = activities.sort(
        (a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime(),
      );

      return {
        date,
        displayDate,
        activities: sortedActivities,
      };
    });

  return sortedGroups;
};

// Format date for group headers
const formatGroupDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateKey = date.toISOString().split('T')[0];
  const todayKey = today.toISOString().split('T')[0];
  const yesterdayKey = yesterday.toISOString().split('T')[0];

  if (dateKey === todayKey) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';

  // Check if it's within the current week
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Format as "Month Day" for this year, "Month Day, Year" for other years
  const isThisYear = date.getFullYear() === today.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  petId,
  activities = [],
  filters,
  onLoadMore,
  onRefresh,
  onEditActivity,
  onDeleteActivity,
  onAttachmentClick,
  isLoading = false,
  error = null,
  hasMore = false,
  className = '',
}) => {
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  // Group activities by date
  const activityGroups = useMemo(() => groupActivitiesByDate(activities), [activities]);

  // Handle pull-to-refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY === null || window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - touchStartY);

      if (distance > 0) {
        setPullDistance(Math.min(distance, 120));
        // Add some resistance
        if (distance > 60) {
          e.preventDefault();
        }
      }
    },
    [touchStartY],
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setTouchStartY(null);
    setPullDistance(0);
  }, [pullDistance, onRefresh, isRefreshing]);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (!onLoadMore || isLoadingMore || !hasMore) return;

    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Load more when user is within 200px of the bottom
    if (scrollTop + windowHeight >= documentHeight - 200) {
      setIsLoadingMore(true);
      onLoadMore(activities.length, 20)
        .catch(error => console.error('Load more failed:', error))
        .finally(() => setIsLoadingMore(false));
    }
  }, [onLoadMore, isLoadingMore, hasMore, activities.length]);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Handle activity expand/collapse
  const handleExpandToggle = useCallback((activityId: number) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  }, []);

  // Handle refresh button click
  const handleRefreshClick = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  // Render loading state
  if (isLoading && activities.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16" />
                    <div className="h-6 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Activities</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRefresh && (
            <Button onClick={handleRefreshClick} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Render empty state
  if (activities.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Yet</h3>
          <p className="text-gray-600 mb-4">
            {petId
              ? "Start recording your pet's activities to see them here."
              : 'Select a pet to view their activities, or add a new activity.'}
          </p>
          {filters && Object.keys(filters).length > 0 && (
            <p className="text-sm text-gray-500">
              Try adjusting your filters to see more activities.
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div
      className={`space-y-6 ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-10 bg-blue-50 border-b border-blue-200 transition-all duration-200"
          style={{
            height: `${Math.min(pullDistance, 60)}px`,
            opacity: pullDistance / 60,
          }}
        >
          <div className="flex items-center justify-center h-full">
            {pullDistance > 60 ? (
              <div className="flex items-center text-blue-600">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-sm font-medium">Refreshing...</span>
              </div>
            ) : (
              <div className="flex items-center text-blue-600">
                <ChevronDown className="h-4 w-4 mr-2" />
                <span className="text-sm">Pull to refresh</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refresh button for desktop */}
      {onRefresh && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="hidden md:flex"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      )}

      {/* Activity groups */}
      {activityGroups.map(group => (
        <div key={group.date} className="space-y-4">
          {/* Date header */}
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm py-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">{group.displayDate}</h2>
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-sm text-gray-500">
                {group.activities.length}{' '}
                {group.activities.length === 1 ? 'activity' : 'activities'}
              </span>
            </div>
          </div>

          {/* Activities in this group */}
          <div className="space-y-4">
            {group.activities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={onEditActivity}
                onDelete={onDeleteActivity}
                onAttachmentClick={onAttachmentClick}
                isExpanded={expandedActivities.has(activity.id)}
                onExpandToggle={handleExpandToggle}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Load more indicator */}
      {hasMore && (
        <div className="flex justify-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center text-gray-600">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Loading more activities...</span>
            </div>
          ) : (
            onLoadMore && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsLoadingMore(true);
                  onLoadMore(activities.length, 20).finally(() => setIsLoadingMore(false));
                }}
              >
                Load More Activities
              </Button>
            )
          )}
        </div>
      )}

      {/* End of timeline indicator */}
      {!hasMore && activities.length > 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            You've reached the beginning of the timeline
          </div>
        </div>
      )}
    </div>
  );
};
