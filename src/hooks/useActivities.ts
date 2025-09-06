import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Activity,
  ActivityCreateRequest,
  ActivityUpdateRequest,
  ActivityFilters,
  ActivitySearchResult,
  ActivityAttachment,
} from '../lib/types';

export interface UseActivitiesState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  filters: ActivityFilters;
  searchResults?: ActivitySearchResult;
  isSearching: boolean;
  isCacheValid: boolean;
  lastUpdated: number;
}

export interface UseActivitiesActions {
  // Data fetching
  fetchActivities: (petId?: number, limit?: number, offset?: number) => Promise<void>;
  searchActivities: (filters: ActivityFilters, limit?: number, offset?: number) => Promise<void>;
  loadMore: (limit?: number) => Promise<void>;
  refetch: () => Promise<void>;

  // CRUD operations
  createActivity: (activityData: ActivityCreateRequest) => Promise<Activity>;
  updateActivity: (id: number, activityData: ActivityUpdateRequest) => Promise<Activity>;
  deleteActivity: (id: number) => Promise<void>;

  // Attachment operations
  addAttachment: (activityId: number, attachment: File) => Promise<ActivityAttachment>;
  removeAttachment: (attachmentId: number) => Promise<void>;

  // State management
  setFilters: (filters: ActivityFilters) => void;
  clearFilters: () => void;
  clearError: () => void;
  invalidateCache: () => void;

  // Optimistic updates
  addActivityOptimistic: (activity: Activity) => void;
  updateActivityOptimistic: (id: number, updates: Partial<Activity>) => void;
  removeActivityOptimistic: (id: number) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_LIMIT = 20;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function for retry logic
const withRetry = async <T>(
  fn: () => Promise<T>,
  attempts: number = RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) throw error;

    console.warn(`Operation failed, retrying in ${delay}ms. Attempts remaining: ${attempts - 1}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, attempts - 1, delay * 1.5); // Exponential backoff
  }
};

export function useActivities(petId?: number): UseActivitiesState & UseActivitiesActions {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFiltersState] = useState<ActivityFilters>({});
  const [searchResults, setSearchResults] = useState<ActivitySearchResult>();
  const [isSearching, setIsSearching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);

  // Computed state
  const isCacheValid = Date.now() - lastUpdated < CACHE_DURATION;

  // Clear error utility
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    setLastUpdated(0);
  }, []);

  // Set filters with validation
  const setFilters = useCallback(
    (newFilters: ActivityFilters) => {
      setFiltersState(newFilters);
      invalidateCache(); // Invalidate cache when filters change
    },
    [invalidateCache],
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState({});
    invalidateCache();
  }, [invalidateCache]);

  // Fetch activities with error handling and retry logic
  const fetchActivities = useCallback(
    async (targetPetId?: number, limit = DEFAULT_LIMIT, offset = 0) => {
      console.log('=== FETCH ACTIVITIES START ===');
      console.log('petId:', targetPetId || petId);
      console.log('limit:', limit);
      console.log('offset:', offset);

      try {
        setIsLoading(true);
        setError(null);

        const result = await withRetry(() =>
          invoke<ActivitySearchResult>('get_activities', {
            petId: targetPetId || petId,
            limit,
            offset,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
          }),
        );

        console.log('Activities fetched:', result);

        if (offset === 0) {
          // Fresh fetch - replace activities
          setActivities(result.activities);
        } else {
          // Load more - append activities
          setActivities(prev => [...prev, ...result.activities]);
        }

        setHasMore(result.has_more);
        setTotalCount(result.total_count);
        setLastUpdated(Date.now());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
        console.error('Failed to fetch activities:', err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        console.log('=== FETCH ACTIVITIES END ===');
      }
    },
    [petId, filters],
  );

  // Search activities with filtering
  const searchActivities = useCallback(
    async (searchFilters: ActivityFilters, limit = DEFAULT_LIMIT, offset = 0) => {
      console.log('=== SEARCH ACTIVITIES START ===');
      console.log('filters:', searchFilters);
      console.log('limit:', limit);
      console.log('offset:', offset);

      try {
        setIsSearching(true);
        setError(null);

        const result = await withRetry(() =>
          invoke<ActivitySearchResult>('search_activities', {
            filters: searchFilters,
            limit,
            offset,
          }),
        );

        console.log('Search results:', result);

        if (offset === 0) {
          setActivities(result.activities);
        } else {
          setActivities(prev => [...prev, ...result.activities]);
        }

        setSearchResults(result);
        setHasMore(result.has_more);
        setTotalCount(result.total_count);
        setLastUpdated(Date.now());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search activities';
        console.error('Failed to search activities:', err);
        setError(errorMessage);
      } finally {
        setIsSearching(false);
        console.log('=== SEARCH ACTIVITIES END ===');
      }
    },
    [],
  );

  // Load more activities (infinite scroll)
  const loadMore = useCallback(
    async (limit = DEFAULT_LIMIT) => {
      if (isLoading || !hasMore) return;

      const currentOffset = activities.length;
      console.log('Loading more activities, offset:', currentOffset);

      if (searchResults && Object.keys(filters).length > 0) {
        await searchActivities(filters, limit, currentOffset);
      } else {
        await fetchActivities(petId, limit, currentOffset);
      }
    },
    [
      isLoading,
      hasMore,
      activities.length,
      searchResults,
      filters,
      searchActivities,
      fetchActivities,
      petId,
    ],
  );

  // Refetch current data
  const refetch = useCallback(async () => {
    if (searchResults && Object.keys(filters).length > 0) {
      await searchActivities(filters, DEFAULT_LIMIT, 0);
    } else {
      await fetchActivities(petId, DEFAULT_LIMIT, 0);
    }
  }, [searchResults, filters, searchActivities, fetchActivities, petId]);

  // Create activity with optimistic updates
  const createActivity = useCallback(
    async (activityData: ActivityCreateRequest): Promise<Activity> => {
      try {
        setError(null);

        const newActivity = await withRetry(() =>
          invoke<Activity>('create_activity', { activityData }),
        );

        // Optimistic update - add to beginning of activities list
        setActivities(prev => [newActivity, ...prev]);
        setTotalCount(prev => prev + 1);
        invalidateCache();

        console.log('Activity created successfully:', newActivity);
        return newActivity;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create activity';
        console.error('Failed to create activity:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [invalidateCache],
  );

  // Update activity with optimistic updates
  const updateActivity = useCallback(
    async (id: number, activityData: ActivityUpdateRequest): Promise<Activity> => {
      try {
        setError(null);

        const updatedActivity = await withRetry(() =>
          invoke<Activity>('update_activity', { id, activityData }),
        );

        // Optimistic update
        setActivities(prev =>
          prev.map(activity => (activity.id === id ? updatedActivity : activity)),
        );
        invalidateCache();

        console.log('Activity updated successfully:', updatedActivity);
        return updatedActivity;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update activity';
        console.error('Failed to update activity:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [invalidateCache],
  );

  // Delete activity with optimistic updates
  const deleteActivity = useCallback(
    async (id: number): Promise<void> => {
      try {
        setError(null);

        await withRetry(() => invoke('delete_activity', { id }));

        // Optimistic update - remove from activities list
        setActivities(prev => prev.filter(activity => activity.id !== id));
        setTotalCount(prev => Math.max(0, prev - 1));
        invalidateCache();

        console.log('Activity deleted successfully:', id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete activity';
        console.error('Failed to delete activity:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [invalidateCache],
  );

  // Add attachment to activity
  const addAttachment = useCallback(
    async (activityId: number, attachment: File): Promise<ActivityAttachment> => {
      try {
        setError(null);

        // Convert file to format expected by Tauri command
        const fileData = {
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          // In a real implementation, you would read the file content
          // For now, we'll send the file info and let the backend handle it
        };

        const newAttachment = await withRetry(() =>
          invoke<ActivityAttachment>('add_activity_attachment', {
            activityId,
            attachment: fileData,
          }),
        );

        // Update the activity with new attachment
        setActivities(prev =>
          prev.map(activity =>
            activity.id === activityId
              ? { ...activity, attachments: [...activity.attachments, newAttachment] }
              : activity,
          ),
        );
        invalidateCache();

        console.log('Attachment added successfully:', newAttachment);
        return newAttachment;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add attachment';
        console.error('Failed to add attachment:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [invalidateCache],
  );

  // Remove attachment from activity
  const removeAttachment = useCallback(
    async (attachmentId: number): Promise<void> => {
      try {
        setError(null);

        await withRetry(() => invoke('remove_activity_attachment', { attachmentId }));

        // Update activities by removing the attachment
        setActivities(prev =>
          prev.map(activity => ({
            ...activity,
            attachments: activity.attachments.filter(att => att.id !== attachmentId),
          })),
        );
        invalidateCache();

        console.log('Attachment removed successfully:', attachmentId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove attachment';
        console.error('Failed to remove attachment:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [invalidateCache],
  );

  // Optimistic update helpers (for immediate UI feedback)
  const addActivityOptimistic = useCallback((activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
    setTotalCount(prev => prev + 1);
  }, []);

  const updateActivityOptimistic = useCallback((id: number, updates: Partial<Activity>) => {
    setActivities(prev =>
      prev.map(activity => (activity.id === id ? { ...activity, ...updates } : activity)),
    );
  }, []);

  const removeActivityOptimistic = useCallback((id: number) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
    setTotalCount(prev => Math.max(0, prev - 1));
  }, []);

  return {
    // State
    activities,
    isLoading,
    error,
    hasMore,
    totalCount,
    filters,
    searchResults,
    isSearching,
    isCacheValid,
    lastUpdated,

    // Actions
    fetchActivities,
    searchActivities,
    loadMore,
    refetch,
    createActivity,
    updateActivity,
    deleteActivity,
    addAttachment,
    removeAttachment,
    setFilters,
    clearFilters,
    clearError,
    invalidateCache,
    addActivityOptimistic,
    updateActivityOptimistic,
    removeActivityOptimistic,
  };
}

/**
 * Pet-specific activities hook with enhanced pet context management
 * Ensures all operations are bound to the specified pet
 */
export function usePetActivities(petId: number) {
  const baseHook = useActivities(petId);

  // Enhanced create activity that auto-assigns pet ID
  const createActivityForPet = useCallback(
    async (activityData: Omit<ActivityCreateRequest, 'pet_id'>): Promise<Activity> => {
      return baseHook.createActivity({
        ...activityData,
        pet_id: petId,
      });
    },
    [baseHook, petId],
  );

  // Fetch activities with explicit pet ID enforcement
  const fetchPetActivities = useCallback(
    async (limit?: number, offset?: number) => {
      return baseHook.fetchActivities(petId, limit, offset);
    },
    [baseHook, petId],
  );

  // Set filters with pet ID automatically included
  const setPetFilters = useCallback(
    (filters: Omit<ActivityFilters, 'pet_id'>) => {
      baseHook.setFilters({
        ...filters,
        pet_id: petId,
      });
    },
    [baseHook, petId],
  );

  return {
    ...baseHook,
    // Override with pet-specific versions
    createActivity: createActivityForPet,
    fetchActivities: fetchPetActivities,
    setFilters: setPetFilters,
    // Add pet context information
    petId,
    isPetSpecific: true,
  };
}

/**
 * Hook for managing activities across all pets (for global views)
 * Maintains backward compatibility with existing usage patterns
 */
export function useAllPetActivities() {
  return useActivities(); // No pet ID filter
}

/**
 * Hook for managing activities with optional pet filtering
 * Useful for components that need to switch between pet-specific and global views
 */
export function useFlexibleActivities(petId?: number, enabled = true) {
  const activitiesHook = useActivities(enabled ? petId : undefined);

  // Toggle pet filtering
  const togglePetFilter = useCallback(
    (newPetId?: number) => {
      if (newPetId) {
        activitiesHook.fetchActivities(newPetId);
      } else {
        activitiesHook.fetchActivities(); // Fetch all
      }
    },
    [activitiesHook],
  );

  return {
    ...activitiesHook,
    togglePetFilter,
    currentPetId: petId,
    isFiltered: !!petId,
  };
}
