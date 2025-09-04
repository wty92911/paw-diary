import { useState } from 'react';
import { Pet } from '../../lib/types';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Plus, Heart, Loader2 } from 'lucide-react';

interface AddActivityButtonProps {
  pet: Pet;
  onAddActivity: (pet: Pet) => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'fab' | 'button';
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

/**
 * AddActivityButton - Pet-specific activity creation button
 * 
 * Features:
 * - Pre-fills pet context for activity creation
 * - Multiple display variants (FAB, button)
 * - Floating or inline positioning options
 * - Loading states and disabled states
 * - Consistent styling with ActivityFAB patterns
 */
export function AddActivityButton({
  pet,
  onAddActivity,
  position = 'bottom-right',
  size = 'md',
  variant = 'button',
  disabled = false,
  isLoading = false,
  className,
}: AddActivityButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  // Position classes for FAB variant
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6', 
    'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2',
    'inline': 'relative',
  };

  // Size classes
  const sizeClasses = {
    sm: variant === 'fab' ? 'h-12 w-12' : 'h-8 px-3 text-sm',
    md: variant === 'fab' ? 'h-14 w-14' : 'h-10 px-4',
    lg: variant === 'fab' ? 'h-16 w-16' : 'h-12 px-6 text-lg',
  };

  // Icon size classes
  const iconSizes = {
    sm: 'h-4 w-4',
    md: variant === 'fab' ? 'h-6 w-6' : 'h-4 w-4',
    lg: variant === 'fab' ? 'h-7 w-7' : 'h-5 w-5',
  };

  const handleClick = () => {
    if (disabled || isLoading) return;
    
    setIsPressed(true);
    onAddActivity(pet);
    
    // Reset pressed state after animation
    setTimeout(() => setIsPressed(false), 150);
  };

  // FAB variant
  if (variant === 'fab') {
    return (
      <div className={cn(positionClasses[position], 'z-50', className)}>
        <Button
          onClick={handleClick}
          disabled={disabled || isLoading}
          className={cn(
            sizeClasses[size],
            'rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
            'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600',
            'text-white border-2 border-white/20',
            'transform hover:scale-105 active:scale-95',
            isPressed && 'scale-95',
            (disabled || isLoading) && 'opacity-60 cursor-not-allowed transform-none hover:shadow-lg'
          )}
          size="icon"
          aria-label={`Add activity for ${pet.name}`}
        >
          {isLoading ? (
            <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
          ) : (
            <Plus className={iconSizes[size]} />
          )}
        </Button>
      </div>
    );
  }

  // Button variant
  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        sizeClasses[size],
        'bg-orange-500 hover:bg-orange-600 text-white font-medium',
        'transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-150',
        'shadow-sm hover:shadow-md',
        isPressed && 'scale-[0.98]',
        (disabled || isLoading) && 'opacity-60 cursor-not-allowed transform-none',
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className={cn(iconSizes[size], 'mr-2 animate-spin')} />
          Adding...
        </>
      ) : (
        <>
          <Plus className={cn(iconSizes[size], 'mr-2')} />
          Add Activity
        </>
      )}
    </Button>
  );
}

/**
 * PetActivityFAB - Convenience component for pet-specific floating action button
 * Combines pet avatar with add activity functionality
 */
export function PetActivityFAB({
  pet,
  onAddActivity,
  position = 'bottom-right',
  className,
}: {
  pet: Pet;
  onAddActivity: (pet: Pet) => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2',
  };

  const handleClick = () => {
    setIsPressed(true);
    onAddActivity(pet);
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <div className={cn(positionClasses[position], 'z-50', className)}>
      <div className="flex flex-col items-center gap-2">
        {/* Pet avatar */}
        <div className="bg-white rounded-full p-1 shadow-md border border-orange-200">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-orange-500 fill-current" />
          </div>
        </div>

        {/* Add button */}
        <Button
          onClick={handleClick}
          className={cn(
            'h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
            'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600',
            'text-white border-2 border-white/20',
            'transform hover:scale-105 active:scale-95',
            isPressed && 'scale-95'
          )}
          size="icon"
          aria-label={`Add activity for ${pet.name}`}
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Pet name label */}
        <span className="text-xs text-orange-700 bg-white/90 px-2 py-1 rounded-full shadow-sm border border-orange-200">
          {pet.name}
        </span>
      </div>
    </div>
  );
}

export default AddActivityButton;