import { useRef, useEffect, useCallback } from 'react';
import { Pet } from '../../lib/types';
import { PetCard, AddPetCard } from './PetCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface PetCardListProps {
  pets: Pet[];
  activePetId?: number;
  onPetClick: (pet: Pet) => void;
  onAddPet: () => void;
  onEditPet?: (pet: Pet) => void;
  onDeletePet?: (pet: Pet) => void;
  showActions?: boolean;
  className?: string;
}

export function PetCardList({
  pets,
  activePetId,
  onPetClick,
  onAddPet,
  onEditPet,
  onDeletePet,
  showActions = true,
  className,
}: PetCardListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -280, // Card width (264px) + gap (16px)
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 280, // Card width (264px) + gap (16px)
        behavior: 'smooth',
      });
    }
  };

  const scrollToActivePet = useCallback(() => {
    if (!activePetId || !scrollContainerRef.current) return;

    const activePetIndex = pets.findIndex(pet => pet.id === activePetId);
    if (activePetIndex === -1) return;

    const cardWidth = 280; // Card width + gap
    const scrollPosition = activePetIndex * cardWidth;

    scrollContainerRef.current.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    });
  }, [activePetId, pets]);

  // Auto-scroll to active pet when it changes
  useEffect(() => {
    scrollToActivePet();
  }, [activePetId, scrollToActivePet]);

  const displayPets = pets.filter(pet => !pet.is_archived);
  const hasScrollableContent = displayPets.length > 3; // Show nav if more than 3 cards fit in view

  return (
    <div className={cn('relative', className)}>
      {/* Navigation arrows */}
      {hasScrollableContent && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-md hover:bg-white/90"
            onClick={scrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-md hover:bg-white/90"
            onClick={scrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4 py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Pet cards */}
        {displayPets.map(pet => (
          <div key={pet.id} className="flex-shrink-0">
            <PetCard
              pet={pet}
              isActive={pet.id === activePetId}
              onClick={() => onPetClick(pet)}
              onEdit={onEditPet ? () => onEditPet(pet) : undefined}
              onDelete={onDeletePet ? () => onDeletePet(pet) : undefined}
              showActions={showActions}
            />
          </div>
        ))}

        {/* Add pet card (always last) */}
        <div className="flex-shrink-0">
          <AddPetCard onClick={onAddPet} />
        </div>
      </div>

      {/* Pet counter */}
      <div className="mt-4 text-center">
        <span className="text-sm text-orange-600">
          {displayPets.length} pet{displayPets.length !== 1 ? 's' : ''} total
        </span>
      </div>
    </div>
  );
}

// Empty state component for when no pets exist
export function EmptyPetList({ onAddPet }: { onAddPet: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
          <span className="text-4xl">🐾</span>
        </div>
        <h2 className="text-2xl font-semibold text-orange-900 mb-2">Welcome to Paw Diary!</h2>
        <p className="text-orange-600 mb-6 max-w-md">
          Start your pet's journey by creating their first profile. Track their growth, health, and
          precious moments all in one place.
        </p>
      </div>

      <Button
        onClick={onAddPet}
        variant="pet"
        size="lg"
        className="shadow-md hover:shadow-lg transition-shadow"
      >
        Create Your First Pet Profile
      </Button>
    </div>
  );
}
