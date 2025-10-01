import { Pet } from '../../lib/types';
import { Button } from '../ui/button';
import { PetProfilePhoto } from './PetProfilePhoto';
import { calculateAge, cn } from '../../lib/utils';
import {
  Edit,
  Calendar,
  Scale,
  Palette,
  Info
} from 'lucide-react';

interface PetProfileHeaderProps {
  pet: Pet;
  onEdit?: () => void;
  className?: string;
  showEditButton?: boolean;
  size?: 'compact' | 'full';
}

/**
 * PetProfileHeader - Consistent pet profile header component
 * 
 * Features:
 * - Pet photo with loading states
 * - Pet basic information display
 * - Age calculation
 * - Action buttons (edit)
 * - Species and gender badges
 * - Responsive design
 */
export function PetProfileHeader({
  pet,
  onEdit,
  className,
  showEditButton = true,
  size = 'full',
}: PetProfileHeaderProps) {
  const age = calculateAge(pet.birth_date);
  const isCompact = size === 'compact';

  return (
    <div className={cn(
      "bg-white rounded-3xl shadow-sm border border-orange-100/50 overflow-hidden relative",
      className
    )}>
      {/* Full Size Layout - Hero Banner Style */}
      {!isCompact && (
        <>
          {/* Edit Button - Ghost Style Top Right */}
          {showEditButton && onEdit && (
            <div className="absolute top-8 right-8 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all"
              >
                <Edit className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
            </div>
          )}

          {/* Hero Banner - Centered Layout */}
          <div className="px-12 pt-16 pb-12">
            {/* Centered Photo - Large Circular */}
            <div className="flex justify-center mb-8">
              <PetProfilePhoto
                pet={pet}
                size="hero"
                className="w-48 h-48 rounded-full shadow-2xl ring-6 ring-white"
              />
            </div>

            {/* Centered Name */}
            <div className="text-center mb-6">
              <h1 className="text-5xl font-bold text-orange-800 mb-4 tracking-tight">
                {pet.name}
              </h1>

              {/* Inline Badges - Clean Text with Dots (No Age) */}
              <div className="flex items-center justify-center gap-3 text-lg text-orange-600 font-medium">
                <span>{pet.species}</span>
                <span className="text-orange-400">•</span>
                <span>{pet.gender}</span>
              </div>
            </div>

            {/* Information Cards Grid - Icon First, Minimalist */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Age Card */}
              <div className="group bg-gradient-to-br from-white to-orange-50/30 rounded-xl p-5 border border-orange-100/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex flex-col items-center text-center gap-2.5">
                  <Calendar className="w-7 h-7 text-orange-500 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xl font-bold text-orange-900 mb-0.5">{age}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Age</p>
                  </div>
                </div>
              </div>

              {/* Weight Card */}
              {pet.weight_kg && (
                <div className="group bg-gradient-to-br from-white to-orange-50/30 rounded-xl p-5 border border-orange-100/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex flex-col items-center text-center gap-2.5">
                    <Scale className="w-7 h-7 text-orange-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xl font-bold text-orange-900 mb-0.5">{pet.weight_kg} kg</p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Weight</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Breed Card */}
              {pet.breed && (
                <div className="group bg-gradient-to-br from-white to-orange-50/30 rounded-xl p-5 border border-orange-100/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex flex-col items-center text-center gap-2.5">
                    <Palette className="w-7 h-7 text-orange-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xl font-bold text-orange-900 mb-0.5 truncate max-w-full">{pet.breed}</p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Breed</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Card */}
              {pet.color && (
                <div className="group bg-gradient-to-br from-white to-orange-50/30 rounded-xl p-5 border border-orange-100/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex flex-col items-center text-center gap-2.5">
                    <Info className="w-7 h-7 text-orange-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xl font-bold text-orange-900 mb-0.5 truncate max-w-full">{pet.color}</p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Color</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes Section - If Present */}
            {pet.notes && (
              <div className="mt-8">
                <div className="bg-orange-50/50 rounded-xl p-5 border border-orange-100/50">
                  <h3 className="font-semibold text-orange-900 mb-2.5 flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-orange-500" />
                    About {pet.name}
                  </h3>
                  <p className="text-orange-700 leading-relaxed text-sm">
                    {pet.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Compact Size Layout */}
      {isCompact && (
        <div className="p-6">
          <div className="flex gap-5 items-start">
            {/* Pet Photo - Larger Circle */}
            <div className="flex-shrink-0">
              <PetProfilePhoto
                pet={pet}
                size="large"
                className="w-24 h-24 rounded-full shadow-lg ring-4 ring-white"
              />
            </div>

            {/* Pet Information */}
            <div className="flex-grow min-w-0 pt-1">
              <h1 className="text-2xl font-bold text-orange-800 mb-3 tracking-tight">
                {pet.name}
              </h1>

              {/* Inline Info - No Badge Boxes, No Age */}
              <div className="flex items-center gap-2.5 text-sm text-orange-600 font-medium mb-3">
                <span>{pet.species}</span>
                <span className="text-orange-400">•</span>
                <span>{pet.gender}</span>
              </div>

              {/* Additional Details */}
              {(age || pet.breed || pet.weight_kg) && (
                <div className="flex items-center gap-2.5 text-xs text-orange-500">
                  <span>{age}</span>
                  {(pet.breed || pet.weight_kg) && <span className="text-orange-300">•</span>}
                  {pet.breed && <span>{pet.breed}</span>}
                  {pet.breed && pet.weight_kg && <span className="text-orange-300">•</span>}
                  {pet.weight_kg && <span>{pet.weight_kg}kg</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PetProfileHeader;