import { useState, useCallback } from 'react';
import { Plus, Calendar, Heart, Sparkles } from 'lucide-react';
import { Pet, Activity, ActivitySearchResult } from '../../lib/types';
import { ActivityTimeline } from '../activities/ActivityTimeline';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface PetActivityTimelineProps {
  pet: Pet;
  activities?: Activity[];
  onLoadMore?: (offset: number, limit: number) => Promise<ActivitySearchResult>;
  onRefresh?: () => Promise<void>;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityId: number) => void;
  onAddActivity?: () => void;
  isLoading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  className?: string;
}

/**
 * PetActivityTimeline - Pet-specific activity timeline component
 * 
 * Features:
 * - Displays activities filtered by specific pet
 * - Shows pet-contextualized empty state
 * - Includes add activity button with pet context
 * - Optimized for pet profile pages
 * - All ActivityTimeline features (virtual scrolling, pull-to-refresh, etc.)
 */
export function PetActivityTimeline({
  pet,
  activities = [],
  onLoadMore,
  onRefresh,
  onEditActivity,
  onDeleteActivity,
  onAddActivity,
  isLoading = false,
  error = null,
  hasMore = false,
  className,
}: PetActivityTimelineProps) {
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // Handle add activity with pet context
  const handleAddActivity = useCallback(() => {
    setIsAddingActivity(true);
    onAddActivity?.();
    // Reset state after a short delay (activity form will handle the actual state)
    setTimeout(() => setIsAddingActivity(false), 1000);
  }, [onAddActivity]);

  // Custom empty state for pet-specific timeline
  const renderPetEmptyState = () => (
    <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
      <CardContent className="p-8 text-center">
        {/* Pet-specific illustration */}
        <div className="relative mb-6">
          <div className="w-24 h-24 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
            <Heart className="w-12 h-12 text-orange-500 fill-current" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
        </div>

        {/* Pet-specific messaging */}
        <h3 className="text-xl font-semibold text-orange-900 mb-2">
          Start {pet.name}'s Journey
        </h3>
        <p className="text-orange-700 mb-6 max-w-md mx-auto leading-relaxed">
          Record {pet.name}'s daily activities, health updates, milestones, and special moments. 
          Every entry helps track their growth and happiness!
        </p>

        {/* Activity suggestions */}
        <div className="grid grid-cols-2 gap-3 mb-6 max-w-sm mx-auto">
          <div className="bg-white/70 rounded-lg p-3 text-sm text-orange-800">
            📸 Photo moments
          </div>
          <div className="bg-white/70 rounded-lg p-3 text-sm text-orange-800">
            🏥 Health updates
          </div>
          <div className="bg-white/70 rounded-lg p-3 text-sm text-orange-800">
            🍽️ Feeding times
          </div>
          <div className="bg-white/70 rounded-lg p-3 text-sm text-orange-800">
            🎾 Play sessions
          </div>
        </div>

        {/* Add first activity button */}
        {onAddActivity && (
          <Button
            onClick={handleAddActivity}
            disabled={isAddingActivity}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8"
          >
            <Plus className="w-5 h-5 mr-2" />
            Record First Activity
          </Button>
        )}
      </CardContent>
    </Card>
  );

  // If no activities and not loading, show custom empty state
  if (!isLoading && activities.length === 0 && !error) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Timeline header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-orange-900">
              {pet.name}'s Timeline
            </h2>
          </div>
          {onAddActivity && (
            <Button
              onClick={handleAddActivity}
              disabled={isAddingActivity}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Activity
            </Button>
          )}
        </div>

        {/* Custom empty state */}
        {renderPetEmptyState()}
      </div>
    );
  }

  // For activities present or loading states, use the full ActivityTimeline
  return (
    <div className={cn('space-y-4', className)}>
      {/* Timeline header with pet context */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-orange-900">
            {pet.name}'s Timeline
          </h2>
          {activities.length > 0 && (
            <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
            </span>
          )}
        </div>
        
        {onAddActivity && activities.length > 0 && (
          <Button
            onClick={handleAddActivity}
            disabled={isAddingActivity}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Activity
          </Button>
        )}
      </div>

      {/* ActivityTimeline with pet context */}
      <ActivityTimeline
        petId={pet.id}
        activities={activities}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        onEditActivity={onEditActivity}
        onDeleteActivity={onDeleteActivity}
        isLoading={isLoading}
        error={error}
        hasMore={hasMore}
        className={className}
      />
    </div>
  );
}

export default PetActivityTimeline;