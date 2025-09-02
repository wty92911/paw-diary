import React, { useState, useCallback, useMemo } from 'react';
import { Pet, ActivityFilters } from '../../lib/types';
import { Button } from '../ui/button';
import { ActivityTimeline } from './ActivityTimeline';
import { ActivityFilters as ActivityFiltersComponent } from './ActivityFilters';
import { useActivities } from '../../hooks/useActivities';
import { ArrowLeft, Plus, Filter, Search, Calendar, X } from 'lucide-react';

interface ActivityTimelinePageProps {
  pets: Pet[];
  selectedPetId?: number;
  selectedActivityId?: number;
  showFilters?: boolean;
  onBack: () => void;
  onAddActivity: (pet?: Pet) => void;
  onActivityEdit?: (activityId: number) => void;
  onPetFilterChange?: (petId?: number) => void;
  onToggleFilters?: () => void;
  className?: string;
}

export const ActivityTimelinePage: React.FC<ActivityTimelinePageProps> = ({
  pets,
  selectedPetId,
  selectedActivityId,
  showFilters = false,
  onBack,
  onAddActivity,
  onActivityEdit,
  onPetFilterChange,
  onToggleFilters,
  className = '',
}) => {
  const [activeFilters, setActiveFilters] = useState<ActivityFilters>({});

  // Get selected pet
  const selectedPet = useMemo(() => {
    return selectedPetId ? pets.find(p => p.id === selectedPetId) : undefined;
  }, [pets, selectedPetId]);

  // Activity data management
  const { activities, isLoading, error, fetchActivities, searchActivities, hasMore, loadMore } =
    useActivities(selectedPetId);

  // Apply filters when they change
  React.useEffect(() => {
    const filters: ActivityFilters = {
      ...activeFilters,
      pet_id: selectedPetId,
    };

    if (Object.keys(filters).length > 1) {
      // More than just pet_id
      searchActivities(filters);
    } else {
      fetchActivities(selectedPetId);
    }
  }, [activeFilters, selectedPetId, searchActivities, fetchActivities]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: ActivityFilters) => {
    setActiveFilters(newFilters);
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setActiveFilters({});
    onPetFilterChange?.(undefined);
  }, [onPetFilterChange]);

  // Pet selection
  const handlePetSelect = useCallback(
    (pet?: Pet) => {
      onPetFilterChange?.(pet?.id);
    },
    [onPetFilterChange],
  );

  // Quick add activity for current pet or show pet selector
  const handleQuickAddActivity = useCallback(() => {
    if (selectedPet) {
      onAddActivity(selectedPet);
    } else {
      onAddActivity(); // Show pet selector in activity form
    }
  }, [selectedPet, onAddActivity]);

  // Bridge function for loadMore interface mismatch
  const handleLoadMore = useCallback(
    async (_offset: number, limit: number): Promise<any> => {
      await loadMore(limit);
      return { activities: [], total: 0, hasMore: false }; // ActivityTimeline will use the activities from props
    },
    [loadMore],
  );

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.search_query) count++;
    if (activeFilters.category && activeFilters.category.length > 0) count++;
    if (activeFilters.subcategory && activeFilters.subcategory.length > 0) count++;
    if (activeFilters.date_range) count++;
    if (activeFilters.cost_range) count++;
    if (activeFilters.has_attachments) count++;
    if (selectedPetId) count++;
    return count;
  }, [activeFilters, selectedPetId]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 ${className}`}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Navigation */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-orange-700 hover:text-orange-800 hover:bg-orange-100"
                aria-label="Back to main view"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div>
                <h1 className="text-xl font-bold text-orange-900">Activity Timeline</h1>
                <p className="text-sm text-orange-600">
                  {selectedPet ? `${selectedPet.name}'s Activities` : 'All Activities'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Filter Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFilters}
                className={`text-orange-700 hover:text-orange-800 hover:bg-orange-100 ${
                  showFilters ? 'bg-orange-100' : ''
                }`}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Add Activity FAB */}
              <Button
                onClick={handleQuickAddActivity}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white/60 backdrop-blur-sm rounded-lg border border-orange-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-orange-900">Filters & Search</h3>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <ActivityFiltersComponent
              filters={activeFilters}
              onFiltersChange={handleFiltersChange}
              className="space-y-4"
            />
          </div>
        )}

        {/* Pet Selector Chips */}
        {pets.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Filter by Pet:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedPetId ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePetSelect()}
                className={`${
                  !selectedPetId
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'text-orange-700 border-orange-300 hover:bg-orange-50'
                }`}
              >
                All Pets
              </Button>
              {pets
                .filter(p => !p.is_archived)
                .map(pet => (
                  <Button
                    key={pet.id}
                    variant={selectedPetId === pet.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePetSelect(pet)}
                    className={`${
                      selectedPetId === pet.id
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'text-orange-700 border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    {pet.name}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && activities.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
              <Search className="h-12 w-12 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-orange-900 mb-2">
              {activeFilterCount > 0 ? 'No activities found' : 'No activities yet'}
            </h3>
            <p className="text-orange-600 mb-6 max-w-md mx-auto">
              {activeFilterCount > 0
                ? 'Try adjusting your filters or search terms to find activities.'
                : selectedPet
                  ? `Start tracking ${selectedPet.name}'s daily activities, health records, and milestones.`
                  : "Begin recording your pets' activities to see their timeline here."}
            </p>
            <Button
              onClick={handleQuickAddActivity}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {selectedPet ? `Add ${selectedPet.name}'s First Activity` : 'Add First Activity'}
            </Button>
          </div>
        )}

        {/* Activity Timeline */}
        {(activities.length > 0 || isLoading) && (
          <ActivityTimeline
            activities={activities}
            isLoading={isLoading}
            error={error}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onEditActivity={onActivityEdit ? activity => onActivityEdit(activity.id) : undefined}
            petId={selectedActivityId}
            className="space-y-4"
          />
        )}
      </div>
    </div>
  );
};

export default ActivityTimelinePage;
