import React from 'react';
import { Pet, ActivityCategory } from '../../lib/types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { cn, calculateAge, formatWeight } from '../../lib/utils';
import { formatActivityData, getActivityStats, getRelativeTime } from '../../lib/activityUtils';
import { useActivities } from '../../hooks/useActivities';
import {
  Plus,
  Calendar,
  Heart,
  Scale,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
  UtensilsCrossed,
  Dumbbell,
  Receipt,
  ArrowRight,
} from 'lucide-react';

interface PetActivityPreviewProps {
  pet: Pet;
  onAddActivity?: () => void;
  onViewAllActivities?: (petId: number) => void;
  className?: string;
}

export function PetActivityPreview({
  pet,
  onAddActivity,
  onViewAllActivities,
  className,
}: PetActivityPreviewProps) {
  const age = calculateAge(pet.birth_date);
  const weight = formatWeight(pet.weight_kg);

  // Fetch real activity data for this pet
  const { activities, isLoading, error, fetchActivities } = useActivities(pet.id);

  // Get recent activities (last 3)
  const recentActivities = activities.slice(0, 3);
  const hasActivities = activities.length > 0;

  // Get activity statistics
  const stats = React.useMemo(() => {
    return getActivityStats(activities);
  }, [activities]);

  // Load activities on component mount
  React.useEffect(() => {
    fetchActivities(pet.id, 10, 0);
  }, [pet.id, fetchActivities]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-sm font-medium text-orange-900">Age</p>
            <p className="text-lg font-bold text-orange-800">{age}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Scale className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">Weight</p>
            <p className="text-lg font-bold text-blue-800">{weight}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Activity Button */}
      <Button
        onClick={onAddActivity}
        className="w-full h-12 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        aria-label={`Add activity for ${pet.name}`}
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Activity
      </Button>

      {/* Activity Categories Preview */}
      <div className="grid grid-cols-2 gap-3">
        <ActivityCategoryCard
          icon={Heart}
          title="Health"
          count={stats.categoryCounts[ActivityCategory.Health] || 0}
          color="red"
          description="Vet visits & checkups"
        />
        <ActivityCategoryCard
          icon={TrendingUp}
          title="Growth"
          count={stats.categoryCounts[ActivityCategory.Growth] || 0}
          color="green"
          description="Weight & size tracking"
        />
        <ActivityCategoryCard
          icon={UtensilsCrossed}
          title="Diet"
          count={stats.categoryCounts[ActivityCategory.Diet] || 0}
          color="purple"
          description="Food & treats"
        />
        <ActivityCategoryCard
          icon={Dumbbell}
          title="Lifestyle"
          count={stats.categoryCounts[ActivityCategory.Lifestyle] || 0}
          color="blue"
          description="Play & exercise"
        />
      </div>

      {/* Recent Activities */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-orange-900">Recent Activities</h3>
          </div>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-20 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardContent className="p-6 text-center">
            <Clock className="w-10 h-10 mx-auto mb-3 text-red-400" />
            <h3 className="font-semibold text-red-700 mb-2">Error loading activities</h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchActivities(pet.id, 10, 0)}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : hasActivities ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-orange-900">Recent Activities</h3>
            {activities.length > 3 && onViewAllActivities && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewAllActivities(pet.id)}
                className="text-orange-700 hover:text-orange-800 hover:bg-orange-100"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          {recentActivities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}

          {/* Activity Summary Stats */}
          <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-orange-800">{stats.totalActivities}</p>
                  <p className="text-sm text-orange-600">Total Activities</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-800">{stats.activitiesThisWeek}</p>
                  <p className="text-sm text-orange-600">This Week</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-800">
                    {stats.totalCost > 0 ? `¥${Math.round(stats.totalCost)}` : '¥0'}
                  </p>
                  <p className="text-sm text-orange-600">Total Cost</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
          <CardContent className="p-6 text-center">
            <Clock className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <h3 className="font-semibold text-gray-700 mb-2">No activities yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start recording {pet.name}'s daily activities, health records, and growth milestones.
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>• Track vet visits and health checkups</p>
              <p>• Record weight and growth measurements</p>
              <p>• Log meals and favorite treats</p>
              <p>• Document play time and exercise</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Individual activity category card
interface ActivityCategoryCardProps {
  icon: React.ElementType;
  title: string;
  count: number;
  color: 'red' | 'green' | 'purple' | 'blue';
  description: string;
}

function ActivityCategoryCard({
  icon: Icon,
  title,
  count,
  color,
  description,
}: ActivityCategoryCardProps) {
  const colorClasses = {
    red: {
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      count: 'text-red-800',
      description: 'text-red-600',
    },
    green: {
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900',
      count: 'text-green-800',
      description: 'text-green-600',
    },
    purple: {
      bg: 'from-purple-50 to-violet-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      title: 'text-purple-900',
      count: 'text-purple-800',
      description: 'text-purple-600',
    },
    blue: {
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      count: 'text-blue-800',
      description: 'text-blue-600',
    },
  };

  const classes = colorClasses[color];

  return (
    <Card
      className={cn(
        'bg-gradient-to-br transition-all duration-200 hover:scale-105',
        classes.bg,
        classes.border,
      )}
    >
      <CardContent className="p-3 text-center">
        <Icon className={cn('w-5 h-5 mx-auto mb-2', classes.icon)} />
        <p className={cn('text-sm font-semibold mb-1', classes.title)}>{title}</p>
        <p className={cn('text-lg font-bold mb-1', classes.count)}>{count}</p>
        <p className={cn('text-xs', classes.description)}>{description}</p>
      </CardContent>
    </Card>
  );
}

// Individual activity card component
interface ActivityCardProps {
  activity: import('../../lib/types').Activity;
}

function ActivityCard({ activity }: ActivityCardProps) {
  const getCategoryColor = (category: ActivityCategory) => {
    switch (category) {
      case ActivityCategory.Health:
        return 'border-red-200 bg-red-50';
      case ActivityCategory.Growth:
        return 'border-green-200 bg-green-50';
      case ActivityCategory.Diet:
        return 'border-purple-200 bg-purple-50';
      case ActivityCategory.Lifestyle:
        return 'border-blue-200 bg-blue-50';
      case ActivityCategory.Expense:
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case ActivityCategory.Health:
        return Heart;
      case ActivityCategory.Growth:
        return TrendingUp;
      case ActivityCategory.Diet:
        return UtensilsCrossed;
      case ActivityCategory.Lifestyle:
        return Dumbbell;
      case ActivityCategory.Expense:
        return Receipt;
      default:
        return Clock;
    }
  };

  const Icon = getCategoryIcon(activity.category);
  const colorClasses = getCategoryColor(activity.category);
  const activityData = formatActivityData(activity);

  return (
    <Card
      className={cn(
        'border-2 transition-all duration-200 hover:shadow-md cursor-pointer',
        colorClasses,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-full bg-white/80">
              <Icon className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{activity.title}</h4>
              <p className="text-sm text-gray-600">{activity.subcategory}</p>
              {activityData && (
                <p className="text-xs text-gray-500 truncate mt-1">{activityData}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {getRelativeTime(activity.activity_date)}
                </span>
                {activity.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activity.location}
                  </span>
                )}
                {activity.cost && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />¥{activity.cost}
                  </span>
                )}
                {activity.mood_rating && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-current text-pink-500" />
                    {activity.mood_rating}/5
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for activity preview
export function PetActivityPreviewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 animate-pulse', className)}>
      {/* Quick Stats Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-200 rounded-lg h-20"></div>
        <div className="bg-gray-200 rounded-lg h-20"></div>
      </div>

      {/* Add Activity Button Skeleton */}
      <div className="bg-gray-200 rounded-xl h-12"></div>

      {/* Activity Categories Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-200 rounded-lg h-16"></div>
        <div className="bg-gray-200 rounded-lg h-16"></div>
        <div className="bg-gray-200 rounded-lg h-16"></div>
        <div className="bg-gray-200 rounded-lg h-16"></div>
      </div>

      {/* Recent Activity Placeholder Skeleton */}
      <div className="bg-gray-200 rounded-lg h-32"></div>
    </div>
  );
}
