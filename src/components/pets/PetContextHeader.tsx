import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { type Pet } from '../../lib/types';
import { Button } from '../ui/button';
import { PetProfilePhoto } from './PetProfilePhoto';
import { cn } from '../../lib/utils';

interface PetContextHeaderProps {
  pet: Pet;
  showBackButton?: boolean;
  backAction?: () => void;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    active?: boolean;
  }>;
  className?: string;
}

/**
 * PetContextHeader - Consistent header showing pet context across activity pages
 * 
 * Features:
 * - Shows pet name, photo, and basic info
 * - Configurable back navigation
 * - Breadcrumb-style navigation indicators
 * - Responsive design for mobile and desktop
 * 
 * Used in:
 * - ActivitiesListPage: Shows pet context with back to profile
 * - ActivityEditorPage: Shows pet context with back to activities list
 */
export function PetContextHeader({
  pet,
  showBackButton = true,
  backAction,
  breadcrumbs,
  className,
}: PetContextHeaderProps) {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (backAction) {
      backAction();
    } else {
      // Default back behavior - go to pet profile
      navigate(`/pets/${pet.id}`);
    }
  };

  return (
    <header
      className={cn(
        'bg-white border-b border-orange-100 shadow-sm',
        className
      )}
    >
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">Back</span>
            </Button>
          )}

          {/* Pet Photo - Small size for header */}
          <div className="flex-shrink-0">
            <PetProfilePhoto
              pet={pet}
              size="medium"
              className="w-12 h-12"
              showPlaceholder={true}
            />
          </div>

          {/* Pet Info and Breadcrumbs */}
          <div className="flex-1 min-w-0">
            {/* Pet Name and Basic Info */}
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {pet.name}
              </h1>
              <span className="text-sm text-gray-500 font-medium">
                {pet.species}
              </span>
            </div>

            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
                <ol className="flex items-center gap-1">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <li key={index} className="flex items-center gap-1">
                      {index > 0 && (
                        <ChevronRight className="w-3 h-3 text-gray-400" aria-hidden="true" />
                      )}
                      {breadcrumb.href && !breadcrumb.active ? (
                        <button
                          onClick={() => navigate(breadcrumb.href!)}
                          className="text-orange-600 hover:text-orange-700 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded"
                        >
                          {breadcrumb.label}
                        </button>
                      ) : (
                        <span
                          className={cn(
                            breadcrumb.active
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-500'
                          )}
                          aria-current={breadcrumb.active ? 'page' : undefined}
                        >
                          {breadcrumb.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Default breadcrumb when none provided */}
            {!breadcrumbs && (
              <p className="text-sm text-gray-500">
                Activity Management
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Loading skeleton for PetContextHeader
 */
export function PetContextHeaderSkeleton({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        'bg-white border-b border-orange-100 shadow-sm animate-pulse',
        className
      )}
      role="status"
      aria-label="Loading pet context header"
    >
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Back Button Skeleton */}
          <div className="w-16 h-8 bg-orange-100 rounded" />

          {/* Pet Photo Skeleton */}
          <div className="w-12 h-12 bg-orange-100 rounded-full" />

          {/* Pet Info Skeleton */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-24 h-5 bg-gray-200 rounded" />
              <div className="w-12 h-4 bg-gray-100 rounded" />
            </div>
            <div className="w-32 h-4 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </header>
  );
}