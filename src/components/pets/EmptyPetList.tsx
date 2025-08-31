import { Button } from '../ui/button';

interface EmptyPetListProps {
  onAddPet: () => void;
}

export function EmptyPetList({ onAddPet }: EmptyPetListProps) {
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
