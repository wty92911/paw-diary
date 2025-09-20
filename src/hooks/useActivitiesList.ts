import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { Activity, activityKeys } from './useActivities';

export interface ActivitiesListState {
  // Data
  activities: Activity[];
  isLoading: boolean;
  error: string | null;

  // Loading states for operations
  isDeleting: boolean;
}

export interface ActivitiesListActions {
  // Activity operations with optimistic updates
  deleteActivity: (activityId: number) => Promise<void>;
}

/**
 * Hook for managing activities list page state and operations
 *
 * Features:
 * - Fetches activities for a specific pet
 * - Provides optimistic updates for mutations
 * - Handles loading and error states
 */
export function useActivitiesList(petId: number): ActivitiesListState & ActivitiesListActions {
  const queryClient = useQueryClient();

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
  const deleteActivity = useCallback(
    async (activityId: number) => {
      await deleteMutation.mutateAsync(activityId);
    },
    [deleteMutation],
  );

  return {
    // State
    activities,
    isLoading,
    error: error?.message || null,
    isDeleting: deleteMutation.isPending,

    // Actions
    deleteActivity,
  };
}
