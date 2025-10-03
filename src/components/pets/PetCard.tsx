import { type Pet, PetSpecies } from '../../lib/types';
import { cn } from '../../lib/utils';
import { Dog, Cat } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { usePhotoState } from '../../hooks/usePhotoCache';

interface PetCardProps {
  pet: Pet;
  onClick: () => void;
  className?: string;
}

/**
 * PetCard - Clean, modern card component for displaying pet information
 *
 * Features:
 * - Responsive design (adapts to grid layout)
 * - Pet photo with species icon overlay
 * - Pet name and basic info
 * - Subtle hover effects
 * - Click to navigate to pet profile
 */
export function PetCard({ pet, onClick, className }: PetCardProps) {
  // Use photo state hook to get the correct photo URL
  const { photoUrl, isLoading } = usePhotoState(pet.photo_path);

  // Calculate age from birth date
  const calculateAge = (birthDate: string): string => {
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();

    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}`;
    }

    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;

    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }

    return `${years}y ${months}m`;
  };

  const age = calculateAge(pet.birth_date);
  const SpeciesIcon = pet.species === PetSpecies.Dog ? Dog : Cat;

  return (
    <Card
      className={cn(
        'group relative cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:-translate-y-1',
        'bg-white border-orange-100',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Centered Layout with Circular Photo */}
        <div className="flex flex-col items-center text-center">
          {/* Circular Photo */}
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-orange-50 to-yellow-50 ring-2 ring-orange-200/50 shadow-md">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-pulse">
                    <SpeciesIcon className="w-10 h-10 text-orange-300" strokeWidth={1.5} />
                  </div>
                </div>
              ) : pet.photo_path && photoUrl ? (
                <img
                  src={photoUrl}
                  alt={pet.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <SpeciesIcon className="w-10 h-10 text-orange-300" strokeWidth={1.5} />
                </div>
              )}
            </div>

            {/* Species Badge - Small Icon on Bottom Right */}
            <div className="absolute -bottom-0.5 -right-0.5 p-1 bg-white rounded-full shadow-md ring-1 ring-orange-100">
              <SpeciesIcon className="w-3 h-3 text-orange-600" strokeWidth={2.5} />
            </div>
          </div>

          {/* Pet Info Section */}
          <div className="w-full">
            {/* Pet Name */}
            <h3 className="text-base font-bold text-orange-900 mb-1.5 truncate group-hover:text-orange-600 transition-colors">
              {pet.name}
            </h3>

            {/* Pet Details - Inline */}
            <div className="text-xs text-orange-600 mb-1">
              <span>{pet.species}</span>
              <span className="text-orange-400 mx-1">•</span>
              <span>{age}</span>
            </div>

            {/* Breed - If exists */}
            {pet.breed && (
              <div className="text-xs text-orange-500 truncate">
                {pet.breed}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * PetCardSkeleton - Loading skeleton for PetCard
 */
export function PetCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center">
          {/* Circular Photo Skeleton */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse mb-3" />

          {/* Info Skeleton */}
          <div className="w-full space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
