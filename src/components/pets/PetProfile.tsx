import React from 'react';
import { type Pet } from '../../lib/types';
import { useActivitiesList } from '../../hooks/useActivitiesList';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { PetProfilePhoto } from './PetProfilePhoto';
import { cn, calculateAge } from '../../lib/utils';
import { convertActivitiesToTimelineItems } from '../../lib/utils/activityUtils';
import { ActivityPreviewSection } from '../activities/ActivityPreviewSection';
import { WeightTrendChart } from '../weight/WeightTrendChart';
import { Edit, Heart, Calendar } from 'lucide-react';

interface PetProfileProps {
  pet: Pet;
  onEdit?: (pet: Pet) => void;
  className?: string;
  disableVerticalScroll?: boolean;
}


export function PetProfile({
  pet,
  onEdit,
  className,
  disableVerticalScroll = false,
}: PetProfileProps) {
  const age = calculateAge(pet.birth_date);

  // Fetch recent activities for this pet using hook
  const {
    activities = [],
    isLoading: isActivitiesLoading,
    error: activitiesErrorMessage,
  } = useActivitiesList(pet.id);
  
  const activitiesError = activitiesErrorMessage ? new Error(activitiesErrorMessage) : null;

  // Convert activities to timeline items for display
  const timelineItems = React.useMemo(() => {
    if (!activities || activities.length === 0) return [];
    return convertActivitiesToTimelineItems(activities)
      .sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime());
  }, [activities]);

  return (
    <div
      className={cn(
        'h-full bg-gradient-to-br from-orange-50 to-yellow-50',
        disableVerticalScroll ? 'overflow-hidden' : 'overflow-y-auto',
        className,
      )}
    >
      {/* Removed navigation header - no pet switching in individual profile pages */}

      {/* Main Profile Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Pet Photo Section */}
        <div className="text-center">
          <PetProfilePhoto pet={pet} size="large" className="mx-auto mb-4" />

          {/* Pet Name and Basic Info */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-orange-900" id={`pet-name-${pet.id}`}>
              {pet.name}
            </h1>
            <div className="flex items-center justify-center gap-2 text-orange-700">
              <Heart className="w-4 h-4 fill-current" aria-hidden="true" />
              <span className="capitalize font-medium">{pet.species.toLowerCase()}</span>
            </div>
            <p className="text-lg text-orange-600">{age}</p>
          </div>

          {/* Edit Button */}
          {onEdit && (
            <Button
              onClick={() => onEdit(pet)}
              variant="outline"
              className="mt-4 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
              aria-label={`Edit ${pet.name}'s profile`}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Pet Details Card */}
        <Card className="bg-white/60 backdrop-blur-sm border-orange-200">
          <CardContent className="p-4 space-y-3">
            {pet.breed && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-700">Breed</span>
                <span className="text-sm text-orange-900">{pet.breed}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-700">Gender</span>
              <span className="text-sm text-orange-900 capitalize">{pet.gender.toLowerCase()}</span>
            </div>

            {pet.color && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-700">Color</span>
                <span className="text-sm text-orange-900">{pet.color}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-700 flex items-center gap-1">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                Born
              </span>
              <span className="text-sm text-orange-900">
                {new Date(pet.birth_date).toLocaleDateString()}
              </span>
            </div>

            {pet.weight_kg && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-700">Weight</span>
                <span className="text-sm text-orange-900">{pet.weight_kg} kg</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Card */}
        {pet.notes && (
          <Card className="bg-white/60 backdrop-blur-sm border-orange-200">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-orange-900 mb-2">Notes</h3>
              <p className="text-sm text-orange-800 whitespace-pre-wrap">{pet.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Weight Trend Chart */}
        <WeightTrendChart
          petId={pet.id}
          petBirthDate={pet.birth_date}
          className=""
        />

        {/* Recent Activities Preview */}
        <ActivityPreviewSection
          activities={timelineItems}
          petId={pet.id}
          isLoading={isActivitiesLoading}
          error={activitiesError ? 'Unable to load activities. Please try again later.' : undefined}
          maxActivities={3}
          className=""
        />

        {/* Bottom spacing for safe area */}
        <div className="h-8" />
      </div>
    </div>
  );
}

// Loading skeleton for pet profile
export function PetProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50', className)}>
      {/* Navigation Header Skeleton */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-orange-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="text-center space-y-2">
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mx-auto" />
            <div className="flex gap-1 justify-center">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6 animate-pulse">
        {/* Photo and name skeleton */}
        <div className="text-center space-y-4">
          <div className="w-80 h-80 bg-gray-200 rounded-3xl mx-auto" />
          <div className="space-y-2">
            <div className="w-32 h-8 bg-gray-200 rounded mx-auto" />
            <div className="w-20 h-5 bg-gray-200 rounded mx-auto" />
            <div className="w-24 h-5 bg-gray-200 rounded mx-auto" />
          </div>
          <div className="w-24 h-9 bg-gray-200 rounded mx-auto" />
        </div>

        {/* Details card skeleton */}
        <div className="space-y-3 bg-white/60 p-4 rounded-lg">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex justify-between">
              <div className="w-16 h-4 bg-gray-200 rounded" />
              <div className="w-20 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
