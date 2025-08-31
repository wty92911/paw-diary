import { Pet } from '../../lib/types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { PetProfilePhoto } from './PetProfilePhoto';
import { PetActivityPreview } from './PetActivityPreview';
import { cn, calculateAge } from '../../lib/utils';
import { ArrowLeft, ArrowRight, Edit, Heart, Calendar } from 'lucide-react';

interface PetProfileProps {
  pet: Pet;
  onEdit?: (pet: Pet) => void;
  onAddActivity?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalPets?: number;
  className?: string;
}

export function PetProfile({
  pet,
  onEdit,
  onAddActivity,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  currentIndex,
  totalPets,
  className,
}: PetProfileProps) {
  const age = calculateAge(pet.birth_date);

  return (
    <div
      className={cn(
        'h-full bg-gradient-to-br from-orange-50 to-yellow-50 overflow-y-auto',
        className,
      )}
    >
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-orange-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {/* Previous button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="text-orange-700 hover:text-orange-800 hover:bg-orange-100 disabled:opacity-50"
            aria-label="Previous pet"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Pet counter */}
          {typeof currentIndex === 'number' && typeof totalPets === 'number' && (
            <div className="text-center" role="status" aria-live="polite">
              <p className="text-sm font-medium text-orange-900">
                {currentIndex + 1} of {totalPets}
              </p>
              <div
                className="flex gap-1 mt-1"
                aria-label={`Pet ${currentIndex + 1} of ${totalPets}`}
              >
                {Array.from({ length: totalPets }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      i === currentIndex ? 'bg-orange-500' : 'bg-orange-200',
                    )}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Next button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            disabled={!hasNext}
            className="text-orange-700 hover:text-orange-800 hover:bg-orange-100 disabled:opacity-50"
            aria-label="Next pet"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

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

        {/* Activity Preview Section */}
        <section aria-labelledby={`pet-name-${pet.id}`}>
          <h2 className="text-xl font-bold text-orange-900 mb-4">Activities & Health</h2>
          <PetActivityPreview pet={pet} onAddActivity={onAddActivity} />
        </section>

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

        {/* Activity preview skeleton */}
        <div className="space-y-4">
          <div className="w-32 h-6 bg-gray-200 rounded" />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 bg-gray-200 rounded-lg" />
              <div className="h-20 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="h-32 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
