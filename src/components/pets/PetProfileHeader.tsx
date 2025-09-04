import { Pet } from '../../lib/types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PetProfilePhoto } from './PetProfilePhoto';
import { calculateAge, cn } from '../../lib/utils';
import { 
  Edit, 
  Calendar, 
  Heart, 
  Scale, 
  Palette,
  Info
} from 'lucide-react';

interface PetProfileHeaderProps {
  pet: Pet;
  onEdit?: () => void;
  onAddActivity?: () => void;
  className?: string;
  showEditButton?: boolean;
  showAddActivityButton?: boolean;
  size?: 'compact' | 'full';
}

/**
 * PetProfileHeader - Consistent pet profile header component
 * 
 * Features:
 * - Pet photo with loading states
 * - Pet basic information display
 * - Age calculation
 * - Action buttons (edit, add activity)
 * - Species and gender badges
 * - Responsive design
 */
export function PetProfileHeader({
  pet,
  onEdit,
  onAddActivity,
  className,
  showEditButton = true,
  showAddActivityButton = true,
  size = 'full',
}: PetProfileHeaderProps) {
  const age = calculateAge(pet.birth_date);
  const isCompact = size === 'compact';

  return (
    <div className={cn(
      "bg-white rounded-lg border border-orange-100 overflow-hidden",
      className
    )}>
      {/* Header Section */}
      <div className={cn(
        "flex gap-6 p-6",
        isCompact && "gap-4 p-4"
      )}>
        {/* Pet Photo */}
        <div className="flex-shrink-0">
          <PetProfilePhoto
            pet={pet}
            size={isCompact ? 'large' : 'hero'}
            className={cn(
              "rounded-lg shadow-md",
              isCompact ? "w-20 h-20" : "w-32 h-32"
            )}
          />
        </div>

        {/* Pet Information */}
        <div className="flex-grow min-w-0">
          {/* Name and Badges */}
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0 flex-grow">
              <h1 className={cn(
                "font-bold text-orange-900 truncate",
                isCompact ? "text-xl" : "text-2xl"
              )}>
                {pet.name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge 
                  variant="secondary" 
                  className="bg-orange-100 text-orange-800 hover:bg-orange-200"
                >
                  {pet.species}
                </Badge>
                <Badge 
                  variant="outline"
                  className="border-orange-200 text-orange-700"
                >
                  {pet.gender}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 ml-4">
              {showEditButton && onEdit && (
                <Button
                  variant="outline"
                  size={isCompact ? "sm" : "default"}
                  onClick={onEdit}
                  className="text-orange-700 border-orange-200 hover:bg-orange-50"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {!isCompact && "Edit"}
                </Button>
              )}
              {showAddActivityButton && onAddActivity && (
                <Button
                  onClick={onAddActivity}
                  size={isCompact ? "sm" : "default"}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Heart className="w-4 h-4 mr-1" />
                  {!isCompact && "Add Activity"}
                </Button>
              )}
            </div>
          </div>

          {/* Pet Details */}
          {!isCompact && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-orange-700">
              {/* Age */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Age:</span>
                <span>{age}</span>
              </div>

              {/* Breed */}
              {pet.breed && (
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">Breed:</span>
                  <span className="truncate">{pet.breed}</span>
                </div>
              )}

              {/* Weight */}
              {pet.weight_kg && (
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">Weight:</span>
                  <span>{pet.weight_kg} kg</span>
                </div>
              )}

              {/* Color */}
              {pet.color && (
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">Color:</span>
                  <span className="truncate">{pet.color}</span>
                </div>
              )}
            </div>
          )}

          {/* Compact Details */}
          {isCompact && (
            <div className="text-sm text-orange-600">
              <span>{age}</span>
              {pet.breed && <span className="ml-2">• {pet.breed}</span>}
              {pet.weight_kg && <span className="ml-2">• {pet.weight_kg}kg</span>}
            </div>
          )}
        </div>
      </div>

      {/* Notes Section (full size only) */}
      {!isCompact && pet.notes && (
        <div className="px-6 pb-6 pt-0">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            <h3 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Notes
            </h3>
            <p className="text-sm text-orange-700 leading-relaxed">
              {pet.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PetProfileHeader;