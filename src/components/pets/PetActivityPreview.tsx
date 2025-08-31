import React from 'react';
import { Pet } from '../../lib/types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { cn, calculateAge, formatWeight } from '../../lib/utils';
import { Plus, Calendar, Heart, Scale, Activity, TrendingUp, PieChart, Clock } from 'lucide-react';

interface PetActivityPreviewProps {
  pet: Pet;
  onAddActivity?: () => void;
  className?: string;
}

export function PetActivityPreview({ pet, onAddActivity, className }: PetActivityPreviewProps) {
  const age = calculateAge(pet.birth_date);
  const weight = formatWeight(pet.weight_kg);

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
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Activity
      </Button>

      {/* Activity Categories Preview */}
      <div className="grid grid-cols-2 gap-3">
        <ActivityCategoryCard
          icon={Heart}
          title="Health"
          count={0}
          color="red"
          description="Vet visits & checkups"
        />
        <ActivityCategoryCard
          icon={TrendingUp}
          title="Growth"
          count={0}
          color="green"
          description="Weight & size tracking"
        />
        <ActivityCategoryCard
          icon={PieChart}
          title="Diet"
          count={0}
          color="purple"
          description="Food & treats"
        />
        <ActivityCategoryCard
          icon={Activity}
          title="Lifestyle"
          count={0}
          color="blue"
          description="Play & exercise"
        />
      </div>

      {/* Recent Activity Placeholder */}
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
