import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { Activity, activityKeys } from './useActivities';
import { ActivityFilters } from '../components/activities/FilterBar';
import {
  getActivityTitle,
  getActivityDescription,
  getActivityDate,
} from '../lib/utils/activityUtils';

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
}

export interface ActivitiesListActions {
  // Filter management
  updateFilters: (filters: Partial<ActivityFilters>) => void;
  clearFilters: () => void;

  // Activity operations with optimistic updates
  deleteActivity: (activityId: number) => Promise<void>;
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
  console.log(`🎯 useActivitiesList called with petId: ${petId}, enabled: ${!!petId}`);

  const {
    data: activities = [],
    isLoading,
    error,
  } = useQuery<Activity[]>({
    queryKey: activityKeys.list(petId),
    queryFn: async () => {
      console.log(`🔍 [useActivitiesList] Fetching activities for pet ${petId} from backend...`);
      const result = await invoke('get_activities_for_pet', { petId });
      const activities = result as Activity[];
      console.log(
        `📊 [useActivitiesList] Backend returned ${activities.length} activities for pet ${petId}:`,
        activities,
      );
      return activities;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    enabled: !!petId,
  });

  console.log(`📋 [useActivitiesList] Query state:`, {
    petId,
    isLoading,
    isError: !!error,
    dataLength: activities.length,
    enabled: !!petId,
    error: error?.message,
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
          getActivityTitle(activity).toLowerCase().includes(query) ||
          activity.subcategory.toLowerCase().includes(query) ||
          getActivityDescription(activity).toLowerCase().includes(query),
      );
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(activity => {
        const activityDate = getActivityDate(activity);
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
      return getActivityDate(b).getTime() - getActivityDate(a).getTime();
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

  return {
    // State
    activities,
    filteredActivities,
    isLoading,
    error: error?.message || null,
    filters,
    isDeleting: deleteMutation.isPending,

    // Actions
    updateFilters,
    clearFilters,
    deleteActivity,
  };
}
