import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Pet } from '../../lib/types';
import { cn, calculateAge } from '../../lib/utils';
import { Heart, Edit, Trash2 } from 'lucide-react';
import { usePhotoState } from '../../hooks/usePhotoCache';

interface PetCardProps {
  pet: Pet;
  isActive: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function PetCard({
  pet,
  isActive,
  onClick,
  onEdit,
  onDelete,
  showActions = true,
}: PetCardProps) {
  const { photoUrl } = usePhotoState(pet.photo_path);

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Card
      className={cn(
        'relative w-64 h-80 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg group',
        'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200',
        isActive && 'ring-2 ring-orange-400 shadow-lg scale-105',
        pet.is_archived && 'opacity-60 grayscale',
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Photo section */}
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
          <img
            src={photoUrl}
            alt={`Photo of ${pet.name}`}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
          />

          {/* Status indicator */}
          {pet.is_archived && (
            <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
              Archived
            </div>
          )}

          {/* Action buttons */}
          {showActions && !pet.is_archived && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
              {onEdit && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={handleEditClick}
                  title="Edit pet"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={handleDeleteClick}
                  title="Delete pet"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            {/* Name and species */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-orange-900 truncate">{pet.name}</h3>
              <div className="flex items-center text-orange-600">
                <Heart className="h-4 w-4 fill-current" />
                <span className="ml-1 text-sm capitalize">{pet.species.toLowerCase()}</span>
              </div>
            </div>

            {/* Age */}
            <p className="text-sm text-orange-700 mb-2">{calculateAge(pet.birth_date)}</p>

            {/* Breed and gender */}
            <div className="text-xs text-orange-600 space-y-1">
              {pet.breed && (
                <p className="truncate">
                  <span className="font-medium">Breed:</span> {pet.breed}
                </p>
              )}
              <p>
                <span className="font-medium">Gender:</span>{' '}
                <span className="capitalize">{pet.gender.toLowerCase()}</span>
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-3 pt-3 border-t border-orange-200">
            <div className="flex justify-between text-xs text-orange-600">
              <span>Weight: {pet.weight_kg ? `${pet.weight_kg} kg` : 'Unknown'}</span>
              <span className="text-orange-400">#{pet.id}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Add Pet Card for the "+" button
interface AddPetCardProps {
  onClick: () => void;
}

export function AddPetCard({ onClick }: AddPetCardProps) {
  return (
    <Card
      className={cn(
        'w-64 h-80 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg',
        'bg-gradient-to-br from-orange-100 to-yellow-100 border-2 border-dashed border-orange-300',
        'flex items-center justify-center group',
      )}
      onClick={onClick}
    >
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-200 flex items-center justify-center group-hover:bg-orange-300 transition-colors">
          <span className="text-2xl font-bold text-orange-600">+</span>
        </div>
        <h3 className="font-semibold text-lg text-orange-900 mb-2">Add New Pet</h3>
        <p className="text-sm text-orange-600">Click to create a new pet profile</p>
      </CardContent>
    </Card>
  );
}
