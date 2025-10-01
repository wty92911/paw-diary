import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityTimelineItem } from '../../lib/types/activities';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { RouteBuilder } from '../../lib/types/routing';
import { Plus, ChevronRight, Activity as ActivityIcon } from 'lucide-react';

/**
 * ActivityPreviewSection - Simplified activity preview component for pet profiles
 * 
 * Displays the 1-3 most recent activities in a condensed format without the
 * complexity of the full timeline. Includes navigation to the full activities page.
 * 
 * Features:
 * - Shows up to 3 most recent activities
 * - Simplified activity cards with essential information
 * - "View All Activities" call-to-action button
 * - Empty state when no activities exist
 * - Loading and error states support
 * - Click navigation to activity editor
 * 
 * Used in:
 * - Pet profile pages for activity preview
 * - Anywhere simplified activity display is needed
 */

interface ActivityPreviewSectionProps {
  /** Array of activity timeline items to display */
  activities: ActivityTimelineItem[];
  /** Pet ID for navigation routing */
  petId: number;
  /** Optional callback when "View All Activities" is clicked (overrides default navigation) */
  onViewAll?: () => void;
  /** Optional callback when an activity card is clicked (overrides default navigation) */
  onActivityClick?: (activityId: number) => void;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Error state message */
  error?: string;
  /** Maximum number of activities to display (default: 3) */
  maxActivities?: number;
  /** Custom styling classes */
  className?: string;
  /** Show section header (default: true) */
  showHeader?: boolean;
  /** Show view all button in header (default: true) */
  showViewAllButton?: boolean;
  /** Custom empty state message */
  emptyStateMessage?: string;
}

export const ActivityPreviewSection: React.FC<ActivityPreviewSectionProps> = ({
  activities,
  petId,
  onViewAll,
  onActivityClick,
  isLoading = false,
  error,
  maxActivities = 3,
  className = '',
  showHeader = true,
  showViewAllButton = true,
  emptyStateMessage = 'Start recording your pet\'s daily activities',
}) => {
  const navigate = useNavigate();

  // Navigation handlers with fallbacks
  const handleViewAllActivities = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate(RouteBuilder.activitiesList(petId));
    }
  };

  const handleActivityClick = (activityId: number) => {
    if (onActivityClick) {
      onActivityClick(activityId);
    } else {
      navigate(RouteBuilder.editActivity(petId, activityId));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={`bg-white/60 backdrop-blur-sm border-orange-200 ${className}`}>
        <CardContent className="p-4">
          <div className="space-y-3 animate-pulse">
            {showHeader && (
              <div className="flex items-center justify-between">
                <div className="w-28 h-4 bg-gray-200 rounded" />
                <div className="w-16 h-4 bg-gray-200 rounded" />
              </div>
            )}
            <div className="space-y-2">
              {Array.from({ length: Math.min(maxActivities, 2) }, (_, i) => (
                <div key={i} className="flex items-center justify-between p-2">
                  <div className="flex-1 space-y-1">
                    <div className="w-20 h-3 bg-gray-200 rounded" />
                    <div className="w-full h-4 bg-gray-200 rounded" />
                    <div className="w-3/4 h-3 bg-gray-200 rounded" />
                  </div>
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`bg-white/60 backdrop-blur-sm border-orange-200 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center py-4 space-y-2">
            <p className="text-sm text-orange-600">{error}</p>
            <Button
              onClick={handleViewAllActivities}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              Go to Activities
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!activities || activities.length === 0) {
    return (
      <Card className={`bg-white/60 backdrop-blur-sm border-orange-200 ${className}`}>
        <CardContent className="p-4 text-center">
          <div className="py-8 space-y-3">
            <ActivityIcon className="w-12 h-12 mx-auto text-orange-300" />
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-orange-700">No activities yet</h3>
              <p className="text-xs text-orange-600">{emptyStateMessage}</p>
            </div>
            <Button
              onClick={handleViewAllActivities}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add First Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Activities display
  const displayActivities = activities.slice(0, maxActivities);

  return (
    <Card className={`bg-white/60 backdrop-blur-sm border-orange-200 ${className}`}>
      <CardContent className="p-4 space-y-3">
        {/* Section Header */}
        {showHeader && (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-orange-900 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4" />
              Recent Activities
            </h3>
            {showViewAllButton && (
              <Button
                onClick={handleViewAllActivities}
                variant="ghost"
                size="sm"
                className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 h-auto p-1"
              >
                <span className="text-xs">View All</span>
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* Activity List */}
        <div className="space-y-2">
          {displayActivities.map((activity) => (
            <ActivityPreviewCard
              key={activity.id}
              activity={activity}
              onClick={() => handleActivityClick(activity.id)}
            />
          ))}
        </div>

        {/* View All Button */}
        {activities.length > maxActivities && (
          <div className="pt-2 border-t border-orange-200">
            <Button
              onClick={handleViewAllActivities}
              variant="outline"
              size="sm"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              View All {activities.length} Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Individual Activity Preview Card Component
 * Simplified card for displaying activity summary information
 */
interface ActivityPreviewCardProps {
  activity: ActivityTimelineItem;
  onClick: () => void;
}

const ActivityPreviewCard: React.FC<ActivityPreviewCardProps> = ({
  activity,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-2 rounded-md hover:bg-orange-50 cursor-pointer transition-colors group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Edit ${activity.title} activity from ${new Date(activity.activityDate).toLocaleDateString()}`}
    >
      <div className="flex-1 min-w-0">
        {/* Activity metadata */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-orange-800 capitalize">
            {activity.category}
          </span>
          <span className="text-xs text-orange-600">•</span>
          <span className="text-xs text-orange-600">
            {new Date(activity.activityDate).toLocaleDateString()}
          </span>
          {activity.hasHealthFlag && (
            <>
              <span className="text-xs text-orange-600">•</span>
              <span className="text-xs font-medium text-red-600">Health</span>
            </>
          )}
        </div>

        {/* Activity title */}
        <p className="text-sm text-orange-900 font-medium truncate mb-1">
          {activity.title}
        </p>

        {/* Key facts preview */}
        {activity.keyFacts.length > 0 && (
          <p className="text-xs text-orange-700 truncate">
            {activity.keyFacts[0]}
          </p>
        )}

        {/* Attachment indicator */}
        {activity.attachmentCount > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-orange-600">
              {activity.attachmentCount} attachment{activity.attachmentCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Navigation chevron */}
      <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0 group-hover:text-orange-600 transition-colors" />
    </div>
  );
};

export default ActivityPreviewSection;