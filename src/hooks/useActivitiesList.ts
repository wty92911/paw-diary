import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { Activity, activityKeys } from './useActivities';
import { ActivityFilters } from '../components/activities/FilterBar';
{
  /* Unused imports removed */
}

export interface ActivitiesListState {
  // Data
  activities: Activity[];
  filteredActivities: Activity[];
  isLoading: boolean;
  error: string | null;

  // UI State
  filters: ActivityFilters;

  // Loading states for operations
  isDeleting: boolean;
  isDuplicating: boolean;
}

export interface ActivitiesListActions {
  // Filter management
  updateFilters: (filters: Partial<ActivityFilters>) => void;
  clearFilters: () => void;

  // Activity operations with optimistic updates
  deleteActivity: (activityId: number) => Promise<void>;
  duplicateActivity: (activityId: number) => Promise<void>;
}

/**
 * Hook for managing activities list page state and operations
 *
 * Features:
 * - Fetches activities for a specific pet
 * - Manages filtering, sorting, and pagination state
 * - Persists user preferences per pet
 * - Provides optimistic updates for mutations
 * - Handles loading and error states
 */
export function useActivitiesList(petId: number): ActivitiesListState & ActivitiesListActions {
  const queryClient = useQueryClient();

  // Initialize filters from localStorage
  const getInitialFilters = useCallback((): ActivityFilters => {
    try {
      const stored = localStorage.getItem(`activity-filters-${petId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          categories: parsed.categories || [],
          searchQuery: parsed.searchQuery || '',
          dateRange: parsed.dateRange,
          hasAttachments: parsed.hasAttachments,
          costRange: parsed.costRange,
        };
      }
    } catch (error) {
      console.warn('Failed to load stored filters:', error);
    }

    return {
      categories: [],
      searchQuery: '',
    };
  }, [petId]);

  // State management
  const [filters, setFilters] = useState<ActivityFilters>(getInitialFilters);

  // Persist filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`activity-filters-${petId}`, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters:', error);
    }
  }, [filters, petId]);

  // Fetch activities using optimized cache keys
  const {
    data: activities = [],
    isLoading,
    error,
  } = useQuery<Activity[]>({
    queryKey: activityKeys.list(petId),
    queryFn: async () => {
      const result = await invoke('get_activities_for_pet', { petId });
      return result as Activity[];
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    enabled: !!petId, // Prevent unnecessary calls
  });

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Apply filters
    if (filters.categories.length > 0) {
      filtered = filtered.filter(activity => filters.categories.includes(activity.category as any));
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        activity =>
          activity.title.toLowerCase().includes(query) ||
          activity.subcategory.toLowerCase().includes(query) ||
          activity.description?.toLowerCase().includes(query),
      );
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.activity_date);
        if (start && activityDate < start) return false;
        if (end && activityDate > end) return false;
        return true;
      });
    }

    if (filters.hasAttachments) {
      filtered = filtered.filter(
        activity =>
          activity.activity_data.blocks.attachments &&
          Array.isArray(activity.activity_data.blocks.attachments) &&
          activity.activity_data.blocks.attachments.length > 0,
      );
    }

    if (filters.costRange) {
      const { min, max } = filters.costRange;
      filtered = filtered.filter(activity => {
        const cost = activity.activity_data.blocks.cost?.amount;
        if (!cost) return false;
        if (min !== undefined && cost < min) return false;
        if (max !== undefined && cost > max) return false;
        return true;
      });
    }

    // Sort by date (newest first) as default
    return [...filtered].sort((a, b) => {
      return new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime();
    });
  }, [activities, filters]);

  // Mutations with optimized cache keys and improved optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async (activityId: number) => {
      await invoke('delete_activity', { activityId });
    },
    onMutate: async activityId => {
      // Cancel outgoing refetches using optimized cache keys
      await queryClient.cancelQueries({ queryKey: activityKeys.list(petId) });

      // Snapshot previous value
      const previousActivities = queryClient.getQueryData<Activity[]>(activityKeys.list(petId));

      // Optimistically update
      queryClient.setQueryData<Activity[]>(activityKeys.list(petId), (old = []) =>
        old.filter(activity => activity.id !== activityId),
      );

      return { previousActivities };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousActivities) {
        queryClient.setQueryData(activityKeys.list(petId), context.previousActivities);
      }
    },
    onSuccess: (_, activityId) => {
      // Remove from detail cache as well
      queryClient.removeQueries({ queryKey: activityKeys.detail(activityId) });
    },
    onSettled: () => {
      // Refetch to ensure consistency using optimized cache keys
      queryClient.invalidateQueries({ queryKey: activityKeys.list(petId) });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (activityId: number) => {
      const result = await invoke('duplicate_activity', { activityId, petId });
      return result as Activity;
    },
    onMutate: async activityId => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: activityKeys.list(petId) });

      // Get original activity for optimistic update
      const originalActivity = queryClient
        .getQueryData<Activity[]>(activityKeys.list(petId))
        ?.find(activity => activity.id === activityId);

      if (originalActivity) {
        // Create optimistic duplicate
        const tempDuplicate: Activity = {
          ...originalActivity,
          id: Date.now(), // Temporary ID
          title: `${originalActivity.title} (Copy)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Add to cache optimistically
        queryClient.setQueryData<Activity[]>(activityKeys.list(petId), (old = []) => [
          tempDuplicate,
          ...old,
        ]);

        return { originalActivity, tempDuplicate };
      }

      return {};
    },
    onSuccess: (newActivity, _, context) => {
      // Replace optimistic update with real data
      queryClient.setQueryData<Activity[]>(activityKeys.list(petId), (old = []) => {
        if (context?.tempDuplicate) {
          // Replace temp activity with real one
          return old.map(activity =>
            activity.id === context.tempDuplicate.id ? newActivity : activity,
          );
        } else {
          // Fallback: just add to start
          return [newActivity, ...old];
        }
      });

      // Cache the individual activity
      queryClient.setQueryData(activityKeys.detail(newActivity.id), newActivity);
    },
    onError: (_, __, context) => {
      // Remove optimistic update on error
      if (context?.tempDuplicate) {
        queryClient.setQueryData<Activity[]>(activityKeys.list(petId), (old = []) =>
          old.filter(activity => activity.id !== context.tempDuplicate.id),
        );
      }
      // Refetch on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: activityKeys.list(petId) });
    },
    onSettled: newActivity => {
      // Ensure consistency
      queryClient.invalidateQueries({ queryKey: activityKeys.list(petId) });
      if (newActivity) {
        queryClient.invalidateQueries({ queryKey: activityKeys.detail(newActivity.id) });
      }
    },
  });

  // Action implementations
  const updateFilters = useCallback((newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      categories: [],
      searchQuery: '',
    });
  }, []);

  const deleteActivity = useCallback(
    async (activityId: number) => {
      await deleteMutation.mutateAsync(activityId);
    },
    [deleteMutation],
  );

  const duplicateActivity = useCallback(
    async (activityId: number) => {
      await duplicateMutation.mutateAsync(activityId);
    },
    [duplicateMutation],
  );

  return {
    // State
    activities,
    filteredActivities,
    isLoading,
    error: error?.message || null,
    filters,
    isDeleting: deleteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,

    // Actions
    updateFilters,
    clearFilters,
    deleteActivity,
    duplicateActivity,
  };
}
