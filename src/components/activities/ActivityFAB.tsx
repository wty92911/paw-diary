import React, { useState } from 'react';
import { Pet } from '../../lib/types';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Plus, Heart, Calendar, Activity, X } from 'lucide-react';

interface ActivityFABProps {
  pets: Pet[];
  selectedPet?: Pet;
  onAddActivity: (pet: Pet) => void;
  onShowTimeline?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}

export const ActivityFAB: React.FC<ActivityFABProps> = ({
  pets,
  selectedPet,
  onAddActivity,
  onShowTimeline,
  position = 'bottom-right',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const activePets = pets.filter(p => !p.is_archived);

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2',
  };

  const handleMainAction = () => {
    if (selectedPet) {
      // If there's a selected pet, directly add activity
      onAddActivity(selectedPet);
    } else if (activePets.length === 1) {
      // If only one pet, directly add activity for that pet
      onAddActivity(activePets[0]);
    } else {
      // Multiple pets, show selection menu
      setIsExpanded(!isExpanded);
    }
  };

  const handlePetSelect = (pet: Pet) => {
    onAddActivity(pet);
    setIsExpanded(false);
  };

  const handleShowTimeline = () => {
    onShowTimeline?.();
    setIsExpanded(false);
  };

  // Don't render if no pets
  if (activePets.length === 0) {
    return null;
  }

  return (
    <div className={cn(positionClasses[position], 'z-50', className)}>
      {/* Expanded Pet Selection Menu */}
      {isExpanded && activePets.length > 1 && (
        <div className="mb-4 bg-white rounded-lg shadow-lg border border-orange-200 p-2 min-w-[200px]">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-orange-100 mb-2">
            <span className="text-sm font-medium text-orange-900">Add Activity For:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Pet List */}
          <div className="space-y-1">
            {activePets.map(pet => (
              <Button
                key={pet.id}
                variant="ghost"
                onClick={() => handlePetSelect(pet)}
                className="w-full justify-start text-left p-2 h-auto hover:bg-orange-50"
              >
                <Heart className="h-4 w-4 mr-2 text-orange-500 fill-current flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-orange-900 truncate">{pet.name}</p>
                  <p className="text-xs text-orange-600 truncate capitalize">
                    {pet.species.toLowerCase()}
                  </p>
                </div>
              </Button>
            ))}
          </div>

          {/* Timeline Action */}
          {onShowTimeline && (
            <div className="mt-2 pt-2 border-t border-orange-100">
              <Button
                variant="ghost"
                onClick={handleShowTimeline}
                className="w-full justify-start text-left p-2 h-auto hover:bg-orange-50"
              >
                <Activity className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">View All Activities</p>
                  <p className="text-xs text-orange-600">Browse timeline</p>
                </div>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Main FAB Button */}
      <Button
        onClick={handleMainAction}
        className={cn(
          'h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
          'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600',
          'text-white border-2 border-white/20',
          'transform hover:scale-105 active:scale-95',
          isExpanded && activePets.length > 1 && 'rotate-45',
        )}
        size="icon"
        aria-label={
          selectedPet
            ? `Add activity for ${selectedPet.name}`
            : activePets.length === 1
              ? `Add activity for ${activePets[0].name}`
              : 'Add activity'
        }
      >
        {isExpanded && activePets.length > 1 ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>

      {/* Quick Access Timeline Button (when collapsed and timeline available) */}
      {!isExpanded && onShowTimeline && activePets.length > 1 && (
        <Button
          onClick={handleShowTimeline}
          className={cn(
            'h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
            'bg-white/90 hover:bg-white text-orange-600 hover:text-orange-700',
            'border border-orange-200 mb-2',
            'transform hover:scale-105 active:scale-95',
          )}
          size="icon"
          aria-label="View activity timeline"
        >
          <Calendar className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default ActivityFAB;
