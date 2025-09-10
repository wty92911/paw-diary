import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { ActivityRecord, ActivityFormData } from '../lib/types/activities';

export type Activity = ActivityRecord;

// Activity query keys factory for consistent cache management
export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (petId: number) => [...activityKeys.lists(), petId] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: number) => [...activityKeys.details(), id] as const,
  drafts: () => [...activityKeys.all, 'drafts'] as const,
  petDrafts: (petId: number) => [...activityKeys.drafts(), petId] as const,
} as const;

/**
 * Basic hook for fetching activities for a specific pet with optimized caching
 */
export function useActivities(petId: number) {
  return useQuery<Activity[]>({
    queryKey: activityKeys.list(petId),
    queryFn: async () => {
      const result = await invoke('get_activities_for_pet', { petId });
      return result as Activity[];
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    enabled: !!petId, // Only run when petId is provided
  });
}

/**
 * Hook for fetching a single activity with caching
 */
export function useActivity(activityId: number) {
  return useQuery<Activity>({
    queryKey: activityKeys.detail(activityId),
    queryFn: async () => {
      const result = await invoke('get_activity', { activityId });
      return result as Activity;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    enabled: !!activityId,
  });
}

/**
 * Mutation hook for creating activities with optimistic updates
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { petId: number; activityData: ActivityFormData }) => {
      const result = await invoke('create_activity', {
        petId: data.petId,
        activityData: data.activityData,
      });
      return result as Activity;
    },
    onMutate: async ({ petId, activityData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: activityKeys.list(petId) });

      // Snapshot previous value
      const previousActivities = queryClient.getQueryData<Activity[]>(activityKeys.list(petId));

      // Optimistically update with temporary activity
      if (previousActivities) {
        const tempActivity: Activity = {
          id: Date.now(), // Temporary ID
          pet_id: petId,
          category: activityData.category,
          subcategory: activityData.subcategory || '',
          title: 'Saving...', // Temporary title
          activity_date: new Date().toISOString(), // Temporary date
          activity_data: {
            templateId: activityData.templateId || 'default',
            blocks: activityData.blocks || {},
            mode: 'guided', // Default mode
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<Activity[]>(activityKeys.list(petId), [
          ...previousActivities,
          tempActivity,
        ]);
      }

      return { previousActivities };
    },
    onError: (_err, { petId }, context) => {
      // Rollback on error
      if (context?.previousActivities) {
        queryClient.setQueryData(activityKeys.list(petId), context.previousActivities);
      }
    },
    onSuccess: (newActivity, { petId }) => {
      // Update the cache with the real activity data
      queryClient.setQueryData<Activity[]>(activityKeys.list(petId), (old = []) => {
        // Remove temporary activity and add real one
        const filtered = old.filter(activity => activity.id !== Date.now());
        return [newActivity, ...filtered];
      });

      // Also update individual activity cache
      queryClient.setQueryData(activityKeys.detail(newActivity.id), newActivity);
    },
    onSettled: (newActivity, _error, { petId }) => {
      // Always invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: activityKeys.list(petId) });

      if (newActivity) {
        queryClient.invalidateQueries({ queryKey: activityKeys.detail(newActivity.id) });
      }
    },
  });
}

/**
 * Mutation hook for updating activities with optimistic updates
 */
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      activityId: number;
      petId: number;
      updates: Partial<ActivityFormData>;
    }) => {
      const result = await invoke('update_activity', {
        activityId: data.activityId,
        activityData: data.updates,
      });
      return result as Activity;
    },
    onMutate: async ({ activityId, petId, updates }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: activityKeys.list(petId) });
      await queryClient.cancelQueries({ queryKey: activityKeys.detail(activityId) });

      // Snapshot previous values
      const previousActivities = queryClient.getQueryData<Activity[]>(activityKeys.list(petId));
      const previousActivity = queryClient.getQueryData<Activity>(activityKeys.detail(activityId));

      // Optimistically update
      if (previousActivities) {
        queryClient.setQueryData<Activity[]>(
          activityKeys.list(petId),
          previousActivities.map(activity =>
            activity.id === activityId
              ? { ...activity, ...updates, updated_at: new Date().toISOString() }
              : activity,
          ),
        );
      }

      if (previousActivity) {
        queryClient.setQueryData<Activity>(activityKeys.detail(activityId), {
          ...previousActivity,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousActivities, previousActivity };
    },
    onError: (_err, { activityId, petId }, context) => {
      // Rollback on error
      if (context?.previousActivities) {
        queryClient.setQueryData(activityKeys.list(petId), context.previousActivities);
      }
      if (context?.previousActivity) {
        queryClient.setQueryData(activityKeys.detail(activityId), context.previousActivity);
      }
    },
    onSuccess: (updatedActivity, { petId }) => {
      // Update caches with server response
      queryClient.setQueryData<Activity[]>(activityKeys.list(petId), (old = []) =>
        old.map(activity => (activity.id === updatedActivity.id ? updatedActivity : activity)),
      );

      queryClient.setQueryData(activityKeys.detail(updatedActivity.id), updatedActivity);
    },
    onSettled: (_updatedActivity, _error, { activityId, petId }) => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: activityKeys.list(petId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(activityId) });
    },
  });
}

/**
 * Mutation hook for deleting activities with optimistic updates
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { activityId: number; petId: number }) => {
      await invoke('delete_activity', { activityId: data.activityId });
      return data.activityId;
    },
    onMutate: async ({ activityId, petId }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: activityKeys.list(petId) });

      // Snapshot previous value
      const previousActivities = queryClient.getQueryData<Activity[]>(activityKeys.list(petId));

      // Optimistically remove
      if (previousActivities) {
        queryClient.setQueryData<Activity[]>(
          activityKeys.list(petId),
          previousActivities.filter(activity => activity.id !== activityId),
        );
      }

      return { previousActivities };
    },
    onError: (_err, { activityId: _activityId, petId }, context) => {
      // Rollback on error
      if (context?.previousActivities) {
        queryClient.setQueryData(activityKeys.list(petId), context.previousActivities);
      }
    },
    onSuccess: (deletedId, { petId: _petId }) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: activityKeys.detail(deletedId) });
    },
    onSettled: (_deletedId, _error, { petId }) => {
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: activityKeys.list(petId) });
    },
  });
}
